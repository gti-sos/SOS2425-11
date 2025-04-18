# ✅ Checklist Feedback F06

## 🎨 Requisitos individuales por alumno - Frontend (UI)

### 🏗️ Configuración Inicial
- [ ] Inicializar proyecto Svelte.
- [ ] Instalar dependencias (router, cliente HTTP, etc.).
- [ ] Configurar estructura básica (componentes, rutas).

### 📄 Vista de Lista de Recursos
- [ ] Crear componente Svelte para la tabla/lista.
- [ ] Implementar llamada a la API (GET /collection) al cargar.
- [ ] Mostrar datos en una tabla HTML.
- [ ] Añadir botón "Borrar Todo" (sin funcionalidad aún).
- [ ] Añadir botón "Crear Nuevo" (sin funcionalidad aún).
- [ ] Añadir controles de búsqueda (inputs, selects) (sin funcionalidad aún).
- [ ] Añadir botones "Editar" y "Borrar" por cada fila (sin funcionalidad aún).

### ✨ Crear Recursos
- [ ] Crear formulario HTML para la creación.
- [ ] Implementar función para enviar datos (POST /collection).
- [ ] Integrar formulario en la UI (ej. modal o sección separada).
- [ ] Limpiar formulario tras creación exitosa.

### 🗑️ Borrar Recursos
- [ ] Implementar función para borrar un recurso (DELETE /resource/:id...). 
- [ ] Asociar función al botón "Borrar" de cada fila.
- [ ] Añadir diálogo de confirmación antes de borrar.
- [ ] Implementar función para borrar todos los recursos (DELETE /collection).
- [ ] Asociar función al botón "Borrar Todo".
- [ ] Añadir diálogo de confirmación antes de borrar todo.

### ✏️ Editar Recursos (Vista Separada)
- [ ] Crear componente Svelte para la vista de edición.
- [ ] Configurar ruta dinámica (ej. `/edit/:id` o `/edit/:field1/:field2`).
- [ ] Implementar navegación desde el botón "Editar" de la lista a esta vista.
- [ ] Implementar carga de datos del recurso (GET /resource/:id...) al entrar en la vista.
- [ ] Crear formulario HTML pre-rellenado con los datos del recurso.
- [ ] Implementar función para guardar cambios (PUT /resource/:id...). 
- [ ] Implementar navegación de vuelta a la lista tras guardar.

### 🔍 Búsqueda de Recursos
- [ ] Implementar función para construir URL de búsqueda (con `?param1=X&param2=Y`).
- [ ] Implementar función para ejecutar la búsqueda (GET /collection?params...). 
- [ ] Asociar la función a los controles de búsqueda (ej. al cambiar valor o pulsar botón).
- [ ] Actualizar la tabla con los resultados de la búsqueda.
- [ ] Asegurar que se pueden usar todos los parámetros de búsqueda de la API.

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
