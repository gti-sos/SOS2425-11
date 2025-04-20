// @ts-check
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:16078';


test.describe('ALM Application Basic Checks', () => {

    test('Check ALM list page loads and has basic elements', async ({ page }) => {
        // Navigate to the ALM list page
        await page.goto(`${BASE_URL}/ALM`); // Use full URL

        // 1. Check page title
        // Assuming title is something like "Dependencia por Autonomía" or similar
        // Adjust the regex or exact title as needed based on your actual <title> tag
        await expect(page).toHaveTitle(/Solicitudes de Dependencia/); // Example title check

        // 2. Check for a main heading
        await expect(page.getByRole('heading', { name: 'Solicitudes de Dependencia por Autonomía' })).toBeVisible();

        // 3. Check if the data table exists
        await expect(page.locator('table')).toBeVisible();
        await expect(page.locator('table thead tr').first()).toBeVisible(); // Check for table header

        // 4. Check if the "Create" button exists within its form
        await expect(page.locator('form').getByRole('button', { name: 'Crear Recurso' })).toBeVisible();

        // 5. Check for other buttons like Search, Clear, Delete All
        await expect(page.getByRole('button', { name: 'Buscar' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Limpiar' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Borrar Todos los Recursos' })).toBeVisible();
    });

    test('Check ALM edit page loads for a specific resource', async ({ page }) => {
        // Ensure data exists first. Assuming 'Andalucía' / 2024 exists from initial data or previous tests.
        // If not, you might need a setup step or use loadInitialData.
        const testPlace = 'Andalucía'; // Example: Use a known place
        const testYear = 2024;       // Example: Use a known year

        // Navigate to the list page
        await page.goto(`${BASE_URL}/ALM`);

        // Find the row for the specific resource (adjust selector as needed)
        const row = page.locator(`tr:has-text("${testPlace}"):has-text("${testYear}")`);
        await expect(row).toBeVisible({ timeout: 15000 }); // Aumentado timeout a 15s

        // Click the Edit button within that row
        await row.getByRole('button', { name: 'Editar' }).click();

        // Now on the edit page /ALM/edit/Andalucía/2024
        // Use RegExp for URL check to handle potential encoding differences
        const expectedUrlPattern = new RegExp(`.*\/ALM\/edit\/${encodeURIComponent(testPlace)}\/${testYear}`);
        await expect(page).toHaveURL(expectedUrlPattern);

        // 1. Check page title (Adapt based on your <title> tag)
        await expect(page).toHaveTitle(/Editar Registro de Solicitudes/); // Example title check

        // 2. Check for a main heading
        await expect(page.getByRole('heading', { name: 'Editar Registro de Solicitudes' })).toBeVisible();

        // 3. Check if a form exists
        await expect(page.locator('form')).toBeVisible();

        // 4. Check for expected input fields (using labels from edit page)
        await expect(page.getByLabel('Población', { exact: true })).toBeVisible();
        await expect(page.getByLabel('Población Dependiente')).toBeVisible();
        await expect(page.getByLabel('Solicitudes')).toBeVisible();

        // 5. Check if a "Save" button exists
        await expect(page.getByRole('button', { name: 'Guardar Cambios' })).toBeVisible();
    });

    const testPlace = `TestPlace-${Date.now()}`;
    const testYear = 2098; // Use a unique year unlikely to exist
    const testData = {
        place: testPlace,
        year: testYear,
        population: 1234567,
        dependent_population: 123456,
        request: 12345
    };

    test('Create and then Delete a new ALM resource', async ({ page }) => {
        // --- 1. Navigate and Create ---
        await page.goto(`${BASE_URL}/ALM`);

        // Fill the creation form
        const createForm = page.locator('form:has(h2:has-text("Añadir Nuevo Recurso"))');
        await createForm.getByLabel('Comunidad Autónoma').fill(testData.place);
        await createForm.getByLabel('Año').fill(testData.year.toString());
        await createForm.getByLabel('Población', { exact: true }).fill(testData.population.toString());
        await createForm.getByLabel('Población Dependiente').fill(testData.dependent_population.toString());
        await createForm.getByLabel('Solicitudes').fill(testData.request.toString());

        // Click the Create button
        await createForm.getByRole('button', { name: 'Crear Recurso' }).click();

        // --- 2. Verify Creation ---
        // Check for success message
        await expect(page.locator('div[role="alert"]:has-text("Registro añadido correctamente.")')).toBeVisible();

        // Explicitly wait for the table row to appear and be visible
        const newRowLocatorString = `tr:has-text("${testData.place}"):has-text("${testData.year}")`;
        try {
            await page.waitForSelector(newRowLocatorString, { state: 'visible', timeout: 20000 });
            console.log(`Row found: ${newRowLocatorString}`);
        } catch (error) {
            console.error(`Error waiting for selector: ${newRowLocatorString}`, error);
            const screenshotPath = `test-failure-screenshot-alm-create-${Date.now()}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`Screenshot saved to ${screenshotPath}`);
            throw new Error(`Failed to find the new row (${newRowLocatorString}) after creation within 20s. ${error.message}`);
        }

        const newRow = page.locator(newRowLocatorString);
        await expect(newRow).toBeVisible();

        // Verify content (optional, but good)
        await expect(newRow.locator('td').nth(2)).toContainText(testData.population.toLocaleString('es-ES'));
        await expect(newRow.locator('td').nth(4)).toContainText(testData.request.toLocaleString('es-ES'));

        // --- 3. Delete the Created Resource ---
        // Handle the confirmation dialog
        page.on('dialog', dialog => dialog.accept());

        // Click the Delete button within the new row
        await newRow.getByRole('button', { name: 'Borrar' }).click();

        // --- 4. Verify Deletion ---
        // Check for delete success message
        await expect(page.locator('div[role="alert"]')).toContainText(`El registro de ${testData.place} (${testData.year}) se ha borrado correctamente.`);

        // Check that the row is no longer visible using waitFor
        try {
            await page.waitForSelector(newRowLocatorString, { state: 'hidden', timeout: 15000 });
            console.log(`Row successfully hidden after deletion: ${newRowLocatorString}`);
        } catch (error) {
            console.error(`Error waiting for selector to be hidden: ${newRowLocatorString}`, error);
            const screenshotPath = `test-failure-screenshot-alm-delete-${Date.now()}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`Screenshot saved to ${screenshotPath}`);
            throw new Error(`Row (${newRowLocatorString}) did not disappear after deletion within 15s. ${error.message}`);
        }

        // Final assertion that the row is not visible
        await expect(newRow).not.toBeVisible();
    });

}); 