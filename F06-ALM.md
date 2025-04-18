# ✅ Checklist Feedback F06

## 🎨 Requisitos individuales por alumno - Frontend (UI)

### 🏗️ Configuración Inicial
- [X] Inicializar proyecto Svelte.
- [X] Instalar dependencias (router, cliente HTTP, etc.).
- [X] Configurar estructura básica (componentes, rutas).

### 📄 Vista de Lista de Recursos
- [X] Crear componente Svelte para la tabla/lista.
- [X] Implementar llamada a la API (GET /collection) al cargar.
- [X] Mostrar datos en una tabla HTML.
- [X] Añadir botón "Borrar Todo" (sin funcionalidad aún).
- [X] Añadir botón "Crear Nuevo" (sin funcionalidad aún).
- [X] Añadir controles de búsqueda (inputs, selects) (sin funcionalidad aún).
- [X] Añadir botones "Editar" y "Borrar" por cada fila (sin funcionalidad aún).

### ✨ Crear Recursos
- [X] Crear formulario HTML para la creación.
- [X] Implementar función para enviar datos (POST /collection).
- [X] Integrar formulario en la UI (ej. modal o sección separada).
- [X] Limpiar formulario tras creación exitosa.

### 🗑️ Borrar Recursos
- [X] Implementar función para borrar un recurso (DELETE /resource/:id...). 
- [X] Asociar función al botón "Borrar" de cada fila.
- [X] Añadir diálogo de confirmación antes de borrar.
- [X] Implementar función para borrar todos los recursos (DELETE /collection).
- [X] Asociar función al botón "Borrar Todo".
- [X] Añadir diálogo de confirmación antes de borrar todo.

### ✏️ Editar Recursos (Vista Separada)
- [X] Crear componente Svelte para la vista de edición.
- [X] Configurar ruta dinámica (ej. `/edit/:id` o `/edit/:field1/:field2`).
- [X] Implementar navegación desde el botón "Editar" de la lista a esta vista.
- [X] Implementar carga de datos del recurso (GET /resource/:id...) al entrar en la vista.
- [X] Crear formulario HTML pre-rellenado con los datos del recurso.
- [X] Implementar función para guardar cambios (PUT /resource/:id...). 
- [X] Implementar navegación de vuelta a la lista tras guardar.

### 🔍 Búsqueda de Recursos
- [X] Implementar función para construir URL de búsqueda (con `?param1=X&param2=Y`).
- [X] Implementar función para ejecutar la búsqueda (GET /collection?params...). 
- [X] Asociar la función a los controles de búsqueda (ej. al cambiar valor o pulsar botón).
- [X] Actualizar la tabla con los resultados de la búsqueda.
- [X] Asegurar que se pueden usar todos los parámetros de búsqueda de la API.

### ✨ Interfaz de Usuario y Experiencia
- [ ] **Idioma**: Todos los textos (botones, etiquetas, títulos) en español.
- [ ] **Claridad**: Evitar jerga técnica (API, PUT, GET, JSON, códigos de error numéricos).
- [ ] **Feedback Éxito**: Mostrar mensajes claros tras operaciones exitosas (crear, editar, borrar).
- [ ] **Feedback Error**: Mostrar mensajes de error comprensibles y en español para errores de API (4xx, 5xx) o de red.
- [ ] **Recarga Automática**: 
    - [ ] Actualizar lista tras crear recurso.
    - [ ] Actualizar lista tras borrar recurso(s).
    - [ ] Actualizar lista tras editar recurso (al volver a la lista).
    - [ ] Actualizar lista tras realizar una búsqueda.
    - [ ] Vaciar/Refrescar lista tras borrar todos los recursos.
