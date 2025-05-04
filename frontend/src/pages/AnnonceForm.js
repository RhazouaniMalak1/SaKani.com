// Dans pages/AnnonceForm.js

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Layout from '../components/Layout'; // Adaptez le chemin si nécessaire
import { annonceService } from '../services/api'; // Importer le service annonce
// import { useAuth } from '../contexts/AuthContext'; // Décommentez si besoin pour vérifier permissions

function AnnonceForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);
  console.log(`AnnonceForm rendu. Mode édition: ${isEditMode}, ID: ${id}`); // Log initial

  const [formData, setFormData] = useState({
    name: '', prix: '', adresseProduit: '', statut: '', description: '', telephone: '',
  });
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImageUrl, setExistingImageUrl] = useState('');
  const [loading, setLoading] = useState(isEditMode);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Charger les données de l'annonce en mode édition
  useEffect(() => {
    if (!isEditMode || !id) {
      console.log("Mode création ou ID manquant, initialisation formulaire vide.");
      setLoading(false);
      setFormData({ name: '', prix: '', adresseProduit: '', statut: '', description: '', telephone: '' });
      setSelectedImageFile(null); setImagePreview(null); setExistingImageUrl('');
      return;
    }

    console.log(`Mode édition détecté. Chargement de l'annonce ID: ${id}`);
    const fetchAnnonce = async () => {
      setLoading(true); setError(null);
      try {
        const response = await annonceService.getById(id);
        const annonce = response.data;
        console.log("Données de l'annonce récupérées pour édition:", annonce);

        setFormData({
          name: annonce.name || '',
          prix: annonce.prix != null ? String(annonce.prix) : '',
          adresseProduit: annonce.adresseProduit || '',
          statut: annonce.statut || '',
          description: annonce.description || '',
          telephone: annonce.telephone || '',
        });

        if (annonce.image) {
          console.log("Image existante trouvée:", annonce.image);
          setExistingImageUrl(annonce.image);
          // Mettre à jour l'aperçu seulement si c'est une URL ou si on sait la construire
          // Pour l'instant, on n'affiche pas l'aperçu de l'image existante si ce n'est qu'un nom de fichier
          // setImagePreview(construireUrlImage(annonce.image)); // Logique à implémenter si besoin
        } else {
          setExistingImageUrl('');
          setImagePreview(null);
        }

      } catch (err) {
        console.error(`Erreur lors du chargement de l'annonce ID ${id}:`, err.response?.data || err.message || err);
        setError("Erreur lors du chargement des données.");
        if (err.response?.status === 404) { setError(`Annonce ID ${id} non trouvée.`); }
      } finally {
        setLoading(false);
      }
    };
    fetchAnnonce();
  }, [id, isEditMode]); // Dépendances de l'effet

  // Gérer les changements dans les champs texte/select/nombre
  const handleChange = (e) => {
    const { name, value } = e.target;
    console.log(`Champ '${name}' modifié, nouvelle valeur: '${value}'`);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Gérer la sélection du fichier image
  const handleImageChange = (e) => {
    const file = e.target.files ? e.target.files[0] : null;
    if (file) {
      console.log("Fichier image sélectionné:", file.name, file.size, file.type);
      setSelectedImageFile(file); // Stocker l'objet File
      // Générer l'aperçu
      const reader = new FileReader();
      reader.onloadstart = () => console.log("Lecture de l'aperçu démarrée...");
      reader.onloadend = () => {
        console.log("Lecture de l'aperçu terminée.");
        setImagePreview(reader.result);
      };
      reader.onerror = (error) => console.error("Erreur FileReader:", error);
      reader.readAsDataURL(file);
      setExistingImageUrl(''); // Indique qu'on veut remplacer l'image existante
    } else {
      console.log("Sélection de fichier annulée.");
      setSelectedImageFile(null);
      // Remettre l'aperçu existant ? Pour l'instant non.
      setImagePreview(null);
    }
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    console.log("Soumission du formulaire démarrée...");

    const dataToSend = new FormData();
    dataToSend.append('name', formData.name);
    dataToSend.append('prix', parseFloat(formData.prix) || 0);
    dataToSend.append('adresseProduit', formData.adresseProduit || '');
    dataToSend.append('statut', formData.statut || '');
    dataToSend.append('description', formData.description || '');
    dataToSend.append('telephone', formData.telephone || '');

    if (selectedImageFile) {
      dataToSend.append('imageFile', selectedImageFile);
      console.log("Fichier image ajouté au FormData:", selectedImageFile.name);
    } else {
        console.log("Aucun nouveau fichier image ajouté au FormData.");
    }

    // Log FormData (ne montre pas le fichier mais montre les clés)
    console.log("Contenu FormData (clés):");
    for (let key of dataToSend.keys()) {
       // Pour les fichiers, dataToSend.get(key) retourne l'objet File
       const value = dataToSend.get(key);
       if(value instanceof File) {
           console.log(`  ${key}: [File: ${value.name}, Type: ${value.type}, Size: ${value.size}]`);
       } else {
           console.log(`  ${key}: ${value}`);
       }
    }


    try {
      let response;
      if (isEditMode) {
        console.log(`Appel API UPDATE pour ID: ${id}`);
        response = await annonceService.update(id, dataToSend);
        console.log("Réponse API UPDATE:", response);
      } else {
        console.log("Appel API CREATE");
        response = await annonceService.create(dataToSend);
        console.log("Réponse API CREATE:", response);
      }
      console.log("Opération réussie, redirection vers /annonces");
      navigate("/annonces", { state: { message: `Annonce ${isEditMode ? 'mise à jour' : 'créée'} avec succès !` } });
    } catch (err) {
      console.error(`Erreur lors de ${isEditMode ? "l'enregistrement" : "la création"} de l'annonce:`, err.response?.data || err.message || err);
      const errorMsg = err.response?.data?.message || err.response?.data?.title || `Erreur lors de ${isEditMode ? "l'enregistrement" : "la création"}. Vérifiez les détails dans la console.`;
      setError(errorMsg);
      // Gérer les erreurs de validation spécifiques si le backend les renvoie
      // if (err.response?.data?.errors) { setValidationErrors(parseValidationErrors(err.response.data.errors)); }
    } finally {
      console.log("Fin de la soumission.");
      setSubmitting(false);
    }
  };

  // Affichage pendant le chargement initial en mode édition
  if (loading && isEditMode) {
    return (
      <Layout>
        <div className="text-center py-8 loading">Chargement de l'annonce...</div>
      </Layout>
    );
  }

  // Rendu JSX du formulaire
  return (
    <Layout>
      {/* En-tête de page */}
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

        {/* Formulaire avec enctype pour les fichiers */}
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="card-content space-y-4">
            {/* Affichage message d'erreur général */}
            {error && <div className="error-message mb-4">{error}</div>}

            {/* --- Champs du formulaire --- */}
            {/* Nom */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">Nom *</label>
              <input type="text" id="name" name="name" required maxLength="100" className="form-input" placeholder="Nom de l'annonce" value={formData.name} onChange={handleChange} />
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea id="description" name="description" rows="4" className="form-textarea" placeholder="Description détaillée..." value={formData.description} onChange={handleChange}></textarea>
            </div>

            {/* Grille Prix / Adresse */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="prix" className="form-label">Prix (MAD) *</label>
                <input type="number" id="prix" name="prix" required step="0.01" min="0.01" className="form-input" placeholder="Ex: 150000.50" value={formData.prix} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label htmlFor="adresseProduit" className="form-label">Adresse / Lieu</label>
                <input type="text" id="adresseProduit" name="adresseProduit" maxLength="255" className="form-input" placeholder="Ex: Quartier Maârif, Casablanca" value={formData.adresseProduit} onChange={handleChange} />
              </div>
            </div>

            {/* Grille Statut / Téléphone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <label htmlFor="statut" className="form-label">Statut</label>
                <select id="statut" name="statut" className="form-select" value={formData.statut} onChange={handleChange}>
                  <option value="">-- Sélectionner --</option>
                  <option value="Neuf">Neuf</option>
                  <option value="Bonne Occasion">Bonne Occasion</option>
                  <option value="Deuxieme Main">Deuxième Main</option>
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="telephone" className="form-label">Téléphone</label>
                <input type="tel" id="telephone" name="telephone" className="form-input" placeholder="Ex: 06xxxxxxxx" value={formData.telephone} onChange={handleChange} pattern="[0-9]{10}" title="Veuillez entrer 10 chiffres" />
              </div>
            </div>

            {/* Champ Image (type="file") */}
            <div className="form-group">
                <label htmlFor="imageFile" className="form-label">Image</label>
                <input
                    type="file"
                    id="imageFile"
                    name="imageFile" // Correspond au paramètre IFormFile du backend
                    className="form-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleImageChange} // Handler spécifique
                />
                {/* Affichage de l'aperçu */}
                {imagePreview && (
                    <div className="mt-3">
                        <p className="text-sm text-muted mb-1">Aperçu :</p>
                        <img src={imagePreview} alt="Aperçu" className="max-h-48 rounded border shadow-sm" />
                    </div>
                )}
                 <p className="text-xs text-muted mt-1">Sélectionnez un fichier image (jpg, png, webp).</p>
                 {/* Affichage de l'image existante en mode édition (juste le nom/path pour info) */}
                 {isEditMode && existingImageUrl && !selectedImageFile && (
                    <p className="text-xs text-muted mt-1">Image actuelle: {existingImageUrl}</p>
                 )}
            </div>

          </div>

          {/* Pied de la carte avec les boutons */}
          <div className="card-footer">
            <Link to="/annonces" className="btn btn-secondary">Annuler</Link>
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