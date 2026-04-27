import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useEffect, useState } from "react";

import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";
import AppShell from "./components/layout/AppShell.jsx";

import LandingPage from "./pages/LandingPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import SignupPage from "./pages/SignupPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import MapPredictionPage from "./pages/MapPredictionPage.jsx";
import RoutePredictionPage from "./pages/RoutePredictionPage.jsx";
import HistoryPage from "./pages/HistoryPage.jsx";
import AiAssistantPage from "./pages/AiAssistantPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

import { ThemeProvider } from "./context/ThemeContext.jsx";

import { ThemeProvider } from "./context/ThemeContext.jsx";

import { ThemeProvider } from "./context/ThemeContext.jsx";

function FadeRoute({ children }) {
  const location = useLocation();
  return (
    <motion.div
      key={location.pathname + location.search}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route
          element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          }
        >
          <Route
            path="/dashboard"
            element={
              <FadeRoute>
                <DashboardPage />
              </FadeRoute>
            }
          />
          <Route
            path="/map"
            element={
              <FadeRoute>
                <MapPredictionPage />
              </FadeRoute>
            }
          />
          <Route
            path="/route"
            element={
              <FadeRoute>
                <RoutePredictionPage />
              </FadeRoute>
            }
          />
          <Route
            path="/history"
            element={
              <FadeRoute>
                <HistoryPage />
              </FadeRoute>
            }
          />
          <Route
            path="/ai"
            element={
              <FadeRoute>
                <AiAssistantPage />
              </FadeRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <FadeRoute>
                <SettingsPage />
              </FadeRoute>
            }
          />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}
