/* eslint-disable no-console */
import { expect, test, type Page } from "@playwright/test";
import { evaluateCreateScene, evaluateDisposeEngine, evaluateInitEngine, getGlobalConfig } from "@tools/test-tools";
import * as fs from "fs";
import * as path from "path";

declare const BABYLON: typeof import("core/index") & typeof import("loaders/index");

interface IAssetCase {
    relativePath: string;
    filePath: string;
    kind: "conformance" | "showcase";
    descriptor?: ITestDescriptor;
}

interface ITestDescriptor {
    glbFileName: string;
    tests?: {
        entryPoints?: { delayedExecutionTime?: number }[];
        subTests?: {
            name: string;
            successResultVarId?: number;
            successResultVarName?: string;
        }[];
    }[];
}

interface IConsoleEntry {
    type: string;
    text: string;
}

interface IRoutedAsset {
    entryUrl: string;
    routePattern: string;
}

const AssetRepository = process.env.KHR_ASSETS_REPO ? path.resolve(process.env.KHR_ASSETS_REPO) : "";
const HasAssetRepository = AssetRepository.length > 0 && fs.existsSync(AssetRepository);
const ConformanceRoot = path.join(AssetRepository, "Tests", "Interactivity");
const ShowcaseRoot = path.join(AssetRepository, "Models");
const InterGlbSegment = `${path.sep}InterGlb${path.sep}`;
let _routeId = 0;

const ContentTypes: Record<string, string> = {
    ".bin": "application/octet-stream",
    ".glb": "model/gltf-binary",
    ".gltf": "model/gltf+json",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".ktx2": "image/ktx2",
    ".png": "image/png",
    ".webp": "image/webp",
};

function _readDescriptor(filePath: string): ITestDescriptor | undefined {
    const fileName = path.basename(filePath);
    const parent = path.dirname(filePath);
    const candidates =
        path.basename(parent) === "glTF-Binary"
            ? [path.join(path.dirname(parent), "test-Json", `${path.parse(filePath).name}.json`)]
            : [path.join(parent, `${path.parse(filePath).name}.json`)];

    for (const candidate of candidates) {
        if (!fs.existsSync(candidate)) {
            continue;
        }
        const parsed = JSON.parse(fs.readFileSync(candidate, "utf8")) as ITestDescriptor;
        if (parsed.glbFileName === fileName) {
            return parsed;
        }
    }
    return undefined;
}

function _discoverAssets(root: string, kind: IAssetCase["kind"]): IAssetCase[] {
    const result: IAssetCase[] = [];
    const visit = (directory: string): void => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const fullPath = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                visit(fullPath);
                continue;
            }
            const extension = path.extname(entry.name).toLowerCase();
            if (extension !== ".glb" && extension !== ".gltf") {
                continue;
            }
            result.push({
                relativePath: path.relative(AssetRepository, fullPath).replace(/\\/g, "/"),
                filePath: fullPath,
                kind,
                descriptor: kind === "conformance" ? _readDescriptor(fullPath) : undefined,
            });
        }
    };
    visit(root);
    return result.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
}

function _getSuccessVariables(descriptor: ITestDescriptor | undefined): { id: number; name: string }[] {
    const byId = new Map<number, string>();
    for (const descriptorTest of descriptor?.tests ?? []) {
        for (const subTest of descriptorTest.subTests ?? []) {
            if (subTest.successResultVarId !== undefined) {
                byId.set(subTest.successResultVarId, subTest.successResultVarName ?? subTest.name);
            }
        }
    }
    return Array.from(byId, ([id, name]) => ({ id, name }));
}

function _getRunDurationMs(asset: IAssetCase): number {
    if (asset.kind === "showcase") {
        return 1000;
    }
    let maxDelaySeconds = 0;
    for (const descriptorTest of asset.descriptor?.tests ?? []) {
        for (const entryPoint of descriptorTest.entryPoints ?? []) {
            maxDelaySeconds = Math.max(maxDelaySeconds, entryPoint.delayedExecutionTime ?? 0);
        }
    }
    return Math.max(1500, (maxDelaySeconds + 1) * 1000);
}

