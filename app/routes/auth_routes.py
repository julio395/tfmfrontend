from flask import Blueprint, request, jsonify, current_app
from jose import jwt
from datetime import datetime, timedelta
from app.services.db_access import get_user_by_id, create_user
from app.middleware.auth import require_auth

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')  # En producción, usar hash de contraseña
    
    # Aquí deberías implementar la lógica de autenticación real
    # Este es un ejemplo simplificado
    user = get_user_by_id(email)  # Asumiendo que el email es el ID
    
    if not user:
        return jsonify({'error': 'Usuario no encontrado'}), 401
    
    # Generar token JWT
    token = jwt.encode(
        {
            'user_id': user['id'],
            'email': user['email'],
            'role': user.get('role', 'user'),
            'exp': datetime.utcnow() + timedelta(seconds=current_app.config['JWT_ACCESS_TOKEN_EXPIRES'])
        },
        current_app.config['JWT_SECRET_KEY'],
        algorithm=current_app.config['JWT_ALGORITHM']
    )
    
    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'email': user['email'],
            'role': user.get('role', 'user')
        }
    })

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validar datos requeridos
    required_fields = ['email', 'password', 'companyName']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Campo requerido: {field}'}), 400
    
    # Verificar si el usuario ya existe
    if get_user_by_id(data['email']):
        return jsonify({'error': 'El usuario ya existe'}), 400
    
    # Crear nuevo usuario
    user_data = {
        'email': data['email'],
        'companyName': data['companyName'],
        'role': 'user',  # Rol por defecto
        'created_at': datetime.utcnow().isoformat()
    }
    
    user = create_user(user_data)
    
    return jsonify({
        'message': 'Usuario creado exitosamente',
        'user': user
    }), 201

@auth_bp.route('/me', methods=['GET'])
@require_auth
def get_current_user():
    return jsonify({
        'id': request.user['id'],
        'email': request.user['email'],
        'role': request.user.get('role', 'user')
    })

@auth_bp.route('/validate', methods=['POST'])
def validate_token():
    try:
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Token no proporcionado'}), 401

        token = auth_header.split('Bearer ')[1]
        
        try:
            # Verificar y decodificar el token
            payload = jwt.decode(
                token,
                current_app.config['JWT_SECRET_KEY'],
                algorithms=[current_app.config['JWT_ALGORITHM']]
            )
            
            # Obtener el user_id del token
            user_id = payload.get('user_id')
            if not user_id:
                return jsonify({'error': 'Token inválido: no contiene user_id'}), 401
            
            # Verificar que el usuario existe
            user = get_user_by_id(user_id)
            if not user:
                return jsonify({'error': 'Usuario no encontrado'}), 401
            
            return jsonify({ 
                'valid': True, 
                'user': {
                    'id': user['id'],
                    'email': user['email'],
                    'role': user.get('role', 'user')
                }
            })
        except jwt.JWTError as e:
            return jsonify({'error': f'Token inválido: {str(e)}'}), 401
            
    except Exception as e:
        return jsonify({'error': f'Error en la validación: {str(e)}'}), 500 