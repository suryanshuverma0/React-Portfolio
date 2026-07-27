import { useState } from "react";

import { Link, useParams } from "react-router-dom";

import { useForm } from "react-hook-form";

import { zodResolver } from "@hookform/resolvers/zod";

import { toast } from "react-toastify";

import { resetPasswordSchema } from "../validations/authValidation";

import api from "../lib/axios";

import AuthLayout from "../components/auth/AuthLayout";

import PasswordInput from "../components/auth/PasswordInput";

import AuthButton from "../components/auth/AuthButton";

function ResetPassword() {
  const { token } = useParams();

  const [success, setSuccess] = useState(false);

  const {
    register,

    handleSubmit,

    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),

    defaultValues: {
      password: "",

      confirmPassword: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      await api.post(`/auth/reset-password/${token}`, data);

      setSuccess(true);

      toast.success("Password reset successfully");
    } catch (error) {
      console.error(error);

      if (error.response?.status === 429) {
        const retryAfter = error.response.data?.retryAfter;

        toast.error(
          `Too many attempts. Try again in ${retryAfter} seconds.`,
        );

        return;
      }

      if (error.response?.status === 400) {
        const firstError = error.response.data?.errors?.[0]?.message;

        toast.error(
          firstError ||
            error.response.data?.message ||
            "Please check your input",
        );

        return;
      }

      toast.error(
        error.response?.data?.message ||
          "This reset link is invalid or has expired",
      );
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="
        Choose a new password
        for your account.
      "
    >
      {success ? (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <div className="flex items-start gap-3">
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

              <div className="space-y-2">
                <h3 className="text-label">Password reset</h3>

                <p className="text-small">
                  Your password has been changed. You can now sign in with
                  your new password.
                </p>
              </div>
            </div>
          </div>

          <Link to="/login">
            <AuthButton>Back to Login</AuthButton>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <PasswordInput
            label="New password"
            placeholder="Enter your new password"
            autoComplete="new-password"
            error={errors.password?.message}
            required
            {...register("password")}
          />

          <PasswordInput
            label="Confirm new password"
            placeholder="Confirm your new password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            required
            {...register("confirmPassword")}
          />

          <AuthButton loading={isSubmitting}>Reset Password</AuthButton>

          <p className="text-center text-small">
            Remembered it after all?{" "}
            <Link
              to="/login"
              className="text-primary hover:opacity-70 transition-opacity"
            >
              Sign in
            </Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}

export default ResetPassword;
