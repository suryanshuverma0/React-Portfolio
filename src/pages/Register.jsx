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
    <AuthLayout
      title="Create account"
      subtitle="
        Start building your
        next big thing today.
      "
    >
      <div
        className="
          space-y-5
        "
      >
        {/* FORM */}

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="
            space-y-4
          "
        >
          {/* EMAIL */}

          <AuthInput
            label="Email"
            type="email"
            placeholder="
              Enter your email
            "
            autoComplete="email"
            error={errors.email?.message}
            required
            {...register("email")}
          />

          {/* PASSWORD */}

          <PasswordInput
            label="Password"
            placeholder="
              Create a password
            "
            autoComplete="
              new-password
            "
            error={errors.password?.message}
            required
            {...register("password")}
          />

          {/* CONFIRM PASSWORD */}

          <PasswordInput
            label="
              Confirm password
            "
            placeholder="
              Confirm your password
            "
            autoComplete="
              new-password
            "
            error={errors.confirmPassword?.message}
            required
            {...register("confirmPassword")}
          />

          {/* SUBMIT */}

          <AuthButton loading={isSubmitting}>Create Account</AuthButton>
        </form>

        {/* DIVIDER */}

        <AuthDivider />

        {/* GOOGLE */}

        <GoogleAuthButton
          text="signup_with"
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />

        {/* PASSKEY */}

        <PasskeyLoginButton
          label="Sign up with Passkey"
          onClick={handlePasskeySignup}
          loading={passkeyLoading}
        />

        <p className="text-center text-small text-muted">
          Enter your email above, then use your device&apos;s fingerprint,
          face, or screen lock instead of a password.
        </p>

        {/* LOGIN */}

        <p
          className="
            text-center

            text-small
          "
        >
          Already have an account?{" "}
          <Link
            to="/login"
            className="
              text-primary

              hover:opacity-70

              transition-opacity
            "
          >
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Register;
