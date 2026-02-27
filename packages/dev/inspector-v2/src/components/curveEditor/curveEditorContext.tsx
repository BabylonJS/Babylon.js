import type { Dispatch, FunctionComponent, PropsWithChildren, SetStateAction } from "react";
import type { Nullable } from "core/types";
import type { Animation } from "core/Animations/animation";
import type { TargetedAnimation, AnimationGroup } from "core/Animations/animationGroup";
import type { Scene } from "core/scene";
import type { IAnimatable } from "core/Animations/animatable.interface";
import type { AnimationKeyInterpolation } from "core/Animations/animationKey";
import type { CurveData } from "./canvas/curveData";

/**
 * Represents a key point on a curve
 */
export type KeyPoint = {
    /** The curve data this key point belongs to */
    curve: CurveData;
    /** The key index in the animation */
    keyId: number;
};

/** Payload sent when a main key point is designated for multi-point coordination */
export type MainKeyPointInfo = {
    x: number;
    y: number;
    curve: CurveData;
    keyId: number;
};

/** Payload sent when the main key point moves during drag */
export type MainKeyPointPosition = {
    x: number;
    y: number;
};

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { Observable } from "core/Misc/observable";

/**
 * Options for active animation changed event
 */
export type ActiveAnimationChangedOptions = {
    /** Whether to evaluate keys */
    evaluateKeys?: boolean;
    /** Whether to update frame */
    frame?: boolean;
    /** Whether to update range */
    range?: boolean;
};

/**
 * State for the curve editor
 */
export type CurveEditorState = {
    /** Editor title */
    title: string;
    /** All animations in the editor */
    animations: Nullable<Animation[] | TargetedAnimation[]>;
    /** The scene */
    scene: Scene;
    /** Target animatable */
    target: Nullable<IAnimatable>;
    /** Root animation group if any */
    rootAnimationGroup: Nullable<AnimationGroup>;
    /** Currently active/selected animations */
    activeAnimations: Animation[];
    /** Active color channels by animation ID */
    activeChannels: { [key: number]: string };
    /** Currently selected key points */
    activeKeyPoints: Nullable<KeyPoint[]>;
    /** The main/primary selected key point */
    mainKeyPoint: Nullable<KeyPoint>;
    /** Snippet ID for sharing */
    snippetId: string;
    /** Whether using targeted animations */
    useTargetAnimations: boolean;
    /** Current playhead frame */
    activeFrame: number;
    /** Start of visible/play range */
    fromKey: number;
    /** End of visible/play range */
    toKey: number;
    /** Whether to use existing play range */
    useExistingPlayRange: boolean;
    /** Playback direction */
    forwardAnimation: boolean;
    /** Whether animation is playing */
    isPlaying: boolean;
    /** Total clip length in frames */
    clipLength: number;
    /** Minimum reference frame */
    referenceMinFrame: number;
    /** Maximum reference frame */
    referenceMaxFrame: number;
    /** Whether an input is focused */
    focusedInput: boolean;
    /** Lock last frame value */
    lockLastFrameValue: boolean;
    /** Lock last frame frame number */
    lockLastFrameFrame: boolean;
};

/**
 * Actions available in the curve editor
 */
