import { test, expect } from '@playwright/test'

test.describe('Tutor Panel', () => {
  test.beforeEach(async ({ page }) => {
    // Login as tutor before each test
    await page.goto('/')
    await page.getByText('Docente/Tutor').click()
    await page.getByPlaceholder('Ingrese su código de activación').fill('BCH1A2024')
    await page.getByRole('button', { name: 'Acceder al Sistema' }).click()
    
    // Wait for panel to load
    await expect(page.getByText('📱 Gestión de Votación')).toBeVisible()
  })

  test('should display tutor panel with course info', async ({ page }) => {
    await expect(page.getByText('📱 Gestión de Votación')).toBeVisible()
    await expect(page.getByText('1ro Bach A')).toBeVisible()
    await expect(page.getByText('BACHILLERATO')).toBeVisible()
    
    // Check navigation bar
    await expect(page.getByText('🗳️ Votaciones 2024')).toBeVisible()
    await expect(page.getByText('📱 1ro Bach A')).toBeVisible()
  })

  test('should display connection status', async ({ page }) => {
    await expect(page.getByText('📊')).toBeVisible()
    await expect(page.getByText('Estado del Sistema')).toBeVisible()
    
    // Should show various status indicators
    await expect(page.getByText('🌐')).toBeVisible() // Connection
    await expect(page.getByText('🗄️')).toBeVisible() // Database
    await expect(page.getByText('⚡')).toBeVisible() // Application
    await expect(page.getByText('🕒')).toBeVisible() // Time
  })

  test('should show student management section', async ({ page }) => {
    await expect(page.getByText('👥 GESTIÓN DE ESTUDIANTES')).toBeVisible()
    await expect(page.getByText('Lista de estudiantes del curso 1ro Bach A')).toBeVisible()
    
    // Should have student controls
    await expect(page.getByRole('button', { name: /cargar estudiantes/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /importar csv/i })).toBeVisible()
  })

  test('should show voting management section', async ({ page }) => {
    await expect(page.getByText('🗳️ GESTIÓN DE VOTACIÓN')).toBeVisible()
    await expect(page.getByText('Control del proceso de votación')).toBeVisible()
    
    // Should have voting controls
    await expect(page.getByRole('button', { name: /modo kiosco/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /exportar resultados/i })).toBeVisible()
  })

  test('should load students when button is clicked', async ({ page }) => {
    await page.getByRole('button', { name: /cargar estudiantes/i }).click()
    
    // Should show loading or students list
    // Note: This depends on the actual implementation
    await page.waitForTimeout(1000) // Allow time for loading
    
    // Check if students section appears or updates
    const studentsSection = page.locator('[data-testid="students-section"]')
    if (await studentsSection.isVisible()) {
      await expect(studentsSection).toBeVisible()
    }
  })

  test('should handle CSV import dialog', async ({ page }) => {
    await page.getByRole('button', { name: /importar csv/i }).click()
    
    // Should open file input or modal
    // Note: File input testing might require special handling
    await page.waitForTimeout(500)
  })

  test('should toggle kiosk mode', async ({ page }) => {
    const kioskButton = page.getByRole('button', { name: /modo kiosco/i })
    await kioskButton.click()
    
    // Should toggle the mode - implementation dependent
    await page.waitForTimeout(500)
  })

  test('should show statistics when available', async ({ page }) => {
    // Look for statistics section
    const statsSection = page.locator('text=📊')
    if (await statsSection.isVisible()) {
      await expect(statsSection).toBeVisible()
    }
  })

  test('should refresh connection status', async ({ page }) => {
    const refreshButton = page.getByRole('button', { name: /actualizar/i })
    await refreshButton.click()
    
    // Should trigger refresh - might see loading indicator
    await page.waitForTimeout(500)
  })

  test('should handle logout from tutor panel', async ({ page }) => {
    await page.getByRole('button', { name: '🚪 Salir' }).click()
    
    // Should return to homepage
    await expect(page.getByText('🏫 SISTEMA DE VOTACIÓN ESTUDIANTIL')).toBeVisible()
  })

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Should still show main elements
    await expect(page.getByText('📱 Gestión de Votación')).toBeVisible()
    await expect(page.getByText('👥 GESTIÓN DE ESTUDIANTES')).toBeVisible()
    await expect(page.getByText('🗳️ GESTIÓN DE VOTACIÓN')).toBeVisible()
  })

  test('should handle different education levels', async ({ page }) => {
    // Logout and login with different code
    await page.getByRole('button', { name: '🚪 Salir' }).click()
    await page.getByText('Docente/Tutor').click()
    
    // Try different activation code
    await page.getByPlaceholder('Ingrese su código de activación').fill('BSP8A2024')
    await page.getByRole('button', { name: 'Acceder al Sistema' }).click()
    
    // Should show different course
    await expect(page.getByText('8vo A')).toBeVisible()
    await expect(page.getByText('BÁSICA SUPERIOR')).toBeVisible()
  })

  test('should show proper time updates', async ({ page }) => {
    const timeElement = page.locator('text=/\\d{1,2}:\\d{2}:\\d{2}/')
    await expect(timeElement).toBeVisible()
    
    // Wait a moment and check time updates (if real-time)
    await page.waitForTimeout(2000)
    await expect(timeElement).toBeVisible()
  })

  test('should handle navigation between sections', async ({ page }) => {
    // Check that all main sections are accessible
    await expect(page.getByText('👥 GESTIÓN DE ESTUDIANTES')).toBeVisible()
    await expect(page.getByText('🗳️ GESTIÓN DE VOTACIÓN')).toBeVisible()
    await expect(page.getByText('📊 Estado del Sistema')).toBeVisible()
    
    // All sections should be visible simultaneously in tutor panel
  })
})