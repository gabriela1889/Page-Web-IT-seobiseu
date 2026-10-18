# IT seobiseu - Sistema de Gestion de Servicios de TI y Mesa de Ayuda


Integrantes del equipo:
- Gabriela
- Andres
- Carlos

Despliegue en produccion (GitHub Pages):
https://gabriela1889.github.io/IT-seobiseu/

Repositorio oficial:
https://github.com/gabriela1889/Page-Web-IT-seobiseu

---

## 1. Introduccion y Descripcion General

IT seobiseu es una plataforma web desarrollada como proyecto, orientada a la gestion integral de servicios de soporte tecnico, administracion de infraestructura de centros de datos y aseguramiento de Acuerdos de Nivel de Servicio (SLA) para organizaciones corporativas en Colombia.

El sistema permite coordinar de forma centralizada la recepcion de incidentes, el despacho de tecnicos de campo, el control de existencias de repuestos criticos en almacenes y la trazabilidad de contratos de soporte para infraestructuras empresariales.

---

## 2. Objetivos del Proyecto

1. Desarrollar una interfaz de usuario reactiva, moderna y accesible sin dependencias pesadas de frameworks externos, utilizando Vanilla JavaScript bajo el estandar ES Modules y Tailwind CSS.
2. Implementar un modelo de persistencia local resiliente (LocalStorage) desacoplado mediante el Patron Repository, garantizando la operatividad al 100% en servidores de alojamiento estatico como GitHub Pages.
3. Integrar un esquema formal de Control de Acceso Basado en Roles (RBAC), asegurando que cada perfil de usuario acceda unicamente a las vistas y funcionalidades autorizadas.
4. Diseñar la arquitectura backend mediante FastAPI (Python) y base de datos relacional PostgreSQL provista por Supabase Cloud, permitiendo la sincronizacion hibrida entre entornos locales y en la nube.
5. Contextualizar la solucion a las exigencias operativas y regulatorias del mercado colombiano (moneda COP, NIT empresarial, sedes de centros de datos en Bogota, Tocancipa y Medellin).

---

## 3. Arquitectura del Software

La solucion se estructura en tres capas principales:

```text
Capa de Presentacion (Frontend Web):
- HTML5 semantico
- Tailwind CSS (CDN y estilos de alta especificidad en custom.css)
- JavaScript modular (ESM) organizado por controladores y servicios

Capa de Estado y Almacenamiento Local (Data Store):
- Modulo store.js: Implementacion del patron Repository con persistencia en localStorage
- Modulo api.js: Cliente HTTP con soporte hibrido (FastAPI REST y cuentas demo locales)
- Modulo login.js: Gestion del ciclo de autenticacion y verificacion de credenciales
- Modulo app.js: Motor central de interfaz, despacho de modales y filtros reactivos

Capa de Servicios y Persistencia en la Nube (Backend y Base de Datos):
- Backend: FastAPI con routers modulares, validacion Pydantic y tokens Bearer JWT
- Base de Datos: PostgreSQL 17 en Supabase Cloud con politicas de seguridad RLS
```

---

## 4. Estructura del Repositorio

