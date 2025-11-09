import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3000';
const ADMIN = { email: 'admin@idatum.com', password: 'Admin@123' };
const ABC_CORP = {
  name: 'ABC Corp',
  industry: 'IT Services',
  domain: 'abc.com',
  framework: 'ISO 27001',
  adminName: 'John Smith',
  adminEmail: 'himanshusochi@gmail.com'
};

test.describe('SESSION 1: QMS Super Admin Tests', () => {
  
  test('Test 1-1: Admin Login', async ({ page }) => {
    console.log('▶ Test 1-1: Admin Login & Dashboard');
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(ADMIN.email);
    await page.locator('input[type="password"]').fill(ADMIN.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    await expect(page).toHaveURL(/dashboard/);
    const adminFeatures = page.getByText('Organization Onboarding').or(page.getByText('Company Management')).or(page.locator('[href*="/companies"]'));
    await expect(adminFeatures.first()).toBeVisible();
    console.log('✅ Test 1-1 PASSED');
  });
  
  test('Test 1-2: Create ABC Corp', async ({ page }) => {
    console.log('▶ Test 1-2: Create ABC Corp Company');
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(ADMIN.email);
    await page.locator('input[type="password"]').fill(ADMIN.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
    await page.getByText('Organization Onboarding').click();
    await page.waitForTimeout(1000);
    await page.locator('input[name="companyName"]').fill(ABC_CORP.name);
    await page.locator('input[name="domain"]').fill(ABC_CORP.domain);
    await page.locator('input[name="adminName"]').fill(ABC_CORP.adminName);
    await page.locator('input[name="adminEmail"]').fill(ABC_CORP.adminEmail);
    await page.getByRole('button', { name: /create|submit/i }).click();
    await page.waitForTimeout(2000);
    await expect(page.getByText(ABC_CORP.name)).toBeVisible();
    console.log('✅ Test 1-2 PASSED');
  });
  
  test('Test 1-3 to 1-6: Email Verification Steps', async () => {
    console.log('▶ Tests 1-3 to 1-6: Manual email verification');
    console.log('ℹ️  Check himanshusochi@gmail.com for ABC Corp credentials');
    console.log('ℹ️  Check hjoshinitin1999@gmail.com for XYZ credentials');
    console.log('✅ Tests 1-3 to 1-6 DOCUMENTED');
  });
  
  test('Test 1-7: Data Isolation (CRITICAL)', async ({ page, request }) => {
    console.log('▶ Test 1-7: Data Isolation - QMS to Client (CRITICAL)');
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(ADMIN.email);
    await page.locator('input[type="password"]').fill(ADMIN.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
    const token = await page.evaluate(() => localStorage.getItem('token') || localStorage.getItem('authToken'));
    expect(token).toBeTruthy();
    const response = await request.get(`${BASE_URL}/api/tasks`, {
      headers: { 'Authorization': `Bearer ${token}` },
      failOnStatusCode: false
    });
    console.log(`  API Response Status: ${response.status()}`);
    if (response.status() === 200) {
      throw new Error('❌ CRITICAL: QMS Admin can access client data!');
    }
    expect([403, 404, 401]).toContain(response.status());
    console.log('✅ Test 1-7 PASSED: Data isolation enforced');
  });
  
  test('Test 1-8 to 1-10: Module Access & Logout', async ({ page }) => {
    console.log('▶ Tests 1-8 to 1-10: Module checks and JWT logout');
    await page.goto(`${BASE_URL}/login`);
    await page.locator('input[type="email"]').fill(ADMIN.email);
    await page.locator('input[type="password"]').fill(ADMIN.password);
    await page.locator('button[type="submit"]').click();
    await page.waitForURL('**/dashboard');
    await expect(page.getByText('Organization Onboarding').or(page.getByText('Companies'))).toBeVisible();
    const tokenBefore = await page.evaluate(() => localStorage.getItem('token'));
    expect(tokenBefore).toBeTruthy();
    await page.getByText('Logout').or(page.getByText('Sign Out')).or(page.locator('[aria-label="Logout"]')).click();
    await page.waitForURL('**/login', { timeout: 5000 });
    const tokenAfter = await page.evaluate(() => localStorage.getItem('token'));
    expect(tokenAfter).toBeFalsy();
    console.log('✅ Tests 1-8 to 1-10 PASSED');
  });
});

test.afterAll(async () => {
  console.log('\n' + '='.repeat(60));
  console.log('SESSION 1 COMPLETE: QMS Super Admin Tests');
  console.log('Total: 10 tests (grouped into 5 test cases)');
  console.log('='.repeat(60));
});
