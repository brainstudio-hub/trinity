import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Ingresar" };

export default function LoginPage({ searchParams }: { searchParams: { callbackUrl?: string } }) {
  return <LoginForm callbackUrl={searchParams.callbackUrl} />;
}
