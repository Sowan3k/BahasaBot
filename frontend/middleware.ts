// Route protection middleware — NextAuth v5
// Unauthenticated users attempting to access protected routes are redirected to /login.

export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: [
    // Protect all dashboard, chatbot, courses, and quiz routes
    "/(dashboard)/:path*",
    "/chatbot/:path*",
    "/courses/:path*",
    "/quiz/:path*",
  ],
};
