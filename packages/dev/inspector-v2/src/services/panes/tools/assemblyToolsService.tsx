import { useCallback, useEffect, useRef, useState, type FunctionComponent } from "react";

import { type Scene, type IDisposable } from "core/scene";
import {
    FindSmartAssetKeyForObject,
    GetAllSmartAssets,
    GetSmartAssetManagerFromScene,
    GetSmartAssetProvenance,
    LoadSmartAssetAsync,
    LoadSmartAssetTextureAsync,
    RegisterSmartAsset,
    ReloadSmartAssetAsync,
    RemoveSmartAssetAsync,
    ResolveSmartAsset,
    SetSmartAssetRefreshCallback,
    UnloadSmartAssetAsync,
    type SmartAssetManager,
} from "core/SmartAssets/smartAssetManager";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IToolsService, ToolsServiceIdentity } from "../toolsService";
import { type ISelectionService, SelectionServiceIdentity } from "../../selectionService";

import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { Link } from "shared-ui-components/fluent/primitives/link";
import { Dialog } from "shared-ui-components/fluent/primitives/dialog";

import { getOrCreateSmartAssetManager } from "../../smartAssetHandler";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { Body1, Caption1, makeStyles, tokens } from "@fluentui/react-components";
import { AddRegular, DeleteRegular, ArrowSyncRegular, LinkRegular, CubeRegular } from "@fluentui/react-icons";

/**
 * Inspector Tools service that provides an assembly-focused UX for composing
 * scenes from smart assets. Allows adding/removing/swapping assets.
 */
export const AssemblyToolsServiceDefinition: ServiceDefinition<[], [IToolsService, ISelectionService]> = {
    friendlyName: "Assembly Tools",
    consumes: [ToolsServiceIdentity, SelectionServiceIdentity],
    factory: (toolsService, selectionService) => {
        const contentRegistrations: IDisposable[] = [];

        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "Smart Assets",
                section: "Smart Assets",
                component: (props: { context: Scene }) => <SmartAssetList scene={props.context} selectionService={selectionService} />,
            })
        );

        return {
            dispose: () => {
                contentRegistrations.forEach((r) => r.dispose());
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
        fontSize: "11px",
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
        fontSize: "11px",
        opacity: 0.5,
        fontStyle: "italic",
    },
    statusMessage: {
        padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
        fontSize: "11px",
        opacity: 0.7,
    },
    iconButton: {
        cursor: "pointer",
        opacity: 0.6,
        ":hover": {
            opacity: 1,
        },
    },
});

// ── Smart Asset List ──

