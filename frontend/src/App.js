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
import Annonces from "./pages/Annonces"; // <<< NOUVEL IMPORT (à créer/adapter)
// Page pour le formulaire de création/modification d'annonce
// import AnnonceForm from "./pages/AnnonceForm"; // <<< À créer/adapter plus tard
// Page pour la page non trouvée (optionnel mais recommandé)
import NotFound from "./pages/NotFound"; // <<< À créer/adapter ou utiliser celui existant

// --- IMPORTS DES PAGES DE L'ANCIEN PROJET (À SUPPRIMER ou adapter plus tard) ---
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

          {/* Route Racine ('/') -> Redirige vers Dashboard si connecté */}
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

          {/* Routes pour le formulaire Annonce (Création & Modification) */}
          {/* À décommenter et implémenter plus tard */}
          {/*
          <Route
            path="/annonces/new" // URL pour créer une nouvelle annonce
            element={
              <ProtectedRoute>
                <AnnonceForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/annonces/:id" // URL pour modifier/voir détails d'une annonce existante
            element={
              <ProtectedRoute>
                <AnnonceForm /> // Le même formulaire peut gérer création et modification
              </ProtectedRoute>
            }
          />
          */}


          {/* --- Routes de l'Ancien Projet (COMMENTÉES) --- */}
          {/* Supprimez ces sections si vous n'en avez plus besoin */}
          {/*
          <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
          <Route path="/projects/new" element={<ProtectedRoute><ProjectForm /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProtectedRoute><ProjectForm /></ProtectedRoute>} />
          <Route path="/tasks" element={<ProtectedRoute><Tasks /></ProtectedRoute>} />
          <Route path="/tasks/new" element={<ProtectedRoute><TaskForm /></ProtectedRoute>} />
          <Route path="/tasks/:id" element={<ProtectedRoute><TaskForm /></ProtectedRoute>} />
          <Route path="/resources" element={<ProtectedRoute><Resources /></ProtectedRoute>} />
          <Route path="/resources/new" element={<ProtectedRoute><ResourceForm /></ProtectedRoute>} />
          <Route path="/resources/:id" element={<ProtectedRoute><ResourceForm /></ProtectedRoute>} />
          <Route path="/suppliers" element={<ProtectedRoute><Suppliers /></ProtectedRoute>} />
          <Route path="/suppliers/new" element={<ProtectedRoute><SupplierForm /></ProtectedRoute>} />
          <Route path="/suppliers/:id" element={<ProtectedRoute><SupplierForm /></ProtectedRoute>} />
          */}
          {/* --- Fin Routes Ancien Projet --- */}


          {/* Route "Catch-all" pour les pages non trouvées */}
          {/* Décommentez si vous avez un composant NotFound */}
           <Route path="*" element={<NotFound />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;