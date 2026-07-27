import { z } from "zod";

/* ========================================
   LOGIN
======================================== */

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),

  password: z.string().min(1, "Password is required"),
});

/* ========================================
   REGISTER
======================================== */

export const registerSchema = z

  .object({
    email: z
      .string()
      .min(1, "Email is required")
      .email("Invalid email address"),

    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),

    confirmPassword: z.string(),
  })

  .refine(
    (data) => data.password === data.confirmPassword,

    {
      path: ["confirmPassword"],

      message: "Passwords do not match",
    },
  );

/* ========================================
   FORGOT PASSWORD
======================================== */

export const forgotPasswordSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
});

/* ========================================
   RESET PASSWORD
======================================== */

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),

    confirmPassword: z.string(),
  })

  .refine(
    (data) => data.password === data.confirmPassword,

    {
      path: ["confirmPassword"],

      message: "Passwords do not match",
    },
  );
