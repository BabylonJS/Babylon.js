import type { FunctionComponent } from "react";
import type { Nullable } from "core/types";
import type { Animation } from "core/Animations/animation";
import type { TargetedAnimation, AnimationGroup } from "core/Animations/animationGroup";
import type { Scene } from "core/scene";
import type { IAnimatable } from "core/Animations/animatable.interface";

import { makeStyles, tokens } from "@fluentui/react-components";
import { useCallback, useEffect, useRef } from "react";

import { CurveEditorProvider, useCurveEditor } from "./curveEditorContext";
import { TopBar } from "./topBar";
import { SideBar } from "./sideBar";
import { Canvas } from "./canvas/canvas";
import { BottomBar } from "./bottomBar";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 0,
        flex: 1,
        backgroundColor: tokens.colorNeutralBackground3,
        color: tokens.colorNeutralForeground1,
        overflow: "hidden",
        fontFamily: "'acumin-pro-condensed', 'Segoe UI', sans-serif",
        outline: "none", // Remove focus outline for keyboard shortcuts
    },
    topBar: {
        flexShrink: 0,
        height: "40px",
    },
    mainContent: {
        display: "flex",
        flexDirection: "row",
        flex: 1,
        minHeight: 0,
        overflow: "hidden",
    },
    sideBar: {
        width: "220px",
        flexShrink: 0,
        marginLeft: "10px",
    },
    canvasArea: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        marginLeft: "10px",
        marginRight: "10px",
        overflow: "hidden",
    },
    bottomBar: {
        flexShrink: 0,
        height: "45px",
    },
});

/**
 * Internal component that uses the curve editor context
 * @returns The curve editor content
 */
const CurveEditorContent: FunctionComponent = () => {
    const styles = useStyles();
    const { state, actions, observables } = useCurveEditor();
    const rootRef = useRef<HTMLDivElement>(null);
    const prepareRef = useRef(() => actions.prepare());
    prepareRef.current = () => actions.prepare();

    useEffect(() => {
        // Only run prepare once on mount
        prepareRef.current();
    }, []);

    // Keyboard handler for hotkeys
    const handleKeyDown = useCallback(
        (evt: React.KeyboardEvent<HTMLDivElement>) => {
            switch (evt.key) {
                case "Delete":
                case "Backspace":
                    if (state.activeKeyPoints?.length && !state.focusedInput) {
                        observables.onDeleteKeyActiveKeyPoints.notifyObservers();
                    }
                    break;
                case " ":
                    evt.preventDefault();
                    if (state.isPlaying) {
                        actions.stop();
                    } else {
                        actions.play(true);
                    }
                    break;
                case "a":
                    if (evt.ctrlKey) {
                        observables.onSelectAllKeys.notifyObservers();
                        observables.onActiveKeyPointChanged.notifyObservers();
                        evt.preventDefault();
                    }
                    break;
                case "ArrowLeft":
                    if (!state.focusedInput) {
                        const newFrame = Math.max(0, state.activeFrame - 1);
                        actions.moveToFrame(newFrame);
                        evt.preventDefault();
                    }
                    break;
                case "ArrowRight":
                    if (!state.focusedInput) {
                        const newFrame = Math.min(state.clipLength, state.activeFrame + 1);
                        actions.moveToFrame(newFrame);
                        evt.preventDefault();
                    }
                    break;
                case "ArrowDown": {
                    if (!state.focusedInput) {
                        const prevKey = actions.getPrevKey();
                        if (prevKey !== null) {
                            actions.moveToFrame(prevKey);
                        }
                        evt.preventDefault();
                    }
                    break;
                }
                case "ArrowUp": {
                    if (!state.focusedInput) {
                        const nextKey = actions.getNextKey();
                        if (nextKey !== null) {
                            actions.moveToFrame(nextKey);
                        }
                        evt.preventDefault();
                    }
                    break;
                }
            }
        },
        [state.activeKeyPoints, state.focusedInput, state.isPlaying, state.activeFrame, state.clipLength, observables, actions]
    );

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            // Notify observers about resize
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Focus the root element on mount to enable keyboard shortcuts
    useEffect(() => {
        rootRef.current?.focus();
    }, []);

    return (
        <div ref={rootRef} className={styles.root} tabIndex={0} onKeyDown={handleKeyDown}>
            <div className={styles.topBar}>
                <TopBar />
            </div>
            <div className={styles.mainContent}>
                <div className={styles.sideBar}>
                    <SideBar />
                </div>
                <div className={styles.canvasArea}>
                    <Canvas />
                </div>
            </div>
            <div className={styles.bottomBar}>
                <BottomBar />
            </div>
        </div>
    );
};

/**
 * Props for the CurveEditor component
 */
export type CurveEditorProps = {
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
 * Animation Curve Editor component for editing animation keyframes and curves
 * @param props - The component props
 * @returns The curve editor component
 */
export const CurveEditor: FunctionComponent<CurveEditorProps> = (props) => {
    const { scene, target, animations, rootAnimationGroup, title, useTargetAnimations } = props;

    return (
        <CurveEditorProvider scene={scene} target={target} animations={animations} rootAnimationGroup={rootAnimationGroup} title={title} useTargetAnimations={useTargetAnimations}>
            <CurveEditorContent />
        </CurveEditorProvider>
    );
};
