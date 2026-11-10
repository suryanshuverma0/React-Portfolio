import { Link } from "react-router-dom";
import MfaStep from "../components/auth/MfaStep";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "react-toastify";

import { loginSchema } from "../validations/authValidation";

import { useAuth } from "../contexts/AuthContext";

import AuthLayout from "../components/auth/AuthLayout";

import AuthInput from "../components/auth/AuthInput";

import PasswordInput from "../components/auth/PasswordInput";

import AuthButton from "../components/auth/AuthButton";

import GoogleAuthButton from "../components/auth/GoogleAuthButton";

import PasskeyLoginButton from "../components/auth/PasskeyLoginButton";

import AuthDivider from "../components/auth/AuthDivider";

import { useState } from "react";
import { ArrowRight, MailCheck, MonitorSmartphone, Send } from "lucide-react";

import { useNavigate } from "react-router-dom";

function Login() {
  /* ========================================
     AUTH
  ========================================= */

  const { login, loginWithGoogle, loginWithPasskey, requestPasskeyLink } = useAuth();

  const navigate = useNavigate();

  const [passkeyLoading, setPasskeyLoading] = useState(false);

  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkEmail, setLinkEmail] = useState("");
  const [linkSending, setLinkSending] = useState(false);
  const [linkSent, setLinkSent] = useState(false);

  /* ========================================
     FORM
  ========================================= */

  const {
    register,

    handleSubmit,

    formState: {
      errors,

      isSubmitting,
    },
  } = useForm({
    resolver: zodResolver(loginSchema),

    defaultValues: {
      email: "",

      password: "",
    },
  });

  // Set when the account has two-factor sign-in on (second step).
  const [mfaChallenge, setMfaChallenge] = useState(null);

  /* ========================================
     SUBMIT
  ========================================= */

  const onSubmit = async (data) => {
    try {
      const loggedInUser = await login(data);

      if (loggedInUser?.mfaRequired) {
        setMfaChallenge(loggedInUser.challenge);
        return;
      }

      toast.success("Logged in successfully");
      navigate(loggedInUser?.role === "admin" ? "/dashboard" : "/account");
    } catch (error) {
      console.error(error);

      if (error.response?.status === 429) {
        const retryAfter = error.response.data.retryAfter;

        toast.error(
          `Too many login attempts. Try again in ${retryAfter} seconds.`,
        );

        return;
      }

      if (error.response?.status === 403) {
        toast.error(
          error.response.data?.message || "Password login is currently disabled",
        );

        return;
      }

      if (error.response?.status === 400) {
        const firstError = error.response.data?.errors?.[0]?.message;

        toast.error(
          firstError || error.response.data?.message || "Please check your input",
        );

        return;
      }

      toast.error(error.response?.data?.message || "Invalid email or password");
    }
  };

  /* ========================================
     GOOGLE LOGIN
  ========================================= */

  const handleGoogleSuccess = async (credential) => {
    try {
      const loggedInUser = await loginWithGoogle(credential);

      if (loggedInUser?.mfaRequired) {
        setMfaChallenge(loggedInUser.challenge);
        return;
      }

      toast.success("Logged in successfully");
      navigate(loggedInUser?.role === "admin" ? "/dashboard" : "/account");
    } catch (error) {
      console.error(error);

      if (error.response?.status === 429) {
        const retryAfter = error.response.data.retryAfter;

        toast.error(
          `Too many login attempts. Try again in ${retryAfter} seconds.`,
        );

        return;
      }

      toast.error(error.response?.data?.message || "Google sign-in failed");
    }
  };

  const handleGoogleError = () => {
    toast.error("Google sign-in failed");
  };

  /* ========================================
     PASSKEY LOGIN
  ========================================= */

  const handlePasskeyLogin = async () => {
    try {
      setPasskeyLoading(true);

      const loggedInUser = await loginWithPasskey();

      toast.success("Logged in successfully");
      navigate(loggedInUser?.role === "admin" ? "/dashboard" : "/account");
    } catch (error) {
      console.error(error);

      // The user closing the browser's passkey prompt lands here too —
      // not a real failure, so no toast for that case.
      if (error?.name === "NotAllowedError") {
        return;
      }

      if (error.response?.status === 429) {
        const retryAfter = error.response.data.retryAfter;

        toast.error(
          `Too many attempts. Try again in ${retryAfter} seconds.`,
        );

        return;
      }

      if (error.response?.status === 403) {
        toast.error(
          error.response.data?.message || "Passkey login is currently disabled",
        );

        return;
      }

      toast.error(error.response?.data?.message || "Passkey sign-in failed");
    } finally {
      setPasskeyLoading(false);
    }
  };

  /* ========================================
     LINK THIS DEVICE (existing account, no
     session here — email a one-time link)
  ========================================= */

  const handleSendLink = async () => {
    if (!linkEmail.trim()) {
      toast.error("Enter your email first");

      return;
    }

    try {
      setLinkSending(true);

      await requestPasskeyLink(linkEmail.trim());

      setLinkSent(true);
    } catch (error) {
      console.error(error);

      if (error.response?.status === 429) {
        const retryAfter = error.response.data?.retryAfter;

        toast.error(`Too many attempts. Try again in ${retryAfter} seconds.`);

        return;
      }

      toast.error(error.response?.data?.message || "Failed to send link");
    } finally {
      setLinkSending(false);
    }
  };

  return (
    <>
      {mfaChallenge && (
        <MfaStep
          challenge={mfaChallenge}
          onCancel={() => setMfaChallenge(null)}
          onDone={(u) => {
            setMfaChallenge(null);
            toast.success("Logged in successfully");
            navigate(u?.role === "admin" ? "/dashboard" : "/account");
          }}
        />
      )}

    <AuthLayout mode="login" title="Welcome back" subtitle="Sign in to your account — the fastest way is your fingerprint.">
      <div className="space-y-6">
        {/* ONE-TAP OPTIONS */}
        <div className="space-y-3">
          <PasskeyLoginButton onClick={handlePasskeyLogin} loading={passkeyLoading} label="Sign in with a passkey" />
          <GoogleAuthButton text="continue_with" onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        </div>

        <AuthDivider text="or with email" />

        {/* EMAIL + PASSWORD */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <AuthInput label="Email" type="email" placeholder="you@example.com" autoComplete="username email" error={errors.email?.message} required {...register("email")} />
          <div className="space-y-2">
            <PasswordInput label="Password" placeholder="Your password" autoComplete="current-password" error={errors.password?.message} required {...register("password")} />
            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-[13px] text-muted transition-colors hover:text-primary">
                Forgot password?
              </Link>
            </div>
          </div>
          <AuthButton loading={isSubmitting}>
            Sign in <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
          </AuthButton>
        </form>

        {/* LINK EXISTING ACCOUNT TO THIS DEVICE */}
        <div className="rounded-2xl border border-dashed border-border p-4">
          {linkSent ? (
            <p className="flex items-start gap-2.5 text-small text-secondary">
              <MailCheck size={18} className="mt-0.5 shrink-0 text-emerald-500" />
              If an account exists for {linkEmail}, a link to add this device is on its way.
            </p>
          ) : showLinkForm ? (
            <div className="space-y-3">
              <AuthInput label="Email on your account" type="email" name="link-email" placeholder="you@example.com" value={linkEmail} onChange={(e) => setLinkEmail(e.target.value)} autoFocus />
              <AuthButton type="button" onClick={handleSendLink} loading={linkSending} className="border border-border bg-surface! text-primary! shadow-none! hover:border-primary">
                <Send size={16} /> Email me a link
              </AuthButton>
            </div>
          ) : (
            <button type="button" onClick={() => setShowLinkForm(true)} className="flex w-full items-center gap-3 text-left">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface">
                <MonitorSmartphone size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-small font-medium">New device?</span>
                <span className="text-[12px] text-muted">Add it to the account you use elsewhere</span>
              </span>
              <ArrowRight size={16} className="text-muted" />
            </button>
          )}
        </div>

        <p className="text-center text-small text-muted">
          New here?{" "}
          <Link to="/register" className="font-medium text-primary underline-offset-4 hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
    </>
  );
}

export default Login;
