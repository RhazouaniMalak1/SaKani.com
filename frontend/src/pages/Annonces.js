// Dans pages/Annonces.js

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout"; // Adaptez le chemin si nécessaire
import { annonceService } from "../services/api"; // Adaptez le chemin si nécessaire
import { useAuth } from "../contexts/AuthContext"; // Pour vérifier l'utilisateur connecté

// --- Icônes SVG (Définies directement ici pour un fichier unique) ---
const ViewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);
const EditIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>;
const DeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="red" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const RequestDeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>;
const PlaceholderIcon = () => ( <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg> );
// --- Fin Icônes ---

// --- URL Base Images (À configurer correctement) ---
const IMAGE_BASE_URL = process.env.REACT_APP_API_URL_BASE || 'http://localhost:5049';
const IMAGE_FOLDER_PATH = '/Uploads/Annonces/';
// --- Fin URL ---

// --- Fonctions Helper ---
// Formate le prix en devise MAD sans centimes
const formatPrice = (price) => {
    if (price == null || isNaN(price)) return "N/A";
    return price.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
// Retourne la classe CSS pour le badge de statut
const getStatusBadgeClass = (status) => {
    const statusClean = status?.trim().toLowerCase() || '';
    switch (statusClean) {
      case "neuf": return "badge badge-success";
      case "bonne occasion": return "badge badge-warning";
      case "deuxieme main": return "badge badge-info"; // Note: Mettre 'Deuxième Main' dans le backend pour correspondre
      default: return "badge"; // Classe grise par défaut
    }
};
// Gère les erreurs de chargement d'image
const handleImageError = (event) => {
    event.target.onerror = null; // Empêche boucle si placeholder échoue
    event.target.src = '/asset/placeholder.png'; // Chemin vers placeholder dans public/
    event.target.alt = 'Image non disponible';
    event.target.style.objectFit = 'contain'; // Adapte l'affichage du placeholder
};
// --- Fin Fonctions Helper ---


function Annonces() {
  const [annonces, setAnnonces] = useState([]); // Liste complète des annonces
  const [loading, setLoading] = useState(true);  // Indicateur de chargement initial
  const [error, setError] = useState(null);    // Message d'erreur
  const [searchTerm, setSearchTerm] = useState(""); // Terme de recherche saisi
  const { user } = useAuth(); // Informations de l'utilisateur connecté

  // Fonction pour récupérer toutes les annonces depuis l'API
  const fetchAnnonces = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await annonceService.getAll();
      console.log("Données Annonces reçues:", response.data);
      setAnnonces(response.data); // Met à jour l'état avec les données
    } catch (err) {
      setError("Erreur lors du chargement des annonces");
      console.error("Erreur fetchAnnonces:", err);
    } finally {
      setLoading(false); // Arrête le chargement
    }
  };

  // Charge les annonces une seule fois au montage du composant
  useEffect(() => {
    fetchAnnonces();
  }, []); // Le tableau vide signifie exécution unique au montage

  // Fonction pour gérer la demande de suppression par le vendeur
  const handleRequestDelete = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir demander la suppression de cette annonce ?")) {
      try {
        await annonceService.requestDeletion(id); // Appel API
        // Met à jour l'état local pour affichage immédiat
        setAnnonces(prevAnnonces =>
          prevAnnonces.map(a =>
            a.id === id ? { ...a, deletionRequested: true } : a
          )
        );
        alert("Demande de suppression enregistrée.");
      } catch (err) {
        console.error("Erreur demande suppression:", err);
        alert(err.response?.data?.message || "Erreur demande.");
      }
    }
  };

  // Fonction pour gérer la suppression physique par l'Admin
  const handleDelete = async (id, nomAnnonce) => {
    if (window.confirm(`Supprimer DÉFINITIVEMENT "${nomAnnonce}" ? Action irréversible.`)) {
      try {
        await annonceService.delete(id); // Appel API
        // Met à jour l'état local en retirant l'annonce
        setAnnonces(prevAnnonces => prevAnnonces.filter(a => a.id !== id));
        alert(`"${nomAnnonce}" supprimée.`);
      } catch (err) {
        console.error("Erreur suppression définitive:", err);
        alert(err.response?.data?.message || "Erreur suppression.");
      }
    }
  };

  // Filtrage des annonces basé sur le terme de recherche
  const filteredAnnonces = annonces.filter(
    (annonce) =>
      annonce.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (annonce.description && annonce.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (annonce.adresseProduit && annonce.adresseProduit.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (annonce.statut && annonce.statut.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (annonce.telephone && annonce.telephone.includes(searchTerm))
  );

  // Rendu JSX du composant
  return (
    <Layout>
      {/* En-tête de la page */}
      <div className="header">
        <h1 className="page-title">Catalogue des Annonces</h1>
        {/* Bouton "Nouvelle Annonce" visible seulement par Vendeur ou Admin */}
        {user && (user.roles?.includes('Vendeur') || user.roles?.includes('Admin')) && (
            <Link to="/annonces/new" className="btn btn-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Nouvelle Annonce
            </Link>
        )}
      </div>

      {/* Barre de recherche */}
      <div className="search-container mb-4 card p-4"> {/* Mise dans une carte pour style cohérent */}
            <label htmlFor="searchAnnonce" className="form-label sr-only">Rechercher</label>
            <div className="flex gap-2">
                <input
                type="text"
                id="searchAnnonce"
                placeholder="Rechercher une annonce..."
                className="search-input form-input flex-grow" // Utilise flex-grow
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                />
                {/* Optionnel : bouton pour effacer la recherche */}
                {searchTerm && (
                    <button onClick={() => setSearchTerm('')} className="btn btn-secondary" type="button">X</button>
                )}
            </div>
       </div>

      {/* Affichage pendant le chargement */}
      {loading && <div className="loading text-center py-8">Chargement des annonces...</div>}

      {/* Affichage en cas d'erreur de chargement */}
      {error && <div className="error-message text-center py-8">{error}</div>}

      {/* Grille des Annonces (si pas en chargement et pas d'erreur) */}
      {!loading && !error && (
        <div className="annonces-grid"> {/* Conteneur pour la grille de cartes */}
          {filteredAnnonces.length > 0 ? (
            // Itération sur les annonces filtrées pour créer une carte pour chaque
            filteredAnnonces.map((annonce) => {
               const imageUrl = annonce.image ? `${IMAGE_BASE_URL}${IMAGE_FOLDER_PATH}${annonce.image}` : null;
               return (
                // --- Carte Annonce Individuelle ---
                <div key={annonce.id} className="annonce-card">
                    {/* Lien image vers les détails */}
                    <Link to={`/annonces/detail/${annonce.id}`} className="annonce-card-image-link">
                        <div className="annonce-card-image-container">
                            {imageUrl ? (
                                <img src={imageUrl} alt={annonce.name} className="annonce-card-image" onError={handleImageError} loading="lazy"/>
                            ) : (
                                <div className="annonce-card-placeholder"><PlaceholderIcon /></div>
                            )}
                        </div>
                    </Link>
                    {/* Contenu Texte */}
                    <div className="annonce-card-content">
                        <h3 className="annonce-card-title" title={annonce.name}>
                            <Link to={`/annonces/detail/${annonce.id}`}>{annonce.name}</Link>
                        </h3>
                        <p className="annonce-card-price">{formatPrice(annonce.prix)}</p>
                        <p className="annonce-card-address">{annonce.adresseProduit || "Non spécifié"}</p>
                        {/* Affichage du statut et de la demande de suppression */}
                        <div className="flex justify-between items-center mt-2 flex-wrap gap-1">
                             {annonce.statut && <span className={`${getStatusBadgeClass(annonce.statut)}`}>{annonce.statut}</span>}
                             {annonce.deletionRequested && (<span className="badge badge-warning text-xs">Demandé Suppr.</span>)}
                        </div>
                    </div>
                     {/* Pied de carte / Actions */}
                    <div className="annonce-card-actions">
                        {/* Voir Détails */}
                         <Link to={`/annonces/detail/${annonce.id}`} className="btn-icon-only text-blue-600" title="Voir les détails"><ViewIcon /></Link>
                        {/* Actions conditionnelles (Modifier, Demander Suppr, Supprimer) */}
                        <div className="ml-auto flex gap-1">
                            {user && (user.id === annonce.vendeurId || user.roles?.includes('Admin')) && (
                               <Link to={`/annonces/${annonce.id}`} className="btn-icon-only text-gray-600" title="Modifier"><EditIcon /></Link>
                            )}
                            {user && user.id === annonce.vendeurId && !user.roles?.includes('Admin') && !annonce.deletionRequested && (
                              <button onClick={() => handleRequestDelete(annonce.id)} className="btn-icon-only text-yellow-600" title="Demander la suppression"><RequestDeleteIcon /></button>
                            )}
                            {user && user.roles?.includes('Admin') && (
                              <button onClick={() => handleDelete(annonce.id, annonce.name)} className="btn-icon-only text-red-600" title="Supprimer définitivement"><DeleteIcon /></button>
                            )}
                        </div>
                    </div>
                </div>
               ); // Fin return map
              }) // Fin map
          ) : (
             // Message si aucune annonce trouvée
             <div className="col-span-full text-center py-8 text-muted">
                {annonces.length === 0 ? "Aucune annonce n'a été publiée pour le moment." : "Aucune annonce ne correspond à votre recherche."}
             </div>
          )}
        </div> // Fin annonces-grid
      )}

    </Layout>
  );
}

export default Annonces;