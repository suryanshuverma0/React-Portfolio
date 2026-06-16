import { useState } from "react";

import { Link } from "react-router-dom";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "react-toastify";

import { forgotPasswordSchema } from "../validations/authValidation";

import AuthLayout from "../components/auth/AuthLayout";

import AuthInput from "../components/auth/AuthInput";

import AuthButton from "../components/auth/AuthButton";

function ForgotPassword() {
  /* ========================================
     SUCCESS STATE
  ========================================= */

  const [success, setSuccess] = useState(false);

  /* ========================================
     FORM
  ========================================= */

  const {
    register,

    handleSubmit,

    watch,

    formState: {
      errors,

      isSubmitting,
    },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),

    defaultValues: {
      email: "",
    },
  });

  /* ========================================
     EMAIL
  ========================================= */

  const email = watch("email");

  /* ========================================
     SUBMIT
  ========================================= */

  const onSubmit = async (data) => {
    try {
      /*
          API CALL LATER

          await api.post(
            "/auth/forgot-password",
            data
          );
        */

      setSuccess(true);

      toast.success("Reset link sent");
    } catch (error) {
      console.error(error);

      toast.error("Failed to send reset link");
    }
  };

  return (
    <AuthLayout
      title="Forgot password"
      subtitle="
        Enter your email and
        we’ll send you a reset link.
      "
    >
      {success ? (
        <div
          className="
            space-y-6
          "
        >
          {/* SUCCESS CARD */}

          <div
            className="
              rounded-2xl

              border
              border-border

              bg-surface

              p-5
            "
          >
            <div
              className="
                flex
                items-start

                gap-3
              "
            >
              {/* ICON */}

              <div
                className="
                  mt-0.5

                  h-9
                  w-9

                  rounded-xl

                  bg-primary

                  text-background

                  flex
                  items-center
                  justify-center

                  text-sm
                  font-semibold
                "
              >
                ✓
              </div>

              {/* TEXT */}

              <div
                className="
                  space-y-2
                "
              >
                <h3
                  className="
                    text-label
                  "
                >
                  Reset link sent
                </h3>

                <p
                  className="
                    text-small
                  "
                >
                  If an account exists for {email}, you’ll receive a password
                  reset link shortly.
                </p>
              </div>
            </div>
          </div>

          {/* LOGIN */}

          <Link to="/login">
            <AuthButton>Back to Login</AuthButton>
          </Link>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="
            space-y-5
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

          {/* SUBMIT */}

          <AuthButton loading={isSubmitting}>Send Reset Link</AuthButton>

          {/* LOGIN */}

          <p
            className="
              text-center

              text-small
            "
          >
            Remember your password?{" "}
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
        </form>
      )}
    </AuthLayout>
  );
}

export default ForgotPassword;
