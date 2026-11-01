import { redirect } from "next/navigation";

// /admin abre o dashboard (Brain §6: /admin/dashboard).
export default function AdminHomePage() {
  redirect("/admin/dashboard");
}
