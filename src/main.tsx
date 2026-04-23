import React from "react";
import { CssBaseline } from "@mui/material";
import { CssVarsProvider } from "@mui/material/styles";
import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { appTheme } from "./app/theme";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <CssVarsProvider theme={appTheme} defaultMode="system">
    <CssBaseline />
    <App />
  </CssVarsProvider>,
);
  