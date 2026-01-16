import type { FunctionComponent } from "react";

import { makeStyles, tokens, Tooltip } from "@fluentui/react-components";
import { useCallback, useEffect, useState } from "react";
import { AddRegular, ArrowDownloadRegular, SaveRegular, EditRegular } from "@fluentui/react-icons";
import type { Animation } from "core/Animations/animation";
import type { TargetedAnimation } from "core/Animations/animationGroup";

import { Button } from "shared-ui-components/fluent/primitives/button";
import { SpinButton } from "shared-ui-components/fluent/primitives/spinButton";
import { useCurveEditor } from "./curveEditorContext";
import { AnimationList } from "./sideBar/animationList";

const useStyles = makeStyles({
    root: {
        display: "flex",
        flexDirection: "column",
        width: "100%",
        height: "100%",
        minHeight: 0,
        backgroundColor: tokens.colorNeutralBackground1,
        overflow: "hidden",
    },
    menuBar: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
        padding: `0 ${tokens.spacingHorizontalS}`,
        backgroundColor: tokens.colorNeutralBackground2,
        height: "30px",
        flexShrink: 0,
    },
    fpsInput: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalXS,
        marginLeft: "auto",
    },
    fpsLabel: {
        fontSize: tokens.fontSizeBase200,
        color: tokens.colorNeutralForeground3,
    },
    spinButton: {
        width: "60px",
    },
    tabList: {
        padding: `0 ${tokens.spacingHorizontalS}`,
    },
    content: {
        flex: 1,
        minHeight: 0,
        overflow: "auto",
        padding: tokens.spacingHorizontalS,
    },
});

type Mode = "edit" | "add" | "load" | "save";

/**
 * Sidebar component for the curve editor with animation list and controls
 * @returns The sidebar component
 */
export const SideBar: FunctionComponent = () => {
    const styles = useStyles();
    const { state, observables } = useCurveEditor();

    const [mode, setMode] = useState<Mode>("edit");
    const [fps, setFps] = useState(60);

    // Get FPS from animations
    useEffect(() => {
        if (state.animations && state.animations.length) {
            const animation = state.useTargetAnimations ? (state.animations[0] as TargetedAnimation).animation : (state.animations[0] as Animation);
            setFps(animation.framePerSecond);
        }
    }, [state.animations, state.useTargetAnimations]);

    // Subscribe to animations loaded
    useEffect(() => {
        const observer = observables.onAnimationsLoaded.add(() => {
            setMode("edit");
        });
        return () => {
            observables.onAnimationsLoaded.remove(observer);
        };
    }, [observables]);

    const handleFpsChange = useCallback(
        (value: number) => {
            if (state.animations) {
                setFps(value);
                for (const anim of state.animations) {
                    if (state.useTargetAnimations) {
                        (anim as TargetedAnimation).animation.framePerSecond = value;
                    } else {
                        (anim as Animation).framePerSecond = value;
                    }
                }
            }
        },
        [state.animations, state.useTargetAnimations]
    );

    return (
        <div className={styles.root}>
            <div className={styles.menuBar}>
                {!state.useTargetAnimations && (
                    <>
                        <Tooltip content="Add new animation" relationship="label">
                            <Button icon={AddRegular} appearance={mode === "add" ? "primary" : "subtle"} onClick={() => setMode("add")} />
                        </Tooltip>
                        <Tooltip content="Load animations" relationship="label">
                            <Button icon={ArrowDownloadRegular} appearance={mode === "load" ? "primary" : "subtle"} onClick={() => setMode("load")} />
                        </Tooltip>
                    </>
                )}
                <Tooltip content="Save current animations" relationship="label">
                    <Button icon={SaveRegular} appearance={mode === "save" ? "primary" : "subtle"} onClick={() => setMode("save")} />
                </Tooltip>
                <Tooltip content="Edit animations" relationship="label">
                    <Button icon={EditRegular} appearance={mode === "edit" ? "primary" : "subtle"} onClick={() => setMode("edit")} />
                </Tooltip>

                <div className={styles.fpsInput}>
                    <SpinButton className={styles.spinButton} value={fps} onChange={handleFpsChange} min={1} max={120} />
                    <span className={styles.fpsLabel}>fps</span>
                </div>
            </div>

            <div className={styles.content}>
                {mode === "edit" && <AnimationList />}
                {mode === "add" && <AddAnimationPanel onClose={() => setMode("edit")} />}
                {mode === "load" && <LoadAnimationPanel onClose={() => setMode("edit")} />}
                {mode === "save" && <SaveAnimationPanel onClose={() => setMode("edit")} />}
            </div>
        </div>
    );
};

// Placeholder panels - these would be fully implemented
const AddAnimationPanel: FunctionComponent<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div>
            <Button appearance="subtle" onClick={onClose} label="Back" />
            <p>Add animation panel - to be implemented</p>
        </div>
    );
};

const LoadAnimationPanel: FunctionComponent<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div>
            <Button appearance="subtle" onClick={onClose} label="Back" />
            <p>Load animation panel - to be implemented</p>
        </div>
    );
};

const SaveAnimationPanel: FunctionComponent<{ onClose: () => void }> = ({ onClose }) => {
    return (
        <div>
            <Button appearance="subtle" onClick={onClose} label="Back" />
            <p>Save animation panel - to be implemented</p>
        </div>
    );
};
