import "core/Engines/Extensions/engine.rawTexture";
import type { ThinEngine } from "core/Engines/thinEngine";
import { Observable, type Observer } from "core/Misc/observable";
import type { Nullable } from "core/types";
import { SmartFilterDeserializer, type ISerializedBlockV1, type SmartFilter, Logger } from "smart-filters";
import { builtInBlockRegistrations, type IBlockRegistration } from "smart-filters-blocks";
import {
    EditorBlockRegistrations,
    GetBlockEditorRegistration,
    InputBlockDeserializer,
    LogEntry,
    ObservableProperty,
    SmartFilterEditorControl,
    LogLevel,
    type SmartFilterEditorOptions,
} from "smart-filters-editor-control";
import { SmartFilterRenderer } from "./smartFilterRenderer";
import { CustomBlockManager } from "./customBlockManager";
import { CreateBlockRegistration, GenerateCustomBlockRegistrations } from "./blockRegistration/generateCustomBlockEditorRegistrations";
import { blockFactory } from "./blockRegistration/blockFactory";
import { LoadFromUrl, LoadStartingSmartFilter } from "./smartFilterLoadSave/loadStartingSmartFilter";
import { SaveToSnippetServerAsync } from "./smartFilterLoadSave/saveToSnipperServer";
import { RemoveCustomBlockFromBlockEditorRegistration } from "./blockRegistration/removeCustomBlockFromBlockEditorRegistration";
import { AddCustomBlockToBlockEditorRegistration } from "./blockRegistration/addCustomBlockToBlockEditorRegistration";
import { DownloadSmartFilter } from "./smartFilterLoadSave/downloadSmartFilter";
import { CopySmartFilterToClipboard, CopySmartFilterToString } from "./smartFilterLoadSave/copySmartFilter";
import { LoadSmartFilterFromFile } from "./smartFilterLoadSave/loadSmartFilterFromFile";
import { PasteSmartFilterFromClipboardAsync, PasteSmartFilterFromStringAsync } from "./smartFilterLoadSave/pasteSmartFilter";
import { TexturePresets } from "./texturePresets";
import { SerializeSmartFilter } from "./smartFilterLoadSave/serializeSmartFilter";

const LocalStorageOptimizeName = "OptimizeSmartFilter";

/**
 * The main entry point for the Smart Filter editor.
 */
