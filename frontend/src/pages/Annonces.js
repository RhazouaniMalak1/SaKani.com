// Dans pages/Annonces.js

import React, { useState, useEffect, useMemo } from "react"; // Ajout de useMemo
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
// Icône Flèche haut (pour le bouton "Retour en haut")
const ArrowUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"></line>
        <polyline points="5 12 12 5 19 12"></polyline>
    </svg>
);
// --- Fin Icônes ---

// --- URL Base Images (À configurer correctement) ---
const IMAGE_BASE_URL = process.env.REACT_APP_API_URL_BASE || 'http://localhost:5049';
const IMAGE_FOLDER_PATH = '/Uploads/Annonces/';
// --- Fin URL ---

// --- Constante Pagination ---
const ITEMS_PER_PAGE = 9; // Nombre de cartes par page
// --- Fin Constante Pagination ---


// --- Fonctions Helper ---
// Formate le prix en devise MAD sans centimes
const formatPrice = (price) => {
    if (price == null || isNaN(price)) return "N/A";
    // Utilise style: 'decimal' et ajoute le symbole MAD manuellement si toLocaleString est trop complexe/inconsistent
    // Ou assurez-vous que 'fr-MA' est supporté si vous voulez le symbole exact du dirham marocain (MAD).
    // 'fr-FR' avec currency: 'MAD' est une bonne approximation standard.
    return price.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0, maximumFractionDigits: 0 });
};
// Retourne la classe CSS pour le badge de statut
const getStatusBadgeClass = (status) => {
    const statusClean = status?.trim().toLowerCase() || '';
    switch (statusClean) {
      case "neuf": return "badge badge-success";
      case "bonne occasion": return "badge badge-warning";
      case "deuxieme main": return "badge badge-info"; // Note: Mettre 'Deuxième Main' dans le backend pour correspondre
      case "occasion": return "badge badge-secondary"; // Ajout potentiel pour "occasion"
      default: return "badge"; // Classe grise par défaut
    }
};
// Gère les erreurs de chargement d'image
const handleImageError = (event) => {
    event.target.onerror = null; // Empêche boucle si placeholder échoue
    event.target.src = '/asset/placeholder.png'; // Chemin vers placeholder dans public/
    event.target.alt = 'Image non disponible';
    event.target.style.objectFit = 'contain'; // Adapte l'affichage du placeholder
    event.target.style.maxWidth = '100%'; // Assure qu'it ne dépasse pas le conteneur
    event.target.style.maxHeight = '100%'; // Assure qu'il ne dépasse pas le conteneur
    event.target.parentElement.classList.add('is-placeholder'); // Ajoute une classe pour centrer si besoin
};
// --- Fin Fonctions Helper ---


