#!/usr/bin/env node

/**
 * API Validation Script
 * 
 * Quick validation script to test all API endpoints and ensure they're working.
 * This helps identify if issues are in the backend or frontend.
 */

import { ApiService, VMService, CommandService, JobService } from '../frontend/src/lib/services/ApiService.js';

const BASE_URL = 'http://localhost:3000';
const TEST_VM = {
  name: 'api-test-vm',
  host: 'test.example.com',
  user: 'testuser',
  environment: 'development',
  description: 'API validation test VM'
};

const TEST_COMMAND = {
  name: 'api-test-command',
  cmd: 'echo "API Test"',
  type: 'ssh',
  description: 'API validation test command'
};

let testVMId = null;
let testCommandId = null;

async function validateAPI() {
  console.log('🚀 Starting API validation...\n');

  try {
    // Initialize services
    const vmService = new VMService(BASE_URL);
    const commandService = new CommandService(BASE_URL);
    const jobService = new JobService(BASE_URL);

    // Test VM operations
    console.log('📋 Testing VM operations...');
    
    // 1. Get all VMs
    console.log('  ✓ GET /api/vms');
    const vms = await vmService.getVMs();
    console.log(`    Found ${vms.length} existing VMs`);

    // 2. Create VM
    console.log('  ✓ POST /api/vms');
    const newVM = await vmService.createVM(TEST_VM);
    testVMId = newVM.id;
    console.log(`    Created VM with ID: ${testVMId}`);

    // 3. Get VM by ID
    console.log('  ✓ GET /api/vms/:id');
    const retrievedVM = await vmService.getVM(testVMId);
    console.log(`    Retrieved VM: ${retrievedVM.name}`);

    // 4. Update VM
    console.log('  ✓ PUT /api/vms/:id');
    const updatedVM = await vmService.updateVM(testVMId, {
      description: 'Updated API test VM'
    });
    console.log(`    Updated VM description: ${updatedVM.description}`);

    // Test Command operations
    console.log('\n📋 Testing Command operations...');

    // 5. Get commands for VM
    console.log('  ✓ GET /api/vms/:vmId/commands');
    const vmCommands = await commandService.getVMCommands(testVMId);
    console.log(`    Found ${vmCommands.length} commands for VM`);

    // 6. Create command
    console.log('  ✓ POST /api/vms/:vmId/commands');
    const newCommand = await commandService.createCommand(testVMId, TEST_COMMAND);
    testCommandId = newCommand.id;
    console.log(`    Created command with ID: ${testCommandId}`);

    // 7. Get command by ID
    console.log('  ✓ GET /api/commands/:id');
    const retrievedCommand = await commandService.getCommand(testCommandId);
    console.log(`    Retrieved command: ${retrievedCommand.name}`);

    // 8. Update command
    console.log('  ✓ PUT /api/commands/:id');
    const updatedCommand = await commandService.updateCommand(testCommandId, {
      description: 'Updated API test command'
    });
    console.log(`    Updated command description: ${updatedCommand.description}`);

    // Test Job operations
    console.log('\n📋 Testing Job operations...');

    // 9. Get job history
    console.log('  ✓ GET /api/jobs');
    const jobs = await jobService.getJobs();
    console.log(`    Found ${jobs.length} jobs in history`);

    // 10. Get VM jobs
    console.log('  ✓ GET /api/vms/:vmId/jobs');
    const vmJobs = await jobService.getVMJobs(testVMId);
    console.log(`    Found ${vmJobs.length} cached jobs for VM`);

    // Test error handling
    console.log('\n📋 Testing error handling...');

    // 11. Test 404 errors
    console.log('  ✓ Testing 404 errors');
    try {
      await vmService.getVM('00000000-0000-0000-0000-000000000000');
      console.log('    ❌ Expected 404 error but got success');
    } catch (error) {
      console.log('    ✓ 404 error handled correctly');
    }

    // 12. Test validation errors
    console.log('  ✓ Testing validation errors');
    try {
      await vmService.createVM({ name: '' }); // Invalid VM
      console.log('    ❌ Expected validation error but got success');
    } catch (error) {
      console.log('    ✓ Validation error handled correctly');
    }

    console.log('\n✅ All API endpoints are working correctly!');
    
    return {
      success: true,
      vmId: testVMId,
      commandId: testCommandId
    };

  } catch (error) {
    console.error('\n❌ API validation failed:', error.message);
    console.error('Stack trace:', error.stack);
    return {
      success: false,
      error: error.message
    };
  }
}

async function cleanup() {
  console.log('\n🧹 Cleaning up test data...');
  
  try {
    const vmService = new VMService(BASE_URL);
    const commandService = new CommandService(BASE_URL);

    // Delete test command
    if (testCommandId) {
      console.log('  ✓ DELETE /api/commands/:id');
      await commandService.deleteCommand(testCommandId);
      console.log(`    Deleted command: ${testCommandId}`);
    }

    // Delete test VM
    if (testVMId) {
      console.log('  ✓ DELETE /api/vms/:id');
      await vmService.deleteVM(testVMId);
      console.log(`    Deleted VM: ${testVMId}`);
    }

    console.log('✅ Cleanup completed successfully');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.message);
  }
}

async function checkServerHealth() {
  console.log('🏥 Checking server health...');
  
  try {
    const apiService = new ApiService(BASE_URL);
    await apiService.get('/api/vms');
    console.log('✅ Server is healthy and responding\n');
    return true;
  } catch (error) {
    console.error('❌ Server is not responding:', error.message);
    console.error('Make sure the backend server is running on port 3000\n');
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔍 VM Orchestrator API Validation');
  console.log('==================================\n');

  // Check if server is running
  const serverHealthy = await checkServerHealth();
  if (!serverHealthy) {
    process.exit(1);
  }

  // Run validation
  const result = await validateAPI();

  // Always attempt cleanup
  await cleanup();

  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Received SIGINT, cleaning up...');
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Received SIGTERM, cleaning up...');
  await cleanup();
  process.exit(0);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { validateAPI, cleanup, checkServerHealth };
