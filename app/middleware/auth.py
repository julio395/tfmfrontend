from functools import wraps
from flask import request, jsonify, current_app
from jose import jwt, JWTError
from app.services.db_access import get_user_by_id

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        
        if not auth_header:
            return jsonify({'error': 'No se proporcionó token de autorización'}), 401
        
        try:
            # Extraer el token del header
            token = auth_header.split(' ')[1]
            
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
            
            # Verificar permisos de acceso al recurso
            requested_user_id = kwargs.get('user_id') or request.json.get('user_id')
            if requested_user_id and requested_user_id != user_id:
                return jsonify({'error': 'No tiene permisos para acceder a este recurso'}), 403
            
            # Añadir el usuario a la request para uso posterior
            request.user = user
            
            return f(*args, **kwargs)
            
        except JWTError as e:
            return jsonify({'error': f'Token inválido: {str(e)}'}), 401
        except Exception as e:
            return jsonify({'error': f'Error de autenticación: {str(e)}'}), 401
            
    return decorated 