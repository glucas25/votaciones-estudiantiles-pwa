import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display homepage with role selection', async ({ page }) => {
    await expect(page.getByText('🏫 SISTEMA DE VOTACIÓN ESTUDIANTIL')).toBeVisible()
    await expect(page.getByText('Seleccione su rol de acceso:')).toBeVisible()
    
    // Check role cards
    await expect(page.getByText('Docente/Tutor')).toBeVisible()
    await expect(page.getByText('Administrador')).toBeVisible()
    
    // Check system info
    await expect(page.getByText('ℹ️ Información del Sistema')).toBeVisible()
  })

  test('should navigate to tutor login', async ({ page }) => {
    await page.getByText('Docente/Tutor').click()
    
    await expect(page.getByText('👨‍🏫 ACCESO DOCENTE')).toBeVisible()
    await expect(page.getByPlaceholder('Ingrese su código de activación')).toBeVisible()
  })

  test('should navigate to admin login', async ({ page }) => {
    await page.getByText('Administrador').click()
    
    await expect(page.getByText('🏛️ ACCESO ADMINISTRATIVO')).toBeVisible()
    await expect(page.getByPlaceholder('Ingrese su usuario')).toBeVisible()
    await expect(page.getByPlaceholder('Ingrese su contraseña')).toBeVisible()
  })

  test('should login as admin successfully', async ({ page }) => {
    await page.getByText('Administrador').click()
    
    await page.getByPlaceholder('Ingrese su usuario').fill('admin')
    await page.getByPlaceholder('Ingrese su contraseña').fill('admin2024')
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
    
    // Should see admin dashboard
    await expect(page.getByText('🏛️ PANEL DE ADMINISTRACIÓN')).toBeVisible()
    await expect(page.getByText('👤 Administrador')).toBeVisible()
  })

  test('should show error for invalid admin credentials', async ({ page }) => {
    await page.getByText('Administrador').click()
    
    await page.getByPlaceholder('Ingrese su usuario').fill('admin')
    await page.getByPlaceholder('Ingrese su contraseña').fill('wrongpassword')
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
    
    await expect(page.getByText('❌ Credenciales incorrectas')).toBeVisible()
  })

  test('should login as tutor successfully', async ({ page }) => {
    await page.getByText('Docente/Tutor').click()
    
    await page.getByPlaceholder('Ingrese su código de activación').fill('BCH1A2024')
    await page.getByRole('button', { name: 'Acceder al Sistema' }).click()
    
    // Should see tutor panel
    await expect(page.getByText('📱 Gestión de Votación')).toBeVisible()
    await expect(page.getByText('📱 1ro Bach A')).toBeVisible()
  })

  test('should show error for invalid tutor code', async ({ page }) => {
    await page.getByText('Docente/Tutor').click()
    
    await page.getByPlaceholder('Ingrese su código de activación').fill('INVALID')
    await page.getByRole('button', { name: 'Acceder al Sistema' }).click()
    
    await expect(page.getByText('❌ Código de activación inválido')).toBeVisible()
  })

  test('should handle form validation', async ({ page }) => {
    // Test admin form validation
    await page.getByText('Administrador').click()
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
    
    // Browser validation should prevent submission
    const usernameInput = page.getByPlaceholder('Ingrese su usuario')
    await expect(usernameInput).toBeFocused()
    
    // Test tutor form validation
    await page.goto('/')
    await page.getByText('Docente/Tutor').click()
    await page.getByRole('button', { name: 'Acceder al Sistema' }).click()
    
    const codeInput = page.getByPlaceholder('Ingrese su código de activación')
    await expect(codeInput).toBeFocused()
  })

  test('should logout successfully', async ({ page }) => {
    // Login as admin first
    await page.getByText('Administrador').click()
    await page.getByPlaceholder('Ingrese su usuario').fill('admin')
    await page.getByPlaceholder('Ingrese su contraseña').fill('admin2024')
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
    
    // Wait for dashboard to load
    await expect(page.getByText('🏛️ PANEL DE ADMINISTRACIÓN')).toBeVisible()
    
    // Logout
    await page.getByRole('button', { name: '🚪 Salir' }).click()
    
    // Should return to homepage
    await expect(page.getByText('🏫 SISTEMA DE VOTACIÓN ESTUDIANTIL')).toBeVisible()
  })

  test('should maintain session on page reload', async ({ page }) => {
    // Login as admin
    await page.getByText('Administrador').click()
    await page.getByPlaceholder('Ingrese su usuario').fill('admin')
    await page.getByPlaceholder('Ingrese su contraseña').fill('admin2024')
    await page.getByRole('button', { name: 'Iniciar Sesión' }).click()
    
    await expect(page.getByText('🏛️ PANEL DE ADMINISTRACIÓN')).toBeVisible()
    
    // Reload page
    await page.reload()
    
    // Should still be logged in
    await expect(page.getByText('🏛️ PANEL DE ADMINISTRACIÓN')).toBeVisible()
  })

  test('should handle keyboard navigation', async ({ page }) => {
    await page.getByText('Administrador').click()
    
    const usernameInput = page.getByPlaceholder('Ingrese su usuario')
    const passwordInput = page.getByPlaceholder('Ingrese su contraseña')
    
    await usernameInput.fill('admin')
    await usernameInput.press('Tab')
    
    await expect(passwordInput).toBeFocused()
    
    await passwordInput.fill('admin2024')
    await passwordInput.press('Enter')
    
    // Should login
    await expect(page.getByText('🏛️ PANEL DE ADMINISTRACIÓN')).toBeVisible()
  })
})