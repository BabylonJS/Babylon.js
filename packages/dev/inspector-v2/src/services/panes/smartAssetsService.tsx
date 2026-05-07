import { useCallback, useRef, useState, type FunctionComponent } from "react";

import { type Scene, type IDisposable } from "core/scene";
import {
    FindSmartAssetKeyForObject,
    GetAllSmartAssets,
    GetOrCreateSmartAssetManager,
    GetSmartAssetManagerCreatedCallback,
    GetSmartAssetManagerFromScene,
    LoadSmartAssetAsync,
    LoadSmartAssetTextureAsync,
    RegisterSmartAsset,
    ReloadSmartAssetAsync,
    RemoveSmartAssetAsync,
    SetSmartAssetRefreshCallback,
    SetSmartAssetManagerCreatedCallback,
    UnloadSmartAssetAsync,
    type SmartAssetManager,
} from "core/SmartAssets/smartAssetManager";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IShellService, ShellServiceIdentity } from "shared-ui-components/modularTool/services/shellService";
import { type ISceneContext, SceneContextIdentity } from "../sceneContext";
import { type ISelectionService, SelectionServiceIdentity } from "../selectionService";

import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { Link } from "shared-ui-components/fluent/primitives/link";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";

import { AddSmartAssetsPaneSelectionObserver, ClearSmartAssetsPaneSelectionRequest, EnableSmartAssetsPaneSelectionRequestCache } from "../smartAssetsPaneSelection";
import { SmartAssetProjectTools } from "./tools/smartAssetToolsService";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { Caption1, makeStyles, tokens } from "@fluentui/react-components";
import { AddRegular, DeleteRegular, ArrowSyncRegular, LinkRegular, CubeRegular } from "@fluentui/react-icons";

const SmartAssetsPaneKey = "Smart Assets";

/**
 * Inspector pane service that appears when Smart Assets are used in the current scene.
 */
export const SmartAssetsServiceDefinition: ServiceDefinition<[], [IShellService, ISceneContext, ISelectionService]> = {
    friendlyName: "Smart Assets",
    consumes: [ShellServiceIdentity, SceneContextIdentity, SelectionServiceIdentity],
    factory: (shellService, sceneContext, selectionService) => {
        let paneRegistration: IDisposable | null = null;
        let selectionRequested = false;
        let selectionRequestVersion = 0;

        const selectPane = () => {
            const pane = shellService.sidePanes.find((pane) => pane.key === SmartAssetsPaneKey);
            if (pane) {
                pane.select();
                return true;
            }
            return false;
        };

        const schedulePaneSelection = (requestVersion: number, attempt = 0) => {
            globalThis.setTimeout(
                () => {
                    if (!selectionRequested || requestVersion !== selectionRequestVersion) {
                        return;
                    }

                    const paneExists = selectPane();
                    if (paneExists && attempt >= 2) {
                        selectionRequested = false;
                        ClearSmartAssetsPaneSelectionRequest();
                        return;
                    }

                    if (attempt < 10) {
                        schedulePaneSelection(requestVersion, attempt + 1);
                    }
                },
                attempt === 0 ? 0 : 16
            );
        };

        const requestPaneSelection = () => {
            selectionRequested = true;
            selectionRequestVersion++;
            registerPane();
            schedulePaneSelection(selectionRequestVersion);
        };

        const registerPane = () => {
            if (paneRegistration) {
                return;
            }

            paneRegistration = shellService.addSidePane({
                key: SmartAssetsPaneKey,
                title: SmartAssetsPaneKey,
                icon: CubeRegular,
                horizontalLocation: "right",
                verticalLocation: "top",
                order: 395,
                teachingMoment: false,
                content: () => {
                    const scene = useObservableState(() => sceneContext.currentScene, sceneContext.currentSceneObservable);
                    return scene ? <SmartAssetsPane scene={scene} selectionService={selectionService} /> : null;
                },
            });

            if (selectionRequested) {
                schedulePaneSelection(selectionRequestVersion);
            }
        };

        const registerPaneForCurrentScene = () => {
            const scene = sceneContext.currentScene;
            if (scene && GetSmartAssetManagerFromScene(scene)) {
                registerPane();
            }
        };

        registerPaneForCurrentScene();

        const sceneObserver = sceneContext.currentSceneObservable.add(registerPaneForCurrentScene);
        const selectionObserver = AddSmartAssetsPaneSelectionObserver(() => {
            requestPaneSelection();
        });

        const previousSmartAssetManagerCreatedCallback = GetSmartAssetManagerCreatedCallback();
        const smartAssetManagerCreatedCallback = (manager: SmartAssetManager) => {
            previousSmartAssetManagerCreatedCallback?.(manager);
            if (manager.scene === sceneContext.currentScene) {
                registerPane();
                if (selectionRequested) {
                    schedulePaneSelection(selectionRequestVersion);
                }
            }
        };
        SetSmartAssetManagerCreatedCallback(smartAssetManagerCreatedCallback);

        return {
            dispose: () => {
                selectionRequested = false;
                selectionRequestVersion++;
                paneRegistration?.dispose();
                sceneObserver.remove();
                selectionObserver?.remove();
                EnableSmartAssetsPaneSelectionRequestCache();
                if (GetSmartAssetManagerCreatedCallback() === smartAssetManagerCreatedCallback) {
                    SetSmartAssetManagerCreatedCallback(previousSmartAssetManagerCreatedCallback);
                }
            },
        };
    },
};

