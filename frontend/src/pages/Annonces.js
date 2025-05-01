// Dans pages/Annonces.js

import { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Pour les liens vers les détails/création
import Layout from "../components/Layout"; // Assurez-vous que le chemin est correct
// Import du service Annonce
import { annonceService } from "../services/api"; // Assurez-vous que le chemin est correct
import { useAuth } from "../contexts/AuthContext"; // Import pour vérifier l'utilisateur connecté

// --- Icônes (Gardées ou à adapter) ---
const AnnonceIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line>
    </svg>
);
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
// const DeleteIcon = () => <svg>...</svg>; // Gardez si vous ajoutez la suppression admin ici
const RequestDeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
// --- Fin Icônes ---

function Annonces() {
  const [annonces, setAnnonces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth(); // Récupérer l'utilisateur connecté depuis le contexte

  // Fonction pour récupérer les annonces
  const fetchAnnonces = async () => {
    try {
      setLoading(true); // Mettre loading à true au début du fetch
      setError(null); // Réinitialiser les erreurs
      const response = await annonceService.getAll();
      setAnnonces(response.data);
    } catch (err) {
      setError("Erreur lors du chargement des annonces");
      console.error("Erreur fetchAnnonces:", err);
    } finally {
      setLoading(false); // Arrêter le loading dans tous les cas
    }
  };

  // Récupère les annonces au montage initial du composant
  useEffect(() => {
    fetchAnnonces();
  }, []); // Le tableau vide assure l'exécution une seule fois

  // Fonction pour demander la suppression d'une annonce
  const handleRequestDelete = async (id) => {
    // Confirmation utilisateur
    if (window.confirm("Êtes-vous sûr de vouloir demander la suppression de cette annonce ?")) {
      try {
        // Appel API pour demander la suppression
        await annonceService.requestDeletion(id);
        // Mettre à jour l'état local pour refléter le changement immédiatement
        setAnnonces(prevAnnonces =>
          prevAnnonces.map(a =>
            a.id === id ? { ...a, deletionRequested: true } : a
          )
        );
        // Afficher une notification (peut être amélioré avec un système de toasts)
        alert("Demande de suppression enregistrée. Un administrateur la traitera.");
      } catch (err) {
        console.error("Erreur lors de la demande de suppression:", err);
        // Afficher une erreur plus spécifique si possible
        const errorMsg = err.response?.data?.message || "Erreur lors de la demande de suppression.";
        alert(errorMsg);
      }
    }
  };

  // Filtrage des annonces basé sur le terme de recherche
  const filteredAnnonces = annonces.filter(
    (annonce) =>
      annonce.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (annonce.description && annonce.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (annonce.adresseProduit && annonce.adresseProduit.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (annonce.statut && annonce.statut.toLowerCase().includes(searchTerm.toLowerCase())) // Ajout filtre par statut
  );

  // Fonction pour obtenir la classe CSS du badge de statut
  const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "neuf": return "badge badge-success";
      case "deuxieme main": return "badge badge-info";
      case "bonne occasion": return "badge badge-warning";
      default: return "badge"; // Classe par défaut
    }
  };

  // Rendu du composant
  return (
    <Layout> {/* Utilise le composant Layout pour la structure générale */}
      <div className="header">
        <h1 className="page-title">Annonces</h1>
        {/* Affiche le bouton "Nouvelle Annonce" seulement si l'utilisateur est Vendeur ou Admin */}
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
             {/* Icône SVG pour la recherche (stylisation via CSS) */}
            <button className="search-button" aria-label="Rechercher">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            </button>
          </div>

          {/* Affichage pendant le chargement */}
          {loading && <div className="text-center py-4">Chargement des annonces...</div>}

          {/* Affichage en cas d'erreur */}
          {error && <div className="text-center py-4 text-red-500">{error}</div>}

          {/* Affichage du tableau si pas de chargement et pas d'erreur */}
          {!loading && !error && (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    {/* Entêtes de colonnes mis à jour pour inclure plus d'infos */}
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
                  {/* Affichage des annonces filtrées */}
                  {filteredAnnonces.length > 0 ? (
                    filteredAnnonces.map((annonce) => (
                      <tr key={annonce.id}>
                        {/* Colonne Nom (lien vers détail/modif) */}
                        <td className="font-bold">
                          <Link to={`/annonces/${annonce.id}`} title={annonce.name}>
                             {annonce.name.length > 25 ? `${annonce.name.substring(0, 25)}...` : annonce.name}
                          </Link>
                        </td>
                        {/* Colonne Description */}
                        <td className="hidden md:table-cell text-muted">
                          {annonce.description && annonce.description.length > 40
                            ? `${annonce.description.substring(0, 40)}...`
                            : annonce.description || "-"}
                        </td>
                         {/* Colonne Prix */}
                        <td className="hidden sm:table-cell text-muted">
                            {annonce.prix.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' })}
                        </td>
                         {/* Colonne Adresse */}
                        <td className="hidden lg:table-cell text-muted">{annonce.adresseProduit || "-"}</td>
                         {/* Colonne Statut */}
                        <td className="hidden xl:table-cell">
                          {annonce.statut && <span className={getStatusBadgeClass(annonce.statut)}>{annonce.statut}</span>}
                        </td>
                         {/* Colonne Date Création */}
                        <td className="hidden xl:table-cell text-muted">{new Date(annonce.dateCreation).toLocaleDateString()}</td>
                         {/* Colonne Demande Suppression */}
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
                            {/* Bouton Modifier/Détails (visible par tous) */}
                            <Link to={`/annonces/${annonce.id}`} className="btn-icon-only" title="Modifier / Voir détails">
                              <EditIcon />
                            </Link>
                            {/* Bouton Demander Suppression (visible SEULEMENT par le vendeur de l'annonce ET si pas déjà demandé) */}
                            {user && user.id === annonce.vendeurId && !annonce.deletionRequested && (
                              <button
                                className="btn-icon-only btn-warning"
                                title="Demander la suppression"
                                onClick={() => handleRequestDelete(annonce.id)}
                              >
                                <RequestDeleteIcon />
                              </button>
                            )}
                             {/* Vous ajouterez ici le bouton pour la suppression Admin si besoin (ex: sur une autre page admin) */}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Message si aucune annonce ne correspond à la recherche ou si la liste est vide
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