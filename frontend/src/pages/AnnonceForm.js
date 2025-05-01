// Dans pages/AnnonceForm.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout'; // Assurez-vous que le chemin est correct
import { annonceService } from '../services/api'; // Importer le service annonce
// import { useAuth } from '../contexts/AuthContext'; // Décommentez si besoin pour vérifier permissions

function AnnonceForm() {
  const { id } = useParams(); // Récupère l'ID de l'URL s'il existe
  const navigate = useNavigate(); // Hook pour la redirection
  // const { user } = useAuth(); // Récupère l'utilisateur si besoin
  const isEditMode = Boolean(id); // Détermine si on est en mode édition

  // État du formulaire
  const [formData, setFormData] = useState({
    name: '',
    prix: '',
    adresseProduit: '',
    statut: '', // Valeur initiale vide pour le select
    description: '',
  });

  // État pour le chargement des données initiales (en mode édition)
  const [loading, setLoading] = useState(isEditMode);
  // État pour les erreurs générales
  const [error, setError] = useState(null);
  // État pour indiquer si le formulaire est en cours de soumission
  const [submitting, setSubmitting] = useState(false);
  // État pour les erreurs de validation spécifiques (optionnel, non utilisé dans l'exemple ProjectForm)
  // const [validationErrors, setValidationErrors] = useState({});

  // Charger les données de l'annonce en mode édition
  useEffect(() => {
    // Ne s'exécute que si on est en mode édition et que l'ID est présent
    if (!isEditMode || !id) {
        setLoading(false); // Pas de chargement si création
        return;
    }

    const fetchAnnonce = async () => {
      try {
        setLoading(true); // Démarre le chargement
        setError(null);   // Réinitialise les erreurs
        const response = await annonceService.getById(id);
        const annonce = response.data;

        // Pré-remplir le formulaire
        setFormData({
          name: annonce.name || '',
          // Convertir le prix en chaîne pour le champ input type number
          prix: annonce.prix != null ? String(annonce.prix) : '',
          adresseProduit: annonce.adresseProduit || '',
          statut: annonce.statut || '',
          description: annonce.description || '',
        });
      } catch (err) {
        console.error("Erreur lors du chargement de l'annonce:", err);
        setError("Erreur lors du chargement des données de l'annonce.");
        // Gérer le cas 404 si nécessaire
        if (err.response?.status === 404) {
            setError(`Annonce avec l'ID ${id} non trouvée.`);
            // Optionnel: rediriger après un délai
            // setTimeout(() => navigate('/annonces'), 3000);
        }
      } finally {
        setLoading(false); // Arrête le chargement
      }
    };

    fetchAnnonce();
  }, [id, isEditMode]); // Dépendances : id et isEditMode

  // Gérer les changements dans les champs du formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault(); // Empêche le rechargement
    setSubmitting(true); // Démarre l'indicateur de soumission
    setError(null); // Réinitialise les erreurs

    // Préparer le payload en s'assurant que le prix est un nombre
    const payload = {
      ...formData,
      prix: parseFloat(formData.prix) || 0, // Convertit en nombre, 0 si invalide/vide
    };

    try {
      // Appeler le service approprié (création ou mise à jour)
      if (isEditMode) {
        await annonceService.update(id, payload);
      } else {
        await annonceService.create(payload);
      }
      // Rediriger vers la liste des annonces après succès
      navigate("/annonces", { state: { message: `Annonce ${isEditMode ? 'mise à jour' : 'créée'} avec succès !` } });
    } catch (err) {
      console.error(`Erreur lors de ${isEditMode ? "l'enregistrement" : "la création"} de l'annonce:`, err);
      // Essayer d'afficher un message d'erreur du backend ou un message générique
      const errorMsg = err.response?.data?.message || err.response?.data?.title || `Erreur lors de ${isEditMode ? "l'enregistrement" : "la création"} de l'annonce.`;
      setError(errorMsg);
      // Vous pourriez aussi utiliser displayErrors si le backend retourne un objet 'errors' détaillé
      // if (err.response?.data?.errors) { setValidationErrors(parseValidationErrors(err.response.data.errors)); }
    } finally {
      setSubmitting(false); // Arrête l'indicateur de soumission
    }
  };

  // Affichage pendant le chargement initial (mode édition)
  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">Chargement de l'annonce...</div>
      </Layout>
    );
  }

  // Rendu JSX du formulaire
  return (
    <Layout>
      {/* En-tête de page avec titre dynamique et bouton retour */}
      <div className="header">
        <div className="flex items-center gap-2">
          <Link to="/annonces" className="btn btn-secondary">
             <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Retour
          </Link>
          <h1 className="page-title">{isEditMode ? "Modifier l'Annonce" : "Nouvelle Annonce"}</h1>
        </div>
      </div>

      {/* Carte contenant le formulaire */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Informations de l'annonce</h2>
          <p className="card-description">
            {isEditMode ? "Modifiez les détails de l'annonce" : "Remplissez les informations pour créer une nouvelle annonce"}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Contenu du formulaire */}
          <div className="card-content space-y-4">
            {/* Affichage message d'erreur général */}
            {error && <div className="error-message mb-4">{error}</div>}

            {/* Champ Nom */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">Nom *</label>
              <input
                type="text" id="name" name="name" required maxLength="100"
                className="form-input" placeholder="Nom de l'annonce"
                value={formData.name} onChange={handleChange}
              />
               {/* Affichage erreur validation spécifique (si implémenté) */}
               {/* {validationErrors.name && <div className="invalid-feedback">{validationErrors.name}</div>} */}
            </div>

            {/* Champ Description */}
            <div className="form-group">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description" name="description" rows="4"
                className="form-textarea" placeholder="Description détaillée..."
                value={formData.description} onChange={handleChange}
              ></textarea>
               {/* {validationErrors.description && <div className="invalid-feedback">{validationErrors.description}</div>} */}
            </div>

            {/* Grille pour Prix et Adresse */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Champ Prix */}
                <div className="form-group">
                  <label htmlFor="prix" className="form-label">Prix (MAD) *</label>
                  <input
                    type="number" id="prix" name="prix" required step="0.01" min="0.01"
                    className="form-input" placeholder="Ex: 150000.50"
                    value={formData.prix} onChange={handleChange}
                  />
                   {/* {validationErrors.prix && <div className="invalid-feedback">{validationErrors.prix}</div>} */}
                </div>

                {/* Champ Adresse */}
                 <div className="form-group">
                  <label htmlFor="adresseProduit" className="form-label">Adresse / Lieu</label>
                  <input
                    type="text" id="adresseProduit" name="adresseProduit" maxLength="255"
                    className="form-input" placeholder="Ex: Quartier Maârif, Casablanca"
                    value={formData.adresseProduit} onChange={handleChange}
                  />
                   {/* {validationErrors.adresseProduit && <div className="invalid-feedback">{validationErrors.adresseProduit}</div>} */}
                </div>
            </div>

             {/* Champ Statut (Select) */}
             <div className="form-group">
                <label htmlFor="statut" className="form-label">Statut</label>
                <select
                    id="statut" name="statut"
                    className="form-select" // Assurez-vous que cette classe est stylée
                    value={formData.statut} onChange={handleChange}
                >
                    <option value="">-- Non spécifié --</option>
                    <option value="Neuf">Neuf</option>
                    <option value="Bonne Occasion">Bonne Occasion</option>
                    <option value="Deuxieme Main">Deuxième Main</option>
                    {/* Ajoutez d'autres options si nécessaire */}
                </select>
                {/* {validationErrors.statut && <div className="invalid-feedback">{validationErrors.statut}</div>} */}
             </div>

          </div>

          {/* Pied de la carte avec les boutons */}
          <div className="card-footer">
            <Link to="/annonces" className="btn btn-secondary">
              Annuler
            </Link>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? "Enregistrement..." : isEditMode ? "Mettre à jour l'Annonce" : "Créer l'Annonce"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

export default AnnonceForm;