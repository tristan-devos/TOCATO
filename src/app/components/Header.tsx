import React from "react";
import { Search, Menu } from "lucide-react";
import { Link } from "react-router";
import { ColorModeToggle } from "./ColorModeToggle";

export function Header() {
  return (
    <>
      {/* Skip to main content — visible on keyboard focus */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
      >
        Aller au contenu principal
      </a>

      <header
        className="bg-[var(--mui-palette-background-paper)] border-b border-[var(--mui-palette-divider)] sticky top-0 z-50"
        role="banner"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="text-2xl font-bold text-blue-600 tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-sm"
              aria-label="Tocato, retour à l'accueil"
            >
              tocato
            </Link>
            <form role="search" className="hidden md:flex relative group" onSubmit={(e) => e.preventDefault()}>
              <label htmlFor="header-search" className="sr-only">
                Rechercher un service
              </label>
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none" aria-hidden="true">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                id="header-search"
                type="search"
                name="q"
                placeholder="De quel service avez-vous besoin ?"
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-full text-sm w-80 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </form>
          </div>

          <nav className="hidden md:flex items-center gap-6" aria-label="Navigation principale">
            <ColorModeToggle />
            <Link
              to="/"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-sm"
            >
              Devenir prestataire
            </Link>
            <div className="w-px h-6 bg-slate-200" aria-hidden="true"></div>
            <button
              type="button"
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-sm"
            >
              Se connecter
            </button>
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-full transition-colors shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              S'inscrire
            </button>
          </nav>

          <button
            type="button"
            className="md:hidden p-2 text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-md"
            aria-label="Ouvrir le menu de navigation"
            aria-expanded="false"
            aria-controls="mobile-menu"
          >
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </header>
    </>
  );
}
