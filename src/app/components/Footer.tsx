import React from "react";
import { Link } from "react-router";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export function Footer() {
  const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 rounded-sm";

  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-white text-xl font-bold mb-4 tracking-tight">tocato</h3>
            <p className="text-sm text-slate-400 mb-4">
              La plateforme de confiance pour tous vos services du quotidien. Trouvez le bon prestataire, au bon moment.
            </p>
            <ul className="flex gap-4 list-none p-0" aria-label="Réseaux sociaux">
              <li>
                <a href="/" aria-label="Tocato sur Facebook" className={`inline-flex p-2 -m-2 text-slate-400 hover:text-white transition-colors ${focusRing}`}>
                  <Facebook className="h-5 w-5" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a href="/" aria-label="Tocato sur Twitter" className={`inline-flex p-2 -m-2 text-slate-400 hover:text-white transition-colors ${focusRing}`}>
                  <Twitter className="h-5 w-5" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a href="/" aria-label="Tocato sur Instagram" className={`inline-flex p-2 -m-2 text-slate-400 hover:text-white transition-colors ${focusRing}`}>
                  <Instagram className="h-5 w-5" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a href="/" aria-label="Tocato sur LinkedIn" className={`inline-flex p-2 -m-2 text-slate-400 hover:text-white transition-colors ${focusRing}`}>
                  <Linkedin className="h-5 w-5" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </div>

          <nav aria-labelledby="footer-discover">
            <h4 id="footer-discover" className="text-white font-semibold mb-4">Découvrir</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className={`hover:text-white transition-colors ${focusRing}`}>Comment ça marche</Link></li>
              <li><Link to="/" className={`hover:text-white transition-colors ${focusRing}`}>Services populaires</Link></li>
              <li><Link to="/" className={`hover:text-white transition-colors ${focusRing}`}>Garantie & Assurance</Link></li>
              <li><Link to="/" className={`hover:text-white transition-colors ${focusRing}`}>Tarifs</Link></li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-providers">
            <h4 id="footer-providers" className="text-white font-semibold mb-4">Prestataires</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className={`hover:text-white transition-colors ${focusRing}`}>Devenir prestataire</Link></li>
              <li><Link to="/" className={`hover:text-white transition-colors ${focusRing}`}>Règles de la communauté</Link></li>
              <li><Link to="/" className={`hover:text-white transition-colors ${focusRing}`}>Centre d'aide</Link></li>
            </ul>
          </nav>

          <nav aria-labelledby="footer-legal">
            <h4 id="footer-legal" className="text-white font-semibold mb-4">Légal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className={`hover:text-white transition-colors ${focusRing}`}>Conditions générales</Link></li>
              <li><Link to="/" className={`hover:text-white transition-colors ${focusRing}`}>Politique de confidentialité</Link></li>
              <li><Link to="/" className={`hover:text-white transition-colors ${focusRing}`}>Mentions légales</Link></li>
              <li><Link to="/" className={`hover:text-white transition-colors ${focusRing}`}>Contact</Link></li>
            </ul>
          </nav>
        </div>

        <div className="pt-8 border-t border-slate-800 text-sm text-slate-400 flex flex-col md:flex-row justify-between items-center">
          <p>© {new Date().getFullYear()} Tocato. Tous droits réservés.</p>
          <p className="mt-2 md:mt-0">Fait avec passion en France.</p>
        </div>
      </div>
    </footer>
  );
}
