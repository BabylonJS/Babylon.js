import { type FunctionComponent, type PropsWithChildren, createContext, useContext, useMemo, useRef } from "react";
import { type Nullable } from "core/types";
import { type Animation } from "core/Animations/animation";
import { type TargetedAnimation } from "core/Animations/animationGroup";
import { type IAnimatable } from "core/Animations/animatable.interface";
import { Observable } from "core/Misc/observable";

export type BabylonCurveEditorState = {
    /** Target animatable used by native animation operations. */
    target: Nullable<IAnimatable>;
    /** Animation list exposed by the Inspector. */
    animations: Nullable<Animation[] | TargetedAnimation[]>;
    /** Whether entries are targeted animations. */
    useTargetAnimations: boolean;
};

export type BabylonCurveEditorObservables = {
    /** Requests deletion of a native animation. */
    onDeleteAnimation: Observable<Animation>;
};

export type BabylonCurveEditorContextValue = {
    /** Native editor state. */
    state: BabylonCurveEditorState;
    /** Native editor events. */
    observables: BabylonCurveEditorObservables;
};

export type BabylonCurveEditorProviderProps = {
    /** The currently inspected animation target. */
    target: Nullable<IAnimatable>;
    /** Animation list to expose in the native sidebar. */
    animations: Nullable<Animation[] | TargetedAnimation[]>;
    /** Whether entries in the animation list are targeted animations. */
    useTargetAnimations?: boolean;
};

const BabylonCurveEditorContext = createContext<BabylonCurveEditorContextValue | null>(null);

/**
 * Provides Babylon.js-specific animation-list state and events for the native editor sidebar.
 * @param props - Native animation context inputs and child components
 * @returns The Babylon.js-specific context provider
 */
export const BabylonCurveEditorProvider: FunctionComponent<PropsWithChildren<BabylonCurveEditorProviderProps>> = (props) => {
    const { target, animations, useTargetAnimations = false, children } = props;

    const observables = useRef<BabylonCurveEditorObservables>({
        onDeleteAnimation: new Observable(),
    });

    const state: BabylonCurveEditorState = useMemo(() => ({ target, animations, useTargetAnimations }), [target, animations, useTargetAnimations]);
    const contextValue = useMemo(() => ({ state, observables: observables.current }), [state]);

    return <BabylonCurveEditorContext.Provider value={contextValue}>{children}</BabylonCurveEditorContext.Provider>;
};

/**
 * Returns Babylon.js-specific curve-editor state.
 * @returns The native animation selection and related context
 * @throws If called outside a BabylonCurveEditorProvider
 */
export function useBabylonCurveEditor(): BabylonCurveEditorContextValue {
    const context = useContext(BabylonCurveEditorContext);
    if (!context) {
        throw new Error("useBabylonCurveEditor must be used within a BabylonCurveEditorProvider");
    }
    return context;
}
