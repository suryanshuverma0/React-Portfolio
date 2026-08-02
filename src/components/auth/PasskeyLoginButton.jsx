import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";

import AuthButton from "./AuthButton";

function PasskeyLoginButton({ onClick, loading = false }) {
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
  }, []);

  if (!supported) {
    return null;
  }

  return (
    <AuthButton
      type="button"
      onClick={onClick}
      loading={loading}
      className="bg-surface text-primary border border-border hover:opacity-80"
    >
      <KeyRound size={18} />
      Continue with Passkey
    </AuthButton>
  );
}

export default PasskeyLoginButton;
