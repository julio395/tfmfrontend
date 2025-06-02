import firebase_admin
from firebase_admin import credentials, firestore
from app.config import Config

# Inicializar Firebase Admin
cred = credentials.Certificate(Config.FIREBASE_CREDENTIALS_PATH)
firebase_admin.initialize_app(cred)
db = firestore.client()

# Funciones de acceso a usuarios
def get_user_by_id(user_id):
    """Obtiene un usuario por su ID"""
    doc = db.collection('users').document(user_id).get()
    return doc.to_dict() if doc.exists else None

def get_all_users():
    """Obtiene todos los usuarios"""
    users = db.collection('users').stream()
    return [{'id': doc.id, **doc.to_dict()} for doc in users]

def create_user(user_data):
    """Crea un nuevo usuario"""
    doc_ref = db.collection('users').document()
    doc_ref.set(user_data)
    return {'id': doc_ref.id, **user_data}

def update_user(user_id, user_data):
    """Actualiza un usuario existente"""
    db.collection('users').document(user_id).update(user_data)
    return {'id': user_id, **user_data}

def delete_user(user_id):
    """Elimina un usuario"""
    db.collection('users').document(user_id).delete()
    return True

# Funciones de acceso a Activos
def get_all_activos():
    """Obtiene todos los activos"""
    activos = db.collection('Activos').stream()
    return [{'id': doc.id, **doc.to_dict()} for doc in activos]

def create_activo(activo_data):
    """Crea un nuevo activo"""
    doc_ref = db.collection('Activos').document()
    doc_ref.set(activo_data)
    return {'id': doc_ref.id, **activo_data}

def update_activo(activo_id, activo_data):
    """Actualiza un activo existente"""
    db.collection('Activos').document(activo_id).update(activo_data)
    return {'id': activo_id, **activo_data}

def delete_activo(activo_id):
    """Elimina un activo"""
    db.collection('Activos').document(activo_id).delete()
    return True

# Funciones de acceso a Amenazas
def get_all_amenazas():
    """Obtiene todas las amenazas"""
    amenazas = db.collection('Amenazas').stream()
    return [{'id': doc.id, **doc.to_dict()} for doc in amenazas]

def create_amenaza(amenaza_data):
    """Crea una nueva amenaza"""
    doc_ref = db.collection('Amenazas').document()
    doc_ref.set(amenaza_data)
    return {'id': doc_ref.id, **amenaza_data}

def update_amenaza(amenaza_id, amenaza_data):
    """Actualiza una amenaza existente"""
    db.collection('Amenazas').document(amenaza_id).update(amenaza_data)
    return {'id': amenaza_id, **amenaza_data}

def delete_amenaza(amenaza_id):
    """Elimina una amenaza"""
    db.collection('Amenazas').document(amenaza_id).delete()
    return True

# Funciones de acceso a Vulnerabilidades
def get_all_vulnerabilidades():
    """Obtiene todas las vulnerabilidades"""
    vulnerabilidades = db.collection('Vulnerabilidades').stream()
    return [{'id': doc.id, **doc.to_dict()} for doc in vulnerabilidades]

def create_vulnerabilidad(vulnerabilidad_data):
    """Crea una nueva vulnerabilidad"""
    doc_ref = db.collection('Vulnerabilidades').document()
    doc_ref.set(vulnerabilidad_data)
    return {'id': doc_ref.id, **vulnerabilidad_data}

def update_vulnerabilidad(vulnerabilidad_id, vulnerabilidad_data):
    """Actualiza una vulnerabilidad existente"""
    db.collection('Vulnerabilidades').document(vulnerabilidad_id).update(vulnerabilidad_data)
    return {'id': vulnerabilidad_id, **vulnerabilidad_data}

def delete_vulnerabilidad(vulnerabilidad_id):
    """Elimina una vulnerabilidad"""
    db.collection('Vulnerabilidades').document(vulnerabilidad_id).delete()
    return True

# Funciones de acceso a Salvaguardas
def get_all_salvaguardas():
    """Obtiene todas las salvaguardas"""
    salvaguardas = db.collection('Salvaguardas').stream()
    return [{'id': doc.id, **doc.to_dict()} for doc in salvaguardas]

def create_salvaguarda(salvaguarda_data):
    """Crea una nueva salvaguarda"""
    doc_ref = db.collection('Salvaguardas').document()
    doc_ref.set(salvaguarda_data)
    return {'id': doc_ref.id, **salvaguarda_data}

def update_salvaguarda(salvaguarda_id, salvaguarda_data):
    """Actualiza una salvaguarda existente"""
    db.collection('Salvaguardas').document(salvaguarda_id).update(salvaguarda_data)
    return {'id': salvaguarda_id, **salvaguarda_data}

def delete_salvaguarda(salvaguarda_id):
    """Elimina una salvaguarda"""
    db.collection('Salvaguardas').document(salvaguarda_id).delete()
    return True

# Funciones de acceso a Relaciones
def get_all_relaciones():
    """Obtiene todas las relaciones por activo"""
    relaciones = db.collection('Relaciones').stream()
    return [{'id': doc.id, **doc.to_dict()} for doc in relaciones]

def create_relacion(relacion_data):
    """Crea una nueva relación"""
    doc_ref = db.collection('Relaciones').document()
    doc_ref.set(relacion_data)
    return {'id': doc_ref.id, **relacion_data}

def update_relacion(relacion_id, relacion_data):
    """Actualiza una relación existente"""
    db.collection('Relaciones').document(relacion_id).update(relacion_data)
    return {'id': relacion_id, **relacion_data}

def delete_relacion(relacion_id):
    """Elimina una relación"""
    db.collection('Relaciones').document(relacion_id).delete()
    return True 