import React from "react";
import { motion } from "motion/react";
import { ShieldCheck, Star, Clock } from "lucide-react";

export function Trust() {
  const features = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-700" aria-hidden="true" />,
      title: "Assurance incluse",
      desc: "Toutes les prestations sont couvertes par notre assurance partenaire."
    },
    {
      icon: <Star className="w-6 h-6 text-amber-600" aria-hidden="true" />,
      title: "Profils vérifiés",
      desc: "L'identité et les compétences de nos prestataires sont rigoureusement contrôlées."
    },
    {
      icon: <Clock className="w-6 h-6 text-blue-600" aria-hidden="true" />,
      title: "Support 7j/7",
      desc: "Notre équipe est disponible tous les jours pour vous accompagner."
    }
  ];

  return (
    <section className="py-24 bg-white" aria-labelledby="trust-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1461938337379-4b537cd2db74?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxoYW5keW1hbiUyMHNtaWxpbmd8ZW58MXx8fHwxNzc2ODc1Nzk1fDA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Prestataire Tocato souriant"
                loading="lazy"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute bottom-6 left-6 right-6 bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-lg">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center" aria-hidden="true">
                    <Star className="w-6 h-6 text-emerald-700 fill-emerald-700" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900">4.9/5 de moyenne</p>
                    <p className="text-sm text-slate-600">Basé sur plus de 10 000 avis</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Decoration blobs */}
            <div className="absolute -top-6 -left-6 w-24 h-24 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-70" aria-hidden="true"></div>
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-emerald-100 rounded-full mix-blend-multiply filter blur-xl opacity-70" aria-hidden="true"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2"
          >
            <h2 id="trust-heading" className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-6">
              Votre tranquillité d'esprit est notre priorité
            </h2>
            <p className="text-lg text-slate-600 mb-10">
              Avec Tocato, réservez en toute confiance. Nous mettons tout en œuvre pour vous garantir une expérience sécurisée et de qualité.
            </p>

            <ul className="space-y-8 list-none p-0">
              {features.map((feature, idx) => (
                <li key={idx} className="flex gap-4">
                  <div className="mt-1 bg-slate-50 p-3 rounded-xl h-fit border border-slate-100">
                    {feature.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600">{feature.desc}</p>
                  </div>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className="mt-10 bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 font-bold py-3 px-8 rounded-xl transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              En savoir plus sur nos garanties
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
