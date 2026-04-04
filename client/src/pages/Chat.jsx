import { useState } from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import apiFetch from "../api";
import API_URL from "../config";

function Chat() {
  const navigate = useNavigate();
  const [writting, setWritting] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const token = localStorage.getItem("token");

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

  async function sendMessage() {
    setLoading(true);
    const response = await apiFetch(`${API_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: writting }),
    });
    const data = await response.json();
    if (writting.trim() !== "") {
      setMessages([
        ...messages,
        { user_message: writting, bot_response: data.response },
      ]);
      setWritting("");
    }
    setLoading(false);
  }

  return (
    <div className="chat-container">
      <h1 className="chat-header">Chat Support</h1>
      <div className="chat-messages">
        {messages.map((message, index) => (
          <>
            <div key={index} className="message-user">
              {message.user_message}
            </div>
            <div className="message-bot">{message.bot_response}</div>
          </>
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
          {loading ? "Envoi en cours..." : "Envoyer"}
        </button>
      </div>
    </div>
  );
}

export default Chat;
