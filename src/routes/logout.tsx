import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { logoutUser } from "~/lib/auth";

export const Route = createFileRoute("/logout")({
  component: LogoutPage,
});

function LogoutPage() {
  const navigate = useNavigate();

  useEffect(() => {
    logoutUser().then(() => {
      navigate({ to: "/" });
    });
  }, [navigate]);

  return (
    <div className="min-h-dvh flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-600">Logging you out...</p>
      </div>
    </div>
  );
}
