import { useState } from "react";
import { Fingerprint } from "lucide-react";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";

import AuthButton from "./AuthButton";

function PasskeyLoginButton({ onClick, loading = false, label = "Continue with Passkey" }) {
  const [supported] = useState(() => browserSupportsWebAuthn());

  if (!supported) {
    return null;
  }

  return (
    <AuthButton
      type="button"
      onClick={onClick}
      loading={loading}
      className="border border-border bg-surface! text-primary! shadow-none! hover:border-primary"
    >
      <Fingerprint size={19} />
      {label}
    </AuthButton>
  );
}

export default PasskeyLoginButton;
