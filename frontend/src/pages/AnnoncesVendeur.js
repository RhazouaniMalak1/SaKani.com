// Dans pages/AnnoncesVendeur.js

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom"; // useNavigate peut être utile
import Layout from "../components/Layout"; // Adaptez le chemin si nécessaire
import { annonceService } from "../services/api"; // Adaptez le chemin si nécessaire
import { useAuth } from "../contexts/AuthContext"; // Pour vérifier les permissions de l'utilisateur connecté

// --- Icônes SVG ---
// Icône pour Voir les détails
const ViewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);
// Icône pour éditer
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
// Icône pour supprimer (Admin)
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
// Icône pour demander la suppression (Vendeur) - Inutilisée ici mais gardée pour référence
// const RequestDeleteIcon = () => <svg><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
// --- Fin Icônes ---

// Le nom du composant peut être modifié si vous préférez qqch comme RechercheAnnoncesVendeur
function AnnoncesVendeur() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Pour vérifier si l'utilisateur est Admin

  // État pour le champ de saisie de l'ID du vendeur
  const [vendeurIdInput, setVendeurIdInput] = useState("");
  // État pour stocker l'ID du vendeur une fois la recherche lancée
  const [targetVendeurId, setTargetVendeurId] = useState(null);
  // État pour stocker les annonces trouvées
  const [annoncesResult, setAnnoncesResult] = useState([]);
  // État pour le chargement pendant la recherche API
  const [loading, setLoading] = useState(false);
  // État pour les messages d'erreur
  const [error, setError] = useState(null);
  // État pour savoir si une recherche a déjà été effectuée
  const [searchPerformed, setSearchPerformed] = useState(false);

  // Récupère les annonces quand targetVendeurId change (après soumission du formulaire)
  useEffect(() => {
    // Ne fait rien si aucun ID n'est ciblé
    if (!targetVendeurId) {
      return;
    }

    const fetchAnnoncesVendeur = async () => {
      setLoading(true);
      setError(null);
      setAnnoncesResult([]); // Vide les résultats précédents
      try {
        // Appel API
        const response = await annonceService.getByVendeur(targetVendeurId);
        setAnnoncesResult(response.data); // Stocke les résultats
        // Si la réponse est vide, on peut le savoir via annoncesResult.length plus tard
      } catch (err) {
        // Gestion des erreurs
        console.error(`Erreur fetchAnnoncesVendeur pour ID ${targetVendeurId}:`, err);
        const errorMsg = err.response?.data?.message || "Erreur lors du chargement des annonces.";
        if (err.response?.status === 404) {
          setError(`Aucun vendeur ou annonce trouvé pour l'ID: ${targetVendeurId}.`);
        } else if (err.response?.status === 403) {
          setError("Accès refusé. Seuls les administrateurs peuvent utiliser cette fonctionnalité.");
          // Optionnel : rediriger si l'erreur 403 est due à un non-admin essayant d'accéder
          // if (!user?.roles?.includes('Admin')) setTimeout(() => navigate('/'), 3000);
        } else {
          setError(errorMsg);
        }
      } finally {
        setLoading(false); // Arrête le chargement
      }
    };

    fetchAnnoncesVendeur();
  }, [targetVendeurId]); // Se déclenche quand targetVendeurId est mis à jour

  // Gère la saisie dans le champ ID Vendeur
  const handleInputChange = (e) => {
    setVendeurIdInput(e.target.value);
  };

  // Gère la soumission du formulaire de recherche
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmedId = vendeurIdInput.trim();
    if (!trimmedId) {
      setError("Veuillez entrer un ID de vendeur valide.");
      setAnnoncesResult([]);
      setTargetVendeurId(null);
      setSearchPerformed(false); // Pas de recherche valide effectuée
      return;
    }
    setError(null); // Réinitialise l'erreur s'il y en avait une
    setSearchPerformed(true); // Marque qu'une recherche a été tentée
    setTargetVendeurId(trimmedId); // Déclenche le useEffect pour fetch les données
  };

  // Fonction pour la suppression physique par l'Admin (opère sur annoncesResult)
  const handleDelete = async (id, nomAnnonce) => {
    if (window.confirm(`Supprimer DÉFINITIVEMENT "${nomAnnonce}" ?`)) {
      try {
        await annonceService.delete(id);
        // Met à jour l'état en retirant l'annonce supprimée de la liste des résultats
        setAnnoncesResult(prev => prev.filter(a => a.id !== id));
        alert(`"${nomAnnonce}" supprimée.`);
      } catch (err) {
        console.error("Erreur lors de la suppression définitive:", err);
        const errorMsg = err.response?.data?.message || "Erreur lors de la suppression définitive.";
        alert(errorMsg);
      }
    }
  };

  // Fonction pour le style des badges (peut être déplacée dans un fichier utils)
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "neuf": return "badge badge-success";
      case "deuxieme main": return "badge badge-info";
      case "bonne occasion": return "badge badge-warning";
      default: return "badge";
    }
  };

  // Rendu JSX
  return (
    <Layout>
      <div className="header">
        <h1 className="page-title">Rechercher Annonces par Vendeur</h1>
        {/* Bouton pour retourner à la liste globale des annonces */}
        <Link to="/annonces" className="btn btn-secondary ml-auto">Voir toutes les annonces</Link>
      </div>

      {/* Formulaire de Recherche */}
      <div className="card mb-4">
        <div className="card-header">
          <h2 className="card-title">Recherche</h2>
        </div>
        <form onSubmit={handleSearchSubmit} className="card-content">
           <div className="search-container flex items-center gap-2"> {/* Utilisation de flexbox */}
             <label htmlFor="vendeurIdSearch" className="form-label sr-only">ID du Vendeur</label> {/* Label pour accessibilité */}
             <input
               type="text"
               id="vendeurIdSearch"
               placeholder="Entrez l'ID complet du Vendeur"
               className="form-input flex-grow" // Prend l'espace disponible
               value={vendeurIdInput}
               onChange={handleInputChange}
               required // Champ requis pour la soumission
             />
             <button type="submit" className="btn btn-primary" disabled={loading}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <span>{loading ? 'Recherche...' : 'Rechercher'}</span>
             </button>
           </div>
            {/* Affichage erreur de saisie */}
           {error && !loading && !targetVendeurId && searchPerformed && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>
      </div>
      {/* Fin Formulaire de Recherche */}


      {/* Section Résultats (affichée seulement après une recherche valide) */}
      {searchPerformed && targetVendeurId && (
          <div className="card">
             <div className="card-header">
                <h2 className="card-title">
                    Résultats pour Vendeur ID: <span className="font-mono text-sm bg-gray-100 px-1 rounded">{targetVendeurId}</span>
                </h2>
             </div>
            <div className="card-content">
              {/* Indicateur de chargement des résultats */}
              {loading && <div className="text-center py-4">Chargement des annonces...</div>}

              {/* Message d'erreur API */}
              {error && !loading && <div className="text-center py-4 text-red-500">{error}</div>}

              {/* Tableau des annonces (si pas de chargement et pas d'erreur) */}
              {!loading && !error && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th className="hidden md:table-cell">Description</th>
                        <th className="hidden sm:table-cell">Prix</th>
                        <th className="hidden lg:table-cell">Adresse</th>
                        <th className="hidden xl:table-cell">Statut</th>
                        <th>Demandé Suppr.?</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {annoncesResult.length > 0 ? (
                        // Itération sur les annonces trouvées
                        annoncesResult.map((annonce) => (
                          <tr key={annonce.id}>
                            {/* Affichage des données */}
                            <td className="font-bold">
                              <Link to={`/annonces/detail/${annonce.id}`} title={annonce.name}>
                                {annonce.name}
                              </Link>
                            </td>
                            <td className="hidden md:table-cell text-muted">{annonce.description?.substring(0, 40) + (annonce.description?.length > 40 ? '...' : '') || "-"}</td>
                            <td className="hidden sm:table-cell text-muted">{annonce.prix.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}</td>
                            <td className="hidden lg:table-cell text-muted">{annonce.adresseProduit || "-"}</td>
                            <td className="hidden xl:table-cell">{annonce.statut && <span className={getStatusBadgeClass(annonce.statut)}>{annonce.statut}</span>}</td>
                            <td>{annonce.deletionRequested ? <span className="badge badge-warning">Oui</span> : "Non"}</td>
                            {/* Actions (Seulement pour Admin sur cette page) */}
                            <td>
                              <div className="action-buttons">
                                {/* Voir Détails */}
                                <Link to={`/annonces/detail/${annonce.id}`} className="btn-icon-only text-blue-600" title="Voir Détails"><ViewIcon /></Link>
                                {/* Modifier (Admin) */}
                                {user && user.roles?.includes('Admin') && (
                                    <Link to={`/annonces/${annonce.id}`} className="btn-icon-only text-gray-600" title="Modifier"><EditIcon /></Link>
                                )}
                                {/* Supprimer (Admin) */}
                                {user && user.roles?.includes('Admin') && (
                                  <button onClick={() => handleDelete(annonce.id, annonce.name)} className="btn-icon-only text-red-600" title="Supprimer Définitivement"><DeleteIcon /></button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        // Message si la recherche n'a retourné aucune annonce
                        <tr>
                          <td colSpan="7" className="text-center py-4 text-muted">Aucune annonce trouvée pour cet ID de vendeur.</td>
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
          <p className="text-center text-muted mt-6">Veuillez entrer un ID de vendeur ci-dessus et cliquer sur Rechercher pour voir ses annonces.</p>
      )}

    </Layout>
  );
}

export default AnnoncesVendeur; // Assurez-vous que l'export correspond au nom de la fonction