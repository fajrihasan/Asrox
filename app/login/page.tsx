import { Suspense } from "react";
import { AuthForm } from "@/components/auth/auth-form";

export default function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  return (
    <Suspense fallback={<AuthForm mode="login" />}>
      <LoginForm searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginForm({
  searchParams,
}: Pick<PageProps<"/login">, "searchParams">) {
  const params = await searchParams;

  return (
    <AuthForm
      mode="login"
      initialError={
        params.error === "callback"
          ? "Tautan autentikasi tidak valid atau sudah kedaluwarsa. Coba masuk kembali."
          : undefined
      }
      initialSuccess={
        params.passwordUpdated === "1"
          ? "Kata sandi berhasil diperbarui. Silakan masuk."
          : undefined
      }
    />
  );
}
