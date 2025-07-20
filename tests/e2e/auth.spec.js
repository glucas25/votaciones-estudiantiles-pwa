import { test, expect } from '@playwright/test'

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/')
  })

  test.describe('Homepage', () => {
    test('should display main navigation options', async ({ page }) => {
      // Check main title
      await expect(page.getByText(/sistema de votación/i)).toBeVisible()
      
      // Check role selection buttons
      await expect(page.getByRole('button', { name: /administrador/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /docente\/tutor/i })).toBeVisible()
      await expect(page.getByRole('button', { name: /estudiante/i })).toBeVisible()
    })

    test('should navigate to admin login when admin button is clicked', async ({ page }) => {
      await page.getByRole('button', { name: /administrador/i }).click()
      
      // Should show admin login form
      await expect(page.getByText(/acceso administrador/i)).toBeVisible()
      await expect(page.getByPlaceholder('Usuario')).toBeVisible()
      await expect(page.getByPlaceholder('Contraseña')).toBeVisible()
    })

    test('should navigate to tutor login when tutor button is clicked', async ({ page }) => {
      await page.getByRole('button', { name: /docente\/tutor/i }).click()
      
      // Should show tutor login form
      await expect(page.getByText(/acceso docente/i)).toBeVisible()
      await expect(page.getByPlaceholder(/código de activación/i)).toBeVisible()
    })
  })

  test.describe('Admin Authentication', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to admin login
      await page.goto('/')
      await page.getByRole('button', { name: /administrador/i }).click()
    })

    test('should display admin login form correctly', async ({ page }) => {
      await expect(page.getByText(/acceso administrador/i)).toBeVisible()
      await expect(page.getByPlaceholder('Usuario')).toBeVisible()
      await expect(page.getByPlaceholder('Contraseña')).toBeVisible()
      await expect(page.getByRole('button', { name: 'Acceder' })).toBeVisible()
      await expect(page.getByRole('button', { name: 'Cancelar' })).toBeVisible()
    })

    test('should validate required fields', async ({ page }) => {
      const submitButton = page.getByRole('button', { name: 'Acceder' })
      
      // Try to submit empty form
      await submitButton.click()
      
      // Should show validation error
      await expect(page.getByText(/complete todos los campos/i)).toBeVisible()
    })

    test('should handle successful admin login', async ({ page }) => {
      // Fill login form
      await page.getByPlaceholder('Usuario').fill('admin')
      await page.getByPlaceholder('Contraseña').fill('admin2024')
      await page.getByRole('button', { name: 'Acceder' }).click()
      
      // Should redirect to admin dashboard
      await expect(page.getByText(/panel de administración/i)).toBeVisible()
    })

    test('should handle failed admin login', async ({ page }) => {
      // Fill login form with wrong credentials
      await page.getByPlaceholder('Usuario').fill('admin')
      await page.getByPlaceholder('Contraseña').fill('wrongpassword')
      await page.getByRole('button', { name: 'Acceder' }).click()
      
      // Should show error message
      await expect(page.getByText(/credenciales incorrectas/i)).toBeVisible()
      
      // Should stay on login page
      await expect(page.getByText(/acceso administrador/i)).toBeVisible()
    })

    test('should toggle password visibility', async ({ page }) => {
      const passwordInput = page.getByPlaceholder('Contraseña')
      const toggleButton = page.getByRole('button', { name: /toggle password/i })
      
      // Password should be hidden by default
      await expect(passwordInput).toHaveAttribute('type', 'password')
      
      // Click to show password
      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'text')
      
      // Click to hide password again
      await toggleButton.click()
      await expect(passwordInput).toHaveAttribute('type', 'password')
    })

    test('should handle keyboard navigation', async ({ page }) => {
      const usernameInput = page.getByPlaceholder('Usuario')
      const passwordInput = page.getByPlaceholder('Contraseña')
      
      // Focus username and tab to password
      await usernameInput.click()
      await page.keyboard.press('Tab')
      
      // Password should be focused
      await expect(passwordInput).toBeFocused()
      
      // Type credentials and press Enter
      await usernameInput.fill('admin')
      await passwordInput.fill('admin2024')
      await page.keyboard.press('Enter')
      
      // Should submit form
      await expect(page.getByText(/panel de administración/i)).toBeVisible()
    })

    test('should cancel login and return to homepage', async ({ page }) => {
      await page.getByRole('button', { name: 'Cancelar' }).click()
      
      // Should return to homepage
      await expect(page.getByText(/sistema de votación/i)).toBeVisible()
    })
  })

  test.describe('Tutor Authentication', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to tutor login
      await page.goto('/')
      await page.getByRole('button', { name: /docente\/tutor/i }).click()
    })

    test('should display tutor login form correctly', async ({ page }) => {
      await expect(page.getByText(/acceso docente/i)).toBeVisible()
      await expect(page.getByPlaceholder(/código de activación/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /acceder al sistema/i })).toBeVisible()
    })

    test('should validate activation code format', async ({ page }) => {
      const codeInput = page.getByPlaceholder(/código de activación/i)
      const submitButton = page.getByRole('button', { name: /acceder al sistema/i })
      
      // Try to submit empty form
      await submitButton.click()
      
      // Should show validation error
      await expect(page.getByText(/código de activación es requerido/i)).toBeVisible()
    })

    test('should handle successful tutor login', async ({ page }) => {
      // Fill activation code
      await page.getByPlaceholder(/código de activación/i).fill('BCH1A2024')
      await page.getByRole('button', { name: /acceder al sistema/i }).click()
      
      // Should redirect to tutor panel
      await expect(page.getByText(/gestión de votación/i)).toBeVisible()
      await expect(page.getByText(/1ro Bach A/i)).toBeVisible()
    })

    test('should handle failed tutor login', async ({ page }) => {
      // Fill invalid activation code
      await page.getByPlaceholder(/código de activación/i).fill('INVALID_CODE')
      await page.getByRole('button', { name: /acceder al sistema/i }).click()
      
      // Should show error message
      await expect(page.getByText(/código de activación inválido/i)).toBeVisible()
      
      // Should stay on login page
      await expect(page.getByText(/acceso docente/i)).toBeVisible()
    })

    test('should handle different education levels', async ({ page }) => {
      const validCodes = [
        { code: 'BCH1A2024', level: 'BACHILLERATO', course: '1ro Bach A' },
        { code: 'BSP8A2024', level: 'BASICA_SUPERIOR', course: '8vo A' },
        { code: 'BMD5A2024', level: 'BASICA_MEDIA', course: '5to A' }
      ]

      for (const { code, level, course } of validCodes) {
        // Navigate to tutor login
        await page.goto('/')
        await page.getByRole('button', { name: /docente\/tutor/i }).click()
        
        // Fill activation code
        await page.getByPlaceholder(/código de activación/i).fill(code)
        await page.getByRole('button', { name: /acceder al sistema/i }).click()
        
        // Should redirect to tutor panel with correct info
        await expect(page.getByText(/gestión de votación/i)).toBeVisible()
        await expect(page.getByText(course)).toBeVisible()
      }
    })
  })

  test.describe('Session Management', () => {
    test('should persist admin session across page reloads', async ({ page }) => {
      // Login as admin
      await page.goto('/')
      await page.getByRole('button', { name: /administrador/i }).click()
      await page.getByPlaceholder('Usuario').fill('admin')
      await page.getByPlaceholder('Contraseña').fill('admin2024')
      await page.getByRole('button', { name: 'Acceder' }).click()
      
      // Should be on admin dashboard
      await expect(page.getByText(/panel de administración/i)).toBeVisible()
      
      // Reload page
      await page.reload()
      
      // Should still be on admin dashboard
      await expect(page.getByText(/panel de administración/i)).toBeVisible()
    })

    test('should persist tutor session across page reloads', async ({ page }) => {
      // Login as tutor
      await page.goto('/')
      await page.getByRole('button', { name: /docente\/tutor/i }).click()
      await page.getByPlaceholder(/código de activación/i).fill('BCH1A2024')
      await page.getByRole('button', { name: /acceder al sistema/i }).click()
      
      // Should be on tutor panel
      await expect(page.getByText(/gestión de votación/i)).toBeVisible()
      
      // Reload page
      await page.reload()
      
      // Should still be on tutor panel
      await expect(page.getByText(/gestión de votación/i)).toBeVisible()
    })

    test('should logout and return to homepage', async ({ page }) => {
      // Login as admin first
      await page.goto('/')
      await page.getByRole('button', { name: /administrador/i }).click()
      await page.getByPlaceholder('Usuario').fill('admin')
      await page.getByPlaceholder('Contraseña').fill('admin2024')
      await page.getByRole('button', { name: 'Acceder' }).click()
      
      // Should be on admin dashboard
      await expect(page.getByText(/panel de administración/i)).toBeVisible()
      
      // Logout
      await page.getByRole('button', { name: /🚪 salir/i }).click()
      
      // Should return to homepage
      await expect(page.getByText(/sistema de votación/i)).toBeVisible()
    })
  })

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Mock network error
      await page.route('**/api/**', route => route.abort())
      
      // Try to login
      await page.goto('/')
      await page.getByRole('button', { name: /administrador/i }).click()
      await page.getByPlaceholder('Usuario').fill('admin')
      await page.getByPlaceholder('Contraseña').fill('admin2024')
      await page.getByRole('button', { name: 'Acceder' }).click()
      
      // Should show error message
      await expect(page.getByText(/error de conexión/i)).toBeVisible()
    })

    test('should handle offline mode', async ({ page }) => {
      // Go offline
      await page.context.setOffline(true)
      
      // Try to login
      await page.goto('/')
      await page.getByRole('button', { name: /administrador/i }).click()
      await page.getByPlaceholder('Usuario').fill('admin')
      await page.getByPlaceholder('Contraseña').fill('admin2024')
      await page.getByRole('button', { name: 'Acceder' }).click()
      
      // Should handle offline mode gracefully
      await expect(page.getByText(/modo sin conexión/i)).toBeVisible()
    })
  })

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /administrador/i }).click()
      
      const usernameInput = page.getByPlaceholder('Usuario')
      const passwordInput = page.getByPlaceholder('Contraseña')
      
      await expect(usernameInput).toHaveAttribute('aria-label', 'Usuario administrador')
      await expect(passwordInput).toHaveAttribute('aria-label', 'Contraseña administrador')
    })

    test('should support keyboard navigation', async ({ page }) => {
      await page.goto('/')
      
      // Navigate with keyboard
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      
      // Should navigate to admin login
      await expect(page.getByText(/acceso administrador/i)).toBeVisible()
    })

    test('should have proper focus management', async ({ page }) => {
      await page.goto('/')
      await page.getByRole('button', { name: /administrador/i }).click()
      
      const usernameInput = page.getByPlaceholder('Usuario')
      
      // Focus should be on username input
      await expect(usernameInput).toBeFocused()
    })
  })

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      await page.goto('/')
      
      // Should display correctly on mobile
      await expect(page.getByText(/sistema de votación/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /administrador/i })).toBeVisible()
    })

    test('should work on tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 })
      
      await page.goto('/')
      
      // Should display correctly on tablet
      await expect(page.getByText(/sistema de votación/i)).toBeVisible()
      await expect(page.getByRole('button', { name: /administrador/i })).toBeVisible()
    })
  })
})