const SmartAssetList: FunctionComponent<{ scene: Scene; selectionService: ISelectionService }> = (props) => {
    const { scene, selectionService } = props;
    const styles = useStyles();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const notFoundFileRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState("");
    const [pendingNotFound, setPendingNotFound] = useState<{
        key: string;
        url: string;
        resolve: (value: string | File | null) => void;
    } | null>(null);

    // Find the SAM
    const sam = GetSmartAssetManagerFromScene(scene) ?? null;

    // Install a React-state-based onAssetNotFound handler so the Fluent Dialog
    // is used instead of imperative DOM overlays.
    useEffect(() => {
        if (!sam) {
            return;
        }
        sam.onAssetNotFound = async (key: string, expectedUrl: string) => {
            return await new Promise<string | File | null>((resolve) => {
                setPendingNotFound({ key, url: expectedUrl, resolve });
            });
        };
    }, [sam]);

    // Reactively read assets — re-renders when any SAM observable fires
    const assets = useObservableState(
        useCallback(() => {
            if (!sam) {
                return [] as Array<{ key: string; url: string }>;
            }
            return Array.from(GetAllSmartAssets(sam), ([key, url]) => ({ key, url }));
        }, [sam]),
        sam?.onAssetLoadedObservable,
        sam?.onAssetUnloadedObservable,
        sam?.onUrlChangedObservable
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

            const sam = getOrCreateSmartAssetManager(scene);

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
                        // retry path can use the extension hint and build provenance.
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
            const sam = getOrCreateSmartAssetManager(scene);
            await RemoveSmartAssetAsync(sam, key);
            setStatus(`Removed: ${key}`);
        },
        [scene]
    );

    const onReloadAsset = useCallback(
        async (key: string) => {
            const sam = getOrCreateSmartAssetManager(scene);
            await ReloadSmartAssetAsync(sam, key);
            setStatus(`Reloaded: ${key}`);
        },
        [scene]
    );

    const onSwapAsset = useCallback(
        (key: string) => {
            const doSwapAsync = async (file: File, fileHandle?: FileSystemFileHandle) => {
                const sam = getOrCreateSmartAssetManager(scene);
                const oldUrl = ResolveSmartAsset(sam, key) ?? "";
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

                    // Use onAssetNotFound to provide the File so SAM builds provenance
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
                sam.onUrlChangedObservable.notifyObservers({ key, oldUrl, newUrl: blobUrl });

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

    const handleNotFoundSkip = useCallback(() => {
        pendingNotFound?.resolve(null);
        setPendingNotFound(null);
    }, [pendingNotFound]);

    const handleNotFoundLocate = useCallback(() => {
        notFoundFileRef.current?.click();
    }, []);

    const handleNotFoundFileSelected = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0] ?? null;
            pendingNotFound?.resolve(file);
            setPendingNotFound(null);
            if (notFoundFileRef.current) {
                notFoundFileRef.current.value = "";
            }
        },
        [pendingNotFound]
    );

    return (
        <>
            {assets.length === 0 && <div className={styles.emptyMessage}>No smart assets registered. Add assets to begin.</div>}
            {assets.map((a) => {
                // Find the first mesh produced by this key for click-to-select
                const provEntity = sam ? _findFirstEntityForKey(a.key, scene, sam) : null;

                return (
                    <div key={a.key} className={styles.assetRow}>
                        <CubeRegular fontSize={14} />
                        {provEntity ? (
                            <span className={styles.assetKey}>
                                <Link value={a.key} onLink={() => (selectionService.selectedEntity = provEntity)} />
                            </span>
                        ) : (
                            <span className={styles.assetKey}>{a.key}</span>
                        )}
                        <span className={styles.assetUrl} title={a.url}>
                            {_shortenUrl(a.url)}
                        </span>
                        <span className={styles.assetActions}>
                            <LinkRegular fontSize={14} className={styles.iconButton} title="Swap URL" onClick={() => onSwapAsset(a.key)} />
                            <ArrowSyncRegular fontSize={14} className={styles.iconButton} title="Reload" onClick={async () => await onReloadAsset(a.key)} />
                            <DeleteRegular fontSize={14} className={styles.iconButton} title="Remove" onClick={async () => await onRemoveAsset(a.key)} />
                        </span>
                    </div>
                );
            })}
            <ButtonLine label="Add Asset" icon={AddRegular} onClick={onAddAsset} />
            <input ref={fileInputRef} type="file" accept=".glb,.gltf,.babylon,.obj,.png,.jpg,.env,.hdr" multiple style={{ display: "none" }} onChange={onFileSelected} />
            {status && <div className={styles.statusMessage}>{status}</div>}

            {/* Asset-not-found dialog using Fluent Dialog */}
            <Dialog
                open={!!pendingNotFound}
                title="Asset not found"
                onDismiss={handleNotFoundSkip}
                actions={[
                    { label: "Skip", onClick: handleNotFoundSkip },
                    { label: "Locate File…", appearance: "primary", onClick: handleNotFoundLocate },
                ]}
            >
                <Body1>
                    Key: <b>{pendingNotFound?.key}</b>
                </Body1>
                <Caption1>{_shortenUrl(pendingNotFound?.url ?? "")}</Caption1>
                <Body1>Locate the file or click Skip to continue without it.</Body1>
            </Dialog>
            <input
                ref={notFoundFileRef}
                type="file"
                accept=".glb,.gltf,.babylon,.obj,.png,.jpg,.jpeg,.env,.hdr,.dds,.ktx,.ktx2"
                style={{ display: "none" }}
                onChange={handleNotFoundFileSelected}
            />
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
    const prov = GetSmartAssetProvenance(sam, key);
    if (prov) {
        for (const meshName of prov.meshNames) {
            if (meshName === "__root__") {
                continue;
            }
            const mesh = scene.meshes.find((m) => m.name === meshName);
            if (mesh) {
                return mesh;
            }
        }
        for (const matName of prov.materialNames) {
            const mat = scene.materials.find((m) => m.name === matName);
            if (mat) {
                return mat;
            }
        }
        for (const texName of prov.textureNames) {
            const tex = scene.textures.find((t) => t.name === texName);
            if (tex) {
                return tex;
            }
        }
    }

    // For standalone textures (no provenance), search by key tracking
    for (const tex of scene.textures) {
        const trackedKey = FindSmartAssetKeyForObject(sam, tex);
        if (trackedKey === key) {
            return tex;
        }
    }

    // Fallback: if the texture was loaded but _objectToKeyMap lost track
    // (e.g. after swap), try matching by the registered URL
    const registeredUrl = ResolveSmartAsset(sam, key);
    if (registeredUrl) {
        const tex = scene.textures.find((t) => t.name === registeredUrl || t.name === key);
        if (tex) {
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
