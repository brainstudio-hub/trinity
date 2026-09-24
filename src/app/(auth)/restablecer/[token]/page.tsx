import type { Metadata } from "next";
import { ResetPasswordForm } from "@/components/auth/auth-forms";

export const metadata: Metadata = { title: "Nueva contraseña" };

export default function ResetPasswordPage({ params }: { params: { token: string } }) {
  return <ResetPasswordForm token={params.token} />;
}
