import { SSHManager } from "./ssh-manager.js";
import { serverlessAPI } from "../../clients/serverless-api-client.js";
import { checkVM } from "./vmAuth.js";

// cache of last refresh
let cache = {
  timestamp: 0,
  vms: [],
};
const CACHE_TTL = 10 * 60 * 1000; // 10 min

/**
 * Ensure all SSH hosts are present in /api/vms table
 */
export async function syncSshHostsToVms(force = false) {
  let backendVMs = null;
  if (!force && Date.now() - cache.timestamp < CACHE_TTL) {
    console.log("📋 SSH host sync skipped - cache still valid");
    backendVMs = cache.vms;
  }

  try {
    console.log("🔄 Syncing SSH hosts to VMs database...");

    const hosts = SSHManager.getAllHosts();
    if (backendVMs === null) {
      backendVMs = await serverlessAPI.getVMs();
      cache.vms = backendVMs;
      cache.timestamp = Date.now();
      console.log(" - cache updated");
      console.log(" -- vms:", backendVMs.length);
      console.log(" -- timestamp:", cache.timestamp);
    }

    const existingAliases = new Set(backendVMs.map((v) => v.alias || v.name));

    let syncedCount = 0;

    let vms = backendVMs;

    for (const host of hosts) {
      if (!existingAliases.has(host.alias)) {
        const payload = {
          name: host.suggestedVMName,
          host: host.config.host,
          user: host.config.user,
          port: host.config.port || 22,
          environment: "development",
          alias: host.alias,
          description: `Auto-registered from SSH host: ${host.alias}`,
        };

        try {
          const newVM = await serverlessAPI.createVM(payload);
          syncedCount++;
          vms.push(newVM);
        } catch (err) {
          // Ignore duplicate race conditions
          if (!err.message.includes("already exists")) {
            console.warn(
              `⚠️ Failed to register SSH host ${host.alias}:`,
              err.message
            );
          }
        }
      }
    }

    cache.timestamp = Date.now();
    console.log(
      `✅ SSH host sync complete - ${syncedCount} new VMs registered from ${hosts.length} SSH hosts`
    );
    console.log(" - check:");
    console.log(" -- vms:", vms.length);
    console.log(" -- hosts:", hosts.length);
    const vmsAuthorized = vms.filter(checkVM);
    console.log(" -- vmsAuthorized:", vmsAuthorized.length);
    return vmsAuthorized;
  } catch (err) {
    console.error("❌ SSH host sync failed:", err.message);
    throw err;
  }
}

function transformSshHostsForFrontend(hosts) {
  // Transform for frontend consumption
  return hosts.map((host) => ({
    alias: host.alias,
    suggestedVMName: host.suggestedVMName,
    hostname: host.config.host,
    user: host.config.user,
    port: host.config.port,
    identityFile: host.config.identityFile,
    // Additional metadata for UI
    isCloudInstance:
      host.config.host &&
      (host.config.host.includes("amazonaws.com") ||
        host.config.host.includes("googleusercontent.com") ||
        host.config.host.includes("azure") ||
        host.config.host.includes("digitalocean")),
    cloudProvider: getCloudProvider(host.config.host),
  }));
}
