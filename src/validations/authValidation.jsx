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

    password: z.string().min(8, "Password must be at least 8 characters"),

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
