import asyncio
import logging
import smtplib
from email.message import EmailMessage

from app.domain.repositories.settings_repository import SettingsRepository
from app.schemas.settings import KNOWN_SETTING_KEYS

logger = logging.getLogger("truzon_cms.mailer")


class MailerService:
    """Closes the loop on Phase 1's stubbed email sending (ROADMAP.md Phase 5)
    — reads SMTP config from the `Setting` table (not `.env`, since it's meant
    to be editable through the CMS's own Settings screen) and sends for real
    when configured; falls back to the original console-log behavior when it
    isn't, so dev environments without SMTP still work unchanged."""

    def __init__(self, settings: SettingsRepository):
        self.settings = settings

    async def send_email(self, to: str, subject: str, body: str) -> None:
        rows = await self.settings.get_all()
        values = {row.key: row.value for row in rows if row.key in KNOWN_SETTING_KEYS}
        host = values.get("smtp_host")

        if not host:
            logger.info("[dev email] to=%s subject=%r body=%r", to, subject, body)
            return

        from_email = values.get("smtp_from_email") or values.get("smtp_username") or "no-reply@truzonhomes.com"
        try:
            await asyncio.to_thread(
                self._send_sync,
                host,
                int(values.get("smtp_port") or 587),
                values.get("smtp_username"),
                values.get("smtp_password"),
                from_email,
                bool(values.get("smtp_use_tls", True)),
                to,
                subject,
                body,
            )
        except (OSError, smtplib.SMTPException):
            # A misconfigured/unreachable SMTP server must never surface as a
            # 500 to the caller — that would both break flows like
            # forgot-password (whose "always returns normally" contract
            # doubles as anti user-enumeration) and take down an otherwise
            # unrelated request over a delivery problem. Log loudly instead.
            logger.exception("Failed to send email to=%s subject=%r via smtp_host=%s", to, subject, host)

    @staticmethod
    def _send_sync(
        host: str,
        port: int,
        username: str | None,
        password: str | None,
        from_email: str,
        use_tls: bool,
        to: str,
        subject: str,
        body: str,
    ) -> None:
        message = EmailMessage()
        message["From"] = from_email
        message["To"] = to
        message["Subject"] = subject
        message.set_content(body)

        with smtplib.SMTP(host, port, timeout=10) as server:
            if use_tls:
                server.starttls()
            if username and password:
                server.login(username, password)
            server.send_message(message)
