import type { FunctionComponent, PropsWithChildren } from "react";
import type { Nullable } from "core/types";
import type { Animation } from "core/Animations/animation";
import type { TargetedAnimation, AnimationGroup } from "core/Animations/animationGroup";
import type { Scene } from "core/scene";
import type { IAnimatable } from "core/Animations/animatable.interface";

import { createContext, useContext, useRef, useEffect, useReducer, useMemo } from "react";
import { Context } from "shared-ui-components/curveEditor/context";

// Re-export types from shared context
export type { IActiveAnimationChangedOptions } from "shared-ui-components/curveEditor/context";

/**
 * Compatibility wrapper that provides state/actions/observables views of the Context
 */
export type CurveEditorContextValue = {
    /** Read-only state view of the context */
    state: Context;
    /** Actions view (same as context, has all methods) */
    actions: Context;
    /** Observables view (same as context, has all observables) */
    observables: Context;
    /** Direct access to the underlying Context instance */
    context: Context;
};

/**
 * React context that holds the shared Context instance
 */
const CurveEditorContext = createContext<Context | null>(null);

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
 * Provider component for curve editor context.
 * Creates and provides the shared Context class instance.
 * @param props - Provider props including scene, target, and animations
 * @returns The provider component with context
 */
export const CurveEditorProvider: FunctionComponent<PropsWithChildren<CurveEditorProviderProps>> = (props) => {
    const { scene, target, animations, rootAnimationGroup = null, title = "Animation", useTargetAnimations = false, children } = props;

    // Create the shared Context instance once
    const contextRef = useRef<Context | null>(null);
    if (!contextRef.current) {
        contextRef.current = new Context();
    }
    const context = contextRef.current;

    // Force re-render mechanism for when context properties change
    const [, forceUpdate] = useReducer((x) => x + 1, 0);

    // Update context properties when props change
    useEffect(() => {
        context.scene = scene;
        context.target = target;
        context.animations = animations;
        context.rootAnimationGroup = rootAnimationGroup;
        context.title = title;
        context.useTargetAnimations = useTargetAnimations;
    }, [context, scene, target, animations, rootAnimationGroup, title, useTargetAnimations]);

    // Subscribe to context changes to trigger re-renders
    useEffect(() => {
        const observers = [
            context.onActiveAnimationChanged.add(() => forceUpdate()),
            context.onActiveKeyPointChanged.add(() => forceUpdate()),
            context.onAnimationStateChanged.add(() => forceUpdate()),
            context.onRangeUpdated.add(() => forceUpdate()),
        ];

        return () => {
            observers.forEach((obs) => obs.remove());
        };
    }, [context]);

    return <CurveEditorContext.Provider value={context}>{children}</CurveEditorContext.Provider>;
};

/**
 * Hook to access the curve editor context.
 * Returns a compatibility object with state/actions/observables that all point to the shared Context.
 * This allows code like `const { state, actions, observables } = useCurveEditor()` to work.
 * @returns Object with state, actions, observables (all referencing the same Context instance)
 */
export function useCurveEditor(): CurveEditorContextValue {
    const context = useContext(CurveEditorContext);
    if (!context) {
        throw new Error("useCurveEditor must be used within a CurveEditorProvider");
    }

    // Return compatibility wrapper - state/actions/observables all point to the same Context
    // This allows destructuring like { state, actions, observables } while using shared Context
    return useMemo(
        () => ({
            state: context,
            actions: context,
            observables: context,
            context,
        }),
        [context]
    );
}