// ── Styles ──

const useStyles = makeStyles({
    assetRow: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        fontSize: tokens.fontSizeBase100,
        borderBottom: `1px solid ${tokens.colorNeutralStroke3}`,
    },
    assetKey: {
        fontWeight: "bold",
        minWidth: "60px",
        flexShrink: 0,
    },
    assetUrl: {
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        flex: 1,
        opacity: 0.7,
    },
    assetActions: {
        display: "flex",
        gap: tokens.spacingHorizontalXXS,
        flexShrink: 0,
    },
    emptyMessage: {
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
        fontSize: tokens.fontSizeBase100,
        opacity: 0.5,
        fontStyle: "italic",
    },
    statusMessage: {
        padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
        fontSize: tokens.fontSizeBase100,
        opacity: 0.7,
    },
    iconButton: {
        cursor: "pointer",
        opacity: 0.6,
        ":hover": {
            opacity: 1,
        },
    },
    hiddenInput: {
        display: "none",
    },
});

// ── Smart Assets Pane ──

const SmartAssetsPane: FunctionComponent<{ scene: Scene; selectionService: ISelectionService }> = (props) => {
    const { scene, selectionService } = props;

    return (
        <Accordion uniqueId="SmartAssets" enablePinnedItems enableHiddenItems enableSearchItems>
            <AccordionSection title="Assets">
                <SmartAssetList scene={scene} selectionService={selectionService} />
            </AccordionSection>
            <AccordionSection title="Asset Map">
                <SmartAssetProjectTools scene={scene} />
            </AccordionSection>
        </Accordion>
    );
};

// ── Smart Asset List ──

