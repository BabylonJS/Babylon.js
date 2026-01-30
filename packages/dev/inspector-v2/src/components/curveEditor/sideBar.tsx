import type { FunctionComponent } from "react";

import { makeStyles, tokens } from "@fluentui/react-components";
import { useCallback, useEffect, useRef, useState } from "react";
import { AddRegular, ArrowDownloadRegular, SaveRegular } from "@fluentui/react-icons";
import type { Animation } from "core/Animations/animation";
import type { TargetedAnimation } from "core/Animations/animationGroup";

import { Button } from "shared-ui-components/fluent/primitives/button";
import { Popover } from "shared-ui-components/fluent/primitives/popover";
import { SpinButton } from "shared-ui-components/fluent/primitives/spinButton";
import { useCurveEditor } from "./curveEditorContext";
import { AnimationList } from "./sideBar/animationList";
import { AddAnimationPanel } from "./sideBar/addAnimationPanel";
import { LoadAnimationPanel } from "./sideBar/loadAnimationPanel";
import { SaveAnimationPanel } from "./sideBar/saveAnimationPanel";

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
    popoverSurface: {
        padding: tokens.spacingHorizontalM,
        maxHeight: "500px",
        overflow: "auto",
    },
});

type PopoverType = "add" | "load" | "save" | null;

/**
 * Sidebar component for the curve editor with animation list and controls
 * @returns The sidebar component
 */
export const SideBar: FunctionComponent = () => {
    const styles = useStyles();
    const { state, actions, observables } = useCurveEditor();

    const [openPopover, setOpenPopover] = useState<PopoverType>(null);
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
            setOpenPopover(null);
        });
        return () => {
            observables.onAnimationsLoaded.remove(observer);
        };
    }, [observables]);

    // Subscribe to delete animation request - use ref to access current state.target
    const targetRef = useRef(state.target);
    targetRef.current = state.target;

    useEffect(() => {
        const observer = observables.onDeleteAnimation.add((animation: Animation) => {
            // Remove from active animations
            actions.setActiveAnimations((prev) => prev.filter((a) => a !== animation));

            // Update target if exists
            const target = targetRef.current;
            if (target && target.animations) {
                target.animations = target.animations.filter((a: Animation) => a !== animation);
            }

            // Also update state.animations if it's an array we can filter
            // This mutates the array in place since we can't setState on a prop
            if (state.animations) {
                const index = state.animations.findIndex((a) => {
                    const anim = state.useTargetAnimations ? (a as TargetedAnimation).animation : (a as Animation);
                    return anim === animation;
                });
                if (index !== -1) {
                    state.animations.splice(index, 1);
                }
            }

            observables.onAnimationsLoaded.notifyObservers();
            observables.onActiveAnimationChanged.notifyObservers({});
        });
        return () => {
            observables.onDeleteAnimation.remove(observer);
        };
        // Note: We intentionally don't include actions in deps because setActiveAnimations is stable
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
                        <Popover
                            open={openPopover === "add"}
                            onOpenChange={(open) => setOpenPopover(open ? "add" : null)}
                            positioning="below-start"
                            trigger={<Button icon={AddRegular} appearance={openPopover === "add" ? "primary" : "subtle"} title="Add new animation" />}
                        >
                            <AddAnimationPanel onClose={() => setOpenPopover(null)} />
                        </Popover>
                        <Popover
                            open={openPopover === "load"}
                            onOpenChange={(open) => setOpenPopover(open ? "load" : null)}
                            positioning="below-start"
                            trigger={<Button icon={ArrowDownloadRegular} appearance={openPopover === "load" ? "primary" : "subtle"} title="Load animations" />}
                        >
                            <LoadAnimationPanel onClose={() => setOpenPopover(null)} />
                        </Popover>
                    </>
                )}
                <Popover
                    open={openPopover === "save"}
                    onOpenChange={(open) => setOpenPopover(open ? "save" : null)}
                    positioning="below-start"
                    trigger={<Button icon={SaveRegular} appearance={openPopover === "save" ? "primary" : "subtle"} title="Save current animations" />}
                >
                    <SaveAnimationPanel onClose={() => setOpenPopover(null)} />
                </Popover>

                <div className={styles.fpsInput}>
                    <SpinButton className={styles.spinButton} value={fps} onChange={handleFpsChange} min={1} max={120} />
                    <div className={styles.fpsLabel}>fps</div>
                </div>
            </div>

            <div className={styles.content}>
                <AnimationList />
            </div>
        </div>
    );
};
