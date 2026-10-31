import { type NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Só o painel precisa de sessão; o site público não passa pelo proxy.
export const config = {
  matcher: ["/admin/:path*"],
};
