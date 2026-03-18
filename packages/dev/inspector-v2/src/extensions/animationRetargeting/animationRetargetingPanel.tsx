import type { FunctionComponent } from "react";
import type { Observable } from "core/Misc/observable";
import { FilesInputStore } from "core/Misc/filesInputStore";
import { SceneLoader } from "core/Loading/sceneLoader";
import type { Transform } from "../../components/properties/transformProperties";
import { makeStyles, tokens, Body1Strong } from "@fluentui/react-components";
import { useCallback, useEffect, useRef, useState } from "react";
import { Accordion as BabylonAccordion, AccordionSection as BabylonAccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { CheckboxPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/checkboxPropertyLine";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { StringDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { BoneDropdown } from "./boneDropdown";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { TransformProperties } from "../../components/properties/transformProperties";
import type { RetargetingSceneManager } from "./retargetingSceneManager";
import type { NamingSchemeManager } from "./namingSchemeManager";
import type { AvatarManager } from "./avatarManager";
import type { AnimationManager } from "./animationManager";
import type { GizmoType } from "./avatar";

/**
 * Mirrors gui.ts _getSourceTransformNodeList: returns animation transform nodes filtered
 * to only those that have a bone remapping entry for the current avatar/animation pair.
 * Matches original PG behaviour for "Root node" and "Ground ref. node" dropdowns.
 */
function BuildFilteredBoneList(
    names: string[],
    animName: string,
    avatarName: string,
    namingSchemeManager: NamingSchemeManager,
    avatarManager: AvatarManager,
    animationManager: AnimationManager
): string[] {
    const sourceScheme = animationManager.getAnimation(animName)?.namingScheme;
    const targetScheme = avatarManager.getAvatar(avatarName)?.namingScheme;
    if (!sourceScheme || !targetScheme) {
        return names;
    }
    const remapping = namingSchemeManager.getRemapping(sourceScheme, targetScheme);
    if (!remapping) {
        return names;
    }
    const result: string[] = [];
    for (const [key] of remapping) {
        if (names.includes(key)) {
            result.push(key);
        }
    }
    return result;
}

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
    },
    enableRow: {
        display: "none", // removed: button moved to title bar headerExtra
    },
    actionRow: {
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
        gap: tokens.spacingVerticalXS,
        padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
        backgroundColor: tokens.colorNeutralBackground2,
        borderBottom: `1px solid ${tokens.colorNeutralStroke2}`,
    },
    scrollContent: {
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
    },
    disabledOverlay: {
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: tokens.colorNeutralForeground3,
        fontSize: "13px",
        fontStyle: "italic",
    },
    boneDropdownLabel: {
        flex: "1 1 0",
        minWidth: "50px",
        textAlign: "left",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    boneDropdownWrapper: {
        display: "flex",
        alignItems: "center",
        width: "100%",
        paddingTop: tokens.spacingVerticalXXS,
        paddingBottom: tokens.spacingVerticalXXS,
        minHeight: tokens.lineHeightHero700,
        boxSizing: "border-box",
    },
    boneDropdownControl: {
        width: "225px", // 150px (standard) * 1.5 = 50% larger
        boxSizing: "border-box",
        flexShrink: 0,
    },
});

const GizmoTypeOptions: { label: string; value: string }[] = [
    { label: "Position", value: "Position" },
    { label: "Rotation", value: "Rotation" },
    { label: "Scale", value: "Scale" },
];
const VerticalAxisOptions: { label: string; value: string }[] = [
    { label: "Auto", value: "" },
    { label: "X", value: "X" },
    { label: "Y", value: "Y" },
    { label: "Z", value: "Z" },
];

export type PanelStateStore = {
    avatarName: string;
    avatarRescaleAvatar: boolean;
    avatarAnimSpeed: number;
    avatarShowSkeleton: boolean;
    avatarShowSkeletonLocalAxes: boolean;
    avatarGizmoEnabled: boolean;
    avatarGizmoType: string;
    avatarGizmoSelectedNode: string;
    animationName: string;
    animationSpeed: number;
    animationShowSkeletonLocalAxes: boolean;
    animationGizmoEnabled: boolean;
    animationGizmoType: string;
    animationGizmoSelectedNode: string;
    fixAnimations: boolean;
    checkHierarchy: boolean;
    retargetAnimationKeys: boolean;
    fixRootPosition: boolean;
    fixGroundReference: boolean;
    fixGroundReferenceDynamicRefNode: boolean;
    rootNodeName: string;
    groundReferenceNodeName: string;
    groundReferenceVerticalAxis: string;
};

