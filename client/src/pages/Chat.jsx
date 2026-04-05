import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";

import apiFetch from "../api";
import API_URL from "../config";
import { io } from "socket.io-client";

const socket = io(API_URL);

function Chat() {
  const navigate = useNavigate();
  const [writting, setWritting] = useState("");
  const [messages, setMessages] = useState([]);
  const [profile, setProfile] = useState(null);
  const token = localStorage.getItem("token");

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const response = await apiFetch(`${API_URL}/auth/profile`);
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
      }
    };
    fetchProfile();
  }, []);

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    const fetchHistory = async () => {
      const response = await apiFetch(`${API_URL}/chat/history`);
      const data = await response.json();
      setMessages(data.history || []);
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    socket.on("response", (data) => {
      setMessages((prev) => [
        ...prev,
        {
          user_message: "",
          bot_response: data.response,
        },
      ]);
    });

    return () => {
      socket.off("response");
    };
  }, []);

  async function sendMessage() {
    if (writting.trim() === "") return;

    setMessages((prev) => [
      ...prev,
      { user_message: writting, bot_response: "" },
    ]);
    socket.emit("message", { message: writting, token });
    setWritting("");
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <span>Chat Support</span>
        <div style={{ display: "flex", gap: "8px" }}>
          {profile?.role === "admin" && (
            <button onClick={() => navigate("/dashboard")}>Dashboard</button>
          )}
          <button onClick={logout}>Déconnexion</button>
        </div>
      </div>
      <div className="chat-messages">
        {messages.map((message, index) => (
          <React.Fragment key={index}>
            {message.user_message && (
              <div className="message-user">{message.user_message}</div>
            )}
            {message.bot_response && (
              <div className="message-bot">{message.bot_response}</div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="chat-input">
        <textarea
          name=""
          id=""
          value={writting}
          onChange={(e) => setWritting(e.target.value)}
        ></textarea>
        <button onClick={sendMessage}>
          {" "}
          Envoyer
        </button>
      </div>
    </div>
  );
}

export default Chat;
