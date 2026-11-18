"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { emailSchema, loginSchema, registerSchema, resetPasswordSchema } from "@/lib/validations/auth";
import { createClient } from "@/lib/supabase/server";
import { authCallbackUrl } from "@/lib/supabase/urls";
import {
  getSessionCookieOptions,
  REMEMBER_SESSION_COOKIE,
} from "@/lib/supabase/session";

export type AuthActionState = {
  error?: string;
  success?: string;
  email?: string;
};

function firstValidationError(error: { issues: { message: string }[] }) {
  return error.issues[0]?.message ?? "Data yang dimasukkan tidak valid.";
}

export async function loginAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstValidationError(parsed.error) };

  const rememberSession = formData.get("remember") === "on";
  const supabase = await createClient({ rememberSession });
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    return { error: "Email atau kata sandi salah, atau email belum dikonfirmasi." };
  }

  const cookieStore = await cookies();
  cookieStore.set(
    REMEMBER_SESSION_COOKIE,
    String(rememberSession),
    getSessionCookieOptions(rememberSession),
  );
  redirect("/");
}

export async function registerAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstValidationError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        username: parsed.data.username,
        full_name: parsed.data.fullName,
      },
      emailRedirectTo: authCallbackUrl("/"),
    },
  });

  if (error) {
    return {
      error: "Akun belum dapat dibuat. Periksa data, pastikan username belum dipakai, lalu coba lagi.",
    };
  }

  if (data.session) {
    const cookieStore = await cookies();
    cookieStore.set(
      REMEMBER_SESSION_COOKIE,
      "false",
      getSessionCookieOptions(false),
    );
    redirect("/");
  }
  redirect(`/confirm-email?email=${encodeURIComponent(parsed.data.email)}`);
}

export async function resendConfirmationAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstValidationError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.resend({
    type: "signup",
    email: parsed.data.email,
    options: { emailRedirectTo: authCallbackUrl("/") },
  });

  if (error) {
    return { error: "Email konfirmasi belum dapat dikirim. Coba lagi beberapa saat." };
  }

  return {
    success: "Jika akun tersebut memerlukan konfirmasi, email akan dikirim. Periksa juga folder spam.",
  };
}

export async function forgotPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = emailSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstValidationError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: authCallbackUrl("/reset-password"),
  });

  if (error) {
    return { error: "Tautan pemulihan belum dapat dikirim. Coba lagi beberapa saat." };
  }

  return {
    success: "Jika email terdaftar, tautan pemulihan akan dikirim. Periksa juga folder spam.",
  };
}

export async function resetPasswordAction(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: firstValidationError(parsed.error) };

  const supabase = await createClient();
  const { data, error: sessionError } = await supabase.auth.getUser();

  if (sessionError || !data.user) {
    return { error: "Tautan pemulihan tidak valid atau sudah kedaluwarsa. Minta tautan baru." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: "Kata sandi belum dapat diperbarui. Coba lagi." };

  redirect("/login?passwordUpdated=1");
}

export async function logoutAction(): Promise<AuthActionState> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();

  if (error) return { error: "Gagal keluar dari akun. Coba lagi." };

  const cookieStore = await cookies();
  cookieStore.delete(REMEMBER_SESSION_COOKIE);
  redirect("/login");
}
