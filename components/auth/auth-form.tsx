"use client";

import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { useActionState, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import {
  forgotPasswordAction,
  loginAction,
  registerAction,
  resendConfirmationAction,
  resetPasswordAction,
  type AuthActionState,
} from "@/app/actions/auth";

type AuthMode = "login" | "register" | "forgot" | "confirm" | "reset";

const emptyState: AuthActionState = {};

export function AuthForm({
  mode,
  emailAddress,
  initialError,
  initialSuccess,
}: {
  mode: AuthMode;
  emailAddress?: string;
  initialError?: string;
  initialSuccess?: string;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const action =
    mode === "login"
      ? loginAction
      : mode === "register"
        ? registerAction
        : mode === "reset"
          ? resetPasswordAction
          : forgotPasswordAction;
  const [state, formAction, pending] = useActionState(action, {
    ...emptyState,
    error: initialError,
    success: initialSuccess,
  });
  const [resendState, resendAction, resending] = useActionState(
    resendConfirmationAction,
    emptyState,
  );

  const headings: Record<AuthMode, { title: string; copy: string }> = {
    login: { title: "Senang bertemu lagi.", copy: "Masuk dan lanjutkan percakapanmu." },
    register: { title: "Buat ruang untukmu.", copy: "Bergabunglah dengan Koneksi dan tetap dekat dengan orang-orangmu." },
    forgot: { title: "Lupa kata sandi?", copy: "Tidak masalah. Kami akan mengirim tautan pemulihan ke email-mu." },
    confirm: { title: "Periksa email-mu.", copy: "Kami mengirim email konfirmasi untuk menyelesaikan pendaftaran." },
    reset: { title: "Buat kata sandi baru.", copy: "Pilih kata sandi baru untuk mengamankan akunmu." },
  };
  const heading = headings[mode];

  return (
    <main className="auth-page">
      <div className="auth-ambient auth-ambient-one" /><div className="auth-ambient auth-ambient-two" />
      <div className="auth-shell">
        <Link href="/" className="auth-brand"><BrandMark /></Link>
        <div className="auth-card">
          {mode === "confirm" ? (
            <div className="confirmation-view">
              <span className="confirmation-illustration"><Mail size={31} /><span><Check size={17} /></span></span>
              <span className="eyebrow">Satu langkah lagi</span>
              <h1>{heading.title}</h1>
              <p>{heading.copy}</p>
              <div className="confirmation-email">{emailAddress || "alamat email yang kamu daftarkan"}</div>
              {resendState.error && <div className="auth-error" role="alert">{resendState.error}</div>}
              {resendState.success && <div className="auth-success" role="status"><Check size={15} />{resendState.success}</div>}
              <form action={resendAction}>
                <input type="hidden" name="email" value={emailAddress ?? ""} />
                <button className="primary-button auth-submit" type="submit" disabled={resending}>
                  {resending ? <span className="loading-spinner" /> : "Kirim ulang email"} <ArrowRight size={17} />
                </button>
              </form>
              <Link className="auth-back-link" href="/login"><ArrowLeft size={15} /> Kembali ke halaman masuk</Link>
              <span className="confirmation-hint">Tidak menemukan email-nya? Periksa folder spam.</span>
            </div>
          ) : (
            <>
              <span className="eyebrow">{mode === "login" ? "Orang-orangmu menunggu" : mode === "register" ? "Tetap dekat, lebih mudah" : "Langkah pertama keamanan akun"}</span>
              <h1>{heading.title}</h1>
              <p className="auth-intro">{heading.copy}</p>
              <form className="auth-form" action={formAction}>
                {mode === "register" && (
                  <>
                    <label>Nama tampilan<input name="fullName" placeholder="Nama yang ingin ditampilkan" required minLength={2} maxLength={80} autoComplete="name" /></label>
                    <label>Username<input name="username" placeholder="Contoh: anisa_m" required minLength={3} maxLength={24} pattern="[a-z0-9_]+" autoComplete="username" /></label>
                  </>
                )}
                {mode !== "reset" && <label>Email<input name="email" type="email" placeholder="nama@contoh.com" required autoComplete="email" /></label>}
                {(mode === "login" || mode === "register" || mode === "reset") && (
                  <label>
                    <span className="label-row">Kata sandi{mode === "login" && <Link href="/forgot-password">Lupa kata sandi?</Link>}</span>
                    <span className="password-field"><input name="password" type={showPassword ? "text" : "password"} placeholder="Minimal 8 karakter" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>
                  </label>
                )}
                {(mode === "register" || mode === "reset") && <label>Konfirmasi kata sandi<input name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Ketik ulang kata sandi" required minLength={8} autoComplete="new-password" /></label>}
                {mode === "login" && <label className="remember-option"><input type="checkbox" name="remember" /> Ingat saya di perangkat ini</label>}
                {state.error && <div className="auth-error" role="alert">{state.error}</div>}
                {state.success && <div className="auth-success" role="status"><Check size={15} />{state.success}</div>}
                <button className="primary-button auth-submit" type="submit" disabled={pending}>
                  {pending ? <span className="loading-spinner" /> : mode === "login" ? "Masuk" : mode === "register" ? "Buat akun" : mode === "reset" ? "Simpan kata sandi" : "Kirim tautan"}
                  <ArrowRight size={17} />
                </button>
              </form>
              {mode === "login" ? <p className="auth-switch">Belum punya akun? <Link href="/register">Daftar</Link></p> : mode === "register" ? <p className="auth-switch">Sudah punya akun? <Link href="/login">Masuk</Link></p> : <Link className="auth-back-link" href="/login"><ArrowLeft size={15} /> Kembali ke halaman masuk</Link>}
              {(mode === "login" || mode === "register") && <p className="auth-demo-note">Autentikasi aman oleh Supabase</p>}
            </>
          )}
        </div>
        <div className="auth-footer"><span><KeyRound size={13} /> Percakapanmu, dalam kendalimu</span><span>© 2026 Koneksi</span></div>
      </div>
      <aside className="auth-side-note">
        <div className="auth-side-orbit"><span className="side-chat side-chat-one">Hai 👋</span><span className="side-chat side-chat-two">Senang bertemu lagi ✨</span><span className="side-chat-icon"><Mail size={30} /></span></div>
        <h2>Kedekatan tak<br />mengenal jarak.</h2><p>Di Koneksi, orang-orang penting selalu dekat.</p>
      </aside>
    </main>
  );
}
