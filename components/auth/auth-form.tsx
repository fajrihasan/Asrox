"use client";

import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, KeyRound, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { BrandMark } from "@/components/brand-mark";

type AuthMode = "login" | "register" | "forgot" | "confirm";

export function AuthForm({ mode, emailAddress }: { mode: AuthMode; emailAddress?: string }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (mode === "register" && password !== confirmPassword) {
      setLoading(false);
      setError("Kata sandi tidak cocok. Periksa kembali lalu coba lagi.");
      return;
    }

    window.setTimeout(() => {
      setLoading(false);
      if (mode === "login") router.push("/");
      if (mode === "register") {
        const address = String(formData.get("email") ?? "");
        router.push(`/confirm-email?email=${encodeURIComponent(address)}`);
      }
      if (mode === "forgot") setSuccess("Tautan pemulihan dikirim ke email-mu.");
    }, 450);
  }

  const headings: Record<AuthMode, { title: string; copy: string }> = {
    login: { title: "Senang bertemu lagi.", copy: "Masuk dan lanjutkan percakapanmu." },
    register: { title: "Buat ruang untukmu.", copy: "Bergabunglah dengan Koneksi dan tetap dekat dengan orang-orangmu." },
    forgot: { title: "Lupa kata sandi?", copy: "Tidak masalah. Kami akan mengirim tautan pemulihan ke email-mu." },
    confirm: { title: "Periksa email-mu.", copy: "Kami mengirim email konfirmasi untuk menyelesaikan pendaftaran." },
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
              {success && <div className="auth-success"><Check size={15} />{success}</div>}
              <button className="primary-button auth-submit" onClick={() => setSuccess("Email konfirmasi dikirim ulang.")}>Kirim ulang email <ArrowRight size={17} /></button>
              <Link className="auth-back-link" href="/login"><ArrowLeft size={15} /> Kembali ke halaman masuk</Link>
              <span className="confirmation-hint">Tidak menemukan email-nya? Periksa folder spam.</span>
            </div>
          ) : (
            <>
              <span className="eyebrow">{mode === "login" ? "Orang-orangmu menunggu" : mode === "register" ? "Tetap dekat, lebih mudah" : "Langkah pertama keamanan akun"}</span>
              <h1>{heading.title}</h1>
              <p className="auth-intro">{heading.copy}</p>
              <form className="auth-form" onSubmit={submit}>
                {mode === "register" && <label>Username<input name="username" placeholder="Contoh: anisa.m" required minLength={3} autoComplete="username" /></label>}
                <label>{mode === "login" ? "Email atau username" : "Email"}<input name="email" type={mode === "login" ? "text" : "email"} placeholder={mode === "login" ? "email atau username" : "nama@contoh.com"} required autoComplete={mode === "login" ? "username" : "email"} /></label>
                {(mode === "login" || mode === "register") && (
                  <label>
                    <span className="label-row">Kata sandi{mode === "login" && <Link href="/forgot-password">Lupa kata sandi?</Link>}</span>
                    <span className="password-field"><input name="password" type={showPassword ? "text" : "password"} placeholder="Minimal 8 karakter" required minLength={8} autoComplete={mode === "login" ? "current-password" : "new-password"} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span>
                  </label>
                )}
                {mode === "register" && <label>Konfirmasi kata sandi<input name="confirmPassword" type={showPassword ? "text" : "password"} placeholder="Ketik ulang kata sandi" required minLength={8} autoComplete="new-password" /></label>}
                {mode === "login" && <label className="remember-option"><input type="checkbox" name="remember" /> Ingat saya di perangkat ini</label>}
                {error && <div className="auth-error" role="alert">{error}</div>}
                {success && <div className="auth-success" role="status"><Check size={15} />{success}</div>}
                <button className="primary-button auth-submit" type="submit" disabled={loading}>{loading ? <span className="loading-spinner" /> : mode === "login" ? "Masuk" : mode === "register" ? "Buat akun" : "Kirim tautan"}<ArrowRight size={17} /></button>
              </form>
              {mode === "login" ? <p className="auth-switch">Belum punya akun? <Link href="/register">Daftar</Link></p> : mode === "register" ? <p className="auth-switch">Sudah punya akun? <Link href="/login">Masuk</Link></p> : <Link className="auth-back-link" href="/login"><ArrowLeft size={15} /> Kembali ke halaman masuk</Link>}
              {(mode === "login" || mode === "register") && <p className="auth-demo-note">Mode prototipe · autentikasi disimulasikan</p>}
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
