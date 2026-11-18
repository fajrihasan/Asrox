import { Suspense } from "react";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/auth/auth-form";
import { createClient } from "@/lib/supabase/server";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="auth-page">Memuat sesi...</main>}>
      <ResetPasswordForm />
    </Suspense>
  );
}

async function ResetPasswordForm() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error && error.name !== "AuthSessionMissingError") throw error;
  if (!user) redirect("/login");

  return <AuthForm mode="reset" />;
}
