import { chmod, copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const repositoryRoot = join(packageRoot, "../../../..");
const distDirectory = join(packageRoot, "dist");

const servers = [
    { packagePath: "packages/tools/flow-graph-mcp-server", outputName: "flow-graph-mcp-server.js" },
    { packagePath: "packages/tools/gui-mcp-server", outputName: "gui-mcp-server.js" },
    { packagePath: "packages/tools/nge-mcp-server", outputName: "nge-mcp-server.js" },
    { packagePath: "packages/tools/nme-mcp-server", outputName: "nme-mcp-server.js" },
    { packagePath: "packages/tools/npe-mcp-server", outputName: "npe-mcp-server.js" },
    { packagePath: "packages/tools/nrge-mcp-server", outputName: "nrge-mcp-server.js" },
    { packagePath: "packages/tools/smart-filters-mcp-server", outputName: "smart-filters-mcp-server.js" },
];

await mkdir(distDirectory, { recursive: true });
await copyDispatcherAsync();

for (const server of servers) {
    await copyServerBundleAsync(server.packagePath, server.outputName);
}

async function copyDispatcherAsync() {
    const dispatcherSource = join(packageRoot, "scripts/babylonjs-mcp-servers.mjs");
    const dispatcherDestination = join(distDirectory, "babylonjs-mcp-servers.js");
    await copyFile(dispatcherSource, dispatcherDestination);
    await chmod(dispatcherDestination, 0o755);
}

async function copyServerBundleAsync(packagePath, outputName) {
    const sourceFile = join(repositoryRoot, packagePath, "dist/index.js");
    const sourceMapFile = join(repositoryRoot, packagePath, "dist/index.js.map");
    const destinationFile = join(distDirectory, outputName);
    const destinationMapFile = `${destinationFile}.map`;
    const destinationMapName = `${outputName}.map`;

    const source = await readFile(sourceFile, "utf8");
    await writeFile(destinationFile, source.replace(/sourceMappingURL=index\.js\.map\s*$/u, `sourceMappingURL=${destinationMapName}`));
    await chmod(destinationFile, 0o755);

    const sourceMap = JSON.parse(await readFile(sourceMapFile, "utf8"));
    sourceMap.file = outputName;
    await writeFile(destinationMapFile, `${JSON.stringify(sourceMap)}\n`);
}