export type CurveEditorActions = {
    /** Set active animations */
    setActiveAnimations: Dispatch<SetStateAction<Animation[]>>;
    /** Set active frame */
    setActiveFrame: Dispatch<SetStateAction<number>>;
    /** Set from key */
    setFromKey: Dispatch<SetStateAction<number>>;
    /** Set to key */
    setToKey: Dispatch<SetStateAction<number>>;
    /** Set is playing */
    setIsPlaying: Dispatch<SetStateAction<boolean>>;
    /** Set clip length */
    setClipLength: Dispatch<SetStateAction<number>>;
    /** Set reference max frame */
    setReferenceMaxFrame: Dispatch<SetStateAction<number>>;
    /** Set focused input */
    setFocusedInput: Dispatch<SetStateAction<boolean>>;
    /** Set active key points */
    setActiveKeyPoints: Dispatch<SetStateAction<Nullable<KeyPoint[]>>>;
    /** Set main key point */
    setMainKeyPoint: Dispatch<SetStateAction<Nullable<KeyPoint>>>;
    /** Set active channels */
    setActiveChannels: Dispatch<SetStateAction<{ [key: number]: string }>>;
    /** Play animation */
    play: (forward: boolean) => void;
    /** Stop animation */
    stop: () => void;
    /** Move to specific frame */
    moveToFrame: (frame: number) => void;
    /** Refresh target state */
    refreshTarget: () => void;
    /** Clear key point selection */
    clearSelection: () => void;
    /** Enable a channel for an animation */
    enableChannel: (animation: Animation, color: string) => void;
    /** Disable a channel for an animation */
    disableChannel: (animation: Animation) => void;
    /** Check if channel is enabled */
    isChannelEnabled: (animation: Animation, color: string) => boolean;
    /** Get active channel color */
    getActiveChannel: (animation: Animation) => string | undefined;
    /** Reset all active channels */
    resetAllActiveChannels: () => void;
    /** Get previous key frame */
    getPrevKey: () => Nullable<number>;
    /** Get next key frame */
    getNextKey: () => Nullable<number>;
    /** Prepare the editor */
    prepare: () => void;
};

/**
 * Observables for curve editor events
 */
export type CurveEditorObservables = {
    /** Fired when active animation changes */
    onActiveAnimationChanged: Observable<ActiveAnimationChangedOptions>;
    /** Fired when active key point changes */
    onActiveKeyPointChanged: Observable<void>;
    /** Fired when host window is resized */
    onHostWindowResized: Observable<void>;
    /** Fired to select all keys */
    onSelectAllKeys: Observable<void>;
    /** Fired when active key frame changes */
    onActiveKeyFrameChanged: Observable<number>;
    /** Fired when frame is set */
    onFrameSet: Observable<number>;
    /** Fired when frame is manually entered */
    onFrameManuallyEntered: Observable<number>;
    /** Fired when main key point is set for multi-point coordination */
    onMainKeyPointSet: Observable<MainKeyPointInfo>;
    /** Fired when main key point moves during drag */
    onMainKeyPointMoved: Observable<MainKeyPointPosition>;
    /** Fired when value is set */
    onValueSet: Observable<number>;
    /** Fired when value is manually entered */
    onValueManuallyEntered: Observable<number>;
    /** Fired when frame is required */
    onFrameRequired: Observable<void>;
    /** Fired when create or update key point is required */
    onCreateOrUpdateKeyPointRequired: Observable<void>;
    /** Fired when flatten tangent is required */
    onFlattenTangentRequired: Observable<void>;
    /** Fired when linear tangent is required */
    onLinearTangentRequired: Observable<void>;
    /** Fired when break tangent is required */
    onBreakTangentRequired: Observable<void>;
    /** Fired when unify tangent is required */
    onUnifyTangentRequired: Observable<void>;
    /** Fired when step tangent is required */
    onStepTangentRequired: Observable<void>;
    /** Fired when animation should be deleted */
    onDeleteAnimation: Observable<Animation>;
    /** Fired when graph is moved */
    onGraphMoved: Observable<number>;
    /** Fired when graph is scaled */
    onGraphScaled: Observable<number>;
    /** Fired when range is updated */
    onRangeUpdated: Observable<void>;
    /** Fired when move to frame is required */
    onMoveToFrameRequired: Observable<number>;
    /** Fired when animation state changes */
    onAnimationStateChanged: Observable<void>;
    /** Fired when delete active key points is required */
    onDeleteKeyActiveKeyPoints: Observable<void>;
    /** Fired when selection rectangle is moved */
    onSelectionRectangleMoved: Observable<DOMRect>;
    /** Fired when animations are loaded */
    onAnimationsLoaded: Observable<void>;
    /** Fired when clip length is increased */
    onClipLengthIncreased: Observable<number>;
    /** Fired when clip length is decreased */
    onClipLengthDecreased: Observable<number>;
    /** Fired when interpolation mode is set */
    onInterpolationModeSet: Observable<{ keyId: number; value: AnimationKeyInterpolation }>;
    /** Fired when select to is activated */
    onSelectToActivated: Observable<{ from: number; to: number }>;
    /** Fired when range frame bar is resized */
    onRangeFrameBarResized: Observable<number>;
    /** Fired when playhead is moved */
    onPlayheadMoved: Observable<number>;
    /** Fired when active key data changes */
    onActiveKeyDataChanged: Observable<number>;
};

