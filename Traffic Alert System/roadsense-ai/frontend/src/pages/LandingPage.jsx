import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Activity, Brain, MapPin, ShieldCheck, Sparkles } from "lucide-react";
import Navbar from "../components/layout/Navbar.jsx";
import Footer from "../components/layout/Footer.jsx";

const stats = [
  { label: "Predictions served", value: "2.3M+", sub: "Simulated enterprise volume" },
  { label: "Model accuracy", value: "94.2%", sub: "Production-tier validation" },
  { label: "Cities monitored", value: "20+", sub: "Pan-India coverage" },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-bg-primary">
      <Navbar />

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-40">
            <svg className="h-full w-full" viewBox="0 0 800 500" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
                  <stop stopColor="#3B82F6" stopOpacity="0.35" />
                  <stop offset="1" stopColor="#8B5CF6" stopOpacity="0.2" />
                </linearGradient>
              </defs>
              <rect width="800" height="500" fill="#0A0E1A" />
              <path
                fill="url(#g1)"
                d="M120 360 C220 300 260 120 420 140 C560 160 640 260 720 200 L720 500 L80 500 Z"
              />
              <motion.path
                d="M100 380 Q200 340 300 360 T500 320 T700 300"
                fill="none"
                stroke="#3B82F6"
                strokeWidth="3"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2.4, repeat: Infinity, repeatType: "reverse" }}
              />
              <motion.circle cx="420" cy="160" r="6" fill="#10B981" animate={{ r: [6, 10, 6] }} transition={{ duration: 2, repeat: Infinity }} />
            </svg>
          </div>

          <div className="relative mx-auto flex max-w-7xl flex-col gap-14 px-4 py-16 lg:flex-row lg:items-center lg:px-8 lg:py-24">
            <div className="flex-1 space-y-6">
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-card/80 px-3 py-1 text-xs text-txt-secondary shadow-glass">
                <Sparkles className="h-3.5 w-3.5 text-accent-primary" />
                Real-time accident intelligence
              </p>
              <motion.h1
                className="font-display text-4xl font-bold leading-tight tracking-tight text-txt-primary md:text-5xl lg:text-6xl"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                Predict.{" "}
                <span className="bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                  Prevent.
                </span>{" "}
                Protect.
              </motion.h1>
              <p className="max-w-xl text-lg text-txt-secondary">
                RoadSense AI blends operational maps, telematics context, and calibrated machine learning
                to surface route-risk before the sirens activate.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  to="/signup"
                  className="rounded-xl bg-gradient-to-r from-accent-primary to-accent-secondary px-6 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-900/30"
                >
                  Get started free
                </Link>
                <Link
                  to="/login"
                  className="rounded-xl border border-border bg-bg-card/80 px-6 py-3 text-sm font-semibold text-txt-primary shadow-glass backdrop-blur"
                >
                  View demo
                </Link>
              </div>
            </div>

            <div className="grid flex-1 gap-4 sm:grid-cols-3 lg:max-w-md lg:grid-cols-1">
              {stats.map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 * i }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 shadow-glass backdrop-blur-md"
                >
                  <p className="font-mono text-2xl font-semibold text-white">{s.value}</p>
                  <p className="mt-1 text-sm font-medium text-txt-primary">{s.label}</p>
                  <p className="text-xs text-txt-secondary">{s.sub}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-border bg-bg-secondary/30 py-16">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 lg:grid-cols-2 lg:px-8">
            <div className="space-y-4">
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-bg-card/80 px-3 py-1 text-xs text-txt-secondary shadow-glass">
                <ShieldCheck className="h-3.5 w-3.5 text-accent-primary" />
                New · Mobile route intelligence
              </p>
              <h2 className="font-display text-3xl font-bold text-txt-primary md:text-4xl">
                SafeRoute — live GPS, weather risk, and ETA in your pocket
              </h2>
              <p className="text-txt-secondary">
                The companion SafeRoute app pairs Google Maps directions with OpenWeather risk scoring, Gorhom
                trip sheets, and interval predictions aligned with the same route-safety philosophy as RoadSense AI on
                the web.
              </p>
              <p className="text-sm text-txt-secondary">
                Run it locally with Expo from{" "}
                <span className="font-mono text-txt-primary">roadsense-ai/saferoute-mobile</span>:{" "}
                <span className="font-mono text-txt-primary">npx expo start</span>
              </p>
            </div>
            <div className="flex justify-center">
              <img
                src="/SafeRoute.jpeg"
                alt="SafeRoute app logo"
                className="h-44 w-44 rounded-3xl border border-border bg-bg-card object-cover shadow-glass"
              />
            </div>
          </div>
        </section>

        <section id="features" className="border-t border-border bg-bg-secondary/40 py-20">
          <div className="mx-auto max-w-7xl px-4 lg:px-8">
            <div className="mb-12 max-w-2xl">
              <h2 className="font-display text-3xl font-bold text-txt-primary">Built for mission control</h2>
              <p className="mt-2 text-txt-secondary">
                Glass surfaces, live geospatial layers, and auditable prediction history — the baseline
                your SOC expects.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[
                { title: "Neural risk scoring", body: "Random Forest vs XGBoost tournament with balanced classes.", icon: Brain },
                { title: "Map-native workflows", body: "Point and corridor analysis with OSM basemaps — zero API keys.", icon: MapPin },
                { title: "JWT-secured tenancy", body: "Bcrypt-hashed identities and per-user prediction history.", icon: ShieldCheck },
                { title: "Operational telemetry", body: "Heatmaps and timelines synthesize millions of contextual features.", icon: Activity },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-2xl border border-border bg-bg-card/80 p-6 shadow-glass backdrop-blur-xl"
                >
                  <f.icon className="h-8 w-8 text-accent-primary" />
                  <h3 className="mt-4 font-display text-lg font-semibold text-txt-primary">{f.title}</h3>
                  <p className="mt-2 text-sm text-txt-secondary">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
