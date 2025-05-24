<div align="center">
  <img src="/public/iconox.png" alt="FaceTime Tracker Logo" width="200" />
  <h1>FaceTime Tracker</h1>
  <p>Monitor de Tiempo de Exposición a la Cámara</p>
  <p><em>Creado por Carlos Freire - 23 de Mayo 2025</em></p>
</div>

## 🎯 ¿Qué es FaceTime Tracker?

FaceTime Tracker es una aplicación web que utiliza inteligencia artificial para detectar y registrar el tiempo que pasas frente a la cámara. Especialmente útil para medir la exposición a videollamadas, clases virtuales o cualquier actividad que requiera el uso de cámara web.

## ✨ Características Principales

- 👁️ Detección facial en tiempo real
- ⏱️ Registro preciso del tiempo de exposición
- 📊 Historial de sesiones
- 📱 Diseño responsivo (funciona en móviles y escritorio)
- 🌈 Interfaz intuitiva y moderna

## 🛠️ Tecnologías Utilizadas

### 🤖 TensorFlow.js
TensorFlow.js es una biblioteca de código abierto desarrollada por Google para entrenar y desplegar modelos de aprendizaje automático en el navegador. En este proyecto, utilizamos TensorFlow.js junto con el modelo Face Landmarks Detection para la detección facial precisa.

### ⚛️ Next.js 13+
Framework de React que permite la renderización del lado del servidor, generación de sitios estáticos y otras características avanzadas para aplicaciones web modernas.

### 📦 Otros Módulos Clave
- `@tensorflow/tfjs`: Biblioteca principal de TensorFlow.js
- `@tensorflow-models/face-landmarks-detection`: Modelo pre-entrenado para detección de puntos faciales
- `react-webcam`: Componente de React para acceder a la cámara web
- `tailwindcss`: Framework CSS para estilos rápidos y responsivos

## 🚀 Cómo Empezar

### Requisitos Previos
- Node.js 16.8 o superior
- NPM o Yarn
- Navegador web moderno con soporte para WebGL

### Instalación

1. Clona el repositorio:
   ```bash
   git clone [URL_DEL_REPOSITORIO]
   cd mi-app-deteccion-facial
   ```

2. Instala las dependencias:
   ```bash
   npm install
   # o
   yarn install
   ```

3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   # o
   yarn dev
   ```

4. Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📝 Uso

1. Concede los permisos de cámara cuando se te solicite.
2. La aplicación comenzará a detectar automáticamente tu rostro.
3. El contador registrará el tiempo que pasas frente a la cámara.
4. Revisa tu historial de sesiones en la sección correspondiente.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Siéntete libre de abrir un issue o enviar un pull request.

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

<p align="center">
  <em>Desarrollado con ❤️ por Carlos Freire</em>
</p>

