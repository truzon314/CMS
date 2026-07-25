"""Real external SEO data sources — deliberately the opposite of the earlier
hardcoded-numbers version. Every method either returns real data pulled live
from the named third-party API, or `{"configured": False}` when the required
credential isn't set in Settings yet. Never fabricates numbers as a fallback.
"""

import json
import time
import urllib.parse
from datetime import date, timedelta
from typing import Any

import httpx
from jose import jwt as jose_jwt

from app.domain.repositories.settings_repository import SettingsRepository
from app.schemas.settings import KNOWN_SETTING_KEYS

GOOGLE_SUGGEST_URL = "https://suggestqueries.google.com/complete/search"
PAGESPEED_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GSC_SCOPE = "https://www.googleapis.com/auth/webmasters.readonly"
AHREFS_BACKLINKS_URL = "https://api.ahrefs.com/v3/site-explorer/backlinks"
AHREFS_METRICS_URL = "https://api.ahrefs.com/v3/site-explorer/metrics"


class SeoIntegrationsService:
    def __init__(self, settings: SettingsRepository):
        self.settings = settings

    async def _get_settings_map(self) -> dict[str, Any]:
        rows = await self.settings.get_all()
        return {row.key: row.value for row in rows if row.key in KNOWN_SETTING_KEYS}

    async def autocomplete(self, query: str) -> list[str]:
        """Real Google Autocomplete suggestions. Uses the public `suggestqueries`
        endpoint that browsers themselves call — free, no API key, but unofficial
        and undocumented, so treat it as best-effort rather than an SLA'd API."""
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(GOOGLE_SUGGEST_URL, params={"client": "firefox", "q": query})
            resp.raise_for_status()
            data = resp.json()
        return data[1] if len(data) > 1 else []

    async def pagespeed(self, url: str) -> dict:
        """Real Google PageSpeed Insights (Lighthouse) run. Needs
        `google_pagespeed_api_key` in Settings — see SeoSettingsForm for setup."""
        values = await self._get_settings_map()
        api_key = values.get("google_pagespeed_api_key")
        if not api_key:
            return {"configured": False}

        categories = ["PERFORMANCE", "ACCESSIBILITY", "BEST_PRACTICES", "SEO"]
        params = [("url", url), ("key", api_key)] + [("category", c) for c in categories]
        async with httpx.AsyncClient(timeout=45) as client:
            resp = await client.get(PAGESPEED_URL, params=params)
            resp.raise_for_status()
            data = resp.json()

        lighthouse = data.get("lighthouseResult", {})
        cats = lighthouse.get("categories", {})
        audits = lighthouse.get("audits", {})

        def score(cat_key: str) -> int | None:
            cat = cats.get(cat_key)
            return round(cat["score"] * 100) if cat and cat.get("score") is not None else None

        def metric(audit_key: str) -> dict | None:
            audit = audits.get(audit_key)
            return {"value": audit.get("displayValue"), "score": audit.get("score")} if audit else None

        failing_diagnostics = [
            {"id": key, "title": audit.get("title"), "score": audit.get("score")}
            for key, audit in audits.items()
            if audit.get("score") is not None
            and audit.get("score") < 1
            and audit.get("scoreDisplayMode") == "binary"
        ]

        return {
            "configured": True,
            "url": url,
            "scores": {
                "performance": score("performance"),
                "accessibility": score("accessibility"),
                "best_practices": score("best-practices"),
                "seo": score("seo"),
            },
            "metrics": {
                "largest_contentful_paint": metric("largest-contentful-paint"),
                "first_contentful_paint": metric("first-contentful-paint"),
                "cumulative_layout_shift": metric("cumulative-layout-shift"),
                "total_blocking_time": metric("total-blocking-time"),
                "speed_index": metric("speed-index"),
            },
            "diagnostics": failing_diagnostics[:10],
        }

    async def search_console_rankings(self) -> dict:
        """Real Google Search Console query-performance data via a service-account
        JWT grant (no google-api-python-client dependency needed — python-jose
        already signs RS256). Needs `google_gsc_service_account_json` (the full
        downloaded key file, pasted as-is) and `google_gsc_site_url` (the exact
        property string as it appears in Search Console, e.g. `sc-domain:truzonhomes.com`
        or `https://www.truzonhomes.com/`) in Settings, and that service account's
        email must be added as a user on the property in Search Console."""
        values = await self._get_settings_map()
        raw_creds = values.get("google_gsc_service_account_json")
        site_url = values.get("google_gsc_site_url")
        if not raw_creds or not site_url:
            return {"configured": False}

        creds = json.loads(raw_creds) if isinstance(raw_creds, str) else raw_creds
        now = int(time.time())
        assertion = jose_jwt.encode(
            {
                "iss": creds["client_email"],
                "scope": GSC_SCOPE,
                "aud": GOOGLE_TOKEN_URL,
                "iat": now,
                "exp": now + 3600,
            },
            creds["private_key"],
            algorithm="RS256",
        )

        end_date = date.today() - timedelta(days=3)
        start_date = end_date - timedelta(days=28)
        encoded_site = urllib.parse.quote(site_url, safe="")

        async with httpx.AsyncClient(timeout=20) as client:
            token_resp = await client.post(
                GOOGLE_TOKEN_URL,
                data={
                    "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
                    "assertion": assertion,
                },
            )
            token_resp.raise_for_status()
            access_token = token_resp.json()["access_token"]

            query_resp = await client.post(
                f"https://searchconsole.googleapis.com/webmasters/v3/sites/{encoded_site}/searchAnalytics/query",
                headers={"Authorization": f"Bearer {access_token}"},
                json={
                    "startDate": start_date.isoformat(),
                    "endDate": end_date.isoformat(),
                    "dimensions": ["query"],
                    "rowLimit": 25,
                },
            )
            query_resp.raise_for_status()
            data = query_resp.json()

        rows = data.get("rows", [])
        return {
            "configured": True,
            "date_range": {"start": start_date.isoformat(), "end": end_date.isoformat()},
            "rows": [
                {
                    "keyword": r["keys"][0],
                    "clicks": r.get("clicks", 0),
                    "impressions": r.get("impressions", 0),
                    "ctr_percent": round(r.get("ctr", 0) * 100, 2),
                    "avg_position": round(r.get("position", 0), 1),
                }
                for r in rows
            ],
        }

    async def ahrefs_backlinks(self, target: str) -> dict:
        """Real Ahrefs Site Explorer data. Needs `ahrefs_api_key` in Settings.

        NOTE: Ahrefs' v3 API surface is paid/enterprise and not publicly
        documented in a way that can be verified without a live key — the
        endpoint paths and param names below are Ahrefs' documented v3 shape
        as of this writing, but if your plan/API version differs, the `raw`
        field below still returns exactly what Ahrefs sent back so nothing is
        silently faked. Adjust the field mapping once you can see a real
        response."""
        values = await self._get_settings_map()
        api_key = values.get("ahrefs_api_key")
        if not api_key:
            return {"configured": False}

        headers = {"Authorization": f"Bearer {api_key}", "Accept": "application/json"}
        async with httpx.AsyncClient(timeout=30) as client:
            metrics_resp = await client.get(
                AHREFS_METRICS_URL, params={"target": target, "mode": "domain"}, headers=headers
            )
            backlinks_resp = await client.get(
                AHREFS_BACKLINKS_URL, params={"target": target, "mode": "domain", "limit": 50}, headers=headers
            )

        metrics_ok = metrics_resp.status_code < 400
        backlinks_ok = backlinks_resp.status_code < 400

        return {
            "configured": True,
            "target": target,
            "metrics": metrics_resp.json() if metrics_ok else {"error": metrics_resp.text},
            "backlinks": backlinks_resp.json() if backlinks_ok else {"error": backlinks_resp.text},
        }
