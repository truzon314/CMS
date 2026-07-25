import { NextResponse, type NextRequest } from "next/server";

const AUTH_PATHS = ["/login", "/forgot-password", "/reset-password"];

/**
 * UX-only guard (NAVIGATION_FLOW.md): just checks whether the refresh cookie
 * is present, to avoid a flash of protected content or a pointless render of
 * the login form when already signed in. The API re-checks everything for
 * real — this proxy is not the security boundary.
 */
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("refresh_token");
  const { pathname } = request.nextUrl;
  const isAuthPath = AUTH_PATHS.some((path) => pathname.startsWith(path));

  if (!hasSession && !isAuthPath) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (hasSession && isAuthPath) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
