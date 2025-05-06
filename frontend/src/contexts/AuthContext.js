// src/contexts/AuthContext.js

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback
} from 'react';
// --- MODIFIÉ: Importer chatService et api directement si besoin ---
import { api, authService } from '../services/api'; // chatService n'est pas utilisé ici directement
// Supprimer les imports SignalR si vous l'enlevez complètement
// import * as signalR from "@microsoft/signalr";
// import { HubConnectionState } from "@microsoft/signalr";

// --- Context Creation ---
const AuthContext = createContext(null);

// --- Custom Hook ---
export function useAuth() {
  return useContext(AuthContext);
}

// --- AuthProvider Component ---
export function AuthProvider({ children }) {
  // --- State Variables ---
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  // --- SUPPRIMÉ : État et Ref SignalR ---
  // const [signalRConnection, setSignalRConnection] = useState(null);
  // const connectionRef = useRef(signalRConnection);
  // --- FIN SUPPRESSION ---

  // --- AJOUT : État pour les messages non lus ---
  // Structure: { senderId1: count1, senderId2: count2, ... }
  const [unreadMessages, setUnreadMessages] = useState({});
  // --- FIN AJOUT ---
  // --- AJOUT : Réf pour polling global ---
  const globalPollingIntervalRef = useRef(null); // Pour stocker l'ID de l'intervalle de polling
  const lastGlobalCheckTimestampRef = useRef(new Date(0).toISOString()); // Pour stocker le dernier timestamp vérifié
  // --- FIN AJOUT ---

  // --- SUPPRIMÉ : useEffect pour connectionRef ---
  // useEffect(() => {
  //   connectionRef.current = signalRConnection;
  // }, [signalRConnection]);
  // --- FIN SUPPRESSION ---

  // --- SUPPRIMÉ : Fonctions start/stop SignalR ---
  // const startSignalRConnection = useCallback(async (token) => { /* ... */ }, []);
  // const stopSignalRConnection = useCallback(async () => { /* ... */ }, [signalRConnection]);
  // --- FIN SUPPRESSION ---

  // Effet pour vérifier la connexion initiale de l'utilisateur
  useEffect(() => {
    const checkLoggedIn = async () => {
      console.log("[AuthContext] Checking initial authentication status...");
      const storedToken = localStorage.getItem("token");
      if (storedToken) {
        api.defaults.headers.common["Authorization"] = `Bearer ${storedToken}`;
        try {
          console.log("[AuthContext] Verifying token by fetching user info...");
          const response = await authService.getUserInfo();
          const userData = response.data;
          console.log("[AuthContext] User info fetched successfully:", userData);
          localStorage.setItem('user', JSON.stringify(userData));
          setUser(userData); // Mettre à jour l'utilisateur dans l'état
          // Initialiser le timestamp pour le polling global une fois l'utilisateur connu
          // Commencer à vérifier les messages à partir du moment où l'utilisateur est chargé
          lastGlobalCheckTimestampRef.current = new Date().toISOString();
        } catch (error) {
          console.error("[AuthContext] Token validation failed or getUserInfo error:", error.response?.data || error.message);
          // Nettoyer en cas d'erreur de validation du token
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          delete api.defaults.headers.common["Authorization"];
          setUser(null);
        }
      } else {
          console.log("[AuthContext] No token found in localStorage.");
          setUser(null); // Assurer que l'utilisateur est null si pas de token
      }
      // Marquer le chargement initial comme terminé
      setLoading(false);
      console.log("[AuthContext] Initial auth check complete.");
    };
    checkLoggedIn();
  }, []); // Tableau de dépendances vide pour exécution unique au montage

  // --- MODIFIÉ : Effet pour gérer le POLLING GLOBAL des messages non lus ---
  useEffect(() => {
    // Ne pas démarrer le polling si l'application est encore en chargement ou si l'utilisateur n'est pas connecté
    if (loading || !user) {
      // Si le polling tournait, l'arrêter
      if (globalPollingIntervalRef.current) {
          clearInterval(globalPollingIntervalRef.current);
          globalPollingIntervalRef.current = null; // Réinitialiser la référence de l'intervalle
          console.log("[AuthContext Global Polling] Arrêté (user null ou loading).");
      }
      return; // Sortir prématurément de l'effet
    }

    // Fonction interne pour récupérer les nouveaux messages via l'API
    const fetchAllNewMessages = async () => {
      // Utiliser une copie du timestamp pour éviter les problèmes si la ref change pendant l'appel async
      const checkSince = lastGlobalCheckTimestampRef.current;
      console.log(`[AuthContext Global Polling] Vérification pour ${user.id} depuis ${checkSince}`);
      try {
        // Appel à l'endpoint API '/api/Chat/new/all' avec le timestamp 'sinceUtc'
        // Assurez-vous que cet endpoint existe et fonctionne côté backend
        const response = await api.get(`/Chat/new/all?sinceUtc=${checkSince}`);
        const allNewMessages = response.data || []; // Tableau des nouveaux messages reçus

        // Si de nouveaux messages ont été reçus du serveur
        if (allNewMessages.length > 0) {
             console.log(`[AuthContext Global Polling] ${allNewMessages.length} nouveau(x) message(s) reçu(s) globalement.`);
             const newUnreadCounts = {}; // Objet pour compter les nouveaux messages par expéditeur
             let latestTimestamp = checkSince; // Garder une trace du timestamp le plus récent parmi les messages reçus

             // Compter les messages par expéditeur et trouver le timestamp le plus récent
             allNewMessages.forEach(msg => {
                 newUnreadCounts[msg.senderId] = (newUnreadCounts[msg.senderId] || 0) + 1;
                 if (msg.timestamp > latestTimestamp) {
                     latestTimestamp = msg.timestamp;
                 }
             });

             // Mettre à jour l'état global 'unreadMessages'
             setUnreadMessages(prevUnread => {
                 const updated = { ...prevUnread }; // Copie de l'état précédent
                 // Ajouter ou incrémenter le compteur pour chaque expéditeur ayant envoyé de nouveaux messages
                 Object.keys(newUnreadCounts).forEach(senderId => {
                     updated[senderId] = (updated[senderId] || 0) + newUnreadCounts[senderId];
                 });
                 console.log("[AuthContext Global Polling] Nouvel état unreadMessages:", updated);
                 return updated; // Retourner le nouvel état
             });

             // Mettre à jour la référence du dernier timestamp traité avec celui du message le plus récent reçu
             lastGlobalCheckTimestampRef.current = latestTimestamp;
             console.log(`[AuthContext Global Polling] Dernier timestamp mis à jour à: ${lastGlobalCheckTimestampRef.current}`);

        } else {
             console.log("[AuthContext Global Polling] Aucun nouveau message.");
             // Mettre à jour le timestamp même si rien n'est reçu pour éviter de redemander les mêmes
             // Utiliser l'heure actuelle moins une petite marge pour être sûr
             const nowMinusBuffer = new Date();
             nowMinusBuffer.setSeconds(nowMinusBuffer.getSeconds() - 2); // Ex: 2 secondes avant maintenant
             lastGlobalCheckTimestampRef.current = nowMinusBuffer.toISOString();
        }

      } catch (error) {
        // Gérer les erreurs lors de l'appel API (ex: serveur indisponible, erreur 4xx/5xx)
        console.error("[AuthContext Global Polling] Erreur:", error.response?.data || error.message || error);
        // Ne pas mettre à jour le timestamp en cas d'erreur pour réessayer depuis le même point
      }
    };

    // Démarrer le polling
    console.log("[AuthContext Global Polling] Démarrage polling global (intervalle 10s).");
    fetchAllNewMessages(); // Exécuter une fois immédiatement
    // Mettre en place l'intervalle et stocker son ID
    globalPollingIntervalRef.current = setInterval(fetchAllNewMessages, 10000); // Vérifier toutes les 10 secondes

    // Fonction de Nettoyage pour cet effet (appelée si user/loading change ou au démontage)
    return () => {
      if (globalPollingIntervalRef.current) {
        clearInterval(globalPollingIntervalRef.current); // Arrêter l'intervalle
        globalPollingIntervalRef.current = null; // Réinitialiser la référence
        console.log("[AuthContext Global Polling] Arrêté (nettoyage effet).");
      }
    };
  // Dépendances : Démarrer/arrêter le polling quand 'user' ou 'loading' change
  }, [user, loading]);
  // --- FIN EFFET POLLING GLOBAL ---

  // Fonction Login (Initialise le timestamp de polling après récupération user)
  const login = async (credentials) => {
    console.log("[AuthContext] Attempting login...");
    const { email, password } = credentials;
    if (!email || !password) { throw new Error("Email and password are required."); }
    try {
      const response = await authService.login({ email, password });
      const { token } = response.data;
      if (!token) { throw new Error("Login successful but no token received."); }
      console.log("[AuthContext] Login successful, token received.");
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      console.log("[AuthContext] Fetching user info after login...");
      const userInfoResponse = await authService.getUserInfo();
      const userData = userInfoResponse.data;
      localStorage.setItem("user", JSON.stringify(userData));
      console.log("[AuthContext] User info fetched:", userData);
      setUser(userData); // Déclenche l'effet pour démarrer le polling
      // Initialiser le timestamp polling APRÈS que l'utilisateur soit défini
      lastGlobalCheckTimestampRef.current = new Date().toISOString();
      return userData;
    } catch (error) {
      console.error("[AuthContext] Login failed:", error.response?.data || error.message);
      logout(); // Nettoyage complet en cas d'échec
      throw error;
    }
  };

  // Fonction Logout (Arrête le polling via l'effet qui dépend de 'user')
  const logout = useCallback(() => {
    console.log("[AuthContext] Logout initiated.");
    // stopSignalRConnection(); // <<< SUPPRIMÉ OU COMMENTÉ

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common["Authorization"];
    setUser(null); // <<< Déclenche l'effet pour arrêter le polling
    setUnreadMessages({}); // Vider les messages non lus au logout
    console.log("[AuthContext] Logout complete. State cleaned up.");
  }, [/* Dépendances vides si stopSignalRConnection enlevé */]);


  // --- AJOUT : Fonction pour marquer les messages d'un expéditeur comme lus ---
  const clearUnreadFromSender = useCallback((senderId) => {
      console.log(`[AuthContext] Remise à zéro des non lus pour ${senderId}`);
      setUnreadMessages(prevUnread => {
          // Vérifier si l'expéditeur existe dans l'objet avant de supprimer
          if (!prevUnread || !(senderId in prevUnread)) {
              return prevUnread; // Retourner l'état inchangé
          }
          // Créer une copie de l'état précédent pour l'immutabilité
          const newState = { ...prevUnread };
          // Supprimer l'entrée pour cet expéditeur
          delete newState[senderId];
          console.log("[AuthContext] Nouvel état unreadMessages après clear:", newState);
          return newState; // Retourner le nouvel état sans l'expéditeur
      });
  }, []); // Pas de dépendances externes, la fonction est stable
  // --- FIN AJOUT ---


  // --- Valeur fournie par le contexte ---
  // Inclut l'état des messages non lus et la fonction pour les effacer
  const value = {
    user,
    loading,
    login,
    logout,
    // signalRConnection, // <<< SUPPRIMER si SignalR n'est plus utilisé
    // --- AJOUT ---
    unreadMessages,
    clearUnreadFromSender,
    // --- FIN AJOUT ---
  };

  // --- Provider JSX ---
  // Rend le fournisseur de contexte avec la valeur mise à jour
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}