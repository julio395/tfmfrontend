import React, { useState } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from './firebase/firebase';
import { setDoc, doc, getDoc } from 'firebase/firestore';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [employees, setEmployees] = useState('');
  const [sector, setSector] = useState('Sector Inmobiliario');
  const [responsible, setResponsible] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [userCredential, setUserCredential] = useState(null);
  const [generatedCode, setGeneratedCode] = useState('');

  const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      setUserCredential(credential);
      const code = generateVerificationCode();
      setGeneratedCode(code);
      await setDoc(doc(db, 'verificationCodes', credential.user.uid), { code });
      
      setSuccess('¡Registro exitoso! Por favor, ingresa el código de verificación que se muestra a continuación.');
      setShowVerificationInput(true);
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya ha sido registrado');
      } else {
        setError('Error al registrar: ' + err.message);
      }
    }
  };

  const handleVerification = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      const verificationDoc = await getDoc(doc(db, 'verificationCodes', userCredential.user.uid));
      if (!verificationDoc.exists()) {
        setError('Código de verificación no encontrado.');
        return;
      }
      const { code } = verificationDoc.data();
      if (verificationCode !== code) {
        setError('Código de verificación incorrecto.');
        return;
      }
      setSuccess('¡Verificación exitosa! Ahora puedes iniciar sesión.');
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        companyName,
        employees,
        sector,
        responsible,
        role: 'user'
      });
      setEmail(''); setPassword(''); setConfirmPassword(''); setCompanyName(''); setEmployees(''); setResponsible('');
      setShowVerificationInput(false);
      setGeneratedCode('');
    } catch (err) {
      setError('Error al verificar: ' + err.message);
    }
  };

  return (
    <form onSubmit={showVerificationInput ? handleVerification : handleSubmit} style={{ display: 'flex', flexDirection: 'column', width: 300 }}>
      <h2>Registro</h2>
      {!showVerificationInput ? (
        <>
          <input
            type="email"
            placeholder="Usuario (email)"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ marginBottom: 10 }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ marginBottom: 10 }}
          />
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            required
            style={{ marginBottom: 10 }}
          />
          <input
            type="text"
            placeholder="Nombre de la empresa"
            value={companyName}
            onChange={e => setCompanyName(e.target.value)}
            required
            style={{ marginBottom: 10 }}
          />
          <input
            type="number"
            placeholder="Empleados de la empresa"
            value={employees}
            onChange={e => setEmployees(e.target.value)}
            required
            style={{ marginBottom: 10 }}
            min={1}
          />
          <select value={sector} onChange={e => setSector(e.target.value)} style={{ marginBottom: 10 }} required>
            <option value="Sector Inmobiliario">Sector Inmobiliario</option>
          </select>
          <input
            type="text"
            placeholder="Nombre del responsable"
            value={responsible}
            onChange={e => setResponsible(e.target.value)}
            required
            style={{ marginBottom: 10 }}
          />
          <button type="submit">Registrarse</button>
        </>
      ) : (
        <>
          <div style={{ marginBottom: 20, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 5 }}>
            <p style={{ margin: 0 }}>Tu código de verificación es:</p>
            <h3 style={{ margin: '10px 0', color: '#2196f3' }}>{generatedCode}</h3>
          </div>
          <input
            type="text"
            placeholder="Ingresa el código de verificación"
            value={verificationCode}
            onChange={e => setVerificationCode(e.target.value)}
            required
            style={{ marginBottom: 10 }}
          />
          <button type="submit">Verificar</button>
        </>
      )}
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: 10 }}>{success}</div>}
    </form>
  );
};

export default Register; 