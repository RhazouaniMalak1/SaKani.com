"use client"
// Imports de base et pour le routage
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
// Import du contexte d'authentification (NÉCESSAIRE)
import { AuthProvider, useAuth } from "./contexts/AuthContext"; // useAuth est utilisé dans ProtectedRoute
// Imports des pages d'authentification (NÉCESSAIRES)
import Login from "./pages/Login";
import Register from "./pages/Register";

// --- PAGES PRINCIPALES DE VOTRE NOUVELLE APPLICATION ---
// Page principale après connexion
import Dashboard from "./pages/Dashboard";
// Page pour afficher la liste des annonces
import Annonces from "./pages/Annonces";
// Page pour le formulaire de création/modification d'annonce
import AnnonceForm from "./pages/AnnonceForm";
// Page pour voir les détails d'une annonce
import AnnonceDetail from "./pages/AnnonceDetail";
// Page pour la RECHERCHE d'annonces d'un vendeur (Admin)
import AnnoncesVendeur from "./pages/AnnoncesVendeur";
// Page pour la RECHERCHE des visiteurs d'une annonce (Admin)
import AnnonceVisiteurs from "./pages/AnnonceVisiteurs";
// --- AJOUT IMPORT : Page pour l'historique de visite d'un client ---
import ClientAnnoncesVisitees from "./pages/ClientAnnoncesVisitees";
// Page pour la page non trouvée
import NotFound from "./pages/NotFound";
import AdminPendingDeletions from "./pages/AdminPendingDeletions";
import ArchivesAnnonces from "./pages/ArchivesAnnonces";



// Import du CSS global (NÉCESSAIRE)
import "./App.css";

// Composant pour protéger les routes qui nécessitent une authentification et éventuellement un rôle spécifique
const ProtectedRoute = ({ children, roles }) => { // Accepte une prop optionnelle 'roles' (tableau de strings)
  const { user, loading } = useAuth(); // Récupère l'état de l'utilisateur et du chargement

  // Affiche un indicateur pendant la vérification initiale
  if (loading) {
    return <div className="loading" style={{ padding: '50px', textAlign: 'center' }}>Chargement...</div>;
  }

  // Si pas d'utilisateur après chargement, redirige vers login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Si des rôles sont spécifiés pour cette route, vérifier si l'utilisateur a au moins un des rôles requis
  if (roles && roles.length > 0 && !roles.some(role => user.roles?.includes(role))) {
     console.warn(`Accès refusé à ${user.email} pour route nécessitant rôles: ${roles.join(',')}`);
     // Afficher un message d'accès refusé. Mieux vaut un composant dédié qu'une simple div.
     // Pour l'exemple, on affiche un message simple.
     return (
        // Suppose que Layout gère la structure de base de la page
        // <Layout>
            <div className="error-message p-4 text-center font-bold text-red-600">
                Accès Refusé: Vous ne disposez pas des permissions nécessaires pour accéder à cette page.
            </div>
       // </Layout>
     );
     // Alternative : return <Navigate to="/" replace />; // Rediriger vers la page d'accueil
  }

  // Si l'utilisateur est connecté et a les bons rôles (ou si aucun rôle spécifique n'est requis), affiche la page
  return children;
};


// Composant principal de l'application
function App() {
  return (
    // Fournisseur du contexte d'authentification
    <AuthProvider>
      {/* Gestionnaire de routage */}
      <Router>
        {/* Conteneur des routes */}
        <Routes>
          {/* --- Routes Publiques (accessibles sans connexion) --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* --- Routes Protégées (nécessitent une connexion) --- */}

          {/* Route Racine (Dashboard) - Tout utilisateur connecté */}
          <Route path="/" element={ <ProtectedRoute><Annonces /></ProtectedRoute> } />

          {/* Routes liées aux Annonces */}
          <Route path="/annonces" element={ <ProtectedRoute><Annonces /></ProtectedRoute> } /> {/* Liste générale */}
          <Route path="/annonces/detail/:id" element={ <ProtectedRoute><AnnonceDetail /></ProtectedRoute> } /> {/* Détail pour tous */}
          <Route path="/annonces/new" element={ <ProtectedRoute roles={['Admin', 'Vendeur']}><AnnonceForm /></ProtectedRoute> } /> {/* Création Admin/Vendeur */}
          <Route path="/annonces/:id" element={ <ProtectedRoute roles={['Admin', 'Vendeur']}><AnnonceForm /></ProtectedRoute> } /> {/* Modification Admin/Vendeur */}

          {/* Routes Spécifiques Admin */}
          <Route
            path="/recherche-annonces-vendeur"
            element={ <ProtectedRoute roles={['Admin']}><AnnoncesVendeur /></ProtectedRoute> }
          />
          <Route
            path="/recherche-visiteurs-annonce"
            element={ <ProtectedRoute roles={['Admin']}><AnnonceVisiteurs /></ProtectedRoute> }
          />
           {/* --- AJOUTÉ : Route pour l'historique de visite d'un client (Admin) --- */}
           <Route
            path="/historique-visites-client" // URL fixe pour la page de recherche
            element={
              <ProtectedRoute roles={['Admin']}> {/* Rôle Admin requis */}
                <ClientAnnoncesVisitees />
              </ProtectedRoute>
            }
            
          />
                    {/* --- AJOUTÉ : Route pour la gestion des suppressions en attente (Admin) --- */}

                  <Route
            path="/admin/pending-deletions" // URL spécifique Admin
            element={
              <ProtectedRoute roles={['Admin']}> {/* Rôle Admin requis */}
                <AdminPendingDeletions />
              </ProtectedRoute>
            }
          />

    {/* --- AJOUTÉ : Route pour les archives (Admin) --- */}
    <Route
            path="/admin/archives" // URL spécifique Admin
            element={
              <ProtectedRoute roles={['Admin']}> {/* Rôle Admin requis */}
                <ArchivesAnnonces />
              </ProtectedRoute>
            }
          />


           


          {/* Route "Catch-all" pour les pages non trouvées */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;