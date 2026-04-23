import React from "react";
import { motion } from "motion/react";
import { Search, Wrench, Sparkles, Truck, Sprout } from "lucide-react";

export function Hero() {
  const quickActions = [
    { icon: <Wrench className="w-5 h-5" aria-hidden="true" />, label: "Bricolage" },
    { icon: <Sparkles className="w-5 h-5" aria-hidden="true" />, label: "Ménage" },
    { icon: <Truck className="w-5 h-5" aria-hidden="true" />, label: "Déménagement" },
    { icon: <Sprout className="w-5 h-5" aria-hidden="true" />, label: "Jardinage" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire to search results route
  };

  return (
    <section
      className="relative pt-20 pb-32 overflow-hidden"
      aria-labelledby="hero-heading"
    >
      {/* Background Image with Overlay (decorative) */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <img
          src="https://images.unsplash.com/photo-1600210492493-0946911123ea?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob21lJTIwaW50ZXJpb3J8ZW58MXx8fHwxNzc2ODUyODk4fDA&ixlib=rb-4.1.0&q=80&w=1080"
          alt=""
          role="presentation"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-slate-900/60 mix-blend-multiply" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <motion.h1
          id="hero-heading"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-extrabold text-white tracking-tight max-w-4xl mb-6 shadow-sm"
        >
          Trouvez la bonne personne pour tous vos projets du quotidien
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-lg md:text-xl text-slate-200 max-w-2xl mb-10"
        >
          Des milliers de prestataires de confiance prêts à vous aider pour le bricolage, le ménage, le déménagement et bien plus.
        </motion.p>

        <motion.form
          role="search"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full max-w-2xl bg-white p-2 rounded-2xl shadow-xl flex items-center mb-8"
        >
          <label htmlFor="hero-search" className="sr-only">
            Rechercher un service
          </label>
          <div className="pl-4 text-slate-400" aria-hidden="true">
            <Search className="w-6 h-6" />
          </div>
          <input
            id="hero-search"
            type="search"
            name="q"
            placeholder="Que souhaitez-vous réaliser ? (ex: Monter un meuble)"
            className="flex-1 py-4 px-4 text-slate-700 bg-transparent focus:outline-none text-lg"
          />
          <button
            type="submit"
            aria-label="Rechercher"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold p-4 sm:py-4 sm:px-8 rounded-xl transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2"
          >
            <Search className="w-5 h-5 sm:hidden" aria-hidden="true" />
            <span className="hidden sm:inline">Rechercher</span>
          </button>
        </motion.form>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-wrap justify-center gap-4"
          role="group"
          aria-label="Parcourir les services populaires"
        >
          {quickActions.map((action, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Parcourir les services de ${action.label.toLowerCase()}`}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white px-5 py-3 rounded-full font-medium transition-all border border-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
