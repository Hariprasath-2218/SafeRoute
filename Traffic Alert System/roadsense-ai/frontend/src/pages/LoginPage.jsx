import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/Navbar.jsx";
import Login from "../components/auth/Login.jsx";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <Navbar />
      <div className="mx-auto grid flex-1 w-full max-w-6xl gap-8 px-4 py-12 lg:grid-cols-2 lg:items-center lg:px-8">
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          className="relative hidden overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-accent-primary/30 via-bg-card to-bg-secondary p-10 lg:flex"
        >
          <div className="relative z-10 max-w-md space-y-4">
            <p className="text-sm uppercase tracking-[0.2em] text-accent-primary">Secure access</p>
            <h1 className="font-display text-4xl font-bold text-txt-primary">Welcome back to RoadSense</h1>
            <p className="text-txt-secondary">
              Enterprise authentication with JWT sessions, device-agnostic maps, and encrypted connectivity
              to MongoDB Atlas.
            </p>
          </div>
          <div className="pointer-events-none absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-accent-secondary/40 blur-3xl" />
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto w-full max-w-md">
          <Login />
          <p className="mt-4 text-center text-sm text-txt-secondary">
            Prefer browsing first?{" "}
            <Link to="/" className="text-accent-primary hover:underline">
              Back to marketing site
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