async function _routeAsset(page: Page, filePath: string): Promise<IRoutedAsset> {
    const id = _routeId++;
    const origin = new URL(getGlobalConfig().baseUrl).origin;
    const routePath = `/__khr_asset_${id}/`;
    const routeBaseUrl = `${origin}${routePath}`;
    const isBinary = path.extname(filePath).toLowerCase() === ".glb";
    const entryUrl = `${routeBaseUrl}${encodeURIComponent(path.basename(filePath))}`;
    const routePattern = isBinary ? entryUrl : `${routeBaseUrl}**`;
    const assetDirectory = path.dirname(filePath);

    await page.route(routePattern, async (route) => {
        if (isBinary) {
            await route.fulfill({
                status: 200,
                contentType: "model/gltf-binary",
                body: fs.readFileSync(filePath),
            });
            return;
        }
        const requestPath = decodeURIComponent(new URL(route.request().url()).pathname.substring(routePath.length));
        const localPath = path.resolve(assetDirectory, requestPath.replace(/\//g, path.sep));
        const directoryPrefix = `${path.resolve(assetDirectory)}${path.sep}`;
        if (localPath !== path.resolve(filePath) && !localPath.startsWith(directoryPrefix)) {
            await route.fulfill({ status: 403, body: "Forbidden" });
            return;
        }
        if (!fs.existsSync(localPath) || !fs.statSync(localPath).isFile()) {
            await route.fulfill({ status: 404, body: `Missing asset dependency: ${requestPath}` });
            return;
        }
        await route.fulfill({
            status: 200,
            contentType: ContentTypes[path.extname(localPath).toLowerCase()] ?? "application/octet-stream",
            body: fs.readFileSync(localPath),
        });
    });

    return {
        entryUrl,
        routePattern,
    };
}

async function _preparePage(page: Page): Promise<void> {
    await page.goto(`${getGlobalConfig().baseUrl}/empty.html`, { waitUntil: "load", timeout: 0 });
    await page.waitForSelector("#babylon-canvas", { timeout: 20000 });
    await page.waitForFunction(() => window.BABYLON);
    await page.evaluate(evaluateInitEngine);
    await page.evaluate(evaluateCreateScene);
    await page.evaluate(() => {
        const engine = window.scene!.getEngine();
        (window as any).__khrDeltaTime = 0;
        (window as any).__khrLastFrameTime = performance.now();
        engine.getDeltaTime = () => (window as any).__khrDeltaTime;
    });
}

async function _loadAsset(page: Page, assetUrl: string): Promise<{ success: boolean; error?: string }> {
    await page.evaluate((url: string) => {
        const state = { done: false, success: false, error: undefined as string | undefined };
        (window as any).__khrAssetLoadState = state;
        void BABYLON.SceneLoader.AppendAsync("", url, window.scene!).then(
            () => {
                state.done = true;
                state.success = true;
            },
            (error) => {
                state.done = true;
                state.error = error instanceof Error ? (error.stack ?? error.message) : String(error);
            }
        );
    }, assetUrl);

    const deadline = Date.now() + 90000;
    let firstEvaluationError: unknown;
    while (Date.now() < deadline) {
        try {
            const state = await page.evaluate(() => {
                const state = (window as any).__khrAssetLoadState as { done: boolean; success: boolean; error?: string };
                if (state?.done) {
                    (window as any).__khrLastFrameTime = performance.now();
                    return state;
                }
                const currentFrameTime = performance.now();
                (window as any).__khrDeltaTime = Math.min(100, currentFrameTime - (window as any).__khrLastFrameTime);
                (window as any).__khrLastFrameTime = currentFrameTime;
                if (!window.scene!.activeCamera) {
                    window.scene!.createDefaultCamera(true);
                }
                window.scene!.render();
                return state;
            });
            if (state?.done) {
                return { success: state.success, error: state.error };
            }
        } catch (error) {
            if (page.isClosed()) {
                return { success: false, error: `Page closed while loading: ${error instanceof Error ? error.message : String(error)}` };
            }
            firstEvaluationError ??= error;
        }
        await new Promise<void>((resolve) => setTimeout(resolve, 50));
    }
    return {
        success: false,
        error: `Timed out waiting for SceneLoader.AppendAsync${
            firstEvaluationError === undefined
                ? ""
                : `; first evaluation error: ${firstEvaluationError instanceof Error ? firstEvaluationError.message : String(firstEvaluationError)}`
        }`,
    };
}

async function _runFrames(page: Page, durationMs: number): Promise<string | undefined> {
    return page.evaluate(async (duration: number) => {
        const scene = window.scene!;
        if (!scene.activeCamera) {
            scene.createDefaultCamera(true);
        }
        const start = performance.now();
        try {
            while (performance.now() - start < duration) {
                await new Promise<void>((resolve) => setTimeout(resolve, 16));
                const currentFrameTime = performance.now();
                (window as any).__khrDeltaTime = currentFrameTime - (window as any).__khrLastFrameTime;
                (window as any).__khrLastFrameTime = currentFrameTime;
                scene.render();
            }
            return undefined;
        } catch (error) {
            return error instanceof Error ? (error.stack ?? error.message) : String(error);
        }
    }, durationMs);
}

async function _readSuccessVariables(page: Page, variables: { id: number; name: string }[]): Promise<{ id: number; name: string; values: unknown[] }[]> {
    return page.evaluate((expectedVariables) => {
        const coordinators = (BABYLON as any).FlowGraphCoordinator.SceneCoordinators.get(window.scene!) ?? [];
        const contexts: any[] = [];
        for (const coordinator of coordinators) {
            for (const graph of coordinator.flowGraphs ?? []) {
                for (let index = 0; index < graph.contextCount; index++) {
                    contexts.push(graph.getContext(index));
                }
            }
        }
        return expectedVariables.map(({ id, name }) => ({
            id,
            name,
            values: contexts.map((context) => (context.userVariables ?? context._userVariables ?? {})[`staticVariable_${id}`]),
        }));
    }, variables);
}

async function _readInterGlbSuccessVariables(
    page: Page,
    coordinatorIndex: number,
    variables: { id: number; name: string }[]
): Promise<{ id: number; name: string; values: unknown[] }[]> {
    return page.evaluate(
        ({ index, expectedVariables }) => {
            const coordinator = ((window as any).__khrInterGlbCoordinators ?? [])[index];
            const contexts: any[] = [];
            for (const graph of coordinator?.flowGraphs ?? []) {
                for (let contextIndex = 0; contextIndex < graph.contextCount; contextIndex++) {
                    contexts.push(graph.getContext(contextIndex));
                }
            }
            return expectedVariables.map(({ id, name }) => ({
                id,
                name,
                values: contexts.map((context) => (context.userVariables ?? context._userVariables ?? {})[`staticVariable_${id}`]),
            }));
        },
        { index: coordinatorIndex, expectedVariables: variables }
    );
}

const conformanceAssets = HasAssetRepository ? _discoverAssets(ConformanceRoot, "conformance") : [];
const showcaseAssets = HasAssetRepository ? _discoverAssets(ShowcaseRoot, "showcase") : [];
const pairedInterGlbAssets = conformanceAssets.filter((asset) => asset.filePath.includes(InterGlbSegment));
const standaloneAssets = [...conformanceAssets.filter((asset) => !asset.filePath.includes(InterGlbSegment)), ...showcaseAssets];

test.describe("KHR_Interactivity all assets", () => {
    test.describe.configure({ mode: "parallel" });
    test.setTimeout(120000);
    test.skip(!HasAssetRepository, "Run `npm run test:khr-interactivity` to fetch and test the pinned Khronos assets.");

    for (const asset of standaloneAssets) {
        test(asset.relativePath, async ({ browser }) => {
            const page = await browser.newPage();
            let routed: IRoutedAsset | undefined;
            const consoleEntries: IConsoleEntry[] = [];
            const pageErrors: string[] = [];
            const navigations: string[] = [];
            let pageCrashed = false;
            page.on("console", (message) => consoleEntries.push({ type: message.type(), text: message.text() }));
            page.on("pageerror", (error) => pageErrors.push(error.stack ?? error.message));
            page.on("framenavigated", (frame) => navigations.push(frame.url()));
            page.on("crash", () => {
                pageCrashed = true;
            });

            try {
                await _preparePage(page);
                routed = await _routeAsset(page, asset.filePath);
                let loadResult: { success: boolean; error?: string };
                try {
                    loadResult = await _loadAsset(page, routed.entryUrl);
                } catch (error) {
                    await new Promise<void>((resolve) => setTimeout(resolve, 100));
                    throw new Error(
                        `${asset.relativePath} lost its execution context while loading.\n` +
                            `pageCrashed=${pageCrashed} pageClosed=${page.isClosed()} url=${page.isClosed() ? "<closed>" : page.url()}\n` +
                            `navigations=${JSON.stringify(navigations)}\n` +
                            `pageErrors=${JSON.stringify(pageErrors)}\n` +
                            `consoleTail=${JSON.stringify(consoleEntries.slice(-20))}\n` +
                            `evaluateError=${error instanceof Error ? (error.stack ?? error.message) : String(error)}`,
                        { cause: error }
                    );
                }
                expect(pageCrashed, `${asset.relativePath} crashed the renderer process while loading`).toBe(false);
                expect(loadResult.success, `${asset.relativePath} failed to load:\n${loadResult.error ?? "Unknown load failure"}`).toBe(true);

                const renderError = await _runFrames(page, _getRunDurationMs(asset));
                expect(renderError, `${asset.relativePath} failed while rendering`).toBeUndefined();

                const bjsErrors = consoleEntries.filter((entry) => entry.text.startsWith("BJS - ") && entry.text.includes("ERROR!"));
                const bjsMessages = consoleEntries.filter((entry) => entry.text.startsWith("BJS - "));
                expect(
                    bjsErrors,
                    `${asset.relativePath} reported conformance errors:\n${bjsErrors.map((entry) => entry.text).join("\n")}\nAll BJS messages:\n${bjsMessages
                        .map((entry) => entry.text)
                        .join("\n")}`
                ).toEqual([]);
                expect(pageErrors, `${asset.relativePath} raised page errors:\n${pageErrors.join("\n")}`).toEqual([]);

                const expectedVariables = _getSuccessVariables(asset.descriptor);
                if (expectedVariables.length > 0) {
                    const variableResults = await _readSuccessVariables(page, expectedVariables);
                    const failedVariables = variableResults.filter((result) => !result.values.some((value) => value === true));
                    expect(
                        failedVariables,
                        `${asset.relativePath} did not pass ${failedVariables.length}/${expectedVariables.length} descriptor checks:\n${failedVariables
                            .slice(0, 30)
                            .map((result) => `${result.id} ${result.name}: ${JSON.stringify(result.values)}`)
                            .join("\n")}`
                    ).toEqual([]);
                }
            } finally {
                if (routed) {
                    await page.unroute(routed.routePattern).catch(() => {});
                }
                await page.evaluate(evaluateDisposeEngine).catch(() => {});
                await page.close().catch(() => {});
            }
        });
    }

    test("Tests/Interactivity/InterGlb/RefEcho_FileA + RefEcho_FileB", async ({ browser }) => {
        const page = await browser.newPage();
        expect(pairedInterGlbAssets.length, "Expected exactly the RefEcho FileA/FileB pair").toBe(2);
        const consoleEntries: IConsoleEntry[] = [];
        const pageErrors: string[] = [];
        page.on("console", (message) => consoleEntries.push({ type: message.type(), text: message.text() }));
        page.on("pageerror", (error) => pageErrors.push(error.stack ?? error.message));

        let routedA: IRoutedAsset | undefined;
        let routedB: IRoutedAsset | undefined;
        try {
            await _preparePage(page);
            routedA = await _routeAsset(page, pairedInterGlbAssets[0].filePath);
            routedB = await _routeAsset(page, pairedInterGlbAssets[1].filePath);
            const loadResult = await page.evaluate(
                async ({ urlA, urlB }: { urlA: string; urlB: string }) => {
                    try {
                        const scene = window.scene!;
                        const coordinatorsByScene = (BABYLON as any).FlowGraphCoordinator.SceneCoordinators;
                        const before = new Set<any>(coordinatorsByScene.get(scene) ?? []);
                        await BABYLON.SceneLoader.AppendAsync("", urlA, scene);
                        await BABYLON.SceneLoader.AppendAsync("", urlB, scene);
                        const created = (coordinatorsByScene.get(scene) ?? []).filter((coordinator: any) => !before.has(coordinator));
                        if (created.length !== 2) {
                            return { success: false, error: `Expected 2 coordinators, got ${created.length}` };
                        }
                        (window as any).__khrInterGlbCoordinators = created;

                        const methodA = created[0].notifyCustomEvent;
                        const methodB = created[1].notifyCustomEvent;
                        const notifyA = (id: string, data: unknown, async?: boolean): unknown => methodA.call(created[0], id, data, async);
                        const notifyB = (id: string, data: unknown, async?: boolean): unknown => methodB.call(created[1], id, data, async);
                        const isPublic = (id: string): boolean => typeof id === "string" && id.length > 0 && !id.startsWith("_");

                        created[0].notifyCustomEvent = (id: string, data: unknown, async?: boolean) => {
                            if (isPublic(id) && async !== false) {
                                notifyB(id, data, async);
                            }
                            return notifyA(id, data, async);
                        };
                        created[1].notifyCustomEvent = (id: string, data: unknown, async?: boolean) => {
                            if (isPublic(id) && async !== false) {
                                notifyA(id, data, async);
                            }
                            return notifyB(id, data, async);
                        };
                        return { success: true };
                    } catch (error) {
                        return { success: false, error: error instanceof Error ? (error.stack ?? error.message) : String(error) };
                    }
                },
                { urlA: routedA.entryUrl, urlB: routedB.entryUrl }
            );
            expect(loadResult.success, loadResult.error).toBe(true);

            const renderError = await _runFrames(page, 6500);
            expect(renderError, "InterGlb pair failed while rendering").toBeUndefined();
            const bjsErrors = consoleEntries.filter((entry) => entry.text.startsWith("BJS - ") && entry.text.includes("ERROR!"));
            expect(bjsErrors, bjsErrors.map((entry) => entry.text).join("\n")).toEqual([]);
            expect(pageErrors, pageErrors.join("\n")).toEqual([]);
            for (let index = 0; index < pairedInterGlbAssets.length; index++) {
                const expectedVariables = _getSuccessVariables(pairedInterGlbAssets[index].descriptor);
                const variableResults = await _readInterGlbSuccessVariables(page, index, expectedVariables);
                const failedVariables = variableResults.filter((result) => !result.values.some((value) => value === true));
                expect(
                    failedVariables,
                    `${pairedInterGlbAssets[index].relativePath} did not pass ${failedVariables.length}/${expectedVariables.length} descriptor checks:\n${failedVariables
                        .map((result) => `${result.id} ${result.name}: ${JSON.stringify(result.values)}`)
                        .join("\n")}`
                ).toEqual([]);
            }
        } finally {
            if (routedA) {
                await page.unroute(routedA.routePattern).catch(() => {});
            }
            if (routedB) {
                await page.unroute(routedB.routePattern).catch(() => {});
            }
            await page.evaluate(evaluateDisposeEngine).catch(() => {});
            await page.close().catch(() => {});
        }
    });
});
