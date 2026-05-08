import { type SmartAssetManager } from "core/SmartAssets/smartAssetManager";
import { GetOrCreateSmartAssetManager } from "core/SmartAssets/smartAssetManager";
import { type OverrideManager } from "core/SmartAssets/overrideManager";
import { GetOrCreateOverrideManager } from "core/SmartAssets/overrideManager";
import { type Scene } from "core/scene";
import { Observable } from "core/Misc/observable";
import { SelectSmartAssetsPane } from "./smartAssetsPaneSelection";

type InspectorAssetNotFoundPromptHandlerCallback = (key: string, expectedUrl: string) => Promise<string | File | null>;

type InspectorAssetNotFoundPromptRequest = {
    key: string;
    expectedUrl: string;
    resolve: (value: string | File | null) => void;
    reject: (reason?: unknown) => void;
};

const OnInspectorAssetNotFoundPromptRequestedObservable = new Observable<InspectorAssetNotFoundPromptRequest>(undefined, true);

let InspectorAssetNotFoundPromptHandlerObserver: ReturnType<typeof OnInspectorAssetNotFoundPromptRequestedObservable.add> = null;
let MissingAssetPromptQueue = Promise.resolve<void>(undefined);

/**
 * Sets the Inspector-owned prompt handler used by Smart Assets when an asset is missing.
 * @param handler - The handler installed by the Inspector UI, or null to clear it.
 */
export function SetInspectorAssetNotFoundPromptHandler(handler: InspectorAssetNotFoundPromptHandlerCallback | null): void {
    InspectorAssetNotFoundPromptHandlerObserver?.remove();
    InspectorAssetNotFoundPromptHandlerObserver = null;

    if (!handler) {
        OnInspectorAssetNotFoundPromptRequestedObservable.notifyIfTriggered = true;
        return;
    }

    InspectorAssetNotFoundPromptHandlerObserver = OnInspectorAssetNotFoundPromptRequestedObservable.add((request) => {
        OnInspectorAssetNotFoundPromptRequestedObservable.notifyIfTriggered = false;
        OnInspectorAssetNotFoundPromptRequestedObservable.cleanLastNotifiedState();
        void (async () => {
            try {
                request.resolve(await handler(request.key, request.expectedUrl));
            } catch (error) {
                request.reject(error);
            }
        })();
    });

    OnInspectorAssetNotFoundPromptRequestedObservable.notifyIfTriggered = false;
    OnInspectorAssetNotFoundPromptRequestedObservable.cleanLastNotifiedState();
}

async function RunQueuedMissingAssetPromptAsync(key: string, expectedUrl: string): Promise<string | File | null> {
    const previousPrompt = MissingAssetPromptQueue;
    let releasePrompt = () => {};
    MissingAssetPromptQueue = new Promise<void>((resolve) => {
        releasePrompt = resolve;
    });

    await previousPrompt;
    try {
        return await new Promise<string | File | null>((resolve, reject) => {
            OnInspectorAssetNotFoundPromptRequestedObservable.notifyObservers({ key, expectedUrl, resolve, reject });
        });
    } finally {
        releasePrompt();
    }
}

/**
 * Default handler for missing assets. Delegates to the Inspector UI when it is open.
 * @param key - The smart asset key that was not found.
 * @param expectedUrl - The URL that failed to load.
 * @returns A promise resolving to a new URL, File, or null to skip.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export async function inspectorAssetNotFoundHandler(key: string, expectedUrl: string): Promise<string | File | null> {
    SelectSmartAssetsPane();
    const replacementAsset = await RunQueuedMissingAssetPromptAsync(key, expectedUrl);
    if (replacementAsset) {
        SelectSmartAssetsPane();
    }
    return replacementAsset;
}

/**
 * Installs the Inspector `onAssetNotFound` handler while preserving any existing handler for restoration.
 * @param sam - The SmartAssetManager to install the handler on.
 * @returns A function that restores the previous handler if the Inspector handler is still installed.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function installInspectorAssetNotFoundHandler(sam: SmartAssetManager): () => void {
    const previousHandler = sam.onAssetNotFound;
    sam.onAssetNotFound = inspectorAssetNotFoundHandler;

    return () => {
        if (sam.onAssetNotFound === inspectorAssetNotFoundHandler) {
            sam.onAssetNotFound = previousHandler;
        }
    };
}

/**
 * Convenience helper that returns both the SmartAssetManager and OverrideManager
 * attached to a scene, creating either if it does not already exist. Useful for
 * Inspector services that need to read or mutate both managers without caring
 * about their lifecycle.
 * @param scene - The scene to look up or attach managers to.
 * @returns The scene's SmartAssetManager and OverrideManager.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function getOrCreateManagers(scene: Scene): { sam: SmartAssetManager; overrides: OverrideManager } {
    const sam = GetOrCreateSmartAssetManager(scene);
    const overrides = GetOrCreateOverrideManager(scene);
    return { sam, overrides };
}
