import { SmartAssetManager } from "core/SmartAssets/smartAssetManager";
import { OverrideManager } from "core/SmartAssets/overrideManager";
import { type Scene } from "core/scene";

/**
 * Default Inspector handler for missing assets — shows a centered overlay
 * message and opens a file picker so the user can locate the file.
 * @param key - The smart asset key that was not found.
 * @param expectedUrl - The URL that failed to load.
 * @returns A promise resolving to a new URL, File, or null to skip.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function inspectorAssetNotFoundHandler(key: string, expectedUrl: string): Promise<string | File | null> {
    return await new Promise<string | File | null>((resolve) => {
        const shortUrl = expectedUrl.length > 60 ? "…" + expectedUrl.slice(-50) : expectedUrl;

        const overlay = document.createElement("div");
        overlay.style.cssText =
            "position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);" + "display:flex;align-items:center;justify-content:center;z-index:10000;";

        const dialog = document.createElement("div");
        dialog.style.cssText =
            "background:#2d2d2d;color:#eee;padding:24px 32px;border-radius:8px;" + "font:14px sans-serif;max-width:500px;text-align:center;box-shadow:0 4px 24px rgba(0,0,0,0.6);";
        dialog.innerHTML =
            `<div style="font-size:16px;font-weight:bold;margin-bottom:8px;">Asset not found</div>` +
            `<div style="margin-bottom:4px;">Key: <b>${key}</b></div>` +
            `<div style="margin-bottom:16px;opacity:0.6;font-size:12px;word-break:break-all;">${shortUrl}</div>` +
            `<div style="margin-bottom:16px;">Locate the file or click Skip to continue without it.</div>`;

        const btnRow = document.createElement("div");
        btnRow.style.cssText = "display:flex;gap:12px;justify-content:center;";

        const locateBtn = document.createElement("button");
        locateBtn.textContent = "Locate File…";
        locateBtn.style.cssText = "padding:8px 20px;background:#0078d4;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:13px;";

        const skipBtn = document.createElement("button");
        skipBtn.textContent = "Skip";
        skipBtn.style.cssText = "padding:8px 20px;background:#444;color:#ccc;border:none;border-radius:4px;cursor:pointer;font-size:13px;";

        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".glb,.gltf,.babylon,.obj,.png,.jpg,.jpeg,.env,.hdr,.dds,.ktx,.ktx2";
        input.style.display = "none";

        locateBtn.onclick = () => input.click();
        skipBtn.onclick = () => {
            document.body.removeChild(overlay);
            resolve(null);
        };

        input.onchange = () => {
            document.body.removeChild(overlay);
            const file = input.files?.[0] ?? null;
            resolve(file);
        };

        btnRow.appendChild(locateBtn);
        btnRow.appendChild(skipBtn);
        dialog.appendChild(btnRow);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    });
}

/**
 * Installs the Inspector's `onAssetNotFound` handler on a SmartAssetManager
 * if no handler is already set.
 * @param sam - The SmartAssetManager to install the handler on.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function installAssetNotFoundHandler(sam: SmartAssetManager): void {
    if (!sam.onAssetNotFound) {
        sam.onAssetNotFound = inspectorAssetNotFoundHandler;
    }
}

/**
 * Installs the `onAssetNotFound` handler eagerly: on any existing
 * SmartAssetManager on the scene, and via `OnInstanceCreated` for
 * any future instances. Returns a dispose function to clean up.
 * @param scene - The scene to install hooks on.
 * @returns A dispose function that restores the previous hooks.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function installSmartAssetHooks(scene: Scene): () => void {
    // Retroactively install on existing manager
    const existing = SmartAssetManager.GetFromScene(scene);
    if (existing) {
        installAssetNotFoundHandler(existing);
    }

    // Install on any future instances
    const previousOnInstanceCreated = SmartAssetManager.OnInstanceCreated;
    SmartAssetManager.OnInstanceCreated = (manager) => {
        previousOnInstanceCreated?.(manager);
        installAssetNotFoundHandler(manager);
    };

    return () => {
        // Restore previous hook only if ours is still installed
        if (SmartAssetManager.OnInstanceCreated !== null) {
            SmartAssetManager.OnInstanceCreated = previousOnInstanceCreated;
        }
    };
}

/**
 * Gets or lazily creates the SmartAssetManager and OverrideManager for a scene.
 * Installs the Inspector's asset-not-found handler as a fallback.
 * @param scene - The scene to get/create managers for.
 * @returns An object containing the SmartAssetManager and OverrideManager.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function getOrCreateManagers(scene: Scene): { sam: SmartAssetManager; overrides: OverrideManager } {
    let sam = SmartAssetManager.GetFromScene(scene);
    if (!sam) {
        sam = new SmartAssetManager(scene);
    }

    installAssetNotFoundHandler(sam);

    let overrides = OverrideManager.GetFromScene(scene);
    if (!overrides) {
        overrides = new OverrideManager(scene);
        overrides.linkSmartAssetManager(sam);
    }

    return { sam, overrides };
}
