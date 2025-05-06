// src/pages/MessagesPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout'; // Ajustez le chemin
import ChatWindow from '../components/ChatWindow'; // Ajustez le chemin
import { api } from '../services/api'; // Importer 'api' pour appel direct ou créer service
import { MessageSquare, AlertCircle } from 'lucide-react'; // Icônes

// --- Définition du service API pour les conversations ---
// (Idéalement dans src/services/api.js, mais mis ici pour l'exemple)
const conversationService = {
    getConversations: () => {
        console.log("[API Call] getConversations");
        // Vous DEVEZ créer cet endpoint backend !
        // Il devrait retourner une liste d'objets contenant au moins { id, userName, prenom, nom }
        // des utilisateurs avec qui l'utilisateur actuel a échangé des messages.
        return api.get('/Chat/conversations'); // Exemple d'URL
    }
};
// --- Fin Définition Service ---


function MessagesPage() {
  const { user, unreadMessages, clearUnreadFromSender } = useAuth();
  const [conversations, setConversations] = useState([]); // Liste des conversations [{ id, userName, prenom, nom }]
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeChat, setActiveChat] = useState(null); // { recipientId, recipientName }

  // --- Fonction pour récupérer les conversations ---
  const fetchConversations = useCallback(async () => {
    if (!user) return; // Ne rien faire si pas d'utilisateur
    setIsLoading(true);
    setError(null);
    console.log("[MessagesPage] Récupération des conversations...");
    try {
      const response = await conversationService.getConversations();
      // Trier les conversations, peut-être par date du dernier message (si l'API le fournit)
      // ou simplement par nom d'utilisateur pour l'instant.
      const sortedConversations = (response.data || []).sort((a, b) =>
         a.userName.localeCompare(b.userName)
      );
      setConversations(sortedConversations);
      console.log("[MessagesPage] Conversations récupérées:", sortedConversations);
    } catch (err) {
      console.error("[MessagesPage] Erreur récupération conversations:", err);
      setError("Impossible de charger les conversations.");
    } finally {
      setIsLoading(false);
    }
  }, [user]); // Dépend de l'utilisateur connecté

  // --- Charger les conversations au montage ---
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // --- Fonctions pour gérer l'ouverture/fermeture du chat ---
  const openChatWindow = (recipient) => {
    if (!recipient || !recipient.id) return;
    const recipientFullName = `${recipient.prenom || ''} ${recipient.nom || ''}`.trim() || recipient.userName;
    console.log(`[MessagesPage] Ouverture ChatWindow pour ${recipientFullName} (ID: ${recipient.id})`);
    setActiveChat({
        recipientId: recipient.id,
        recipientName: recipientFullName
    });
    // Marquer comme lu quand on ouvre depuis la liste
    if(clearUnreadFromSender) {
        clearUnreadFromSender(recipient.id);
    }
  };

  const closeChatWindow = () => {
    console.log("[MessagesPage] Fermeture ChatWindow.");
    setActiveChat(null);
     // Recharger les conversations pour mettre à jour les badges (si le marquage lu n'est pas instantané)
     // fetchConversations(); // Optionnel
  };

  // --- Rendu ---
  return (
    <Layout>
      <div className="header">
        <h1 className="page-title">Messagerie</h1>
        {/* Optionnel: Bouton pour démarrer une nouvelle conversation ? */}
      </div>

      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Conversations</h2>
        </div>
        <div className="card-content">
          {isLoading && <p className="loading">Chargement des conversations...</p>}
          {error && <p className="error-message"><AlertCircle size={16} className="inline-block mr-2" /> {error}</p>}
          {!isLoading && !error && conversations.length === 0 && (
            <p className="text-center text-muted py-4">Aucune conversation à afficher.</p>
          )}
          {!isLoading && !error && conversations.length > 0 && (
            <ul className="conversation-list">
              {conversations.map((convo) => {
                const unreadCount = unreadMessages[convo.id] || 0; // Nombre de non lus pour cet expéditeur
                const hasUnread = unreadCount > 0;
                const displayName = `${convo.prenom || ''} ${convo.nom || ''}`.trim() || convo.userName; // Nom à afficher

                return (
                  <li
                    key={convo.id}
                    className={`conversation-item ${hasUnread ? 'unread' : ''}`}
                    onClick={() => openChatWindow(convo)} // Ouvre le chat au clic
                    title={`Démarrer/Ouvrir la conversation avec ${displayName}`}
                  >
                    <div className="conversation-info">
                       {/* Icône ou Avatar */}
                       <span className="conversation-icon"><MessageSquare size={20} /></span>
                       {/* Nom de l'interlocuteur */}
                       <span className={`conversation-name ${hasUnread ? 'font-semibold' : ''}`}>
                         {displayName}
                       </span>
                    </div>
                    {/* Badge Non Lus */}
                    {hasUnread && (
                       <span className="message-unread-badge">
                         {unreadCount > 9 ? '9+' : unreadCount}
                       </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Affichage Conditionnel de la Fenêtre de Chat */}
      {activeChat && (
          <ChatWindow
              recipientId={activeChat.recipientId}
              recipientName={activeChat.recipientName}
              // Vous pouvez passer annonceId/annonceName si pertinent depuis cette page, sinon null/undefined
              annonceId={null}
              annonceName={null}
              onClose={closeChatWindow} // Fonction pour fermer
          />
      )}

    </Layout>
  );
}



export default MessagesPage;