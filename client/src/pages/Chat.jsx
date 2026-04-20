import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";
import apiFetch from "../api";
import API_URL from "../config";
import { io } from "socket.io-client";

function Chat() {
  const navigate = useNavigate();
  const [writting, setWritting] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selectedConvId, setSelectedConvId] = useState(null);
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const socketRef = useRef(null);
  const token = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  // Conv active = celle avec status 'active'
  const activeConversation = conversations.find((c) => c.status === "active");
  // Conv affichée = celle sélectionnée, ou par défaut la conv active
  const displayedConversation =
    conversations.find((c) => c.id === selectedConvId) || activeConversation;
  // Est-ce qu'on regarde une vieille conv ?
  const isViewingHistory =
    displayedConversation && displayedConversation.status !== "active";

  const fetchHistory = async (opts = {}) => {
    const response = await apiFetch(`${API_URL}/chat/history`);
    const data = await response.json();
    if (opts.cancelled?.()) return;
    setConversations(data.history || []);
  };

  // Profil
  useEffect(() => {
    const fetchProfile = async () => {
      const response = await apiFetch(`${API_URL}/auth/profile`);
      if (response.ok) setProfile(await response.json());
    };
    fetchProfile();
  }, []);

  // Historique initial + redirect si pas de token
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchHistory({ cancelled: () => cancelled });
    return () => {
      cancelled = true;
    };
  }, []);

  // Socket : connexion authentifiée + listeners
  useEffect(() => {
    if (!token) return;

    const socket = io(API_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
      if (
        err.message === "Token invalide" ||
        err.message === "Token manquant"
      ) {
        logout();
      }
    });

    socket.on("response", (data) => {
      // Ajouter la réponse bot à la conv active uniquement
      setConversations((prev) =>
        prev.map((conv) =>
          conv.status === "active"
            ? {
                ...conv,
                messages: [
                  ...conv.messages,
                  { sender: "bot", content: data.response },
                ],
              }
            : conv
        )
      );
    });

    socket.on("conversation:created", async (data) => {
      const msg =
        data.reason === "inactivity_timeout"
          ? "Nouvelle conversation démarrée (inactivité)"
          : "Nouvelle conversation démarrée";
      setToast(msg);
      setTimeout(() => setToast(null), 4000);
      await fetchHistory();
      setSelectedConvId(null); // revenir sur la conv active
    });

    return () => {
      socket.off("response");
      socket.off("conversation:created");
      socket.off("connect_error");
      socket.disconnect();
    };
  }, [token]);

  async function sendMessage() {
    if (writting.trim() === "") return;

    // Si on regarde une vieille conv, on rebascule sur l'active avant d'envoyer
    if (isViewingHistory) {
      setSelectedConvId(null);
    }

    // Ajouter le message user à la conv active localement (optimistic update)
    setConversations((prev) =>
      prev.map((conv) =>
        conv.status === "active"
          ? {
              ...conv,
              messages: [
                ...conv.messages,
                { sender: "user", content: writting },
              ],
            }
          : conv
      )
    );

    socketRef.current?.emit("message", { message: writting });
    setWritting("");
  }

  // Titre pour la sidebar : date + premier message utilisateur
  const getConversationTitle = (conv) => {
    const firstUserMsg = conv.messages?.find((m) => m.sender === "user");
    const preview = firstUserMsg
      ? firstUserMsg.content.slice(0, 38) +
        (firstUserMsg.content.length > 38 ? "…" : "")
      : "(vide)";
    const date = new Date(conv.created_at).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
    return { preview, date };
  };

  return (
    <div className="chat-layout">
      {/* Sidebar */}
      <aside className={`chat-sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <div className="sidebar-header">
          {sidebarOpen && <span>Historique</span>}
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? "‹" : "›"}
          </button>
        </div>

        {sidebarOpen && (
          <ul className="sidebar-list">
            {conversations.map((conv) => {
              const { preview, date } = getConversationTitle(conv);
              const isSelected =
                displayedConversation && displayedConversation.id === conv.id;
              return (
                <li
                  key={conv.id}
                  className={`sidebar-item ${isSelected ? "selected" : ""}`}
                  onClick={() => setSelectedConvId(conv.id)}
                >
                  <div className="sidebar-item-date">{date}</div>
                  <div className="sidebar-item-preview">{preview}</div>
                  {conv.status === "active" && (
                    <span className="sidebar-badge">en cours</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </aside>

      {/* Zone de chat principale */}
      <div className="chat-container">
        {toast && <div className="chat-toast">{toast}</div>}

        <div className="chat-header">
          <span>Chat Support</span>
          <div style={{ display: "flex", gap: "8px" }}>
            {profile?.role === "admin" && (
              <button onClick={() => navigate("/dashboard")}>Dashboard</button>
            )}
            <button onClick={logout}>Déconnexion</button>
          </div>
        </div>

        {isViewingHistory && (
          <div className="chat-history-banner">
            📖 Historique — taper un message créera une nouvelle discussion
          </div>
        )}

        <div className="chat-messages">
          {displayedConversation?.messages?.map((message, index) => (
            <React.Fragment key={index}>
              {message.sender === "user" && (
                <div className="message-user">{message.content}</div>
              )}
              {message.sender === "bot" && (
                <div className="message-bot">{message.content}</div>
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="chat-input">
          <textarea
            value={writting}
            onChange={(e) => setWritting(e.target.value)}
            placeholder={
              isViewingHistory
                ? "Taper pour créer une nouvelle conversation…"
                : "Votre message…"
            }
          />
          <button onClick={sendMessage}>Envoyer</button>
        </div>
      </div>
    </div>
  );
}

export default Chat;

