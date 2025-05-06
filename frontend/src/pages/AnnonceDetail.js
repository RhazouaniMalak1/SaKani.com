// src/pages/AnnonceDetail.js

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout'; // Adapter le chemin si nécessaire
import { annonceService } from '../services/api'; // Adapter le chemin si nécessaire
import { useAuth } from '../contexts/AuthContext'; // Import pour vérifier l'utilisateur connecté
import ChatWindow from '../components/ChatWindow'; // <<< IMPORTER LE COMPOSANT CHAT

// --- Icônes (intégrées directement) ---

// Icône Téléphone
const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1 align-middle">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

// Icône Alerte Triangle
const AlertTriangleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2 align-middle">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

// Icône Message/Chat
const MessageSquareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1 align-middle">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
);

// Icône Placeholder Image
const PlaceholderIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#e0e0e0" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
        <circle cx="8.5" cy="8.5" r="1.5"></circle>
        <polyline points="21 15 16 10 5 21"></polyline>
    </svg>
);

// Icône Retour (Flèche gauche)
const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon">
        <line x1="19" y1="12" x2="5" y2="12"></line>
        <polyline points="12 19 5 12 12 5"></polyline>
    </svg>
);

// --- Fin Icônes ---

// --- URL Base Images (À configurer correctement dans .env) ---
const IMAGE_BASE_URL = process.env.REACT_APP_API_URL_BASE || 'http://localhost:5049';
const IMAGE_FOLDER_PATH = '/Uploads/Annonces/';
// --- Fin URL ---

// --- Fonctions Helper ---
const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    try {
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    } catch (e) {
        console.error("Erreur formatage date:", e);
        return dateString; // Retourne la chaîne originale en cas d'erreur
    }
};

const formatPrice = (price) => {
    if (price == null || isNaN(price)) return "Prix non spécifié";
    // Utiliser toLocaleString pour un formatage monétaire propre à la locale
    try {
        return price.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD', minimumFractionDigits: 0, maximumFractionDigits: 2 });
    } catch(e) {
        // Fallback simple si la locale n'est pas supportée
        return `${price} MAD`;
    }
};

const getStatusBadgeClass = (status) => {
    const statusClean = status?.trim().toLowerCase() || '';
    switch (statusClean) {
      case "neuf": return "badge badge-success"; // Classes Tailwind ou CSS personnalisées
      case "bonne occasion": return "badge badge-warning";
      case "deuxieme main": return "badge badge-info";
      case "occasion": return "badge badge-secondary"; // Ajout d'un statut possible
      default: return "badge"; // Classe par défaut
    }
};

// Fonction pour gérer les erreurs de chargement d'image
const handleImageError = (event) => {
    console.warn("Erreur chargement image:", event.target.src);
    event.target.onerror = null; // Empêche boucle infinie si placeholder échoue aussi
    // Optionnel : tenter un placeholder local si celui distant échoue
    // event.target.src = '/asset/placeholder.png'; // Chemin vers un placeholder local
    event.target.alt = 'Image non disponible';
    // Rendre le placeholder moins dominant visuellement
    event.target.style.objectFit = 'contain';
    event.target.style.opacity = '0.5';
    // Peut-être afficher l'icône placeholder à la place ? (plus complexe)
};
// --- Fin Fonctions Helper ---

