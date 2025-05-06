// src/components/SignalR_Tester.js
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext'; // Pour récupérer la connexion
import { HubConnectionState } from '@microsoft/signalr';

function SignalRTester() {
  const { user, signalRConnection } = useAuth(); // Récupère la connexion depuis le contexte
  const [echoInput, setEchoInput] = useState("Test Echo");
  const [targetUserId, setTargetUserId] = useState("");
  const [targetConnectionId, setTargetConnectionId] = useState("");
  const [testMessage, setTestMessage] = useState("Message de test");
  const [echoResponse, setEchoResponse] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [connectionStatus, setConnectionStatus] = useState("Non connecté");

  // --- Listeners pour les réponses des méthodes de test ---
  const handleEchoResponse = useCallback((messageFromServer) => {
    console.log("<<<<< TESTEUR: ReceiveEchoTest REÇU:", messageFromServer);
    setEchoResponse(messageFromServer);
  }, []);

  const handleTestMessageResponse = useCallback((messageFromServer) => {
    console.log("<<<<< TESTEUR: ReceiveTestMessage REÇU:", messageFromServer);
    setTestResponse(messageFromServer);
    alert(`Réponse/Message Test Reçu: ${messageFromServer}`); // Alerte pour visibilité immédiate
  }, []);

  // Effet pour attacher/détacher les listeners de test
  useEffect(() => {
    if (signalRConnection && signalRConnection.state === HubConnectionState.Connected) {
      setConnectionStatus(`Connecté (ID: ${signalRConnection.connectionId})`);
      console.log("[TESTEUR] Connexion détectée, attachement des listeners de test...");

      // Nettoyer anciens listeners
      signalRConnection.off("ReceiveEchoTest", handleEchoResponse);
      signalRConnection.off("ReceiveTestMessage", handleTestMessageResponse);

      // Attacher nouveaux listeners
      signalRConnection.on("ReceiveEchoTest", handleEchoResponse);
      signalRConnection.on("ReceiveTestMessage", handleTestMessageResponse);
      console.log("[TESTEUR] Listeners 'ReceiveEchoTest' et 'ReceiveTestMessage' attachés.");

      // Fonction de nettoyage
      return () => {
        console.log("[TESTEUR] Nettoyage des listeners de test...");
        if (signalRConnection) {
          signalRConnection.off("ReceiveEchoTest", handleEchoResponse);
          signalRConnection.off("ReceiveTestMessage", handleTestMessageResponse);
        }
      };
    } else {
      setConnectionStatus(`État: ${signalRConnection?.state ?? 'Inconnu/Null'}`);
      console.log("[TESTEUR] Connexion non active pour les listeners de test.");
    }
  // Mettre à jour si la connexion change ou si les fonctions handler changent (grâce à useCallback)
  }, [signalRConnection, handleEchoResponse, handleTestMessageResponse]);


  // --- Fonctions pour appeler les méthodes du Hub ---

  const invokeEchoTest = async () => {
    if (!signalRConnection || signalRConnection.state !== HubConnectionState.Connected) {
      alert("Non connecté au Hub SignalR !");
      return;
    }
    try {
      setEchoResponse("Envoi Echo...");
      console.log(`[TESTEUR] Invocation EchoTest avec: "${echoInput}"`);
      await signalRConnection.invoke("EchoTest", echoInput);
      console.log("[TESTEUR] Invocation EchoTest terminée.");
    } catch (err) {
      console.error("[TESTEUR] Erreur invocation EchoTest:", err);
      setEchoResponse(`Erreur Echo: ${err.message}`);
    }
  };

  const invokeSendToUser = async () => {
    if (!signalRConnection || signalRConnection.state !== HubConnectionState.Connected) { alert("Non connecté !"); return; }
    if (!targetUserId) { alert("Veuillez entrer un User ID cible."); return; }
    if (!testMessage) { alert("Veuillez entrer un message de test."); return; }
    try {
      setTestResponse("Envoi vers User ID...");
      console.log(`[TESTEUR] Invocation SendTestToUser vers ${targetUserId} avec: "${testMessage}"`);
      await signalRConnection.invoke("SendTestToUser", targetUserId, testMessage);
      console.log("[TESTEUR] Invocation SendTestToUser terminée.");
    } catch (err) {
      console.error("[TESTEUR] Erreur invocation SendTestToUser:", err);
      setTestResponse(`Erreur SendToUser: ${err.message}`);
    }
  };

  const invokeSendToConnection = async () => {
    if (!signalRConnection || signalRConnection.state !== HubConnectionState.Connected) { alert("Non connecté !"); return; }
    if (!targetConnectionId) { alert("Veuillez entrer un Connection ID cible."); return; }
    if (!testMessage) { alert("Veuillez entrer un message de test."); return; }
    try {
      setTestResponse("Envoi vers Connection ID...");
      console.log(`[TESTEUR] Invocation SendTestToConnectionId vers ${targetConnectionId} avec: "${testMessage}"`);
      await signalRConnection.invoke("SendTestToConnectionId", targetConnectionId, testMessage);
      console.log("[TESTEUR] Invocation SendTestToConnectionId terminée.");
    } catch (err) {
      console.error("[TESTEUR] Erreur invocation SendTestToConnectionId:", err);
      setTestResponse(`Erreur SendToConnection: ${err.message}`);
    }
  };

  // --- JSX ---
  return (
    <div style={{ border: '2px solid blue', padding: '15px', margin: '20px', backgroundColor: '#eef' }}>
      <h3>Testeur SignalR Hub</h3>
      <p><strong>Utilisateur Actuel:</strong> {user?.email ?? 'Non connecté'}</p>
      <p><strong>Statut Connexion SignalR:</strong> {connectionStatus}</p>
      <hr style={{ margin: '15px 0' }} />

      {/* Section Test Echo */}
      <div>
        <h4>Test Echo (Client -Serveur - Client)</h4>
        <input
          type="text"
          value={echoInput}
          onChange={(e) => setEchoInput(e.target.value)}
          placeholder="Message pour l'écho"
          style={{ marginRight: '10px', padding: '5px' }}
        />
        <button onClick={invokeEchoTest} disabled={!signalRConnection || signalRConnection.state !== HubConnectionState.Connected}>
          Envoyer Echo
        </button>
        <p style={{ marginTop: '5px' }}><strong>Réponse Echo:</strong> {echoResponse || '(aucune)'}</p>
      </div>
      <hr style={{ margin: '15px 0' }} />

      {/* Section Test Envoi */}
      <div>
        <h4>Test Envoi Message (Client - Serveur -Autre Client)</h4>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="testMsgInput" style={{ marginRight: '5px' }}>Message:</label>
          <input
            id="testMsgInput"
            type="text"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Message de test"
            style={{ padding: '5px', width: '300px' }}
          />
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="targetUserIdInput" style={{ marginRight: '5px' }}>User ID Cible:</label>
          <input
            id="targetUserIdInput"
            type="text"
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            placeholder="ID de l'utilisateur destinataire"
             style={{ padding: '5px', width: '300px' }}
          />
          <button onClick={invokeSendToUser} disabled={!signalRConnection || signalRConnection.state !== HubConnectionState.Connected} style={{ marginLeft: '10px' }}>
            Envoyer à User ID
          </button>
        </div>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="targetConnIdInput" style={{ marginRight: '5px' }}>Connection ID Cible:</label>
          <input
            id="targetConnIdInput"
            type="text"
            value={targetConnectionId}
            onChange={(e) => setTargetConnectionId(e.target.value)}
            placeholder="ID de connexion SignalR du destinataire"
            style={{ padding: '5px', width: '300px' }}
          />
          <button onClick={invokeSendToConnection} disabled={!signalRConnection || signalRConnection.state !== HubConnectionState.Connected} style={{ marginLeft: '10px' }}>
            Envoyer à Connection ID
          </button>
        </div>
        <p style={{ marginTop: '5px' }}><strong>Réponse/Message Test Reçu:</strong> {testResponse || '(aucun)'}</p>
        <small> (Regardez aussi la console et les alertes du navigateur destinataire)</small>
      </div>
    </div>
  );
}

export default SignalRTester;