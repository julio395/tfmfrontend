from flask import Blueprint, request, jsonify
from app.middleware.auth import require_auth
from app.services.db_access import (
    get_all_users, update_user, delete_user,
    get_all_activos, create_activo, update_activo, delete_activo,
    get_all_amenazas, create_amenaza, update_amenaza, delete_amenaza,
    get_all_vulnerabilidades, create_vulnerabilidad, update_vulnerabilidad, delete_vulnerabilidad,
    get_all_salvaguardas, create_salvaguarda, update_salvaguarda, delete_salvaguarda,
    get_all_relaciones, create_relacion, update_relacion, delete_relacion
)

admin_bp = Blueprint('admin', __name__)

# Rutas de usuarios
@admin_bp.route('/users', methods=['GET'])
@require_auth
def get_users():
    if request.user.get('role') != 'admin':
        return jsonify({'error': 'No autorizado'}), 403
    return jsonify(get_all_users())

@admin_bp.route('/users/<user_id>', methods=['PUT'])
@require_auth
def update_user_route(user_id):
    if request.user.get('role') != 'admin':
        return jsonify({'error': 'No autorizado'}), 403
    data = request.get_json()
    return jsonify(update_user(user_id, data))

@admin_bp.route('/users/<user_id>', methods=['DELETE'])
@require_auth
def delete_user_route(user_id):
    if request.user.get('role') != 'admin':
        return jsonify({'error': 'No autorizado'}), 403
    delete_user(user_id)
    return jsonify({'message': 'Usuario eliminado'})

# Rutas de Activos
@admin_bp.route('/activos', methods=['GET'])
@require_auth
def get_activos():
    return jsonify(get_all_activos())

@admin_bp.route('/activos', methods=['POST'])
@require_auth
def create_activo_route():
    data = request.get_json()
    return jsonify(create_activo(data)), 201

@admin_bp.route('/activos/<activo_id>', methods=['PUT'])
@require_auth
def update_activo_route(activo_id):
    data = request.get_json()
    return jsonify(update_activo(activo_id, data))

@admin_bp.route('/activos/<activo_id>', methods=['DELETE'])
@require_auth
def delete_activo_route(activo_id):
    delete_activo(activo_id)
    return jsonify({'message': 'Activo eliminado'})

# Rutas de Amenazas
@admin_bp.route('/amenazas', methods=['GET'])
@require_auth
def get_amenazas():
    return jsonify(get_all_amenazas())

@admin_bp.route('/amenazas', methods=['POST'])
@require_auth
def create_amenaza_route():
    data = request.get_json()
    return jsonify(create_amenaza(data)), 201

@admin_bp.route('/amenazas/<amenaza_id>', methods=['PUT'])
@require_auth
def update_amenaza_route(amenaza_id):
    data = request.get_json()
    return jsonify(update_amenaza(amenaza_id, data))

@admin_bp.route('/amenazas/<amenaza_id>', methods=['DELETE'])
@require_auth
def delete_amenaza_route(amenaza_id):
    delete_amenaza(amenaza_id)
    return jsonify({'message': 'Amenaza eliminada'})

# Rutas de Vulnerabilidades
@admin_bp.route('/vulnerabilidades', methods=['GET'])
@require_auth
def get_vulnerabilidades():
    return jsonify(get_all_vulnerabilidades())

@admin_bp.route('/vulnerabilidades', methods=['POST'])
@require_auth
def create_vulnerabilidad_route():
    data = request.get_json()
    return jsonify(create_vulnerabilidad(data)), 201

@admin_bp.route('/vulnerabilidades/<vulnerabilidad_id>', methods=['PUT'])
@require_auth
def update_vulnerabilidad_route(vulnerabilidad_id):
    data = request.get_json()
    return jsonify(update_vulnerabilidad(vulnerabilidad_id, data))

@admin_bp.route('/vulnerabilidades/<vulnerabilidad_id>', methods=['DELETE'])
@require_auth
def delete_vulnerabilidad_route(vulnerabilidad_id):
    delete_vulnerabilidad(vulnerabilidad_id)
    return jsonify({'message': 'Vulnerabilidad eliminada'})

# Rutas de Salvaguardas
@admin_bp.route('/salvaguardas', methods=['GET'])
@require_auth
def get_salvaguardas():
    return jsonify(get_all_salvaguardas())

@admin_bp.route('/salvaguardas', methods=['POST'])
@require_auth
def create_salvaguarda_route():
    data = request.get_json()
    return jsonify(create_salvaguarda(data)), 201

@admin_bp.route('/salvaguardas/<salvaguarda_id>', methods=['PUT'])
@require_auth
def update_salvaguarda_route(salvaguarda_id):
    data = request.get_json()
    return jsonify(update_salvaguarda(salvaguarda_id, data))

@admin_bp.route('/salvaguardas/<salvaguarda_id>', methods=['DELETE'])
@require_auth
def delete_salvaguarda_route(salvaguarda_id):
    delete_salvaguarda(salvaguarda_id)
    return jsonify({'message': 'Salvaguarda eliminada'})

# Rutas de Relaciones
@admin_bp.route('/relaciones', methods=['GET'])
@require_auth
def get_relaciones():
    return jsonify(get_all_relaciones())

@admin_bp.route('/relaciones', methods=['POST'])
@require_auth
def create_relacion_route():
    data = request.get_json()
    return jsonify(create_relacion(data)), 201

@admin_bp.route('/relaciones/<relacion_id>', methods=['PUT'])
@require_auth
def update_relacion_route(relacion_id):
    data = request.get_json()
    return jsonify(update_relacion(relacion_id, data))

@admin_bp.route('/relaciones/<relacion_id>', methods=['DELETE'])
@require_auth
def delete_relacion_route(relacion_id):
    delete_relacion(relacion_id)
    return jsonify({'message': 'Relación eliminada'}) 