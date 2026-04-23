import React from "react";
import DarkModeRounded from "@mui/icons-material/DarkModeRounded";
import LightModeRounded from "@mui/icons-material/LightModeRounded";
import { IconButton, Tooltip } from "@mui/material";
import { useColorScheme } from "@mui/material/styles";

export function ColorModeToggle() {
  const { mode, setMode } = useColorScheme();

  const toggleMode = () => {
    setMode(mode === "dark" ? "light" : "dark");
  };

  const isDark = mode === "dark";
  const label = isDark ? "Activer le thème clair" : "Activer le thème sombre";

  return (
    <Tooltip title={label}>
      <IconButton aria-label={label} onClick={toggleMode} size="small">
        {isDark ? <LightModeRounded fontSize="small" /> : <DarkModeRounded fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}
