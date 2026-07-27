import { useEffect } from "react";

import { Link, useNavigate } from "react-router-dom";

import { toast } from "react-toastify";

import { useAuth } from "../contexts/AuthContext";

import AuthLayout from "../components/auth/AuthLayout";

import AuthButton from "../components/auth/AuthButton";

function UserAccess() {
  const { user, authLoading, logout } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      navigate("/login", { replace: true });

      return;
    }

    if (user.role === "admin") {
      navigate("/dashboard", { replace: true });
    }
  }, [user, authLoading, navigate]);

  const handleLogout = async () => {
    await logout();

    toast.success("Logged out");

    navigate("/");
  };

  if (authLoading || !user || user.role === "admin") {
    return null;
  }

  return (
    <AuthLayout
      title="You're signed in"
      subtitle="
        Here's what your account
        can currently do.
      "
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <span className="text-small text-muted">Signed in as</span>

            <span className="text-label truncate">{user.email}</span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-small text-muted">Account type</span>

            <span className="px-2 py-1 rounded-full text-xs bg-surface border border-border">
              {user.role}
            </span>
          </div>
        </div>

        <p className="text-small">
          This account doesn&apos;t have administrator access &mdash; the
          dashboard is reserved for the site owner. If you believe this is a
          mistake, reach out to the site owner directly.
        </p>

        <div className="space-y-3">
          <Link to="/">
            <AuthButton>Back to Portfolio</AuthButton>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="
              w-full

              text-center

              text-small

              text-muted

              hover:text-primary

              transition-colors
            "
          >
            Log out
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

export default UserAccess;
