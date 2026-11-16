import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

async function ConfirmEmail({
  searchParams,
}: Pick<PageProps<"/confirm-email">, "searchParams">) {
  const { email } = await searchParams;
  const emailAddress = Array.isArray(email) ? email[0] : email;
  return <AuthForm mode="confirm" emailAddress={emailAddress} />;
}

export default function ConfirmEmailPage({
  searchParams,
}: PageProps<"/confirm-email">) {
  return (
    <Suspense fallback={<AuthForm mode="confirm" />}>
      <ConfirmEmail searchParams={searchParams} />
    </Suspense>
  );
}
