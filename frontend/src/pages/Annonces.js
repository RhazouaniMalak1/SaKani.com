// Dans pages/Annonces.js

import React, { useState, useEffect } from "react"; // Ajout de React pour JSX
import { Link } from "react-router-dom"; // Pour les liens vers les détails/création
import Layout from "../components/Layout"; // Assurez-vous que le chemin est correct
// Import du service Annonce
import { annonceService } from "../services/api"; // Assurez-vous que le chemin est correct
import { useAuth } from "../contexts/AuthContext"; // Import pour vérifier l'utilisateur connecté

// --- Icônes SVG ---
// Icône générique pour une annonce (optionnelle ici)
// const AnnonceIcon = () => ( /* ... */ );
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
// Icône pour demander la suppression (Vendeur)
const RequestDeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
// --- Fin Icônes ---

function Annonces() {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth(); // Récupérer l'utilisateur connecté

  // Fonction pour récupérer les annonces depuis l'API
  const fetchAnnonces = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await annonceService.getAll();
      setAnnonces(response.data);
    } catch (err) {
      setError("Erreur lors du chargement des annonces");
      console.error("Erreur fetchAnnonces:", err);
    } finally {
      setLoading(false);
    }
  };

  // Exécute fetchAnnonces une seule fois au montage du composant
  useEffect(() => {
    fetchAnnonces();
  }, []);

  // Fonction pour demander la suppression (par le vendeur)
  const handleRequestDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir demander la suppression de cette annonce ?")) {
      try {
        await annonceService.requestDeletion(id);
        setAnnonces(prevAnnonces =>
          prevAnnonces.map(a =>
            a.id === id ? { ...a, deletionRequested: true } : a
          )
        );
        alert("Demande de suppression enregistrée. Un administrateur la traitera.");
      } catch (err) {
        console.error("Erreur lors de la demande de suppression:", err);
        const errorMsg = err.response?.data?.message || "Erreur lors de la demande de suppression.";
        alert(errorMsg);
      }
    }
  };

  // Fonction pour la suppression physique par l'Admin
  const handleDelete = async (id, nomAnnonce) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer DÉFINITIVEMENT l'annonce "${nomAnnonce}" ? Cette action est irréversible.`)) {
      try {
        await annonceService.delete(id); // Appel au service API standard de suppression
        // Met à jour l'état en retirant l'annonce supprimée
        setAnnonces(prevAnnonces => prevAnnonces.filter(a => a.id !== id));
        alert(`Annonce "${nomAnnonce}" supprimée définitivement.`);
      } catch (err) {
        console.error("Erreur lors de la suppression définitive:", err);
        const errorMsg = err.response?.data?.message || "Erreur lors de la suppression définitive de l'annonce.";
        alert(errorMsg);
      }
    }
  };

  // Filtrage des annonces pour la barre de recherche
  const filteredAnnonces = annonces.filter(
    (annonce) =>
      annonce.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (annonce.description && annonce.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (annonce.adresseProduit && annonce.adresseProduit.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (annonce.statut && annonce.statut.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Style des badges de statut
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "neuf": return "badge badge-success";
      case "deuxieme main": return "badge badge-info";
      case "bonne occasion": return "badge badge-warning";
      default: return "badge";
    }
  };

  // Rendu JSX du composant
  return (
    <Layout>
      <div className="header">
        <h1 className="page-title">Annonces</h1>
        {/* Bouton Nouvelle Annonce conditionnel */}
        {user && (user.roles?.includes('Vendeur') || user.roles?.includes('Admin')) && (
            <Link to="/annonces/new" className="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Nouvelle Annonce
            </Link>
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Liste des Annonces</h2>
          <p className="card-description">Consultez toutes les annonces disponibles</p>
        </div>

        <div className="card-content">
          {/* Barre de recherche */}
          <div className="search-container">
            <input
              type="text"
              placeholder="Rechercher par nom, description, adresse, statut..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button className="search-button" aria-label="Rechercher">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </div>

          {/* Indicateur de chargement */}
          {loading && <div className="text-center py-4">Chargement des annonces...</div>}

          {/* Message d'erreur */}
          {error && <div className="text-center py-4 text-red-500">{error}</div>}

          {/* Tableau des annonces */}
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
                    <th className="hidden xl:table-cell">Crée le</th>
                    <th>Demandé Suppr.?</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAnnonces.length > 0 ? (
                    filteredAnnonces.map((annonce) => (
                      <tr key={annonce.id}>
                        {/* Colonnes de données */}
                        <td className="font-bold">
                           {/* Le nom pointe toujours vers le détail/modif si autorisé */}
                           {user && (user.id === annonce.vendeurId || user.roles?.includes('Admin')) ? (
                             <Link to={`/annonces/${annonce.id}`} title={`Modifier/Voir détails : ${annonce.name}`}>
                               {annonce.name.length > 25 ? `${annonce.name.substring(0, 25)}...` : annonce.name}
                             </Link>
                           ) : (
                             // Sinon, lien vers la page de détail simple
                             <Link to={`/annonces/detail/${annonce.id}`} title={`Voir détails : ${annonce.name}`}>
                               {annonce.name.length > 25 ? `${annonce.name.substring(0, 25)}...` : annonce.name}
                             </Link>
                           )}
                        </td>
                        <td className="hidden md:table-cell text-muted">
                          {annonce.description && annonce.description.length > 40
                            ? `${annonce.description.substring(0, 40)}...`
                            : annonce.description || "-"}
                        </td>
                        <td className="hidden sm:table-cell text-muted">
                            {annonce.prix.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
                        </td>
                        <td className="hidden lg:table-cell text-muted">{annonce.adresseProduit || "-"}</td>
                        <td className="hidden xl:table-cell">
                          {annonce.statut && <span className={getStatusBadgeClass(annonce.statut)}>{annonce.statut}</span>}
                        </td>
                        <td className="hidden xl:table-cell text-muted">{new Date(annonce.dateCreation).toLocaleDateString()}</td>
                        <td>
                          {annonce.deletionRequested ? (
                             <span className="badge badge-warning" title="Demande de suppression en attente">Demandé</span>
                           ) : (
                             <span className="text-muted">Non</span>
                           )}
                         </td>
                         {/* Colonne Actions */}
                        <td>
                          <div className="action-buttons">
                             {/* --- AJOUT : Bouton Voir Détails --- */}
                             {user && ( // Afficher pour tous les utilisateurs connectés
                                <Link
                                  to={`/annonces/detail/${annonce.id}`} // Pointe vers la route de détails
                                  className="btn-icon-only text-blue-600 hover:text-blue-800" // Style pour voir
                                  title="Voir les détails"
                                >
                                  <ViewIcon />
                                </Link>
                             )}
                             {/* --- FIN AJOUT --- */}

                            {/* Modifier (Admin ou Vendeur propriétaire) */}
                            {user && (user.id === annonce.vendeurId || user.roles?.includes('Admin')) && (
                               <Link to={`/annonces/${annonce.id}`} className="btn-icon-only text-gray-600 hover:text-gray-900" title="Modifier">
                                  <EditIcon />
                                </Link>
                            )}

                            {/* Demander Suppression (Vendeur propriétaire uniquement) */}
                            {user && user.id === annonce.vendeurId && !annonce.deletionRequested && (
                              <button
                                className="btn-icon-only text-yellow-600 hover:text-yellow-800"
                                title="Demander la suppression"
                                onClick={() => handleRequestDelete(annonce.id)}
                              >
                                <RequestDeleteIcon />
                              </button>
                            )}

                            {/* Supprimer Définitivement (Admin uniquement) */}
                            {user && user.roles?.includes('Admin') && (
                              <button
                                className="btn-icon-only text-red-600 hover:text-red-800"
                                title="Supprimer définitivement"
                                onClick={() => handleDelete(annonce.id, annonce.name)}
                              >
                                <DeleteIcon />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Message si aucune annonce
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-muted">
                        {annonces.length === 0 ? "Aucune annonce à afficher." : "Aucune annonce ne correspond à votre recherche."}
                      </td>
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

export default Annonces;