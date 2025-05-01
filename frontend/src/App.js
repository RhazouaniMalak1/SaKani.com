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
// --- AJOUT IMPORT : Page pour les détails d'une annonce ---
import AnnonceDetail from "./pages/AnnonceDetail";
// Page pour la page non trouvée
import NotFound from "./pages/NotFound";

// --- IMPORTS DES PAGES DE L'ANCIEN PROJET (GARDÉS COMMENTÉS OU À SUPPRIMER) ---
// import Projects from "./pages/Projects";
// import ProjectForm from "./pages/ProjectForm";
// import Tasks from "./pages/Tasks";
// import TaskForm from "./pages/TaskForm";
// import Resources from "./pages/Resources";
// import ResourceForm from "./pages/ResourceForm";
// import Suppliers from "./pages/Suppliers";
// import SupplierForm from "./pages/SupplierForm";

// Import du CSS global (NÉCESSAIRE)
import "./App.css";

// Composant pour protéger les routes qui nécessitent une authentification
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth(); // Récupère l'état de l'utilisateur et du chargement depuis le contexte

  // Affiche un indicateur pendant la vérification initiale de l'authentification
  if (loading) {
    return <div className="loading" style={{ padding: '50px', textAlign: 'center' }}>Chargement...</div>;
  }

  // Si le chargement est terminé et qu'il n'y a pas d'utilisateur, redirige vers la page de connexion
  if (!user) {
    return <Navigate to="/login" replace />; // 'replace' évite d'ajouter /login à l'historique
  }

  // Si l'utilisateur est connecté, affiche le composant enfant (la page protégée)
  return children;
};

// Composant principal de l'application
function App() {
  return (
    // Fournisseur du contexte d'authentification pour toute l'application
    <AuthProvider>
      {/* Configure le routage côté client */}
      <Router>
        {/* Conteneur pour toutes les définitions de routes */}
        <Routes>
          {/* --- Routes Publiques --- */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* --- Routes Protégées (Nécessitent une connexion) --- */}

          {/* Route Racine ('/') -> Affiche le Dashboard si connecté */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard /> {/* Page principale après connexion */}
              </ProtectedRoute>
            }
          />

          {/* Route pour la liste des Annonces */}
          <Route
            path="/annonces" // URL pour voir la liste des annonces
            element={
              <ProtectedRoute>
                <Annonces /> {/* Composant qui affichera la liste */}
              </ProtectedRoute>
            }
          />

          {/* --- AJOUTÉ : Route pour voir les Détails d'une Annonce --- */}
          {/* Doit être AVANT la route /annonces/:id pour éviter les conflits */}
          <Route
            path="/annonces/detail/:id" // Nouvelle route spécifique
            element={
              <ProtectedRoute>
                <AnnonceDetail /> {/* Pointe vers le composant de détails */}
              </ProtectedRoute>
            }
          />
          {/* --- FIN AJOUT --- */}

          {/* Route pour le formulaire Annonce (Création) */}
          <Route
            path="/annonces/new" // URL pour créer une nouvelle annonce
            element={
              <ProtectedRoute>
                <AnnonceForm />
              </ProtectedRoute>
            }
          />
           {/* Route pour le formulaire Annonce (Modification) */}
           {/* Cette route est utilisée pour l'édition via AnnonceForm */}
          <Route
            path="/annonces/:id"
            element={
              <ProtectedRoute>
                <AnnonceForm />
              </ProtectedRoute>
            }
          />


          {/* --- Routes de l'Ancien Projet (COMMENTÉES OU À SUPPRIMER) --- */}
          {/*
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          // ... etc ...
          */}
          {/* --- Fin Routes Ancien Projet --- */}


          {/* Route "Catch-all" pour les pages non trouvées */}
          <Route path="*" element={<NotFound />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;