# ✅ Checklist Feedback F06

# ANTONIO:
## 🗂️ Gestión de la Milestone F06 en GitHub
- [X] Crear milestone "F06" en el repositorio SOS2425-XX con fecha de feedback
- [X] Crear mínimo 5 issues por cada miembro del equipo
- [X] Asignar cada issue a su respectivo miembro
- [X] Enlazar cada issue a la milestone "F06"
- [X] Especificar en la descripción de cada issue la tarea del backlog correspondiente
- [X] Completar todas las issues y cerrarlas
- [X] Verificar que todas las issues de la milestone "F06" estén cerradas

## 📝 Actualización de los README (repositorio común y de grupo)
- [X] Añadir la URL de Render en el campo “URL” de ambos README
- [X] Añadir sección “APIs:” en ambos README con los 3 enlaces a la documentación de las APIs
    - [X] Comprobar que cada línea incluye el enlace y el nombre del desarrollador correspondiente
Para el docs hacer algo similar a: https://documenter.getpostman.com/view/33042302/2sA2xe5uSh

# MARIO:
## 🌐 Página de presentación estática en Render
- [ ] Crear o revisar una página HTML estática que incluya:
    - [ ] Enlace a /about
    - [ ] Enlaces a las APIs desarrolladas
- [ ] Servir la página correctamente al acceder a http://sos2425-XX.onrender.com/

## 🧪 Preparar y configurar la ejecución de tests con Newman
- [ ] Crear las tres colecciones de Postman por cada API
- [ ] Añadir comprobaciones avanzadas a cada request (validar campos y tamaños de arrays)
- [ ] Crear entornos local/online en Postman para cada colección
- [ ] Asegurar que las colecciones son idempotentes (estado igual al inicio tras ejecución)
- [ ] Crear script "npm test" en package.json que lance las tres colecciones con Newman
- [ ] Verificar que todas las casuísticas (excepto 401) están testeadas según L05

## 🧩 Modularización del código
- [ ] Separar la lógica principal del servidor en un módulo independiente de `index.js`
- [ ] Mantener el código de cada API en módulos separados por desarrollador

# EDU:
## ⚙️ Configurar integración continua (CI)
- [ ] Configurar GitHub Actions o similar para ejecutar `npm test` en cada push
- [ ] Verificar que al pasar las pruebas aparece el ✅ verde en el commit final antes de la clase de feedback

## 🚀 Configurar despliegue automático en Render
- [ ] Configurar Render para desplegar automáticamente solo si el CI pasa
- [ ] Verificar que el despliegue funciona correctamente al hacer push

## 👨‍💻 Requisitos individuales por alumno - Backend (API)
- [ ] Reestructurar la API para cumplir:
    - [ ] Persistencia con NeDB
    - [ ] Implementación de búsquedas por todos los campos
    - [ ] Implementación de paginación
- [ ] Validación y estructura de datos:
    - [ ] Asegurar que los GET a colecciones devuelven un array
    - [ ] Asegurar que los GET a recurso concreto devuelven un objeto
    - [ ] Devolver 400 si la estructura JSON no es la esperada
    - [ ] Asegurar que la API solo recibe/envía JSON (salvo códigos de estado)
    - [ ] Ocultar la propiedad `_id` de NeDB en la API
- [ ] Correcto uso de identificadores compuestos en las rutas:
    - [ ] Configurar rutas PUT/GET/DELETE con identificadores compuestos (p.e. /api/v1/stats/spain/2018)

## 📄 Portal de documentación de la API individual
- [ ] Generar portal de documentación con Postman y publicar en:
    - [ ] https://sos2425-XX.onrender.com/api/v1/FFFFF/docs
- [ ] Comprobar que la colección de test esté actualizada en la documentación

## 🧪 Script de test individual por API
- [ ] Añadir script `test-FFFFF` en `package.json` que ejecute la colección de test con Newman en local:
    - [ ] Comprobar que se ejecuta correctamente con `npm run test-FFFFF`

## 🧹 Limpieza de código y revisión final
- [ ] Eliminar rutas de ejemplo anteriores (ej. /sample/YYYY o /cool)
- [ ] Asegurar que solo queda el código necesario para este feedback
