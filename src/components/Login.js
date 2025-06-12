import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../appwrite/appwrite';
import '../styles/Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const session = await loginUser(email, password);
            console.log('Sesión iniciada:', session);
            
            // Redirigir al panel de administración
            navigate('/admin');
        } catch (error) {
            console.error('Error en login:', error);
            if (error.code === 401) {
                setError('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
            } else if (error.code === 403) {
                setError('No tienes permisos para acceder. Por favor, contacta al administrador.');
            } else if (error.code === 429) {
                setError('Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.');
            } else {
                setError('Error al iniciar sesión. Por favor, intenta nuevamente más tarde.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Iniciar Sesión</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="password">Contraseña:</label>
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login; 