// Dans pages/ClientAnnoncesVisitees.js

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout"; // Adaptez le chemin si nécessaire
import { annonceClientService, annonceService } from "../services/api"; // Adaptez le chemin si nécessaire
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
// --- Fin Icônes ---

function ClientAnnoncesVisitees() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Pour vérifier si l'utilisateur est Admin

  // --- États ---
  const [clientIdInput, setClientIdInput] = useState(""); // Champ de saisie pour l'ID client
  const [targetClientId, setTargetClientId] = useState(null); // ID Client recherché
  const [clientName, setClientName] = useState(""); // Pour afficher le nom du client (optionnel)
  const [annoncesVisiteesResult, setAnnoncesVisiteesResult] = useState([]); // Liste des annonces trouvées
  const [loading, setLoading] = useState(false); // Chargement de la recherche
  const [error, setError] = useState(null);
  const [searchPerformed, setSearchPerformed] = useState(false); // Recherche lancée ?

  // Vérifier si l'utilisateur est admin au chargement (sécurité côté client)
  useEffect(() => {
    // Cette vérification est une sécurité supplémentaire, la route doit aussi être protégée dans App.js
    if (user && !user.roles?.includes('Admin')) {
      console.warn("Tentative d'accès non autorisé à la page ClientAnnoncesVisitees.");
      navigate('/'); // Rediriger vers l'accueil par exemple
    }
  }, [user, navigate]);

  // Effet pour récupérer les annonces visitées APRÈS avoir défini targetClientId
  useEffect(() => {
    if (!targetClientId) {
      return; // Ne rien faire si aucun ID n'est ciblé
    }

    const fetchAnnoncesVisitees = async () => {
      setLoading(true);
      setError(null);
      setAnnoncesVisiteesResult([]);
      setClientName(""); // Réinitialiser le nom (si vous le récupériez)

      try {
        // Optionnel : Vérifier si le client existe avant de chercher son historique
        // try {
        //     const clientExists = await authService.checkUserExists(targetClientId); // Endpoint hypothétique
        // } catch (clientError) {
        //      throw new Error(`Le client avec l'ID ${targetClientId} n'existe pas ou erreur API.`);
        // }

        // Récupérer les annonces visitées
        const response = await annonceClientService.getAnnoncesVisitees(targetClientId);
        setAnnoncesVisiteesResult(response.data);

      } catch (err) {
        console.error(`Erreur fetchAnnoncesVisitees pour Client ID ${targetClientId}:`, err);
        const errorMsg = err.response?.data?.message || err.message || "Erreur lors du chargement de l'historique.";
        if (err.response?.status === 404) {
            // L'API getAnnoncesVisitees peut retourner 404 si le client n'existe pas
            // ou si l'admin n'a pas les droits (mais on est censé être admin ici)
            setError(`Aucun historique trouvé pour le client ID ${targetClientId} ou client inexistant.`);
        } else {
            setError(errorMsg);
        }
      } finally {
        setLoading(false);
        setSearchPerformed(true);
      }
    };

    fetchAnnoncesVisitees();
  }, [targetClientId]); // Dépendance unique


  // Gérer la saisie dans le champ ID Client
  const handleInputChange = (e) => {
    setClientIdInput(e.target.value);
  };

  // Gérer la soumission du formulaire de recherche
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const trimmedId = clientIdInput.trim();
    if (!trimmedId) {
      setError("Veuillez entrer un ID de client.");
      setAnnoncesVisiteesResult([]);
      setTargetClientId(null);
      setSearchPerformed(false);
      setClientName("");
      return;
    }
    setError(null);
    setSearchPerformed(true);
    setTargetClientId(trimmedId); // L'ID client est une chaîne (GUID)
  };

   // Fonction pour le style des badges (peut être partagée)
   const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "neuf": return "badge badge-success";
      case "deuxieme main": return "badge badge-info";
      case "bonne occasion": return "badge badge-warning";
      default: return "badge";
    }
   };

   // Fonction de suppression physique (si l'admin peut supprimer depuis cette liste)
   // Vous devez copier/importer cette fonction si vous activez le bouton supprimer
   const handleDelete = async (id, nomAnnonce) => {
     if (window.confirm(`Supprimer DÉFINITIVEMENT "${nomAnnonce}" ?`)) {
       try {
         await annonceService.delete(id);
         setAnnoncesVisiteesResult(prev => prev.filter(a => a.id !== id)); // Met à jour la liste affichée
         alert(`"${nomAnnonce}" supprimée.`);
       } catch (err) {
         console.error("Erreur lors de la suppression définitive:", err);
         alert(err.response?.data?.message || "Erreur lors de la suppression.");
       }
     }
   };


  // Rendu JSX
  return (
    <Layout>
      <div className="header">
        <h1 className="page-title">Historique des Visites par Client</h1>
        <Link to="/" className="btn btn-secondary ml-auto">Retour au Dashboard</Link>
      </div>

      {/* Formulaire de Recherche */}
      <div className="card mb-4">
        <div className="card-header">
          <h2 className="card-title">Rechercher l'Historique</h2>
        </div>
        <form onSubmit={handleSearchSubmit} className="card-content">
           <div className="search-container flex items-center gap-2">
             <label htmlFor="clientIdSearch" className="form-label sr-only">ID du Client</label>
             <input
               type="text" // GUID est une chaîne
               id="clientIdSearch"
               placeholder="Entrez l'ID complet du Client (ex: ba107f0d...)"
               className="form-input flex-grow"
               value={clientIdInput}
               onChange={handleInputChange}
               required
             />
             <button type="submit" className="btn btn-primary" disabled={loading && targetClientId}> {/* Désactivé pendant le chargement des résultats */}
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                <span>{loading && targetClientId ? 'Recherche...' : 'Rechercher'}</span>
             </button>
           </div>
            {/* Affichage erreur de saisie ou erreur API avant résultats */}
           {error && !loading && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </form>
      </div>
      {/* Fin Formulaire de Recherche */}


      {/* Section Résultats */}
      {/* Afficher seulement si une recherche a été lancée */}
      {searchPerformed && targetClientId && (
          <div className="card">
             <div className="card-header">
                <h2 className="card-title">
                    {loading ? "Recherche en cours..." : `Annonces visitées par Client ID: ${targetClientId}`}
                    {/* Affiche le nom si on l'avait récupéré: ${clientName ? ` (${clientName})` : ''} */}
                </h2>
             </div>
            <div className="card-content">
              {loading && <div className="text-center py-4">Chargement de l'historique...</div>}
              {!loading && error && <div className="text-center py-4 text-red-500">{error}</div>} {/* Affiche l'erreur API ici */}

              {/* Tableau des annonces visitées */}
              {!loading && !error && (
                <div className="table-container">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Nom Annonce</th>
                        <th className="hidden sm:table-cell">Prix</th>
                        <th className="hidden lg:table-cell">Adresse</th>
                        <th className="hidden xl:table-cell">Statut</th>
                        <th>Demandé Suppr.?</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {annoncesVisiteesResult.length > 0 ? (
                        annoncesVisiteesResult.map((annonce) => (
                          <tr key={annonce.id}>
                            <td className="font-bold">
                               <Link to={`/annonces/detail/${annonce.id}`} title={annonce.name}>{annonce.name}</Link>
                            </td>
                            <td className="hidden sm:table-cell text-muted">{annonce.prix.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}</td>
                            <td className="hidden lg:table-cell text-muted">{annonce.adresseProduit || "-"}</td>
                            <td className="hidden xl:table-cell">{annonce.statut && <span className={getStatusBadgeClass(annonce.statut)}>{annonce.statut}</span>}</td>
                            <td>{annonce.deletionRequested ? <span className="badge badge-warning">Oui</span> : "Non"}</td>
                            <td>
                              <div className="action-buttons">
                                {/* Voir Détails (Admin) */}
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
                        // Message si aucune annonce n'a été visitée par ce client
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-muted">Ce client n'a consulté aucune annonce enregistrée.</td>
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
          <p className="text-center text-muted mt-6">Entrez l'ID d'un client pour voir les annonces qu'il a consultées.</p>
      )}

    </Layout>
  );
}

export default ClientAnnoncesVisitees;