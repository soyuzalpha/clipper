import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required"),
  AUTH_TRUST_HOST: z.coerce.boolean().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

let _env: z.infer<typeof envSchema> | null = null;

export function getEnv() {
  if (_env) return _env;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Missing required environment variables. Check .env file.");
  }
  _env = parsed.data;
  return _env;
}