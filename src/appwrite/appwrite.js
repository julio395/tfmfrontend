import { Client, Account, ID } from 'appwrite';

// Configuración de Appwrite
const client = new Client();

// Configurar el endpoint y el proyecto de Appwrite
const APPWRITE_ENDPOINT = 'https://appwrite-tfm.julio.coolify.hgccarlos.es/v1';
const APPWRITE_PROJECT_ID = '683f418d003d466cfe2e';
const APPWRITE_API_KEY = 'standard_8e9bf336726029f16bb63bf8babb8c33cf0f7fdab1353d33f694baa7b1fce7176c0fbd30b0649bd745f137fef3691ebd6b75bbdf50924fe3b270836625681d1d464f7b02867df94a58ba34aee8058e76214eafb741f23ca1c157cefc72c9c4513da0edc6a36e6cf1d37b82e0410febf33f8038ced76c333c6c31523560f76f69';

// Configurar el cliente de Appwrite
client
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

// Crear instancias de los servicios de Appwrite
const account = new Account(client);

// Configuración de la API de MongoDB
const MONGODB_API_URL = 'http://localhost:5000/api/tfm';

// Función para obtener usuarios
export const getUsers = async () => {
    try {
        console.log('Intentando obtener usuarios de Appwrite...');
        
        // Obtenemos la sesión actual para verificar permisos
        const session = await account.getSession('current');
        console.log('Sesión actual:', session);

        // Obtenemos el usuario actual
        const currentUser = await account.get();
        console.log('Usuario actual:', currentUser);

        // Si el usuario actual es admin, intentamos obtener la lista de usuarios
        if (currentUser.labels?.includes('admin')) {
            try {
                // Intentamos obtener la lista de usuarios usando el endpoint de la API
                const response = await fetch(`${APPWRITE_ENDPOINT}/users`, {
                    method: 'GET',
                    headers: {
                        'X-Appwrite-Project': APPWRITE_PROJECT_ID,
                        'X-Appwrite-Key': APPWRITE_API_KEY,
                        'Content-Type': 'application/json'
                    }
                });

                if (!response.ok) {
                    throw new Error(`Error al obtener usuarios: ${response.statusText}`);
                }

                const data = await response.json();
                console.log('Respuesta de la API:', data);

                // Procesamos los usuarios
                const usersDetails = data.users.map(user => ({
                    ...user,
                    role: user.labels?.includes('admin') ? 'Admin' : 'Usuario',
                    name: user.name || 'Sin nombre',
                    status: user.status || 'Activo'
                }));

                console.log('Usuarios procesados:', usersDetails);
                return { users: usersDetails };
            } catch (error) {
                console.error('Error al obtener usuarios:', error);
                throw error;
            }
        } else {
            throw new Error('No tienes permisos para ver la lista de usuarios');
        }
    } catch (error) {
        console.error('Error en getUsers:', error);
        throw error;
    }
};

// Funciones para interactuar con MongoDB
export const fetchMongoDBData = async (collection) => {
    try {
        console.log(`Obteniendo datos de ${collection} desde MongoDB...`);
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
        console.log(`Datos obtenidos de ${collection}:`, data);
        return data;
    } catch (error) {
        console.error(`Error al obtener datos de ${collection}:`, error);
        throw error;
    }
};

export const createMongoDBItem = async (collection, data) => {
    try {
        console.log(`Creando item en ${collection}...`, data);
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
        console.log(`Item creado en ${collection}:`, result);
        return result;
    } catch (error) {
        console.error(`Error al crear item en ${collection}:`, error);
        throw error;
    }
};

export const updateMongoDBItem = async (collection, id, data) => {
    try {
        console.log(`Actualizando item ${id} en ${collection}...`, data);
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
        console.log(`Item actualizado en ${collection}:`, result);
        return result;
    } catch (error) {
        console.error(`Error al actualizar item en ${collection}:`, error);
        throw error;
    }
};

export const deleteMongoDBItem = async (collection, id) => {
    try {
        console.log(`Eliminando item ${id} de ${collection}...`);
        const response = await fetch(`${MONGODB_API_URL}/${collection.toLowerCase()}/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            throw new Error(`Error al eliminar item en ${collection}`);
        }

        const result = await response.json();
        console.log(`Item eliminado de ${collection}:`, result);
        return result;
    } catch (error) {
        console.error(`Error al eliminar item en ${collection}:`, error);
        throw error;
    }
};

// Exportar las instancias de Appwrite
export { client, account, ID }; 