```text
IT-seobiseu/
|-- frontend/                 Codigo fuente del cliente web
|   |-- css/                  Hojas de estilo secundarias
|   |-- js/                   Logica modular de la aplicacion
|   |   |-- api.js            Cliente de integracion REST y cuentas demo
|   |   |-- app.js            Controlador general, navegacion y modales
|   |   |-- login.js          Controlador del formulario de autenticacion
|   |   |-- store.js          Repositorio de datos reactivo en localStorage
|   |-- styles/
|   |   |-- custom.css        Reglas de diseño, resets y visualizacion de modales
|   |-- clientes.html         Directorio corporativo de clientes y contratos SLA
|   |-- config.js             Configuracion de variables globales de entorno
|   |-- index.html            Dashboard principal y resumen de telemetria
|   |-- inventario.html       Control de inventario de repuestos y racks
|   |-- login.html            Portal de acceso seguro con seleccion rapida de rol
|   |-- ordenes.html          Administracion de ordenes de trabajo de campo
|   |-- tickets.html          Mesa de ayuda y radicacion de requerimientos
|-- backend/                  Servicio API REST en Python FastAPI
|   |-- routers/              Controladores de rutas para cada recurso
|   |-- schemas/              Esquemas de validacion con Pydantic
|   |-- main.py               Punto de entrada de la aplicacion FastAPI
|   |-- requirements.txt      Dependencias del entorno Python
|-- database/                 Scripts de definicion de esquema SQL
|-- supabase/                 Configuracion y migraciones de Supabase CLI
|-- tests/                    Conjunto de pruebas automatizadas con pytest
|-- README.md                 Documentacion tecnica del proyecto
|-- .gitignore                Exclusiones de versionamiento
```

---

## 5. Modulos Funcionales del Sistema

### 5.1. Dashboard Operativo (index.html)
- Visualizacion consolidada de indicadores clave de rendimiento (KPIs): ordenes activas, cumplimiento de SLA (99.98%), tiempo medio de recuperacion (MTTR) y disponibilidad de enlaces.
- Tabla reactiva de ordenes de trabajo prioritarias con clasificacion visual por severidad (P1 Critica, P2 Alta, P3 Media).
- Boton de creacion rapida (+ Crear Orden Express) con formulario modal de asignacion inmediata.
- Panel lateral deslizable (Tech Detail Drawer) para auditar la bitacora tecnica del incidente y firmar el acta de entrega digital certificando el cumplimiento del SLA.

