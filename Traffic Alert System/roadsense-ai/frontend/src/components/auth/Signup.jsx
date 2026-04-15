import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { UserPlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const schema = z
  .object({
    full_name: z.string().min(2, "Enter your full name"),
    email: z.string().email("Valid email required"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[A-Z]/, "Add an uppercase letter")
      .regex(/[0-9]/, "Add a number"),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, { message: "Passwords must match", path: ["confirm"] });

function strengthLabel(score) {
  if (score < 2) return { label: "Weak", color: "bg-accent-danger" };
  if (score < 4) return { label: "Fair", color: "bg-accent-warning" };
  if (score < 5) return { label: "Strong", color: "bg-accent-success" };
  return { label: "Excellent", color: "bg-accent-success" };
}

export default function Signup() {
  const { register: signupUser } = useAuth();
  const nav = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const pwd = watch("password") || "";

  const strength = useMemo(() => {
    let s = 0;
    /*
     * Simple client-side strength heuristic for UX (not a security gate).
     */
    if (pwd.length >= 8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[a-z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    return strengthLabel(s);
  }, [pwd]);

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await signupUser(values.full_name, values.email, values.password);
      toast.success("Account created");
      nav("/dashboard", { replace: true });
    } catch (e) {
      toast.error(e.userMessage || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-2xl border border-border bg-bg-card/80 p-8 shadow-glass backdrop-blur-xl"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-secondary/15 text-accent-secondary">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-txt-primary">Create account</h2>
          <p className="text-sm text-txt-secondary">Join the RoadSense workspace</p>
        </div>
      </div>

      <div>
        <label className="relative block">
          <span className="absolute -top-2 left-3 bg-bg-card px-1 text-xs text-txt-secondary">
            Full name
          </span>
          <input
            className="mt-1 block w-full rounded-xl border-border bg-bg-secondary px-4 py-3 text-txt-primary focus:border-accent-primary focus:ring-accent-primary"
            {...register("full_name")}
          />
        </label>
        {errors.full_name && (
          <p className="mt-1 text-sm text-accent-danger">{errors.full_name.message}</p>
        )}
      </div>

      <div>
        <label className="relative block">
          <span className="absolute -top-2 left-3 bg-bg-card px-1 text-xs text-txt-secondary">
            Work email
          </span>
          <input
            type="email"
            autoComplete="email"
            className="mt-1 block w-full rounded-xl border-border bg-bg-secondary px-4 py-3 text-txt-primary focus:border-accent-primary focus:ring-accent-primary"
            {...register("email")}
          />
        </label>
        {errors.email && (
          <p className="mt-1 text-sm text-accent-danger">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label className="relative block">
          <span className="absolute -top-2 left-3 bg-bg-card px-1 text-xs text-txt-secondary">
            Password
          </span>
          <input
            type="password"
            autoComplete="new-password"
            className="mt-1 block w-full rounded-xl border-border bg-bg-secondary px-4 py-3 text-txt-primary focus:border-accent-primary focus:ring-accent-primary"
            {...register("password")}
          />
        </label>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-secondary">
            <div
              className={`h-full ${strength.color} transition-all duration-300`}
              style={{ width: `${Math.min(100, (pwd.length / 16) * 100)}%` }}
            />
          </div>
          <span className="text-xs text-txt-secondary">{strength.label}</span>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-accent-danger">{errors.password.message}</p>
        )}
      </div>

      <div>
        <label className="relative block">
          <span className="absolute -top-2 left-3 bg-bg-card px-1 text-xs text-txt-secondary">
            Confirm password
          </span>
          <input
            type="password"
            autoComplete="new-password"
            className="mt-1 block w-full rounded-xl border-border bg-bg-secondary px-4 py-3 text-txt-primary focus:border-accent-primary focus:ring-accent-primary"
            {...register("confirm")}
          />
        </label>
        {errors.confirm && (
          <p className="mt-1 text-sm text-accent-danger">{errors.confirm.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary py-3 font-semibold text-white shadow-lg transition hover:opacity-95 disabled:opacity-60"
      >
        {submitting ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
        ) : (
          "Create account"
        )}
      </button>

      <p className="text-center text-sm text-txt-secondary">
        Already have access?{" "}
        <Link className="font-medium text-accent-primary hover:underline" to="/login">
          Sign in
        </Link>
      </p>
    </form>
  );
}
