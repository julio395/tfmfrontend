import { Client, Account, Teams, Databases, Storage } from 'appwrite';

// Configuración de Appwrite
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('67c8c0c0c0c0c0c0c0c0c0c0');

// Crear instancias de los servicios de Appwrite
const account = new Account(client);
const teams = new Teams(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Configuración de la API de MongoDB
const isDevelopment = window.location.hostname === 'localhost';
export const MONGODB_API_URL = isDevelopment 
    ? 'http://localhost:5000/api/tfm'
    : 'https://projectfm.julio.coolify.hgccarlos.es/api/tfm';

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

export const loginUser = async (email, password) => {
    try {
        // Intentar crear la sesión
        const session = await account.createEmailSession(email, password);
        
        // Obtener información del usuario
        const user = await account.get();
        
        // Verificar si el usuario es admin
        const userTeams = await teams.list();
        const isAdmin = userTeams.teams.some(team => team.name === 'admin');
        
        if (!isAdmin) {
            throw new Error('No tienes permisos de administrador');
        }
        
        return { session, user };
    } catch (error) {
        console.error('Error en login:', error);
        throw error;
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
    } catch (error) {
        console.error('Error logging out:', error);
        throw error;
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
        throw error;
    }
};

export const createDocument = async (collectionId, data) => {
    try {
        return await databases.createDocument(
            '67c8c0c0c0c0c0c0c0c0c0c0',
            collectionId,
            'unique()',
            data
        );
    } catch (error) {
        console.error('Error al crear documento:', error);
        throw error;
    }
};

export const getDocuments = async (collectionId) => {
    try {
        return await databases.listDocuments(
            '67c8c0c0c0c0c0c0c0c0c0c0',
            collectionId
        );
    } catch (error) {
        console.error('Error al obtener documentos:', error);
        throw error;
    }
};

export const updateDocument = async (collectionId, documentId, data) => {
    try {
        return await databases.updateDocument(
            '67c8c0c0c0c0c0c0c0c0c0c0',
            collectionId,
            documentId,
            data
        );
    } catch (error) {
        console.error('Error al actualizar documento:', error);
        throw error;
    }
};

export const deleteDocument = async (collectionId, documentId) => {
    try {
        return await databases.deleteDocument(
            '67c8c0c0c0c0c0c0c0c0c0c0',
            collectionId,
            documentId
        );
    } catch (error) {
        console.error('Error al eliminar documento:', error);
        throw error;
    }
};

export const uploadFile = async (bucketId, file) => {
    try {
        return await storage.createFile(
            bucketId,
            'unique()',
            file
        );
    } catch (error) {
        console.error('Error al subir archivo:', error);
        throw error;
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
        throw error;
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
        throw error;
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
export { client, account, teams, databases, storage }; 