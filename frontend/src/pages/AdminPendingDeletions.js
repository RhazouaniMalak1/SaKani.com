// Dans pages/AdminPendingDeletions.js

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout"; // Adaptez le chemin si nécessaire
import { annonceService } from "../services/api"; // Adaptez le chemin si nécessaire
import { useAuth } from "../contexts/AuthContext"; // Pour vérifier le rôle Admin

// --- Icônes SVG ---
// Icône pour Voir les détails
const ViewIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
);
// Icône pour Confirmer la suppression (check mark)
const ConfirmDeleteIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);
// Optionnel: Icône pour Refuser/Annuler la demande (X mark)
// const RejectDeleteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>;
// --- Fin Icônes ---

function AdminPendingDeletions() {
  const navigate = useNavigate();
  const { user } = useAuth(); // Pour vérifier si l'utilisateur est Admin

  const [pendingAnnonces, setPendingAnnonces] = useState([]); // Annonces avec DeletionRequested = true
  const [loading, setLoading] = useState(true); // Indicateur de chargement
  const [error, setError] = useState(null);   // Message d'erreur

  // Fonction pour récupérer les annonces en attente de suppression
  const fetchPendingDeletions = async () => {
    setLoading(true);
    setError(null);
    try {
      // Appel API pour récupérer les annonces avec DeletionRequested=true
      const response = await annonceService.getPendingDeletion();
      setPendingAnnonces(response.data);
    } catch (err) {
      console.error("Erreur fetchPendingDeletions:", err);
      if (err.response?.status === 403) { // Vérifier si l'erreur est bien une interdiction
          setError("Accès refusé. Seuls les administrateurs peuvent voir cette page.");
      } else {
         setError("Erreur lors du chargement des demandes de suppression.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Exécute fetchPendingDeletions au montage et si 'user' change (pour la vérif de rôle)
  useEffect(() => {
    // Sécurité supplémentaire côté client: rediriger si pas Admin
    if (user && !user.roles?.includes('Admin')) {
      console.warn("Accès non autorisé à la page AdminPendingDeletions.");
      navigate('/'); // Rediriger vers l'accueil
      return; // Ne pas exécuter le fetch si pas admin
    }
    // Si user est chargé et est Admin (ou si user est null au début mais deviendra Admin)
    if (user || !user) { // Exécute même si user est null au premier rendu (sera vérifié par ProtectedRoute)
        fetchPendingDeletions();
    }
  }, [user, navigate]);

  // Fonction pour confirmer la suppression physique (par l'Admin)
  const handleConfirmDelete = async (id, nomAnnonce) => {
    // Confirmation explicite de l'action définitive
    if (window.confirm(`Confirmez-vous la suppression DÉFINITIVE de l'annonce "${nomAnnonce}" ? Cette action est irréversible.`)) {
      try {
        // Appel à l'API qui effectue la suppression physique (via PATCH ou DELETE selon votre service)
        await annonceService.confirmDelete(id); // confirmDelete pointe vers PATCH .../confirm-soft-delete
        // Mettre à jour l'état local en retirant l'annonce supprimée
        setPendingAnnonces(prev => prev.filter(a => a.id !== id));
        alert(`Annonce "${nomAnnonce}" supprimée définitivement.`);
      } catch (err) {
        console.error("Erreur lors de la confirmation de suppression:", err);
        const errorMsg = err.response?.data?.message || "Erreur lors de la confirmation de suppression.";
        alert(errorMsg);
      }
    }
  };

   // Optionnel: Fonction pour refuser la demande (remet DeletionRequested à false)
   // Nécessiterait un endpoint API dédié et une méthode dans annonceService
   /*
   const handleRejectDelete = async (id) => {
       if (window.confirm("Voulez-vous refuser cette demande de suppression et garder l'annonce active ?")) {
           try {
               // await annonceService.rejectDeletion(id); // Endpoint API hypothétique
               // Mettre à jour l'état local en retirant l'annonce de cette liste
               setPendingAnnonces(prev => prev.filter(a => a.id !== id));
               alert("Demande de suppression refusée.");
           } catch (err) {
               // ... gestion erreur ...
           }
       }
   };
   */

  // Rendu JSX
  return (
    <Layout>
      <div className="header">
        <h1 className="page-title">Gestion des Demandes de Suppression</h1>
        <span className="text-sm text-muted ml-auto">Interface Administrateur</span>
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Annonces en Attente</h2>
          <p className="card-description">Liste des annonces dont la suppression a été demandée par leur vendeur.</p>
        </div>

        <div className="card-content">
          {/* Indicateur de chargement */}
          {loading && <div className="text-center py-8">Chargement des demandes...</div>}

          {/* Message d'erreur */}
          {error && <div className="text-center py-8 text-red-500">{error}</div>}

          {/* Tableau des annonces en attente */}
          {!loading && !error && (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>ID Annonce</th>
                    <th>Nom Annonce</th>
                    <th className="hidden md:table-cell">Vendeur ID</th>
                    <th className="hidden lg:table-cell">Date Création</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingAnnonces.length > 0 ? (
                    pendingAnnonces.map((annonce) => (
                      <tr key={annonce.id}>
                        <td>{annonce.id}</td>
                        <td className="font-medium">
                          {/* Lien pour voir les détails de l'annonce avant de décider */}
                          <Link to={`/annonces/detail/${annonce.id}`} title={`Voir détails de ${annonce.name}`}>
                             {annonce.name}
                          </Link>
                        </td>
                        {/* Afficher l'ID du vendeur qui a fait la demande */}
                        <td className="hidden md:table-cell text-muted font-mono text-xs">{annonce.vendeurId}</td>
                        <td className="hidden lg:table-cell text-muted">{new Date(annonce.dateCreation).toLocaleDateString()}</td>
                        {/* Actions pour l'Admin */}
                        <td>
                          <div className="action-buttons">
                            {/* Voir Détails */}
                            <Link
                              to={`/annonces/detail/${annonce.id}`}
                              className="btn-icon-only text-blue-600 hover:text-blue-800"
                              title="Voir Détails"
                            >
                              <ViewIcon />
                            </Link>
                            {/* Confirmer Suppression (Action Définitive) */}
                            <button
                              onClick={() => handleConfirmDelete(annonce.id, annonce.name)}
                              className="btn-icon-only text-green-600 hover:text-green-800" // Vert pour confirmation
                              title="Confirmer la suppression définitive"
                            >
                              <ConfirmDeleteIcon />
                            </button>
                             {/* Bouton Refuser (Optionnel) */}
                            {/*
                            <button
                                onClick={() => handleRejectDelete(annonce.id)}
                                className="btn-icon-only text-red-600 hover:text-red-800"
                                title="Refuser la demande de suppression"
                            >
                               <RejectDeleteIcon />
                            </button>
                             */}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    // Message si aucune demande n'est en attente
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">Aucune demande de suppression en attente pour le moment.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default AdminPendingDeletions;