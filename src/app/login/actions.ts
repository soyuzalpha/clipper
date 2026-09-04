"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";

export async function authenticate(_prevState: string | undefined, formData: FormData) {
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return error.type === "CredentialsSignin"
        ? "Invalid email or password."
        : "Something went wrong. Please try again.";
    }
    throw error;
  }
}