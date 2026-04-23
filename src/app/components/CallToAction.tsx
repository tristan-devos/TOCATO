import React from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

export function CallToAction() {
  return (
    <section className="py-24 bg-blue-600 relative overflow-hidden" aria-labelledby="cta-heading">
      {/* Decorative patterns */}
      <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500 rounded-full blur-3xl opacity-50" aria-hidden="true"></div>
      <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-blue-700 rounded-full blur-3xl opacity-50" aria-hidden="true"></div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.h2
          id="cta-heading"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-3xl md:text-5xl font-bold text-white mb-6 tracking-tight"
        >
          Vous avez du talent à revendre ?
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="text-xl text-white/90 mb-10"
        >
          Rejoignez les milliers de prestataires qui complètent leurs revenus chaque mois en aidant leurs voisins.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <button
            type="button"
            className="bg-white text-blue-600 hover:bg-slate-50 font-bold py-4 px-8 rounded-xl transition-colors shadow-lg flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
          >
            Devenir prestataire <ArrowRight className="ml-2 w-5 h-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="bg-blue-700 text-white hover:bg-blue-800 font-bold py-4 px-8 rounded-xl transition-colors border border-blue-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-600"
          >
            Découvrir le programme prestataire
          </button>
        </motion.div>
      </div>
    </section>
  );
}
