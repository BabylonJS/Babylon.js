import { useCallback, useEffect, useRef, useState, type FunctionComponent } from "react";

import { type Scene, type IDisposable } from "core/scene";
import {
    FindSmartAssetKeyForObject,
    GetAllSmartAssets,
    GetSmartAssetManager,
    LoadSmartAssetAsync,
    LoadSmartAssetTextureAsync,
    RegisterSmartAsset,
    ReloadSmartAssetAsync,
    RemoveSmartAssetAsync,
    UnloadSmartAssetAsync,
    type SmartAssetManager,
} from "core/SmartAssets/smartAssetManager";
import { ApplyAllOverrides, ApplyOverridesForKey, AddOverride, GetOverrides } from "../../../projects/overrideManager";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type Material } from "core/Materials/material";
import { Tools } from "core/Misc/tools";

import { type ServiceDefinition } from "shared-ui-components/modularTool/modularity/serviceDefinition";
import { type IToolsService, ToolsServiceIdentity } from "../toolsService";
import { type ISelectionService, SelectionServiceIdentity } from "../../selectionService";

import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { Link } from "shared-ui-components/fluent/primitives/link";
import { Dialog } from "shared-ui-components/fluent/primitives/dialog";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";

import { PROJECT_LOCALS_KEY } from "../../../projects/projectSerializer";
import { loadProjectBundleAsync, saveProjectBundleAsync } from "./projectBundleIO";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { Body1, Caption1, makeStyles, Spinner, tokens } from "@fluentui/react-components";
import { AddRegular, DeleteRegular, ArrowSyncRegular, LinkRegular, CubeRegular, DocumentTextRegular, SaveRegular } from "@fluentui/react-icons";

/**
 * Inspector Tools service that provides an assembly-focused UX for composing
 * scenes from smart assets. Allows adding/removing/swapping assets, assigning
 * materials to meshes, and viewing the override summary — all without code.
 */
