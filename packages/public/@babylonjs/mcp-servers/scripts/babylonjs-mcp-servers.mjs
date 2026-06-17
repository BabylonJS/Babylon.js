#!/usr/bin/env node

import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const serverAliases = new Map([
    ["flow-graph", "flow-graph-mcp-server.js"],
    ["flowgraph", "flow-graph-mcp-server.js"],
    ["gui", "gui-mcp-server.js"],
    ["nge", "nge-mcp-server.js"],
    ["node-geometry", "nge-mcp-server.js"],
    ["nme", "nme-mcp-server.js"],
    ["node-material", "nme-mcp-server.js"],
    ["npe", "npe-mcp-server.js"],
    ["node-particle", "npe-mcp-server.js"],
    ["nrge", "nrge-mcp-server.js"],
    ["node-render-graph", "nrge-mcp-server.js"],
    ["smart-filters", "smart-filters-mcp-server.js"],
    ["sfe", "smart-filters-mcp-server.js"],
]);

const [, , serverName, ...serverArguments] = process.argv;

if (!serverName || serverName === "--help" || serverName === "-h") {
    printUsage();
    process.exit(serverName ? 0 : 1);
}

const serverFile = serverAliases.get(serverName.toLowerCase());
if (!serverFile) {
    console.error(`Unknown Babylon.js MCP server "${serverName}".`);
    printUsage();
    process.exit(1);
}

const distDirectory = dirname(fileURLToPath(import.meta.url));
const child = spawn(process.execPath, [join(distDirectory, serverFile), ...serverArguments], { stdio: "inherit" });

child.on("exit", (code, signal) => {
    if (signal) {
        process.kill(process.pid, signal);
        return;
    }

    process.exit(code ?? 0);
});

child.on("error", (error) => {
    console.error(error.message);
    process.exit(1);
});

function printUsage() {
    console.error(`Usage: babylonjs-mcp-servers <server>

Servers:
  nme                 Node Material Editor
  nge                 Node Geometry Editor
  nrge                Node Render Graph Editor
  npe                 Node Particle Editor
  gui                 GUI Editor
  flow-graph          Flow Graph Editor
  smart-filters       Smart Filters Editor
`);
}
