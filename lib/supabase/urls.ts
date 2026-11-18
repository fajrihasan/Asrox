export function authCallbackUrl(nextPath: "/" | "/reset-password") {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!siteUrl) {
    throw new Error("Missing NEXT_PUBLIC_SITE_URL.");
  }

  const callbackUrl = new URL("/auth/callback", siteUrl);
  callbackUrl.searchParams.set("next", nextPath);
  return callbackUrl.toString();
}
