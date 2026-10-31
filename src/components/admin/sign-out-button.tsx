import { signOutAction } from "@/services/auth/actions";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded-control border border-border px-4 py-2 text-caption font-medium"
      >
        Sair
      </button>
    </form>
  );
}
