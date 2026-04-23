import React from "react";
import { Outlet } from "react-router";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function Layout() {
  return (
    <div
      className="min-h-screen flex flex-col font-sans"
      style={{
        backgroundColor: "var(--mui-palette-background-default)",
        color: "var(--mui-palette-text-primary)",
      }}
    >
      <Header />
      <main id="main-content" className="flex-grow" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