/**
 * Combined context value
 */
export type CurveEditorContextValue = {
    /** Editor state */
    state: CurveEditorState;
    /** Editor actions */
    actions: CurveEditorActions;
    /** Editor observables */
    observables: CurveEditorObservables;
};

const CurveEditorContext = createContext<CurveEditorContextValue | null>(null);

/**
 * Props for the CurveEditorProvider
 */
export type CurveEditorProviderProps = {
    /** The scene */
    scene: Scene;
    /** Target animatable */
    target: Nullable<IAnimatable>;
    /** Animations to edit */
    animations: Nullable<Animation[] | TargetedAnimation[]>;
    /** Root animation group if any */
    rootAnimationGroup?: Nullable<AnimationGroup>;
    /** Editor title */
    title?: string;
    /** Whether using targeted animations */
    useTargetAnimations?: boolean;
};

/**
 * Provider component for curve editor context
 * @param props - Provider props including scene, target, and animations
 * @returns The provider component with context
 */
export const CurveEditorProvider: FunctionComponent<PropsWithChildren<CurveEditorProviderProps>> = (props) => {
    const { scene, target, animations, rootAnimationGroup = null, title = "Animation", useTargetAnimations = false, children } = props;

    // State
    const [activeAnimations, setActiveAnimations] = useState<Animation[]>([]);
    const [activeChannels, setActiveChannels] = useState<{ [key: number]: string }>({});
    const [activeKeyPoints, setActiveKeyPoints] = useState<Nullable<KeyPoint[]>>(null);
    const [mainKeyPoint, setMainKeyPoint] = useState<Nullable<KeyPoint>>(null);
    const [activeFrame, setActiveFrame] = useState(0);
    const [fromKey, setFromKey] = useState(0);
    const [toKey, setToKey] = useState(100);
    const [isPlaying, setIsPlaying] = useState(false);
    const [clipLength, setClipLength] = useState(100);
    const [referenceMinFrame, setReferenceMinFrame] = useState(0);
    const [referenceMaxFrame, setReferenceMaxFrame] = useState(100);
    const [focusedInput, setFocusedInput] = useState(false);
    const [snippetId, setSnippetId] = useState("");
    const [forwardAnimation, setForwardAnimation] = useState(true);

    // Observables - created once
    const observables = useRef<CurveEditorObservables>({
        onActiveAnimationChanged: new Observable(),
        onActiveKeyPointChanged: new Observable(),
        onHostWindowResized: new Observable(),
        onSelectAllKeys: new Observable(),
        onActiveKeyFrameChanged: new Observable(),
        onFrameSet: new Observable(),
        onFrameManuallyEntered: new Observable(),
        onMainKeyPointSet: new Observable(),
        onMainKeyPointMoved: new Observable(),
        onValueSet: new Observable(),
        onValueManuallyEntered: new Observable(),
        onFrameRequired: new Observable(),
        onCreateOrUpdateKeyPointRequired: new Observable(),
        onFlattenTangentRequired: new Observable(),
        onLinearTangentRequired: new Observable(),
        onBreakTangentRequired: new Observable(),
        onUnifyTangentRequired: new Observable(),
        onStepTangentRequired: new Observable(),
        onDeleteAnimation: new Observable(),
        onGraphMoved: new Observable(),
        onGraphScaled: new Observable(),
        onRangeUpdated: new Observable(),
        onMoveToFrameRequired: new Observable(),
        onAnimationStateChanged: new Observable(),
        onDeleteKeyActiveKeyPoints: new Observable(),
        onSelectionRectangleMoved: new Observable(),
        onAnimationsLoaded: new Observable(),
        onClipLengthIncreased: new Observable(),
        onClipLengthDecreased: new Observable(),
        onInterpolationModeSet: new Observable(),
        onSelectToActivated: new Observable(),
        onRangeFrameBarResized: new Observable(),
        onPlayheadMoved: new Observable(),
        onActiveKeyDataChanged: new Observable(),
    });

    // Actions
    const prepare = useCallback(() => {
        setIsPlaying(false);
        if (!animations || !animations.length) {
            return;
        }

        const animation = useTargetAnimations ? (animations[0] as TargetedAnimation).animation : (animations[0] as Animation);
        const keys = animation.getKeys();

        setReferenceMinFrame(0);
        setReferenceMaxFrame(keys[keys.length - 1].frame);
        setFromKey(0);
        setToKey(keys[keys.length - 1].frame);
        setSnippetId(animation.snippetId);
        setClipLength(keys[keys.length - 1].frame);

        // Auto-select the first animation
        setActiveAnimations([animation]);

        if (animation && animation.hasRunningRuntimeAnimations) {
            setIsPlaying(true);
        }
    }, [animations, useTargetAnimations]);

    const play = useCallback(
        (forward: boolean) => {
            setIsPlaying(true);
            scene.stopAnimation(target);

            if (forward) {
                if (rootAnimationGroup) {
                    rootAnimationGroup.start(true, 1.0, fromKey, toKey);
                } else {
                    scene.beginAnimation(target, fromKey, toKey, true);
                }
            } else {
                if (rootAnimationGroup) {
                    rootAnimationGroup.start(true, 1.0, toKey, fromKey);
                } else {
                    scene.beginAnimation(target, toKey, fromKey, true);
                }
            }
            setForwardAnimation(forward);

            // Move to active frame
            if (rootAnimationGroup) {
                rootAnimationGroup.goToFrame(activeFrame);
            }

            observables.current.onAnimationStateChanged.notifyObservers();
        },
        [scene, target, rootAnimationGroup, fromKey, toKey, activeFrame]
    );

    const stop = useCallback(() => {
        setIsPlaying(false);
        if (rootAnimationGroup) {
            rootAnimationGroup.stop();
        } else {
            scene.stopAnimation(target);
        }
        observables.current.onAnimationStateChanged.notifyObservers();
    }, [scene, target, rootAnimationGroup]);

    const moveToFrame = useCallback(
        (frame: number) => {
            if (!animations || !animations.length) {
                return;
            }

            setActiveFrame(frame);
            observables.current.onPlayheadMoved.notifyObservers(frame);

            if (!isPlaying) {
                if (rootAnimationGroup) {
                    rootAnimationGroup.start(false, 1.0, fromKey, toKey);
                } else {
                    scene.beginAnimation(target, fromKey, toKey, false);
                }
            }

            for (const animationEntry of animations) {
                const animation = useTargetAnimations ? (animationEntry as TargetedAnimation).animation : (animationEntry as Animation);
                if (!animation.hasRunningRuntimeAnimations) {
                    return;
                }

                for (const runtimeAnimation of animation.runtimeAnimations) {
                    runtimeAnimation.goToFrame(frame);
                }
            }

            stop();
        },
        [animations, useTargetAnimations, isPlaying, rootAnimationGroup, scene, target, fromKey, toKey, stop]
    );

    const refreshTarget = useCallback(() => {
        if (!animations || !animations.length || isPlaying) {
            return;
        }
        moveToFrame(activeFrame);
    }, [animations, isPlaying, moveToFrame, activeFrame]);

    const clearSelection = useCallback(() => {
        setActiveKeyPoints([]);
        observables.current.onActiveKeyPointChanged.notifyObservers();
    }, []);

    const enableChannel = useCallback((animation: Animation, color: string) => {
        setActiveChannels((prev) => ({ ...prev, [animation.uniqueId]: color }));
    }, []);

    const disableChannel = useCallback((animation: Animation) => {
        setActiveChannels((prev) => {
            const newChannels = { ...prev };
            delete newChannels[animation.uniqueId];
            return newChannels;
        });
    }, []);

    const isChannelEnabled = useCallback(
        (animation: Animation, color: string) => {
            return activeChannels[animation.uniqueId] === undefined || activeChannels[animation.uniqueId] === color;
        },
        [activeChannels]
    );

    const getActiveChannel = useCallback(
        (animation: Animation) => {
            return activeChannels[animation.uniqueId];
        },
        [activeChannels]
    );

    const resetAllActiveChannels = useCallback(() => {
        clearSelection();
        setActiveChannels({});
    }, [clearSelection]);

    const getPrevKey = useCallback((): Nullable<number> => {
        if (!animations || !animations.length || activeAnimations.length === 0) {
            return null;
        }

        let prevKey = -Number.MAX_VALUE;

        for (const animation of activeAnimations) {
            const keys = animation.getKeys();
            for (const key of keys) {
                if (key.frame < activeFrame && key.frame > prevKey) {
                    prevKey = key.frame;
                }
            }
        }

        if (prevKey === -Number.MAX_VALUE) {
            prevKey = fromKey;
        }

        return prevKey;
    }, [animations, activeAnimations, activeFrame, fromKey]);

    const getNextKey = useCallback((): Nullable<number> => {
        if (!animations || !animations.length) {
            return null;
        }

        let nextKey = Number.MAX_VALUE;

        for (const animation of activeAnimations) {
            const keys = animation.getKeys();
            for (const key of keys) {
                if (key.frame > activeFrame && key.frame < nextKey) {
                    nextKey = key.frame;
                }
            }
        }

        if (nextKey === Number.MAX_VALUE) {
            nextKey = toKey;
        }

        return nextKey;
    }, [animations, activeAnimations, activeFrame, toKey]);

    // Build context value
    const state: CurveEditorState = useMemo(
        () => ({
            title,
            animations,
            scene,
            target,
            rootAnimationGroup,
            activeAnimations,
            activeChannels,
            activeKeyPoints,
            mainKeyPoint,
            snippetId,
            useTargetAnimations,
            activeFrame,
            fromKey,
            toKey,
            useExistingPlayRange: false,
            forwardAnimation,
            isPlaying,
            clipLength,
            referenceMinFrame,
            referenceMaxFrame,
            focusedInput,
            lockLastFrameValue: false,
            lockLastFrameFrame: false,
        }),
        [
            title,
            animations,
            scene,
            target,
            rootAnimationGroup,
            activeAnimations,
            activeChannels,
            activeKeyPoints,
            mainKeyPoint,
            snippetId,
            useTargetAnimations,
            activeFrame,
            fromKey,
            toKey,
            forwardAnimation,
            isPlaying,
            clipLength,
            referenceMinFrame,
            referenceMaxFrame,
            focusedInput,
        ]
    );

    const actions: CurveEditorActions = useMemo(
        () => ({
            setActiveAnimations,
            setActiveFrame,
            setFromKey,
            setToKey,
            setIsPlaying,
            setClipLength,
            setReferenceMaxFrame,
            setFocusedInput,
            setActiveKeyPoints,
            setMainKeyPoint,
            setActiveChannels,
            play,
            stop,
            moveToFrame,
            refreshTarget,
            clearSelection,
            enableChannel,
            disableChannel,
            isChannelEnabled,
            getActiveChannel,
            resetAllActiveChannels,
            getPrevKey,
            getNextKey,
            prepare,
        }),
        [
            play,
            stop,
            moveToFrame,
            refreshTarget,
            clearSelection,
            enableChannel,
            disableChannel,
            isChannelEnabled,
            getActiveChannel,
            resetAllActiveChannels,
            getPrevKey,
            getNextKey,
            prepare,
        ]
    );

    const contextValue: CurveEditorContextValue = useMemo(
        () => ({
            state,
            actions,
            observables: observables.current,
        }),
        [state, actions]
    );

    return <CurveEditorContext.Provider value={contextValue}>{children}</CurveEditorContext.Provider>;
};

/**
 * Hook to access the curve editor context
 * @returns The curve editor context value
 */
export function useCurveEditor(): CurveEditorContextValue {
    const context = useContext(CurveEditorContext);
    if (!context) {
        throw new Error("useCurveEditor must be used within a CurveEditorProvider");
    }
    return context;
}
