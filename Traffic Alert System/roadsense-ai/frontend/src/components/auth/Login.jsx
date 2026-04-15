import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { LogIn } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";

const schema = z.object({
  email: z.string().email("Valid email required"),
  password: z.string().min(1, "Password required"),
});

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const from = loc.state?.from || "/dashboard";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema) });

  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      await login(values.email, values.password);
      toast.success("Welcome back");
      nav(from, { replace: true });
    } catch (e) {
      toast.error(e.userMessage || "Login failed");
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
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-primary/15 text-accent-primary">
          <LogIn className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold text-txt-primary">Sign in</h2>
          <p className="text-sm text-txt-secondary">Enterprise traffic intelligence</p>
        </div>
      </div>

      <div>
        <label className="relative block">
          <span className="absolute -top-2 left-3 bg-bg-card px-1 text-xs text-txt-secondary">
            Email
          </span>
          <input
            type="email"
            autoComplete="email"
            className="mt-1 block w-full rounded-xl border-border bg-bg-secondary px-4 py-3 text-txt-primary focus:border-accent-primary focus:ring-accent-primary"
            placeholder="you@company.com"
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
            autoComplete="current-password"
            className="mt-1 block w-full rounded-xl border-border bg-bg-secondary px-4 py-3 text-txt-primary focus:border-accent-primary focus:ring-accent-primary"
            placeholder="••••••••"
            {...register("password")}
          />
        </label>
        {errors.password && (
          <p className="mt-1 text-sm text-accent-danger">{errors.password.message}</p>
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
          "Continue"
        )}
      </button>

      <p className="text-center text-sm text-txt-secondary">
        New to RoadSense?{" "}
        <Link className="font-medium text-accent-primary hover:underline" to="/signup">
          Create account
        </Link>
      </p>
    </form>
  );
}
