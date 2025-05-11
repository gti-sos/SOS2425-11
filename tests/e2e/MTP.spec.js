// @ts-check
import { test, expect } from '@playwright/test';

// Usa una variable de entorno para la URL base.
// Si ejecutas localmente sin configurar la variable, usará http://localhost:16078 como fallback.
const BASE_URL = 'http://localhost:16078';

// Define un grupo de tests para el módulo MTP
test.describe('MTP Application Basic Checks', () => {

    // Test para verificar que la página de lista MTP carga y tiene elementos básicos
    test('Check MTP list page loads and has basic elements', async ({ page }) => {
        // Navega a la página de lista MTP
        await page.goto(`${BASE_URL}/MTP`); // Usa la URL completa

        // 1. Verifica el título de la página
        // Ajusta el regex o el título exacto según tu etiqueta <title> en la página MTP
        await expect(page).toHaveTitle(/Gestión de Ayudas Sociales/); // Ejemplo de verificación de título

        // 2. Verifica un encabezado principal
        await expect(page.getByRole('heading', { name: 'Gestión de Ayudas Sociales' })).toBeVisible();

        // 3. Verifica si existen las secciones de formularios (Añadir y Buscar)
        // Puedes usar el encabezado dentro de cada sección como localizador
        await expect(page.locator('form:has(h2:has-text("Añadir Nuevo Registro"))')).toBeVisible();
        await expect(page.locator('div:has(h2:has-text("Buscar y Filtrar Registros"))')).toBeVisible();

        // 4. Verifica si la tabla de datos existe
        await expect(page.locator('table')).toBeVisible();
        await expect(page.locator('table thead tr').first()).toBeVisible(); // Verifica el encabezado de la tabla

        // 5. Verifica si los botones de acción principales existen
        await expect(page.getByRole('button', { name: 'Crear Registro' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Buscar' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Limpiar Filtros' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Borrar Todos' })).toBeVisible(); // Verifica el botón "Borrar Todos"
        // Añadir verificación para el nuevo botón "Cargar Registros"
        await expect(page.getByRole('button', { name: 'Cargar Registros' })).toBeVisible();
    });

    // (Opcional pero recomendado) Test para cargar datos iniciales
    test('Load initial data using the button', async ({ page }) => {
        await page.goto(`${BASE_URL}/MTP`);

        // Encuentra y haz clic en el botón "Cargar Registros"
        const loadButton = page.getByRole('button', { name: 'Cargar Registros' });
        await expect(loadButton).toBeVisible();
        await loadButton.click();

        // Verifica el mensaje de éxito
        await expect(page.locator('div[role="alert"]:has-text("Datos iniciales cargados correctamente.")')).toBeVisible({ timeout: 10000 }); // Timeout para esperar el mensaje

        // Opcional: Verifica que la tabla ahora contiene datos (si antes estaba vacía)
        // Esto asume que loadInitialData añade al menos una fila.
        // Puedes verificar el número de filas o la presencia de una fila conocida si es posible.
        await expect(page.locator('table tbody tr')).not.toHaveCount(0, { timeout: 10000 }); // Espera a que aparezcan filas

        // (Mejora opcional) Puedes añadir una limpieza de datos iniciales al final del test
        // si loadInitialData es idempotente o si quieres un estado limpio.
        // await page.getByRole('button', { name: 'Borrar Todos' }).click();
        // page.on('dialog', dialog => dialog.accept()); // Handle confirmation
        // await expect(page.locator('div[role="alert"]:has-text("Todos los registros se han borrado correctamente.")')).toBeVisible({ timeout: 10000 });
        // await expect(page.locator('table tbody tr')).toHaveCount(0, { timeout: 10000 });
    });


    // Test para crear y luego borrar un nuevo registro MTP
    test('Create and then Delete a new MTP resource', async ({ page }) => {
        await page.goto(`${BASE_URL}/MTP`);

        // Define datos de prueba únicos para la creación
        const testPlace = `TestPlaceMTP-${Date.now()}`; // Usa marca de tiempo para unicidad
        const testYear = 2099; // Usa un año futuro o único
        const testData = {
            place: testPlace,
            year: testYear.toString(),
            age: '123',
            legal_residence: '456',
            economical_resource: '789',
            incompatible_benefit: '1011'
        };

        // --- 1. Navega y Crea ---
        // Encuentra el formulario de creación usando su encabezado
        const createForm = page.locator('form:has(h2:has-text("Añadir Nuevo Registro"))');
        await expect(createForm).toBeVisible(); // Asegura que el formulario es visible

        // Rellena el formulario de creación usando las etiquetas exactas
        await createForm.getByLabel('Comunidad Autónoma').fill(testData.place);
        await createForm.getByLabel('Año').fill(testData.year);
        await createForm.getByLabel('Rechazados por: Edad').fill(testData.age);
        await createForm.getByLabel('Rechazados por: Lugar de Residencia').fill(testData.legal_residence);
        await createForm.getByLabel('Rechazados por: Renta').fill(testData.economical_resource);
        await createForm.getByLabel('Rechazados por: Incompatibilidad de Subvenciones').fill(testData.incompatible_benefit);


        // Haz clic en el botón "Crear Registro" dentro del formulario
        await createForm.getByRole('button', { name: 'Crear Registro' }).click();

        // --- 2. Verifica Creación ---
        // Verifica el mensaje de éxito (ajusta el texto exacto si es necesario)
        await expect(page.locator('div[role="alert"]:has-text("El registro se ha añadido correctamente.")')).toBeVisible({ timeout: 10000 }); // Aumenta timeout si la API tarda

        // Verifica que la nueva fila aparece en la tabla
        // Usa un localizador basado en el texto del lugar y el año
        const newRowLocatorString = `table tbody tr:has-text("${testData.place}"):has-text("${testData.year}")`;
         try {
            await page.waitForSelector(newRowLocatorString, { state: 'visible', timeout: 20000 });
            console.log(`Fila encontrada después de crear: ${newRowLocatorString}`);
        } catch (error) {
            console.error(`Error esperando la fila recién creada: ${newRowLocatorString}`, error);
             // Opcional: Tomar captura de pantalla para depuración
            const screenshotPath = `test-failure-screenshot-mtp-create-${Date.now()}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`Captura de pantalla guardada en ${screenshotPath}`);
            throw new Error(`No se encontró la fila (${newRowLocatorString}) después de la creación en 20s. Error: ${error.message}`);
        }

        const newRow = page.locator(newRowLocatorString);
        await expect(newRow).toBeVisible();

        // (Opcional) Verifica el contenido de algunas celdas si es necesario
        // await expect(newRow.locator('td').nth(2)).toContainText(testData.age); // Ajusta índice de columna
        // await expect(newRow.locator('td').nth(5)).toContainText(testData.incompatible_benefit); // Ajusta índice de columna

        // --- 3. Borra el Recurso Creado ---
        // Maneja el diálogo de confirmación del navegador
        page.on('dialog', dialog => dialog.accept());

        // Haz clic en el botón "Borrar" dentro de la fila recién creada
        await newRow.getByRole('button', { name: 'Borrar' }).click();

        // --- 4. Verifica Borrado ---
        // Verifica el mensaje de éxito de borrado (ajusta el texto exacto si es necesario)
        await expect(page.locator('div[role="alert"]')).toContainText(`El registro de ${testData.place} (${testData.year}) se ha borrado correctamente.`); // Ajusta el texto del mensaje

        // Verifica que la fila ya no está visible
        try {
            await page.waitForSelector(newRowLocatorString, { state: 'hidden', timeout: 15000 });
             console.log(`Fila oculta exitosamente después de borrar: ${newRowLocatorString}`);
        } catch (error) {
            console.error(`Error esperando que la fila se oculte: ${newRowLocatorString}`, error);
            const screenshotPath = `test-failure-screenshot-mtp-delete-${Date.now()}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`Captura de pantalla guardada en ${screenshotPath}`);
            throw new Error(`La fila (${newRowLocatorString}) no desapareció después de borrar en 15s. Error: ${error.message}`);
        }

         // Asersión final de que la fila no está visible
        await expect(newRow).not.toBeVisible();
    });

    // TODO: Añadir tests para:
    // - Editar un recurso (navegar, rellenar, guardar, verificar actualización en tabla)
    // - Borrar todos los recursos y verificar que la tabla queda vacía y el mensaje "No hay registros" aparece.
    // - Probar la funcionalidad de búsqueda y filtrado (con y sin resultados).
    // - Probar validaciones (ej. intentar crear con campos vacíos o inválidos).

});
