// Dans src/components/Navbar.jsx (ou où vous l'avez placé)

import React, { useState } from 'react'; // Ajout de useState pour le menu mobile
import { NavLink, Link, useNavigate } from "react-router-dom"; // Ajout de Link et useNavigate
import { useAuth } from "../contexts/AuthContext"; // Adapter le chemin si nécessaire

// Importation des icônes spécifiques depuis lucide-react (ou votre bibliothèque d'icônes)
import {
  LayoutGrid,     // Nouvelle icône pour le Dashboard (plus approprié)
  List,           // Icône pour "Toutes les Annonces"
  FileText,       // Icône pour "Mes Annonces" (Vendeur)
  Search, 
  Trash2,
  ArchiveX,        // Icône pour "Annonces A supprimer" (Admin
  FileWarning,        // Icône pour "Recherche Annonces Vendeur" (Admin)
  Eye,            // Icône pour "Recherche Visiteurs Annonce" (Admin)
  Clock,          // Icône pour "Historique Visites Client" (Admin)
  LogOut,         // Icône pour "Déconnexion"
  Menu,           // Icône pour le menu mobile (burger)
  X,              // Icône pour fermer le menu mobile
  User            // Icône pour le profil/compte utilisateur
} from 'lucide-react';

function Navbar() {
  const { user, logout } = useAuth(); // Récupère l'utilisateur et la fonction logout
  const navigate = useNavigate();     // Hook pour la redirection après logout
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // État pour l'ouverture/fermeture du menu mobile

  // Fonction pour gérer la déconnexion
  const handleLogout = () => {
    logout(); // Appelle la fonction du contexte
    navigate('/login'); // Redirige vers la page de connexion
    setIsMobileMenuOpen(false); // Ferme le menu mobile si ouvert
  };

  // Fonction pour ouvrir/fermer le menu mobile
  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Fonction pour fermer le menu mobile lors d'un clic sur un lien
  const handleLinkClick = () => {
     // Ferme le menu seulement si on est en mode mobile (vérification optionnelle basée sur la visibilité du bouton burger)
     // Ou plus simplement, toujours fermer si la fonction est appelée
     setIsMobileMenuOpen(false);
  }

  // Taille par défaut pour les icônes dans la navbar
  const iconSize = 18; // Légèrement plus petit pour une navbar

  return (
    // Utilise la balise <nav> sémantique avec la classe 'navbar' pour le styling
    <nav className="navbar">
      {/* Conteneur pour limiter la largeur et centrer sur grand écran */}
      <div className="navbar-container">

        {/* Logo ou Titre de l'application, agit comme un lien vers l'accueil (Dashboard) */}
        <Link to="/" className="navbar-logo" onClick={handleLinkClick}>
          SaKani.com {/* Remplacez par votre logo si vous en avez un */}
        </Link>

        {/* Bouton pour afficher/cacher le menu sur les écrans mobiles */}
        <button className="navbar-mobile-toggle" onClick={toggleMobileMenu} aria-label="Basculer la navigation">
          {/* Affiche l'icône X si le menu est ouvert, sinon l'icône Menu (burger) */}
          {isMobileMenuOpen ? <X size={iconSize + 4} /> : <Menu size={iconSize + 4} />}
        </button>

        {/* Conteneur des liens de navigation */}
        {/* La classe 'open' est ajoutée dynamiquement pour l'affichage mobile */}
        <div className={`navbar-links ${isMobileMenuOpen ? "open" : ""}`}>

          {/* --- Liens de Navigation Principaux (visibles par tous les connectés) --- */}

         

          {/* Lien vers la liste de toutes les Annonces */}
          <NavLink to="/annonces" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`} onClick={handleLinkClick}>
             <List size={iconSize} className="navbar-link-icon" />
             <span>Annonces</span>
          </NavLink>

         
          

          {/* --- Liens Spécifiques au Rôle Admin --- */}
          {user && user.roles?.includes('Admin') && (
            <> {/* Utilisation d'un fragment pour grouper les liens Admin */}
              {/* Lien vers la page de recherche d'annonces par vendeur */}
              <NavLink to="/recherche-annonces-vendeur" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`} onClick={handleLinkClick}>
                 <Search size={iconSize} className="navbar-link-icon" /> {/* Icône Recherche */}
                 <span>Seller's Ads</span>
              </NavLink>
              {/* Lien vers la page de recherche des visiteurs d'une annonce */}
              <NavLink to="/recherche-visiteurs-annonce" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`} onClick={handleLinkClick}>
                 <Eye size={iconSize} className="navbar-link-icon" /> {/* Icône Oeil */}
                 <span>Suivi</span>
              </NavLink>
              {/* Lien vers la page de l'historique des visites d'un client */}
              <NavLink to="/historique-visites-client" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`} onClick={handleLinkClick}>
                 <Clock size={iconSize} className="navbar-link-icon" /> {/* Icône Horloge */}
                 <span>Activity</span>
              </NavLink>

                {/* Lien vers la page des Annonces A supprimer*/}
                <NavLink
                 to="/admin/pending-deletions" // <<< URL de la page de gestion
                 className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                 onClick={handleLinkClick}
               >
                 <Trash2 size={iconSize} className="navbar-link-icon" /> {/* <<< Icône Corbeille */}
                 <span>TaskDeletion</span> {/* Texte mis à jour */}
              </NavLink>

                {/* Lien vers la page D'Archive des Annonces Supprimer*/}
                <NavLink
                 to="/admin/archives" // <<< URL de la page de gestion
                 className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`}
                 onClick={handleLinkClick}
               >
                 <ArchiveX size={iconSize} className="navbar-link-icon" /> {/* <<< Icône changée */}
                 <span>Archive</span> {/* Texte mis à jour */}
              </NavLink>

            </>
          )}

          {/* --- Section Utilisateur et Déconnexion (alignée à droite sur Desktop) --- */}
          <div className="navbar-user-section">
             {/* Vérifie si l'utilisateur est connecté */}
             {user ? (
                <>
                    {/* Affiche le prénom ou l'email de l'utilisateur */}
                    <span className="navbar-user-greeting" title={user.email}>
                        <User size={iconSize - 2} className="navbar-link-icon" />
                        {user.prenom || user.userName} {/* Affiche Prénom si disponible, sinon userName */}
                    </span>
                    {/* Bouton de Déconnexion */}
                    <button className="navbar-link logout-button" onClick={handleLogout} title="Se déconnecter">
                        <LogOut size={iconSize} className="navbar-link-icon" />
                        <span className="hidden md:inline">Déconnexion</span> {/* Texte visible sur écrans moyens et plus */}
                    </button>
                </>
             ) : (
                 /* Optionnellement, afficher un lien de connexion si non connecté
                    (normalement géré par la redirection via ProtectedRoute) */
                 null // Ou <NavLink to="/login" ... >Connexion</NavLink>
             )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;