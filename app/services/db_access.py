from pymongo import MongoClient
from app.config import Config

# Inicializar MongoDB
client = MongoClient(Config.MONGODB_URI)
db = client[Config.MONGODB_DB_NAME]

def get_collection(collection_name):
    return db[collection_name]

def get_all_items(collection_name):
    collection = get_collection(collection_name)
    return list(collection.find({}, {'_id': 0}))

def get_item_by_id(collection_name, item_id):
    collection = get_collection(collection_name)
    return collection.find_one({'id': item_id}, {'_id': 0})

def create_item(collection_name, item_data):
    collection = get_collection(collection_name)
    result = collection.insert_one(item_data)
    return result.inserted_id

def update_item(collection_name, item_id, item_data):
    collection = get_collection(collection_name)
    result = collection.update_one(
        {'id': item_id},
        {'$set': item_data}
    )
    return result.modified_count > 0

def delete_item(collection_name, item_id):
    collection = get_collection(collection_name)
    result = collection.delete_one({'id': item_id})
    return result.deleted_count > 0

# Funciones de acceso a usuarios
def get_user_by_id(user_id):
    """Obtiene un usuario por su ID"""
    return get_item_by_id('users', user_id)

def get_all_users():
    """Obtiene todos los usuarios"""
    return get_all_items('users')

def create_user(user_data):
    """Crea un nuevo usuario"""
    return create_item('users', user_data)

def update_user(user_id, user_data):
    """Actualiza un usuario existente"""
    return update_item('users', user_id, user_data)

def delete_user(user_id):
    """Elimina un usuario"""
    return delete_item('users', user_id)

# Funciones de acceso a Activos
def get_all_activos():
    """Obtiene todos los activos"""
    return get_all_items('Activos')

def create_activo(activo_data):
    """Crea un nuevo activo"""
    return create_item('Activos', activo_data)

def update_activo(activo_id, activo_data):
    """Actualiza un activo existente"""
    return update_item('Activos', activo_id, activo_data)

def delete_activo(activo_id):
    """Elimina un activo"""
    return delete_item('Activos', activo_id)

# Funciones de acceso a Amenazas
def get_all_amenazas():
    """Obtiene todas las amenazas"""
    return get_all_items('Amenazas')

def create_amenaza(amenaza_data):
    """Crea una nueva amenaza"""
    return create_item('Amenazas', amenaza_data)

def update_amenaza(amenaza_id, amenaza_data):
    """Actualiza una amenaza existente"""
    return update_item('Amenazas', amenaza_id, amenaza_data)

def delete_amenaza(amenaza_id):
    """Elimina una amenaza"""
    return delete_item('Amenazas', amenaza_id)

# Funciones de acceso a Vulnerabilidades
def get_all_vulnerabilidades():
    """Obtiene todas las vulnerabilidades"""
    return get_all_items('Vulnerabilidades')

def create_vulnerabilidad(vulnerabilidad_data):
    """Crea una nueva vulnerabilidad"""
    return create_item('Vulnerabilidades', vulnerabilidad_data)

def update_vulnerabilidad(vulnerabilidad_id, vulnerabilidad_data):
    """Actualiza una vulnerabilidad existente"""
    return update_item('Vulnerabilidades', vulnerabilidad_id, vulnerabilidad_data)

def delete_vulnerabilidad(vulnerabilidad_id):
    """Elimina una vulnerabilidad"""
    return delete_item('Vulnerabilidades', vulnerabilidad_id)

# Funciones de acceso a Salvaguardas
def get_all_salvaguardas():
    """Obtiene todas las salvaguardas"""
    return get_all_items('Salvaguardas')

def create_salvaguarda(salvaguarda_data):
    """Crea una nueva salvaguarda"""
    return create_item('Salvaguardas', salvaguarda_data)

def update_salvaguarda(salvaguarda_id, salvaguarda_data):
    """Actualiza una salvaguarda existente"""
    return update_item('Salvaguardas', salvaguarda_id, salvaguarda_data)

def delete_salvaguarda(salvaguarda_id):
    """Elimina una salvaguarda"""
    return delete_item('Salvaguardas', salvaguarda_id)

# Funciones de acceso a Relaciones
def get_all_relaciones():
    """Obtiene todas las relaciones por activo"""
    return get_all_items('Relaciones')

def create_relacion(relacion_data):
    """Crea una nueva relación"""
    return create_item('Relaciones', relacion_data)

def update_relacion(relacion_id, relacion_data):
    """Actualiza una relación existente"""
    return update_item('Relaciones', relacion_id, relacion_data)

def delete_relacion(relacion_id):
    """Elimina una relación"""
    return delete_item('Relaciones', relacion_id) 