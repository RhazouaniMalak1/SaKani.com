import axios from "axios";

// Création de l'instance Axios (NÉCESSAIRE)
export const api = axios.create({
  // Définit l'URL de base de votre API backend.
  // Utilise une variable d'environnement si définie, sinon localhost:5049 par défaut.
  // Assurez-vous que le port 5049 correspond bien à celui de votre backend en cours d'exécution.
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5049/api",
  headers: {
    "Content-Type": "application/json", // Définit le type de contenu par défaut pour les requêtes POST/PUT
  },
});

// Intercepteur de requête Axios (NÉCESSAIRE pour l'authentification JWT)
// S'exécute avant chaque requête envoyée par Axios.
api.interceptors.request.use(
  (config) => {
    // Récupère le token JWT stocké dans le localStorage du navigateur.
    const token = localStorage.getItem("token");
    // Si un token existe, l'ajoute à l'en-tête 'Authorization' de la requête.
    if (token) {
      // console.log('Token ajouté à la requête:', `Bearer ${token.substring(0, 10)}...`); // Pour débogage
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // console.log('Aucun token trouvé pour cette requête.'); // Pour débogage
    }
    // Retourne la configuration de la requête (modifiée ou non).
    return config;
  },
  (error) => {
    // Gère les erreurs lors de la configuration de la requête.
    console.error("Erreur dans l'intercepteur de requête:", error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse Axios (NÉCESSAIRE pour gérer les erreurs 401 Unauthorized)
// S'exécute après chaque réponse reçue par Axios.
api.interceptors.response.use(
  (response) => {
    // Si la réponse est réussie (status 2xx), la retourne telle quelle.
    return response;
  },
  (error) => {
    // Si une erreur de réponse survient...
    console.error("Erreur interceptée dans la réponse API:", error.response || error.message || error);
    // Vérifie si l'erreur est une réponse 401 (Non autorisé - token invalide/expiré).
    if (error.response && error.response.status === 401) {
      console.warn("Erreur 401 détectée ! Déconnexion et redirection vers /login.");
      // Supprime le token et les infos utilisateur du localStorage.
      localStorage.removeItem("token");
      localStorage.removeItem("user"); // Si vous stockez aussi des infos utilisateur
      // Supprimer l'en-tête par défaut pour éviter de le réutiliser
      delete api.defaults.headers.common["Authorization"];
      // Redirige l'utilisateur vers la page de connexion en rechargeant la page
      // C'est simple mais peut être amélioré avec une gestion d'état/navigation React
      if (window.location.pathname !== '/login') {
         window.location.href = "/login";
         // Alternative avec react-router (si 'navigate' est disponible ici via un contexte par ex.)
         // navigate('/login', { replace: true });
      }
    }
    // Retourne l'erreur pour qu'elle puisse être gérée par le code appelant (ex: dans un catch).
    return Promise.reject(error);
  }
);


// --- SERVICES API ---

// Service pour l'authentification
export const authService = {
  login: (credentials) => api.post("/Account/login", credentials),
  register: (userData) => api.post("/Account/register", userData),
  logout: () => api.post("/Account/logout"), // Peut être appelé même si peu utile côté serveur
  getUserInfo: () => api.get("/Account/user-info"), // Important après le login ou au chargement
};


// Service pour les Annonces
export const annonceService = {
  getAll: () => api.get("/Annonces"),                   // GET /api/Annonces
  getById: (id) => api.get(`/Annonces/${id}`),          // GET /api/Annonces/{id}
  create: (formData) => api.post("/Annonces", formData, {
    // On dit à Axios de laisser le navigateur gérer le Content-Type pour FormData
    headers: {
      'Content-Type': undefined // ou null
    }
  }),

  // --- MODIFIÉ ICI ---
  update: (id, formData) => api.put(`/Annonces/${id}`, formData, {
    // Idem pour la mise à jour
    headers: {
      'Content-Type': undefined // ou null
    }
  }),
  delete: (id) => api.delete(`/Annonces/${id}`),        // DELETE /api/Annonces/{id}
  // La demande de suppression par le Vendeur
  requestDeletion: (id) => api.patch(`/Annonces/${id}/request-deletion`), // PATCH .../request-deletion
  // La confirmation (suppression physique) par l'Admin
  confirmDelete: (id) => api.patch(`/Annonces/${id}/confirm-soft-delete`), // PATCH .../confirm-soft-delete
  // Lister les annonces en attente de suppression (pour Admin)
  getPendingDeletion: () => api.get("/Annonces/pending-deletion"),       // GET .../pending-deletion
  // Lister les annonces d'un vendeur spécifique
  getByVendeur: (vendeurId) => api.get(`/Annonces/vendeur/${vendeurId}`), // GET .../vendeur/{vendeurId}

   // --- AJOUT : Fonction pour récupérer les archives ---
   getArchives: () => api.get("/Annonces/archives"),
};

// Service pour les consultations Annonce/Client
export const annonceClientService = {
   // Lister les visiteurs d'une annonce (pour Admin)
   getVisiteurs: (annonceId) => api.get(`/annonces/${annonceId}/visiteurs`), // GET /api/annonces/{annonceId}/visiteurs
   // Compter les visiteurs uniques d'une annonce
   getVisiteurCount: (annonceId) => api.get(`/annonces/${annonceId}/visiteur-count`), // GET /api/annonces/{annonceId}/visiteur-count
   // Lister les annonces visitées par un client (pour Admin)
   getAnnoncesVisitees: (clientId) => api.get(`/clients/${clientId}/annonces-visitees`), // GET /api/clients/{clientId}/annonces-visitees
};


// --- SERVICES DE L'ANCIEN PROJET (COMMENTÉS - À SUPPRIMER SI INUTILES) ---
/*
export const projectService = { ... };
export const taskService = { ... };
export const resourceService = { ... };
export const supplierService = { ... };
*/