export const AssemblyToolsServiceDefinition: ServiceDefinition<[], [IToolsService, ISelectionService]> = {
    friendlyName: "Assembly Tools",
    consumes: [ToolsServiceIdentity, SelectionServiceIdentity],
    factory: (toolsService, selectionService) => {
        const contentRegistrations: IDisposable[] = [];

        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "Project File",
                section: "Project File",
                component: (props: { context: Scene }) => <ProjectFileTools scene={props.context} />,
            })
        );

        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "Smart Assets",
                section: "Smart Assets",
                component: (props: { context: Scene }) => <SmartAssetList scene={props.context} selectionService={selectionService} />,
            })
        );

        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "Material Assignment",
                section: "Material Assignment",
                component: (props: { context: Scene }) => <MaterialAssignment scene={props.context} />,
            })
        );

        contentRegistrations.push(
            toolsService.addSectionContent({
                key: "Override Summary",
                section: "Override Summary",
                component: (props: { context: Scene }) => <OverrideSummary scene={props.context} />,
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
    overrideRow: {
        display: "flex",
        gap: tokens.spacingHorizontalXS,
        padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
        fontSize: "10px",
        fontFamily: "monospace",
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
    materialSelect: {
        flex: 1,
        fontSize: "11px",
        padding: "2px 4px",
        backgroundColor: tokens.colorNeutralBackground3,
        color: tokens.colorNeutralForeground1,
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
    },
    dimSeparator: {
        opacity: 0.5,
    },
    overrideValue: {
        color: tokens.colorPaletteGreenForeground1,
    },
    busyMessage: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
        padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
    },
});

// ── Project File ──

/**
 * Save/load controls for the `.babylonproj` zip bundle that captures the
 * scene's smart assets and overrides as a single project file.
 * @param props - Component props.
 * @returns The project file controls.
 */
const ProjectFileTools: FunctionComponent<{ scene: Scene }> = (props) => {
    const { scene } = props;
    const styles = useStyles();
    const [status, setStatus] = useState("");
    const [busy, setBusy] = useState("");
    const isBusy = busy !== "";

    const onSaveProject = useCallback(async () => {
        if (isBusy) {
            return;
        }
        setBusy("Saving project...");
        setStatus("");
        try {
            const blob = await saveProjectBundleAsync(scene);
            Tools.Download(blob, "scene.babylonproj");
            setStatus("Saved scene.babylonproj");
        } catch (err) {
            setStatus(`Save error: ${err}`);
        } finally {
            setBusy("");
        }
    }, [scene, isBusy]);

    const onLoadProject = useCallback(
        async (files: FileList) => {
            const file = files[0];
            if (!file || isBusy) {
                return;
            }
            setBusy("Loading project...");
            setStatus("");
            try {
                await loadProjectBundleAsync(scene, file);
                setStatus(`Loaded ${file.name}`);
            } catch (err) {
                setStatus(`Load error: ${err}`);
            } finally {
                setBusy("");
            }
        },
        [scene, isBusy]
    );

    return (
        <>
            <ButtonLine label="Save Project (.babylonproj)" icon={SaveRegular} onClick={onSaveProject} disabled={isBusy} />
            <FileUploadLine label="Load Project (.babylonproj)" accept=".babylonproj" onClick={onLoadProject} disabled={isBusy} />
            {isBusy && (
                <div className={styles.busyMessage}>
                    <Spinner size="extra-small" />
                    <Caption1>{busy}</Caption1>
                </div>
            )}
            {status && <div className={styles.statusMessage}>{status}</div>}
        </>
    );
};

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

    // Find the SAM (read-only — don't create just to display the empty state)
    const sam = (scene.metadata?.[Symbol.for("babylonjs:smartAssetManager")] as SmartAssetManager | undefined) ?? null;

    // Install a React-state-based onAssetNotFound handler so the Fluent Dialog
    // is used instead of imperative DOM overlays.
    const pendingNotFoundRef = useRef(pendingNotFound);
    pendingNotFoundRef.current = pendingNotFound;

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

    // Reactively read assets — re-renders whenever the SAM's change observable fires
    const assets = useObservableState(
        useCallback(() => {
            if (!sam) {
                return [] as Array<{ key: string; url: string }>;
            }
            const entries: Array<{ key: string; url: string }> = [];
            for (const [key, url] of GetAllSmartAssets(sam.scene)) {
                if (key !== PROJECT_LOCALS_KEY) {
                    entries.push({ key, url });
                }
            }
            return entries;
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

            const sam = GetSmartAssetManager(scene);

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const key = file.name.replace(/\.[^/.]+$/, "");
                const ext = _getExtension(file.name).toLowerCase();
                const isTexture = [".png", ".jpg", ".jpeg", ".env", ".hdr", ".dds", ".ktx", ".ktx2"].includes(ext);

                const blobUrl = URL.createObjectURL(file);
                RegisterSmartAsset(scene, key, blobUrl, isTexture ? { type: "texture", extension: ext } : { extension: ext });

                try {
                    if (isTexture) {
                        // eslint-disable-next-line no-await-in-loop
                        await LoadSmartAssetTextureAsync(scene, key);
                    } else {
                        // Temporarily set onAssetNotFound to return the File so the loader's
                        // retry path can use the extension hint embedded on the File.
                        const savedHandler = sam.onAssetNotFound;
                        sam.onAssetNotFound = async () => file;
                        try {
                            // eslint-disable-next-line no-await-in-loop
                            await LoadSmartAssetAsync(scene, key);
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
            await RemoveSmartAssetAsync(scene, key);
            setStatus(`Removed: ${key}`);
        },
        [scene]
    );

    const onReloadAsset = useCallback(
        async (key: string) => {
            await ReloadSmartAssetAsync(scene, key);
            setStatus(`Reloaded: ${key}`);
        },
        [scene]
    );

    const onSwapAsset = useCallback(
        (key: string) => {
            const doSwapAsync = async (file: File, fileHandle?: FileSystemFileHandle) => {
                const sam = GetSmartAssetManager(scene);
                const blobUrl = URL.createObjectURL(file);
                const ext = _getExtension(file.name).toLowerCase();
                const isTexture = [".png", ".jpg", ".jpeg", ".env", ".hdr", ".dds", ".ktx", ".ktx2"].includes(ext);

                if (isTexture) {
                    // Find the old texture tracked by this key
                    let oldTex: import("core/Materials/Textures/baseTexture").BaseTexture | undefined;
                    for (const tex of scene.textures) {
                        if (FindSmartAssetKeyForObject(scene, tex) === key) {
                            oldTex = tex;
                            break;
                        }
                    }

                    // Load the new texture via SAM so it's tracked for override resolution.
                    // Pass reloadSource on Load so Reload can re-read the file from disk.
                    RegisterSmartAsset(scene, key, blobUrl, { type: "texture", extension: ext });
                    const newTex = await LoadSmartAssetTextureAsync(
                        scene,
                        key,
                        undefined,
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        fileHandle ? { reloadSource: async () => await fileHandle.getFile() } : undefined
                    );

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

                    // Re-apply overrides that reference this texture key
                    ApplyAllOverrides(scene);
                } else {
                    // Scene file swap (GLB, glTF, etc.)
                    await UnloadSmartAssetAsync(scene, key);
                    RegisterSmartAsset(scene, key, blobUrl, { extension: ext });

                    // Use onAssetNotFound to provide the File so the loader can fall back to it.
                    // Pass reloadSource on Load so Reload can re-read the file from disk.
                    const savedHandler = sam.onAssetNotFound;
                    sam.onAssetNotFound = async () => file;
                    try {
                        await LoadSmartAssetAsync(
                            scene,
                            key,
                            undefined,
                            // eslint-disable-next-line @typescript-eslint/naming-convention
                            fileHandle ? { reloadSource: async () => await fileHandle.getFile() } : undefined
                        );
                    } finally {
                        sam.onAssetNotFound = savedHandler;
                    }

                    // Re-apply overrides for the reloaded asset
                    ApplyOverridesForKey(scene, key);
                }

                // Notify after everything is loaded and tracked so the UI re-renders
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

// ── Material Assignment ──

const MaterialAssignment: FunctionComponent<{ scene: Scene }> = (props: { scene: Scene }) => {
    const { scene } = props;
    const styles = useStyles();
    const [meshes, setMeshes] = useState<AbstractMesh[]>([]);
    const [materials, setMaterials] = useState<Material[]>([]);
    const [status, setStatus] = useState("");

    const refresh = useCallback(() => {
        setMeshes(scene.meshes.filter((m) => m.name !== "__root__" && !m.name.startsWith("__")));
        setMaterials(scene.materials.filter((m) => m.name !== "default material"));
    }, [scene]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const onAssignMaterial = useCallback(
        (meshName: string, materialName: string) => {
            const mesh = scene.meshes.find((m) => m.name === meshName);
            const mat = scene.materials.find((m) => m.name === materialName);
            if (!mesh || !mat) {
                return;
            }

            mesh.material = mat;

            // Persist as an override
            const key = FindSmartAssetKeyForObject(scene, mesh) ?? "";
            AddOverride(scene, {
                key,
                targetType: "meshes",
                targetName: mesh.name,
                propertyPath: "material",
                value: `ref:${mat.name}`,
            });

            setStatus(`Assigned ${mat.name} → ${mesh.name}`);
        },
        [scene]
    );

    if (meshes.length === 0) {
        return <div className={styles.emptyMessage}>No meshes in scene. Add assets first.</div>;
    }

    return (
        <>
            {meshes.map((mesh) => (
                <div key={mesh.name} className={styles.assetRow}>
                    <span className={styles.assetKey} title={mesh.name}>
                        {mesh.name}
                    </span>
                    <select
                        value={mesh.material?.name ?? ""}
                        onChange={(e) => {
                            if (e.target.value) {
                                onAssignMaterial(mesh.name, e.target.value);
                            }
                        }}
                        className={styles.materialSelect}
                    >
                        <option value="">(none)</option>
                        {materials.map((m, idx) => (
                            <option key={`${m.name}-${idx}`} value={m.name}>
                                {m.name}
                            </option>
                        ))}
                    </select>
                </div>
            ))}
            <ButtonLine label="Refresh" icon={ArrowSyncRegular} onClick={refresh} />
            {status && <div className={styles.statusMessage}>{status}</div>}
        </>
    );
};

// ── Override Summary ──

const OverrideSummary: FunctionComponent<{ scene: Scene }> = (props: { scene: Scene }) => {
    const { scene } = props;
    const styles = useStyles();
    const [overrideList, setOverrideList] = useState<Array<{ key: string; target: string; prop: string; value: string }>>([]);

    const refresh = useCallback(() => {
        const entries = GetOverrides(scene).map((o) => ({
            key: o.key || "(scene)",
            target: `${o.targetType}.${o.targetName}`,
            prop: o.propertyPath,
            value: String(o.value),
        }));
        setOverrideList(entries);
    }, [scene]);

    useEffect(() => {
        refresh();
        // Auto-refresh every 2 seconds to pick up new overrides from
        // Inspector edits, project loads, and programmatic changes
        const interval = setInterval(refresh, 2000);
        return () => clearInterval(interval);
    }, [refresh]);

    if (overrideList.length === 0) {
        return <div className={styles.emptyMessage}>No overrides tracked. Edit properties in Inspector to create overrides.</div>;
    }

    return (
        <>
            {overrideList.map((o, i) => (
                <div key={i} className={styles.overrideRow}>
                    <span>{o.key}</span>
                    <span className={styles.dimSeparator}>→</span>
                    <span>
                        {o.target}.{o.prop}
                    </span>
                    <span className={styles.dimSeparator}>=</span>
                    <span className={styles.overrideValue}>{_shortenValue(o.value)}</span>
                </div>
            ))}
            <ButtonLine label="Refresh" icon={DocumentTextRegular} onClick={refresh} />
        </>
    );
};

// ── Utilities ──

/**
 * Finds the first scene entity produced by a smart asset key, for click-to-select.
 * Walks the scene's collections and returns the first object tracked by the
 * given smart asset key (preferring non-root meshes).
 * @param key - The smart asset key.
 * @param scene - The scene to search.
 * @param sam - The SmartAssetManager instance.
 * @returns The first matching entity, or null if not found.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _findFirstEntityForKey(key: string, scene: Scene, sam: SmartAssetManager): { name: string } | null {
    for (const mesh of scene.meshes) {
        if (mesh.name === "__root__") {
            continue;
        }
        if (FindSmartAssetKeyForObject(sam.scene, mesh) === key) {
            return mesh;
        }
    }
    for (const mat of scene.materials) {
        if (FindSmartAssetKeyForObject(sam.scene, mat) === key) {
            return mat;
        }
    }
    for (const tex of scene.textures) {
        if (FindSmartAssetKeyForObject(sam.scene, tex) === key) {
            return tex;
        }
    }

    // Fallback: the texture may have been registered but not tracked yet
    // (e.g. mid-swap). Try matching by the registered URL or the key.
    const registeredUrl = GetAllSmartAssets(sam.scene).get(key);
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
 * Truncates a value string to a maximum display length.
 * @param value - The value string to shorten.
 * @returns The truncated string, with an ellipsis if it was shortened.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _shortenValue(value: string): string {
    return value.length > 30 ? value.substring(0, 27) + "…" : value;
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