export const DefaultPanelState: PanelStateStore = {
    avatarName: "",
    avatarRescaleAvatar: true,
    avatarAnimSpeed: 1,
    avatarShowSkeleton: false,
    avatarShowSkeletonLocalAxes: false,
    avatarGizmoEnabled: false,
    avatarGizmoType: "Rotation",
    avatarGizmoSelectedNode: "",
    animationName: "",
    animationSpeed: 1,
    animationShowSkeletonLocalAxes: false,
    animationGizmoEnabled: false,
    animationGizmoType: "Rotation",
    animationGizmoSelectedNode: "",
    fixAnimations: false,
    checkHierarchy: false,
    retargetAnimationKeys: true,
    fixRootPosition: true,
    fixGroundReference: false,
    fixGroundReferenceDynamicRefNode: false,
    rootNodeName: "Auto",
    groundReferenceNodeName: "",
    groundReferenceVerticalAxis: "",
};

export type AnimationRetargetingPanelProps = {
    initialIsEnabled: boolean;
    isEnabledObs: Observable<boolean>;
    onConfigChangedObs: Observable<void>;
    onManagerReadyObs: Observable<RetargetingSceneManager>;
    getCurrentManager: () => RetargetingSceneManager | null;
    namingSchemeManager: NamingSchemeManager;
    avatarManager: AvatarManager;
    animationManager: AnimationManager;
    /** Persisted across remounts (e.g. when the panel is docked elsewhere). Lives in the extension closure. */
    stateStore: PanelStateStore;
};

