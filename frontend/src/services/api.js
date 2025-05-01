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
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Retourne la configuration de la requête (modifiée ou non).
    return config;
  },
  (error) => {
    // Gère les erreurs lors de la configuration de la requête.
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
    // Vérifie si l'erreur est une réponse 401 (Non autorisé - token invalide/expiré).
    if (error.response && error.response.status === 401) {
      // Supprime le token et les infos utilisateur du localStorage.
      localStorage.removeItem("token");
      localStorage.removeItem("user"); // Si vous stockez aussi des infos utilisateur
      // Redirige l'utilisateur vers la page de connexion.
      // (Alternative: utiliser un hook de contexte pour mettre à jour l'état et laisser App.js gérer la redirection)
      // Éviter window.location si possible dans React, préférer la navigation via le router
      // Pourrait être géré dans AuthContext ou via un écouteur d'événement global
       console.error("Intercepteur Axios : Erreur 401 détectée.");
       // Redirection simple pour l'instant
      if (window.location.pathname !== '/login') {
         window.location.href = "/login";
      }
    }
    // Retourne l'erreur pour qu'elle puisse être gérée par le code appelant (ex: dans un catch).
    return Promise.reject(error);
  }
);


// --- SERVICES API ---

// Service pour l'authentification (NÉCESSAIRE)
export const authService = {
  login: (credentials) => api.post("/Account/login", credentials), // URL corrigée
  register: (userData) => api.post("/Account/register", userData), // URL corrigée
  logout: () => api.post("/Account/logout"), // URL corrigée
  getUserInfo: () => api.get("/Account/user-info"), // URL corrigée
};


// Service pour les Annonces (Décommenté et adapté)
export const annonceService = {
  getAll: () => api.get("/Annonces"),                   // GET /api/Annonces
  getById: (id) => api.get(`/Annonces/${id}`),          // GET /api/Annonces/{id}
  create: (data) => api.post("/Annonces", data),        // POST /api/Annonces
  update: (id, data) => api.put(`/Annonces/${id}`, data),// PUT /api/Annonces/{id}
  delete: (id) => api.delete(`/Annonces/${id}`),        // DELETE /api/Annonces/{id} (Suppression physique Admin)
  requestDeletion: (id) => api.patch(`/Annonces/${id}/request-deletion`), // PATCH /api/Annonces/{id}/request-deletion (Vendeur)
  confirmDelete: (id) => api.patch(`/Annonces/${id}/confirm-soft-delete`), // PATCH /api/Annonces/{id}/confirm-soft-delete (Admin -> Suppression physique)
  getPendingDeletion: () => api.get("/Annonces/pending-deletion"),       // GET /api/Annonces/pending-deletion (Admin)
  getByVendeur: (vendeurId) => api.get(`/Annonces/vendeur/${vendeurId}`), // GET /api/Annonces/vendeur/{vendeurId}
  // Les services liés aux consultations sont dans un autre objet ci-dessous
};

// Service pour les consultations Annonce/Client (Décommenté et adapté)
// export const annonceClientService = {
//    getVisiteurs: (annonceId) => api.get(`/annonces/${annonceId}/visiteurs`),       // GET /api/annonces/{annonceId}/visiteurs (Admin)
//    getVisiteurCount: (annonceId) => api.get(`/annonces/${annonceId}/visiteur-count`), // GET /api/annonces/{annonceId}/visiteur-count
//    getAnnoncesVisitees: (clientId) => api.get(`/clients/${clientId}/annonces-visitees`), // GET /api/clients/{clientId}/annonces-visitees (Admin)
// };


// --- AUTRES SERVICES DE L'ANCIEN PROJET (Toujours commentés) ---
/*
export const projectService = {
  getAll: () => api.get("/projects"),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post("/projects", data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};
*/
/*
export const taskService = {
  getAll: () => api.get("/tasks"),
  getByProject: (projectId) => api.get(`/tasks?projectId=${projectId}`),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post("/tasks", data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
};
*/
/*
export const resourceService = {
  getAll: () => api.get("/resources"),
  getById: (id) => api.get(`/resources/${id}`),
  create: (data) => api.post("/resources", data),
  update: (id, data) => api.put(`/resources/${id}`, data),
  delete: (id) => api.delete(`/resources/${id}`),
};
*/
/*
export const supplierService = {
  getAll: () => api.get("/suppliers"),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post("/suppliers", data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};
*/