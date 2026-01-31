import { cookies } from "next/headers";

const ADMIN_COOKIE = "admin_session";

export function isAuthenticated(): boolean {
  const cookieStore = cookies();
  const session = cookieStore.get(ADMIN_COOKIE);
  return session?.value === "authenticated";
}

export function setAdminSession(): void {
  cookies().set(ADMIN_COOKIE, "authenticated", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

export function clearAdminSession(): void {
  cookies().delete(ADMIN_COOKIE);
}
