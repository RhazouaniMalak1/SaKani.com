// Dans pages/AnnonceDetail.js

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout'; // Adapter le chemin si nécessaire
import { annonceService } from '../services/api'; // Adapter le chemin si nécessaire
// Optionnel: Importer useAuth si vous avez besoin d'infos sur l'user connecté ici
// import { useAuth } from '../contexts/AuthContext';

// --- Icône pour Téléphone (optionnel) ---
const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);
// --- Fin Icônes ---


function AnnonceDetail() {
  const { id } = useParams(); // Récupère l'ID depuis l'URL
  const navigate = useNavigate();
  // Optionnel: const { user } = useAuth();

  const [annonce, setAnnonce] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnnonceDetail = async () => {
      if (!id) {
        setError("Aucun ID d'annonce fourni.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);
        const response = await annonceService.getById(id);
        console.log("Détails annonce reçus:", response.data); // Log pour vérifier
        setAnnonce(response.data);
      } catch (err) {
        console.error("Erreur chargement détails annonce:", err);
        if (err.response?.status === 404) {
            setError(`Annonce avec l'ID ${id} non trouvée.`);
        } else {
            setError("Erreur lors du chargement des détails de l'annonce.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnnonceDetail();
  }, [id]); // Dépendance sur l'ID

  // Fonction pour formater la date et l'heure
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    try {
        return new Date(dateString).toLocaleDateString('fr-FR', options);
    } catch (e) {
        console.error("Erreur formatage date:", e);
        return dateString; // Retourne la date brute en cas d'erreur
    }
  };

  // Fonction pour formater le prix
   const formatPrice = (price) => {
    if (price == null || isNaN(price)) return "N/A";
    return price.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' });
   };

   // Fonction pour le style des badges (peut être partagée)
   const getStatusBadgeClass = (status) => {
     const statusClean = status?.trim().toLowerCase() || '';
     switch (statusClean) {
       case "neuf": return "badge badge-success";
       case "bonne occasion": return "badge badge-warning";
       case "deuxieme main": return "badge badge-info";
       default: return "badge";
     }
   };

  // Affichage pendant le chargement
  if (loading) {
    return <Layout><div className="loading text-center py-8">Chargement des détails...</div></Layout>;
  }

  // Affichage en cas d'erreur
  if (error) {
    return (
      <Layout>
        <div className="header">
          <h1 className="page-title">Erreur</h1>
           <Link to="/annonces" className="btn btn-secondary">Retour à la liste</Link>
        </div>
        <div className="card">
          <div className="card-content error-message text-center py-8">{error}</div>
        </div>
      </Layout>
    );
  }

   // Affichage si l'annonce n'est pas trouvée
   if (!annonce) {
     return (
      <Layout>
        <div className="header">
          <h1 className="page-title">Annonce Introuvable</h1>
           <Link to="/annonces" className="btn btn-secondary">Retour à la liste</Link>
        </div>
         <div className="card">
          <div className="card-content text-center py-8">L'annonce demandée n'a pas pu être chargée ou n'existe pas.</div>
         </div>
      </Layout>
     );
   }

  // Affichage des détails de l'annonce
  return (
    <Layout>
      <div className="header">
        {/* Retourne à la page précédente ou à la liste */}
        <button onClick={() => navigate(-1)} className="btn btn-secondary mr-4">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Retour
        </button>
        <h1 className="page-title flex-1">{annonce.name || "Détails de l'Annonce"}</h1> {/* flex-1 pour prendre l'espace */}
        {/* Optionnel : Bouton Modifier si autorisé */}
        {/* {user && (user.id === annonce.vendeurId || user.roles?.includes('Admin')) && (
             <Link to={`/annonces/${annonce.id}`} className="btn btn-primary ml-auto">Modifier</Link>
        )} */}

      </div>

      <div className="card">
        <div className="card-header flex justify-between items-center"> {/* Utilisation de flex pour aligner */}
            <div>
                <h2 className="card-title">{annonce.name}</h2>
                <p className="card-description text-sm">
                    Publiée le : {formatDate(annonce.dateCreation)}
                </p>
            </div>
            {/* Affiche le statut avec un badge */}
            {annonce.statut && (
                <span className={`${getStatusBadgeClass(annonce.statut)} ml-4`}>{annonce.statut}</span>
             )}
        </div>
        <div className="card-content space-y-4"> {/* Ajoute de l'espace vertical */}

          


          <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Grille pour Prix et Téléphone */}
            <div>
                <strong className="block text-gray-700">Prix :</strong>
                <span className="text-xl font-semibold text-primary">{formatPrice(annonce.prix)}</span>
            </div>
             {/* --- AJOUT : Affichage Téléphone --- */}
            {annonce.telephone && (
                <div>
                    <strong className="block text-gray-700"><PhoneIcon />Téléphone :</strong>
                    {/* Optionnel: Rendre le numéro cliquable */}
                    <a href={`tel:${annonce.telephone}`} className="text-gray-800 hover:text-primary">{annonce.telephone}</a>
                </div>
            )}
             {/* --- FIN AJOUT Téléphone --- */}
          </div>


           {annonce.adresseProduit && (
             <div>
               <strong className="block text-gray-700">Adresse / Lieu :</strong>
               <span className="text-gray-800">{annonce.adresseProduit}</span>
             </div>
           )}

           {annonce.description && (
            <div>
              <strong className="block text-gray-700">Description :</strong>
              {/* Utiliser une div pour mieux gérer les retours à la ligne */}
              <div className="mt-1 text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded border">
                {annonce.description}
              </div>
            </div>
          )}

           {/* Affichage de l'état de demande de suppression */}
           {annonce.deletionRequested && (
              <div className="p-3 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
                <AlertTriangleIcon /> Une demande de suppression est en attente pour cette annonce.
              </div>
           )}

         

        </div>
      </div>
    </Layout>
  );
}


// Fonction helper pour le badge (peut être mise dans un fichier utilitaire)
// Assurez-vous que les classes CSS existent (badge, badge-success, etc.)
const getStatusBadgeClass = (status) => {
    const statusClean = status?.trim().toLowerCase() || '';
    switch (statusClean) {
      case "neuf": return "badge badge-success";
      case "bonne occasion": return "badge badge-warning";
      case "deuxieme main": return "badge badge-info";
      default: return "badge";
    }
  };

// Icône Alerte Triangle (si non importée de lucide-react)
const AlertTriangleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-2 align-text-bottom">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
);

export default AnnonceDetail;