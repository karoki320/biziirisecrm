import { signOut } from "@/app/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="text-sm font-medium text-muted transition-colors hover:text-ink"
      >
        Sign out
      </button>
    </form>
  );
}
