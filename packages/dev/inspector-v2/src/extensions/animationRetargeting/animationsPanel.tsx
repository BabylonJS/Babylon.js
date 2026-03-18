import type { FunctionComponent } from "react";
import type { AnimationManager, StoredAnimation } from "./animationManager";
import type { NamingSchemeManager } from "./namingSchemeManager";

import { useState, useCallback, useRef, useEffect } from "react";
import {
    Button,
    Input,
    Select,
    Label,
    makeStyles,
    mergeClasses,
    tokens,
    Body1Strong,
    Caption1,
    Dialog,
    DialogSurface,
    DialogBody,
    DialogTitle,
    DialogContent,
    DialogActions,
    Spinner,
} from "@fluentui/react-components";
import { Add20Regular, Delete20Regular, Edit20Regular, ArrowUpload20Regular } from "@fluentui/react-icons";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { ImportMeshAsync, SceneLoader } from "core/Loading/sceneLoader";
import { FilesInputStore } from "core/Misc/filesInputStore";

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
    panel: {
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
    },
    listHeader: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexShrink: 0,
        paddingBottom: tokens.spacingVerticalXS,
    },
    listButtons: {
        display: "flex",
        gap: tokens.spacingHorizontalXS,
    },
    listArea: {
        overflowY: "auto",
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
        display: "flex",
        flexDirection: "column",
    },
    listRow: {
        display: "flex",
        alignItems: "center",
        padding: `${tokens.spacingVerticalXS} ${tokens.spacingHorizontalS}`,
        gap: tokens.spacingHorizontalXS,
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        ":last-child": { borderBottom: "none" },
    },
    listRowName: {
        flex: 1,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    },
    listRowMeta: {
        color: tokens.colorNeutralForeground3,
        fontSize: "12px",
        flexShrink: 0,
        marginRight: tokens.spacingHorizontalXS,
    },
    editSectionFlex: {
        flex: 1,
        overflow: "hidden",
        borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
        paddingTop: tokens.spacingVerticalS,
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
    },
    formRow: {
        display: "flex",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
        flexShrink: 0,
    },
    formLabel: {
        flexShrink: 0,
        width: "110px",
    },
    formControl: {
        flex: 1,
    },
    actionRow: {
        display: "flex",
        gap: tokens.spacingHorizontalS,
        justifyContent: "flex-end",
        flexShrink: 0,
    },
    errorText: {
        color: tokens.colorPaletteRedForeground1,
        fontSize: "12px",
        flexShrink: 0,
    },
    emptyMsg: {
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalS}`,
        color: tokens.colorNeutralForeground3,
        fontSize: "12px",
    },
    confirmSurface: {
        width: "380px",
        maxWidth: "90vw",
    },
    restPoseTextarea: {
        resize: "vertical",
        width: "100%",
        minHeight: "150px",
        maxHeight: "300px",
        boxSizing: "border-box",
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        padding: `${tokens.spacingVerticalSNudge} ${tokens.spacingHorizontalS}`,
        fontFamily: "monospace",
        fontSize: "11px",
        backgroundColor: tokens.colorNeutralBackground1,
        color: tokens.colorNeutralForeground1,
    },
    dropZone: {
        border: `2px dashed ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        padding: tokens.spacingVerticalM,
        textAlign: "center",
        cursor: "pointer",
        color: tokens.colorNeutralForeground3,
        fontSize: "12px",
    },
    dropZoneActive: {
        border: `2px dashed ${tokens.colorCompoundBrandStroke}`,
        backgroundColor: tokens.colorBrandBackground2,
    },
    animList: {
        flex: 1,
        overflowY: "auto",
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
        minHeight: "60px",
    },
    animRow: {
        padding: `2px ${tokens.spacingHorizontalS}`,
        fontSize: "12px",
        cursor: "pointer",
    },
    animRowSelected: {
        backgroundColor: tokens.colorBrandBackground2,
        fontWeight: "bold",
    },
});

// ─── Types ────────────────────────────────────────────────────────────────────

