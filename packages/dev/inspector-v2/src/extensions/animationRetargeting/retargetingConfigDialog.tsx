import type { FunctionComponent } from "react";
import type { NamingSchemeManager, BoneEntry } from "./namingSchemeManager";
import type { AvatarManager, StoredAvatar } from "./avatarManager";
import type { AnimationManager, StoredAnimation } from "./animationManager";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
    Dialog,
    DialogBody,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogSurface,
    Select,
    Tab,
    TabList,
    Label,
    makeStyles,
    mergeClasses,
    tokens,
    Body1Strong,
    Caption1,
    Spinner,
} from "@fluentui/react-components";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { TextInput } from "shared-ui-components/fluent/primitives/textInput";
import { StringDropdown } from "shared-ui-components/fluent/primitives/dropdown";
import {
    AddRegular,
    DeleteRegular,
    EditRegular,
    ArrowCounterclockwiseRegular,
    ArrowBidirectionalUpDownRegular,
    ArrowDownloadRegular,
    ArrowUploadRegular,
    DismissRegular,
} from "@fluentui/react-icons";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { ImportMeshAsync, SceneLoader } from "core/Loading/sceneLoader";
import { FilesInputStore } from "core/Misc/filesInputStore";
import { AvatarsPanel } from "./avatarsPanel";
import { AnimationsPanel } from "./animationsPanel";

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
    surface: {
        width: "1000px",
        minWidth: "400px",
        maxWidth: "95vw",
        height: "800px",
        minHeight: "300px",
        maxHeight: "95vh",
        resize: "both",
        overflow: "hidden",
    },
    titleRow: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexShrink: 0,
        paddingBottom: tokens.spacingVerticalXS,
    },
    body: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        gap: 0,
        overflow: "hidden",
    },
    tabList: {
        flexShrink: 0,
        paddingBottom: tokens.spacingVerticalXS,
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    },
    content: {
        flex: 1,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        paddingTop: tokens.spacingVerticalS,
        paddingLeft: tokens.spacingHorizontalS,
        paddingRight: tokens.spacingHorizontalS,
    },
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
    editSection: {
        flexShrink: 0,
        borderTop: `1px solid ${tokens.colorNeutralStroke2}`,
        paddingTop: tokens.spacingVerticalS,
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalS,
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
    mappingTable: {
        flex: 1,
        overflowY: "auto",
        border: `1px solid ${tokens.colorNeutralStroke2}`,
        borderRadius: tokens.borderRadiusMedium,
    },
    mappingRow: {
        display: "flex",
        alignItems: "center",
        padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalS}`,
        gap: tokens.spacingHorizontalS,
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
        ":last-child": { borderBottom: "none" },
    },
    mappingRowError: {
        backgroundColor: tokens.colorStatusDangerBackground1,
    },
    mappingBoneName: {
        flex: "0 0 220px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "pre",
        fontSize: "12px",
    },
    mappingSelect: {
        flex: 1,
        fontSize: "12px",
        padding: `${tokens.spacingVerticalXXS} ${tokens.spacingHorizontalXS}`,
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusSmall,
        backgroundColor: tokens.colorNeutralBackground1,
        color: tokens.colorNeutralForeground1,
        cursor: "pointer",
    },
    errorText: {
        color: tokens.colorPaletteRedForeground1,
        fontSize: "12px",
        flexShrink: 0,
    },
    actionRow: {
        display: "flex",
        gap: tokens.spacingHorizontalS,
        justifyContent: "flex-end",
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
    listButtons: {
        display: "flex",
        gap: tokens.spacingHorizontalXS,
    },
    boneTextarea: {
        flex: 1,
        minHeight: 0,
        resize: "none",
        width: "100%",
        boxSizing: "border-box",
        border: `1px solid ${tokens.colorNeutralStroke1}`,
        borderRadius: tokens.borderRadiusMedium,
        padding: `${tokens.spacingVerticalSNudge} ${tokens.spacingHorizontalM}`,
        fontFamily: "var(--fontFamilyBase)",
        fontSize: tokens.fontSizeBase300,
        backgroundColor: tokens.colorNeutralBackground1,
        color: tokens.colorNeutralForeground1,
        ":focus": {
            outline: `2px solid ${tokens.colorCompoundBrandStroke}`,
            outlineOffset: "1px",
        },
    },
    titleButtons: {
        display: "flex",
        gap: tokens.spacingHorizontalXS,
    },
});

// Session-only size persistence: survives dialog close/reopen but not page reload.
let SavedDialogSize: { width: number; height: number } | null = null;

// ─── Types ────────────────────────────────────────────────────────────────────

type SchemeEdit = {
    originalName: string | null; // null = new scheme
    name: string;
    namesText: string;
};

type RemappingEdit = {
    fromScheme: string;
    toScheme: string;
    map: Map<string, string>;
    isNew: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Loads a stored avatar or animation into a scene (handles both URL and file sources). */
async function LoadIntoScene(scene: Scene, entry: StoredAvatar | StoredAnimation, manager: { getFilesAsync(id: string, fileNames: string[]): Promise<File[]> }): Promise<void> {
    if (entry.source === "url" && entry.url) {
        await ImportMeshAsync(entry.url, scene);
    } else if (entry.source === "file" && entry.fileNames?.length) {
        const files = await manager.getFilesAsync(entry.id, entry.fileNames);
        let sceneFile: File | undefined;
        for (const file of files) {
            const lowerName = file.name.toLowerCase();
            FilesInputStore.FilesToLoad[lowerName] = file;
            const ext = lowerName.split(".").pop();
            if (ext && SceneLoader.IsPluginForExtensionAvailable("." + ext)) {
                sceneFile = file;
            }
        }
        if (!sceneFile) {
            throw new Error("No loadable scene file found.");
        }
        await ImportMeshAsync(sceneFile.name, scene, { rootUrl: "file:" });
    } else {
        throw new Error("No URL or files available for this entry.");
    }
}

// ─── Schemes Panel ────────────────────────────────────────────────────────────

const SchemesPanel: FunctionComponent<{
    manager: NamingSchemeManager;
    avatarManager: AvatarManager;
    animationManager: AnimationManager;
    onMutate: () => void;
    onEditingChange: (editing: boolean) => void;
}> = ({ manager, avatarManager, animationManager, onMutate, onEditingChange }) => {
    const classes = useStyles();
    const [editing, setEditing] = useState<SchemeEdit | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
    const [isPopulating, setIsPopulating] = useState(false);

    // Build populate options from avatars and animations
    const populateOptions = useMemo(() => {
        const options: { label: string; value: string }[] = [{ label: "(select)", value: "" }];
        for (const av of avatarManager.getAllAvatars()) {
            options.push({ label: `Avatar: ${av.name}`, value: `avatar:${av.name}` });
        }
        for (const an of animationManager.getAllAnimations()) {
            const label =
                an.animations
                    .filter((m) => m.displayName)
                    .map((m) => m.displayName)
                    .join(", ") || an.id;
            options.push({ label: `Animation: ${label}`, value: `animation:${an.id}` });
        }
        return options;
    }, [avatarManager, animationManager]);

    const setEditingWithNotify = useCallback(
        (value: SchemeEdit | null) => {
            setEditing(value);
            onEditingChange(value !== null);
        },
        [onEditingChange]
    );

    const schemeNames = manager.getAllSchemeNames().sort((a, b) => a.localeCompare(b));

    const startAdd = useCallback(() => {
        setEditingWithNotify({ originalName: null, name: "", namesText: "" });
        setError(null);
    }, [setEditingWithNotify]);

    const startEdit = useCallback(
        (name: string) => {
            const entries = manager.getNamingScheme(name) ?? [];
            // Encode depth as leading spaces (2 per level) so the user can edit hierarchy in the textarea.
            setEditingWithNotify({ originalName: name, name, namesText: entries.map((e) => "  ".repeat(e.depth) + e.name).join("\n") });
            setError(null);
        },
        [manager, setEditingWithNotify]
    );

    const handleDelete = useCallback(
        (name: string) => {
            // Check if any avatar or animation uses this scheme
            const usingAvatars = avatarManager.getAllAvatars().filter((a) => a.namingScheme === name);
            const usingAnimations = animationManager.getAllAnimations().filter((a) => a.namingScheme === name);
            const users: string[] = [];
            for (const a of usingAvatars) {
                users.push(`avatar "${a.name}"`);
            }
            for (const a of usingAnimations) {
                const label =
                    a.animations
                        .filter((m) => m.displayName)
                        .map((m) => m.displayName)
                        .join(", ") || a.id;
                users.push(`animation "${label}"`);
            }
            if (users.length > 0) {
                setError(`Cannot delete: scheme is used by ${users.join(", ")}.`);
                return;
            }
            setError(null);
            setConfirmDelete(name);
        },
        [avatarManager, animationManager]
    );

    const handleConfirmDelete = useCallback(() => {
        if (!confirmDelete) {
            return;
        }
        try {
            manager.removeNamingScheme(confirmDelete);
            onMutate();
        } catch {
            // ignore
        }
        setConfirmDelete(null);
    }, [confirmDelete, manager, onMutate]);

    const handleRecreateDefaults = useCallback(() => {
        const changed = manager.recreateDefaultSchemes();
        if (changed) {
            onMutate();
        }
    }, [manager, onMutate]);

    /** Loads an avatar or animation into a temp scene and populates the bone names textarea. */
    const handlePopulate = useCallback(
        async (key: string) => {
            if (!key || !editing) {
                return;
            }
            setIsPopulating(true);
            setError(null);

            let engine: NullEngine | null = null;
            try {
                engine = new NullEngine();
                const scene = new Scene(engine);

                const isAvatar = key.startsWith("avatar:");
                const name = key.substring(key.indexOf(":") + 1);

                if (isAvatar) {
                    const avatar = avatarManager.getAvatar(name);
                    if (!avatar) {
                        throw new Error(`Avatar "${name}" not found.`);
                    }
                    await LoadIntoScene(scene, avatar, avatarManager);

                    // Extract bone names from the first skeleton in hierarchy order (DFS)
                    const skeleton = scene.skeletons[0];
                    if (!skeleton) {
                        throw new Error("No skeleton found in this avatar.");
                    }
                    const lines: string[] = [];
                    const visitBone = (bone: import("core/Bones/bone").Bone, depth: number) => {
                        lines.push("  ".repeat(depth) + bone.name);
                        for (const child of bone.children) {
                            visitBone(child, depth + 1);
                        }
                    };
                    for (const bone of skeleton.bones) {
                        if (!bone.parent) {
                            visitBone(bone, 0);
                        }
                    }
                    setEditing({ ...editing, namesText: lines.join("\n") });
                } else {
                    const animation = animationManager.getAnimationById(name);
                    if (!animation) {
                        throw new Error(`Animation "${name}" not found.`);
                    }
                    await LoadIntoScene(scene, animation, animationManager);

                    // Collect animation target names, then sort by scene hierarchy (DFS order)
                    const targetNames = new Set<string>();
                    for (const group of scene.animationGroups) {
                        for (const ta of group.targetedAnimations) {
                            if (ta.target?.name) {
                                targetNames.add(ta.target.name as string);
                            }
                        }
                    }
                    if (targetNames.size === 0) {
                        throw new Error("No animation targets found.");
                    }
                    // Walk scene in DFS order, include only animation targets
                    const lines: string[] = [];
                    const visited = new Set<string>();
                    const walkNode = (node: import("core/node").Node, depth: number) => {
                        if (targetNames.has(node.name) && !visited.has(node.name)) {
                            visited.add(node.name);
                            lines.push("  ".repeat(depth) + node.name);
                        }
                        for (const child of node.getChildren()) {
                            walkNode(child, depth + 1);
                        }
                    };
                    for (const rootNode of scene.rootNodes) {
                        walkNode(rootNode, 0);
                    }
                    setEditing({ ...editing, namesText: lines.join("\n") });
                }
            } catch (e) {
                setError(e instanceof Error ? e.message : String(e));
            } finally {
                engine?.dispose();
                setIsPopulating(false);
            }
        },
        [editing, avatarManager, animationManager]
    );

    const handleSave = useCallback(() => {
        if (!editing) {
            return;
        }
        const trimmedName = editing.name.trim();
        if (!trimmedName) {
            setError("Scheme name cannot be empty.");
            return;
        }
        // Parse indented text: leading spaces (2 per level) encode the hierarchy depth.
        const names: BoneEntry[] = editing.namesText
            .split("\n")
            .filter((l) => l.trim().length > 0)
            .map((l) => {
                const leading = l.length - l.trimStart().length;
                return { name: l.trim(), depth: Math.floor(leading / 2) };
            });
        if (names.length === 0) {
            setError("A scheme must have at least one bone name.");
            return;
        }
        if (trimmedName !== editing.originalName && manager.getNamingScheme(trimmedName) !== undefined) {
            setError(`A naming scheme "${trimmedName}" already exists.`);
            return;
        }
        if (editing.originalName && editing.originalName !== trimmedName) {
            try {
                manager.removeNamingScheme(editing.originalName);
            } catch {
                // ignore
            }
        }
        manager.addNamingScheme(trimmedName, names);
        setEditingWithNotify(null);
        setError(null);
        onMutate();
    }, [editing, manager, onMutate, setEditingWithNotify]);

    const handleCancel = useCallback(() => {
        setEditingWithNotify(null);
        setError(null);
    }, [setEditingWithNotify]);

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
                        <DialogTitle>Delete Naming Scheme</DialogTitle>
                        <DialogContent>
                            Delete scheme <strong>"{confirmDelete}"</strong>? All remappings that reference it will also be removed.
                        </DialogContent>
                        <DialogActions>
                            <Button appearance="secondary" label="Cancel" onClick={() => setConfirmDelete(null)} />
                            <Button appearance="primary" label="Delete" onClick={handleConfirmDelete} />
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            <div className={classes.listHeader}>
                <div className={classes.listButtons}>
                    <Button icon={ArrowCounterclockwiseRegular} label="Recreate Defaults" onClick={handleRecreateDefaults} disabled={!!editing} />
                    <Button icon={AddRegular} label="Add" onClick={startAdd} disabled={!!editing} />
                </div>
            </div>
            <div className={classes.listArea} style={{ flex: editing ? "0 0 auto" : 1, maxHeight: editing ? "160px" : undefined }}>
                {schemeNames.length === 0 && <span className={classes.emptyMsg}>No naming schemes defined.</span>}
                {schemeNames.map((name) => {
                    const count = manager.getNamingScheme(name)?.length ?? 0;
                    return (
                        <div key={name} className={classes.listRow}>
                            <span className={classes.listRowName}>{name}</span>
                            <span className={classes.listRowMeta}>
                                {count} bone{count !== 1 ? "s" : ""}
                            </span>
                            <Button appearance="transparent" icon={EditRegular} title="Edit" disabled={!!editing} onClick={() => startEdit(name)} />
                            <Button appearance="transparent" icon={DeleteRegular} title="Delete" disabled={!!editing} onClick={() => handleDelete(name)} />
                        </div>
                    );
                })}
            </div>
            {!editing && error && <span className={classes.errorText}>{error}</span>}
            {editing && (
                <div className={classes.editSectionFlex}>
                    <Body1Strong>{editing.originalName ? `Editing "${editing.originalName}"` : "New Scheme"}</Body1Strong>
                    <div className={classes.formRow}>
                        <Label className={classes.formLabel}>Name</Label>
                        <TextInput className={classes.formControl} value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
                    </div>
                    <div className={classes.formRow}>
                        <Label className={classes.formLabel}>Populate from</Label>
                        <Select
                            className={classes.formControl}
                            size="small"
                            disabled={isPopulating}
                            onChange={(_, d) => {
                                if (d.value) {
                                    void handlePopulate(d.value);
                                }
                            }}
                        >
                            {populateOptions.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </Select>
                        {isPopulating && <Spinner size="tiny" />}
                    </div>
                    <div style={{ display: "flex", flex: 1, minHeight: 0, gap: tokens.spacingHorizontalS }}>
                        <Label className={classes.formLabel} style={{ paddingTop: "6px", flexShrink: 0 }}>
                            Bone names
                        </Label>
                        <textarea
                            className={classes.boneTextarea}
                            value={editing.namesText}
                            placeholder="One bone name per line"
                            onChange={(e) => setEditing({ ...editing, namesText: e.target.value })}
                        />
                    </div>
                    {error && <span className={classes.errorText}>{error}</span>}
                    <div className={classes.actionRow}>
                        <Button appearance="secondary" label="Cancel" onClick={handleCancel} />
                        <Button appearance="primary" label="Save" onClick={handleSave} />
                    </div>
                </div>
            )}
        </div>
    );
};

// Returns the set of from-bone names whose mapped-to target appears more than once (duplicate targets).
function ComputeFaultyBones(map: Map<string, string>): Set<string> {
    const targetCount = new Map<string, string[]>();
    for (const [from, to] of map) {
        if (to === "") {
            continue;
        }
        const list = targetCount.get(to) ?? [];
        list.push(from);
        targetCount.set(to, list);
    }
    const faulty = new Set<string>();
    for (const froms of targetCount.values()) {
        if (froms.length > 1) {
            for (const f of froms) {
                faulty.add(f);
            }
        }
    }
    return faulty;
}

// ─── Remappings Panel ─────────────────────────────────────────────────────────

const RemappingsPanel: FunctionComponent<{
    manager: NamingSchemeManager;
    onMutate: () => void;
    onEditingChange: (editing: boolean) => void;
}> = ({ manager, onMutate, onEditingChange }) => {
    const classes = useStyles();
    const [editing, setEditing] = useState<RemappingEdit | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<{ from: string; to: string } | null>(null);
    const [faultyBones, setFaultyBones] = useState<Set<string>>(new Set());

    const setEditingWithNotify = useCallback(
        (value: RemappingEdit | null) => {
            setEditing(value);
            onEditingChange(value !== null);
        },
        [onEditingChange]
    );

    const schemeNames = manager.getAllSchemeNames().sort((a, b) => a.localeCompare(b));
    const allRemappings = [...manager.getAllRemappings()].sort((a, b) => `${a.fromScheme}→${a.toScheme}`.localeCompare(`${b.fromScheme}→${b.toScheme}`));

    const startAdd = useCallback(() => {
        if (schemeNames.length < 2) {
            return;
        }
        const fromScheme = schemeNames[0];
        const toScheme = schemeNames[1];
        setEditingWithNotify({ fromScheme, toScheme, map: new Map(), isNew: true });
        setError(null);
        setFaultyBones(new Set());
    }, [schemeNames, setEditingWithNotify]);

    const startEdit = useCallback(
        (fromScheme: string, toScheme: string) => {
            const map = manager.getRemapping(fromScheme, toScheme) ?? new Map();
            setEditingWithNotify({ fromScheme, toScheme, map, isNew: false });
            setError(null);
            setFaultyBones(ComputeFaultyBones(map));
        },
        [manager, setEditingWithNotify]
    );

    const handleDelete = useCallback((fromScheme: string, toScheme: string) => {
        setConfirmDelete({ from: fromScheme, to: toScheme });
    }, []);

    const handleConfirmDelete = useCallback(() => {
        if (!confirmDelete) {
            return;
        }
        try {
            manager.removeRemapping(confirmDelete.from, confirmDelete.to);
            onMutate();
        } catch {
            // ignore
        }
        setConfirmDelete(null);
    }, [confirmDelete, manager, onMutate]);

    const handleRecreateDefaults = useCallback(() => {
        const changed = manager.recreateDefaultRemappings();
        if (changed) {
            onMutate();
        }
    }, [manager, onMutate]);

    const handleSwapSchemes = useCallback(() => {
        if (!editing) {
            return;
        }
        // Invert the map: swap keys and values, dropping empty-string values (no inverse).
        const invertedMap = new Map<string, string>();
        for (const [k, v] of editing.map) {
            if (v !== "") {
                invertedMap.set(v, k);
            }
        }
        setEditing({ ...editing, fromScheme: editing.toScheme, toScheme: editing.fromScheme, map: invertedMap });
    }, [editing]);

    const handleFromSchemeChange = useCallback(
        (newFrom: string) => {
            if (!editing) {
                return;
            }
            let toScheme = editing.toScheme;
            if (toScheme === newFrom) {
                toScheme = schemeNames.find((n) => n !== newFrom) ?? newFrom;
            }
            setEditing({ ...editing, fromScheme: newFrom, toScheme, map: new Map() });
        },
        [editing, schemeNames]
    );

    const handleToSchemeChange = useCallback(
        (newTo: string) => {
            if (!editing) {
                return;
            }
            setEditing({ ...editing, toScheme: newTo, map: new Map() });
        },
        [editing]
    );

    const handleMappingChange = useCallback(
        (fromBone: string, toBone: string) => {
            if (!editing) {
                return;
            }
            const newMap = new Map(editing.map);
            newMap.set(fromBone, toBone);
            setEditing({ ...editing, map: newMap });
            const faulty = ComputeFaultyBones(newMap);
            setFaultyBones(faulty);
            if (faulty.size === 0) {
                setError(null);
            } else {
                setError("Multiple bones are mapped to the same target. Each target must be unique.");
            }
        },
        [editing]
    );

    const handleSave = useCallback(() => {
        if (!editing) {
            return;
        }
        if (editing.fromScheme === editing.toScheme) {
            setError("From and To schemes must be different.");
            return;
        }
        try {
            manager.addRemapping(editing.fromScheme, editing.toScheme, editing.map);
            setEditingWithNotify(null);
            setError(null);
            setFaultyBones(new Set());
            onMutate();
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
        }
    }, [editing, manager, onMutate, setEditingWithNotify]);

    const handleCancel = useCallback(() => {
        setEditingWithNotify(null);
        setError(null);
        setFaultyBones(new Set());
    }, [setEditingWithNotify]);

    const fromSchemeEntries = useMemo(() => (editing ? (manager.getNamingScheme(editing.fromScheme) ?? []) : []), [editing?.fromScheme, manager]);

    const toSchemeEntries = useMemo(() => (editing ? (manager.getNamingScheme(editing.toScheme) ?? []) : []), [editing?.toScheme, manager]);

    // For new remappings, check in real-time whether a remapping between these two schemes already exists.
    const schemeConflict = editing?.isNew
        ? allRemappings.find(
              (r) => (r.fromScheme === editing.fromScheme && r.toScheme === editing.toScheme) || (r.fromScheme === editing.toScheme && r.toScheme === editing.fromScheme)
          )
        : undefined;
    const conflictLabel = schemeConflict ? `${schemeConflict.fromScheme} → ${schemeConflict.toScheme}` : null;

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
                        <DialogTitle>Delete Remapping</DialogTitle>
                        <DialogContent>
                            Delete remapping{" "}
                            <strong>
                                "{confirmDelete?.from}" → "{confirmDelete?.to}"
                            </strong>
                            ?
                        </DialogContent>
                        <DialogActions>
                            <Button appearance="secondary" label="Cancel" onClick={() => setConfirmDelete(null)} />
                            <Button appearance="primary" label="Delete" onClick={handleConfirmDelete} />
                        </DialogActions>
                    </DialogBody>
                </DialogSurface>
            </Dialog>

            <div className={classes.listHeader}>
                <div className={classes.listButtons}>
                    <Button icon={ArrowCounterclockwiseRegular} label="Recreate Defaults" onClick={handleRecreateDefaults} disabled={!!editing} />
                    <Button icon={AddRegular} label="Add" onClick={startAdd} disabled={!!editing || schemeNames.length < 2} />
                </div>
            </div>
            <div className={classes.listArea} style={{ flex: editing ? "0 0 auto" : 1, maxHeight: editing ? "140px" : undefined }}>
                {allRemappings.length === 0 && <span className={classes.emptyMsg}>No remappings defined.</span>}
                {allRemappings.map(({ fromScheme, toScheme }) => (
                    <div key={`${fromScheme}|${toScheme}`} className={classes.listRow}>
                        <span className={classes.listRowName}>
                            {fromScheme} → {toScheme}
                        </span>
                        <Button appearance="transparent" icon={EditRegular} title="Edit" disabled={!!editing} onClick={() => startEdit(fromScheme, toScheme)} />
                        <Button appearance="transparent" icon={DeleteRegular} title="Delete" disabled={!!editing} onClick={() => handleDelete(fromScheme, toScheme)} />
                    </div>
                ))}
            </div>
            {editing && (
                <div className={classes.editSectionFlex}>
                    <Body1Strong>{editing.isNew ? "New Remapping" : `Editing "${editing.fromScheme}" → "${editing.toScheme}"`}</Body1Strong>
                    <div className={classes.formRow}>
                        <Label className={classes.formLabel}>From scheme</Label>
                        <StringDropdown
                            className={classes.formControl}
                            value={editing.fromScheme}
                            disabled={!editing.isNew}
                            options={schemeNames.map((n) => ({ label: n, value: n }))}
                            onChange={(v) => handleFromSchemeChange(v)}
                        />
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <Button appearance="transparent" icon={ArrowBidirectionalUpDownRegular} title="Swap From / To schemes" onClick={handleSwapSchemes} />
                    </div>
                    <div className={classes.formRow}>
                        <Label className={classes.formLabel}>To scheme</Label>
                        <StringDropdown
                            className={classes.formControl}
                            value={editing.toScheme}
                            disabled={!editing.isNew}
                            options={schemeNames.filter((n) => n !== editing.fromScheme).map((n) => ({ label: n, value: n }))}
                            onChange={(v) => handleToSchemeChange(v)}
                        />
                    </div>
                    {conflictLabel && <span className={classes.errorText}>A remapping "{conflictLabel}" already exists. Edit that remapping instead.</span>}
                    <Caption1 style={{ color: tokens.colorNeutralForeground3 }}>{fromSchemeEntries.length} bones — select the target bone for each, or leave blank.</Caption1>
                    <div className={classes.mappingTable}>
                        {fromSchemeEntries.map((entry) => (
                            <div key={entry.name} className={mergeClasses(classes.mappingRow, faultyBones.has(entry.name) ? classes.mappingRowError : undefined)}>
                                <span className={classes.mappingBoneName} title={entry.name}>
                                    {"\u00A0\u00A0".repeat(entry.depth) + entry.name}
                                </span>
                                <select
                                    className={classes.mappingSelect}
                                    value={editing.map.get(entry.name) ?? ""}
                                    onChange={(e) => handleMappingChange(entry.name, e.target.value)}
                                >
                                    <option value="">— (no mapping)</option>
                                    {toSchemeEntries.map((toEntry) => (
                                        <option key={toEntry.name} value={toEntry.name}>
                                            {"\u00A0\u00A0".repeat(toEntry.depth) + toEntry.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                    {error && <span className={classes.errorText}>{error}</span>}
                    <div className={classes.actionRow}>
                        <Button appearance="secondary" label="Cancel" onClick={handleCancel} />
                        <Button appearance="primary" label="Save" onClick={handleSave} disabled={!!conflictLabel || faultyBones.size > 0} />
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export type RetargetingConfigDialogProps = {
    manager: NamingSchemeManager;
    avatarManager: AvatarManager;
    animationManager: AnimationManager;
    open: boolean;
    onClose: () => void;
};

export const RetargetingConfigDialog: FunctionComponent<RetargetingConfigDialogProps> = ({ manager, avatarManager, animationManager, open, onClose }) => {
    const classes = useStyles();
    const [activeTab, setActiveTab] = useState<"avatars" | "animations" | "schemes" | "remappings">("avatars");
    const [version, setVersion] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [confirmClose, setConfirmClose] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [pendingImport, setPendingImport] = useState<any>(null);
    const [importResult, setImportResult] = useState<string | null>(null);
    const surfaceRef = useRef<HTMLElement>(null);
    const importInputRef = useRef<HTMLInputElement>(null);
    const onMutate = useCallback(() => setVersion((v) => v + 1), []);
    const onEditingChange = useCallback((editing: boolean) => setIsEditing(editing), []);

    // Observe the surface size and persist it for the session so close/reopen keeps the same dimensions.
    useEffect(() => {
        if (!open) {
            // Reset editing state so it's clean when the dialog is reopened.
            setIsEditing(false);
            setConfirmClose(false);
            return;
        }
        const el = surfaceRef.current;
        if (!el) {
            return;
        }
        const observer = new ResizeObserver(() => {
            SavedDialogSize = { width: el.offsetWidth, height: el.offsetHeight };
        });
        observer.observe(el);
        return () => observer.disconnect();
    }, [open]);

    const handleClose = useCallback(() => {
        if (isEditing) {
            setConfirmClose(true);
        } else {
            onClose();
        }
    }, [isEditing, onClose]);

    const handleExport = useCallback(async () => {
        const exportObj = {
            avatars: await avatarManager.exportDataAsync(),
            animations: await animationManager.exportDataAsync(),
            namingSchemes: manager.exportData(),
        };
        const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "retargeting-config.json";
        a.click();
        URL.revokeObjectURL(url);
    }, [avatarManager, animationManager, manager]);

    const handleImportFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const data = JSON.parse(reader.result as string);
                setPendingImport(data);
            } catch {
                setImportResult("Failed to parse JSON file.");
            }
        };
        reader.readAsText(file);
        e.target.value = ""; // reset so same file can be re-selected
    }, []);

    const handleImport = useCallback(
        async (mode: "replace" | "append") => {
            if (!pendingImport) {
                return;
            }
            const skipped: string[] = [];
            if (pendingImport.namingSchemes) {
                skipped.push(...manager.importData(pendingImport.namingSchemes, mode));
            }
            if (pendingImport.avatars) {
                skipped.push(...(await avatarManager.importDataAsync(pendingImport.avatars, mode)));
            }
            if (pendingImport.animations) {
                skipped.push(...(await animationManager.importDataAsync(pendingImport.animations, mode)));
            }
            setPendingImport(null);
            onMutate();
            if (skipped.length > 0) {
                setImportResult(`Imported with ${skipped.length} skipped: ${skipped.join(", ")}`);
            } else {
                setImportResult("Import completed successfully.");
            }
        },
        [pendingImport, manager, avatarManager, animationManager, onMutate]
    );

    // version is read to force a re-render of the child panels after mutations
    void version;

    return (
        <Dialog
            open={open}
            onOpenChange={(_, d) => {
                if (!d.open && d.type === "escapeKeyDown") {
                    handleClose();
                }
            }}
        >
            <DialogSurface
                ref={surfaceRef as React.Ref<HTMLDivElement>}
                className={classes.surface}
                style={SavedDialogSize ? { width: `${SavedDialogSize.width}px`, height: `${SavedDialogSize.height}px` } : undefined}
            >
                <DialogBody className={classes.body}>
                    <div className={classes.titleRow}>
                        <DialogTitle action={null}>Retargeting Configuration</DialogTitle>
                        <div className={classes.titleButtons}>
                            <Button appearance="subtle" icon={ArrowDownloadRegular} onClick={handleExport} title="Export configuration" disabled={isEditing} />
                            <Button
                                appearance="subtle"
                                icon={ArrowUploadRegular}
                                onClick={() => importInputRef.current?.click()}
                                title="Import configuration"
                                disabled={isEditing}
                            />
                            <input ref={importInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImportFile} />
                            <Button appearance="subtle" icon={DismissRegular} onClick={handleClose} title="Close" />
                        </div>
                    </div>
                    {/* Import mode chooser dialog */}
                    <Dialog
                        open={pendingImport !== null}
                        onOpenChange={(_, d) => {
                            if (!d.open) {
                                setPendingImport(null);
                            }
                        }}
                    >
                        <DialogSurface className={classes.confirmSurface}>
                            <DialogBody>
                                <DialogTitle>Import Configuration</DialogTitle>
                                <DialogContent>
                                    <strong>Replace</strong> all existing data, or <strong>Append</strong> and skip duplicates?
                                </DialogContent>
                                <DialogActions>
                                    <Button appearance="secondary" label="Cancel" onClick={() => setPendingImport(null)} />
                                    <Button
                                        appearance="primary"
                                        label="Replace"
                                        onClick={() => {
                                            void handleImport("replace");
                                        }}
                                    />
                                    <Button
                                        appearance="primary"
                                        label="Append"
                                        onClick={() => {
                                            void handleImport("append");
                                        }}
                                    />
                                </DialogActions>
                            </DialogBody>
                        </DialogSurface>
                    </Dialog>
                    {/* Import result dialog */}
                    <Dialog
                        open={importResult !== null}
                        onOpenChange={(_, d) => {
                            if (!d.open) {
                                setImportResult(null);
                            }
                        }}
                    >
                        <DialogSurface className={classes.confirmSurface}>
                            <DialogBody>
                                <DialogTitle>Import Result</DialogTitle>
                                <DialogContent>{importResult}</DialogContent>
                                <DialogActions>
                                    <Button appearance="primary" label="OK" onClick={() => setImportResult(null)} />
                                </DialogActions>
                            </DialogBody>
                        </DialogSurface>
                    </Dialog>
                    {/* Confirm close when edits are pending */}
                    <Dialog
                        open={confirmClose}
                        onOpenChange={(_, d) => {
                            if (!d.open) {
                                setConfirmClose(false);
                            }
                        }}
                    >
                        <DialogSurface className={classes.confirmSurface}>
                            <DialogBody>
                                <DialogTitle>Unsaved Changes</DialogTitle>
                                <DialogContent>You may have unsaved changes. Close anyway and lose them?</DialogContent>
                                <DialogActions>
                                    <Button appearance="secondary" label="Cancel" onClick={() => setConfirmClose(false)} />
                                    <Button
                                        appearance="primary"
                                        label="Close Anyway"
                                        onClick={() => {
                                            setConfirmClose(false);
                                            onClose();
                                        }}
                                    />
                                </DialogActions>
                            </DialogBody>
                        </DialogSurface>
                    </Dialog>
                    <TabList
                        className={classes.tabList}
                        selectedValue={activeTab}
                        onTabSelect={(_, d) => {
                            if (!isEditing) {
                                setActiveTab(d.value as "avatars" | "animations" | "schemes" | "remappings");
                            }
                        }}
                    >
                        <Tab value="avatars" disabled={isEditing && activeTab !== "avatars"}>
                            Avatars
                        </Tab>
                        <Tab value="animations" disabled={isEditing && activeTab !== "animations"}>
                            Animations
                        </Tab>
                        <Tab value="schemes" disabled={isEditing && activeTab !== "schemes"}>
                            Naming Schemes
                        </Tab>
                        <Tab value="remappings" disabled={isEditing && activeTab !== "remappings"}>
                            Scheme Remappings
                        </Tab>
                    </TabList>
                    <DialogContent className={classes.content}>
                        {activeTab === "avatars" ? (
                            <AvatarsPanel avatarManager={avatarManager} namingSchemeManager={manager} onMutate={onMutate} onEditingChange={onEditingChange} />
                        ) : activeTab === "animations" ? (
                            <AnimationsPanel animationManager={animationManager} namingSchemeManager={manager} onMutate={onMutate} onEditingChange={onEditingChange} />
                        ) : activeTab === "schemes" ? (
                            <SchemesPanel
                                manager={manager}
                                avatarManager={avatarManager}
                                animationManager={animationManager}
                                onMutate={onMutate}
                                onEditingChange={onEditingChange}
                            />
                        ) : (
                            <RemappingsPanel manager={manager} onMutate={onMutate} onEditingChange={onEditingChange} />
                        )}
                    </DialogContent>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
};
