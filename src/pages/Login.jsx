import { Link } from "react-router-dom";

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

import { useNavigate } from "react-router-dom";

function Login() {
  /* ========================================
     AUTH
  ========================================= */

  const { login, loginWithGoogle, loginWithPasskey } = useAuth();

  const navigate = useNavigate();

  const [passkeyLoading, setPasskeyLoading] = useState(false);

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

  /* ========================================
     SUBMIT
  ========================================= */

  const onSubmit = async (data) => {
    try {
      const loggedInUser = await login(data);

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

      toast.error("Invalid credentials");
    }
  };

  /* ========================================
     GOOGLE LOGIN
  ========================================= */

  const handleGoogleSuccess = async (credential) => {
    try {
      const loggedInUser = await loginWithGoogle(credential);

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

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="
        Sign in to continue
        building something great.
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
              Enter your password
            "
            autoComplete="
              current-password
            "
            error={errors.password?.message}
            required
            {...register("password")}
          />

          {/* FORGOT PASSWORD */}

          <div
            className="
              flex
              justify-end
            "
          >
            <Link
              to="/forgot-password"
              className="
                text-sm

                text-muted

                hover:text-primary

                transition-colors
              "
            >
              Forgot password?
            </Link>
          </div>

          {/* SUBMIT */}

          <AuthButton loading={isSubmitting}>Sign In</AuthButton>
        </form>

        {/* DIVIDER */}

        <AuthDivider />

        {/* GOOGLE */}

        <GoogleAuthButton
          text="continue_with"
          onSuccess={handleGoogleSuccess}
          onError={handleGoogleError}
        />

        {/* PASSKEY */}

        <PasskeyLoginButton
          onClick={handlePasskeyLogin}
          loading={passkeyLoading}
        />

        {/* REGISTER */}

        <p
          className="
            text-center

            text-small
          "
        >
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="
              text-primary

              hover:opacity-70

              transition-opacity
            "
          >
            Create account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}

export default Login;