type AnimationEdit = {
    id: string | null;
    originalName: string | null;
    name: string;
    sourceType: "url" | "file";
    url: string;
    files: File[];
    animationGroupName: string;
    namingScheme: string;
    restPoseJson: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Detects the best matching naming scheme by checking how many target names
 * appear in each scheme. Returns the scheme with the most matches
 * (minimum 10 required), or null if none qualify.
 */
function DetectNamingScheme(targetNames: Set<string>, namingSchemeManager: NamingSchemeManager): string | null {
    const schemeNames = namingSchemeManager.getAllSchemeNames();
    let bestScheme: string | null = null;
    let bestCount = 0;

    for (const schemeName of schemeNames) {
        const entries = namingSchemeManager.getNamingScheme(schemeName);
        if (!entries) {
            continue;
        }
        const boneSet = new Set(entries.map((e) => e.name));
        let matches = 0;
        for (const name of targetNames) {
            if (boneSet.has(name)) {
                matches++;
            }
        }
        if (matches > bestCount) {
            bestCount = matches;
            bestScheme = schemeName;
        }
    }

    return bestCount >= 10 ? bestScheme : null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AnimationsPanel: FunctionComponent<{
    animationManager: AnimationManager;
    namingSchemeManager: NamingSchemeManager;
    onMutate: () => void;
    onEditingChange: (editing: boolean) => void;
}> = ({ animationManager, namingSchemeManager, onMutate, onEditingChange }) => {
    const classes = useStyles();
    const [editing, setEditing] = useState<AnimationEdit | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null);
    const [animGroupNames, setAnimGroupNames] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);

    const tempEngineRef = useRef<NullEngine | null>(null);
    const tempSceneRef = useRef<Scene | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        return () => {
            tempSceneRef.current?.dispose();
            tempEngineRef.current?.dispose();
        };
    }, []);

    const setEditingWithNotify = useCallback(
        (value: AnimationEdit | null) => {
            setEditing(value);
            onEditingChange(value !== null);
        },
        [onEditingChange]
    );

    const allAnimations = animationManager.getAllAnimations();
    const schemeNames = namingSchemeManager.getAllSchemeNames();

    // ─── Load preview ─────────────────────────────────────────────────────

    const loadPreview = useCallback(
        async (sourceType: "url" | "file", url: string, files: File[]) => {
            setIsLoading(true);
            setAnimGroupNames([]);
            setError(null);

            tempSceneRef.current?.dispose();
            tempEngineRef.current?.dispose();

            try {
                const engine = new NullEngine();
                tempEngineRef.current = engine;
                const scene = new Scene(engine);
                tempSceneRef.current = scene;

                if (sourceType === "url") {
                    await ImportMeshAsync(url.trim(), scene);
                } else {
                    let sceneFile: File | undefined;
                    for (const file of files) {
                        const name = file.name.toLowerCase();
                        FilesInputStore.FilesToLoad[name] = file;
                        const ext = name.split(".").pop();
                        if (ext && SceneLoader.IsPluginForExtensionAvailable("." + ext)) {
                            sceneFile = file;
                        }
                    }
                    if (!sceneFile) {
                        sceneFile = files[0];
                    }
                    await ImportMeshAsync(sceneFile.name, scene, { rootUrl: "file:" });
                }

                const groups = scene.animationGroups;
                if (groups.length === 0) {
                    setError("No animations found in this file.");
                    setIsLoading(false);
                    return;
                }

                const names = groups.map((g) => g.name);
                setAnimGroupNames(names);

                // Collect target names for scheme detection
                const targetNames = new Set<string>();
                for (const group of groups) {
                    for (const ta of group.targetedAnimations) {
                        if (ta.target?.name) {
                            targetNames.add(ta.target.name as string);
                        }
                    }
                }
                const detectedScheme = DetectNamingScheme(targetNames, namingSchemeManager);

                // Auto-select first animation group
                setEditing((prev) => {
                    if (!prev) {
                        return prev;
                    }
                    return {
                        ...prev,
                        animationGroupName: prev.animationGroupName || names[0],
                        ...(detectedScheme ? { namingScheme: detectedScheme } : {}),
                    };
                });
            } catch (e) {
                setError(`Failed to load: ${e instanceof Error ? e.message : String(e)}`);
            } finally {
                setIsLoading(false);
            }
        },
        [namingSchemeManager]
    );

    // ─── CRUD handlers ────────────────────────────────────────────────────

    const startAdd = useCallback(() => {
        setEditingWithNotify({
            id: null,
            originalName: null,
            name: "",
            sourceType: "url",
            url: "",
            files: [],
            animationGroupName: "",
            namingScheme: schemeNames[0] ?? "",
            restPoseJson: "",
        });
        setError(null);
        setAnimGroupNames([]);
    }, [schemeNames, setEditingWithNotify]);

    const startEdit = useCallback(
        async (animation: StoredAnimation) => {
            setEditingWithNotify({
                id: animation.id,
                originalName: animation.name,
                name: animation.name,
                sourceType: animation.source,
                url: animation.url ?? "",
                files: [],
                animationGroupName: animation.animationGroupName,
                namingScheme: animation.namingScheme,
                restPoseJson: animation.restPoseUpdate ? JSON.stringify(animation.restPoseUpdate, undefined, 2) : "",
            });
            setError(null);
            setAnimGroupNames([]);
            if (animation.source === "url" && animation.url) {
                void loadPreview("url", animation.url, []);
            } else if (animation.source === "file" && animation.fileNames?.length) {
                const files = await animationManager.getFilesAsync(animation.id, animation.fileNames);
                if (files.length > 0) {
                    void loadPreview("file", "", files);
                }
            }
        },
        [setEditingWithNotify, loadPreview, animationManager]
    );

    const handleCancel = useCallback(() => {
        setEditingWithNotify(null);
        setError(null);
        setAnimGroupNames([]);
        tempSceneRef.current?.dispose();
        tempSceneRef.current = null;
        tempEngineRef.current?.dispose();
        tempEngineRef.current = null;
    }, [setEditingWithNotify]);

    const handleSave = useCallback(async () => {
        if (!editing) {
            return;
        }
        if (!editing.name.trim()) {
            setError("Name is required.");
            return;
        }
        if (!editing.animationGroupName) {
            setError("Please load the file and select an animation.");
            return;
        }
        if (!editing.namingScheme) {
            setError("Please select a naming scheme.");
            return;
        }
        if (editing.originalName !== editing.name.trim()) {
            const existing = animationManager.getAnimation(editing.name.trim());
            if (existing) {
                setError(`An animation named "${editing.name.trim()}" already exists.`);
                return;
            }
        }

        try {
            const animId = editing.id ?? "";

            let fileNames: string[] | undefined;
            if (editing.sourceType === "file" && editing.files.length > 0) {
                if (animId) {
                    fileNames = await animationManager.storeFilesAsync(animId, editing.files);
                }
            } else if (editing.sourceType === "file" && editing.id) {
                const existing = animationManager.getAnimationById(editing.id);
                fileNames = existing?.fileNames;
            }

            let restPoseUpdate: import("./data").RestPoseDataUpdate | undefined;
            if (editing.restPoseJson.trim()) {
                try {
                    restPoseUpdate = JSON.parse(editing.restPoseJson);
                } catch {
                    setError("Invalid JSON in rest pose data.");
                    return;
                }
            }

            const animation: StoredAnimation = {
                id: animId,
                name: editing.name.trim(),
                source: editing.sourceType,
                url: editing.sourceType === "url" ? editing.url.trim() : undefined,
                fileNames: editing.sourceType === "file" ? fileNames : undefined,
                namingScheme: editing.namingScheme,
                animationGroupName: editing.animationGroupName,
                restPoseUpdate,
            };

            animationManager.addAnimation(animation);

            if (editing.sourceType === "file" && editing.files.length > 0 && !animId) {
                const storedFileNames = await animationManager.storeFilesAsync(animation.id, editing.files);
                animation.fileNames = storedFileNames;
                animationManager.addAnimation(animation);
            }

            setEditingWithNotify(null);
            setError(null);
            setAnimGroupNames([]);
            onMutate();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, [editing, animationManager, onMutate, setEditingWithNotify]);

    const handleDelete = useCallback((animation: StoredAnimation) => {
        setConfirmDelete({ id: animation.id, name: animation.name });
    }, []);

    const handleConfirmDelete = useCallback(async () => {
        if (!confirmDelete) {
            return;
        }
        await animationManager.removeAnimationAsync(confirmDelete.id);
        setConfirmDelete(null);
        onMutate();
    }, [confirmDelete, animationManager, onMutate]);

    // ─── Drag & drop ──────────────────────────────────────────────────────

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);
            if (!editing) {
                return;
            }
            const droppedFiles = Array.from(e.dataTransfer.files);
            if (droppedFiles.length > 0) {
                const updated = { ...editing, sourceType: "file" as const, files: droppedFiles, url: "" };
                setEditing(updated);
                void loadPreview("file", "", droppedFiles);
            }
        },
        [editing, loadPreview]
    );

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!editing || !e.target.files) {
                return;
            }
            const selectedFiles = Array.from(e.target.files);
            if (selectedFiles.length > 0) {
                const updated = { ...editing, sourceType: "file" as const, files: selectedFiles, url: "" };
                setEditing(updated);
                void loadPreview("file", "", selectedFiles);
            }
        },
        [editing, loadPreview]
    );

    // ─── Render ───────────────────────────────────────────────────────────

    return (
        <div className={classes.panel}>
            {/* Confirm delete dialog */}
            <Dialog
                open={confirmDelete !== null}
                onOpenChange={(_, d) => {
                    if (!d.open) {
                        setConfirmDelete(null);
                    }
                }}
            >
                <DialogSurface className={classes.confirmSurface}>
                    <DialogBody>
                        <DialogTitle>Delete Animation</DialogTitle>
                        <DialogContent>
                            Delete animation <strong>"{confirmDelete?.name}"</strong> and all associated files?
                        </DialogContent>
                        <DialogActions>
                            <Button appearance="secondary" onClick={() => setConfirmDelete(null)}>
                                Cancel
                            </Button>
                            <Button appearance="primary" onClick={handleConfirmDelete}>
                                Delete
                            </Button>
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            <div className={classes.listHeader}>
                <div className={classes.listButtons}>
                    <Button size="small" icon={<Add20Regular />} onClick={startAdd} disabled={!!editing}>
                        Add
                    </Button>
                </div>
            </div>
            <div className={classes.listArea} style={{ flex: editing ? "0 0 auto" : 1, maxHeight: editing ? "140px" : undefined }}>
                {allAnimations.length === 0 && <span className={classes.emptyMsg}>No custom animations defined.</span>}
                {allAnimations.map((animation) => (
                    <div key={animation.id} className={classes.listRow}>
                        <span className={classes.listRowName}>{animation.name}</span>
                        <span className={classes.listRowMeta}>{animation.source === "url" ? "URL" : "File"}</span>
                        <span className={classes.listRowMeta}>{animation.namingScheme}</span>
                        <Button size="small" appearance="transparent" icon={<Edit20Regular />} title="Edit" disabled={!!editing} onClick={() => startEdit(animation)} />
                        <Button size="small" appearance="transparent" icon={<Delete20Regular />} title="Delete" disabled={!!editing} onClick={() => handleDelete(animation)} />
                    </div>
                ))}
            </div>

            {editing && (
                <div className={classes.editSectionFlex}>
                    <Body1Strong>{editing.originalName ? `Editing "${editing.originalName}"` : "New Animation"}</Body1Strong>

                    {/* Name */}
                    <div className={classes.formRow}>
                        <Label className={classes.formLabel}>Name</Label>
                        <Input className={classes.formControl} size="small" value={editing.name} onChange={(_, d) => setEditing({ ...editing, name: d.value })} />
                    </div>

                    {/* URL input */}
                    <div className={classes.formRow}>
                        <Label className={classes.formLabel}>URL</Label>
                        <Input
                            className={classes.formControl}
                            size="small"
                            value={editing.url}
                            placeholder="https://..."
                            onChange={(_, d) => setEditing({ ...editing, url: d.value })}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && editing.url.trim()) {
                                    setEditing({ ...editing, sourceType: "url", files: [] });
                                    void loadPreview("url", editing.url, []);
                                }
                            }}
                            input={{
                                onBlur: () => {
                                    if (editing.url.trim() && editing.sourceType !== "file") {
                                        void loadPreview("url", editing.url, []);
                                    }
                                },
                            }}
                        />
                    </div>

                    {/* Drop zone */}
                    <div
                        className={mergeClasses(classes.dropZone, isDragOver ? classes.dropZoneActive : undefined)}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ArrowUpload20Regular />
                        <div>Drop file(s) here or click to browse</div>
                        <input ref={fileInputRef} type="file" multiple style={{ display: "none" }} onChange={handleFileInput} />
                    </div>

                    {/* Loading indicator */}
                    {isLoading && (
                        <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>
                            Loading… <Spinner size="tiny" style={{ display: "inline-block" }} />
                        </Caption1>
                    )}

                    {/* Animation group list */}
                    {animGroupNames.length > 0 && (
                        <>
                            <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>Select the animation to use ({animGroupNames.length} found):</Caption1>
                            <div className={classes.animList}>
                                {animGroupNames.map((name) => (
                                    <div
                                        key={name}
                                        className={mergeClasses(classes.animRow, editing.animationGroupName === name ? classes.animRowSelected : undefined)}
                                        onClick={() => setEditing({ ...editing, animationGroupName: name })}
                                    >
                                        {name}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {/* Naming scheme */}
                    <div className={classes.formRow}>
                        <Label className={classes.formLabel}>Naming scheme</Label>
                        <Select className={classes.formControl} size="small" value={editing.namingScheme} onChange={(_, d) => setEditing({ ...editing, namingScheme: d.value })}>
                            {schemeNames.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </Select>
                    </div>

                    {/* Rest pose data */}
                    <div className={classes.formRow} style={{ alignItems: "flex-start" }}>
                        <Label className={classes.formLabel} style={{ paddingTop: "6px" }}>
                            Rest pose data
                        </Label>
                        <textarea
                            className={classes.restPoseTextarea}
                            value={editing.restPoseJson}
                            placeholder='JSON array (optional). Use gizmos + "Save as rest pose" to generate this data.'
                            onChange={(e) => setEditing({ ...editing, restPoseJson: e.target.value })}
                        />
                    </div>

                    {error && <span className={classes.errorText}>{error}</span>}
                    <div className={classes.actionRow}>
                        <Button size="small" appearance="secondary" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button size="small" appearance="primary" onClick={handleSave}>
                            Save
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};
