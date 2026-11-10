import { Link } from "react-router-dom";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "react-toastify";

import { registerSchema } from "../validations/authValidation";

import { useAuth } from "../contexts/AuthContext";

import AuthLayout from "../components/auth/AuthLayout";

import AuthInput from "../components/auth/AuthInput";

import PasswordInput from "../components/auth/PasswordInput";

import AuthButton from "../components/auth/AuthButton";

import GoogleAuthButton from "../components/auth/GoogleAuthButton";

import PasskeyLoginButton from "../components/auth/PasskeyLoginButton";

import AuthDivider from "../components/auth/AuthDivider";

import { useNavigate } from "react-router-dom";

import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";

function Register() {
  /* ========================================
     AUTH
  ========================================= */

  const { register: registerUser, loginWithGoogle, registerWithPasskey } = useAuth();

  const navigate = useNavigate();

  const [passkeyLoading, setPasskeyLoading] = useState(false);

  /* ========================================
     FORM
  ========================================= */

  const {
    register,

    handleSubmit,

    trigger,

    getValues,

    formState: {
      errors,

      isSubmitting,
    },
  } = useForm({
    resolver: zodResolver(registerSchema),

    defaultValues: {
      email: "",

      password: "",

      confirmPassword: "",
    },
  });

  /* ========================================
     SUBMIT
  ========================================= */

  const onSubmit = async (data) => {
    try {
      const newUser = await registerUser(data);

      toast.success("Account created successfully");
      navigate(newUser?.role === "admin" ? "/dashboard" : "/account");
    } catch (error) {
      console.error(error);

      if (error.response?.status === 429) {
        const retryAfter = error.response.data.retryAfter;

        toast.error(
          `Too many registration attempts. Try again in ${retryAfter} seconds.`,
        );

        return;
      }

      if (error.response?.status === 403) {
        toast.error(
          error.response.data?.message || "Registration is currently disabled",
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

      toast.error(error.response?.data?.message || "Failed to create account");
    }
  };

  /* ========================================
     GOOGLE REGISTER
  ========================================= */

  const handleGoogleSuccess = async (credential) => {
    try {
      const loggedInUser = await loginWithGoogle(credential);

      toast.success("Account created successfully");
      navigate(loggedInUser?.role === "admin" ? "/dashboard" : "/account");
    } catch (error) {
      console.error(error);

      if (error.response?.status === 429) {
        const retryAfter = error.response.data.retryAfter;

        toast.error(
          `Too many attempts. Try again in ${retryAfter} seconds.`,
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
     PASSKEY SIGNUP

     Reuses the email field already in the
     form above — only that field is
     validated, a password isn't needed for
     this path.
  ========================================= */

  const handlePasskeySignup = async () => {
    const emailValid = await trigger("email");

    if (!emailValid) return;

    try {
      setPasskeyLoading(true);

      const newUser = await registerWithPasskey(getValues("email"));

      toast.success("Account created successfully");
      navigate(newUser?.role === "admin" ? "/dashboard" : "/account");
    } catch (error) {
      console.error(error);

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
          error.response.data?.message || "Registration is currently disabled",
        );

        return;
      }

      if (error.response?.status === 409) {
        toast.error(
          error.response.data?.message ||
            "An account with this email already exists.",
        );

        return;
      }

      toast.error(error.response?.data?.message || "Passkey sign-up failed");
    } finally {
      setPasskeyLoading(false);
    }
  };

  return (
    <AuthLayout mode="register" title="Create your account" subtitle="Use a passkey and skip passwords entirely — or pick email and password.">
      <div className="space-y-6">
        <GoogleAuthButton text="signup_with" onSuccess={handleGoogleSuccess} onError={handleGoogleError} />

        <AuthDivider text="or with email" />

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <AuthInput label="Email" type="email" placeholder="you@example.com" autoComplete="email" error={errors.email?.message} required {...register("email")} />

          {/* PASSKEY SIGN-UP — uses the email above */}
          <div className="rounded-2xl border border-border bg-surface/50 p-3.5">
            <PasskeyLoginButton label="Sign up with a passkey" onClick={handlePasskeySignup} loading={passkeyLoading} />
            <p className="mt-2.5 flex items-start gap-2 text-[12px] leading-relaxed text-muted">
              <Sparkles size={13} className="mt-0.5 shrink-0" />
              Recommended — your fingerprint, face or screen lock replaces the password. Nothing to remember or leak.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1 text-[12px] text-muted">
            <span className="h-px flex-1 bg-border" /> or set a password <span className="h-px flex-1 bg-border" />
          </div>

          <PasswordInput label="Password" placeholder="At least 8 characters" autoComplete="new-password" error={errors.password?.message} required showStrength {...register("password")} />
          <PasswordInput label="Confirm password" placeholder="Type it again" autoComplete="new-password" error={errors.confirmPassword?.message} required {...register("confirmPassword")} />

          <AuthButton loading={isSubmitting}>
            Create account <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
          </AuthButton>
        </form>

        <p className="text-center text-small text-muted">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Register;
