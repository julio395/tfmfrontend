# TFM - Aplicación de Gestión de Seguridad

## Configuración del Entorno

### Variables de Entorno

1. Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```bash
cp .env.example .env
```

2. Configura las siguientes variables en tu archivo `.env`:

```env
REACT_APP_APPWRITE_ENDPOINT=your_appwrite_endpoint
REACT_APP_APPWRITE_PROJECT_ID=your_project_id
MONGODB_URI=your_mongodb_uri
MONGODB_DB_NAME=your_database_name
```

### Seguridad

- **NO** compartas tu archivo `.env` con otros desarrolladores
- **NO** subas el archivo `.env` al control de versiones
- Mantén tus claves y secretos seguros
- Usa diferentes valores para desarrollo y producción
- Asegúrate de que la base de datos MongoDB esté protegida con autenticación

### Desarrollo Local

1. Instala las dependencias:
```bash
npm install
```

2. Asegúrate de tener MongoDB instalado y ejecutándose localmente:
```bash
# En Windows
net start MongoDB

# En Linux/Mac
sudo service mongod start
```

3. Inicia el servidor de desarrollo:
```bash
npm start
```

### Despliegue

El proyecto está configurado para desplegarse en Coolify. Las variables de entorno y la base de datos MongoDB se configuran automáticamente desde el panel de control de Coolify.

#### Configuración de MongoDB en Coolify

1. En el panel de control de Coolify, ve a la sección de bases de datos
2. Selecciona MongoDB
3. Configura las credenciales y el nombre de la base de datos
4. Copia la URI de conexión y configúrala en las variables de entorno

## Estructura del Proyecto

```
src/
  ├── appwrite/        # Configuración de Appwrite (autenticación)
  ├── components/      # Componentes React
  ├── services/        # Servicios (autenticación, etc.)
  ├── models/          # Modelos de MongoDB
  ├── database/        # Configuración de MongoDB
  └── styles/          # Estilos CSS
```

## Tecnologías Utilizadas

- React
- Appwrite (Autenticación)
- MongoDB (Base de datos)
- Coolify (Plataforma de despliegue)

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
