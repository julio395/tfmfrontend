import { Client, Account, Teams, Databases, Storage, ID } from 'appwrite';

// Configuración del cliente de Appwrite
const client = new Client()
    .setEndpoint('https://appwrite-tfm.julio.coolify.hgccarlos.es/v1')
    .setProject('683f418d003d466cfe2e')
    .setLocale('es');

// Crear instancias de los servicios de Appwrite
const account = new Account(client);
const teams = new Teams(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Configuración de la API de MongoDB
const isDevelopment = window.location.hostname === 'localhost';
export const MONGODB_API_URL = isDevelopment 
    ? 'http://localhost:3001/api/tfm'
    : 'https://projectfm.julio.coolify.hgccarlos.es/api/tfm';

export const checkSession = async () => {
    try {
        const session = await account.getSession('current');
        console.log('Sesión actual:', session);
        return session;
    } catch (error) {
        console.error('Error al verificar sesión:', error);
        if (error.code === 401 || error.code === 404) {
            // Sesión no válida o expirada
            return null;
        }
        throw error;
    }
};

export const createUser = async (email, password, name) => {
    try {
        const user = await account.create(
            ID.unique(),
            email,
            password,
            name
        );
        return user;
    } catch (error) {
        console.error('Error creating user:', error);
        throw error;
    }
};

// Función para verificar la conexión con Appwrite
const checkAppwriteConnection = async () => {
    try {
        console.log('Verificando conexión con Appwrite...');
        console.log('Configuración actual:', {
            endpoint: 'https://appwrite-tfm.julio.coolify.hgccarlos.es/v1',
            projectId: '683f418d003d466cfe2e'
        });
        
        // Intentar obtener la información de la cuenta
        const user = await account.get();
        console.log('Conexión con Appwrite verificada correctamente');
        return true;
    } catch (error) {
        console.error('Error al verificar conexión:', error);
        if (error.type === 'user_unauthorized') {
            throw new Error('Error de autenticación con Appwrite. Por favor, verifica la configuración del proyecto.');
        } else if (error.type === 'general_connection_refused') {
            throw new Error('No se pudo conectar con el servidor de Appwrite. Por favor, verifica tu conexión a internet.');
        } else {
            throw new Error(`Error de conexión con Appwrite: ${error.message}`);
        }
    }
};

export const loginUser = async (email, password) => {
    try {
        console.log('Iniciando proceso de login...');
        
        // Verificar conexión primero
        await checkAppwriteConnection();

        // Intentar login
        console.log('Intentando login con email:', email);
        try {
            const session = await account.createEmailSession(email, password);
            console.log('Sesión creada:', session);
        } catch (loginError) {
            console.error('Error específico en login:', loginError);
            if (loginError.code === 401) {
                throw new Error('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
            } else if (loginError.code === 403) {
                throw new Error('Acceso denegado. Por favor, contacta al administrador.');
            } else if (loginError.code === 429) {
                throw new Error('Demasiados intentos. Por favor, espera unos minutos antes de intentar nuevamente.');
            } else {
                throw new Error(`Error al iniciar sesión: ${loginError.message}`);
            }
        }

        // Obtener información del usuario
        console.log('Obteniendo información del usuario...');
        const user = await account.get();
        console.log('Información del usuario obtenida:', user);

        // Verificar si el usuario tiene la etiqueta "admin"
        const isAdmin = user.labels && user.labels.includes('admin');
        console.log('¿Es admin?:', isAdmin);

        // Si no es admin, verificar que sea un usuario normal
        if (!isAdmin) {
            console.log('Verificando permisos de usuario normal...');
            try {
                // Intentar obtener la lista de equipos del usuario
                const teams = await account.listTeams();
                console.log('Equipos del usuario:', teams);
                
                // Verificar si el usuario pertenece al equipo de usuarios normales
                const isNormalUser = teams.teams.some(team => team.name === 'users');
                if (!isNormalUser) {
                    console.log('Usuario no pertenece al equipo de usuarios normales');
                    throw new Error('No tienes permisos para acceder a esta aplicación.');
                }
            } catch (teamError) {
                console.error('Error al verificar equipos:', teamError);
                throw new Error('Error al verificar permisos de usuario. Por favor, contacta al administrador.');
            }
        }

        return {
            ...user,
            role: isAdmin ? 'admin' : 'user'
        };
    } catch (error) {
        console.error('Error detallado en login:', error);
        throw error; // Re-lanzar el error para que sea manejado por el componente
    }
};

export const getCurrentUser = async () => {
    try {
        const user = await account.get();
        return user;
    } catch (error) {
        console.error('Error getting current user:', error);
        throw error;
    }
};

export const logoutUser = async () => {
    try {
        await account.deleteSession('current');
        console.log('Sesión cerrada exitosamente');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        throw new Error('Error al cerrar sesión. Por favor, intenta nuevamente.');
    }
};

export const getUsers = async () => {
    try {
        const response = await teams.list();
        return response.teams.map(team => ({
            id: team.$id,
            name: team.name,
            role: team.role,
            status: team.status
        }));
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        throw new Error('Error al obtener la lista de usuarios. Por favor, intenta nuevamente.');
    }
};

export const createDocument = async (collectionId, data) => {
    try {
        return await databases.createDocument(
            process.env.REACT_APP_APPWRITE_DATABASE_ID || '67c8c0c0c0c0c0c0c0c0c0c0',
            collectionId,
            ID.unique(),
            data
        );
    } catch (error) {
        console.error('Error al crear documento:', error);
        throw new Error('Error al crear el documento. Por favor, intenta nuevamente.');
    }
};

export const getDocuments = async (collectionId) => {
    try {
        return await databases.listDocuments(
            process.env.REACT_APP_APPWRITE_DATABASE_ID || '67c8c0c0c0c0c0c0c0c0c0c0',
            collectionId
        );
    } catch (error) {
        console.error('Error al obtener documentos:', error);
        throw new Error('Error al obtener los documentos. Por favor, intenta nuevamente.');
    }
};

export const updateDocument = async (collectionId, documentId, data) => {
    try {
        return await databases.updateDocument(
            process.env.REACT_APP_APPWRITE_DATABASE_ID || '67c8c0c0c0c0c0c0c0c0c0c0',
            collectionId,
            documentId,
            data
        );
    } catch (error) {
        console.error('Error al actualizar documento:', error);
        throw new Error('Error al actualizar el documento. Por favor, intenta nuevamente.');
    }
};

export const deleteDocument = async (collectionId, documentId) => {
    try {
        return await databases.deleteDocument(
            process.env.REACT_APP_APPWRITE_DATABASE_ID || '67c8c0c0c0c0c0c0c0c0c0c0',
            collectionId,
            documentId
        );
    } catch (error) {
        console.error('Error al eliminar documento:', error);
        throw new Error('Error al eliminar el documento. Por favor, intenta nuevamente.');
    }
};

export const uploadFile = async (bucketId, file) => {
    try {
        return await storage.createFile(
            bucketId,
            ID.unique(),
            file
        );
    } catch (error) {
        console.error('Error al subir archivo:', error);
        throw new Error('Error al subir el archivo. Por favor, intenta nuevamente.');
    }
};

export const getFile = async (bucketId, fileId) => {
    try {
        return await storage.getFile(
            bucketId,
            fileId
        );
    } catch (error) {
        console.error('Error al obtener archivo:', error);
        throw new Error('Error al obtener el archivo. Por favor, intenta nuevamente.');
    }
};

export const deleteFile = async (bucketId, fileId) => {
    try {
        return await storage.deleteFile(
            bucketId,
            fileId
        );
    } catch (error) {
        console.error('Error al eliminar archivo:', error);
        throw new Error('Error al eliminar el archivo. Por favor, intenta nuevamente.');
    }
};

// Funciones para interactuar con MongoDB
export const fetchMongoDBData = async (collection) => {
    try {
        const response = await fetch(`${MONGODB_API_URL}/${collection}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`Error en la respuesta: ${response.status} ${response.statusText}`, errorText);
            throw new Error(`Error al obtener datos de ${collection}: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(`Error al obtener datos de ${collection}:`, error);
        throw error;
    }
};

export const createMongoDBItem = async (collection, data) => {
    try {
        const response = await fetch(`${MONGODB_API_URL}/${collection.toLowerCase()}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Error al crear item en ${collection}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(`Error al crear item en ${collection}:`, error);
        throw error;
    }
};

export const updateMongoDBItem = async (collection, id, data) => {
    try {
        const response = await fetch(`${MONGODB_API_URL}/${collection.toLowerCase()}/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Error al actualizar item en ${collection}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(`Error al actualizar item en ${collection}:`, error);
        throw error;
    }
};

export const deleteMongoDBItem = async (collection, id) => {
    try {
        const response = await fetch(`${MONGODB_API_URL}/${collection.toLowerCase()}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Error al eliminar item en ${collection}`);
        }

        const result = await response.json();
        return result;
    } catch (error) {
        console.error(`Error al eliminar item en ${collection}:`, error);
        throw error;
    }
};

// Exportar las instancias de Appwrite
export { client, account, teams, databases, storage, ID }; 