// Dans pages/AnnonceVisiteurs.js

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout"; // Adapter le chemin
import { annonceClientService, annonceService } from "../services/api"; // Adapter le chemin, ajout annonceService pour vérifier existence annonce
import { useAuth } from "../contexts/AuthContext"; // Pour vérifier le rôle Admin

// Optionnel: Icône pour un utilisateur/visiteur
const VisitorIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);


function AnnonceVisiteurs() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Pour vérifier si l'utilisateur est Admin

  // --- États ---
  const [annonceIdInput, setAnnonceIdInput] = useState(""); // Champ de saisie pour l'ID annonce
  const [targetAnnonceId, setTargetAnnonceId] = useState(null); // ID Annonce recherché
  const [annonceName, setAnnonceName] = useState(""); // Pour afficher le nom de l'annonce recherchée
  const [visiteursResult, setVisiteursResult] = useState([]); // Liste des visiteurs trouvés (UserInfoDto)
  const [loading, setLoading] = useState(false); // Chargement de la recherche
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false); // Recherche lancée ?

  // Vérifier si l'utilisateur est admin au chargement
  // Rediriger si non-admin essaie d'accéder (sécurité supplémentaire à celle de la route)
  useEffect(() => {
    if (user && !user.roles?.includes('Admin')) {
      console.warn("Accès non autorisé à la page AnnonceVisiteurs.");
      navigate('/'); // Redirige vers l'accueil
    }
  }, [user, navigate]);

  // Effet pour récupérer les visiteurs APRÈS avoir défini targetAnnonceId
  useEffect(() => {
    if (!targetAnnonceId) {
      return; // Ne rien faire si aucun ID n'est ciblé
    }

    const fetchVisiteurs = async () => {
      setLoading(true);
      setError(null);
      setVisiteursResult([]);
      setAnnonceName(""); // Réinitialiser le nom

      try {
        // Étape 1: Vérifier si l'annonce existe et récupérer son nom (optionnel mais mieux)
        try {
            const annonceInfo = await annonceService.getById(targetAnnonceId);
            setAnnonceName(annonceInfo.data.name); // Stocker le nom pour l'affichage
        } catch (annonceError) {
             if (annonceError.response?.status === 404) {
                throw new Error(`L'annonce avec l'ID ${targetAnnonceId} n'existe pas.`);
             } else {
                 throw annonceError; // Relancer une autre erreur
             }
        }

        // Étape 2: Récupérer les visiteurs pour cette annonce
        const response = await annonceClientService.getVisiteurs(targetAnnonceId);
        setVisiteursResult(response.data);

      } catch (err) {
        console.error(`Erreur fetchVisiteurs pour Annonce ID ${targetAnnonceId}:`, err);
        // Utiliser le message de l'erreur lancée ou un message générique
        setError(err.message || "Erreur lors du chargement des visiteurs.");
      } finally {
        setLoading(false);
        setSearchPerformed(true); // Marquer qu'une recherche est terminée
      }
    };

    fetchVisiteurs();
  }, [targetAnnonceId]); // Dépendance unique

  // Gérer la saisie dans le champ ID Annonce
  const handleInputChange = (e) => {
    // Permettre seulement les chiffres pour un ID numérique
    const value = e.target.value.replace(/[^0-9]/g, '');
    setAnnonceIdInput(value);
  };

  // Gérer la soumission du formulaire de recherche
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmedId = annonceIdInput.trim();
    if (!trimmedId) {
      setError("Veuillez entrer un ID d'annonce valide.");
      setVisiteursResult([]);
      setTargetAnnonceId(null);
      setSearchPerformed(false);
      setAnnonceName("");
      return;
    }
    setError(null);
    setSearchPerformed(true);
    setTargetAnnonceId(parseInt(trimmedId, 10)); // Convertir en nombre entier
  };

  // Rendu JSX
  return (
    <Layout>
      <div className="header">
        <h1 className="page-title">Visiteurs par Annonce</h1>
        <Link to="/annonces" className="btn btn-secondary ml-auto">Retour aux annonces</Link>
      </div>

      {/* Formulaire de Recherche */}
      <div className="card mb-4">
        <div className="card-header">
          <h2 className="card-title">Rechercher les Visiteurs d'une Annonce</h2>
        </div>
        <form onSubmit={handleSearchSubmit} className="card-content">
           <div className="search-container flex items-center gap-2">
             <label htmlFor="annonceIdSearch" className="form-label sr-only">ID de l'Annonce</label>
             <input
               type="number" // Utiliser type number
               id="annonceIdSearch"
               placeholder="Entrez l'ID numérique de l'Annonce"
               className="form-input flex-grow"
               value={annonceIdInput}
               onChange={handleInputChange}
               min="1" // ID est généralement positif
               required
             />
             <button type="submit" className="btn btn-primary" disabled={loading}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <span>{loading && targetAnnonceId ? 'Recherche...' : 'Rechercher'}</span>
             </button>
           </div>
           {/* Affichage erreur de saisie */}
           {error && !loading && !targetAnnonceId && searchPerformed && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>
      </div>
      {/* Fin Formulaire de Recherche */}

      {/* Section Résultats */}
      {/* Afficher seulement si une recherche a été lancée */}
      {searchPerformed && targetAnnonceId && (
          <div className="card">
             <div className="card-header">
                {/* Titre dynamique des résultats */}
                <h2 className="card-title">
                    {loading ? "Recherche en cours..." : `Visiteurs pour l'annonce ${targetAnnonceId}${annonceName ? ` (${annonceName})` : ''}`}
                </h2>
             </div>
            <div className="card-content">
              {/* Indicateur de chargement */}
              {loading && <div className="text-center py-4">Chargement des visiteurs...</div>}

              {/* Message d'erreur API */}
              {error && !loading && <div className="text-center py-4 text-red-500">{error}</div>}

              {/* Tableau des visiteurs (si pas de chargement et pas d'erreur) */}
              {!loading && !error && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        {/* Entêtes de colonnes pour les infos visiteurs */}
                        <th>Nom Complet</th>
                        <th className="hidden sm:table-cell">Email / Username</th>
                        <th className="hidden md:table-cell">Rôles</th>
                        {/* Pas d'actions ici généralement */}
                      </tr>
                    </thead>
                    <tbody>
                      {visiteursResult.length > 0 ? (
                        // Itération sur les visiteurs trouvés
                        visiteursResult.map((visiteur) => (
                          <tr key={visiteur.id}>
                            {/* Affichage des données du visiteur (UserInfoDto) */}
                            <td className="font-medium">{visiteur.prenom || ''} {visiteur.nom || ''}</td>
                            <td className="hidden sm:table-cell text-muted">{visiteur.email || visiteur.userName || 'N/A'}</td>
                            <td className="hidden md:table-cell text-muted">{visiteur.roles?.join(', ') || 'Client'}</td> {/* Affiche les rôles ou 'Client' par défaut */}
                          </tr>
                        ))
                      ) : (
                        // Message si la recherche est faite mais ne retourne aucun visiteur
                        <tr>
                          <td colSpan="3" className="text-center py-4 text-muted">Aucun visiteur trouvé pour cette annonce.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
       {/* Message initial avant la première recherche */}
       {!searchPerformed && (
            <p className="text-center text-muted mt-6">Entrez l'ID d'une annonce pour voir qui l'a consultée.</p>
       )}
    </Layout>
  );
}

export default AnnonceVisiteurs;