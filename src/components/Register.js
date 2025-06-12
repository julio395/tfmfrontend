import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { account, ID } from '../appwrite/appwrite';
import './Login.css';

const Register = ({ setUser }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [name, setName] = useState('');
    const [companyName, setCompanyName] = useState('');
    const [employees, setEmployees] = useState('');
    const [sector, setSector] = useState('Sector Inmobiliario');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validar que las contraseñas coincidan
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            setLoading(false);
            return;
        }

        try {
            // Crear el usuario en Appwrite
            const user = await account.create(
                ID.unique(),
                email,
                password,
                name
            );
            console.log('Usuario creado:', user);

            // Iniciar sesión automáticamente
            const session = await account.createEmailSession(email, password);
            console.log('Sesión creada:', session);

            // Esperar un momento para asegurar que la sesión esté establecida
            await new Promise(resolve => setTimeout(resolve, 1000));

            try {
                // Actualizar las preferencias del usuario
                await account.updatePrefs({
                    companyName,
                    employees,
                    sector,
                    role: 'user'
                });
            } catch (prefsError) {
                console.error('Error al actualizar preferencias:', prefsError);
                // Si falla la actualización de preferencias, redirigimos al login
                navigate('/login?message=Registro completado. Por favor, inicia sesión.');
                return;
            }

            // Obtener información del usuario
            const userData = await account.get();
            setUser({
                ...userData,
                role: 'user'
            });

            // Redirigir al usuario a la página principal
            navigate('/home');
        } catch (error) {
            console.error('Error en registro:', error);
            if (error.code === 409) {
                setError('Este email ya está registrado. Por favor, usa otro email o inicia sesión.');
            } else if (error.code === 400) {
                setError('Por favor, verifica que todos los campos sean válidos.');
            } else {
                setError('Error al registrar usuario. Por favor, intenta nuevamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-box">
                <h2>Registro</h2>
                {error && <div className="error-message">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Nombre:</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Email:</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Contraseña:</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Confirmar Contraseña:</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Nombre de la Empresa:</label>
                        <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Número de Empleados:</label>
                        <input
                            type="number"
                            value={employees}
                            onChange={(e) => setEmployees(e.target.value)}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Sector:</label>
                        <select
                            value={sector}
                            onChange={(e) => setSector(e.target.value)}
                            required
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px',
                                fontSize: '1rem',
                                backgroundColor: '#fff'
                            }}
                        >
                            <option value="Sector Inmobiliario">Sector Inmobiliario</option>
                        </select>
                    </div>
                    <button type="submit" disabled={loading}>
                        {loading ? 'Registrando...' : 'Registrarse'}
                    </button>
                </form>
                <p className="register-link">
                    ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
                </p>
            </div>
        </div>
    );
};

export default Register; 