function AnnonceDetail() {
  const { id } = useParams(); // Récupère l'ID de l'annonce depuis l'URL
  const navigate = useNavigate(); // Hook pour la navigation programmatique
  const { user } = useAuth(); // Récupérer l'utilisateur connecté depuis le contexte d'authentification

  const [annonce, setAnnonce] = useState(null); // État pour stocker les détails de l'annonce
  const [loading, setLoading] = useState(true); // État pour indiquer le chargement
  const [error, setError] = useState(null); // État pour stocker les erreurs
  const [isChatOpen, setIsChatOpen] = useState(false); // État pour contrôler la visibilité de la fenêtre de chat

  // Effet pour charger les détails de l'annonce au montage ou si l'ID change
  useEffect(() => {
    const fetchAnnonceDetail = async () => {
      if (!id) {
        setError("Aucun ID d'annonce fourni dans l'URL.");
        setLoading(false);
        return;
      }
      console.log(`[AnnonceDetail] Chargement des détails pour l'annonce ID: ${id}`);
      setLoading(true);
      setError(null); // Réinitialiser l'erreur précédente
      setIsChatOpen(false); // Fermer le chat si on navigue vers une nouvelle annonce
      try {
        const response = await annonceService.getById(id);
        console.log("[AnnonceDetail] Détails de l'annonce reçus:", response.data);
        setAnnonce(response.data); // Mettre à jour l'état avec les données reçues
      } catch (err) {
        console.error("[AnnonceDetail] Erreur lors du chargement des détails:", err.response || err.message || err);
        if (err.response?.status === 404) {
            setError(`L'annonce avec l'ID ${id} n'a pas été trouvée.`);
        } else if (err.response?.status === 401) {
            setError("Vous n'êtes pas autorisé à voir cette annonce. Veuillez vous reconnecter.");
            // La redirection vers login est gérée par l'intercepteur Axios
        } else {
            setError("Une erreur s'est produite lors du chargement de l'annonce.");
        }
        setAnnonce(null); // S'assurer qu'aucune ancienne donnée ne reste affichée
      } finally {
        setLoading(false); // Arrêter l'indicateur de chargement
      }
    };

    fetchAnnonceDetail();
  }, [id]); // Dépendance: recharger si l'ID dans l'URL change

  // --- Fonctions pour gérer l'ouverture/fermeture de la fenêtre de chat ---
  const openChat = () => {
      // 1. Vérifier si l'annonce et ses détails (vendeurId) sont chargés
      if (!annonce || !annonce.vendeurId) {
          console.error("[AnnonceDetail] Impossible d'ouvrir le chat : données annonce incomplètes.");
          alert("Impossible de contacter le vendeur pour le moment.");
          return;
      }
      // 2. Vérifier si l'utilisateur est connecté
      if (!user) {
          console.log("[AnnonceDetail] Utilisateur non connecté. Redirection vers login.");
          // Rediriger vers login, en passant l'URL actuelle pour revenir après connexion
          navigate('/login', { state: { from: window.location.pathname, message: 'Connectez-vous pour pouvoir contacter le vendeur.' } });
          return;
      }
      // 3. Vérifier si l'utilisateur essaie de chatter avec lui-même
      if (user.id === annonce.vendeurId) {
          console.log("[AnnonceDetail] Tentative de chat avec soi-même bloquée.");
          alert("Vous ne pouvez pas démarrer une conversation avec vous-même.");
          return;
      }
      // 4. Si tout est bon, ouvrir le chat
      console.log(`[AnnonceDetail] Ouverture du chat avec le vendeur ${annonce.vendeurId}`);
      setIsChatOpen(true); // Met à jour l'état pour afficher la fenêtre ChatWindow
  };

  const closeChat = () => {
    console.log("[AnnonceDetail] Fermeture de la fenêtre de chat.");
    setIsChatOpen(false); // Met à jour l'état pour cacher la fenêtre ChatWindow
  };
  // --- Fin Fonctions Chat ---


  // --- Rendu Conditionnel ---
  if (loading) {
    return (
        <Layout>
            <div className="loading text-center py-12">
                <p className="text-lg text-gray-600">Chargement des détails de l'annonce...</p>
                {/* Optionnel: ajouter un spinner SVG ou une animation */}
            </div>
        </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="header">
          <h1 className="page-title">Erreur</h1>
           <Link to="/annonces" className="btn btn-secondary">Retour à la liste des annonces</Link>
        </div>
        <div className="card">
            <div className="card-content error-message text-center py-10 px-4">
                <AlertTriangleIcon /> {/* Utilisation de l'icône d'alerte */}
                <p className="text-red-600 font-semibold mt-2">{error}</p>
                <p className="text-sm text-gray-500 mt-1">Veuillez réessayer plus tard ou retourner à la liste des annonces.</p>
            </div>
        </div>
      </Layout>
    );
  }

   if (!annonce) {
     // Ce cas peut arriver si loading est false mais annonce est toujours null (par ex. erreur silencieuse)
     return (
      <Layout>
        <div className="header">
          <h1 className="page-title">Annonce Introuvable</h1>
           <Link to="/annonces" className="btn btn-secondary">Retour à la liste</Link>
        </div>
         <div className="card">
            <div className="card-content text-center py-10 text-gray-500">
                L'annonce demandée n'a pas pu être chargée ou n'existe pas.
            </div>
         </div>
      </Layout>
     );
   }
   // --- Fin Rendu Conditionnel ---

  // Déterminer si l'utilisateur connecté est le propriétaire de l'annonce
  const isOwner = user && user.id === annonce.vendeurId;
  // Construire l'URL complète de l'image (si disponible)
  const imageUrl = annonce.image ? `${IMAGE_BASE_URL}${IMAGE_FOLDER_PATH}${annonce.image}` : null;

  // Rendu principal des détails de l'annonce
  return (
    <Layout>
      {/* En-tête de la page */}
      <div className="header items-center gap-4 mb-6"> {/* Ajout de flexbox et gap */}
        <button
            onClick={() => navigate(-1)} // Navigue vers la page précédente dans l'historique
            className="btn btn-secondary flex items-center"
            title="Retour à la page précédente"
        >
           <ArrowLeftIcon /> {/* Utilisation de l'icône Retour */}
           <span className="ml-1">Retour</span>
        </button>
        {/* Le titre prend l'espace restant */}
        <h1 className="page-title flex-1 text-2xl md:text-3xl font-bold truncate" title={annonce.name}>
            {annonce.name}
        </h1>
        {/* Bouton Modifier visible par Admin ou propriétaire */}
        {user && (isOwner || user.roles?.includes('Admin')) && (
             <Link
                to={`/annonces/edit/${annonce.id}`} // Assurez-vous que cette route existe dans votre router
                className="btn btn-primary ml-auto whitespace-nowrap" // Empêche le retour à la ligne
             >
                 Modifier
             </Link>
        )}
      </div>

      {/* Carte contenant les détails */}
      <div className="card overflow-hidden shadow-lg rounded-lg"> {/* Ajout style */}
         {/* Section Image */}
         <div className="annonce-detail-image-container bg-gray-200 flex justify-center items-center aspect-video"> {/* Ratio 16:9 */}
            {imageUrl ? (
                <img
                    src={imageUrl}
                    alt={`Image de ${annonce.name}`}
                    className="annonce-detail-image w-full h-full object-cover" // Couvre l'espace dispo
                    onError={handleImageError} // Gestionnaire d'erreur
                />
            ) : (
                // Afficher l'icône placeholder si pas d'image
                <div className="annonce-detail-placeholder flex flex-col items-center justify-center text-gray-500">
                    <PlaceholderIcon />
                    <span className="mt-2 text-sm">Aucune image fournie</span>
                </div>
            )}
         </div>

        {/* Contenu texte et autres détails */}
        <div className="card-content p-5 md:p-8 space-y-6"> {/* Plus d'espace */}
          {/* Titre, Date, Statut */}
          <div className="flex flex-col sm:flex-row flex-wrap justify-between items-start gap-3 pb-4 border-b border-gray-200">
                <div>
                    <h2 className="card-title text-xl sm:text-2xl font-semibold text-gray-800 mb-1">{annonce.name}</h2>
                    <p className="card-description text-xs sm:text-sm text-gray-500">
                        Publiée le : {formatDate(annonce.dateCreation)}
                    </p>
                </div>
                {/* Afficher le statut s'il existe */}
                {annonce.statut && (
                    <span className={`${getStatusBadgeClass(annonce.statut)} text-xs sm:text-sm font-medium px-3 py-1 rounded-full self-center sm:self-auto mt-2 sm:mt-0`}>
                        {annonce.statut}
                    </span>
                )}
          </div>

          {/* Prix */}
          <div className="py-3">
                <strong className="block text-base text-gray-600 mb-1">Prix :</strong>
                <span className="text-3xl sm:text-4xl font-bold text-primary">{formatPrice(annonce.prix)}</span>
           </div>

          {/* Grille Adresse / Téléphone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 pt-4 border-t border-gray-200">
           {annonce.adresseProduit && (
                <div>
                    <strong className="text-gray-600 block text-sm mb-1">Lieu de l'article :</strong>
                    <span className="text-gray-800">{annonce.adresseProduit}</span>
                </div>
           )}
           {/* Afficher le téléphone seulement s'il est fourni */}
           {annonce.telephone && (
               <div>
                    <strong className="text-gray-600 flex items-center text-sm mb-1">
                        <PhoneIcon />Contact Vendeur :
                    </strong>
                    <a href={`tel:${annonce.telephone}`} className="text-gray-800 hover:text-primary hover:underline ml-1 break-all">
                        {annonce.telephone}
                    </a>
                </div>
           )}
          </div>

          {/* Description */}
           {annonce.description && (
            <div className="pt-4 border-t border-gray-200">
              <strong className="block text-lg text-gray-800 mb-3">Description détaillée :</strong>
              {/* Utiliser whitespace-pre-wrap pour respecter les sauts de ligne et retours chariot */}
              <div className="text-gray-700 whitespace-pre-wrap bg-gray-50 p-4 rounded border border-gray-200 text-sm leading-relaxed">
                {annonce.description}
              </div>
            </div>
           )}

           {/* Alerte si une demande de suppression est en cours */}
           {annonce.deletionRequested && (
              <div className="p-4 bg-yellow-50 border border-yellow-300 rounded text-yellow-800 mt-5 flex items-center gap-3 text-sm">
                <AlertTriangleIcon /> {/* Utilisation de l'icône d'alerte */}
                <span>Une demande de suppression a été faite pour cette annonce et est en attente de validation par un administrateur.</span>
              </div>
           )}

           {/* Bouton pour Contacter le Vendeur */}
           {/* Logique d'affichage du bouton :
               - Si l'utilisateur N'EST PAS connecté -> Bouton "Connectez-vous pour contacter" (mène à la page login)
               - Si l'utilisateur EST connecté ET N'EST PAS le propriétaire -> Bouton "Contacter le Vendeur" (ouvre le chat)
               - Si l'utilisateur EST connecté ET EST le propriétaire -> Pas de bouton de contact
           */}
           <div className="mt-8 pt-6 border-t border-gray-200 text-center md:text-left">
                {!user ? (
                    // Cas: Non connecté
                    <button onClick={openChat} className="btn btn-secondary btn-lg flex items-center justify-center mx-auto md:mx-0">
                         <MessageSquareIcon />
                         <span className="ml-2">Connectez-vous pour contacter</span>
                    </button>
                ) : !isOwner ? (
                    // Cas: Connecté et pas le propriétaire
                    <button onClick={openChat} className="btn btn-primary btn-lg flex items-center justify-center mx-auto md:mx-0">
                        <MessageSquareIcon />
                        <span className="ml-2">Contacter le Vendeur par message</span>
                    </button>
                ) : (
                    // Cas: Connecté et propriétaire (optionnel: afficher un message)
                    <p className="text-sm text-gray-500 italic">C'est votre annonce.</p>
                )}
            </div>


            {/* Section d'informations additionnelles/debug (optionnel) */}
           <div className="pt-5 border-t border-gray-200 mt-6 text-xs text-gray-400">
             <p>ID Vendeur : {annonce.vendeurId ? annonce.vendeurId.substring(0, 12) + '...' : 'Non défini'}</p>
             {/* Afficher l'ID Admin seulement s'il existe */}
             {annonce.adminId && (<p>Géré par Admin ID : {annonce.adminId}</p>)}
             <p>ID Annonce : {annonce.id}</p>
           </div>
        </div>
      </div> {/* Fin de la card */}

       {/* === Fenêtre de Chat (rendue conditionnellement ICI, à l'extérieur de la card) === */}
       {/* La CSS de ChatWindow gère son positionnement fixe */}
       {isChatOpen && annonce && annonce.vendeurId && user && (
           <ChatWindow
             recipientId={annonce.vendeurId} // Le vendeur est le destinataire du message
             // Essayer d'obtenir un nom d'utilisateur si l'API le fournit, sinon fallback
             recipientName={annonce.vendeur?.userName || `Vendeur #${annonce.vendeurId.substring(0, 6)}`}
             annonceId={annonce.id} // ID de l'annonce concernée
             annonceName={annonce.name} // Nom de l'annonce pour référence
             onClose={closeChat} // Fonction pour fermer la fenêtre depuis son bouton X
           />
       )}

    </Layout>
  );
}

export default AnnonceDetail;