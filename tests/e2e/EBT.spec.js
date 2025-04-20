// @ts-check
import { test, expect } from '@playwright/test';
import { create } from 'domain';

const BASE_URL = 'http://localhost:5173';


test.describe('EBT Application Basic Checks', () => {

  test('Check EBT list page loads and has basic elements', async ({ page }) => {
    // Navigate to the EBT list page
    await page.goto(`${BASE_URL}/EBT`); // Use full URL

    // 1. Check page title
    await expect(page).toHaveTitle(/EBT Data/);

    // 2. Check for a main heading
    await expect(page.getByRole('heading', { name: 'Gestión de Nóminas de Pensiones Sociales' })).toBeVisible();

    // 3. Check if the data table exists
    await expect(page.locator('table')).toBeVisible();
    await expect(page.locator('table thead tr').first()).toBeVisible(); // Check for table header
    // Optional: Check for at least one data row if data is expected initially or after loadInitialData
    // await expect(page.locator('table tbody tr').first()).toBeVisible({ timeout: 10000 }); // Increase timeout if data loads async

    // 4. Check if the "Create" button exists within its form
    await expect(page.locator('form').getByRole('button', { name: 'Crear Registro' })).toBeVisible();

    // 5. Check for other buttons like Search, Clear, Delete All
    await expect(page.getByRole('button', { name: 'Buscar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Limpiar Filtros' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Borrar Todos' })).toBeVisible();
  });

  // --- SECOND TEST NEEDS REFACTORING ---
  // test('Check EBT edit/create page loads and has basic elements', async ({ page }) => { ... });
  // Example refactor (Testing Edit Flow - needs a known resource like Andalucía/2024):
  test('Check EBT edit page loads for a specific resource', async ({ page }) => {
      // Ensure data exists first, maybe by loading initial data or creating one in a setup step

      // Navigate to the list page
      await page.goto(`${BASE_URL}/EBT`);

      // Find the row for Andalucía 2024 (adjust selector as needed)
      const row = page.locator('tr:has-text("Andalucía"):has-text("2024")');
      await expect(row).toBeVisible();

      // Click the Edit button within that row
      await row.getByRole('button', { name: 'Editar' }).click();

      // Now on the edit page /EBT/edit/Andalucía/2024
      await expect(page).toHaveURL(/.*\/EBT\/edit\/Andaluc%C3%ADa\/2024/); // Check URL pattern

      // 1. Check page title
      await expect(page).toHaveTitle(/Editar Nómina - Andalucía \(2024\)/);

      // 2. Check for a main heading
      await expect(page.getByRole('heading', { name: 'Editar Nómina de Pensión Social' })).toBeVisible();

      // 3. Check if a form exists
      await expect(page.locator('form')).toBeVisible();

      // 4. Check for some expected input fields (using labels from edit page)
      await expect(page.getByLabel('Importe Jubilación (€)')).toBeVisible();
      await expect(page.getByLabel('Importe Invalidez (€)')).toBeVisible();
      await expect(page.getByLabel('Nº Pensiones Jubilación')).toBeVisible();
      await expect(page.getByLabel('Nº Pensiones Invalidez')).toBeVisible();

      // 5. Check if a "Save" button exists
      await expect(page.getByRole('button', { name: 'Guardar Cambios' })).toBeVisible();
  });

  const testPlace = `TestPlace-${Date.now()}`;
  const testYear = 2099;
  const testData = {
    place: testPlace,
    year: testYear,
    retirement_amount: 10000.50,
    disability_amount: 5000.75,
    retirement_number: 100,
    disability_number: 50
  };
  test('Create and then Delete a new EBT resource', async ({ page }) => {
    // --- 1. Navigate and Create ---
    await page.goto(`${BASE_URL}/EBT`);

    // Fill the creation form
    const createForm = page.locator('form:has(h2:has-text("Añadir Nuevo Registro"))');
    await createForm.getByLabel('Comunidad Autónoma').fill(testData.place);
    await createForm.getByLabel('Año').fill(testData.year.toString());
    await createForm.getByLabel('Importe Jubilación (€)').fill(testData.retirement_amount.toString());
    await createForm.getByLabel('Importe Invalidez (€)').fill(testData.disability_amount.toString());
    await createForm.getByLabel('Nº Pensiones Jubilación').fill(testData.retirement_number.toString());
    await createForm.getByLabel('Nº Pensiones Invalidez').fill(testData.disability_number.toString());

        // Click the Create button
        await createForm.getByRole('button', { name: 'Crear Registro' }).click();

        // --- 2. Verify Creation ---
        // Check for success message (this confirms the API likely responded)
        await expect(page.locator('div[role="alert"]:has-text("Éxito")')).toContainText('El registro se ha añadido correctamente.');
    
        // **Explicitly wait for the table row to appear and be visible**
        const newRowLocatorString = `tr:has-text("${testData.place}"):has-text("${testData.year}")`;
        try {
            // Wait for the selector to be visible in the DOM, increase timeout slightly
            await page.waitForSelector(newRowLocatorString, { state: 'visible', timeout: 15000 }); // Increased timeout to 15s
            console.log(`Row found: ${newRowLocatorString}`); // Log success
        } catch (error) {
            // If the row doesn't appear within the timeout, log, take screenshot, and fail
            console.error(`Error waiting for selector: ${newRowLocatorString}`, error);
            const screenshotPath = `test-failure-screenshot-${Date.now()}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`Screenshot saved to ${screenshotPath}`);
            // Re-throw the error to ensure the test fails clearly
            throw new Error(`Failed to find the new row (${newRowLocatorString}) after creation within 15s. ${error.message}`);
        }
    
        // Now that waitForSelector has succeeded, the element is definitely visible.
        const newRow = page.locator(newRowLocatorString);
        await expect(newRow).toBeVisible(); // This assertion should now pass quickly
    
        // Verify content (optional, but good)
        await expect(newRow.locator('td').nth(2)).toContainText(testData.retirement_amount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    
        // --- 3. Delete the Created Resource ---
        // Handle the confirmation dialog
        page.on('dialog', dialog => dialog.accept());
    
        // Click the Delete button within the new row
        await newRow.getByRole('button', { name: 'Borrar' }).click();
    
        // --- 4. Verify Deletion ---
        // Check for delete success message
        await expect(page.locator('div[role="alert"]:has-text("Éxito")')).toContainText(`El registro de ${testData.place} (${testData.year}) se ha borrado correctamente.`);
    
        // Check that the row is no longer visible
        // Use waitFor a state of 'hidden' or 'detached' for robustness
        try {
            await page.waitForSelector(newRowLocatorString, { state: 'hidden', timeout: 10000 }); // Wait for it to disappear
            console.log(`Row successfully hidden after deletion: ${newRowLocatorString}`);
        } catch (error) {
            console.error(`Error waiting for selector to be hidden: ${newRowLocatorString}`, error);
            const screenshotPath = `test-failure-screenshot-delete-${Date.now()}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            console.log(`Screenshot saved to ${screenshotPath}`);
            throw new Error(`Row (${newRowLocatorString}) did not disappear after deletion within 10s. ${error.message}`);
        }

    // Check that the row is no longer visible
    await expect(newRow).not.toBeVisible();
  });


});
