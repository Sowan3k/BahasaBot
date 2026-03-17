// NextAuth v5 — catch-all route handler
// Handles all /api/auth/* requests (signin, signout, session, csrf, etc.)

import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
