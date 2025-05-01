// Dans pages/AnnonceDetail.js

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout'; // Adapter le chemin si nécessaire
import { annonceService } from '../services/api'; // Adapter le chemin si nécessaire
// Optionnel: import { useAuth } from '../contexts/AuthContext';

function AnnonceDetail() {
  const { id } = useParams(); // Récupère l'ID depuis l'URL
  const navigate = useNavigate(); // Pour la redirection éventuelle
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
        setAnnonce(response.data); // Stocke les données de l'annonce reçues
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
  }, [id]); // Se redéclenche si l'ID change

  // Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const options = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString('fr-FR', options);
  };

  // Fonction pour formater le prix
   const formatPrice = (price) => {
    if (price == null) return "N/A";
    return price.toLocaleString('fr-FR', { style: 'currency', currency: 'MAD' });
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

   // Affichage si l'annonce n'est pas trouvée (après chargement)
   if (!annonce) {
     return (
      <Layout>
        <div className="header">
          <h1 className="page-title">Annonce introuvable</h1>
           <Link to="/annonces" className="btn btn-secondary">Retour à la liste</Link>
        </div>
         <div className="card">
          <div className="card-content text-center py-8">L'annonce demandée n'a pas pu être chargée.</div>
         </div>
      </Layout>
     );
   }

  // Affichage des détails de l'annonce
  return (
    <Layout>
      <div className="header">
        <h1 className="page-title">Détails de l'Annonce</h1>
        <Link to="/annonces" className="btn btn-secondary">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="btn-icon"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Retour à la liste
        </Link>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">{annonce.name}</h2>
          <p className="card-description">Créée le : {formatDate(annonce.dateCreation)}</p>
          {annonce.deletionRequested && (
            <p className="badge badge-warning mt-2">Demande de suppression en attente</p>
          )}
        </div>
        <div className="card-content space-y-4">
          <div>
            <strong className="block text-gray-700">Prix :</strong>
            <span className="text-lg font-semibold text-primary">{formatPrice(annonce.prix)}</span>
          </div>
          {annonce.statut && (
             <div>
               <strong className="block text-gray-700">Statut :</strong>
               <span>{annonce.statut}</span> <span className={getStatusBadgeClass(annonce.statut)}>(Badge)</span>
             </div>
          )}
           {annonce.adresseProduit && (
             <div>
               <strong className="block text-gray-700">Adresse / Lieu :</strong>
               <span>{annonce.adresseProduit}</span>
             </div>
           )}
           {annonce.description && (
            <div>
              <strong className="block text-gray-700">Description :</strong>
              <p className="mt-1 text-gray-600 whitespace-pre-wrap">{annonce.description}</p> {/* whitespace-pre-wrap pour respecter les sauts de ligne */}
            </div>
          )}

           {/* Vous pouvez ajouter ici des informations sur le vendeur ou l'admin si nécessaire */}
           {/* Exemple:
           <div>
             <strong className="block text-gray-700">Vendeur ID :</strong>
             <span>{annonce.vendeurId}</span>
           </div>
           {annonce.adminId && (
              <div>
               <strong className="block text-gray-700">Admin Modificateur/Suppresseur ID :</strong>
               <span>{annonce.adminId}</span>
             </div>
           )}
           */}

        </div>
         {/* Pied de carte optionnel pour des actions spécifiques à la page détail */}
         {/*
         <div className="card-footer">
              <Link to={`/annonces/${annonce.id}`} className="btn btn-primary">Modifier</Link>
         </div>
         */}
      </div>
    </Layout>
  );
}

// Fonction helper pour le badge (peut être mise dans un fichier utilitaire)
const getStatusBadgeClass = (status) => {
    switch (status?.toLowerCase()) {
      case "neuf": return "badge badge-success";
      case "deuxieme main": return "badge badge-info";
      case "bonne occasion": return "badge badge-warning";
      default: return "badge";
    }
  };

export default AnnonceDetail;