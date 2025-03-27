# 📚 SOS2425-XX - API y Proyecto del Grupo

Este repositorio contiene la API desarrollada por el grupo **XX** para la asignatura **SOS2425**.

## 🚀 Despliegue en Render
La aplicación está desplegada en:  
👉 [https://sos2425-XX.onrender.com/](https://sos2425-XX.onrender.com/)

## 🌐 Documentación de las APIs
Cada API tiene su propia documentación accesible desde los siguientes enlaces:

### APIs:
- [https://sos2425-XX.onrender.com/api/v1/FFFFF/docs](https://sos2425-XX.onrender.com/api/v1/FFFFF/docs) (developed by Nombre Apellidos)
- [https://sos2425-XX.onrender.com/api/v1/GGGGG/docs](https://sos2425-XX.onrender.com/api/v1/GGGGG/docs) (developed by Nombre Apellidos)
- [https://sos2425-XX.onrender.com/api/v1/HHHHH/docs](https://sos2425-XX.onrender.com/api/v1/HHHHH/docs) (developed by Nombre Apellidos)

También se puede acceder a través de la página principal:  
👉 [https://sos2425-XX.onrender.com/](https://sos2425-XX.onrender.com/)

## 📂 Estructura del Proyecto
/
├── index.js                 -> Archivo principal que arranca el servidor
├── package.json             -> Configuración del proyecto y scripts
├── README.md                -> Documentación del proyecto
│
├── /public                  -> Página de presentación HTML estática
│   └── index.html
│
├── /api
│   └── /v1
│       ├── /FFFFF
│       │   └── index.js     -> Código modularizado de la API FFFFF (Alumno 1)
│       ├── /GGGGG
│       │   └── index.js     -> Código modularizado de la API GGGGG (Alumno 2)
│       └── /HHHHH
│           └── index.js     -> Código modularizado de la API HHHHH (Alumno 3)
│
├── /test
│   ├── FFFFF-collection.json   -> Test Newman de la API FFFFF
│   ├── GGGGG-collection.json   -> Test Newman de la API GGGGG
│   └── HHHHH-collection.json   -> Test Newman de la API HHHHH
│
└── /docs
    ├── FFFFF-docs.html         -> Redirección a la documentación Postman de FFFFF
    ├── GGGGG-docs.html         -> Redirección a la documentación Postman de GGGGG
    └── HHHHH-docs.html         -> Redirección a la documentación Postman de HHHHH


## 🧪 Ejecución de Tests Automáticos
El proyecto incluye tests automatizados con **Newman** que se ejecutan al hacer push gracias a la integración continua (CI).

### 🔄 Para ejecutar todos los tests de todas las APIs:
npm test

Este comando ejecutará las tres colecciones de tests sobre las APIs desplegadas.

### 🔄 Para lanzar el test de tu API específica (ejemplo FFFFF):
npm run test-FFFFF

Esto ejecutará la colección de tests de la API FFFFF en local.

### ✅ Requisitos de los tests:
- La colección de Postman debe estar en la carpeta `/test`
- La colección debe incluir entornos local y online
- Cada test incluye comprobaciones avanzadas (campos, tamaños de array, etc.)
- El test es **idempotente**: deja la base de datos en el mismo estado al finalizar
- Se prueban todos los casos de éxito y error del L05 (excepto 401)

## 🛠 Instalación y Ejecución Local
### 1️⃣ Instalar dependencias:
npm install
npm install nedb


### 2️⃣ Iniciar el servidor local:
npm start

### Correr tests:
Una vez inicializado el servidor local en otra pestaña de terminal, podemos ejecutar los tests localmente de la siguiente manera:

Local:
npx newman run tests/back/api-tests.json -e tests/back/api-env-local.json

Online:
npx newman run tests/back/api-tests.json -e tests/back/api-env-online.json

Se modifica package.json para meter ese comando y que solo tengamos que hacer lo siguiente:
npm test

Para correr el servidor y test sin tener que abrir una pestaña nueva:
npm install start-server-and-test --save-dev  //save dev hace que se guarde como una dependencia de desarrollo



La API estará disponible en:  
👉 `http://localhost:12345/api/v1/FFFFF`

Acceder a la página de presentación:  
👉 `http://localhost:12345/`

## ✅ Buenas Prácticas y Validaciones Implementadas
- Persistencia con **NeDB**
- Búsqueda por todos los campos
- Paginación
- Uso correcto de identificadores compuestos en las rutas
- Validación estricta de la estructura de los datos (400 si no coincide)
- No se expone ni se acepta el campo `_id` de NeDB
- Solo se recibe y devuelve **JSON**
- Código limpio y modularizado
- Documentación disponible en `/api/v1/FFFFF/docs`

## ⚙️ Integración Continua y Despliegue Automático
- CI configurada para ejecutar `npm test` en cada push
- Despliegue automático en **Render** si los tests pasan correctamente
- Estado verde (✔️) en el último commit si todo funciona correctamente

## 👥 Equipo
- Nombre Apellidos (API FFFFF)
- Nombre Apellidos (API GGGGG)
- Nombre Apellidos (API HHHHH)

## 📄 Licencia
MIT
