import { SSHManager } from "./SSHManager.js";
import { VMsRepository } from "../VMsRepository.js";
import { checkVM } from "../vmUtils.js";

// cache of last refresh
let cache = {
  timestamp: 0,
  vms: [],
};
const CACHE_TTL = 10 * 60 * 1000; // 10 min
const repo = new VMsRepository();

/**
 * Ensure all SSH hosts are present in /api/vms table
 */
export async function autoRegisterVms(force = false) {
  console.log("[vmAutoRegister] autoRegisterVms()");
  console.log("--------------------------------");

  let backendVMs = null;
  if (!force && Date.now() - cache.timestamp < CACHE_TTL) {
    backendVMs = cache.vms;
  }

  try {
    const hosts = SSHManager.getAllHosts();
    console.log("[vmAutoRegister] hosts:", hosts);
    console.log("--------------------------------");

    if (backendVMs === null) {
      backendVMs = await repo.getVMs();
      cache.vms = backendVMs;
      cache.timestamp = Date.now();
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
          const newVM = await repo.createVM(payload);
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

    return vms.filter(checkVM);
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
