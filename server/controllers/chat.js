const pool = require('../config/db');


require("dotenv").config();

const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);


async function analyzeMessage(message) {

    const prompt = `Analyse ce message et retourne UNIQUEMENT un JSON sans markdown avec ce format exact : {"intention": "...", "felling": "..."} Les intentions possibles : salutation, suivi_commande, paiement, remboursement, livraison, autre Les sentiments possibles : positif, neutre, negatif Message : ${message}`; const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = await result.response.text();
    const { intention, felling } = JSON.parse(text);
    return { intention, felling }

}
async function getResponse(message, analysis, history = []) {
    
    const contents = history.map(msg => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.content }]
    }));

    contents.push({
        role: "user",
        parts: [{ text: message }]
    });

    const prompt = "Ton nom est Stella. Tu es une assistante support client pour une entreprise e-commerce. Tu réponds toujours en français. Tu aides les clients avec leurs commandes, paiements, remboursements et livraisons. Tu es poli, concis et professionnel. Ne te présente pas à chaque message si tu l'as déjà fait.";
    let response = "";

    if (analysis.felling === "negatif") {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: prompt });
        const result = await model.generateContent({ contents });
        return result.response.text();
    }

    else {
        if (analysis.intention === "salutation") {
            response = "Bonjour ! Comment puis-je vous aider ?";
        } else if (analysis.intention === "suivi_commande") {
            response = "Veuillez fournir votre numéro de commande pour que je puisse vous aider.";
        } else if (analysis.intention === "paiement") {
            response = "Nous acceptons : carte bancaire, mobile money (Wave, Orange Money) et virement bancaire.";
        } else if (analysis.intention === "remboursement") {
            response = "Pour un remboursement, envoyez votre numéro de commande et le motif à support@boutique.com.";
        } else if (analysis.intention === "livraison") {
            response = "La livraison prend entre 2 et 5 jours ouvrables selon votre zone.";
        } else {
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", systemInstruction: prompt });
            const result = await model.generateContent({ contents });
            return result.response.text();
        }
    }
    return response;
}

async function getHistory(req, res) {
    const userId = req.user.id;
    
    // 1. récupérer les conversations
    const conversations = await pool.query(
        "SELECT * FROM conversations WHERE user_id = $1 ORDER BY created_at ASC",
        [userId]
    );
    
    // 2. pour chaque conversation, récupérer ses messages
    const result = await Promise.all(
        conversations.rows.map(async (conv) => {
            const messages = await pool.query(
                "SELECT * FROM messages WHERE conversation_id = $1 ORDER BY created_at ASC",
                [conv.id]
            );
            return {
                ...conv,
                messages: messages.rows
            };
        })
    );
    
    res.json({ history: result });
}

async function getOrCreateConversation(userId) {
    let conversation = await pool.query(
        "SELECT * FROM conversations WHERE user_id = $1 AND status = 'active'",
        [userId]
    );
    if (conversation.rows.length === 0) {
        conversation = await pool.query(
            "INSERT INTO conversations (user_id, status) VALUES ($1, 'active') RETURNING *",
            [userId]
        );
    }
    return conversation.rows[0];
}

async function handleChat(req, res) {
    const { message } = req.body;
    const userId = req.user.id;
    const conversation = await getOrCreateConversation(userId);

    if (!message) {
        return res.status(400).json({ error: "Message vide" });
    }

    const analysis = await analyzeMessage(message);
    const response = await getResponse(message, analysis);
    // Message utilisateur
    await pool.query(
        "INSERT INTO messages (conversation_id, sender, content) VALUES ($1, 'user', $2)",
        [conversation.id, message]
    );

    // Réponse du bot
    await pool.query(
        "INSERT INTO messages (conversation_id, sender, content, intention) VALUES ($1, 'bot', $2, $3)",
        [conversation.id, response, analysis.intention]
    );
    res.json({ response });
}

module.exports = { handleChat, getHistory, analyzeMessage, getResponse, getOrCreateConversation };