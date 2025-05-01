import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
// Import du service d'authentification
import { authService } from "../services/api"; // Assurez-vous que le chemin est correct

function Register() {
  // État du formulaire correspondant au RegisterDto backend + confirmPassword
  const [formData, setFormData] = useState({
    nom: "",
    prenom: "",
    email: "",
    password: "",
    confirmPassword: "",
    userType: "Client", // Valeur initiale (chaîne de caractères)
  });
  // État pour les erreurs générales
  const [error, setError] = useState("");
  // État pour les erreurs de validation spécifiques aux champs
  const [validationErrors, setValidationErrors] = useState({});
  // État pour l'indicateur de chargement
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Hook pour la redirection

  // Gère les changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Efface l'erreur de validation spécifique au champ modifié
    if (validationErrors[name]) {
        setValidationErrors(prev => {
            const newErrors = {...prev};
            delete newErrors[name];
            return newErrors;
        });
    }
  };

  // Fonction pour traiter et afficher les erreurs reçues du backend
  const displayErrors = (errorData) => {
    let messages = [];
    let fieldErrors = {};
    // Gère les erreurs de validation structurées d'ASP.NET Core
    if (errorData && errorData.errors) {
      for (const key in errorData.errors) {
        messages.push(...errorData.errors[key]);
        const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
        if (!fieldErrors[fieldName]) {
           fieldErrors[fieldName] = errorData.errors[key][0];
        }
      }
    // Gère un message d'erreur global fourni par le backend
    } else if (errorData && errorData.message) {
        messages.push(errorData.message);
    // Gère une simple chaîne comme erreur
    } else if (typeof errorData === 'string'){
        messages.push(errorData);
    // Cas par défaut
    } else {
        messages.push("Une erreur inconnue est survenue.");
    }
    setError(messages.join(" ")); // Afficher toutes les erreurs concaténées
    setValidationErrors(fieldErrors); // Stocker les erreurs par champ
  };

  // Gère la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault(); // Empêche le rechargement de la page
    setError(""); // Réinitialise les erreurs générales
    setValidationErrors({}); // Réinitialise les erreurs de champ
    setLoading(true); // Active l'indicateur de chargement

    // Validation frontend simple pour la correspondance des mots de passe
    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      setValidationErrors(prev => ({...prev, confirmPassword: "Les mots de passe ne correspondent pas."}));
      setLoading(false); // Arrête le chargement
      return; // Arrête l'exécution
    }

    // --- CONVERSION DE userType (string) EN NOMBRE ---
    let userTypeValue;
    switch (formData.userType) {
      case "Admin":
        userTypeValue = 1;
        break;
      case "Vendeur":
        userTypeValue = 2;
        break;
      case "Client":
      default: // Sécurité si la valeur est inattendue
        userTypeValue = 3;
        break;
    }
    // --- FIN CONVERSION ---

    // Préparation du payload à envoyer à l'API (correspondant au RegisterDto C#)
    const payload = {
      nom: formData.nom,
      prenom: formData.prenom,
      email: formData.email,
      password: formData.password,
      confirmPassword: formData.confirmPassword, // Envoyer pour validation backend si nécessaire
      userType: userTypeValue, // Envoyer la valeur NUMÉRIQUE
    };

    try {
      // Appel à l'API via le service d'authentification
      const response = await authService.register(payload);

      // Si l'appel réussit (status 200 ou 201 selon le backend)
      if (response.status === 200 || response.status === 201) {
        // Redirige vers la page de connexion avec un message de succès
        navigate("/login", {
          state: { message: response.data.message || "Compte créé avec succès. Veuillez vous connecter." },
        });
      } else {
         // Gérer une réponse de succès inattendue
         setError("Réponse inattendue du serveur après l'inscription.");
      }
    } catch (err) {
      // Gestion des erreurs lors de l'appel API
      console.error("Erreur d'inscription:", err);
      if (err.response && err.response.data) {
           // Tenter d'afficher les erreurs renvoyées par le backend
           displayErrors(err.response.data);
      } else {
        // Erreur réseau ou autre problème
        setError("Une erreur réseau ou serveur est survenue lors de l'inscription.");
      }
    } finally {
      // Arrêter l'indicateur de chargement dans tous les cas
      setLoading(false);
    }
  };

  // Rendu du composant JSX
  return (
    <div className="login-container">
      {/* Section image optionnelle */}
      {/* <div className="login-image">...</div> */}

      <div className="card login-card">
        <div className="card-header">
          {/* Logo et Titre (à adapter) */}
          <div className="login-logo">{/* ... svg ... */}</div>
          <h1 className="card-title text-center">Votre Application</h1>
          <p className="card-description text-center">Créez votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="card-content">
          {/* Affichage des erreurs générales (si pas d'erreur spécifique de champ) */}
          {error && !Object.keys(validationErrors).length > 0 && (
            <div className="form-group">
              <div className="error-message">{error}</div>
            </div>
          )}

          {/* Champ Nom */}
          <div className="form-group">
            <label htmlFor="nom" className="form-label">Nom</label>
            <input
              type="text" id="nom" name="nom" required
              className={`form-input ${validationErrors.nom ? 'is-invalid' : ''}`}
              placeholder="Entrez votre nom"
              value={formData.nom} onChange={handleChange}
            />
            {validationErrors.nom && <div className="invalid-feedback">{validationErrors.nom}</div>}
          </div>

          {/* Champ Prénom */}
          <div className="form-group">
            <label htmlFor="prenom" className="form-label">Prénom</label>
            <input
              type="text" id="prenom" name="prenom" required
              className={`form-input ${validationErrors.prenom ? 'is-invalid' : ''}`}
              placeholder="Entrez votre prénom"
              value={formData.prenom} onChange={handleChange}
            />
            {validationErrors.prenom && <div className="invalid-feedback">{validationErrors.prenom}</div>}
          </div>

          {/* Champ Email */}
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email</label>
            <input
              type="email" id="email" name="email" required
              className={`form-input ${validationErrors.email ? 'is-invalid' : ''}`}
              placeholder="Entrez votre email"
              value={formData.email} onChange={handleChange}
            />
            {validationErrors.email && <div className="invalid-feedback">{validationErrors.email}</div>}
          </div>

          {/* Champ Mot de passe */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">Mot de passe</label>
            <input
              type="password" id="password" name="password" required minLength="6"
              className={`form-input ${validationErrors.password ? 'is-invalid' : ''}`}
              placeholder="Minimum 6 caractères"
              value={formData.password} onChange={handleChange}
            />
            {validationErrors.password && <div className="invalid-feedback">{validationErrors.password}</div>}
          </div>

          {/* Champ Confirmer Mot de passe */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirmer le mot de passe</label>
            <input
              type="password" id="confirmPassword" name="confirmPassword" required minLength="6"
              className={`form-input ${validationErrors.confirmPassword ? 'is-invalid' : ''}`}
              placeholder="Confirmez votre mot de passe"
              value={formData.confirmPassword} onChange={handleChange}
            />
            {validationErrors.confirmPassword && <div className="invalid-feedback">{validationErrors.confirmPassword}</div>}
          </div>

          {/* Select Type de compte */}
          <div className="form-group">
            <label htmlFor="userType" className="form-label">Type de compte</label>
            <select
              id="userType" name="userType" required
              className={`form-input ${validationErrors.userType ? 'is-invalid' : ''}`}
              value={formData.userType} onChange={handleChange}
            >
              <option value="Client">Client</option>
              <option value="Vendeur">Vendeur</option>
              <option value="Admin">Admin</option>
            </select>
            {validationErrors.userType && <div className="invalid-feedback">{validationErrors.userType}</div>}
          </div>

          {/* Bouton d'inscription */}
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Inscription en cours..." : "S'inscrire"}
          </button>

          {/* Lien vers la connexion */}
          <div className="text-center mt-4">
            <p className="text-muted">
              Vous avez déjà un compte ?{" "}
              <Link to="/login" className="text-primary">Connectez-vous</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;