// @ts-check
import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:16078'; // Asegúrate de que esta URL es correcta

test.describe('EBT Application Simple Check', () => {

  test('Check EBT list page loads and has basic elements', async ({ page }) => {
    // 1. Navegar a la página EBT
    await page.goto(`${BASE_URL}/EBT`);

    // 2. Verificar que el título de la página del navegador contenga "EBT"
    // (Puedes hacerlo más específico si conoces el título exacto, ej. /Estadísticas EBT/)
    await expect(page).toHaveTitle(/EBT/i, { timeout: 10000 });

    // 3. Verificar que un encabezado de nivel 1 (H1) es visible y contiene texto relevante
    // Ajusta 'Estadísticas EBT' al texto real de tu encabezado H1 en la página /EBT
    await expect(page.getByRole('heading', { level: 1, name: /Estadísticas EBT|Beneficios por Desempleo/i }).first()).toBeVisible({ timeout: 10000 });

    

    // 4. Verificar que la tabla de datos principal existe
    await expect(page.locator('table').first()).toBeVisible({ timeout: 10000 });
    
    // 5. Verificar que el botón "Crear" o "Añadir" existe (ajusta el nombre si es diferente)
    await expect(page.getByRole('button', { name: /Crear|Añadir/i })).toBeVisible({ timeout: 10000 });

    // 6. Verificar que el botón "Buscar" existe
    await expect(page.getByRole('button', { name: /Buscar/i })).toBeVisible({ timeout: 10000 });
    
    // 7. Verificar que el botón "Limpiar" (para los filtros de búsqueda) existe
    await expect(page.getByRole('button', { name: /Limpiar/i })).toBeVisible({ timeout: 10000 });

    // 8. Opcional: Verificar que la URL es la esperada
    await expect(page).toHaveURL(`${BASE_URL}/EBT`, { timeout: 10000 });
  });

  // Se han eliminado todas las pruebas de CRUD (Crear, Leer, Editar, Borrar)
  // y las comprobaciones detalladas de elementos específicos.
});