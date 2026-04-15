import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./App.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { PredictionProvider } from "./context/PredictionContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <PredictionProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              className: "bg-bg-card text-txt-primary border border-border",
              duration: 4000,
            }}
          />
        </PredictionProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
