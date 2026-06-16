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

import SocialButton from "../components/auth/SocialButton";

import AuthDivider from "../components/auth/AuthDivider";

import { useNavigate } from "react-router-dom";

function Login() {
  /* ========================================
     AUTH
  ========================================= */

  const { login } = useAuth();

  const navigate = useNavigate();

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
      await login(data);

      toast.success("Logged in successfully");
      navigate("/dashboard");
    } catch (error) {
      console.error(error);

      if (error.response?.status === 429) {
        const retryAfter = error.response.data.retryAfter;

        toast.error(
          `Too many login attempts. Try again in ${retryAfter} seconds.`,
        );

        return;
      }

      toast.error("Invalid credentials");
    }
  };

  /* ========================================
     GOOGLE LOGIN
  ========================================= */

  const handleGoogleLogin = () => {
    console.log("Google login");
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

        <SocialButton
          onClick={handleGoogleLogin}
          icon={
            <svg
              xmlns="
                http://www.w3.org/2000/svg
              "
              viewBox="0 0 48 48"
              className="
                h-[18px]
                w-[18px]
              "
            >
              <path
                fill="#FFC107"
                d="M43.611 20.083H42V20H24v8h11.303C33.655 32.657 29.195 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
              />

              <path
                fill="#FF3D00"
                d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.27 4 24 4 16.318 4.337 9.656 8.337 6.306 14.691z"
              />

              <path
                fill="#4CAF50"
                d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.176 0-9.629-3.327-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
              />

              <path
                fill="#1976D2"
                d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.084 5.571h.003l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
              />
            </svg>
          }
        >
          Continue with Google
        </SocialButton>

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
