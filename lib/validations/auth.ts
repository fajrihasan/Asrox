import { z } from "zod";

const email = z.string().trim().email("Masukkan alamat email yang valid.").toLowerCase();
const password = z.string().min(8, "Kata sandi minimal 8 karakter.");

export const loginSchema = z.object({
  email,
  password,
});

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username minimal 3 karakter.")
    .max(24, "Username maksimal 24 karakter.")
    .regex(/^[a-z0-9_]+$/, "Username hanya boleh berisi huruf kecil, angka, dan garis bawah."),
  fullName: z
    .string()
    .trim()
    .min(2, "Nama tampilan minimal 2 karakter.")
    .max(80, "Nama tampilan maksimal 80 karakter."),
  email,
  password,
});

export const emailSchema = z.object({ email });

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Kata sandi tidak cocok. Periksa kembali lalu coba lagi.",
    path: ["confirmPassword"],
  });