const SmartAssetList: FunctionComponent<{ scene: Scene; selectionService: ISelectionService }> = (props) => {
    const { scene, selectionService } = props;
    const styles = useStyles();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState("");

    // Find the SAM
    const sam = GetSmartAssetManagerFromScene(scene) ?? null;

    // Reactively read assets — re-renders when the Smart Asset manager changes.
    const assets = useObservableState(
        useCallback(() => {
            if (!sam) {
                return [] as Array<{ key: string; url: string }>;
            }
            return Array.from(GetAllSmartAssets(sam), ([key, url]) => ({ key, url }));
        }, [sam]),
        sam?.onChangedObservable
    );

    const onAddAsset = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const onFileSelected = useCallback(
        async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (!files || files.length === 0) {
                return;
            }

            const sam = GetOrCreateSmartAssetManager(scene);

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const key = file.name.replace(/\.[^/.]+$/, "");
                const ext = _getExtension(file.name).toLowerCase();
                const isTexture = [".png", ".jpg", ".jpeg", ".env", ".hdr", ".dds", ".ktx", ".ktx2"].includes(ext);

                const blobUrl = URL.createObjectURL(file);
                RegisterSmartAsset(sam, key, blobUrl, { ...(ext ? { extension: ext } : {}), ...(isTexture ? { type: "texture" } : {}) });

                try {
                    if (isTexture) {
                        // eslint-disable-next-line no-await-in-loop
                        await LoadSmartAssetTextureAsync(sam, key);
                    } else {
                        // Temporarily set onAssetNotFound to return the File so SAM's
                        // retry path can use the extension hint and track loaded objects.
                        const savedHandler = sam.onAssetNotFound;
                        sam.onAssetNotFound = async () => file;
                        try {
                            // eslint-disable-next-line no-await-in-loop
                            await LoadSmartAssetAsync(sam, key);
                        } finally {
                            sam.onAssetNotFound = savedHandler;
                        }
                    }
                    setStatus(`Added: ${key}`);
                } catch {
                    setStatus(`Failed to load: ${key}`);
                }
            }

            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        },
        [scene]
    );

    const onRemoveAsset = useCallback(
        async (key: string) => {
            const sam = GetOrCreateSmartAssetManager(scene);
            await RemoveSmartAssetAsync(sam, key);
            setStatus(`Removed: ${key}`);
        },
        [scene]
    );

    const onReloadAsset = useCallback(
        async (key: string) => {
            const sam = GetOrCreateSmartAssetManager(scene);
            await ReloadSmartAssetAsync(sam, key);
            setStatus(`Reloaded: ${key}`);
        },
        [scene]
    );

    const onSwapAsset = useCallback(
        (key: string) => {
            const doSwapAsync = async (file: File, fileHandle?: FileSystemFileHandle) => {
                const sam = GetOrCreateSmartAssetManager(scene);
                const blobUrl = URL.createObjectURL(file);
                const ext = _getExtension(file.name).toLowerCase();
                const isTexture = [".png", ".jpg", ".jpeg", ".env", ".hdr", ".dds", ".ktx", ".ktx2"].includes(ext);

                if (isTexture) {
                    // Find the old texture tracked by this key
                    let oldTex: import("core/Materials/Textures/baseTexture").BaseTexture | undefined;
                    for (const tex of scene.textures) {
                        if (FindSmartAssetKeyForObject(sam, tex) === key) {
                            oldTex = tex;
                            break;
                        }
                    }

                    // Load the new texture via SAM so it stays tracked by key.
                    RegisterSmartAsset(sam, key, blobUrl, { ...(ext ? { extension: ext } : {}), type: "texture" });
                    const newTex = await LoadSmartAssetTextureAsync(sam, key);

                    // Register a refresh callback so Reload can re-read the file from disk
                    if (fileHandle) {
                        SetSmartAssetRefreshCallback(sam, key, async () => await fileHandle.getFile());
                    }

                    // Replace references on all materials that used the old texture
                    if (oldTex) {
                        const texSlots = ["albedoTexture", "bumpTexture", "metallicTexture", "emissiveTexture", "ambientTexture", "reflectivityTexture", "opacityTexture"] as const;
                        for (const mat of scene.materials) {
                            for (const slot of texSlots) {
                                if ((mat as any)[slot] === oldTex) {
                                    (mat as any)[slot] = newTex;
                                }
                            }
                        }
                        oldTex.dispose();
                    }
                } else {
                    // Scene file swap (GLB, glTF, etc.)
                    await UnloadSmartAssetAsync(sam, key);
                    RegisterSmartAsset(sam, key, blobUrl, { ...(ext ? { extension: ext } : {}) });

                    // Register a refresh callback so Reload can re-read the file from disk
                    if (fileHandle) {
                        SetSmartAssetRefreshCallback(sam, key, async () => await fileHandle.getFile());
                    }

                    // Use onAssetNotFound to provide the File so SAM tracks loaded objects.
                    const savedHandler = sam.onAssetNotFound;
                    sam.onAssetNotFound = async () => file;
                    try {
                        await LoadSmartAssetAsync(sam, key);
                    } finally {
                        sam.onAssetNotFound = savedHandler;
                    }
                }

                // Notify after everything is loaded and tracked so the UI re-renders
                // with the correct provEntity links
                sam.onChangedObservable.notifyObservers();

                setStatus(`Swapped: ${key}`);
            };

            // Prefer showOpenFilePicker (File System Access API) so we get a
            // FileSystemFileHandle that lets Reload re-read fresh contents from disk.
            const windowWithPicker = window as Window & { showOpenFilePicker?: (options?: any) => Promise<FileSystemFileHandle[]> };
            if (typeof windowWithPicker.showOpenFilePicker === "function") {
                const pickerAsync = async () => {
                    try {
                        const [handle] = await windowWithPicker.showOpenFilePicker!({
                            types: [
                                {
                                    description: "Assets",
                                    accept: {
                                        // eslint-disable-next-line @typescript-eslint/naming-convention
                                        "model/*": [".glb", ".gltf", ".babylon", ".obj"],
                                        // eslint-disable-next-line @typescript-eslint/naming-convention
                                        "image/*": [".png", ".jpg", ".jpeg", ".env", ".hdr", ".dds", ".ktx", ".ktx2"],
                                    },
                                },
                            ],
                        });
                        const file = await handle.getFile();
                        await doSwapAsync(file, handle);
                    } catch {
                        // User cancelled the picker
                    }
                };
                void pickerAsync();
            } else {
                // Fallback for browsers without File System Access API
                const input = document.createElement("input");
                input.type = "file";
                input.accept = ".glb,.gltf,.babylon,.obj,.png,.jpg,.env,.hdr";
                input.onchange = async () => {
                    const file = input.files?.[0];
                    if (!file) {
                        return;
                    }
                    await doSwapAsync(file);
                };
                input.click();
            }
        },
        [scene]
    );

    return (
        <>
            {assets.length === 0 && <Caption1 className={styles.emptyMessage}>No smart assets registered. Add assets to begin.</Caption1>}
            {assets.map((a) => {
                // Find the first mesh produced by this key for click-to-select
                const provEntity = sam ? _findFirstEntityForKey(a.key, scene, sam) : null;

                return (
                    <div key={a.key} className={styles.assetRow}>
                        <CubeRegular fontSize={14} />
                        {provEntity ? (
                            <Caption1 className={styles.assetKey}>
                                <Link value={a.key} onLink={() => (selectionService.selectedEntity = provEntity)} />
                            </Caption1>
                        ) : (
                            <Caption1 className={styles.assetKey}>{a.key}</Caption1>
                        )}
                        <Caption1 className={styles.assetUrl} title={a.url}>
                            {_shortenUrl(a.url)}
                        </Caption1>
                        <div className={styles.assetActions}>
                            <LinkRegular fontSize={14} className={styles.iconButton} title="Swap URL" onClick={() => onSwapAsset(a.key)} />
                            <ArrowSyncRegular fontSize={14} className={styles.iconButton} title="Reload" onClick={async () => await onReloadAsset(a.key)} />
                            <DeleteRegular fontSize={14} className={styles.iconButton} title="Remove" onClick={async () => await onRemoveAsset(a.key)} />
                        </div>
                    </div>
                );
            })}
            <ButtonLine label="Add Asset" icon={AddRegular} onClick={onAddAsset} />
            <input ref={fileInputRef} type="file" accept=".glb,.gltf,.babylon,.obj,.png,.jpg,.env,.hdr" multiple className={styles.hiddenInput} onChange={onFileSelected} />
            {status && <Caption1 className={styles.statusMessage}>{status}</Caption1>}
        </>
    );
};

