import { useCallback, useEffect, useRef, useState, type FunctionComponent } from "react";

import { type Scene, type IDisposable } from "core/scene";
import { SmartAssetManager } from "core/SmartAssets/smartAssetManager";
import { OverrideManager } from "core/SmartAssets/overrideManager";
import { type AbstractMesh } from "core/Meshes/abstractMesh";
import { type Material } from "core/Materials/material";
import { LoadAssetContainerAsync } from "core/Loading/sceneLoader";

import { type ServiceDefinition } from "../../../modularity/serviceDefinition";
import { type IToolsService, ToolsServiceIdentity } from "../toolsService";
import { type ISelectionService, SelectionServiceIdentity } from "../../selectionService";

import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";
import { LinkToEntity } from "../../../components/properties/linkToEntityPropertyLine";
import { Link } from "shared-ui-components/fluent/primitives/link";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { makeStyles, tokens } from "@fluentui/react-components";
import { AddRegular, DeleteRegular, ArrowSyncRegular, LinkRegular, CubeRegular, DocumentTextRegular } from "@fluentui/react-icons";

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

// ── Shared helpers ──

/**
 * Gets or lazily creates the SmartAssetManager and OverrideManager for a scene.
 * @param scene - The scene to get/create managers for.
 * @returns An object containing the SmartAssetManager and OverrideManager.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _getOrCreateManagers(scene: Scene): { sam: SmartAssetManager; overrides: OverrideManager } {
    let sam = SmartAssetManager.GetFromScene(scene);
    if (!sam) {
        sam = new SmartAssetManager(scene);
    }

    // Install Inspector's file picker handler for missing assets
    sam.onAssetNotFound = _assemblyAssetNotFoundHandler;

    let overrides = OverrideManager.GetFromScene(scene);
    if (!overrides) {
        overrides = new OverrideManager(scene);
        overrides.linkSmartAssetManager(sam);
    }

    return { sam, overrides };
}

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
});

// ── Smart Asset List ──

const SmartAssetList: FunctionComponent<{ scene: Scene; selectionService: ISelectionService }> = (props) => {
    const { scene, selectionService } = props;
    const styles = useStyles();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState("");

    // Find the SAM, with cross-module fallback
    const sam = _findSam(scene);

    // Reactively read assets — re-renders when any SAM observable fires
    const assets = useObservableState(
        useCallback(() => {
            if (!sam) {
                return [] as Array<{ key: string; url: string }>;
            }
            const entries: Array<{ key: string; url: string }> = [];
            for (const [key, url] of sam.getAll()) {
                entries.push({ key, url });
            }
            return entries;
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

            const { sam } = _getOrCreateManagers(scene);

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const key = file.name.replace(/\.[^/.]+$/, "");
                const ext = _getExtension(file.name).toLowerCase();
                const isTexture = [".png", ".jpg", ".jpeg", ".env", ".hdr", ".dds", ".ktx", ".ktx2"].includes(ext);

                const blobUrl = URL.createObjectURL(file);
                sam.register(key, blobUrl);

                try {
                    if (isTexture) {
                        // eslint-disable-next-line no-await-in-loop
                        await sam.loadTextureAsync(key);
                    } else {
                        // Temporarily set onAssetNotFound to return the File so SAM's
                        // retry path can use the extension hint and build provenance.
                        const savedHandler = sam.onAssetNotFound;
                        sam.onAssetNotFound = async () => file;
                        try {
                            // eslint-disable-next-line no-await-in-loop
                            await sam.loadAsync(key);
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
            const { sam } = _getOrCreateManagers(scene);
            await sam.remove(key);
            setStatus(`Removed: ${key}`);
        },
        [scene]
    );

    const onReloadAsset = useCallback(
        async (key: string) => {
            const { sam } = _getOrCreateManagers(scene);
            await sam.reloadAsync(key);
            setStatus(`Reloaded: ${key}`);
        },
        [scene]
    );

    const onSwapAsset = useCallback(
        (key: string) => {
            const doSwap = async (file: File, fileHandle?: FileSystemFileHandle) => {
                const { sam, overrides } = _getOrCreateManagers(scene);
                const oldUrl = sam.resolve(key) ?? "";
                const blobUrl = URL.createObjectURL(file);
                const ext = _getExtension(file.name).toLowerCase();
                const isTexture = [".png", ".jpg", ".jpeg", ".env", ".hdr", ".dds", ".ktx", ".ktx2"].includes(ext);

                if (isTexture) {
                    // Find the old texture tracked by this key
                    let oldTex: import("core/Materials/Textures/baseTexture").BaseTexture | undefined;
                    for (const tex of scene.textures) {
                        if (sam.findKeyForObject(tex) === key) {
                            oldTex = tex;
                            break;
                        }
                    }

                    // Load the new texture via SAM so it's tracked for override resolution.
                    sam.register(key, blobUrl);
                    const newTex = await sam.loadTextureAsync(key);

                    // Register a refresh callback so Reload can re-read the file from disk
                    if (fileHandle) {
                        sam.setRefreshCallback(key, async () => fileHandle.getFile());
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

                    // Re-apply overrides that reference this texture key
                    overrides.applyAllOverrides();
                } else {
                    // Scene file swap (GLB, glTF, etc.)
                    await sam.unloadAsync(key);
                    sam.register(key, blobUrl);

                    // Register a refresh callback so Reload can re-read the file from disk
                    if (fileHandle) {
                        sam.setRefreshCallback(key, async () => fileHandle.getFile());
                    }

                    // Use onAssetNotFound to provide the File so SAM builds provenance
                    const savedHandler = sam.onAssetNotFound;
                    sam.onAssetNotFound = async () => file;
                    try {
                        await sam.loadAsync(key);
                    } finally {
                        sam.onAssetNotFound = savedHandler;
                    }

                    // Re-apply overrides for the reloaded asset
                    overrides.applyOverridesForKey(key);
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
                windowWithPicker
                    .showOpenFilePicker({
                        types: [
                            {
                                description: "Assets",
                                accept: {
                                    "model/*": [".glb", ".gltf", ".babylon", ".obj"],
                                    "image/*": [".png", ".jpg", ".jpeg", ".env", ".hdr", ".dds", ".ktx", ".ktx2"],
                                },
                            },
                        ],
                    })
                    .then(async ([handle]) => {
                        const file = await handle.getFile();
                        await doSwap(file, handle);
                    })
                    .catch(() => {
                        // User cancelled the picker
                    });
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
                    await doSwap(file);
                };
                input.click();
            }
        },
        [scene]
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
            const { sam, overrides } = _getOrCreateManagers(scene);
            const key = sam.findKeyForObject(mesh) ?? "";
            overrides.addOverride({
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
                        style={{
                            flex: 1,
                            fontSize: "11px",
                            padding: "2px 4px",
                            background: "var(--colorNeutralBackground3, #333)",
                            color: "var(--colorNeutralForeground1, #eee)",
                            border: "1px solid var(--colorNeutralStroke1, #555)",
                            borderRadius: "4px",
                        }}
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
        const overrides = OverrideManager.GetFromScene(scene);
        if (!overrides) {
            setOverrideList([]);
            return;
        }

        const entries = overrides.getOverrides().map((o) => ({
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
                    <span style={{ opacity: 0.5 }}>→</span>
                    <span>
                        {o.target}.{o.prop}
                    </span>
                    <span style={{ opacity: 0.5 }}>=</span>
                    <span style={{ color: tokens.colorPaletteGreenForeground1 }}>{_shortenValue(o.value)}</span>
                </div>
            ))}
            <ButtonLine label="Refresh" icon={DocumentTextRegular} onClick={refresh} />
        </>
    );
};

// ── Utilities ──

/**
 * Finds the SmartAssetManager attached to a scene, with cross-module fallback.
 * @param scene - The scene to search.
 * @returns The SmartAssetManager, or null if not found.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _findSam(scene: Scene): SmartAssetManager | null {
    return SmartAssetManager.GetFromScene(scene) ?? null;
}

/**
 * Finds the first scene entity produced by a smart asset key, for click-to-select.
 * Prefers non-root meshes, then materials, then textures.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
function _findFirstEntityForKey(key: string, scene: Scene, sam: SmartAssetManager): { name: string } | null {
    const prov = sam.getProvenance(key);
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
        const trackedKey = sam.findKeyForObject(tex);
        if (trackedKey === key) {
            return tex;
        }
    }

    // Fallback: if the texture was loaded but _objectToKeyMap lost track
    // (e.g. after swap), try matching by the registered URL
    const registeredUrl = sam.resolve(key);
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

/**
 * Default handler for missing assets — shows an overlay dialog with
 * "Locate File" and "Skip" buttons.
 * @param key - The smart asset key that was not found.
 * @param expectedUrl - The URL that failed to load.
 * @returns A promise resolving to a new URL, File, or null to skip.
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
async function _assemblyAssetNotFoundHandler(key: string, expectedUrl: string): Promise<string | File | null> {
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
            resolve(input.files?.[0] ?? null);
        };

        btnRow.appendChild(locateBtn);
        btnRow.appendChild(skipBtn);
        dialog.appendChild(btnRow);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    });
}
