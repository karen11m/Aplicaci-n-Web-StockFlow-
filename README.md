# StockFlow - Sistema de Gestión de Inventario y Ventas

![StockFlow](https://img.shields.io/badge/StockFlow-v1.0.0-blue)
![React](https://img.shields.io/badge/React-18.2-blue)
![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![MongoDB](https://img.shields.io/badge/MongoDB-8.0-green)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-cyan)

## 📋 Descripción

**StockFlow** es un sistema moderno de gestión de inventario y ventas desarrollado con el stack MERN (MongoDB, Express, React, Node.js). Diseñado con una interfaz de usuario elegante utilizando Glassmorphism y Neumorphism, proporciona una experiencia visual profesional.

## 🚀 Características Principales

### Autenticación
- ✅ Login/Registro con JWT
- ✅ Roles: Administrador y Vendedor
- ✅ Validaciones completas

### Dashboard
- 📊 Cards con estadísticas en tiempo real
- 📈 Gráfico de ventas semanales
- 🔔 Alertas de stock bajo
- 📋 Últimas 10 ventas

### Inventario (CRUD)
- ➕ Crear, editar, eliminar productos
- 🔍 Búsqueda por nombre/código de barras
- 🏷️ Filtrado por categoría
- ⚠️ Alertas visuales para productos con stock bajo (< 10 unidades)

### Punto de Venta
- 🛒 Carrito de compras interactivo
- 📱 Búsqueda rápida de productos
- 👤 Datos del cliente
- 💳 Múltiples métodos de pago
- 📊 Actualización automática de stock

### Reportes
- 📄 Exportar ventas a PDF
- 📊 Exportar inventario a CSV
- 📈 Análisis por período
- 📉 Gráficos interactivos

### Funcionalidades en Tiempo Real
- 🔌 Socket.IO para actualizaciones en vivo
- 📢 Notificaciones push al realizar ventas

### Notificaciones
- 📧 Emails automáticos de stock bajo al administrador

## 🛠️ Tecnologías

### Backend
- **Node.js** - Runtime de JavaScript
- **Express** - Framework web
- **MongoDB** con Mongoose - Base de datos
- **JWT** - Autenticación
- **Socket.IO** - Tiempo real
- **Nodemailer** - Envío de emails
- **PDFKit** - Generación de PDFs

### Frontend
- **React 18** - Biblioteca de UI
- **Vite** - Build tool
- **Tailwind CSS** - Estilos
- **Recharts** - Gráficos
- **React Hot Toast** - Notificaciones
- **React Router** - Enrutamiento
- **Axios** - HTTP client

## 📦 Instalación

### Prerrequisitos
- Node.js 18+
- MongoDB 6+ (local o Atlas)
- npm o yarn

### Clonar el repositorio
```bash
git clone https://github.com/tu-usuario/stockflow.git
cd stockflow
```

### Configuración del Backend

1. Copiar archivo de entorno:
```bash
cp .env.example .env
```

2. Editar `.env` con tus configuraciones:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/stockflow
JWT_SECRET=tu_secret_jwt
JWT_EXPIRE=7d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_app_password
ADMIN_EMAIL=admin@email.com
FRONTEND_URL=http://localhost:5173
```

3. Instalar dependencias e iniciar:
```bash
npm install
npm run dev
```

### Configuración del Frontend

1. Navegar al directorio frontend:
```bash
cd frontend
```

2. Instalar dependencias:
```bash
npm install
```

3. Iniciar servidor de desarrollo:
```bash
npm run dev
```

4. Abrir浏览器 en `http://localhost:5173`

## 📱 Uso

### Credenciales de Prueba

| Rol | Email | Contraseña |
|-----|-------|------------|
| Administrador | admin@stockflow.com | admin123 |
| Vendedor | vendedor@stockflow.com | vendor123 |

### Primeros Pasos

1. **Registrar usuarios** desde la página de registro
2. **Agregar productos** al inventario desde la sección Inventario
3. **Realizar ventas** desde "Nueva Venta"
4. **Ver reportes** y exportar datos

## 📁 Estructura del Proyecto

```
stockflow/
├── config/
│   └── db.js              # Conexión a MongoDB
├── middleware/
│   └── auth.js            # Autenticación JWT
├── models/
│   ├── Product.js         # Modelo de Productos
│   ├── Sale.js           # Modelo de Ventas
│   └── User.js           # Modelo de Usuarios
├── routes/
│   ├── auth.js           # Rutas de autenticación
│   ├── products.js       # Rutas de productos
│   ├── sales.js          # Rutas de ventas
│   └── reports.js        # Rutas de reportes
├── utils/
│   └── email.js          # Utilidades de email
├── server.js             # Servidor principal
├── .env.example          # Ejemplo de variables de entorno
├── package.json
└── frontend/
    ├── src/
    │   ├── components/   # Componentes React
    │   ├── context/      # Contextos (Auth, Socket)
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── package.json
    └── vite.config.js
```

## 🔧 Scripts Disponibles

### Backend
```bash
npm run dev    # Iniciar servidor en desarrollo
npm start      # Iniciar servidor en producción
```

### Frontend
```bash
npm run dev    # Iniciar servidor de desarrollo
npm run build  # Construir para producción
npm run preview # Previsualizar build
```

## 🎨 UI/UX Features

- 🌙 **Dark Mode** - Alternar entre modo claro y oscuro
- 🎭 **Glassmorphism** - Efectos de vidrio translúcido
- ✨ **Neumorphism** - Botones con efecto 3D suave
- 📱 **Responsive** - Diseño adaptativo
- ⏳ **Loading States** - Spinners y estados de carga
- 🔔 **Toasts** - Notificaciones elegantes

## 🔒 Seguridad

- Rate limiting configurado
- CORS configurado
- Contraseñas encriptadas con bcrypt
- Tokens JWT con expiración
- Validaciones tanto en frontend como backend

## 📞 Soporte

¿Tienes problemas? Crea un issue en GitHub.

## 📄 Licencia

MIT License - lihat archivo LICENSE para más detalles.

---

⌨️ Desarrollado con ❤️ para tu portafolio