async function Main(): Promise<void> {
    const hostElement = document.getElementById("container");
    if (!hostElement) {
        throw new Error("Could not find the container element");
    }

    // Services and options to keep around for the lifetime of the page
    let currentSmartFilter: Nullable<SmartFilter> = null;
    let renderer: Nullable<SmartFilterRenderer> = null;
    const onSmartFilterLoadedObservable = new Observable<SmartFilter>();
    const optimizerEnabled = new ObservableProperty<boolean>(localStorage.getItem(LocalStorageOptimizeName) === "true" || false);
    const onSaveEditorDataRequiredObservable = new Observable<void>();
    let afterEngineResizerObserver: Nullable<Observer<ThinEngine>> = null;
    const onLogRequiredObservable = new Observable<LogEntry>();
    let engine: Nullable<ThinEngine> = null;

    // Redirect Logging to the onLogRequiredObservable
    Logger.Log = (message: string | any[]) => {
        onLogRequiredObservable.notifyObservers(new LogEntry(message.toString(), LogLevel.Log));
    };
    Logger.Warn = (message: string | any[]) => {
        onLogRequiredObservable.notifyObservers(new LogEntry(message.toString(), LogLevel.Warn));
    };
    Logger.Error = (message: string | any[]) => {
        onLogRequiredObservable.notifyObservers(new LogEntry(message.toString(), LogLevel.Error));
    };

    // Set up optimize property change behavior
    optimizerEnabled.onChangedObservable.add(async (value: boolean) => {
        localStorage.setItem(LocalStorageOptimizeName, value ? "true" : "false");
        if (renderer && renderer.optimize !== value) {
            renderer.optimize = value;
            await startRenderingAsync();
        }
    });

    // Create the Smart Filter deserializer
    const smartFilterDeserializer = new SmartFilterDeserializer(
        async (smartFilter: SmartFilter, engine: ThinEngine, serializedBlock: ISerializedBlockV1, smartFilterDeserializer: SmartFilterDeserializer) => {
            return await blockFactory(smartFilter, engine, serializedBlock, customBlockManager, smartFilterDeserializer, builtInBlockRegistrations);
        },
        InputBlockDeserializer
    );

    // Create the custom block manager
    const customBlockManager = new CustomBlockManager();
    const customBlockDefinitions = customBlockManager.getCustomBlockDefinitions();
    const customBlockRegistrations = GenerateCustomBlockRegistrations(customBlockManager, smartFilterDeserializer, customBlockDefinitions);

    // Create the block editor registration
    const allBlockRegistrations: IBlockRegistration[] = [...customBlockRegistrations, ...EditorBlockRegistrations, ...builtInBlockRegistrations];
    const blockEditorRegistration = GetBlockEditorRegistration(smartFilterDeserializer, allBlockRegistrations, true);

    /**
     * Called when the editor has created a canvas and its associated engine
     * @param newEngine - The new engine
     */
    const onNewEngineAsync = async (newEngine: ThinEngine) => {
        if (renderer) {
            renderer.dispose();
            afterEngineResizerObserver?.remove();
        }
        if (engine) {
            engine.dispose();
        }
        engine = newEngine;

        afterEngineResizerObserver = newEngine.onResizeObservable.add(async () => {
            if (renderer && currentSmartFilter) {
                await renderer.startRenderingAsync(currentSmartFilter);
            }
        });

        let justLoadedSmartFilter = false;
        if (!currentSmartFilter) {
            try {
                currentSmartFilter = await LoadStartingSmartFilter(smartFilterDeserializer, newEngine);
                justLoadedSmartFilter = true;
            } catch (err) {
                Logger.Error(`Could not load Smart Filter:\n${err}`);
                return;
            }
        }

        renderer = new SmartFilterRenderer(newEngine, optimizerEnabled.value);
        await startRenderingAsync();

        if (justLoadedSmartFilter) {
            onSmartFilterLoadedObservable.notifyObservers(currentSmartFilter);
        }
    };

    const startRenderingAsync = async () => {
        if (renderer && currentSmartFilter) {
            const renderResult = await renderer.startRenderingAsync(currentSmartFilter);
            if (renderResult.succeeded) {
                let statsString = "";
                const stats: string[] = [];
                if (renderResult.optimizationTimeMs !== null) {
                    stats.push(`Optimizer: ${Math.floor(renderResult.optimizationTimeMs).toLocaleString()}ms`);
                }
                if (renderResult.runtimeCreationTimeMs !== null) {
                    stats.push(`Runtime Creation: ${Math.floor(renderResult.runtimeCreationTimeMs).toLocaleString()}ms`);
                }
                if (stats.length > 0) {
                    statsString = ` [${stats.join(", ")}]`;
                }
                Logger.Log("Smart Filter built successfully" + statsString);
            }
        }
    };

    window.addEventListener("hashchange", async () => {
        if (renderer && engine) {
            currentSmartFilter = await LoadFromUrl(smartFilterDeserializer, engine);
            if (currentSmartFilter) {
                await startRenderingAsync();
                onSmartFilterLoadedObservable.notifyObservers(currentSmartFilter);
            } else {
                Logger.Error("Could not load Smart Filter with that unique URL");
            }
        }
    });

    const addCustomBlockAsync = async (serializedData: string) => {
        try {
            const blockDefinition = customBlockManager.saveBlockDefinition(serializedData);
            const blockRegistration = CreateBlockRegistration(customBlockManager, blockDefinition, smartFilterDeserializer);
            RemoveCustomBlockFromBlockEditorRegistration(blockEditorRegistration, allBlockRegistrations, blockRegistration.blockType, blockRegistration.namespace);
            AddCustomBlockToBlockEditorRegistration(blockEditorRegistration, blockRegistration);
            allBlockRegistrations.push(blockRegistration);

            // Rebuild the current Smart Filter in case this block was used in it
            if (engine && currentSmartFilter) {
                onSaveEditorDataRequiredObservable.notifyObservers();
                const serializedSmartFilter = await SerializeSmartFilter(currentSmartFilter);
                currentSmartFilter = await smartFilterDeserializer.deserialize(engine, JSON.parse(serializedSmartFilter));
                onSmartFilterLoadedObservable.notifyObservers(currentSmartFilter);
            }
            await startRenderingAsync();

            Logger.Log("Loaded custom block successfully");
        } catch (err) {
            Logger.Error(`Could not load custom block:\n${err}`);
        }
    };

    const saveToSnippetServerAsync = async () => {
        if (currentSmartFilter) {
            try {
                await SaveToSnippetServerAsync(currentSmartFilter);
                Logger.Log("Saved Smart Filter to unique URL");
            } catch (err: unknown) {
                Logger.Error(`Could not save to unique URL:\n${err}`);
            }
        }
    };

    const reloadAssetsAsync = async () => {
        if (renderer) {
            try {
                await renderer.reloadAssetsAsync();
            } catch (err: unknown) {
                Logger.Error(`Could not reload assets:\n${err}`);
            }
        }
    };

    const copySmartFilterAsync = async () => {
        if (currentSmartFilter) {
            try {
                await CopySmartFilterToClipboard(currentSmartFilter);
                Logger.Log("Smart Filter JSON copied to clipboard");
            } catch (err: unknown) {
                Logger.Error(`Could not copy Smart Filter to clipboard:\n${err}`);
            }
        }
    };

    const copySmartFilterToStringAsync = async () => {
        if (currentSmartFilter) {
            try {
                return await CopySmartFilterToString(currentSmartFilter);
            } catch (err: unknown) {
                Logger.Error(`Could not copy Smart Filter to string:\n${err}`);
            }
        }
        return "";
    };

    const downloadSmartFilterAsync = async () => {
        if (currentSmartFilter) {
            await DownloadSmartFilter(currentSmartFilter);
            Logger.Log("Smart filter JSON downloaded");
        }
    };

    const options: SmartFilterEditorOptions = {
        onNewEngine: (newEngine: ThinEngine) => {
            void onNewEngineAsync(newEngine);
        },
        onSmartFilterLoadedObservable,
        optimizerEnabled,
        blockEditorRegistration: blockEditorRegistration,
        hostElement,
        downloadSmartFilter: () => {
            void downloadSmartFilterAsync();
        },
        loadSmartFilterAsync: async (file: File, engine: ThinEngine) => {
            try {
                if (renderer) {
                    currentSmartFilter = await LoadSmartFilterFromFile(smartFilterDeserializer, engine, file);
                    Logger.Log("Loaded Smart Filter from JSON");
                    await startRenderingAsync();
                    return currentSmartFilter;
                }
            } catch (err: unknown) {
                Logger.Error(`Could not load Smart Filter:\n${err}`);
            }
            return null;
        },
        copySmartFilterToClipboard: () => {
            void copySmartFilterAsync();
        },
        copySmartFilterToStringAsync: copySmartFilterToStringAsync,
        pasteSmartFilterFromClipboardAsync: async () => {
            if (renderer && engine) {
                try {
                    const smartFilter = await PasteSmartFilterFromClipboardAsync(smartFilterDeserializer, engine);
                    if (smartFilter) {
                        currentSmartFilter = smartFilter;
                        onSmartFilterLoadedObservable.notifyObservers(currentSmartFilter);
                        Logger.Log("Smart Filter pasted from clipboard");
                        await startRenderingAsync();
                        return currentSmartFilter;
                    }
                } catch (err: unknown) {
                    Logger.Error(`Could not paste Smart Filter from clipboard:\n${err}`);
                }
            }
            return null;
        },
        pasteSmartFilterFromStringAsync: async (data) => {
            if (renderer && engine) {
                try {
                    const smartFilter = await PasteSmartFilterFromStringAsync(smartFilterDeserializer, engine, data);
                    if (smartFilter) {
                        currentSmartFilter = smartFilter;
                        onSmartFilterLoadedObservable.notifyObservers(currentSmartFilter);
                        Logger.Log("Smart Filter pasted from string");
                        await startRenderingAsync();
                        return currentSmartFilter;
                    }
                } catch (err: unknown) {
                    Logger.Error(`Could not paste Smart Filter from string:\n${err}`);
                }
            }
            return null;
        },
        saveToSnippetServer: () => {
            void saveToSnippetServerAsync();
        },
        texturePresets: TexturePresets,
        beforeRenderObservable: new Observable<void>(),
        rebuildRuntime: () => {
            void startRenderingAsync();
        },
        reloadAssets: () => {
            void reloadAssetsAsync();
        },
        addCustomBlock: (serializedData: string) => {
            void addCustomBlockAsync(serializedData);
        },
        deleteCustomBlock: (blockRegistration: IBlockRegistration) => {
            const { blockType, namespace } = blockRegistration;
            customBlockManager.deleteBlockDefinition(blockType, namespace);
            RemoveCustomBlockFromBlockEditorRegistration(blockEditorRegistration, allBlockRegistrations, blockType, namespace);
        },
        onLogRequiredObservable,
        onSaveEditorDataRequiredObservable,
    };

    SmartFilterEditorControl.Show(options);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises,  @typescript-eslint/no-misused-promises, github/no-then
Main().catch((error) => {
    Logger.Error(error);
});
