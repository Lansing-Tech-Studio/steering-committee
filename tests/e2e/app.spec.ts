import { expect, test } from '@playwright/test'

test('home page can create a room and navigate into it', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { name: /Steering Committee/i })).toBeVisible()

  await page.getByLabel('Your Name').fill('E2E Tester')
  await page.getByRole('button', { name: 'Create Game' }).last().click()

  await expect(page).toHaveURL(/#\/room\/[A-Z0-9]{6}$/)
  await expect(page.getByText('Leave room')).toBeVisible()
})

test('room hash routes render and can return to home', async ({ page }) => {
  await page.goto('/#/room/ABC123')

  await expect(page.getByText('ABC123')).toBeVisible()
  await expect(page.getByText('Leave room')).toBeVisible()

  await page.getByRole('button', { name: 'Leave room' }).click()

  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByRole('heading', { name: /Steering Committee/i })).toBeVisible()
})