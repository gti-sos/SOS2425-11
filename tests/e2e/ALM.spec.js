// @ts-check
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:16078';


test.describe('ALM Application Basic Checks', () => {

    test('Check ALM list page loads and has basic elements', async ({ page }) => {
        // Navigate to the ALM list page
        await page.goto(`${BASE_URL}/ALM`);

        // 1. Check page title

        // 2. Check for a main heading
        await expect(page.getByRole('heading', { name: 'Solicitudes de Dependencia por Autonomía' })).toBeVisible();

        // 3. Check if the data table exists
        await expect(page.locator('table')).toBeVisible();
        await expect(page.locator('table thead tr').first()).toBeVisible(); // Check for table header

        // 4. Check if the "Create" button exists within its form
        // This assumes the "Crear Recurso" button is within a form.
        await expect(page.locator('form').getByRole('button', { name: 'Crear Recurso' })).toBeVisible();

        // 5. Check for other buttons like Search, Clear, Delete All
        await expect(page.getByRole('button', { name: 'Buscar' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Limpiar' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Borrar Todos los Recursos' })).toBeVisible();
    });
/*
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
    */

    const testPlace = `TestPlace-${Date.now()}`;
    const testYear = 2098; // Use a unique year unlikely to exist
    const testData = {
        place: testPlace,
        year: testYear,
        population: 1234567,
        dependent_population: 123456,
        request: 12345
    };
/*
    test('Create and then Delete a new ALM resource', async ({ page }) => {
        // --- 1. Navigate and Create ---
        await page.goto(`${BASE_URL}/ALM`);

        // Fill the creation form
        // This selector assumes the creation form is identifiable by an h2 tag with "Añadir Nuevo Recurso".
        // If your form has a unique ID, e.g., #create-form, use page.locator('#create-form').
        const createForm = page.locator('form:has(h2:has-text("Añadir Nuevo Recurso"))');
        await createForm.getByLabel('Comunidad Autónoma').fill(testData.place);
        await createForm.getByLabel('Año').fill(testData.year.toString());
        await createForm.getByLabel('Población', { exact: true }).fill(testData.population.toString());
        await createForm.getByLabel('Población Dependiente').fill(testData.dependent_population.toString());
        await createForm.getByLabel('Solicitudes').fill(testData.request.toString());

        await createForm.getByRole('button', { name: 'Crear Recurso' }).click();

        // --- 2. Verify Creation ---
        // Check for success message (allow some time for it to appear)
        await expect(page.locator('div[role="alert"]:has-text("Registro añadido correctamente.")'))
            .toBeVisible({ timeout: 10000 });

        // Locate the new row
        const newRowLocatorString = `tr:has-text("${testData.place}"):has-text("${testData.year}")`;
        const newRow = page.locator(newRowLocatorString);

        // Wait for the row to be visible (allow generous time for UI update)
        await expect(newRow).toBeVisible({ timeout: 20000 });

        // Verify content (using simple string comparison for numbers)
        await expect(newRow.locator('td').nth(2)).toContainText(testData.population.toString());
        await expect(newRow.locator('td').nth(4)).toContainText(testData.request.toString());

        // --- 3. Delete the Created Resource ---
        // Handle the confirmation dialog automatically
        page.on('dialog', dialog => dialog.accept());

        await newRow.getByRole('button', { name: 'Borrar' }).click();

        // --- 4. Verify Deletion ---
        // Check for delete success message (allow some time for it to appear)
        const deleteSuccessMessage = `El registro de ${testData.place} (${testData.year}) se ha borrado correctamente.`;
        await expect(page.locator('div[role="alert"]')).toContainText(deleteSuccessMessage, { timeout: 10000 });

        // Check that the row is no longer visible (allow time for UI update)
        await expect(newRow).not.toBeVisible({ timeout: 15000 });
    });
    */

});
