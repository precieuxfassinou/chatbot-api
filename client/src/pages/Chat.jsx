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

      const normalized = [];
      (data.history || []).forEach((conversation) => {
        conversation.messages.forEach((msg) => {
          normalized.push({
            sender: msg.sender,
            content: msg.content,
          });
        });
      });
      setMessages(normalized);
    };
    fetchHistory();
  }, []);

  useEffect(() => {
    socket.on("response", (data) => {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", content: data.response },
      ]);
    });

    return () => {
      socket.off("response");
    };
  }, []);

  async function sendMessage() {
    if (writting.trim() === "") return;

    // sendMessage
    setMessages((prev) => [...prev, { sender: "user", content: writting }]);

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
          name=""
          id=""
          value={writting}
          onChange={(e) => setWritting(e.target.value)}
        ></textarea>
        <button onClick={sendMessage}> Envoyer</button>
      </div>
    </div>
  );
}

export default Chat;
