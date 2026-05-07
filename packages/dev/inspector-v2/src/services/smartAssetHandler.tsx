import { CreateSmartAssetManager, GetSmartAssetManagerFromScene, type SmartAssetManager } from "core/SmartAssets/smartAssetManager";
import { Observable } from "core/Misc/observable";
import { type Scene } from "core/scene";
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
 * Installs the default `onAssetNotFound` handler on a SmartAssetManager
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
 * Gets or lazily creates the SmartAssetManager for a scene.
 * @param scene - The scene to get/create managers for.
 * @returns The SmartAssetManager for the scene.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function getOrCreateSmartAssetManager(scene: Scene): SmartAssetManager {
    let sam = GetSmartAssetManagerFromScene(scene);
    if (!sam) {
        sam = CreateSmartAssetManager(scene);
    }

    installAssetNotFoundHandler(sam);
    return sam;
}
