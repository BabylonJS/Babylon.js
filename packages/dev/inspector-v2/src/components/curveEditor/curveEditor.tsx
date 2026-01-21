import type { FunctionComponent } from "react";
import type { Nullable } from "core/types";
import type { Animation } from "core/Animations/animation";
import type { TargetedAnimation, AnimationGroup } from "core/Animations/animationGroup";
import type { Scene } from "core/scene";
import type { IAnimatable } from "core/Animations/animatable.interface";

import { makeStyles, tokens, FluentProvider, webDarkTheme } from "@fluentui/react-components";
import { useEffect, useRef } from "react";

import { CurveEditorProvider, useCurveEditor } from "./curveEditorContext";
import { TopBar } from "./topBar";
import { SideBar } from "./sideBar";
import { Canvas } from "./canvas/canvas";
import { BottomBar } from "./bottomBar";

const useStyles = makeStyles({
    fluentProvider: {
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
    },
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
    const { actions } = useCurveEditor();
    const prepareRef = useRef(actions.prepare);
    prepareRef.current = actions.prepare;

    useEffect(() => {
        // Only run prepare once on mount
        prepareRef.current();
    }, []);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            // Notify observers about resize
        };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <div className={styles.root}>
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
    const styles = useStyles();

    return (
        <FluentProvider theme={webDarkTheme} className={styles.fluentProvider}>
            <CurveEditorProvider
                scene={scene}
                target={target}
                animations={animations}
                rootAnimationGroup={rootAnimationGroup}
                title={title}
                useTargetAnimations={useTargetAnimations}
            >
                <CurveEditorContent />
            </CurveEditorProvider>
        </FluentProvider>
    );
};
