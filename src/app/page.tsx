import { redirect } from "next/navigation";

// "/" → the dashboard. Without a session, src/proxy.ts already sent the visitor to /login.
export default function Home() {
  redirect("/dashboard");
}
