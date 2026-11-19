import { type Dispatch, type FunctionComponent, type PropsWithChildren, type SetStateAction, createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { type Nullable } from "core/types";
import { type CurveEditorInterpolation, type ICurveEditorAnimation, type ICurveEditorSource } from "./curveEditorModel";
import { type CurveData } from "./canvas/curveData";

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
    /** Horizontal graph position. */
    x: number;
    /** Vertical graph position. */
    y: number;
    /** Curve containing the designated key point. */
    curve: CurveData;
    /** Key index in the curve. */
    keyId: number;
};

/** Payload sent when the main key point moves during drag */
export type MainKeyPointPosition = {
    /** Horizontal graph position. */
    x: number;
    /** Vertical graph position. */
    y: number;
};

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
    /** All animations exposed by the current host source */
    animations: readonly ICurveEditorAnimation[];
    /** Normalized animations used by the shared curve editor */
    activeCurveAnimations: ICurveEditorAnimation[];
    /** Host-specific playback adapter */
    playback: ICurveEditorSource["playback"];
    /** Editing behavior supported by the host */
    capabilities: ICurveEditorSource["capabilities"];
    /** Active color channels by animation ID */
    activeChannels: { [key: string]: string };
    /** Currently selected key points */
    activeKeyPoints: Nullable<KeyPoint[]>;
    /** The main/primary selected key point */
    mainKeyPoint: Nullable<KeyPoint>;
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
    /** Set normalized active animations */
    setActiveCurveAnimations: Dispatch<SetStateAction<ICurveEditorAnimation[]>>;
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
    setActiveChannels: Dispatch<SetStateAction<{ [key: string]: string }>>;
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
    enableChannel: (animationId: string | number, color: string) => void;
    /** Disable a channel for an animation */
    disableChannel: (animationId: string | number) => void;
    /** Check if channel is enabled */
    isChannelEnabled: (animationId: string | number, color: string) => boolean;
    /** Get active channel color */
    getActiveChannel: (animationId: string | number) => string | undefined;
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
    onInterpolationModeSet: Observable<{ keyId: number; value: CurveEditorInterpolation }>;
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
    /** Host-normalized animation data and playback operations. */
    source: ICurveEditorSource;
    /** Editor title */
    title?: string;
};

/**
 * Provider component for curve editor context
 * @param props - Provider props containing host-normalized animation data
 * @returns The provider component with context
 */
export const CurveEditorProvider: FunctionComponent<PropsWithChildren<CurveEditorProviderProps>> = (props) => {
    const { source, title = "Animation", children } = props;

    // State
    const [activeCurveAnimations, setActiveCurveAnimations] = useState<ICurveEditorAnimation[]>([]);
    const [activeChannels, setActiveChannels] = useState<{ [key: string]: string }>({});
    const [activeKeyPoints, setActiveKeyPoints] = useState<Nullable<KeyPoint[]>>(null);
    const [mainKeyPoint, setMainKeyPoint] = useState<Nullable<KeyPoint>>(null);
    const [activeFrame, setActiveFrame] = useState(() => source.playback.getCurrentFrame());
    const [fromKey, setFromKey] = useState(0);
    const [toKey, setToKey] = useState(100);
    const [isPlaying, setIsPlaying] = useState(false);
    const [clipLength, setClipLength] = useState(100);
    const [referenceMinFrame, setReferenceMinFrame] = useState(0);
    const [referenceMaxFrame, setReferenceMaxFrame] = useState(100);
    const [focusedInput, setFocusedInput] = useState(false);
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
        setIsPlaying(source.initiallyPlaying ?? false);
        if (source.animations.length === 0) {
            setActiveCurveAnimations([]);
            return;
        }

        const curveAnimation = source.initialActiveAnimations[0] ?? source.animations[0];
        const keys = curveAnimation.getKeys();
        const length = source.clipDuration ?? keys[keys.length - 1]?.frame ?? 0;
        setReferenceMinFrame(0);
        setReferenceMaxFrame(length);
        setFromKey(0);
        setToKey(length);
        setClipLength(length);
        setActiveCurveAnimations([...source.initialActiveAnimations]);
    }, [source]);

    const play = useCallback(
        (forward: boolean) => {
            setIsPlaying(true);
            source.playback.play(forward, fromKey, toKey, activeFrame);
            setForwardAnimation(forward);
            observables.current.onAnimationStateChanged.notifyObservers();
        },
        [source, fromKey, toKey, activeFrame]
    );

    const stop = useCallback(() => {
        setIsPlaying(false);
        source.playback.stop();
        observables.current.onAnimationStateChanged.notifyObservers();
    }, [source]);

    const moveToFrame = useCallback(
        (frame: number) => {
            if (source.animations.length === 0) {
                return;
            }

            setActiveFrame(frame);
            observables.current.onPlayheadMoved.notifyObservers(frame);
            source.playback.moveToFrame(frame, fromKey, toKey, isPlaying);
        },
        [source, fromKey, toKey, isPlaying]
    );

    const refreshTarget = useCallback(() => {
        if (source.animations.length === 0 || isPlaying) {
            return;
        }
        moveToFrame(activeFrame);
    }, [source, isPlaying, moveToFrame, activeFrame]);

    const clearSelection = useCallback(() => {
        setActiveKeyPoints([]);
        observables.current.onActiveKeyPointChanged.notifyObservers();
    }, []);

    const enableChannel = useCallback((animationId: string | number, color: string) => {
        setActiveChannels((prev) => ({ ...prev, [String(animationId)]: color }));
    }, []);

    const disableChannel = useCallback((animationId: string | number) => {
        setActiveChannels((prev) => {
            const newChannels = { ...prev };
            delete newChannels[String(animationId)];
            return newChannels;
        });
    }, []);

    const isChannelEnabled = useCallback(
        (animationId: string | number, color: string) => {
            return activeChannels[String(animationId)] === undefined || activeChannels[String(animationId)] === color;
        },
        [activeChannels]
    );

    const getActiveChannel = useCallback(
        (animationId: string | number) => {
            return activeChannels[String(animationId)];
        },
        [activeChannels]
    );

    const resetAllActiveChannels = useCallback(() => {
        clearSelection();
        setActiveChannels({});
    }, [clearSelection]);

    const getPrevKey = useCallback((): Nullable<number> => {
        if (activeCurveAnimations.length === 0) {
            return null;
        }

        let prevKey = -Number.MAX_VALUE;

        for (const animation of activeCurveAnimations) {
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
    }, [activeCurveAnimations, activeFrame, fromKey]);

    const getNextKey = useCallback((): Nullable<number> => {
        if (activeCurveAnimations.length === 0) {
            return null;
        }

        let nextKey = Number.MAX_VALUE;

        for (const animation of activeCurveAnimations) {
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
    }, [activeCurveAnimations, activeFrame, toKey]);

    // Build context value
    const state: CurveEditorState = useMemo(
        () => ({
            title,
            animations: source.animations,
            activeCurveAnimations,
            playback: source.playback,
            capabilities: source.capabilities,
            activeChannels,
            activeKeyPoints,
            mainKeyPoint,
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
            source.animations,
            source.playback,
            source.capabilities,
            activeCurveAnimations,
            activeChannels,
            activeKeyPoints,
            mainKeyPoint,
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
            setActiveCurveAnimations,
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
            setActiveCurveAnimations,
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
