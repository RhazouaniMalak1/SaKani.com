import { createContext, useState, useContext, useEffect } from "react";
// Importer le service API qui contient l'instance axios configurée et les fonctions
import { api, authService } from "../services/api"; // Assurez-vous que le chemin est correct

// Création du contexte
const AuthContext = createContext(null);

// Hook personnalisé pour utiliser le contexte plus facilement
export function useAuth() {
  return useContext(AuthContext);
}

// Composant fournisseur du contexte
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // État pour stocker les infos utilisateur (ou null)
  const [loading, setLoading] = useState(true); // État pour gérer le chargement initial

  // Effet pour vérifier si l'utilisateur est déjà connecté au montage initial
  useEffect(() => {
    const checkLoggedIn = async () => {
      const storedToken = localStorage.getItem("token");

      if (storedToken) {
        // Si un token existe, configurer l'en-tête par défaut d'Axios immédiatement
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        try {
          // Tenter de récupérer les infos utilisateur depuis le backend pour valider le token
          const response = await authService.getUserInfo();
          const userData = response.data; // UserInfoDto du backend
          setUser(userData); // Mettre à jour l'état user
          // Optionnel : Stocker aussi les infos user dans localStorage
          localStorage.setItem('user', JSON.stringify(userData));
        } catch (error) {
          // Si le token est invalide/expiré ou l'appel échoue
          console.error("Échec de la récupération des informations utilisateur avec le token existant:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user"); // Nettoyer aussi les infos user
          delete api.defaults.headers.common["Authorization"];
          setUser(null);
        }
      }
      // Indiquer que le chargement initial est terminé
      setLoading(false);
    };

    checkLoggedIn();
  }, []); // Le tableau vide assure que cet effet ne s'exécute qu'une fois au montage

  // Fonction de connexion
  const login = async (credentials) => { // credentials doit être { email, password }
    const { email, password } = credentials;
    if (!email || !password) {
        // Lancer une erreur est souvent mieux que de retourner false ici
        throw new Error("Email et mot de passe requis.");
    }

    try {
      // Appel API via authService qui a la bonne URL (/api/Account/login)
      const response = await authService.login({ email, password });

      // Extrait le token de la réponse du backend
      const { token } = response.data;

      if (token) {
        // Stocker le token dans localStorage
        localStorage.setItem("token", token);
        // Configurer l'en-tête Authorization pour les futures requêtes Axios
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        // --- RÉCUPÉRER LES INFOS UTILISATEUR APRÈS LE LOGIN ---
        try {
            const userInfoResponse = await authService.getUserInfo();
            const userData = userInfoResponse.data; // Les données de UserInfoDto
            setUser(userData); // Mettre à jour l'état utilisateur dans le contexte
            localStorage.setItem('user', JSON.stringify(userData)); // Stocker les infos localement

            // <<< MODIFICATION : Retourner les données utilisateur >>>
            return userData;
            // <<< FIN MODIFICATION >>>

        } catch(userInfoError) {
             console.error("Login réussi mais getUserInfo échoué:", userInfoError);
             logout(); // Déconnexion propre si getUserInfo échoue
             // Propager une erreur spécifique pour indiquer le problème
             throw new Error("Connexion réussie mais impossible de récupérer les informations utilisateur.");
        }
        // --- FIN RÉCUPÉRATION INFOS UTILISATEUR ---

      } else {
        // Si le backend répond 200 OK mais sans token (logiquement impossible avec le code backend actuel)
        throw new Error("Token non reçu du serveur après le login.");
      }
    } catch (error) {
      // Gérer les erreurs de l'appel login (400, 401, 404, 500...)
      console.error("Erreur de connexion (catch dans AuthContext):", error);
      logout(); // S'assurer que tout est nettoyé en cas d'échec
      // Propage l'erreur pour que le composant Login puisse l'attraper et afficher un message
      throw error;
    }
  };

  // Fonction de déconnexion
  const logout = () => {
    // Optionnel: Appeler l'API de déconnexion backend
    // authService.logout().catch(err => console.error("Erreur API logout:", err));

    // Nettoyer le stockage local
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Supprimer l'en-tête Authorization par défaut d'Axios
    delete api.defaults.headers.common["Authorization"];

    // Réinitialiser l'état utilisateur dans le contexte
    setUser(null);

    // La redirection sera gérée par App.js ou ProtectedRoute via la mise à jour de l'état 'user'
  };

  // Valeur fournie par le contexte aux composants enfants
  const value = {
    user,      // L'objet utilisateur connecté (ou null)
    loading,   // Indique si le contexte est en cours de chargement initial
    login,     // La fonction pour se connecter (qui retourne maintenant userData)
    logout,    // La fonction pour se déconnecter
  };

  // Rendre le fournisseur de contexte avec la valeur et les enfants
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}