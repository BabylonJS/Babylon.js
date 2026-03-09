import type { FunctionComponent } from "react";
import type { NamingSchemeManager, BoneEntry } from "./namingSchemeManager";

import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
    Dialog,
    DialogBody,
    DialogTitle,
    DialogContent,
    DialogActions,
    DialogSurface,
    Button,
    Tab,
    TabList,
    Input,
    Select,
    Label,
    makeStyles,
    mergeClasses,
    tokens,
    Body1Strong,
    Caption1,
} from "@fluentui/react-components";
import { Add20Regular, Delete20Regular, Edit20Regular, ArrowCounterclockwise20Regular, ArrowBidirectionalUpDown20Regular, Dismiss20Regular } from "@fluentui/react-icons";

// ─── Styles ───────────────────────────────────────────────────────────────────

const useStyles = makeStyles({
    surface: {
        width: "820px",
        minWidth: "400px",
        maxWidth: "95vw",
        height: "660px",
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
        padding: `2px ${tokens.spacingHorizontalS}`,
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
        padding: "2px 4px",
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
});

// Session-only size persistence: survives dialog close/reopen but not page reload.
let _savedDialogSize: { width: number; height: number } | null = null;

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

// ─── Schemes Panel ────────────────────────────────────────────────────────────

const SchemesPanel: FunctionComponent<{
    manager: NamingSchemeManager;
    onMutate: () => void;
    onEditingChange: (editing: boolean) => void;
}> = ({ manager, onMutate, onEditingChange }) => {
    const classes = useStyles();
    const [editing, setEditing] = useState<SchemeEdit | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

    const setEditingWithNotify = useCallback(
        (value: SchemeEdit | null) => {
            setEditing(value);
            onEditingChange(value !== null);
        },
        [onEditingChange]
    );

    const schemeNames = manager.getAllSchemeNames();

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

    const handleDelete = useCallback((name: string) => {
        setConfirmDelete(name);
    }, []);

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
                    <Button size="small" icon={<ArrowCounterclockwise20Regular />} onClick={handleRecreateDefaults} disabled={!!editing}>
                        Recreate Defaults
                    </Button>
                    <Button size="small" icon={<Add20Regular />} onClick={startAdd} disabled={!!editing}>
                        Add
                    </Button>
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
                            <Button size="small" appearance="transparent" icon={<Edit20Regular />} title="Edit" disabled={!!editing} onClick={() => startEdit(name)} />
                            <Button size="small" appearance="transparent" icon={<Delete20Regular />} title="Delete" disabled={!!editing} onClick={() => handleDelete(name)} />
                        </div>
                    );
                })}
            </div>
            {editing && (
                <div className={classes.editSectionFlex}>
                    <Body1Strong>{editing.originalName ? `Editing "${editing.originalName}"` : "New Scheme"}</Body1Strong>
                    <div className={classes.formRow}>
                        <Label className={classes.formLabel}>Name</Label>
                        <Input className={classes.formControl} value={editing.name} onChange={(_, d) => setEditing({ ...editing, name: d.value })} />
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

// Returns the set of from-bone names whose mapped-to target appears more than once (duplicate targets).
function computeFaultyBones(map: Map<string, string>): Set<string> {
    const targetCount = new Map<string, string[]>();
    for (const [from, to] of map) {
        if (to === "") continue;
        const list = targetCount.get(to) ?? [];
        list.push(from);
        targetCount.set(to, list);
    }
    const faulty = new Set<string>();
    for (const froms of targetCount.values()) {
        if (froms.length > 1) {
            for (const f of froms) faulty.add(f);
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

    const schemeNames = manager.getAllSchemeNames();
    const allRemappings = manager.getAllRemappings();

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
            setFaultyBones(computeFaultyBones(map));
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
            const faulty = computeFaultyBones(newMap);
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

    const fromSchemeEntries = useMemo(
        () => (editing ? (manager.getNamingScheme(editing.fromScheme) ?? []) : []),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [editing?.fromScheme, manager]
    );

    const toSchemeEntries = useMemo(
        () => (editing ? (manager.getNamingScheme(editing.toScheme) ?? []) : []),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [editing?.toScheme, manager]
    );

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
                    <Button size="small" icon={<ArrowCounterclockwise20Regular />} onClick={handleRecreateDefaults} disabled={!!editing}>
                        Recreate Defaults
                    </Button>
                    <Button size="small" icon={<Add20Regular />} onClick={startAdd} disabled={!!editing || schemeNames.length < 2}>
                        Add
                    </Button>
                </div>
            </div>
            <div className={classes.listArea} style={{ flex: editing ? "0 0 auto" : 1, maxHeight: editing ? "140px" : undefined }}>
                {allRemappings.length === 0 && <span className={classes.emptyMsg}>No remappings defined.</span>}
                {allRemappings.map(({ fromScheme, toScheme }) => (
                    <div key={`${fromScheme}|${toScheme}`} className={classes.listRow}>
                        <span className={classes.listRowName}>
                            {fromScheme} → {toScheme}
                        </span>
                        <Button size="small" appearance="transparent" icon={<Edit20Regular />} title="Edit" disabled={!!editing} onClick={() => startEdit(fromScheme, toScheme)} />
                        <Button
                            size="small"
                            appearance="transparent"
                            icon={<Delete20Regular />}
                            title="Delete"
                            disabled={!!editing}
                            onClick={() => handleDelete(fromScheme, toScheme)}
                        />
                    </div>
                ))}
            </div>
            {editing && (
                <div className={classes.editSectionFlex}>
                    <Body1Strong>{editing.isNew ? "New Remapping" : `Editing "${editing.fromScheme}" → "${editing.toScheme}"`}</Body1Strong>
                    <div className={classes.formRow}>
                        <Label className={classes.formLabel}>From scheme</Label>
                        <Select className={classes.formControl} value={editing.fromScheme} disabled={!editing.isNew} onChange={(_, d) => handleFromSchemeChange(d.value)}>
                            {schemeNames.map((n) => (
                                <option key={n} value={n}>
                                    {n}
                                </option>
                            ))}
                        </Select>
                    </div>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <Button size="small" appearance="transparent" icon={<ArrowBidirectionalUpDown20Regular />} title="Swap From / To schemes" onClick={handleSwapSchemes} />
                    </div>
                    <div className={classes.formRow}>
                        <Label className={classes.formLabel}>To scheme</Label>
                        <Select className={classes.formControl} value={editing.toScheme} disabled={!editing.isNew} onChange={(_, d) => handleToSchemeChange(d.value)}>
                            {schemeNames
                                .filter((n) => n !== editing.fromScheme)
                                .map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                        </Select>
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
                        <Button size="small" appearance="secondary" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button size="small" appearance="primary" onClick={handleSave} disabled={!!conflictLabel || faultyBones.size > 0}>
                            Save
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main Dialog ──────────────────────────────────────────────────────────────

export type NamingSchemeManagerDialogProps = {
    manager: NamingSchemeManager;
    open: boolean;
    onClose: () => void;
};

export const NamingSchemeManagerDialog: FunctionComponent<NamingSchemeManagerDialogProps> = ({ manager, open, onClose }) => {
    const classes = useStyles();
    const [activeTab, setActiveTab] = useState<"schemes" | "remappings">("schemes");
    const [version, setVersion] = useState(0);
    const [isEditing, setIsEditing] = useState(false);
    const [confirmClose, setConfirmClose] = useState(false);
    const surfaceRef = useRef<HTMLElement>(null);
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
            _savedDialogSize = { width: el.offsetWidth, height: el.offsetHeight };
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
                style={_savedDialogSize ? { width: `${_savedDialogSize.width}px`, height: `${_savedDialogSize.height}px` } : undefined}
            >
                <DialogBody className={classes.body}>
                    <div className={classes.titleRow}>
                        <DialogTitle action={null}>Naming Scheme Manager</DialogTitle>
                        <Button appearance="subtle" icon={<Dismiss20Regular />} onClick={handleClose} title="Close" aria-label="Close" />
                    </div>
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
                                    <Button appearance="secondary" onClick={() => setConfirmClose(false)}>
                                        Cancel
                                    </Button>
                                    <Button
                                        appearance="primary"
                                        onClick={() => {
                                            setConfirmClose(false);
                                            onClose();
                                        }}
                                    >
                                        Close Anyway
                                    </Button>
                                </DialogActions>
                            </DialogBody>
                        </DialogSurface>
                    </Dialog>
                    <TabList
                        className={classes.tabList}
                        selectedValue={activeTab}
                        onTabSelect={(_, d) => {
                            if (!isEditing) {
                                setActiveTab(d.value as "schemes" | "remappings");
                            }
                        }}
                    >
                        <Tab value="schemes" disabled={isEditing && activeTab !== "schemes"}>
                            Naming Schemes
                        </Tab>
                        <Tab value="remappings" disabled={isEditing && activeTab !== "remappings"}>
                            Remappings
                        </Tab>
                    </TabList>
                    <DialogContent className={classes.content}>
                        {activeTab === "schemes" ? (
                            <SchemesPanel manager={manager} onMutate={onMutate} onEditingChange={onEditingChange} />
                        ) : (
                            <RemappingsPanel manager={manager} onMutate={onMutate} onEditingChange={onEditingChange} />
                        )}
                    </DialogContent>
                </DialogBody>
            </DialogSurface>
        </Dialog>
    );
};
