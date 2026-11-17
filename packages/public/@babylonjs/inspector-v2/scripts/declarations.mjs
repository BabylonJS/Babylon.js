import { cpSync, existsSync, rmSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function packageDeclarations(lib, shared) {
    const localShared = path.join(lib, "shared-ui-components");
    if (!existsSync(shared)) {
        throw new Error(`Shared UI declarations not found at ${shared}`);
    }
    rmSync(localShared, { recursive: true, force: true });
    cpSync(shared, localShared, { recursive: true, filter: (source) => statSync(source).isDirectory() || source.endsWith(".d.ts") });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const packageRoot = fileURLToPath(new URL("../", import.meta.url));
    const lib = path.join(packageRoot, "lib");
    if (process.argv.length === 2) {
        packageDeclarations(lib, path.resolve(packageRoot, "../../../dev/sharedUiComponents/dist"));
    } else {
        throw new Error(`Unknown declaration command: ${process.argv.slice(2).join(" ")}`);
    }
}
