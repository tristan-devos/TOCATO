import React from "react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

export function Categories() {
  const categories = [
    {
      title: "Montage de meubles",
      price: "Dès 25€ / heure",
      slug: "montage-meubles",
      image: "https://images.unsplash.com/photo-1671725501844-1e6d0081bf64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhc3NlbWJsaW5nJTIwZnVybml0dXJlfGVufDF8fHx8MTc3Njg3NTc4NXww&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      title: "Ménage à domicile",
      price: "Dès 18€ / heure",
      slug: "menage",
      image: "https://images.unsplash.com/photo-1575467678930-c7acd65d6470?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxob3VzZSUyMGNsZWFuaW5nJTIwcGVyc29ufGVufDF8fHx8MTc3Njg3NTc4OHww&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      title: "Aide au déménagement",
      price: "Dès 30€ / heure",
      slug: "demenagement",
      image: "https://images.unsplash.com/photo-1580451299338-3658f5b11930?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3ZpbmclMjBib3hlcyUyMGhvbWV8ZW58MXx8fHwxNzc2ODc1Nzg4fDA&ixlib=rb-4.1.0&q=80&w=1080",
    },
    {
      title: "Jardinage",
      price: "Dès 20€ / heure",
      slug: "jardinage",
      image: "https://images.unsplash.com/photo-1667627879457-6405b3183f00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnYXJkZW5pbmclMjBvdXRkb29yc3xlbnwxfHx8fDE3NzY4NzU3ODh8MA&ixlib=rb-4.1.0&q=80&w=1080",
    }
  ];

  return (
    <section className="py-24 bg-white" aria-labelledby="categories-heading">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 id="categories-heading" className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Services populaires</h2>
            <p className="text-lg text-slate-600">Les prestations les plus demandées par notre communauté.</p>
          </div>
          <Link
            to="/services"
            className="hidden md:inline-flex items-center text-blue-600 font-medium hover:text-blue-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-sm"
          >
            Voir tous les services <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
          </Link>
        </div>

        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 list-none p-0">
          {categories.map((cat, index) => (
            <motion.li
              key={cat.slug}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                to={`/services/${cat.slug}`}
                className="group block rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-slate-100 bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                aria-label={`${cat.title}, ${cat.price}`}
              >
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={cat.image}
                    alt=""
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" aria-hidden="true" />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{cat.title}</h3>
                  <p className="text-blue-600 font-medium text-sm">{cat.price}</p>
                </div>
              </Link>
            </motion.li>
          ))}
        </ul>
        <Link
          to="/services"
          className="mt-8 w-full md:hidden flex justify-center items-center text-blue-600 font-medium py-3 border border-blue-100 rounded-xl bg-blue-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        >
          Voir tous les services <ArrowRight className="ml-2 w-4 h-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
