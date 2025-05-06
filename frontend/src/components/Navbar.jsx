// Dans src/components/Navbar.jsx

import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from "react-router-dom";
// --- MODIFIÉ : Importer useAuth pour accéder à l'état des messages non lus ---
import { useAuth } from "../contexts/AuthContext"; // Adapter le chemin si nécessaire

// Importation des icônes
import {
  // LayoutGrid, // Icone non utilisée (selon warning précédent)
  List,
  // FileText, // Icone non utilisée (selon warning précédent)
  Search,
  Trash2,
  ArchiveX,
  // FileWarning, // Icone non utilisée (selon warning précédent)
  Eye,
  Clock,
  LogOut,
  Menu,
  X,
  User,
  // --- AJOUT : Icône pour les messages ---
  MessageSquare // Ou Mail, Bell, etc.
} from 'lucide-react';

function Navbar() {
  // --- MODIFIÉ : Récupérer user, logout ET unreadMessages ---
  const { user, logout, unreadMessages } = useAuth(); // Récupère aussi unreadMessages
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLinkClick = () => {
     setIsMobileMenuOpen(false);
  }

  const iconSize = 18;

  // --- AJOUT : Calculer s'il y a des messages non lus ---
  // Utilise Object.values pour obtenir les compteurs, puis reduce pour les additionner
  // Le `|| {}` gère le cas où unreadMessages pourrait être null/undefined au début
  const totalUnreadCount = Object.values(unreadMessages || {}).reduce((sum, count) => sum + count, 0);
  const hasUnread = totalUnreadCount > 0;
  // --- FIN AJOUT ---

  return (
    // La <nav> reste le composant racine ici
    <nav className="navbar">
      <div className="navbar-container">

        <Link to="/" className="navbar-logo" onClick={handleLinkClick}>
          SaKani.com
        </Link>

        <button className="navbar-mobile-toggle" onClick={toggleMobileMenu} aria-label="Basculer la navigation">
          {isMobileMenuOpen ? <X size={iconSize + 4} /> : <Menu size={iconSize + 4} />}
        </button>

        <div className={`navbar-links ${isMobileMenuOpen ? "open" : ""}`}>

          {/* Lien Annonces */}
          <NavLink to="/annonces" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`} onClick={handleLinkClick}>
             <List size={iconSize} className="navbar-link-icon" />
             <span>Annonces</span>
          </NavLink>

          {/* --- AJOUT : Lien vers une page de Messages (si vous en créez une) --- */}
          {/* Ce lien est conditionnel à l'utilisateur connecté */}
          {user && (
            <NavLink
              // TODO: Définir la route vers votre page/composant de messagerie/conversations
              to="/messages" // Exemple d'URL - ASSUREZ-VOUS QUE CETTE ROUTE EXISTE DANS App.js
              className={({ isActive }) => `navbar-link relative ${isActive ? "active" : ""}`} // Ajout de 'relative' pour positionner le badge
              onClick={handleLinkClick}
              title="Messages" // Info-bulle
            >
              <MessageSquare size={iconSize} className="navbar-link-icon" />
              <span>Messages</span>
              {/* Afficher le badge SEULEMENT s'il y a des messages non lus */}
              {hasUnread && (
                <span className="message-unread-badge">
                  {/* Afficher le nombre total ou juste un point, limiter l'affichage si trop grand */}
                  {totalUnreadCount > 9 ? '9+' : totalUnreadCount}
                  {/* Ou juste : <span className="message-unread-dot"></span> */}
                </span>
              )}
            </NavLink>
          )}
          {/* --- FIN AJOUT --- */}


          {/* --- Liens Spécifiques au Rôle Admin --- */}
          {user && user.roles?.includes('Admin') && (
            <> {/* Utilisation d'un fragment pour grouper les liens Admin */}
              <NavLink to="/recherche-annonces-vendeur" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`} onClick={handleLinkClick}> <Search size={iconSize} className="navbar-link-icon" /> <span>Seller's Ads</span> </NavLink>
              <NavLink to="/recherche-visiteurs-annonce" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`} onClick={handleLinkClick}> <Eye size={iconSize} className="navbar-link-icon" /> <span>Suivi</span> </NavLink>
              <NavLink to="/historique-visites-client" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`} onClick={handleLinkClick}> <Clock size={iconSize} className="navbar-link-icon" /> <span>Activity</span> </NavLink>
              <NavLink to="/admin/pending-deletions" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`} onClick={handleLinkClick}> <Trash2 size={iconSize} className="navbar-link-icon" /> <span>TaskDeletion</span> </NavLink>
              <NavLink to="/admin/archives" className={({ isActive }) => `navbar-link ${isActive ? "active" : ""}`} onClick={handleLinkClick}> <ArchiveX size={iconSize} className="navbar-link-icon" /> <span>Archive</span> </NavLink>
            </>
          )}

          {/* --- Section Utilisateur et Déconnexion --- */}
          <div className="navbar-user-section">
             {user ? (
                <>
                    <span className="navbar-user-greeting" title={user.email}> <User size={iconSize - 2} className="navbar-link-icon" /> {user.prenom || user.userName} </span>
                    <button className="navbar-link logout-button" onClick={handleLogout} title="Se déconnecter"> <LogOut size={iconSize} className="navbar-link-icon" /> <span className="hidden md:inline">Déconnexion</span> </button>
                </>
             ) : ( null )}
          </div>
        </div> {/* Fin de navbar-links */}
      </div> {/* Fin de navbar-container */}
    </nav> /* Fin de la nav */
  );
}

export default Navbar;