import { Client, Account, Teams, Databases, Storage, ID, Users, Query } from 'appwrite';

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
    ? 'http://localhost:5000'
    : 'https://backendtfm.julio.coolify.hgccarlos.es';

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
        const response = await fetch(`${client.config.endpoint}/users`, {
            method: 'POST',
            headers: {
                'X-Appwrite-Project': client.config.project,
                'Content-Type': 'application/json',
                'X-Appwrite-Response-Format': '1.0.0',
                'X-Appwrite-Key': client.config.key
            },
            body: JSON.stringify({
                email,
                password,
                name
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al crear usuario');
        }

        return await response.json();
    } catch (error) {
        console.error('Error al crear usuario:', error);
        throw error;
    }
};

// Función para verificar la conexión con Appwrite
export const checkAppwriteConnection = async () => {
    try {
        console.log('Verificando conexión con Appwrite...');
        console.log('Endpoint:', client.config.endpoint);
        console.log('Project ID:', client.config.project);
        
        // Intentar obtener la sesión actual
        const session = await account.getSession('current');
        console.log('Sesión actual:', session);
        
        return true;
    } catch (error) {
        console.error('Error detallado en verificación:', error);
        return false;
    }
};

export const loginUser = async (email, password) => {
    try {
        console.log('Iniciando proceso de login...');
        
        // Primero intentamos crear la sesión
        const session = await account.createEmailSession(email, password);
        console.log('Sesión creada:', session);

        // Esperamos un momento para asegurar que la sesión esté establecida
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Ahora obtenemos los datos del usuario
        const userData = await account.get();
        console.log('Datos del usuario:', userData);

        // Verificar si el usuario tiene la etiqueta "admin"
        const isAdmin = userData.labels && userData.labels.includes('admin');
        
        return {
            ...userData,
            role: isAdmin ? 'admin' : 'user'
        };
    } catch (error) {
        console.error('Error detallado en login:', error);
        
        if (error.code === 401) {
            throw new Error('Credenciales inválidas. Por favor, verifica tu email y contraseña.');
        } else if (error.code === 403) {
            throw new Error('Acceso denegado. Por favor, verifica tus permisos.');
        } else if (error.code === 429) {
            throw new Error('Demasiados intentos. Por favor, espera un momento antes de intentar nuevamente.');
        } else if (error.type === 'network') {
            throw new Error('Error de conexión. Por favor, verifica tu conexión a internet.');
        } else {
            throw new Error('Error al iniciar sesión. Por favor, intenta nuevamente.');
        }
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
        console.log('Iniciando proceso de cierre de sesión...');
        
        // Primero intentamos eliminar la sesión actual
        try {
            const session = await account.getSession('current');
            if (session) {
                await account.deleteSession(session.$id);
                console.log('Sesión eliminada correctamente');
            }
        } catch (sessionError) {
            console.log('No se encontró sesión activa o ya fue eliminada');
        }

        // Limpiamos el estado local
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        
        // Forzamos la limpieza de la sesión de Appwrite
        await account.deleteSessions();
        console.log('Todas las sesiones eliminadas');
        
        return true;
    } catch (error) {
        console.error('Error detallado al cerrar sesión:', error);
        
        // Si hay un error, aún así limpiamos el estado local
        localStorage.removeItem('user');
        localStorage.removeItem('userRole');
        
        // Si el error es de permisos, lo manejamos específicamente
        if (error.code === 401 || error.code === 403) {
            console.log('Error de permisos al cerrar sesión, pero se limpió el estado local');
            return true;
        }
        
        throw error;
    }
};

export const getUsers = async () => {
    try {
        // Obtener el usuario actual
        const currentUser = await account.get();
        console.log('Usuario actual:', currentUser);

        // Verificar si el usuario tiene la etiqueta admin en Labels
        if (!currentUser.labels || !currentUser.labels.includes('admin')) {
            throw new Error('No tienes permisos para ver la lista de usuarios');
        }

        // Obtener la lista de usuarios usando el SDK de Appwrite
        const response = await fetch(`${client.config.endpoint}/users`, {
            method: 'GET',
            headers: {
                'X-Appwrite-Project': client.config.project,
                'Content-Type': 'application/json',
                'X-Appwrite-Response-Format': '1.0.0',
                'X-Appwrite-Key': process.env.REACT_APP_APPWRITE_API_KEY
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('Error detallado:', errorData);
            throw new Error(`Error HTTP: ${response.status}`);
        }

        const data = await response.json();
        console.log('Respuesta de getUsers:', data);

        if (!data || !data.users) {
            throw new Error('No se pudieron obtener los usuarios');
        }

        return data.users.map(user => ({
            $id: user.$id,
            email: user.email,
            name: user.name,
            labels: user.labels || [],
            status: user.status,
            createdAt: user.$createdAt,
            updatedAt: user.$updatedAt
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

// Función para actualizar un usuario
export const updateUser = async (userId, data) => {
    try {
        const response = await fetch(`${client.config.endpoint}/users/${userId}`, {
            method: 'PATCH',
            headers: {
                'X-Appwrite-Project': client.config.project,
                'Content-Type': 'application/json',
                'X-Appwrite-Response-Format': '1.0.0',
                'X-Appwrite-Key': client.config.key
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al actualizar usuario');
        }

        return await response.json();
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        throw error;
    }
};

// Función para eliminar un usuario
export const deleteUser = async (userId) => {
    try {
        const response = await fetch(`${client.config.endpoint}/users/${userId}`, {
            method: 'DELETE',
            headers: {
                'X-Appwrite-Project': client.config.project,
                'Content-Type': 'application/json',
                'X-Appwrite-Response-Format': '1.0.0',
                'X-Appwrite-Key': client.config.key
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar usuario');
        }

        return true;
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        throw error;
    }
};

// Exportar las instancias de Appwrite
export { client, account, teams, databases, storage, ID }; 