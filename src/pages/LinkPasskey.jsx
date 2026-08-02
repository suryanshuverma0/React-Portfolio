import { useState } from "react";

import { Link, useParams, useNavigate } from "react-router-dom";

import { toast } from "react-toastify";

import { browserSupportsWebAuthn } from "@simplewebauthn/browser";

import { useAuth } from "../contexts/AuthContext";

import AuthLayout from "../components/auth/AuthLayout";

import AuthButton from "../components/auth/AuthButton";

function LinkPasskey() {
  const { token } = useParams();

  const { completePasskeyLink } = useAuth();

  const navigate = useNavigate();

  const [status, setStatus] = useState("idle");

  const supported = browserSupportsWebAuthn();

  const handleAddDevice = async () => {
    try {
      setStatus("loading");

      const loggedInUser = await completePasskeyLink(token);

      setStatus("done");

      toast.success("Passkey added — you're signed in on this device");
      navigate(loggedInUser?.role === "admin" ? "/dashboard" : "/account");
    } catch (error) {
      console.error(error);
      setStatus("idle");

      if (error?.name === "NotAllowedError") {
        return;
      }

      if (error.response?.status === 429) {
        const retryAfter = error.response.data?.retryAfter;

        toast.error(`Too many attempts. Try again in ${retryAfter} seconds.`);

        return;
      }

      toast.error(
        error.response?.data?.message ||
          "This link is invalid or has expired",
      );
    }
  };

  return (
    <AuthLayout
      title="Add this device"
      subtitle="
        Register this device as a
        passkey for your account.
      "
    >
      <div className="space-y-6">
        {!supported ? (
          <p className="text-body text-red-500">
            This browser doesn&apos;t support passkeys. Open this link on a
            device/browser that does.
          </p>
        ) : (
          <>
            <p className="text-body">
              This will let you sign in on this device next time using its
              fingerprint, face, or screen lock instead of a password.
            </p>

            <AuthButton onClick={handleAddDevice} loading={status === "loading"}>
              Add this device
            </AuthButton>
          </>
        )}

        <p className="text-center text-small text-muted">
          <Link to="/login" className="text-primary hover:opacity-70 transition-opacity">
            Back to login
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default LinkPasskey;
