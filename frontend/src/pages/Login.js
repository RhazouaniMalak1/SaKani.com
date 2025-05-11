import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // Assurez-vous que le chemin est correct

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  // États pour afficher les infos après succès (pour débogage/confirmation)
  const [loggedInUserInfo, setLoggedInUserInfo] = useState(null);
  const [receivedToken, setReceivedToken] = useState(null);
  // Fonction login du contexte
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Pour récupérer les messages (ex: après inscription)

  // Gère l'affichage d'un message de succès passé via la navigation
  useEffect(() => {
    if (location.state && location.state.message) {
      setSuccessMessage(location.state.message);
      // Efface le message après 5 secondes
      const timer = setTimeout(() => setSuccessMessage(""), 5000);
      return () => clearTimeout(timer); // Nettoyage du timer si le composant est démonté
    }
  }, [location]); // Ré-exécuter si location change

  // Gère la soumission du formulaire de connexion
  const handleSubmit = async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page
    setError(""); // Réinitialise les erreurs précédentes
    setLoggedInUserInfo(null); // Réinitialise l'affichage des infos user
    setReceivedToken(null);     // Réinitialise l'affichage du token
    setLoading(true); // Démarre l'indicateur de chargement

    try {
      // Appel de la fonction login du contexte (qui retourne maintenant userInfo)
      const userInfo = await login({ email: email, password: password });

      // Si login a réussi et retourné les informations utilisateur
      if (userInfo) {
        console.log("Connexion réussie !");

        // Stocke les informations pour les afficher temporairement
        setLoggedInUserInfo(userInfo);
        // Récupère le token fraîchement stocké pour l'afficher
        const token = localStorage.getItem('token');
        setReceivedToken(token);

        // Log dans la console (pour débogage)
        console.log("Token reçu:", token);
        console.log("Infos Utilisateur reçues:", userInfo);

        // Optionnel : Navigue vers la page principale après un délai
        // pour laisser le temps de voir le message de succès et les infos
        setTimeout(() => {
          navigate("/"); // Redirige vers la page principale (définie dans App.js)
        }, 3000); // Délai de 3 secondes

      } else {
         // Ce cas est moins probable si `login` lève une erreur en cas d'échec
        setError("Échec de la connexion (login n'a pas retourné d'utilisateur).");
      }
    } catch (err) {
        // Attrape les erreurs levées par la fonction `login` du contexte
        console.error("Erreur de connexion (catch dans Login.js):", err);
        // Essaye d'extraire un message d'erreur pertinent depuis la réponse API ou l'erreur JS
        const message = err.response?.data?.message || err.message || "Une erreur est survenue lors de la connexion.";
        setError(message);
    } finally {
      // Arrête l'indicateur de chargement dans tous les cas
      setLoading(false);
    }
  };

  // Rendu JSX du composant
  return (
    <div className="login-container">
      {/* Section image optionnelle */}
      <div className="login-image">
      <img src="asset/ggg.png" alt="Login Illustration" />

      </div>

      <div className="card login-card">
        <div className="card-header">
          {/* Logo */}
          <div className="login-logo">
            <svg
              xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            >
              <path d="M2 20h20"></path>
              <path d="M5 20V8.2a1 1 0 0 1 .4-.8l4.6-3.8a1 1 0 0 1 1.2 0l4.6 3.8a1 1 0 0 1 .4.8V20"></path>
              <path d="M8 12h8"></path><path d="M8 16h8"></path>
            </svg>
          </div>
          {/* Titre et description */}
          <h1 className="card-title text-center">Sakani.com</h1>
          <p className="card-description text-center">Connectez-vous pour accéder</p>
        </div>

        <form onSubmit={handleSubmit} className="card-content">
          {/* Affichage message de succès (ex: après inscription) */}
          {successMessage && (
            <div className="form-group">
              <div className="success-message">{successMessage}</div>
            </div>
          )}
          {/* Affichage message d'erreur */}
          {error && (
            <div className="form-group">
              <div className="error-message">{error}</div>
            </div>
          )}

          {/* Champ Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email" id="email" required
              className="form-input"
              placeholder="nom@example.com"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Champ Mot de passe */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">Mot de passe</label>
            <input
              type="password" id="password" required
              className="form-input"
              placeholder="••••••••"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Bouton de soumission */}
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>

          {/* Lien vers l'inscription */}
          <div className="text-center mt-4">
            <p className="text-muted">
              Vous n'avez pas de compte ?{" "}
              <Link to="/register" className="text-primary">Inscrivez-vous</Link>
            </p>
          </div>

           {/* Affichage conditionnel des infos après succès (pour débogage) */}
           {loggedInUserInfo && (
            <div className="success-message mt-4" style={{ border: '1px solid green', padding: '10px', background: '#e9f7ef', borderRadius: '4px' }}>
              <h4 style={{ marginTop: '0', color: '#155724' }}>Connexion Réussie!</h4>
              <p><strong>ID:</strong> {loggedInUserInfo.id}</p>
              <p><strong>Nom:</strong> {loggedInUserInfo.prenom} {loggedInUserInfo.nom}</p>
              <p><strong>Email:</strong> {loggedInUserInfo.email}</p>
              <p><strong>Rôles:</strong> {loggedInUserInfo.roles?.join(', ') || 'N/A'}</p>
              <p style={{ wordBreak: 'break-all', fontSize: '0.8em' }}>
                <strong>Token:</strong> {receivedToken ? receivedToken.substring(0, 40) + '...' : 'Non trouvé'}
              </p>
              <p><em>Redirection vers l'accueil dans 3 secondes...</em></p>
            </div>
          )}
          {/* --- FIN Affichage conditionnel --- */}

        </form>
      </div>
    </div>
  );
}

export default Login;