// Dans src/services/api.js
import axios from "axios";

// Création de l'instance Axios (NÉCESSAIRE)
export const api = axios.create({
  // Définit l'URL de base de votre API backend.
  // Utilise une variable d'environnement si définie, sinon localhost:5049 par défaut.
  // Assurez-vous que le port 5049 correspond bien à celui de votre backend en cours d'exécution.
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5049/api", // <<< VOTRE URL API BASE
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
      // console.log('[Interceptor Request] Token ajouté à la requête.'); // Décommenter pour debug
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // console.log('[Interceptor Request] Aucun token trouvé pour cette requête.'); // Décommenter pour debug
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
    console.error("Erreur interceptée dans la réponse API:", error.response ? `Status ${error.response.status}` : error.message || error);
    // Vérifie si l'erreur est une réponse 401 (Non autorisé - token invalide/expiré).
    if (error.response && error.response.status === 401) {
      console.warn("Erreur 401 détectée (Token invalide/expiré) ! Déconnexion et redirection vers /login.");
      // Supprime le token et les infos utilisateur du localStorage.
      localStorage.removeItem("token");
      localStorage.removeItem("user"); // Si vous stockez aussi des infos utilisateur
      // Supprimer l'en-tête par défaut pour éviter de le réutiliser
      delete api.defaults.headers.common["Authorization"];
      // Redirige l'utilisateur vers la page de connexion en rechargeant la page
      // Cela assure un nettoyage complet de l'état de l'application.
      if (window.location.pathname !== '/login') {
         alert("Votre session a expiré. Veuillez vous reconnecter."); // Informer l'utilisateur
         window.location.href = "/login";
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
  logout: () => api.post("/Account/logout"), // Peut être utile pour invalider côté serveur si implémenté
  getUserInfo: () => api.get("/Account/user-info"), // Pour vérifier le token et récupérer les infos user
};


// Service pour les Annonces
export const annonceService = {
  getAll: () => api.get("/Annonces"),                   // GET /api/Annonces
  getById: (id) => api.get(`/Annonces/${id}`),          // GET /api/Annonces/{id}
  create: (formData) => api.post("/Annonces", formData, { // Note: FormData gère son Content-Type
    headers: { 'Content-Type': undefined }
  }),
  update: (id, formData) => api.put(`/Annonces/${id}`, formData, { // Note: FormData gère son Content-Type
    headers: { 'Content-Type': undefined }
  }),
  delete: (id) => api.delete(`/Annonces/${id}`),        // DELETE /api/Annonces/{id} (suppression physique Admin)
  requestDeletion: (id) => api.patch(`/Annonces/${id}/request-deletion`), // PATCH demande suppression Vendeur
  // confirmDelete: (id) => api.patch(`/Annonces/${id}/confirm-soft-delete`), // Action Admin (semble supprimée/modifiée dans votre API)
  getPendingDeletion: () => api.get("/Annonces/pending-deletion"),       // GET annonces en attente de suppression
  getByVendeur: (vendeurId) => api.get(`/Annonces/vendeur/${vendeurId}`), // GET annonces d'un vendeur
  getArchives: () => api.get("/Annonces/archives"), // GET archives
};


// Service pour les consultations Annonce/Client
export const annonceClientService = {
  getVisiteurs: (annonceId) => api.get(`/Annonces/${annonceId}/visiteurs`),
  getVisiteurCount: (annonceId) => api.get(`/Annonces/${annonceId}/visiteur-count`),
  // CORRECTION : Le chemin doit être '/clients/' et non '/Account/client/'
  getAnnoncesVisitees: (clientId) => api.get(`/clients/${clientId}/annonces-visitees`), // <-- CORRIGÉ
};





// --- MODIFICATION : Service pour le Chat (Logique Polling) ---
export const chatService = {
  // Récupère l'historique initial d'une conversation
  getHistory: (otherUserId, options = {}) => {
    const params = new URLSearchParams();
    if (options.before) params.append('before', options.before);
    if (options.count) params.append('count', options.count);
    console.log(`[API Call] getHistory for ${otherUserId}`);
    // Appelle GET /api/Chat/history/{otherUserId}
    return api.get(`/Chat/history/${otherUserId}`, { params });
  },

  // Récupère les nouveaux messages dans une conversation spécifique depuis un timestamp
  // Utilisé par le polling de ChatWindow
  getNewMessages: (otherUserId, sinceUtcTimestamp) => {
    let sinceParam = new Date(0).toISOString(); // Valeur par défaut sûre
    try {
      // Ajouter 1 milliseconde pour éviter de récupérer le dernier message exact
      const sinceDate = new Date(sinceUtcTimestamp);
      // Vérifier si la date est valide avant d'ajouter des millisecondes
      if (!isNaN(sinceDate.getTime())) {
         sinceDate.setMilliseconds(sinceDate.getMilliseconds() + 1);
         sinceParam = sinceDate.toISOString();
      } else {
          console.warn(`[API Call getNewMessages] Timestamp invalide reçu: ${sinceUtcTimestamp}. Utilisation de la date par défaut.`);
      }
    } catch (e) {
      console.error("[API Call getNewMessages] Erreur conversion date 'sinceUtc'", e);
    }
    console.log(`[API Call] getNewMessages for ${otherUserId} since ${sinceParam}`);
    // Appelle GET /api/Chat/new/{otherUserId}?sinceUtc=...
    return api.get(`/Chat/new/${otherUserId}`, { params: { sinceUtc: sinceParam } });
  },

  // === NOUVEAU (si utilisé par AuthContext) : Récupère TOUS les nouveaux messages pour l'utilisateur actuel ===
  // NOTE : Assurez-vous que l'endpoint `/api/Chat/new/all` existe bien côté backend !
  getAllNewMessages: (sinceUtcTimestamp) => {
    let sinceParam = new Date(0).toISOString(); // Valeur par défaut
    try {
       const sinceDate = new Date(sinceUtcTimestamp);
       if (!isNaN(sinceDate.getTime())) {
          // Pas besoin d'ajouter 1ms ici, on veut tous les messages strictement après
          sinceParam = sinceDate.toISOString();
       } else {
           console.warn(`[API Call getAllNewMessages] Timestamp invalide reçu: ${sinceUtcTimestamp}. Utilisation de la date par défaut.`);
       }
    } catch (e) {
      console.error("[API Call getAllNewMessages] Erreur conversion date 'sinceUtc'", e);
    }
     console.log(`[API Call] getAllNewMessages since ${sinceParam}`);
     // Appelle GET /api/Chat/new/all?sinceUtc=...
     return api.get(`/Chat/new/all`, { params: { sinceUtc: sinceParam } });
  },
  // === FIN NOUVEAU ===

  // Envoie un nouveau message via API POST
  sendMessageApi: (recipientId, content) => {
    console.log(`[API Call] sendMessageApi to ${recipientId}`);
    // Appelle POST /api/Chat/send
    return api.post(`/Chat/send`, { recipientId: recipientId, content: content });
  },

   // Marque une conversation comme lue via API POST (Optionnel)
   markAsReadApi: (senderId) => {
       console.log(`[API Call] markAsReadApi for sender ${senderId}`);
       // Appelle POST /api/Chat/markasread/{senderId}
       return api.post(`/Chat/markasread/${senderId}`);
   }
};
// --- FIN MODIFICATION Service Chat ---

// --- SERVICES DE L'ANCIEN PROJET (COMMENTÉS) ---
/*
export const projectService = { ... };
export const taskService = { ... };
export const resourceService = { ... };
export const supplierService = { ... };
*/