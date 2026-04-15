import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

const schema = z.object({
  hour_of_day: z.coerce.number().min(0).max(23),
  city: z.string().min(1, "City required"),
  state: z.string().min(1, "State required"),
  road_type: z.string().min(1),
  road_surface_condition: z.string().min(1),
  road_width_meters: z.coerce.number().nonnegative(),
  number_of_lanes: z.coerce.number().int().min(1),
  speed_limit_kmh: z.coerce.number().nonnegative(),
  average_speed_kmh: z.coerce.number().nonnegative(),
  weather_condition: z.string().min(1),
  temperature_celsius: z.coerce.number(),
  humidity_percent: z.coerce.number().min(0).max(100),
  visibility_km: z.coerce.number().nonnegative(),
  traffic_density: z.coerce.number().min(0).max(1),
  light_condition: z.string().min(1),
  signal_present: z.coerce.number().min(0).max(1),
  road_divider_present: z.coerce.number().min(0).max(1),
  vehicle_type_involved: z.string().min(1),
  vehicles_involved: z.coerce.number().int().min(0),
  pedestrians_nearby: z.coerce.number().int().min(0),
  risk_score: z.coerce.number().min(0).max(100).optional(),
});

export default function PredictionForm({
  defaultValues,
  onSubmit,
  submitting,
  submitLabel = "Run prediction",
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {
      hour_of_day: new Date().getHours(),
      city: "",
      state: "",
      road_type: "State Highway",
      road_surface_condition: "Dry",
      road_width_meters: 8,
      number_of_lanes: 4,
      speed_limit_kmh: 80,
      average_speed_kmh: 55,
      weather_condition: "Clear",
      temperature_celsius: 28,
      humidity_percent: 55,
      visibility_km: 5,
      traffic_density: 0.45,
      light_condition: "Daylight",
      signal_present: 1,
      road_divider_present: 0,
      vehicle_type_involved: "Car",
      vehicles_involved: 2,
      pedestrians_nearby: 5,
      risk_score: undefined,
    },
  });

  const field = (name, label, type = "text", step) => (
    <div>
      <label className="block text-xs text-txt-secondary">{label}</label>
      <input
        type={type}
        step={step}
        className="mt-1 w-full rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm text-txt-primary"
        {...register(name)}
      />
      {errors[name] && (
        <p className="mt-1 text-xs text-accent-danger">{errors[name].message}</p>
      )}
    </div>
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="grid max-h-[70vh] gap-3 overflow-y-auto pr-1 md:grid-cols-2"
    >
      {field("hour_of_day", "Hour of day (0-23)", "number")}
      {field("city", "City")}
      {field("state", "State")}
      <div className="md:col-span-2 grid gap-3 md:grid-cols-2">
        <div>
          <label className="block text-xs text-txt-secondary">Road type</label>
          <select
            className="mt-1 w-full rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm text-txt-primary"
            {...register("road_type")}
          >
            {[
              "National Highway",
              "State Highway",
              "City Road",
              "Rural Road",
              "Expressway",
            ].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-txt-secondary">Surface</label>
          <select
            className="mt-1 w-full rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm text-txt-primary"
            {...register("road_surface_condition")}
          >
            {["Dry", "Wet", "Potholed", "Under Construction"].map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
        </div>
      </div>
      {field("road_width_meters", "Road width (m)", "number", "0.1")}
      {field("number_of_lanes", "Lanes", "number")}
      {field("speed_limit_kmh", "Speed limit km/h", "number")}
      {field("average_speed_kmh", "Average speed km/h", "number")}
      <div>
        <label className="block text-xs text-txt-secondary">Weather</label>
        <select
          className="mt-1 w-full rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm text-txt-primary"
          {...register("weather_condition")}
        >
          {["Clear", "Rain", "Fog", "Haze", "Thunderstorm"].map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      {field("temperature_celsius", "Temp °C", "number", "0.1")}
      {field("humidity_percent", "Humidity %", "number")}
      {field("visibility_km", "Visibility km", "number", "0.1")}
      {field("traffic_density", "Traffic density 0-1", "number", "0.01")}
      <div>
        <label className="block text-xs text-txt-secondary">Light</label>
        <select
          className="mt-1 w-full rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm text-txt-primary"
          {...register("light_condition")}
        >
          {["Daylight", "Night", "Partial Light"].map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-txt-secondary">Signal present (0/1)</label>
        <select
          className="mt-1 w-full rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm text-txt-primary"
          {...register("signal_present")}
        >
          <option value={0}>0</option>
          <option value={1}>1</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-txt-secondary">Divider (0/1)</label>
        <select
          className="mt-1 w-full rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm text-txt-primary"
          {...register("road_divider_present")}
        >
          <option value={0}>0</option>
          <option value={1}>1</option>
        </select>
      </div>
      <div>
        <label className="block text-xs text-txt-secondary">Vehicle type</label>
        <select
          className="mt-1 w-full rounded-lg border-border bg-bg-secondary px-3 py-2 text-sm text-txt-primary"
          {...register("vehicle_type_involved")}
        >
          {["Car", "Truck", "Bus", "Motorcycle", "Auto Rickshaw"].map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
      {field("vehicles_involved", "Vehicles involved", "number")}
      {field("pedestrians_nearby", "Pedestrians nearby", "number")}
      <div className="md:col-span-2 flex items-center justify-end gap-3 border-t border-border pt-3">
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-accent-primary px-4 py-2.5 text-sm font-semibold text-white shadow-lg disabled:opacity-60"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
