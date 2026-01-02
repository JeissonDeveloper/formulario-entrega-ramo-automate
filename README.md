# 📱 Formulario de Entrega de Dispositivos Móviles - RAMO

Sistema web para la gestión y documentación de entregas de dispositivos móviles (Handheld) a colaboradores de la organización RAMO.

![Version](https://img.shields.io/badge/version-2.0-blue.svg)
![License](https://img.shields.io/badge/license-Private-red.svg)
![Status](https://img.shields.io/badge/status-Production-success.svg)

## 📋 Descripción

Aplicación web que automatiza el proceso de entrega de dispositivos móviles mediante un formulario digital con las siguientes características:

- ✅ Búsqueda automática de datos de colaboradores y analistas
- ✅ Registro detallado del estado de dispositivos y accesorios
- ✅ Firmas digitales mediante canvas HTML5
- ✅ Autoguardado de datos en localStorage
- ✅ Integración con Power Automate (Microsoft Azure)
- ✅ Diseño responsive para móviles y tablets
- ✅ Validaciones en tiempo real

## 🚀 Características Principales

### Gestión de Dispositivos
- Registro de dispositivos Handheld (Zebra, Cyrus, Ulefone)
- Control de accesorios: Terminal, Protector de pantalla, Estuche, Batería, Cargador, Cable USB, SIM Card
- Estados configurables: Bueno, Regular, Malo, N/A
- Campo de observaciones por accesorio

### Búsqueda Inteligente
- Búsqueda de colaboradores por número de cédula
- Autocompletado de datos (nombre, agencia, teléfono)
- Búsqueda de analistas con autocompletado completo de campos

### Firmas Digitales
- Firma del colaborador (obligatoria)
- Firma del analista (opcional)
- Soporte para táctil y mouse
- Función de borrado y reinicio

### Seguridad y Validaciones
- ✅ Validación de serial obligatorio (previene actas duplicadas en blanco)
- ✅ Protección contra envíos duplicados
- ✅ Validación de campos requeridos
- ✅ Validación de formato de correo electrónico
- ✅ Zona horaria ajustada a Colombia

## 🛠️ Tecnologías

- **Frontend:** HTML5, CSS3, JavaScript Vanilla
- **Backend:** Microsoft Power Automate (Azure Logic Apps)
- **Almacenamiento:** localStorage (persistencia local)
- **Canvas API:** Firmas digitales

## 📦 Estructura del Proyecto

```
formulario-entrega-ramo-automate/
│
├── index.html          # Estructura del formulario
├── estilos.css         # Estilos y diseño responsive
├── script.js           # Lógica de la aplicación
├── logo-ramo.png       # Logo corporativo
└── README.md           # Este archivo
```

## 🔧 Instalación y Uso

### Requisitos Previos
- Navegador web moderno (Chrome, Firefox, Edge, Safari)
- Conexión a internet (para envío de datos a Power Automate)

### Instalación

1. **Clonar el repositorio:**
```bash
git clone https://github.com/JeissonDeveloper/formulario-entrega-ramo-automate.git
cd formulario-entrega-ramo-automate
```

2. **Abrir el formulario:**
   - Abrir `index.html` directamente en el navegador
   - O servir mediante un servidor local:
   ```bash
   # Usando Python 3
   python -m http.server 8000
   
   # O usando Node.js (con http-server)
   npx http-server
   ```

3. **Acceder a la aplicación:**
   - Local: `file:///ruta/al/archivo/index.html`
   - Servidor local: `http://localhost:8000`

### Configuración de Serial Automático

Para pre-cargar el serial del dispositivo mediante URL:

```
index.html?serial=IMEI123456789
```

## 🔄 Actualización de URLs de Power Automate

**Importante:** Las URLs de Power Automate fueron actualizadas en Enero 2025. Si necesita actualizar las URLs:

1. Abrir `script.js`
2. Localizar las constantes `URL_BUSQUEDA` y `URL_ENVIO`
3. Reemplazar con las nuevas URLs desde Power Automate
4. Guardar y recargar

```javascript
const URL_BUSQUEDA = "https://[tu-nueva-url-de-busqueda]";
const URL_ENVIO = "https://[tu-nueva-url-de-envio]";
```

## 📝 Flujo de Trabajo

1. **Colaborador:** Ingreso de datos del colaborador (búsqueda automática por cédula)
2. **Dispositivo:** Registro del dispositivo y estado de accesorios
3. **Analista:** Ingreso de datos del analista (búsqueda automática)
4. **Firmas:** Captura de firmas digitales
5. **Envío:** Generación y envío del acta a Power Automate

## 🐛 Solución de Problemas

### El formulario no envía datos
- Verificar conexión a internet
- Verificar que las URLs de Power Automate estén actualizadas
- Revisar consola del navegador (F12) para errores

### La fecha es incorrecta
- El sistema ajusta automáticamente a zona horaria de Colombia (UTC-5)
- Si persiste el problema, verificar configuración de zona horaria del sistema

### Datos no se guardan automáticamente
- Verificar que localStorage esté habilitado en el navegador
- Limpiar caché si es necesario

## 📊 Validaciones Implementadas

| Campo | Validación | Tipo |
|-------|-----------|------|
| Serial | Obligatorio, no vacío | Bloqueante |
| Cédula Colaborador | Obligatorio, solo números | Bloqueante |
| Correo | Obligatorio, formato válido | Bloqueante |
| Firma Colaborador | Obligatoria | Bloqueante |
| Firma Analista | Opcional | No bloqueante |
| Marca/Modelo | Obligatorio | Bloqueante |

## 🔐 Seguridad

- No se almacenan datos sensibles en el frontend
- Las comunicaciones con Power Automate usan HTTPS
- Los datos locales se eliminan tras envío exitoso
- Protección contra envíos duplicados

## 📱 Compatibilidad

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Dispositivos móviles (iOS y Android)

## 🔄 Changelog

### Versión 2.0 (Enero 2025)
- ✅ Actualización de URLs de Power Automate
- ✅ Validación obligatoria de serial
- ✅ Protección contra envíos duplicados
- ✅ Autocompletado completo de datos del analista
- ✅ Firma del analista ahora es opcional
- ✅ Corrección de zona horaria (Colombia UTC-5)
- ✅ Mejoras en mensajes de error
- ✅ Código documentado y optimizado

### Versión 1.0
- Versión inicial del formulario

## 👥 Autor

**Jeisson Javier Silva Beltran**
- GitHub: [@JeissonDeveloper](https://github.com/JeissonDeveloper)
- Empresa: LineaDataScan

## 📄 Licencia

Este proyecto es privado y de uso exclusivo de la organización RAMO.

---

**Desarrollado con ❤️ para RAMO Colombia**
