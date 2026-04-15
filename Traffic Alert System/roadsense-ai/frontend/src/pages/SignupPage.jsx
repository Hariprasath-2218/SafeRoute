import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import Signup from "../components/auth/Signup.jsx";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <Navbar />
      <div className="mx-auto grid flex-1 w-full max-w-6xl gap-8 px-4 py-12 lg:grid-cols-2 lg:items-center lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative hidden overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-accent-secondary/30 via-bg-card to-bg-secondary p-10 lg:flex"
        >
          <div className="relative z-10 max-w-md space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-accent-secondary">Onboarding</p>
            <h1 className="font-display text-4xl font-bold text-txt-primary">Create your workspace</h1>
            <p className="text-txt-secondary">
              Password strength analytics, audit-friendly profiles, and instant map sandbox access once you
              verify credentials.
            </p>
          </div>
          <div className="pointer-events-none absolute -right-16 top-10 h-72 w-72 rounded-full bg-accent-primary/30 blur-3xl" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-md">
          <Signup />
          <p className="mt-4 text-center text-sm text-txt-secondary">
            <Link to="/login" className="text-accent-primary hover:underline">
              Already provisioned?
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
