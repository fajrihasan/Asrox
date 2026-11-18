export const REMEMBER_SESSION_COOKIE = "koneksi-remember-session";
export const REMEMBER_SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export function getSessionCookieOptions(rememberSession: boolean) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(rememberSession ? { maxAge: REMEMBER_SESSION_MAX_AGE } : {}),
  };
}