### 5.2. Gestion de Ordenes de Trabajo (ordenes.html)
- Registro detallado de ordenes de trabajo con numero de radicado unico (#OT-...).
- Edicion de incidentes: reasignacion de tecnicos especialistas de centros de datos, ajuste de prioridad temporal y actualizacion de diagnostico.
- Filtro en tiempo real por busqueda textual (ID, cliente, tecnico, serial) y por estado (Todos, En Atencion, Pendiente, Completado).
- Eliminacion controlada de registros con confirmacion explicita del usuario.

### 5.3. Inventario de Repuestos Criticos (inventario.html)
- Administracion de componentes de hardware para servidores y enlaces (discos SAS/NVMe, fuentes redundantes PSU, memorias RAM ECC, modulos transceptores SFP+).
- Control de umbral critico: alerta visual cuando las existencias son iguales o inferiores a 2 unidades.
- Modal de ajuste rapido de stock (+ / - unidades) para consumos por orden de trabajo o recepciones de proveedor.
- Modal de edicion de especificaciones tecnicas, categoria, precio unitario en COP y ubicacion en rack.

### 5.4. Mesa de Ayuda y Tickets (tickets.html)
- Radicacion de requerimientos tecnicos con campos de contacto corporativo colombiano (+57).
- Clasificacion automatica por tipo de incidente: Hardware, Redes y Conectividad, Reemplazo de Partes o Mantenimiento Preventivo.
- Tabla de tickets activos con cambio reactivo de estado (Abierto, En Proceso, Resuelto) y notas de bitacora.

### 5.5. Directorio Corporativo de Clientes y Sedes (clientes.html)
- Registro de cuentas corporativas con identificacion tributaria (NIT colombiano).
- Control de sedes fisicas y servidores instalados por cliente.
- Detalle de contrato de soporte y niveles de servicio garantizados (Platinum Tier 4, Gold 24/7, Silver Business Hours).
- Modal para editar informacion de contacto y ficha de expediente SLA.

---

## 6. Control de Acceso Basado en Roles (RBAC)

El sistema restringe la navegacion y la visualizacion de modulos segun el rol del usuario autenticado:

| Perfil | Rol en Sistema | Modulos Permitidos | Alcance Operativo |
| :--- | :--- | :--- | :--- |
| Administrador General | ADMINISTRADOR | Todos (Dashboard, Ordenes, Inventario, Tickets, Clientes) | Control absoluto, creacion, edicion y baja de registros |
| Supervisor NOC | SUPERVISOR | Dashboard, Ordenes, Inventario, Tickets, Clientes | Auditoria operativa, monitoreo de SLA y reasignacion |
| Tecnico Especialista | TECNICO | Dashboard, Ordenes, Inventario, Tickets | Atencion de incidentes en sitio, diagnostico y consumo de partes |
| Cliente Corporativo | CLIENTE | Dashboard, Ordenes, Tickets | Radicacion de requerimientos y seguimiento del estado de sus servicios |

### Credenciales de Demostracion

Para pruebas inmediatas, se han configurado cuentas demo preestablecidas que pueden seleccionarse con un clic en la pantalla de inicio de sesion:

| Rol | Correo Electronico | Contrasena | Nombre del Usuario |
| :--- | :--- | :--- | :--- |
| Administrador | admin@it-seobiseu.local | Admin123! | Carlos Mendoza |
| Supervisor | supervisor@it-seobiseu.local | Supervisor123! | Ing. Sofia Reyes |
| Tecnico | tecnico@it-seobiseu.local | Tecnico123! | Tec. Marco Silva |
| Cliente VIP | cliente@it-seobiseu.local | Cliente123! | Dra. Elena Vasquez |

---

## 7. Persistencia y Base de Datos

### 7.1. Entorno en Produccion (GitHub Pages)
Opera mediante el modulo `store.js`, el cual mantiene una copia reactiva sincronizada en el `localStorage` del navegador. Cualquier operacion de agregar, editar, eliminar o filtrar se refleja instantaneamente en el DOM y persiste entre recargas de pagina.

### 7.2. Entorno Supabase Cloud (PostgreSQL)
Para el despliegue con backend activo, el proyecto cuenta con base de datos alojada en Supabase:
- Proyecto: IT_Seobiseu
- Identificador de referencia: shtpanowiryhadccuhty
- Motor: PostgreSQL 17 con politicas Row Level Security (RLS) habilitadas en todas las tablas maestras.

---

## 8. Instrucciones de Ejecucion

### 8.1. Ejecucion del Frontend en Modo Local

No requiere instaladores complejos. Desde la raiz del proyecto se puede levantar un servidor web estatico con Python:

```powershell
python -m http.server 5500 --directory frontend
```

Abra el navegador en la siguiente direccion:
http://localhost:5500

### 8.2. Ejecucion del Backend con FastAPI (Opcional para modo cliente-servidor)

Requisitos: Python 3.10 o superior.

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Documentacion interactiva de endpoints:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 8.3. Ejecucion de Pruebas Unitarias

```powershell
python -m pytest tests/test_api.py -v
```

---

## 9. Decisiones de Diseno y Buenas Practicas

- Cero dependencias invasivas en el frontend: Se utilizo JavaScript nativo moderno para garantizar compatibilidad, velocidad de carga y facilidad de depuracion.
- Ciclo de vida del DOM protegido: Los scripts detectan si el documento ya se encuentra en estado interactivo o completo (`document.readyState`), evitando bloqueos de ejecucion propios de modulos cargados con deferimiento.
- Tolerancia a fallos: La capa de comunicacion (`api.js`) cuenta con un mecanismo de conmutacion por error (fallback); si el servidor FastAPI no responde, se activan de forma transparente las credenciales y datos locales para no interrumpir la experiencia de usuario.
- Interfaz adaptativa: Diseno completamente responsivo apto para dispositivos moviles, tabletas y pantallas de escritorio de alta resolucion, con paleta de colores de alto contraste inspirada en centros de control de operaciones de red (NOC).

---

Proyecto desarrollado y sustentado por Gabriela, Andres y Carlos.
Facultad de Ingenieria de Sistemas.

---