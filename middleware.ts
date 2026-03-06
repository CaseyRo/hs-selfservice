import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER;
  const pass = process.env.BASIC_AUTH_PASS;

  // Skip auth if env vars aren't set or if DISABLE_AUTH is set (for testing)
  if (!user || !pass || process.env.DISABLE_AUTH === "1") return NextResponse.next();

  const auth = req.headers.get("authorization");
  if (auth) {
    const expected = `Basic ${btoa(`${user}:${pass}`)}`;
    if (auth === expected) {
      return NextResponse.next();
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Restricted"' },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
