// Route protection middleware — NextAuth v5
// Unauthenticated users attempting to access protected routes are redirected to /login.
//
// NOTE: Route group folders like (dashboard) are NOT part of the URL.
// The URL for app/(dashboard)/dashboard/page.tsx is /dashboard, not /(dashboard)/dashboard.
// All protected URL prefixes must be listed explicitly.

export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    "/dashboard(.*)",
    "/chatbot(.*)",
    "/courses(.*)",
    "/quiz(.*)",
    "/admin(.*)",
    "/journey(.*)",
    "/settings(.*)",
    "/games(.*)",
  ],
};
