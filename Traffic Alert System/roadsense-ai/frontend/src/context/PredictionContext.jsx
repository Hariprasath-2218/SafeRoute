import { createContext, useContext, useMemo, useState } from "react";

const PredictionContext = createContext(null);

export function PredictionProvider({ children }) {
  const [lastPoint, setLastPoint] = useState(null);
  const [lastRoute, setLastRoute] = useState(null);

  const value = useMemo(
    () => ({
      lastPoint,
      lastRoute,
      setLastPoint,
      setLastRoute,
      clear: () => {
        setLastPoint(null);
        setLastRoute(null);
      },
    }),
    [lastPoint, lastRoute]
  );

  return <PredictionContext.Provider value={value}>{children}</PredictionContext.Provider>;
}

export function usePredictionCtx() {
  return useContext(PredictionContext);
}