function Annonces() {
  const [annonces, setAnnonces] = useState([]); // Liste complète des annonces (état original)
  const [loading, setLoading] = useState(true);  // Indicateur de chargement initial
  const [error, setError] = useState(null);    // Message d'erreur
  const [searchTerm, setSearchTerm] = useState(""); // Terme de recherche saisi
  const [sortOrder, setSortOrder] = useState(""); // Ordre de tri: '', 'price_asc', 'price_desc'
  const [selectedCity, setSelectedCity] = useState(""); // Filtre ville sélectionnée
  const [availableCities, setAvailableCities] = useState([]); // Liste des villes disponibles pour le filtre

  // --- États pour la pagination ---
  const [currentPage, setCurrentPage] = useState(1);
  // --- Fin États pagination ---

  // --- État pour le bouton Retour en haut ---
  const [showBackToTop, setShowBackToTop] = useState(false);
  // --- Fin État Retour en haut ---


  const { user } = useAuth(); // Informations de l'utilisateur connecté

  // Fonction pour récupérer toutes les annonces depuis l'API
  const fetchAnnonces = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await annonceService.getAll();
      console.log("Données Annonces reçues:", response.data);

      const fetchedAnnonces = response.data || []; // S'assurer que c'est un tableau

      setAnnonces(fetchedAnnonces); // Met à jour l'état avec les données

      // Extraire et lister les villes uniques pour le filtre
      // Utilisez un Set pour obtenir les valeurs uniques, filtrez les null/vides, triez, et convertissez en tableau
      const cities = [...new Set(fetchedAnnonces
            .map(annonce => annonce.adresseProduit)
            .filter(adresse => adresse && adresse.trim() !== '') // Filtrer les adresses null, vides ou espaces blancs
      )].sort(); // Trier alphabétiquement après avoir obtenu les uniques
      setAvailableCities(cities);

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

  // --- Effet pour réinitialiser la page à 1 quand les filtres/tri changent ---
  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm, sortOrder, selectedCity]);
  // --- Fin Effet ---

  // --- Effet pour afficher/cacher le bouton Retour en haut ---
  useEffect(() => {
    const handleScroll = () => {
        // Afficher le bouton si l'utilisateur a défilé de plus de 300px
        if (window.scrollY > 300) {
            setShowBackToTop(true);
        } else {
            setShowBackToTop(false);
        }
    };

    // Ajouter l'écouteur d'événement de défilement
    window.addEventListener('scroll', handleScroll);

    // Nettoyer l'écouteur lors du démontage du composant
    return () => {
        window.removeEventListener('scroll', handleScroll);
    };
  }, []); // Le tableau vide assure que cet effet ne s'exécute qu'une seule fois au montage/démontage
  // --- Fin Effet Retour en haut ---


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
        const updatedAnnonces = annonces.filter(a => a.id !== id);
        setAnnonces(updatedAnnonces);
        alert(`"${nomAnnonce}" supprimée.`);

        // Ajuster la page courante si nécessaire après suppression
        const totalItemsAfterDelete = updatedAnnonces.length;
        const totalPagesAfterDelete = Math.ceil(totalItemsAfterDelete / ITEMS_PER_PAGE);
        // Si la page courante n'existe plus ou est vide après suppression, revenir à la dernière page valide
        if (currentPage > totalPagesAfterDelete && totalPagesAfterDelete > 0) {
            setCurrentPage(totalPagesAfterDelete);
        } else if (totalPagesAfterDelete === 0) {
             setCurrentPage(1); // Revenir à la page 1 s'il n'y a plus d'annonces du tout
        }


      } catch (err) {
        console.error("Erreur suppression définitive:", err);
        alert(err.response?.data?.message || "Erreur suppression.");
      }
    }
  };

  // --- Logique de Filtrage et Tri ---
  // Utilise useMemo pour éviter de recalculer filteredAndSortedAnnonces à chaque rendu si les annonces, searchTerm, sortOrder ou selectedCity n'ont pas changé
  const filteredAndSortedAnnonces = useMemo(() => {
      let result = annonces;

      // 1. Filtrage par terme de recherche
      if (searchTerm) {
          const lowerSearchTerm = searchTerm.toLowerCase();
          result = result.filter(
            (annonce) => {
              return (
                annonce.name?.toLowerCase().includes(lowerSearchTerm) ||
                annonce.description?.toLowerCase().includes(lowerSearchTerm) ||
                annonce.adresseProduit?.toLowerCase().includes(lowerSearchTerm) ||
                annonce.statut?.toLowerCase().includes(lowerSearchTerm) ||
                annonce.telephone?.includes(searchTerm) // Téléphone peut être recherché tel quel ou comme chaîne
              );
            }
          );
      }

      // 2. Filtrage par ville (adresseProduit)
      if (selectedCity) {
           result = result.filter(
              (annonce) => annonce.adresseProduit && annonce.adresseProduit === selectedCity
           );
      }

      // 3. Tri
      if (sortOrder) {
          result = [...result].sort((a, b) => { // Crée une copie pour trier
              if (sortOrder === 'price_asc') {
                return (a.prix || 0) - (b.prix || 0);
              } else if (sortOrder === 'price_desc') {
                return (b.prix || 0) - (a.prix || 0);
              }
              // Tri par défaut si aucun ordre spécifique
              return (a.id || 0) - (b.id || 0); // Tri stable par ID par défaut
          });
      } else {
           // Si aucun tri sélectionné, trier par ID pour un ordre consistent après filtrage
           result = [...result].sort((a, b) => (a.id || 0) - (b.id || 0));
      }

      return result; // Retourne le tableau filtré et trié
  }, [annonces, searchTerm, sortOrder, selectedCity]); // Dépendances de useMemo

  // --- Logique de Pagination ---
  const totalItems = filteredAndSortedAnnonces.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE); // Utilise le nouveau ITEMS_PER_PAGE

  // Calculer les indices de début et de fin pour la page courante
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE; // Utilise le nouveau ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE; // Utilise le nouveau ITEMS_PER_PAGE

  // Obtenir les annonces pour la page courante
  const annoncesForPage = filteredAndSortedAnnonces.slice(startIndex, endIndex);

  // Fonction pour changer de page
  const handlePageChange = (pageNumber) => {
      // S'assurer que le numéro de page est valide
      if (pageNumber > 0 && pageNumber <= totalPages && pageNumber !== currentPage) {
          setCurrentPage(pageNumber);
          // Optionnel: scroller en haut de la page après changement de page
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };
  // --- Fin Logique de Pagination ---

  // --- Fonction pour gérer le clic sur le bouton Retour en haut ---
  const handleBackToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' }); // Défilement doux vers le haut
  };
  // --- Fin Fonction Retour en haut ---


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

      {/* Barre de recherche, Filtres et Tri - Toujours HORIZONTAUX */}
      <div className="filter-sort-container mb-4 card p-4"> {/* Conteneur pour les contrôles */}
            {/* Toujours une ligne flex-row, centre les items, *pas* de flex-wrap */}
            <div className="flex flex-row gap-4 items-center w-full"> {/* w-full pour prendre l'espace horizontal */}

                {/* Recherche - Prend l'espace restant si possible */}
                <div className="flex-grow min-w-[180px]"> {/* min-w pour éviter qu'il ne devienne trop petit */}
                    <label htmlFor="searchAnnonce" className="form-label sr-only">Rechercher</label>
                     {/* Inner flex pour le champ de recherche et le bouton X si besoin */}
                    <div className="flex gap-2 items-center w-full"> {/* w-full ici assure que l'input + bouton remplissent le conteneur parent flex-grow */}
                         <input
                            type="text"
                            id="searchAnnonce"
                            placeholder="Rechercher..."
                            className="search-input form-input flex-grow" // L'input s'étend dans son conteneur
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                         />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="btn btn-secondary btn-icon-only" type="button" title="Effacer la recherche">X</button>
                        )}
                    </div>
                </div>

                {/* Tri par Prix - Largeur automatique (ne prend pas l'espace) */}
                {/* Pas de w-full/md:w-auto ici, laisse flex déterminer la largeur naturelle */}
                <div>
                    <label htmlFor="sortOrder" className="form-label sr-only">Trier par</label>
                    <select
                        id="sortOrder"
                        className="form-select"
                        value={sortOrder}
                        onChange={(e) => setSortOrder(e.target.value)}
                    >
                        <option value="">Trier par Prix</option>
                        <option value="price_asc">Prix : Moins cher</option>
                        <option value="price_desc">Prix : Plus cher</option>
                    </select>
                </div>

                {/* Filtrer par Ville - Largeur automatique (ne prend pas l'espace) */}
                 {/* Pas de w-full/md:w-auto ici, laisse flex déterminer la largeur naturelle */}
                <div>
                    <label htmlFor="filterCity" className="form-label sr-only">Filtrer par Ville</label>
                    <select
                        id="filterCity"
                        className="form-select"
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                    >
                        <option value="">Toutes les villes</option>
                        {/* Afficher les villes disponibles */}
                        {availableCities.map(city => (
                            <option key={city} value={city}>{city}</option>
                        ))}
                    </select>
                </div>

            </div> {/* Fin flex items */}
       </div> {/* Fin card p-4 */}

      {/* Affichage pendant le chargement */}
      {loading && <div className="loading text-center py-8">Chargement des annonces...</div>}

      {/* Affichage en cas d'erreur de chargement */}
      {error && <div className="error-message text-center py-8">{error}</div>}

      {/* Grille des Annonces (si pas en chargement et pas d'erreur) */}
      {!loading && !error && (
        <> {/* Fragment pour contenir la grille et la pagination */}
            <div className="annonces-grid"> {/* Conteneur pour la grille de cartes */}
              {/* Utilise annoncesForPage pour le rendu */}
              {annoncesForPage.length > 0 ? (
                // Itération sur les annonces de la page courante
                annoncesForPage.map((annonce) => {
                   // Assure que annonce et annonce.image existent avant de construire l'URL
                   const imageUrl = annonce.image ? `${IMAGE_BASE_URL}${IMAGE_FOLDER_PATH}${annonce.image}` : null;
                   return (
                    // --- Carte Annonce Individuelle ---
                    <div key={annonce.id} className="annonce-card">
                        {/* Lien image vers les détails */}
                        <Link to={`/annonces/detail/${annonce.id}`} className="annonce-card-image-link">
                            <div className="annonce-card-image-container">
                                {imageUrl ? (
                                    <img src={imageUrl} alt={annonce.name || 'Annonce image'} className="annonce-card-image" onError={handleImageError} loading="lazy"/>
                                ) : (
                                    <div className="annonce-card-placeholder"><PlaceholderIcon /></div>
                                )}
                            </div>
                        </Link>
                        {/* Contenu Texte */}
                        <div className="annonce-card-content">
                            {/* Titre avec lien vers les détails */}
                            <h3 className="annonce-card-title" title={annonce.name}>
                                <Link to={`/annonces/detail/${annonce.id}`}>{annonce.name}</Link>
                            </h3>
                            {/* Prix formaté */}
                            <p className="annonce-card-price">{formatPrice(annonce.prix)}</p>
                            {/* Afficher l'adresse si elle existe */}
                            {annonce.adresseProduit && <p className="annonce-card-address text-sm text-gray-500">{annonce.adresseProduit}</p>}
                            {/* Affichage du statut et de la demande de suppression */}
                            <div className="flex justify-between items-center mt-2 flex-wrap gap-1">
                                 {annonce.statut && <span className={`${getStatusBadgeClass(annonce.statut)}`}>{annonce.statut}</span>}
                                 {annonce.deletionRequested && (<span className="badge badge-warning text-xs">Demandé Suppr.</span>)}
                            </div>
                        </div>
                         {/* Pied de carte / Actions */}
                        <div className="annonce-card-actions">
                            {/* Actions conditionnelles (Voir, Modifier, Demander Suppr, Supprimer) */}
                            <div className="ml-auto flex gap-1">
                                {/* Lien Détails toujours présent */}
                                {/* Utilisation de l'icône ViewIcon pour le lien de détails */}
                                <Link to={`/annonces/detail/${annonce.id}`} className="btn-icon-only text-blue-600" title="Voir les détails"><ViewIcon /></Link>

                                {/* Boutons Modifier / Demander Suppr / Supprimer */}
                                {/* Le Vendeur peut modifier SA propre annonce (s'il n'est pas Admin) */}
                                {user && user.id === annonce.vendeurId && !user.roles?.includes('Admin') && (
                                   <Link to={`/annonces/${annonce.id}`} className="btn-icon-only text-gray-600" title="Modifier"><EditIcon /></Link>
                                )}
                                 {/* Le Vendeur (pas Admin) peut demander la suppression SA propre annonce si pas déjà demandé */}
                                {user && user.id === annonce.vendeurId && !user.roles?.includes('Admin') && !annonce.deletionRequested && (
                                  <button onClick={() => handleRequestDelete(annonce.id)} className="btn-icon-only text-yellow-600" title="Demander la suppression"><RequestDeleteIcon /></button>
                                )}
                                 {/* L'Admin peut modifier N'IMPORTE QUELLE annonce */}
                                 {user && user.roles?.includes('Admin') && (
                                    <Link to={`/annonces/${annonce.id}`} className="btn-icon-only text-gray-600" title="Modifier"><EditIcon /></Link>
                                 )}
                                 {/* L'Admin peut supprimer DÉFINITIVEMENT N'IMPORTE QUELLE annonce */}
                                 {user && user.roles?.includes('Admin') && (
                                    <button onClick={() => handleDelete(annonce.id, annonce.name)} className="btn-icon-only text-red-600" title="Supprimer définitivement"><DeleteIcon /></button>
                                 )}

                            </div>
                        </div>
                    </div>
                   ); // Fin return map
                  }) // Fin map
              ) : (
                 // Message si aucune annonce trouvée après filtrage/tri sur la page courante
                 <div className="col-span-full text-center py-8 text-muted">
                    {annonces.length === 0 ? "Aucune annonce n'a été publiée pour le moment." : "Aucune annonce ne correspond à votre recherche ou aux filtres appliqués."}
                 </div>
              )}
            </div> {/* Fin annonces-grid */}

            {/* --- Contrôles de Pagination --- */}
            {/* N'afficher la pagination que s'il y a plus d'une page */}
            {totalPages > 1 && (
                <nav aria-label="Pagination des annonces" className="pagination-container mt-8 mb-4">
                    {/* Utilise les classes de pagination fournies dans le CSS, ajoute gap-2 pour l'espace entre les items */}
                    <ul className="pagination flex gap-2">
                        {/* Bouton Précédent */}
                        {/* Applique la classe 'disabled' au li si currentPage est la première page */}
                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                            {/* Utilise la classe 'page-link' pour le bouton */}
                            <button
                                onClick={() => handlePageChange(currentPage - 1)}
                                disabled={currentPage === 1} // Désactive le bouton si sur la première page
                                className="page-link"
                                // Ajouter tabIndex=-1 pour l'accessibilité si disabled
                                tabIndex={currentPage === 1 ? -1 : 0}
                                aria-disabled={currentPage === 1} // Indiquer l'état disabled pour les lecteurs d'écran
                            >
                                Précédent
                            </button>
                        </li>

                        {/* Numéros de page */}
                        {/* Génère un tableau de numéros de page [1, 2, 3, ...] */}
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            // Applique la classe 'active' au li si c'est la page courante
                            <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                                 {/* Utilise la classe 'page-link' pour le bouton */}
                                <button
                                    onClick={() => handlePageChange(page)}
                                    className="page-link"
                                    aria-current={currentPage === page ? 'page' : undefined} // Indiquer la page courante pour les lecteurs d'écran
                                >
                                    {page}
                                </button>
                            </li>
                        ))}

                        {/* Bouton Suivant */}
                         {/* Applique la classe 'disabled' au li si currentPage est la dernière page */}
                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                             {/* Utilise la classe 'page-link' pour le bouton */}
                             <button
                                onClick={() => handlePageChange(currentPage + 1)}
                                disabled={currentPage === totalPages} // Désactive le bouton si sur la dernière page
                                className="page-link"
                                // Ajouter tabIndex=-1 pour l'accessibilité si disabled
                                tabIndex={currentPage === totalPages ? -1 : 0}
                                aria-disabled={currentPage === totalPages} // Indiquer l'état disabled pour les lecteurs d'écran
                            >
                                Suivant
                            </button>
                        </li>
                    </ul>
                </nav>
            )}
            {/* --- Fin Contrôles de Pagination --- */}

        </>
      )}

      {/* --- Bouton Retour en Haut --- */}
      {/* Afficher le bouton seulement si showBackToTop est true */}
      {showBackToTop && (
          <button
              onClick={handleBackToTop}
              className="back-to-top-btn btn btn-primary" // Utilise des classes existantes + une nouvelle
              title="Retour en haut de la page"
          >
              <ArrowUpIcon /> {/* Utilise l'icône flèche haut */}
          </button>
      )}
      {/* --- Fin Bouton Retour en Haut --- */}

    </Layout>
  );
}

export default Annonces;