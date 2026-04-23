import React from "react";
import { motion } from "motion/react";
import { Search, UserCheck, CreditCard } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: <Search className="w-8 h-8 text-blue-600" aria-hidden="true" />,
      number: "1",
      title: "Décrivez votre besoin",
      description: "Précisez votre demande, la date et le lieu. Cela ne prend que quelques minutes."
    },
    {
      icon: <UserCheck className="w-8 h-8 text-blue-600" aria-hidden="true" />,
      number: "2",
      title: "Choisissez votre prestataire",
      description: "Comparez les profils, les avis et les prix. Discutez avec les prestataires intéressés."
    },
    {
      icon: <CreditCard className="w-8 h-8 text-blue-600" aria-hidden="true" />,
      number: "3",
      title: "Payez en ligne",
      description: "Le paiement est sécurisé et le prestataire n'est payé qu'une fois le travail terminé."
    }
  ];

  return (
    <section className="py-24 bg-slate-50 border-y border-slate-200" aria-labelledby="how-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 id="how-heading" className="text-3xl font-bold text-slate-900 tracking-tight mb-4">Comment ça marche&nbsp;?</h2>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-16">
          Réserver un service n'a jamais été aussi simple — en 3 étapes.
        </p>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-12 relative list-none p-0">
          <div className="hidden md:block absolute top-12 left-[15%] right-[15%] h-0.5 bg-slate-200 z-0" aria-hidden="true"></div>

          {steps.map((step, index) => (
            <motion.li
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.2 }}
              className="relative z-10 flex flex-col items-center"
            >
              <div className="relative w-24 h-24 bg-white rounded-full shadow-md flex items-center justify-center mb-6 border-4 border-slate-50">
                {step.icon}
                <span
                  aria-hidden="true"
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center"
                >
                  {step.number}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">
                <span className="sr-only">Étape {step.number} : </span>{step.title}
              </h3>
              <p className="text-slate-600">{step.description}</p>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}
