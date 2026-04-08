/**
 * Test Data Seeding & Cleanup Script
 *
 * Use this to seed test data via API before test runs or clean up after.
 * Designed for applications with RESTful API endpoints.
 *
 * Note: demoqa.com doesn't have real backend API, so this is a template
 * for production applications.
 *
 * Usage:
 *   npx ts-node scripts/seed-and-cleanup.ts --seed     # Seed data
 *   npx ts-node scripts/seed-and-cleanup.ts --cleanup   # Clean data
 *   npx ts-node scripts/seed-and-cleanup.ts --reset     # Reset everything
 */

import axios, { AxiosInstance } from 'axios';
import { TestData } from '../test-data/factory';
import { generateRunId } from '../helpers/test-lifecycle';

interface SeedingConfig {
  baseUrl: string;
  runId: string;
  timeout: number;
  retryCount: number;
  batchSize: number;
}

interface SeededResources {
  userIds: string[];
  productIds: string[];
  bookIds: string[];
  runId: string;
  seedTime: Date;
}

class DataSeedingManager {
  private client: AxiosInstance;
  private config: SeedingConfig;
  private seedLog: SeededResources;

  constructor(config: Partial<SeedingConfig> = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.API_BASE_URL || 'https://demoqa.com/api',
      runId: config.runId || generateRunId(),
      timeout: config.timeout || 10_000,
      retryCount: config.retryCount || 3,
      batchSize: config.batchSize || 5,
    };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
    });

    this.seedLog = {
      userIds: [],
      productIds: [],
      bookIds: [],
      runId: this.config.runId,
      seedTime: new Date(),
    };

    console.log(`[Seeding] Initialized with run ID: ${this.config.runId}`);
  }

  /**
   * Seed test users.
   * For demoqa.com without real API, this is a template.
   */
  async seedUsers(count: number = 3): Promise<string[]> {
    console.log(`[Seeding] Creating ${count} test users...`);

    const userIds: string[] = [];
    for (let i = 0; i < count; i++) {
      try {
        const user = TestData.user();
        // In a real app, this would POST to /api/users
        // const response = await this.client.post('/users', { ...user, runId: this.config.runId });
        // const id = response.data.id;
        // userIds.push(id);

        // For template purposes, generate an ID
        const id = `user-${this.config.runId}-${i}`;
        userIds.push(id);
        console.log(`  ✓ User ${i + 1}/${count}: ${id}`);
      } catch (error) {
        console.error(`  ✗ Failed to create user ${i + 1}: ${(error as Error).message}`);
      }
    }

    this.seedLog.userIds = userIds;
    return userIds;
  }

  /**
   * Seed test products.
   */
  async seedProducts(count: number = 5): Promise<string[]> {
    console.log(`[Seeding] Creating ${count} test products...`);

    const productIds: string[] = [];
    for (let i = 0; i < count; i++) {
      try {
        const product = TestData.product();
        // In a real app: const response = await this.client.post('/products', { ...product, runId });
        // const id = response.data.id;

        const id = `product-${this.config.runId}-${i}`;
        productIds.push(id);
        console.log(`  ✓ Product ${i + 1}/${count}: ${id}`);
      } catch (error) {
        console.error(`  ✗ Failed to create product ${i + 1}: ${(error as Error).message}`);
      }
    }

    this.seedLog.productIds = productIds;
    return productIds;
  }

  /**
   * Seed test books for Book Store tests.
   */
  async seedBooks(count: number = 3): Promise<string[]> {
    console.log(`[Seeding] Creating ${count} test books...`);

    const bookIds: string[] = [];
    for (let i = 0; i < count; i++) {
      try {
        const book = TestData.book();
        // In a real app: const response = await this.client.post('/books', { ...book, runId });

        const id = `book-${this.config.runId}-${i}`;
        bookIds.push(id);
        console.log(`  ✓ Book ${i + 1}/${count}: ${id}`);
      } catch (error) {
        console.error(`  ✗ Failed to create book ${i + 1}: ${(error as Error).message}`);
      }
    }

    this.seedLog.bookIds = bookIds;
    return bookIds;
  }

  /**
   * Clean up all seeded resources for a given run ID.
   */
  async cleanup(runId: string = this.config.runId): Promise<void> {
    console.log(`[Cleanup] Cleaning up resources for run: ${runId}`);

    // Delete users
    if (this.seedLog.userIds.length > 0) {
      await this.batchDelete(`/users`, this.seedLog.userIds);
    }

    // Delete products
    if (this.seedLog.productIds.length > 0) {
      await this.batchDelete(`/products`, this.seedLog.productIds);
    }

    // Delete books
    if (this.seedLog.bookIds.length > 0) {
      await this.batchDelete(`/books`, this.seedLog.bookIds);
    }

    console.log(`[Cleanup] ✓ Cleanup complete`);
  }

  /**
   * Batch delete resources.
   */
  private async batchDelete(endpoint: string, ids: string[]): Promise<void> {
    console.log(`[Cleanup] Deleting ${ids.length} resources from ${endpoint}...`);

    const results = await Promise.allSettled(
      ids.map((id) => this.client.delete(`${endpoint}/${id}`)),
    );

    const failed = results.filter((r) => r.status === 'rejected').length;
    const succeeded = ids.length - failed;

    console.log(`[Cleanup] ${succeeded}/${ids.length} deleted from ${endpoint}`);

    if (failed > 0) {
      console.warn(`[Cleanup] ${failed} deletions failed (ignoring for idempotency)`);
    }
  }

  /**
   * Seed all default test data.
   */
  async seedAll(): Promise<SeededResources> {
    console.log(`[Seeding] ============================================`);
    console.log(`[Seeding] Run ID: ${this.config.runId}`);
    console.log(`[Seeding] Base URL: ${this.config.baseUrl}`);
    console.log(`[Seeding] ============================================\n`);

    try {
      await this.seedUsers(3);
      await this.seedProducts(5);
      await this.seedBooks(3);

      console.log(`\n[Seeding] ✓ All seeding complete`);
      return this.seedLog;
    } catch (error) {
      console.error(`\n[Seeding] ✗ Seeding failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Save seed log to file for reference.
   */
  async saveSeedLog(filename: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs');
    const path = require('path');

    const dir = path.dirname(filename);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filename, JSON.stringify(this.seedLog, null, 2));
    console.log(`[Seeding] Seed log saved to: ${filename}`);
  }
}

// ============================================================================
// CLI SCRIPT
// ============================================================================

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] || '--help';

  const manager = new DataSeedingManager();

  try {
    switch (command) {
      case '--seed':
        await manager.seedAll();
        await manager.saveSeedLog('test-results/seed-log.json');
        break;

      case '--cleanup':
        await manager.cleanup();
        break;

      case '--reset':
        console.log('[Reset] Full reset not implemented (would require DB reset)');
        await manager.cleanup();
        break;

      case '--help':
        console.log(`
Test Data Seeding & Cleanup Script

Usage:
  npx ts-node scripts/seed-and-cleanup.ts [command]

Commands:
  --seed       Seed test data for test runs
  --cleanup    Clean up test data after runs
  --reset      Full reset (seed + cleanup)
  --help       Show this help message

Environment Variables:
  API_BASE_URL    API base URL (default: https://demoqa.com/api)
  TEST_TIMEOUT    Request timeout in ms (default: 10000)

Example:
  npx ts-node scripts/seed-and-cleanup.ts --seed
  npx ts-node scripts/seed-and-cleanup.ts --cleanup
        `);
        break;

      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error) {
    console.error(`[Error] ${(error as Error).message}`);
    process.exit(1);
  }
}

// Run if this is the main module
if (require.main === module) {
  main();
}

export { DataSeedingManager, SeedingConfig, SeededResources };