export const AnimationRetargetingPanel: FunctionComponent<AnimationRetargetingPanelProps> = ({
    initialIsEnabled,
    isEnabledObs,
    onConfigChangedObs,
    onManagerReadyObs,
    getCurrentManager,
    namingSchemeManager,
    avatarManager,
    animationManager,
    stateStore,
}) => {
    const classes = useStyles();
    const managerRef = useRef<RetargetingSceneManager | null>(null);
    const [isEnabled, setIsEnabled] = useState(initialIsEnabled);
    const [, forceUpdate] = useState(0);

    // Avatar state
    const [avatarName, setAvatarName] = useState(() => stateStore.avatarName);
    const [avatarRescaleAvatar, setAvatarRescaleAvatar] = useState(() => stateStore.avatarRescaleAvatar);
    const [avatarAnimSpeed, setAvatarAnimSpeed] = useState(() => stateStore.avatarAnimSpeed);
    const [avatarShowSkeleton, setAvatarShowSkeleton] = useState(() => stateStore.avatarShowSkeleton);
    const [avatarShowSkeletonLocalAxes, setAvatarShowSkeletonLocalAxes] = useState(() => stateStore.avatarShowSkeletonLocalAxes);
    const [avatarGizmoEnabled, setAvatarGizmoEnabled] = useState(() => stateStore.avatarGizmoEnabled);
    const [avatarGizmoType, setAvatarGizmoType] = useState<string>(() => stateStore.avatarGizmoType);
    const [avatarGizmoSelectedNode, setAvatarGizmoSelectedNode] = useState(() => stateStore.avatarGizmoSelectedNode);

    // Animation state
    const [animationName, setAnimationName] = useState(() => stateStore.animationName);
    const [animationSpeed, setAnimationSpeed] = useState(() => stateStore.animationSpeed);
    const [animationShowSkeletonLocalAxes, setAnimationShowSkeletonLocalAxes] = useState(() => stateStore.animationShowSkeletonLocalAxes);
    const [animationGizmoEnabled, setAnimationGizmoEnabled] = useState(() => stateStore.animationGizmoEnabled);
    const [animationGizmoType, setAnimationGizmoType] = useState<string>(() => stateStore.animationGizmoType);
    const [animationGizmoSelectedNode, setAnimationGizmoSelectedNode] = useState(() => stateStore.animationGizmoSelectedNode);

    // Retarget options
    const [fixAnimations, setFixAnimations] = useState(() => stateStore.fixAnimations);
    const [checkHierarchy, setCheckHierarchy] = useState(() => stateStore.checkHierarchy);
    const [retargetAnimationKeys, setRetargetAnimationKeys] = useState(() => stateStore.retargetAnimationKeys);
    const [fixRootPosition, setFixRootPosition] = useState(() => stateStore.fixRootPosition);
    const [fixGroundReference, setFixGroundReference] = useState(() => stateStore.fixGroundReference);
    const [fixGroundReferenceDynamicRefNode, setFixGroundReferenceDynamicRefNode] = useState(() => stateStore.fixGroundReferenceDynamicRefNode);
    const [rootNodeName, setRootNodeName] = useState(() => stateStore.rootNodeName);
    const [groundReferenceNodeName, setGroundReferenceNodeName] = useState(() => stateStore.groundReferenceNodeName);
    const [groundReferenceVerticalAxis, setGroundReferenceVerticalAxis] = useState(() => stateStore.groundReferenceVerticalAxis);

    // Dynamic bone lists
    const [avatarBoneOptions, setAvatarBoneOptions] = useState<{ label: string; value: string }[]>([]);
    const [rootNodeOptions, setRootNodeOptions] = useState([{ label: "Auto", value: "Auto" }]);
    const [groundRefNodeOptions, setGroundRefNodeOptions] = useState<{ label: string; value: string }[]>([]);

    // Dropdown options derived from managers — refreshed when config dialog closes
    const [avatarOptions, setAvatarOptions] = useState(() => avatarManager.getAllAvatars().map((a) => ({ label: a.name, value: a.name })));
    const [animationOptions, setAnimationOptions] = useState(() => animationManager.getAllAnimations().map((a) => ({ label: a.name, value: a.name })));

    // Selected bone/node transforms for the Properties section
    const [avatarGizmoSelectedTransform, setAvatarGizmoSelectedTransform] = useState<Transform | null>(null);
    const [animGizmoSelectedTransform, setAnimGizmoSelectedTransform] = useState<Transform | null>(null);

    // Loading / retargeted states
    const [isAvatarLoaded, setIsAvatarLoaded] = useState(false);
    const [isAnimLoaded, setIsAnimLoaded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isRetargeted, setIsRetargeted] = useState(false);
    const [isAvatarPlaying, setIsAvatarPlaying] = useState(false);
    const [isAnimPlaying, setIsAnimPlaying] = useState(false);

    // Refs tracking current values for callbacks (always up-to-date even in stale closures).
    // Updated synchronously during render so callbacks always read the latest values.
    // Also used to save all state to stateStore on unmount.
    const stateSnapshotRef = useRef({
        avatarName,
        avatarRescaleAvatar,
        avatarAnimSpeed,
        avatarShowSkeleton,
        avatarShowSkeletonLocalAxes,
        avatarGizmoEnabled,
        avatarGizmoType,
        avatarGizmoSelectedNode,
        animationName,
        animationSpeed,
        animationShowSkeletonLocalAxes,
        animationGizmoEnabled,
        animationGizmoType,
        animationGizmoSelectedNode,
        fixAnimations,
        checkHierarchy,
        retargetAnimationKeys,
        fixRootPosition,
        fixGroundReference,
        fixGroundReferenceDynamicRefNode,
        rootNodeName,
        groundReferenceNodeName,
        groundReferenceVerticalAxis,
    });
    stateSnapshotRef.current = {
        avatarName,
        avatarRescaleAvatar,
        avatarAnimSpeed,
        avatarShowSkeleton,
        avatarShowSkeletonLocalAxes,
        avatarGizmoEnabled,
        avatarGizmoType,
        avatarGizmoSelectedNode,
        animationName,
        animationSpeed,
        animationShowSkeletonLocalAxes,
        animationGizmoEnabled,
        animationGizmoType,
        animationGizmoSelectedNode,
        fixAnimations,
        checkHierarchy,
        retargetAnimationKeys,
        fixRootPosition,
        fixGroundReference,
        fixGroundReferenceDynamicRefNode,
        rootNodeName,
        groundReferenceNodeName,
        groundReferenceVerticalAxis,
    };

    // Save all UI state back to the persistent store on unmount so it survives re-docking.
    useEffect(() => {
        return () => {
            Object.assign(stateStore, stateSnapshotRef.current);
        };
    }, []);

    // Subscribe to isEnabled observable
    useEffect(() => {
        const obs = isEnabledObs.add((v) => setIsEnabled(v));
        return () => {
            isEnabledObs.remove(obs);
        };
    }, [isEnabledObs]);

    // Refresh dropdown options when the config dialog closes.
    // If the current avatar/animation was removed, clear it and dispose the loaded model.
    useEffect(() => {
        const obs = onConfigChangedObs.add(() => {
            const newAvatarOptions = avatarManager.getAllAvatars().map((a) => ({ label: a.name, value: a.name }));
            const newAnimationOptions = animationManager.getAllAnimations().map((a) => ({ label: a.name, value: a.name }));
            setAvatarOptions(newAvatarOptions);
            setAnimationOptions(newAnimationOptions);

            const s = stateSnapshotRef.current;
            if (s.avatarName && !avatarManager.getAvatar(s.avatarName)) {
                setAvatarName("");
                setIsAvatarLoaded(false);
                setIsRetargeted(false);
            }
            if (s.animationName && !animationManager.getAnimation(s.animationName)) {
                setAnimationName("");
                setIsAnimLoaded(false);
                setIsRetargeted(false);
            }
        });
        return () => {
            onConfigChangedObs.remove(obs);
        };
    }, [onConfigChangedObs, avatarManager, animationManager]);

    // Subscribe to manager ready observable -- re-subscribe each time a new manager is created
    useEffect(() => {
        let cleanup: (() => void) | null = null;

        /**
         * Attaches observable listeners to `manager` and either triggers fresh loads
         * (triggerLoads=true, first enable) or restores state from the existing scene
         * (triggerLoads=false, panel remount after docking elsewhere).
         */
        const setupManager = (manager: RetargetingSceneManager, triggerLoads: boolean) => {
            managerRef.current = manager;

            // Helper: rebuild "Root node" / "Ground ref. node" dropdowns using bone-remapping filtering.
            // Mirrors original gui.ts _getSourceTransformNodeList + updateBoneList logic.
            const rebuildBoneLists = (allNames: string[], allOptions: { label: string; value: string }[], animName: string, avatarName: string, currentGroundRef: string) => {
                const filtered = BuildFilteredBoneList(allNames, animName, avatarName, namingSchemeManager, avatarManager, animationManager);
                const filteredSet = new Set(filtered);
                const filteredOptions = allOptions.filter((o) => filteredSet.has(o.value));
                setRootNodeOptions([{ label: "Auto", value: "Auto" }, ...filteredOptions]);
                setGroundRefNodeOptions(filteredOptions);
                const best = filtered.includes(currentGroundRef)
                    ? currentGroundRef
                    : (filtered.find((n) => n.toLowerCase().includes("lefttoe_end")) ?? filtered.find((n) => n.toLowerCase().includes("lefttoebase")) ?? filtered[0] ?? "");
                setGroundReferenceNodeName(best);
            };

            // Subscribe to Avatar observables
            const avatarLoadObs = manager.avatar!.onLoadedObservable.add(() => {
                const s = stateSnapshotRef.current;
                setIsAvatarLoaded(true);
                setIsRetargeted(false);
                setIsLoading(false);
                setIsAvatarPlaying(false); // new avatar starts in rest pose -- gizmo is usable
                // Rebuild avatar bone list for the Avatar Gizmo "Selected node" dropdown
                setAvatarBoneOptions(manager.avatar!.getBoneOptions());
                // Restore visual state
                manager.avatar!.setSkeletonVisible(s.avatarShowSkeleton);
                manager.avatar!.setSkeletonLocalAxes(s.avatarShowSkeletonLocalAxes);
                manager.avatar!.setAnimSpeed(s.avatarAnimSpeed);
                manager.avatar!.setGizmo(s.avatarGizmoEnabled, s.avatarGizmoType as GizmoType);
                // Rebuild bone lists: avatar naming scheme affects the filtered list
                if (manager.animationSource) {
                    rebuildBoneLists(
                        manager.animationSource.getTransformNodeNames(),
                        manager.animationSource.getTransformNodeOptions(),
                        s.animationName,
                        s.avatarName,
                        s.groundReferenceNodeName
                    );
                }
            });

            const avatarGizmoObs = manager.avatar!.onGizmoNodeSelectedObservable.add((name) => {
                setAvatarGizmoSelectedNode(name);
                setAvatarGizmoSelectedTransform(manager.avatar!.selectedBoneTransform as Transform | null);
            });

            const avatarPlayingObs = manager.avatar!.onPlayingObservable.add((playing) => {
                setIsAvatarPlaying(playing);
                if (playing) {
                    setAvatarGizmoEnabled(false);
                }
                const s = stateSnapshotRef.current;
                manager.avatar!.setGizmo(playing ? false : s.avatarGizmoEnabled, s.avatarGizmoType as GizmoType);
            });

            // Subscribe to AnimationSource observables
            const animLoadObs = manager.animationSource!.onLoadedObservable.add(() => {
                const s = stateSnapshotRef.current;
                setIsAnimLoaded(true);
                setIsRetargeted(false);
                setIsLoading(false);
                setIsAnimPlaying(true); // animation always starts in "playing" state after load
                // Return avatar to rest pose when a new animation is loaded
                manager.avatar?.returnToRest();
                // Restore visual state
                manager.animationSource!.setSkeletonVisible(true);
                manager.animationSource!.setSkeletonLocalAxes(s.animationShowSkeletonLocalAxes);
                manager.animationSource!.setGizmo(s.animationGizmoEnabled, s.animationGizmoType as GizmoType);
                // Rebuild bone list dropdowns using filtered names (matching original updateBoneList logic)
                const allNames = manager.animationSource!.getTransformNodeNames();
                rebuildBoneLists(allNames, manager.animationSource!.getTransformNodeOptions(), s.animationName, s.avatarName, stateSnapshotRef.current.groundReferenceNodeName);
            });

            const animGizmoObs = manager.animationSource!.onGizmoNodeSelectedObservable.add((name) => {
                setAnimationGizmoSelectedNode(name);
                setAnimGizmoSelectedTransform(manager.animationSource!.selectedTransformNode as Transform | null);
            });

            const animPlayingObs = manager.animationSource!.onPlayingObservable.add((playing) => {
                setIsAnimPlaying(playing);
                if (playing) {
                    setAnimationGizmoEnabled(false);
                }
                const s = stateSnapshotRef.current;
                manager.animationSource!.setGizmo(playing ? false : s.animationGizmoEnabled, s.animationGizmoType as GizmoType);
            });

            // Subscribe to retarget done
            const retargetObs = manager.onRetargetDoneObservable.add(() => {
                setIsRetargeted(true);
                setIsLoading(false);
            });

            if (triggerLoads) {
                // Fresh enable: kick off loads from the current UI state
                const s = stateSnapshotRef.current;
                setIsLoading(true);
                setIsAvatarLoaded(false);
                setIsAnimLoaded(false);
                setIsAvatarPlaying(false);
                setIsAnimPlaying(false);
                const storedAv = avatarManager.getAvatar(s.avatarName);
                const storedAn = animationManager.getAnimation(s.animationName);
                if (storedAv) {
                    if (storedAv.source === "url" && storedAv.url) {
                        manager.avatar!.loadAsync(storedAv.url, s.avatarRescaleAvatar, storedAv.restPoseUpdate);
                    } else if (storedAv.source === "file" && storedAv.fileNames?.length) {
                        void (async () => {
                            const files = await avatarManager.getFilesAsync(storedAv.id, storedAv.fileNames!);
                            let sceneFile: File | undefined;
                            for (const file of files) {
                                const lowerName = file.name.toLowerCase();
                                FilesInputStore.FilesToLoad[lowerName] = file;
                                const ext = lowerName.split(".").pop();
                                if (ext && SceneLoader.IsPluginForExtensionAvailable("." + ext)) {
                                    sceneFile = file;
                                }
                            }
                            if (sceneFile) {
                                manager.avatar!.loadAsync("file:" + sceneFile.name, s.avatarRescaleAvatar, storedAv.restPoseUpdate);
                            }
                        })();
                    }
                }
                if (storedAn) {
                    const loadAndPlayAsync = async (path: string) => {
                        await manager.animationSource!.loadAsync(path, storedAn.restPoseUpdate);
                        manager.animationSource?.play(stateSnapshotRef.current.animationSpeed);
                    };
                    if (storedAn.source === "url" && storedAn.url) {
                        void loadAndPlayAsync(storedAn.url);
                    } else if (storedAn.source === "file" && storedAn.fileNames?.length) {
                        void (async () => {
                            const files = await animationManager.getFilesAsync(storedAn.id, storedAn.fileNames!);
                            let sceneFile: File | undefined;
                            for (const file of files) {
                                const lowerName = file.name.toLowerCase();
                                FilesInputStore.FilesToLoad[lowerName] = file;
                                const ext = lowerName.split(".").pop();
                                if (ext && SceneLoader.IsPluginForExtensionAvailable("." + ext)) {
                                    sceneFile = file;
                                }
                            }
                            if (sceneFile) {
                                void loadAndPlayAsync("file:" + sceneFile.name);
                            }
                        })();
                    }
                }
            } else {
                // Remount: scene is already loaded -- restore UI state from the manager directly
                const avatarLoaded = manager.avatar!.isLoaded;
                const animLoaded = manager.animationSource!.isLoaded;
                setIsAvatarLoaded(avatarLoaded);
                setIsAnimLoaded(animLoaded);
                setIsRetargeted(manager.isRetargeted);
                setIsAvatarPlaying(manager.avatar!.isPlaying);
                setIsAnimPlaying(manager.animationSource!.isPlaying);
                setIsLoading(false);
                if (avatarLoaded) {
                    setAvatarBoneOptions(manager.avatar!.getBoneOptions());
                    setAvatarGizmoSelectedTransform(manager.avatar!.selectedBoneTransform as Transform | null);
                }
                if (animLoaded) {
                    const s = stateSnapshotRef.current;
                    rebuildBoneLists(
                        manager.animationSource!.getTransformNodeNames(),
                        manager.animationSource!.getTransformNodeOptions(),
                        s.animationName,
                        s.avatarName,
                        s.groundReferenceNodeName
                    );
                    setAnimGizmoSelectedTransform(manager.animationSource!.selectedTransformNode as Transform | null);
                }
            }

            forceUpdate((n) => n + 1);

            return () => {
                manager.avatar?.onLoadedObservable.remove(avatarLoadObs);
                manager.avatar?.onGizmoNodeSelectedObservable.remove(avatarGizmoObs);
                manager.avatar?.onPlayingObservable.remove(avatarPlayingObs);
                manager.animationSource?.onLoadedObservable.remove(animLoadObs);
                manager.animationSource?.onGizmoNodeSelectedObservable.remove(animGizmoObs);
                manager.animationSource?.onPlayingObservable.remove(animPlayingObs);
                manager.onRetargetDoneObservable.remove(retargetObs);
            };
        };

        const obs = onManagerReadyObs.add((manager) => {
            cleanup?.();
            cleanup = setupManager(manager, true);
        });

        // If a manager already exists (panel remounted after docking elsewhere), restore state now
        const existingManager = getCurrentManager();
        if (existingManager) {
            cleanup = setupManager(existingManager, false);
        }

        return () => {
            onManagerReadyObs.remove(obs);
            cleanup?.();
        };
    }, [onManagerReadyObs]);

    const handleLoadAvatar = useCallback(
        async (name: string, rescale: boolean) => {
            const manager = managerRef.current;
            if (!manager?.avatar) {
                return;
            }
            const storedAvatar = avatarManager.getAvatar(name);
            if (!storedAvatar) {
                return;
            }
            setIsLoading(true);
            setIsAvatarLoaded(false);
            setIsRetargeted(false);

            if (storedAvatar.source === "url" && storedAvatar.url) {
                manager.avatar.loadAsync(storedAvatar.url, rescale, storedAvatar.restPoseUpdate);
            } else if (storedAvatar.source === "file" && storedAvatar.fileNames?.length) {
                const files = await avatarManager.getFilesAsync(storedAvatar.id, storedAvatar.fileNames);
                let sceneFile: File | undefined;
                for (const file of files) {
                    const lowerName = file.name.toLowerCase();
                    FilesInputStore.FilesToLoad[lowerName] = file;
                    const ext = lowerName.split(".").pop();
                    if (ext && SceneLoader.IsPluginForExtensionAvailable("." + ext)) {
                        sceneFile = file;
                    }
                }
                if (sceneFile) {
                    manager.avatar.loadAsync("file:" + sceneFile.name, rescale, storedAvatar.restPoseUpdate);
                }
            }
        },
        [avatarManager]
    );

    const handleLoadAnimation = useCallback(
        async (name: string) => {
            const manager = managerRef.current;
            if (!manager?.animationSource) {
                return;
            }
            const storedAnimation = animationManager.getAnimation(name);
            if (!storedAnimation) {
                return;
            }
            setIsLoading(true);
            setIsAnimLoaded(false);
            setIsRetargeted(false);

            let loadPath: string | undefined;
            if (storedAnimation.source === "url" && storedAnimation.url) {
                loadPath = storedAnimation.url;
            } else if (storedAnimation.source === "file" && storedAnimation.fileNames?.length) {
                const files = await animationManager.getFilesAsync(storedAnimation.id, storedAnimation.fileNames);
                let sceneFile: File | undefined;
                for (const file of files) {
                    const lowerName = file.name.toLowerCase();
                    FilesInputStore.FilesToLoad[lowerName] = file;
                    const ext = lowerName.split(".").pop();
                    if (ext && SceneLoader.IsPluginForExtensionAvailable("." + ext)) {
                        sceneFile = file;
                    }
                }
                if (sceneFile) {
                    loadPath = "file:" + sceneFile.name;
                }
            }

            if (loadPath) {
                await manager.animationSource.loadAsync(loadPath, storedAnimation.restPoseUpdate);
                manager.animationSource!.setSkeletonVisible(true);
                manager.animationSource?.play(stateSnapshotRef.current.animationSpeed);
            }
        },
        [animationManager]
    );

    const handleRetarget = useCallback(() => {
        const manager = managerRef.current;
        if (!manager) {
            return;
        }
        setIsLoading(true);
        manager.htmlConsole.clear();
        manager.retarget(
            {
                avatarName,
                avatarRescaleAvatar,
                avatarAnimSpeed,
                animationName,
                animationSpeed,
                fixAnimations,
                checkHierarchy,
                retargetAnimationKeys,
                fixRootPosition,
                fixGroundReference,
                fixGroundReferenceDynamicRefNode,
                rootNodeName,
                groundReferenceNodeName,
                groundReferenceVerticalAxis: groundReferenceVerticalAxis as "" | "X" | "Y" | "Z",
            },
            namingSchemeManager,
            avatarManager,
            animationManager
        );
    }, [
        avatarName,
        avatarRescaleAvatar,
        avatarAnimSpeed,
        animationName,
        animationSpeed,
        fixAnimations,
        checkHierarchy,
        retargetAnimationKeys,
        fixRootPosition,
        fixGroundReference,
        fixGroundReferenceDynamicRefNode,
        rootNodeName,
        groundReferenceNodeName,
        groundReferenceVerticalAxis,
    ]);

    const loadingText = isLoading && !isAvatarLoaded && !isAnimLoaded ? "Loading..." : isLoading ? "Loading..." : null;

    return (
        <div className={classes.root}>
            {!isEnabled ? (
                <div className={classes.disabledOverlay}>Extension is disabled -- original scene is shown</div>
            ) : (
                <>
                    <div className={classes.actionRow}>
                        <ButtonLine label="Retarget" onClick={handleRetarget} disabled={!isAvatarLoaded || !isAnimLoaded || isLoading} />
                        <ButtonLine
                            label="Export to Playground"
                            onClick={() => managerRef.current?.exportToPlaygroundAsync(avatarManager, animationManager)}
                            disabled={!isRetargeted}
                        />
                    </div>
                    <div className={classes.scrollContent}>
                        {loadingText && <div style={{ padding: "4px 12px", fontSize: "12px", color: tokens.colorNeutralForeground3 }}>{loadingText}</div>}
                        <BabylonAccordion>
                            {/* Avatar */}
                            <BabylonAccordionSection title="Avatar">
                                <StringDropdownPropertyLine
                                    label="Name"
                                    value={avatarName}
                                    options={avatarOptions}
                                    onChange={(name) => {
                                        setAvatarName(name);
                                        handleLoadAvatar(name, avatarRescaleAvatar);
                                    }}
                                />
                                <CheckboxPropertyLine
                                    label="Rescale"
                                    value={avatarRescaleAvatar}
                                    onChange={(v) => {
                                        setAvatarRescaleAvatar(v);
                                        handleLoadAvatar(avatarName, v);
                                    }}
                                />
                                <CheckboxPropertyLine
                                    label="Show skeleton"
                                    value={avatarShowSkeleton}
                                    onChange={(v) => {
                                        setAvatarShowSkeleton(v);
                                        managerRef.current?.avatar?.setSkeletonVisible(v);
                                    }}
                                />
                                <CheckboxPropertyLine
                                    label="Show skel. local axes"
                                    value={avatarShowSkeletonLocalAxes}
                                    disabled={!avatarShowSkeleton}
                                    onChange={(v) => {
                                        setAvatarShowSkeletonLocalAxes(v);
                                        managerRef.current?.avatar?.setSkeletonLocalAxes(v);
                                    }}
                                />
                                <SyncedSliderPropertyLine
                                    label="Anim. speed"
                                    value={avatarAnimSpeed}
                                    min={0.01}
                                    max={2}
                                    step={0.05}
                                    onChange={(v) => {
                                        setAvatarAnimSpeed(v);
                                        managerRef.current?.avatar?.setAnimSpeed(v);
                                    }}
                                />
                                <ButtonLine label="Return to rest" onClick={() => managerRef.current?.avatar?.returnToRest()} disabled={!isAvatarLoaded} />
                                <ButtonLine
                                    label="Save as rest pose"
                                    disabled={!isAvatarLoaded || isAvatarPlaying}
                                    onClick={() => {
                                        const restPose = managerRef.current?.avatar?.saveAsRestPose();
                                        if (restPose && avatarName) {
                                            const stored = avatarManager.getAvatar(avatarName);
                                            if (stored) {
                                                avatarManager.addAvatar({ ...stored, restPoseUpdate: restPose });
                                            }
                                        }
                                    }}
                                />
                                <ButtonLine label="Play" onClick={() => managerRef.current?.avatar?.play(avatarAnimSpeed)} disabled={!isRetargeted} />
                            </BabylonAccordionSection>
                            {/* Avatar Gizmo */}
                            <BabylonAccordionSection title="Avatar Gizmo">
                                <CheckboxPropertyLine
                                    label="Enabled"
                                    value={avatarGizmoEnabled && !isAvatarPlaying}
                                    disabled={isAvatarPlaying}
                                    onChange={(v) => {
                                        setAvatarGizmoEnabled(v);
                                        managerRef.current?.avatar?.setGizmo(v, avatarGizmoType as GizmoType);
                                    }}
                                />
                                <StringDropdownPropertyLine
                                    label="Type"
                                    value={avatarGizmoType}
                                    options={GizmoTypeOptions}
                                    onChange={(v) => {
                                        setAvatarGizmoType(v);
                                        managerRef.current?.avatar?.setGizmo(avatarGizmoEnabled, v as GizmoType);
                                    }}
                                />
                                <div className={classes.boneDropdownWrapper}>
                                    <Body1Strong className={classes.boneDropdownLabel}>Selected node</Body1Strong>
                                    <div className={classes.boneDropdownControl}>
                                        <BoneDropdown
                                            value={avatarGizmoSelectedNode}
                                            options={avatarBoneOptions}
                                            onChange={(name) => {
                                                setAvatarGizmoSelectedNode(name);
                                                managerRef.current?.avatar?.attachGizmoToBone(name);
                                            }}
                                        />
                                    </div>
                                </div>
                                {avatarGizmoSelectedTransform && (
                                    <BabylonAccordionSection title="Properties">
                                        <TransformProperties transform={avatarGizmoSelectedTransform} />
                                    </BabylonAccordionSection>
                                )}
                            </BabylonAccordionSection>
                            {/* Animation */}
                            <BabylonAccordionSection title="Animation">
                                <StringDropdownPropertyLine
                                    label="Name"
                                    value={animationName}
                                    options={animationOptions}
                                    onChange={(name) => {
                                        setAnimationName(name);
                                        handleLoadAnimation(name);
                                    }}
                                />
                                <CheckboxPropertyLine
                                    label="Show skel. local axes"
                                    value={animationShowSkeletonLocalAxes}
                                    onChange={(v) => {
                                        setAnimationShowSkeletonLocalAxes(v);
                                        managerRef.current?.animationSource?.setSkeletonLocalAxes(v);
                                    }}
                                />
                                <SyncedSliderPropertyLine
                                    label="Anim. speed"
                                    value={animationSpeed}
                                    min={0.01}
                                    max={2}
                                    step={0.05}
                                    onChange={(v) => {
                                        setAnimationSpeed(v);
                                        managerRef.current?.animationSource?.play(v);
                                    }}
                                />
                                <ButtonLine label="Return to rest" onClick={() => managerRef.current?.animationSource?.returnToRest()} disabled={!isAnimLoaded} />
                                <ButtonLine
                                    label="Save as rest pose"
                                    disabled={!isAnimLoaded || isAnimPlaying}
                                    onClick={() => {
                                        const restPose = managerRef.current?.animationSource?.saveAsRestPose();
                                        if (restPose && animationName) {
                                            const stored = animationManager.getAnimation(animationName);
                                            if (stored) {
                                                animationManager.addAnimation({ ...stored, restPoseUpdate: restPose });
                                            }
                                        }
                                    }}
                                />
                                <ButtonLine label="Play" onClick={() => managerRef.current?.animationSource?.play(animationSpeed)} disabled={!isAnimLoaded} />
                            </BabylonAccordionSection>
                            {/* Animation Gizmo */}
                            <BabylonAccordionSection title="Animation Gizmo">
                                <CheckboxPropertyLine
                                    label="Enabled"
                                    value={animationGizmoEnabled && !isAnimPlaying}
                                    disabled={isAnimPlaying}
                                    onChange={(v) => {
                                        setAnimationGizmoEnabled(v);
                                        managerRef.current?.animationSource?.setGizmo(v, animationGizmoType as GizmoType);
                                    }}
                                />
                                <StringDropdownPropertyLine
                                    label="Type"
                                    value={animationGizmoType}
                                    options={GizmoTypeOptions}
                                    onChange={(v) => {
                                        setAnimationGizmoType(v);
                                        managerRef.current?.animationSource?.setGizmo(animationGizmoEnabled, v as GizmoType);
                                    }}
                                />
                                <div className={classes.boneDropdownWrapper}>
                                    <Body1Strong className={classes.boneDropdownLabel}>Selected node</Body1Strong>
                                    <div className={classes.boneDropdownControl}>
                                        <BoneDropdown
                                            value={animationGizmoSelectedNode}
                                            options={groundRefNodeOptions}
                                            onChange={(name) => {
                                                setAnimationGizmoSelectedNode(name);
                                                managerRef.current?.animationSource?.attachGizmoToTransformNode(name);
                                            }}
                                        />
                                    </div>
                                </div>
                                {animGizmoSelectedTransform && (
                                    <BabylonAccordionSection title="Properties">
                                        <TransformProperties transform={animGizmoSelectedTransform} />
                                    </BabylonAccordionSection>
                                )}
                            </BabylonAccordionSection>
                            {/* Retarget Options */}
                            <BabylonAccordionSection title="Retarget Options">
                                <CheckboxPropertyLine label="Fix animations" value={fixAnimations} onChange={setFixAnimations} />
                                <CheckboxPropertyLine label="Check hierarchy" value={checkHierarchy} onChange={setCheckHierarchy} />
                                <CheckboxPropertyLine label="Retarget keys" value={retargetAnimationKeys} onChange={setRetargetAnimationKeys} />
                                <CheckboxPropertyLine label="Fix root position" value={fixRootPosition} onChange={setFixRootPosition} />
                                <CheckboxPropertyLine label="Fix ground reference" value={fixGroundReference} onChange={setFixGroundReference} />
                                <div style={{ paddingLeft: "16px" }}>
                                    <CheckboxPropertyLine
                                        label="Dynamic ref. node"
                                        value={fixGroundReferenceDynamicRefNode}
                                        disabled={!fixGroundReference}
                                        onChange={setFixGroundReferenceDynamicRefNode}
                                    />
                                </div>
                                <div className={classes.boneDropdownWrapper}>
                                    <Body1Strong className={classes.boneDropdownLabel}>Root node</Body1Strong>
                                    <div className={classes.boneDropdownControl}>
                                        <BoneDropdown
                                            value={rootNodeName}
                                            options={rootNodeOptions}
                                            disabled={!fixRootPosition && !fixGroundReference}
                                            onChange={setRootNodeName}
                                        />
                                    </div>
                                </div>
                                <div className={classes.boneDropdownWrapper}>
                                    <Body1Strong className={classes.boneDropdownLabel}>Ground ref. node</Body1Strong>
                                    <div className={classes.boneDropdownControl}>
                                        <BoneDropdown
                                            value={groundReferenceNodeName}
                                            options={groundRefNodeOptions}
                                            disabled={!fixRootPosition && !fixGroundReference}
                                            onChange={setGroundReferenceNodeName}
                                        />
                                    </div>
                                </div>
                                <div style={{ paddingLeft: "16px" }}>
                                    <StringDropdownPropertyLine
                                        label="Vertical axis"
                                        value={groundReferenceVerticalAxis}
                                        options={VerticalAxisOptions}
                                        disabled={!fixRootPosition && !fixGroundReference}
                                        onChange={setGroundReferenceVerticalAxis}
                                    />
                                </div>
                            </BabylonAccordionSection>
                        </BabylonAccordion>
                    </div>
                </>
            )}
        </div>
    );
};
