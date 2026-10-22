import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/authz/session";

/** Signed-in users skip the auth screens (as in Gintong Araw). Render inside <Suspense>. */
export async function RedirectIfSignedIn() {
  const user = await getCurrentUser();
  if (user?.status === "ACTIVE") redirect("/dashboard");
  if (user?.status === "PENDING") redirect("/pending");
  return null;
}
