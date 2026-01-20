import type { FunctionComponent } from "react";

import { makeStyles, tokens, Tooltip, Dialog, DialogSurface, DialogBody, DialogTitle, DialogContent } from "@fluentui/react-components";
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
import { EditAnimationPanel } from "./sideBar/editAnimationPanel";
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

type PopoverType = "add" | "load" | "save" | "editAnimation" | null;

/**
 * Sidebar component for the curve editor with animation list and controls
 * @returns The sidebar component
 */
export const SideBar: FunctionComponent = () => {
    const styles = useStyles();
    const { state, actions, observables } = useCurveEditor();

    const [openPopover, setOpenPopover] = useState<PopoverType>(null);
    const [fps, setFps] = useState(60);
    const [editingAnimation, setEditingAnimation] = useState<Animation | null>(null);

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

    // Subscribe to edit animation request
    useEffect(() => {
        const observer = observables.onEditAnimationRequired.add((animation: Animation) => {
            setEditingAnimation(animation);
            setOpenPopover("editAnimation");
        });
        return () => {
            observables.onEditAnimationRequired.remove(observer);
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
            if (target) {
                target.animations = (target.animations ?? []).filter((a: Animation) => a !== animation);
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
                            trigger={
                                <Tooltip content="Add new animation" relationship="label">
                                    <Button icon={AddRegular} appearance={openPopover === "add" ? "primary" : "subtle"} />
                                </Tooltip>
                            }
                        >
                            <AddAnimationPanel onClose={() => setOpenPopover(null)} />
                        </Popover>
                        <Popover
                            open={openPopover === "load"}
                            onOpenChange={(open) => setOpenPopover(open ? "load" : null)}
                            positioning="below-start"
                            trigger={
                                <Tooltip content="Load animations" relationship="label">
                                    <Button icon={ArrowDownloadRegular} appearance={openPopover === "load" ? "primary" : "subtle"} />
                                </Tooltip>
                            }
                        >
                            <LoadAnimationPanel onClose={() => setOpenPopover(null)} />
                        </Popover>
                    </>
                )}
                <Popover
                    open={openPopover === "save"}
                    onOpenChange={(open) => setOpenPopover(open ? "save" : null)}
                    positioning="below-start"
                    trigger={
                        <Tooltip content="Save current animations" relationship="label">
                            <Button icon={SaveRegular} appearance={openPopover === "save" ? "primary" : "subtle"} />
                        </Tooltip>
                    }
                >
                    <SaveAnimationPanel onClose={() => setOpenPopover(null)} />
                </Popover>

                <div className={styles.fpsInput}>
                    <SpinButton className={styles.spinButton} value={fps} onChange={handleFpsChange} min={1} max={120} />
                    <span className={styles.fpsLabel}>fps</span>
                </div>
            </div>

            <div className={styles.content}>
                <AnimationList />
            </div>

            {/* Edit animation dialog - triggered from animation list gear icon */}
            <Dialog
                open={openPopover === "editAnimation" && editingAnimation !== null}
                onOpenChange={(_, data) => {
                    if (!data.open) {
                        setOpenPopover(null);
                        setEditingAnimation(null);
                    }
                }}
            >
                <DialogSurface>
                    <DialogBody>
                        <DialogTitle>Edit Animation</DialogTitle>
                        <DialogContent>
                            {editingAnimation && (
                                <EditAnimationPanel
                                    animation={editingAnimation}
                                    onClose={() => {
                                        setEditingAnimation(null);
                                        setOpenPopover(null);
                                    }}
                                />
                            )}
                        </DialogContent>
                    </DialogBody>
                </DialogSurface>
            </Dialog>
        </div>
    );
};
