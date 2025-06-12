import { Client, Account, ID, Databases, Storage, Teams } from 'appwrite';

// Configuración de Appwrite
const client = new Client()
    .setEndpoint('https://cloud.appwrite.io/v1')
    .setProject('664a1c2c0030c2a0c4c9');

// Crear instancias de los servicios de Appwrite
const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);
const teams = new Teams(client);

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
        const session = await account.createEmailSession(email, password);
        return session;
    } catch (error) {
        console.error('Error logging in:', error);
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
            role: team.roles[0] || 'user',
            status: team.status
        }));
    } catch (error) {
        console.error('Error getting users:', error);
        throw error;
    }
};

export const createDocument = async (collectionId, data) => {
    try {
        const response = await databases.createDocument(
            '664a1c2c0030c2a0c4c9',
            collectionId,
            ID.unique(),
            data
        );
        return response;
    } catch (error) {
        console.error('Error creating document:', error);
        throw error;
    }
};

export const getDocuments = async (collectionId) => {
    try {
        const response = await databases.listDocuments(
            '664a1c2c0030c2a0c4c9',
            collectionId
        );
        return response.documents;
    } catch (error) {
        console.error('Error getting documents:', error);
        throw error;
    }
};

export const updateDocument = async (collectionId, documentId, data) => {
    try {
        const response = await databases.updateDocument(
            '664a1c2c0030c2a0c4c9',
            collectionId,
            documentId,
            data
        );
        return response;
    } catch (error) {
        console.error('Error updating document:', error);
        throw error;
    }
};

export const deleteDocument = async (collectionId, documentId) => {
    try {
        await databases.deleteDocument(
            '664a1c2c0030c2a0c4c9',
            collectionId,
            documentId
        );
    } catch (error) {
        console.error('Error deleting document:', error);
        throw error;
    }
};

export const uploadFile = async (file) => {
    try {
        const response = await storage.createFile(
            '664a1c2c0030c2a0c4c9',
            ID.unique(),
            file
        );
        return response;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
};

export const getFile = async (fileId) => {
    try {
        const response = await storage.getFile(
            '664a1c2c0030c2a0c4c9',
            fileId
        );
        return response;
    } catch (error) {
        console.error('Error getting file:', error);
        throw error;
    }
};

export const deleteFile = async (fileId) => {
    try {
        await storage.deleteFile(
            '664a1c2c0030c2a0c4c9',
            fileId
        );
    } catch (error) {
        console.error('Error deleting file:', error);
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
export { client, account, ID }; 