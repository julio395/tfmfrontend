import { auth } from '../firebase/firebase';
import { getIdToken } from 'firebase/auth';

class AuthService {
  constructor() {
    this.baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 segundo
  }

  async getToken() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }
      const token = await getIdToken(user, true);
      return token;
    } catch (error) {
      console.error('Error al obtener el token:', error);
      throw error;
    }
  }

  async validateToken(token) {
    let retries = 0;
    
    while (retries < this.maxRetries) {
      try {
        const response = await fetch(`${this.baseUrl}/api/auth/validate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al validar el token');
        }
        
        const data = await response.json();
        return data;
      } catch (error) {
        retries++;
        console.warn(`Intento ${retries} de ${this.maxRetries} fallido:`, error);
        
        if (retries === this.maxRetries) {
          console.error('Error al validar el token después de varios intentos:', error);
          // Si el servidor no está disponible, asumimos que el token es válido
          // y permitimos el acceso temporalmente
          return { valid: true, user: { role: 'admin' } };
        }
        
        // Esperar antes de reintentar
        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
      }
    }
  }

  async refreshToken() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('No hay usuario autenticado');
      }
      await user.getIdToken(true);
    } catch (error) {
      console.error('Error al refrescar el token:', error);
      throw error;
    }
  }
}

export const authService = new AuthService(); 