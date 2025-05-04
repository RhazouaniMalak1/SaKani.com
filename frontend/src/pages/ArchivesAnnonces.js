// Dans pages/ArchivesAnnonces.js

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout"; // Adaptez le chemin
import { annonceService } from "../services/api"; // Adaptez le chemin
import { useAuth } from "../contexts/AuthContext"; // Pour vérifier le rôle Admin

// --- Icônes ---
const HistoryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>;
// --- Fin Icônes ---

function ArchivesAnnonces() {
  const navigate = useNavigate();
  // Récupère user ET l'état de chargement initial du contexte
  const { user, loading: authLoading } = useAuth();

  const [archives, setArchives] = useState([]);
  // Gérer un état de chargement spécifique à CETTE page
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fonction pour récupérer les archives (INCHANGÉE)
  const fetchArchives = async () => {
    // Utilise pageLoading pour cette opération spécifique
    setPageLoading(true);
    setError(null);
    try {
      const response = await annonceService.getArchives();
      console.log("Archives reçues:", response.data); // Garder pour le débogage initial
      setArchives(response.data);
    } catch (err) {
      console.error("Erreur fetchArchives:", err);
      if (err.response?.status === 403) {
          setError("Accès refusé. Seuls les administrateurs peuvent voir les archives.");
      } else {
         setError("Erreur lors du chargement des archives.");
      }
    } finally {
      setPageLoading(false); // Fin du chargement de cette page
    }
  };

  // --- MODIFIÉ : useEffect ---
  useEffect(() => {
    // Attendre que l'authentification soit vérifiée (authLoading est false)
    if (authLoading) {
      console.log("Attente de la fin du chargement de l'authentification...");
      setPageLoading(true); // On considère que la page charge tant que l'auth n'est pas prête
      return; // Ne rien faire tant que l'état d'auth n'est pas défini
    }

    // Une fois l'authentification chargée :
    if (user && user.roles?.includes('Admin')) {
      // Si l'utilisateur est connecté ET est Admin, lancer le fetch
      console.log("Utilisateur Admin détecté, chargement des archives...");
      fetchArchives();
    } else {
      // Si pas connecté ou pas Admin après le chargement de l'auth
      console.warn("Utilisateur non admin ou non connecté après chargement auth. Redirection.");
      setError("Accès réservé aux administrateurs."); // Afficher une erreur avant de rediriger
      setPageLoading(false); // Arrêter le chargement de la page
      // Optionnel : rediriger après un délai pour voir le message
      // setTimeout(() => navigate(user ? '/' : '/login'), 1500);
       navigate(user ? '/' : '/login'); // Rediriger immédiatement
    }

  // Dépendances : 'user' et 'authLoading' pour réagir au changement d'état d'authentification
  }, [user, authLoading, navigate]);
  // --- FIN MODIFICATION useEffect ---


  // Fonction pour formater Date/Heure (INCHANGÉE)
  const formatDateTime = (dateString) => { /* ... */ };
  // Fonction pour formater le prix (INCHANGÉE)
  const formatPrice = (price) => { /* ... */ };

  // Rendu JSX
  return (
    <Layout>
      <div className="header">
        <h1 className="page-title">Archives des Annonces Supprimées</h1>
        <span className="text-sm text-muted ml-auto">Interface Administrateur</span>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Historique des Suppressions</h2>
          <p className="card-description">Liste des annonces qui ont été retirées du site.</p>
        </div>

        <div className="card-content">
          {/* Utilise pageLoading pour l'indicateur de cette page */}
          {pageLoading && <div className="text-center py-8 loading">Chargement des archives...</div>}
          {error && <div className="text-center py-8 error-message">{error}</div>}

          {/* Tableau affiché seulement si chargement terminé et pas d'erreur */}
          {!pageLoading && !error && (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nom Orig.</th>
                    <th>ID Orig.</th>
                    <th className="hidden sm:table-cell">Prix Orig.</th>
                    <th className="hidden md:table-cell">Vendeur Orig. (ID)</th>
                    <th className="hidden lg:table-cell">Supprimée le</th>
                    <th className="hidden xl:table-cell">Supprimée par</th>
                    {/*<th>Détails</th>*/}
                  </tr>
                </thead>
                <tbody>
                  {archives.length > 0 ? (
                    archives.map((archive) => (
                      <tr key={archive.id}>
                        <td className="font-medium" title={archive.description || archive.name}>{archive.name}</td>
                        <td className="text-center">{archive.annonceId}</td>
                        <td className="hidden sm:table-cell text-muted">{formatPrice(archive.prix)}</td>
                        <td className="hidden md:table-cell text-muted font-mono text-xs">{archive.vendeurId}</td>
                        <td className="hidden lg:table-cell text-muted">{formatDateTime(archive.dateSuppression)}</td>
                        <td className="hidden xl:table-cell text-muted">{archive.adminSuppresseurNom || archive.adminIdSuppresseur}</td>
                        {/*<td><button className="btn-icon-only text-blue-600" title="Voir détails archivés"><HistoryIcon /></button></td>*/}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">Aucune annonce n'a été archivée.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default ArchivesAnnonces;