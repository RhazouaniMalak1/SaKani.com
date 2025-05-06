// src/components/ChatWindow.js
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Gardé pour user.id et clearUnread...
import { chatService } from '../services/api'; // Doit contenir getHistory, getNewMessages, sendMessageApi
import { Send, X } from 'lucide-react'; // Icônes



// Fonction helper pour formater Date/Heure
const formatDateTime = (dateString) => {
    if (!dateString) return "";
    try {
        const date = new Date(dateString);
        const today = new Date();
        const optionsTime = { hour: '2-digit', minute: '2-digit' };
        const optionsDate = { day: 'numeric', month: 'numeric', year:'numeric', hour: '2-digit', minute: '2-digit' };
        if (date.toDateString() === today.toDateString()) {
            return date.toLocaleTimeString('fr-FR', optionsTime);
        } else {
            return date.toLocaleDateString('fr-FR', optionsDate);
        }
    } catch(e) {
        console.error("Erreur formatage date:", dateString, e); // Log l'erreur
        return "Date invalide";
    }
};


function ChatWindow({ recipientId, recipientName, annonceId, annonceName, onClose }) {
  const { user, clearUnreadFromSender } = useAuth(); // <- Récupérer user ET fonction pour marquer comme lu
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [sendError, setSendError] = useState(null);
  const messagesEndRef = useRef(null); // Ref pour scroller en bas
  // Renommé pour plus de clarté, stocke le timestamp du DERNIER message traité pour la requête 'new'
  const lastKnownTimestampRef = useRef(new Date(0).toISOString());
  const isMountedRef = useRef(true); // Pour éviter les mises à jour après démontage
  const pollingIntervalRef = useRef(null); // Pour stocker l'ID de l'intervalle
  // *** Utiliser une ref pour stocker les IDs connus de manière fiable ***
  const knownMessageIdsRef = useRef(new Set());

  // Fonction pour scroller en bas de la liste des messages
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
        // Vérifier si la ref existe avant d'appeler scrollIntoView
        if (messagesEndRef.current) {
             messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, 100); // Léger délai
  }, []);

  // Charger l'historique initial des messages
  const loadHistory = useCallback(async () => {
    // Vérifier si le composant est toujours monté et si les IDs sont valides
    if (!isMountedRef.current || !recipientId || !user?.id) {
        // Ne pas mettre à jour l'état si non monté
        if(isMountedRef.current) setIsLoadingHistory(false);
        console.warn(`[ChatWindow ${recipientId?.substring(0,8)}] Chargement historique annulé (non monté ou IDs manquants).`);
        return;
    }
    console.log(`[ChatWindow ${recipientId?.substring(0,8)}] Chargement historique pour ${recipientId}...`);
    setIsLoadingHistory(true);
    setHistoryError(null);
    knownMessageIdsRef.current.clear(); // Réinitialiser les IDs connus
    try {
      const response = await chatService.getHistory(recipientId, { count: 50 }); // Augmenter count si besoin
      const historyMessages = response.data || [];
      if (isMountedRef.current) {
          const sortedHistory = historyMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          setMessages(sortedHistory);
          // Ajouter les IDs de l'historique aux IDs connus
          sortedHistory.forEach(msg => {
              if(msg.id != null) { // S'assurer que l'ID n'est pas null/undefined
                  knownMessageIdsRef.current.add(msg.id);
              } else {
                  console.warn("[ChatWindow loadHistory] Message reçu sans ID:", msg);
              }
          });
          // Mettre à jour le dernier timestamp connu basé sur l'historique
          if (sortedHistory.length > 0) {
              lastKnownTimestampRef.current = sortedHistory[sortedHistory.length - 1].timestamp;
          } else {
               lastKnownTimestampRef.current = new Date(0).toISOString(); // Reset si vide
          }
          console.log(`[ChatWindow ${recipientId?.substring(0,8)}] Historique chargé (${sortedHistory.length}). Dernier TS: ${lastKnownTimestampRef.current}. IDs connus: ${knownMessageIdsRef.current.size}`);
      }
    } catch (err) {
      console.error(`[ChatWindow ${recipientId?.substring(0,8)}] Erreur chargement historique:`, err.response?.data || err.message || err);
      if (isMountedRef.current) { setHistoryError("Erreur lors du chargement de l'historique."); }
    } finally {
      if (isMountedRef.current) { setIsLoadingHistory(false); }
    }
   }, [recipientId, user?.id]); // Dépendances correctes

   // Effet pour le montage/démontage, chargement historique et marquage comme lu
   useEffect(() => {
    isMountedRef.current = true; // Définir comme monté
    loadHistory(); // Charger l'historique

    // Marquer la conversation comme lue dans le contexte global
    if (recipientId && clearUnreadFromSender) {
        console.log(`[ChatWindow ${recipientId?.substring(0,8)}] Appel clearUnreadFromSender pour ${recipientId} au montage.`);
        clearUnreadFromSender(recipientId);
    }

    // Fonction de nettoyage appelée lors du démontage
    return () => {
        isMountedRef.current = false; // Marquer comme démonté
        // Arrêter le polling si un intervalle est en cours
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null; // Important de réinitialiser la ref
            console.log(`[ChatWindow ${recipientId?.substring(0,8)}] Polling arrêté au démontage.`);
        }
        console.log(`[ChatWindow ${recipientId?.substring(0,8)}] Démonté.`);
    };
  // Le tableau de dépendances inclut les fonctions et IDs qui pourraient changer et nécessiter une re-execution
  }, [loadHistory, recipientId, clearUnreadFromSender]);

  // --- POLLING pour les nouveaux messages ---
  useEffect(() => {
    // Conditions pour démarrer le polling
    if (isLoadingHistory || !recipientId || !user?.id) {
        // Si les conditions ne sont plus remplies (ex: isLoading devient true), arrêter le polling existant
        if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            console.log(`[ChatWindow ${recipientId?.substring(0,8)}] Polling arrêté (conditions non remplies).`);
        }
        return; // Ne pas démarrer l'intervalle
    }

    // Fonction qui sera appelée par l'intervalle
    const fetchNewMessages = async () => {
        if (!isMountedRef.current) return; // Ne rien faire si démonté

        const checkSince = lastKnownTimestampRef.current; // Timestamp de la dernière vérification
        // console.log(`[ChatWindow Polling] Recherche messages pour ${recipientId} depuis ${checkSince}`); // Log optionnel
        try {
            // Appel API pour obtenir les messages plus récents que 'checkSince'
            const response = await chatService.getNewMessages(recipientId, checkSince);
            const newReceivedMessages = response.data || [];

            // Traiter seulement si le composant est toujours monté et si des messages ont été reçus
            if (newReceivedMessages.length > 0 && isMountedRef.current) {
                console.log(`[ChatWindow Polling] ${newReceivedMessages.length} nouveau(x) message(s) potentiel(s) reçu(s).`);

                // Filtrer pour ne garder que les messages dont l'ID n'est pas déjà connu
                const uniqueNewMessages = newReceivedMessages.filter(newMsg =>
                    newMsg.id != null && !knownMessageIdsRef.current.has(newMsg.id)
                );

                // Si des messages vraiment nouveaux ont été trouvés
                if (uniqueNewMessages.length > 0) {
                     console.log(`[ChatWindow Polling] Ajout de ${uniqueNewMessages.length} message(s) unique(s) à l'UI.`);
                     // Ajouter les IDs des nouveaux messages à l'ensemble des IDs connus
                     uniqueNewMessages.forEach(msg => knownMessageIdsRef.current.add(msg.id));
                     // Mettre à jour l'état des messages affichés
                     setMessages(prevMessages => [...prevMessages, ...uniqueNewMessages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
                     // Mettre à jour la référence du dernier timestamp connu
                     const latestTimestamp = uniqueNewMessages.reduce((latest, msg) => msg.timestamp > latest ? msg.timestamp : latest, checkSince);
                     lastKnownTimestampRef.current = latestTimestamp;
                     console.log(`[ChatWindow Polling] Nouveau dernier timestamp connu: ${lastKnownTimestampRef.current}. Total IDs connus: ${knownMessageIdsRef.current.size}`);
                     // Marquer comme lu dans le contexte global
                     if(clearUnreadFromSender) clearUnreadFromSender(recipientId);
                }
            }
        } catch (error) {
            console.error("[ChatWindow Polling] Erreur:", error.response?.data || error.message || error);
            // Envisager une logique pour gérer les erreurs répétées (ex: arrêter le polling)
        }
    };

    // Démarrer le polling
    console.log(`[ChatWindow ${recipientId?.substring(0,8)}] Démarrage polling (intervalle 5s).`);
    // Stocker l'ID de l'intervalle pour pouvoir l'arrêter plus tard
    pollingIntervalRef.current = setInterval(fetchNewMessages, 5000); // 5000 ms = 5 secondes

    // Fonction de nettoyage pour cet effet (arrête l'intervalle)
    return () => {
         if (pollingIntervalRef.current) {
             clearInterval(pollingIntervalRef.current);
             pollingIntervalRef.current = null;
             console.log(`[ChatWindow ${recipientId?.substring(0,8)}] Polling arrêté (nettoyage effet).`);
         }
    };
   // Dépendances: redémarre le polling si l'une de ces valeurs change.
  }, [isLoadingHistory, recipientId, user?.id, clearUnreadFromSender]);


   // Effet pour scroller lorsque l'état `messages` est mis à jour
   useEffect(() => {
       // Ne scroller que si l'historique initial est chargé
       if (!isLoadingHistory) {
           scrollToBottom();
       }
   }, [messages, isLoadingHistory, scrollToBottom]); // Dépendances correctes

   // --- ENVOI DE MESSAGE via API HTTP POST ---
   const handleSendMessage = useCallback(async (e) => {
    e.preventDefault(); // Empêcher le comportement par défaut du formulaire
    const messageToSend = newMessage.trim(); // Message sans espaces superflus
    // Vérifications de base
    if (!messageToSend || !recipientId || !user?.id) return;

    setSendError(null); // Réinitialiser l'erreur d'envoi précédente
    console.log(`[ChatWindow ${recipientId?.substring(0,8)}] Envoi message via API POST: "${messageToSend}"`);

    // Création d'un ID unique pour le message optimiste
    const optimisticId = `optimistic-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const optimisticMessage = {
        id: optimisticId, // Utiliser cet ID temporaire comme clé
        senderId: user.id,
        recipientId: recipientId,
        content: messageToSend,
        timestamp: new Date().toISOString(), // Timestamp local pour l'affichage immédiat
        isRead: true, // Considéré lu par l'expéditeur
        isOptimistic: true // Marqueur pour différencier visuellement si besoin
    };
    // Ajouter le message optimiste à l'état local et trier
    setMessages(prev => [...prev, optimisticMessage].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
    setNewMessage(""); // Vider le champ de saisie

    try {
        // Appel de la fonction du service API pour envoyer le message
        const response = await chatService.sendMessageApi(recipientId, messageToSend);
        // Supposons que le backend renvoie le message complet tel qu'il a été sauvegardé
        const sentMessageFromServer = response.data;
        console.log(`[ChatWindow ${recipientId?.substring(0,8)}] Appel API Send terminé. Réponse:`, sentMessageFromServer);

        if (isMountedRef.current) { // Vérifier si le composant est toujours monté
             // Ajouter l'ID du message reçu du serveur à l'ensemble des IDs connus
             if(sentMessageFromServer?.id != null) { // Vérifier que l'ID existe
                 knownMessageIdsRef.current.add(sentMessageFromServer.id);
                 console.log(`[ChatWindow Send] ID serveur ${sentMessageFromServer.id} ajouté aux IDs connus. Total: ${knownMessageIdsRef.current.size}`);
             }
             // Mettre à jour l'état : remplacer le message optimiste par celui du serveur
             setMessages(prev => prev.map(msg =>
                  msg.id === optimisticId // Trouver le message optimiste par son ID temporaire
                  ? { ...(sentMessageFromServer || msg), // Prendre les données serveur si elles existent, sinon garder optimiste
                      id: sentMessageFromServer?.id || optimisticId, // Utiliser l'ID serveur si disponible
                      isOptimistic: false // Marquer comme non optimiste
                    }
                  : msg // Laisser les autres messages inchangés
             ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))); // Re-trier pour l'ordre final

             // Mettre à jour la référence du dernier timestamp connu SI le message envoyé est le plus récent
             // Cela évite que le prochain polling ne récupère ce même message
             if (sentMessageFromServer && sentMessageFromServer.timestamp > lastKnownTimestampRef.current) {
                 lastKnownTimestampRef.current = sentMessageFromServer.timestamp;
                 console.log(`[ChatWindow Send] Dernier timestamp connu mis à jour après envoi: ${lastKnownTimestampRef.current}`);
             }
        }

    } catch (err) {
        console.error(`[ChatWindow ${recipientId?.substring(0,8)}] Erreur envoi message API:`, err.response?.data || err.message || err);
        if (isMountedRef.current) {
             setSendError("Échec de l'envoi. Veuillez réessayer.");
             // Marquer le message optimiste comme ayant échoué dans l'UI
             setMessages(prev => prev.map(m =>
                 m.id === optimisticId ? { ...m, error: true, isOptimistic: false } : m
             ));
             setNewMessage(messageToSend); // Remettre le texte dans l'input pour que l'utilisateur puisse réessayer
        }
    }
   // Dépendances du useCallback: inclure toutes les variables externes utilisées
   }, [newMessage, recipientId, user?.id, clearUnreadFromSender, setMessages, setNewMessage, setSendError]); // clearUnread.. et les setters ajoutés pour être complet


   // Variables dérivées pour le rendu JSX
   const isSendDisabled = !newMessage.trim(); // Désactiver si le message est vide
   const placeholderText = "Votre message..."; // Texte fixe maintenant

  // --- Rendu JSX du composant ---
  return (
    <div className="chat-window-container">
       {/* En-tête */}
       <div className="chat-header">
         <div className="chat-title-container">
              <h4 className="chat-title" title={`Chat avec ${recipientName || recipientId}`}>
                 Chat avec {recipientName || `Utilisateur #${recipientId?.substring(0,8)}...`}
              </h4>
              {annonceName && <p className='chat-annonce-ref' title={`Concernant : ${annonceName}`}>Re: {annonceName}</p>}
         </div>
         <button onClick={onClose} className="chat-close-btn" aria-label="Fermer le chat"><X size={20} /></button>
       </div>

       {/* Zone des Messages */}
       <div className="chat-messages">
         {/* Indicateurs */}
         {isLoadingHistory && <p className="chat-info">Chargement de l'historique...</p>}
         {historyError && !isLoadingHistory && <p className="chat-error">{historyError}</p>}
         {!isLoadingHistory && messages.length === 0 && !historyError && (
            <p className="chat-info">Aucun message. Commencez la conversation !</p>
         )}
         {/* Affichage des messages triés */}
         {[...messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).map((msg) => (
           <div
              // Utilisation de msg.id qui devrait être unique (serveur ou optimiste)
              key={msg.id} // <<< Utiliser msg.id comme clé
              className={`chat-message ${msg.senderId === user?.id ? 'sent' : 'received'} ${msg.isOptimistic ? 'optimistic' : ''} ${msg.error ? 'error' : ''}`}
              title={`ID: ${msg.id} | Envoyé ${msg.senderId === user?.id ? 'par vous' : `par ${recipientName || msg.senderId}`} le ${formatDateTime(msg.timestamp)}`}
           >
             <p className="chat-message-content">{msg.content}</p>
             {/* Méta-données */}
             <div className="chat-message-meta">
                <span className="chat-message-timestamp">{formatDateTime(msg.timestamp)}</span>
                {/* Indicateurs visuels */}
                {msg.senderId === user?.id && msg.isOptimistic && <span className="chat-message-status optimistic" title="En cours d'envoi"> (Envoi...)</span>}
                {msg.senderId === user?.id && msg.error && <span className="chat-message-status error" title="Échec de l'envoi"> (Échec)</span>}
             </div>
           </div>
         ))}
         {/* Élément pour le scroll */}
         <div ref={messagesEndRef} style={{ height: '1px' }} />
       </div>

       {/* Formulaire d'envoi */}
       <form onSubmit={handleSendMessage} className="chat-input-form">
          {sendError && <p className="chat-error send-error">{sendError}</p>}
         <input
           type="text"
           value={newMessage}
           onChange={(e) => { setNewMessage(e.target.value); if(sendError) setSendError(null); }}
           placeholder={placeholderText}
           className="chat-input"
           // disabled={false} // Toujours actif
           aria-label="Écrire un message"
           autoComplete="off"
         />
         <button type="submit" className="chat-send-btn" disabled={isSendDisabled} aria-label="Envoyer le message">
           <Send size={18} />
         </button>
       </form>
    </div>
  );
}

export default ChatWindow;