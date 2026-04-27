import { useState } from "react";
import toast from "react-hot-toast";
import { KeyRound, Save, UserCircle2 } from "lucide-react";
import { updatePassword, updateProfile } from "../api/auth.js";
import { useAuth } from "../context/AuthContext.jsx";
import {
  getPredictionAlertIntervalMin,
  getPredictionAlertsEnabled,
  requestBrowserNotificationPermission,
  setPredictionAlertIntervalMin,
  setPredictionAlertsEnabled,
} from "../utils/predictionAlerts.js";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();

  const [fullName, setFullName] = useState(user?.full_name || "");
  const [profileBusy, setProfileBusy] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [predictionAlertsEnabled, setPredictionAlertsEnabledLocal] = useState(
    getPredictionAlertsEnabled(),
  );
  const [predictionIntervalMin, setPredictionIntervalMinLocal] = useState(
    getPredictionAlertIntervalMin(),
  );

  const onSaveProfile = async (e) => {
    e.preventDefault();
    const name = fullName.trim();
    if (!name) {
      toast.error("Name is required");
      return;
    }

    setProfileBusy(true);
    try {
      await updateProfile({ full_name: name });
      await refreshUser();
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err.userMessage || "Failed to update profile");
    } finally {
      setProfileBusy(false);
    }
  };

  const onEnablePredictionAlerts = async (enabled) => {
    try {
      if (enabled) {
        const perm = await requestBrowserNotificationPermission();
        if (perm === "denied") {
          toast.error(
            "Browser notifications are blocked. Enable them in browser settings.",
          );
          setPredictionAlertsEnabledLocal(false);
          setPredictionAlertsEnabled(false);
          return;
        }
      }
      setPredictionAlertsEnabledLocal(enabled);
      setPredictionAlertsEnabled(enabled);
      toast.success(`Prediction alerts ${enabled ? "enabled" : "disabled"}`);
    } catch {
      toast.error("Failed to update prediction alerts preference");
    }
  };

  const onPredictionIntervalChange = (val) => {
    const next = Number(val);
    if (!Number.isFinite(next) || next < 1) return;
    setPredictionIntervalMinLocal(next);
    setPredictionAlertIntervalMin(next);
    toast.success(
      `Prediction interval set to ${next} minute${next > 1 ? "s" : ""}`,
    );
  };

  const onUpdatePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    setPasswordBusy(true);
    try {
      await updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password updated");
    } catch (err) {
      toast.error(err.userMessage || "Failed to update password");
    } finally {
      setPasswordBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-txt-primary">
          Settings
        </h1>
        <p className="text-txt-secondary">
          Manage your profile and credentials.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-border bg-bg-card p-5 shadow-glass xl:col-span-2">
          <h2 className="font-display text-lg font-semibold text-txt-primary">
            Prediction notifications
          </h2>
          <p className="mt-1 text-sm text-txt-secondary">
            First prediction triggers an immediate popup. After that, alerts
            repeat at your selected interval.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <label className="text-xs text-txt-secondary">
                Enable prediction alerts
              </label>
              <select
                className="mt-1 w-full rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm"
                value={predictionAlertsEnabled ? "on" : "off"}
                onChange={(e) =>
                  onEnablePredictionAlerts(e.target.value === "on")
                }
              >
                <option value="on">On</option>
                <option value="off">Off</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-txt-secondary">
                Prediction alert interval
              </label>
              <select
                className="mt-1 w-full rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm"
                value={predictionIntervalMin}
                onChange={(e) => onPredictionIntervalChange(e.target.value)}
              >
                {[1, 2, 5, 10, 15, 30, 60].map((v) => (
                  <option key={v} value={v}>
                    {v === 60 ? "60 minutes (1 hour)" : `${v} minutes`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-bg-card p-5 shadow-glass">
          <div className="mb-4 flex items-center gap-2">
            <UserCircle2 className="h-5 w-5 text-accent-primary" />
            <h2 className="font-display text-lg font-semibold text-txt-primary">
              Profile
            </h2>
          </div>
          <form className="space-y-4" onSubmit={onSaveProfile}>
            <div>
              <label className="text-xs text-txt-secondary">Email</label>
              <input
                disabled
                value={user?.email || ""}
                className="mt-1 w-full rounded-lg border-border bg-bg-secondary/70 px-3 py-2 text-sm text-txt-secondary"
              />
            </div>
            <div>
              <label className="text-xs text-txt-secondary">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm"
                placeholder="Your name"
              />
            </div>
            <button
              type="submit"
              disabled={profileBusy}
              className="inline-flex items-center gap-2 rounded-xl bg-accent-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {profileBusy ? "Saving..." : "Save profile"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-border bg-bg-card p-5 shadow-glass">
          <div className="mb-4 flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-accent-warning" />
            <h2 className="font-display text-lg font-semibold text-txt-primary">
              Password
            </h2>
          </div>
          <form className="space-y-4" onSubmit={onUpdatePassword}>
            <div>
              <label className="text-xs text-txt-secondary">
                Current password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-txt-secondary">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm"
                placeholder="At least 8 characters"
              />
            </div>
            <button
              type="submit"
              disabled={passwordBusy}
              className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-semibold text-txt-primary disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {passwordBusy ? "Updating..." : "Update password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
