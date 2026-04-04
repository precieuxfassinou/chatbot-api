import { useNavigate } from 'react-router-dom';

export default function Home() {
    const navigate = useNavigate();

    return (
        <div className="home-container">
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <h1>Stella Support</h1>
            <p>Votre assistante virtuelle disponible 24h/24 pour répondre à toutes vos questions.</p>
            <div className="home-buttons">
                <button className="btn-secondary" onClick={() => navigate('/login')}>Se connecter</button>
                <button className="btn-primary" onClick={() => navigate('/register')}>S'inscrire</button>
            </div>
        </div>
    );
}
