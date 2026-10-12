import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { watch } from "chokidar";
import { createServer, type ViteDevServer } from "vite";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import configFactory from "../../vite.config";

const Fixture = vi.hoisted(() => ({ directory: "" }));

vi.mock("chokidar", async (importOriginal) => {
    const original = await importOriginal<typeof import("chokidar")>();
    return {
        ...original,
        watch: vi.fn((_paths: Parameters<typeof original.watch>[0], options: Parameters<typeof original.watch>[1]) =>
            original.watch(Fixture.directory, { ...options, usePolling: true })
        ),
    };
});

describe("Babylon server source watcher", () => {
    let server: ViteDevServer | undefined;

    beforeEach(() => {
        Fixture.directory = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), "bjs-server-watch-")));
        vi.stubEnv("NO_WATCH", "false");
        vi.stubEnv("CDN_PORT", "1337");
        vi.spyOn(console, "log").mockImplementation(() => {});
    });

    afterEach(async () => {
        for (const result of vi.mocked(watch).mock.results) {
            if (result.type === "return") {
                await result.value.close();
            }
        }
        await server?.close();
        server = undefined;
        vi.mocked(watch).mockClear();
        vi.restoreAllMocks();
        vi.unstubAllEnvs();
        fs.rmSync(Fixture.directory, { recursive: true, force: true });
    });

    it("prunes nested dependency and Git directories without excluding similarly named source directories", async () => {
        const excluded = ["nested/node_modules/ignored.ts", "nested/.git/ignored.ts"];
        const included = ["nested/node_modules-source/source.ts", "nested/.github/source.ts"];
        for (const file of [...excluded, ...included]) {
            const absolute = path.join(Fixture.directory, file);
            fs.mkdirSync(path.dirname(absolute), { recursive: true });
            fs.writeFileSync(absolute, "export const initial = true;");
        }

        server = await createServer({ configFile: false, root: Fixture.directory, server: { watch: null } });
        vi.spyOn(process, "on").mockReturnValue(process);
        const config = configFactory({ command: "serve", mode: "development" });
        let configured = false;
        for (const option of config.plugins || []) {
            const plugin = await option;
            if (!plugin || Array.isArray(plugin) || plugin.name !== "babylon-server") {
                continue;
            }
            if (!("configureServer" in plugin) || typeof plugin.configureServer !== "function") {
                throw new Error("Expected the Babylon server configure hook");
            }
            await plugin.configureServer.call(server.environments.client.pluginContainer.minimalContext, server);
            configured = true;
        }
        expect(configured).toBe(true);
        expect(watch).toHaveBeenCalledTimes(1);
        const result = vi.mocked(watch).mock.results[0];
        if (result.type !== "return") {
            throw new Error("Expected the source watcher to start");
        }
        const watcher = result.value;
        const ignored = vi.mocked(watch).mock.calls[0][1]?.ignored;
        if (!(ignored instanceof RegExp)) {
            throw new Error("Expected a cross-platform source ignore expression");
        }
        for (const file of ["node_modules", ".git", "/source/node_modules/file.ts", "/source/.git/file.ts", "C:\\source\\node_modules\\file.ts", "C:\\source\\.git\\file.ts"]) {
            expect(ignored.test(file)).toBe(true);
        }
        for (const file of ["/source/node_modules-source/file.ts", "/source/.github/file.ts", "C:\\source\\node_modules-source\\file.ts", "C:\\source\\.github\\file.ts"]) {
            expect(ignored.test(file)).toBe(false);
        }
        await new Promise<void>((resolve) => watcher.once("ready", resolve));

        const watched = Object.keys(watcher.getWatched()).map((directory) => path.relative(Fixture.directory, directory).replace(/\\/g, "/"));
        expect(watched).not.toContain("nested/node_modules");
        expect(watched).not.toContain("nested/.git");
        expect(watched).toContain("nested/node_modules-source");
        expect(watched).toContain("nested/.github");

        const changes: string[] = [];
        watcher.on("change", (file) => changes.push(path.relative(Fixture.directory, file).replace(/\\/g, "/")));
        for (const file of [...excluded, ...included]) {
            fs.appendFileSync(path.join(Fixture.directory, file), "\nexport const changed = true;");
        }
        await vi.waitFor(() => expect(changes.sort()).toEqual([...included].sort()), { timeout: 5000 });
    });
});
