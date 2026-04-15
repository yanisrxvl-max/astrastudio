import { redirect } from "next/navigation";

/** L’inscription publique est désactivée — comptes créés par l’admin uniquement. */
export default function SignupPage() {
  redirect("/login?reason=invite-only");
}
