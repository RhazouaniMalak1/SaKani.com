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
    userType: "Client", // Valeur initiale par défaut (un des types possibles)
  });
  // État pour les erreurs générales
  const [error, setError] = useState("");
  // État pour les erreurs de validation spécifiques aux champs
  const [validationErrors, setValidationErrors] = useState({});
  // État pour l'indicateur de chargement
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate(); // Hook pour la redirection

  // Gère les changements dans les champs du formulaire (utilisé pour les inputs textuels)
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

  // NOUVEAU: Gère la sélection du type d'utilisateur via les boutons
  const handleUserTypeSelect = (userType) => {
    setFormData((prev) => ({ ...prev, userType: userType }));
     // Efface l'erreur de validation pour userType si elle existe
    if (validationErrors.userType) {
        setValidationErrors(prev => {
            const newErrors = {...prev};
            delete newErrors.userType;
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
        // Convertir la clé PascalCase en camelCase pour correspondre aux noms des champs dans le state `formData`
        // Exemple: "UserType" -> "userType"
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
    // Afficher toutes les erreurs qui n'ont pas été mappées à un champ spécifique comme erreur générale
    const generalErrorMessage = messages.filter(msg => !Object.values(fieldErrors).includes(msg)).join(" ");
    setError(generalErrorMessage);
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
    // Cette logique reste la même et est cruciale pour envoyer la bonne valeur numérique à l'API
    let userTypeValue;
    switch (formData.userType) {
      case "Admin":
        userTypeValue = 1;
        break;
      case "Vendeur":
        userTypeValue = 2;
        break;
      case "Client":
      default: // Sécurité si la valeur est inattendue (par défaut à Client si non spécifié)
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
      userType: userTypeValue, // Envoyer la valeur NUMÉRIQUE déterminée par la sélection
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
          {/* Logo et Titre */}
          <div className="login-logo">
             {/* Assurez-vous que le SVG du logo est bien ici */}
             {/* <svg ... votre svg ici ... ></svg> */}
          </div>
          <h1 className="card-title text-center">Sakani.com</h1>
          <p className="card-description text-center">Créez votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="card-content">
          {/* Affichage des erreurs générales (si pas d'erreur spécifique de champ) */}
           {/* Modifié pour afficher l'erreur générale même s'il y a des erreurs de champ spécifiques */}
          {error && (
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

          {/* !!! NOUVEAU : Groupe de Boutons pour Type de compte !!! */}
          <div className="form-group">
            <label className="form-label">Type de compte</label> {/* Label for the group */}
            <div className="user-type-buttons"> {/* Container for the buttons */}
              <button
                type="button" // Important: type="button" pour ne pas soumettre le formulaire
                className={`user-type-button ${formData.userType === 'Client' ? 'selected' : ''}`}
                onClick={() => handleUserTypeSelect('Client')}
              >
                Espace Client
              </button>
              <button
                type="button"
                 className={`user-type-button ${formData.userType === 'Vendeur' ? 'selected' : ''}`}
                 onClick={() => handleUserTypeSelect('Vendeur')}
              >
                Espace Vendeur
              </button>
              <button
                type="button"
                 className={`user-type-button ${formData.userType === 'Admin' ? 'selected' : ''}`}
                 onClick={() => handleUserTypeSelect('Admin')}
              >
                Espace Admin
              </button>
            </div>
             {/* Afficher l'erreur de validation spécifique à userType sous les boutons */}
            {validationErrors.userType && <div className="invalid-feedback">{validationErrors.userType}</div>}
          </div>
          {/* !!! FIN NOUVEAU !!! */}


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