// ── Utilities ──

/**
 * Finds the first scene entity produced by a smart asset key, for click-to-select.
 * Prefers non-root meshes, then materials, then textures.
 * @param key - The smart asset key.
 * @param scene - The scene to search.
 * @param sam - The SmartAssetManager instance.
 * @returns The first matching entity, or null if not found.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _findFirstEntityForKey(key: string, scene: Scene, sam: SmartAssetManager): { name: string } | null {
    for (const mesh of scene.meshes) {
        if (mesh.name !== "__root__" && FindSmartAssetKeyForObject(sam, mesh) === key) {
            return mesh;
        }
    }

    for (const mat of scene.materials) {
        if (FindSmartAssetKeyForObject(sam, mat) === key) {
            return mat;
        }
    }

    for (const tex of scene.textures) {
        if (FindSmartAssetKeyForObject(sam, tex) === key) {
            return tex;
        }
    }

    return null;
}

/**
 * Shortens a URL for display, collapsing blob/data URLs and long paths.
 * @param url - The URL to shorten.
 * @returns A shortened display string.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _shortenUrl(url: string): string {
    if (url.startsWith("blob:")) {
        return "(local file — blob)";
    }
    if (url.startsWith("data:")) {
        const mimeEnd = url.indexOf(";");
        const mime = mimeEnd > 5 ? url.substring(5, mimeEnd) : "binary";
        return `(embedded ${mime})`;
    }
    const parts = url.split("/");
    return parts.length > 3 ? "…/" + parts.slice(-2).join("/") : url;
}

/**
 * Returns the file extension from a filename or URL, including the leading dot.
 * @param url - The URL or filename to extract the extension from.
 * @returns The extension string (e.g. ".glb"), or empty string if none found.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _getExtension(url: string): string {
    const clean = url.split("?")[0].split("#")[0];
    const lastDot = clean.lastIndexOf(".");
    const lastSlash = Math.max(clean.lastIndexOf("/"), clean.lastIndexOf("\\"));
    if (lastDot > lastSlash && lastDot >= 0) {
        return clean.substring(lastDot);
    }
    return "";
}
