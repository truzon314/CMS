import { NextResponse } from "next/server";

/**
 * Authentication is enforced by the backend API.
 *
 * The refresh_token cookie belongs to the backend origin, while this CMS
 * frontend runs on a different Cloud Run origin. Therefore this proxy cannot
 * reliably inspect the backend's refresh cookie.
 *
 * The client-side session bootstrap handles restoring the session through
 * /api/v1/auth/refresh, and protected API requests are authenticated by the
 * backend.
 */
export function proxy() {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

