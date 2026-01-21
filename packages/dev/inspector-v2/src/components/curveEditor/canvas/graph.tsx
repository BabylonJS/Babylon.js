import type { FunctionComponent } from "react";
import type { Animation } from "core/Animations/animation";
import type { IAnimationKey } from "core/Animations/animationKey";

import { makeStyles, tokens } from "@fluentui/react-components";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animation as AnimationEnum } from "core/Animations/animation";
import { Vector2 } from "core/Maths/math.vector";
import { Vector3 } from "core/Maths/math.vector";
import { Quaternion } from "core/Maths/math.vector";
import { Color3, Color4 } from "core/Maths/math.color";

import { useCurveEditor } from "../curveEditorContext";
import { useObservableState } from "../../../hooks/observableHooks";
import { Curve, type CurveData } from "./curve";
import { ChannelColors, ColorChannelColors, DefaultCurveColor, GraphColors } from "../curveEditorColors";

const useStyles = makeStyles({
    root: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        overflow: "hidden",
        backgroundColor: tokens.colorNeutralBackground2,
    },
    svg: {
        position: "absolute",
        top: 0,
        left: 0,
    },
    gridLine: {
        stroke: tokens.colorNeutralStroke2,
        strokeWidth: "1px",
        strokeDasharray: "4 4",
    },
    zeroLine: {
        stroke: GraphColors.zeroLine,
        strokeWidth: "1px",
    },
    selectionRect: {
        fill: "rgba(255, 255, 255, 0.1)",
        stroke: GraphColors.selectionStroke,
        strokeWidth: "1px",
        strokeDasharray: "4 4",
    },
    valueAxisLabel: {
        fill: GraphColors.valueAxisLabel,
        fontSize: "10px",
        fontFamily: "acumin-pro-condensed, sans-serif",
        userSelect: "none",
    },
    valueAxisBackground: {
        fill: GraphColors.valueAxisBackground,
    },
    activeRangeOverlay: {
        position: "absolute" as const,
        top: 0,
        height: "100%",
        backgroundColor: "rgba(38, 82, 128, 0.3)",
        border: "1px solid rgba(78, 140, 206, 0.5)",
        pointerEvents: "none" as const,
    },
});

type GraphProps = {
    width: number;
    height: number;
};

/**
 * Main graph area for displaying and editing animation curves
 * @returns The graph component
 */
export const Graph: FunctionComponent<GraphProps> = ({ width, height }) => {
    const styles = useStyles();
    const { state, actions, observables } = useCurveEditor();
    const svgRef = useRef<SVGSVGElement>(null);

    const [scale, setScale] = useState(1);
    const [offsetX, setOffsetX] = useState(0);
    const [offsetY, setOffsetY] = useState(0);
    const [isPointerDown, setIsPointerDown] = useState(false);
    const [pointerStart, setPointerStart] = useState({ x: 0, y: 0 });
    const [selectedKey, setSelectedKey] = useState<{ curveId: string; keyIndex: number } | null>(null);

    // Re-render when active animation or range changes - use counter to invalidate memoized curves
    const animationVersion = useObservableState(() => Date.now(), observables.onActiveAnimationChanged, observables.onRangeUpdated);

    // Ensure dimensions are valid
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);

    const graphOffsetX = 30;
    const viewWidth = safeWidth - graphOffsetX;

    // Subscribe to action observables
    useEffect(() => {
        // Handle create or update key point
        const onCreateOrUpdateKeyPointRequired = observables.onCreateOrUpdateKeyPointRequired.add(() => {
            if (state.activeAnimations.length === 0) {
                return;
            }

            for (const currentAnimation of state.activeAnimations) {
                if (currentAnimation.dataType === AnimationEnum.ANIMATIONTYPE_QUATERNION) {
                    continue;
                }
                const keys = currentAnimation.getKeys();
                const currentFrame = state.activeFrame;

                // Find where to insert the new key
                let indexToAdd = -1;
                for (const key of keys) {
                    if (key.frame < currentFrame) {
                        indexToAdd++;
                    } else {
                        break;
                    }
                }

                // Get the value at the current frame
                const value = currentAnimation.evaluate(currentFrame);

                const leftKey = keys[indexToAdd];
                const rightKey = keys[indexToAdd + 1];

                if (leftKey && Math.floor(currentFrame - leftKey.frame) === 0) {
                    // Key already exists at this frame, update it
                    leftKey.value = value;
                } else if (rightKey && Math.floor(rightKey.frame - currentFrame) === 0) {
                    // Key already exists at this frame, update it
                    rightKey.value = value;
                } else {
                    // Create new key
                    const newKey: IAnimationKey = {
                        frame: currentFrame,
                        value: value,
                        lockedTangent: true,
                    };

                    keys.splice(indexToAdd + 1, 0, newKey);
                }

                currentAnimation.setKeys(keys);
            }

            // Clear selection and refresh
            actions.setActiveKeyPoints([]);
            observables.onActiveKeyPointChanged.notifyObservers();
            observables.onActiveAnimationChanged.notifyObservers({});
        });

        // Handle frame canvas - reset view to fit all content
        const onFrameRequired = observables.onFrameRequired.add(() => {
            setScale(1);
            setOffsetX(0);
            setOffsetY(0);
        });

        // Handle delete active key points
        const onDeleteKeyActiveKeyPoints = observables.onDeleteKeyActiveKeyPoints.add(() => {
            if (!state.activeKeyPoints || state.activeKeyPoints.length === 0) {
                return;
            }

            // Group key points by animation
            const keysByAnimation = new Map<Animation, Set<number>>();
            for (const keyPoint of state.activeKeyPoints) {
                const animation = keyPoint.curve.animation;
                if (!keysByAnimation.has(animation)) {
                    keysByAnimation.set(animation, new Set());
                }
                keysByAnimation.get(animation)!.add(keyPoint.keyId);
            }

            // Delete keys from each animation (in reverse order to maintain indices)
            for (const [animation, keyIndices] of keysByAnimation) {
                const keys = animation.getKeys();
                const sortedIndices = Array.from(keyIndices).sort((a, b) => b - a); // Sort descending
                for (const index of sortedIndices) {
                    if (index >= 0 && index < keys.length) {
                        keys.splice(index, 1);
                    }
                }
                animation.setKeys(keys);
            }

            // Clear selection and refresh
            actions.setActiveKeyPoints([]);
            observables.onActiveKeyPointChanged.notifyObservers();
            observables.onActiveAnimationChanged.notifyObservers({});
        });

        // Helper to get the component property name for a data type
        const getComponentProperty = (dataType: number, component: number): string | null => {
            if (dataType === AnimationEnum.ANIMATIONTYPE_FLOAT) {
                return null; // Float has no components
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_VECTOR2) {
                return ["x", "y"][component] || null;
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_VECTOR3) {
                return ["x", "y", "z"][component] || null;
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_COLOR3) {
                return ["r", "g", "b"][component] || null;
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_COLOR4) {
                return ["r", "g", "b", "a"][component] || null;
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_QUATERNION) {
                return ["x", "y", "z", "w"][component] || null;
            }
            return null;
        };

        // Helper to create a tangent object for a given data type (initialized to 0)
        // Must use actual Babylon.js classes so they have .scale() method
        const createTangentObject = (dataType: number): unknown => {
            if (dataType === AnimationEnum.ANIMATIONTYPE_FLOAT) {
                return 0;
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_VECTOR2) {
                return new Vector2(0, 0);
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_VECTOR3) {
                return new Vector3(0, 0, 0);
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_COLOR3) {
                return new Color3(0, 0, 0);
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_COLOR4) {
                return new Color4(0, 0, 0, 0);
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_QUATERNION) {
                return new Quaternion(0, 0, 0, 0);
            }
            return 0;
        };

        // Helper to set a tangent component value
        const setTangentComponent = (key: IAnimationKey, tangentType: "inTangent" | "outTangent", dataType: number, component: number, value: number) => {
            const prop = getComponentProperty(dataType, component);
            if (prop === null) {
                // Float type - set directly
                key[tangentType] = value;
            } else {
                // Vector/Color type - set component
                if (!key[tangentType]) {
                    key[tangentType] = createTangentObject(dataType);
                }
                (key[tangentType] as Record<string, number>)[prop] = value;
            }
        };

        // Handle flatten tangent - set tangent slopes to 0 (horizontal)
        const onFlattenTangentRequired = observables.onFlattenTangentRequired.add(() => {
            if (!state.activeKeyPoints || state.activeKeyPoints.length === 0) {
                return;
            }

            for (const keyPoint of state.activeKeyPoints) {
                const animation = keyPoint.curve.animation;
                const keys = animation.getKeys();
                const keyId = keyPoint.keyId;
                const component = keyPoint.curve.component;
                const dataType = animation.dataType;

                if (keyId >= 0 && keyId < keys.length) {
                    const key = keys[keyId];
                    // Set interpolation to NONE (bezier)
                    key.interpolation = undefined;
                    // Set tangents to 0 (flat/horizontal)
                    if (keyId > 0) {
                        setTangentComponent(key, "inTangent", dataType, component, 0);
                    }
                    if (keyId < keys.length - 1) {
                        setTangentComponent(key, "outTangent", dataType, component, 0);
                    }
                }
            }

            observables.onActiveAnimationChanged.notifyObservers({});
        });

        // Handle linear tangent - set tangent to slope between adjacent keys
        const onLinearTangentRequired = observables.onLinearTangentRequired.add(() => {
            if (!state.activeKeyPoints || state.activeKeyPoints.length === 0) {
                return;
            }

            for (const keyPoint of state.activeKeyPoints) {
                const animation = keyPoint.curve.animation;
                const keys = animation.getKeys();
                const keyId = keyPoint.keyId;
                const component = keyPoint.curve.component;
                const dataType = animation.dataType;
                const prop = getComponentProperty(dataType, component);

                if (keyId >= 0 && keyId < keys.length) {
                    const key = keys[keyId];
                    // Set interpolation to NONE (bezier)
                    key.interpolation = undefined;

                    // Get the component value from a key
                    const getKeyValue = (k: IAnimationKey): number => {
                        if (prop === null) {
                            return k.value as number;
                        }
                        return (k.value as Record<string, number>)[prop];
                    };

                    // Calculate linear tangent (slope to adjacent keys)
                    if (keyId > 0) {
                        const prevKey = keys[keyId - 1];
                        const frameDiff = key.frame - prevKey.frame;
                        if (frameDiff !== 0) {
                            const slope = (getKeyValue(key) - getKeyValue(prevKey)) / frameDiff;
                            setTangentComponent(key, "inTangent", dataType, component, slope);
                        }
                    }
                    if (keyId < keys.length - 1) {
                        const nextKey = keys[keyId + 1];
                        const frameDiff = nextKey.frame - key.frame;
                        if (frameDiff !== 0) {
                            const slope = (getKeyValue(nextKey) - getKeyValue(key)) / frameDiff;
                            setTangentComponent(key, "outTangent", dataType, component, slope);
                        }
                    }
                }
            }

            observables.onActiveAnimationChanged.notifyObservers({});
        });

        // Handle break tangent - allow in/out tangents to be different
        const onBreakTangentRequired = observables.onBreakTangentRequired.add(() => {
            if (!state.activeKeyPoints || state.activeKeyPoints.length === 0) {
                return;
            }

            for (const keyPoint of state.activeKeyPoints) {
                const animation = keyPoint.curve.animation;
                const keys = animation.getKeys();
                const keyId = keyPoint.keyId;

                if (keyId >= 0 && keyId < keys.length) {
                    const key = keys[keyId];
                    key.interpolation = undefined;
                    key.lockedTangent = false;
                }
            }

            observables.onActiveAnimationChanged.notifyObservers({});
        });

        // Handle unify tangent - keep in/out tangents the same
        const onUnifyTangentRequired = observables.onUnifyTangentRequired.add(() => {
            if (!state.activeKeyPoints || state.activeKeyPoints.length === 0) {
                return;
            }

            for (const keyPoint of state.activeKeyPoints) {
                const animation = keyPoint.curve.animation;
                const keys = animation.getKeys();
                const keyId = keyPoint.keyId;

                if (keyId >= 0 && keyId < keys.length) {
                    const key = keys[keyId];
                    key.interpolation = undefined;
                    key.lockedTangent = true;
                }
            }

            observables.onActiveAnimationChanged.notifyObservers({});
        });

        return () => {
            observables.onCreateOrUpdateKeyPointRequired.remove(onCreateOrUpdateKeyPointRequired);
            observables.onFrameRequired.remove(onFrameRequired);
            observables.onDeleteKeyActiveKeyPoints.remove(onDeleteKeyActiveKeyPoints);
            observables.onFlattenTangentRequired.remove(onFlattenTangentRequired);
            observables.onLinearTangentRequired.remove(onLinearTangentRequired);
            observables.onBreakTangentRequired.remove(onBreakTangentRequired);
            observables.onUnifyTangentRequired.remove(onUnifyTangentRequired);
        };
    }, [observables, state.activeAnimations, state.activeFrame, state.activeKeyPoints, actions]);

    // Get curves from active animations
    const curves = useMemo((): CurveData[] => {
        const result: CurveData[] = [];

        for (const animation of state.activeAnimations) {
            const keys = animation.getKeys();
            if (keys.length === 0) {
                continue;
            }

            const color = state.activeChannels[animation.uniqueId];

            if (animation.dataType === AnimationEnum.ANIMATIONTYPE_FLOAT) {
                result.push({
                    animation,
                    color: color || DefaultCurveColor,
                    component: 0,
                    keys: keys.map((k) => ({
                        frame: k.frame,
                        value: k.value as number,
                        inTangent: k.inTangent as number | undefined,
                        outTangent: k.outTangent as number | undefined,
                        interpolation: k.interpolation,
                    })),
                });
            } else if (animation.dataType === AnimationEnum.ANIMATIONTYPE_VECTOR2) {
                if (!color || color === ChannelColors.X) {
                    result.push({
                        animation,
                        color: ChannelColors.X,
                        component: 0,
                        keys: keys.map((k) => ({
                            frame: k.frame,
                            value: (k.value as { x: number }).x,
                            inTangent: k.inTangent?.x,
                            outTangent: k.outTangent?.x,
                            interpolation: k.interpolation,
                        })),
                    });
                }
                if (!color || color === ChannelColors.Y) {
                    result.push({
                        animation,
                        color: ChannelColors.Y,
                        component: 1,
                        keys: keys.map((k) => ({
                            frame: k.frame,
                            value: (k.value as { y: number }).y,
                            inTangent: k.inTangent?.y,
                            outTangent: k.outTangent?.y,
                            interpolation: k.interpolation,
                        })),
                    });
                }
            } else if (animation.dataType === AnimationEnum.ANIMATIONTYPE_VECTOR3) {
                if (!color || color === ChannelColors.X) {
                    result.push({
                        animation,
                        color: ChannelColors.X,
                        component: 0,
                        keys: keys.map((k) => ({
                            frame: k.frame,
                            value: (k.value as { x: number }).x,
                            inTangent: k.inTangent?.x,
                            outTangent: k.outTangent?.x,
                            interpolation: k.interpolation,
                        })),
                    });
                }
                if (!color || color === ChannelColors.Y) {
                    result.push({
                        animation,
                        color: ChannelColors.Y,
                        component: 1,
                        keys: keys.map((k) => ({
                            frame: k.frame,
                            value: (k.value as { y: number }).y,
                            inTangent: k.inTangent?.y,
                            outTangent: k.outTangent?.y,
                            interpolation: k.interpolation,
                        })),
                    });
                }
                if (!color || color === ChannelColors.Z) {
                    result.push({
                        animation,
                        color: ChannelColors.Z,
                        component: 2,
                        keys: keys.map((k) => ({
                            frame: k.frame,
                            value: (k.value as { z: number }).z,
                            inTangent: k.inTangent?.z,
                            outTangent: k.outTangent?.z,
                            interpolation: k.interpolation,
                        })),
                    });
                }
            } else if (animation.dataType === AnimationEnum.ANIMATIONTYPE_COLOR3) {
                if (!color || color === ColorChannelColors.R) {
                    result.push({
                        animation,
                        color: ColorChannelColors.R,
                        component: 0,
                        keys: keys.map((k) => ({
                            frame: k.frame,
                            value: (k.value as { r: number }).r,
                            inTangent: k.inTangent?.r,
                            outTangent: k.outTangent?.r,
                            interpolation: k.interpolation,
                        })),
                    });
                }
                if (!color || color === ColorChannelColors.G) {
                    result.push({
                        animation,
                        color: ColorChannelColors.G,
                        component: 1,
                        keys: keys.map((k) => ({
                            frame: k.frame,
                            value: (k.value as { g: number }).g,
                            inTangent: k.inTangent?.g,
                            outTangent: k.outTangent?.g,
                            interpolation: k.interpolation,
                        })),
                    });
                }
                if (!color || color === ColorChannelColors.B) {
                    result.push({
                        animation,
                        color: ColorChannelColors.B,
                        component: 2,
                        keys: keys.map((k) => ({
                            frame: k.frame,
                            value: (k.value as { b: number }).b,
                            inTangent: k.inTangent?.b,
                            outTangent: k.outTangent?.b,
                            interpolation: k.interpolation,
                        })),
                    });
                }
            } else if (animation.dataType === AnimationEnum.ANIMATIONTYPE_COLOR4) {
                if (!color || color === ColorChannelColors.R) {
                    result.push({
                        animation,
                        color: ColorChannelColors.R,
                        component: 0,
                        keys: keys.map((k) => ({
                            frame: k.frame,
                            value: (k.value as { r: number }).r,
                            inTangent: k.inTangent?.r,
                            outTangent: k.outTangent?.r,
                            interpolation: k.interpolation,
                        })),
                    });
                }
                if (!color || color === ColorChannelColors.G) {
                    result.push({
                        animation,
                        color: ColorChannelColors.G,
                        component: 1,
                        keys: keys.map((k) => ({
                            frame: k.frame,
                            value: (k.value as { g: number }).g,
                            inTangent: k.inTangent?.g,
                            outTangent: k.outTangent?.g,
                            interpolation: k.interpolation,
                        })),
                    });
                }
                if (!color || color === ColorChannelColors.B) {
                    result.push({
                        animation,
                        color: ColorChannelColors.B,
                        component: 2,
                        keys: keys.map((k) => ({
                            frame: k.frame,
                            value: (k.value as { b: number }).b,
                            inTangent: k.inTangent?.b,
                            outTangent: k.outTangent?.b,
                            interpolation: k.interpolation,
                        })),
                    });
                }
                if (!color || color === ColorChannelColors.A) {
                    result.push({
                        animation,
                        color: ColorChannelColors.A,
                        component: 3,
                        keys: keys.map((k) => ({
                            frame: k.frame,
                            value: (k.value as { a: number }).a,
                            inTangent: k.inTangent?.a,
                            outTangent: k.outTangent?.a,
                            interpolation: k.interpolation,
                        })),
                    });
                }
            } else if (animation.dataType === AnimationEnum.ANIMATIONTYPE_QUATERNION) {
                if (!color || color === ChannelColors.X) {
                    result.push({
                        animation,
                        color: ChannelColors.X,
                        component: 0,
                        keys: keys.map((k) => ({
                            frame: k.frame,
                            value: (k.value as { x: number }).x,
                            inTangent: k.inTangent?.x,
                            outTangent: k.outTangent?.x,
                            interpolation: k.interpolation,
                        })),
                    });
                }
                if (!color || color === ChannelColors.Y) {
                    result.push({
                        animation,
                        color: ChannelColors.Y,
                        component: 1,
                        keys: keys.map((k) => ({
                            frame: k.frame,
                            value: (k.value as { y: number }).y,
                            inTangent: k.inTangent?.y,
                            outTangent: k.outTangent?.y,
                            interpolation: k.interpolation,
                        })),
                    });
                }
                if (!color || color === ChannelColors.Z) {
                    result.push({
                        animation,
                        color: ChannelColors.Z,
                        component: 2,
                        keys: keys.map((k) => ({
                            frame: k.frame,
                            value: (k.value as { z: number }).z,
                            inTangent: k.inTangent?.z,
                            outTangent: k.outTangent?.z,
                            interpolation: k.interpolation,
                        })),
                    });
                }
                if (!color || color === ChannelColors.W) {
                    result.push({
                        animation,
                        color: ChannelColors.W,
                        component: 3,
                        keys: keys.map((k) => ({
                            frame: k.frame,
                            value: (k.value as { w: number }).w,
                            inTangent: k.inTangent?.w,
                            outTangent: k.outTangent?.w,
                            interpolation: k.interpolation,
                        })),
                    });
                }
            }
        }

        return result;
    }, [state.activeAnimations, state.activeChannels, animationVersion]);

    // Calculate value range
    const valueRange = useMemo(() => {
        let minValue = 0;
        let maxValue = 1;

        for (const curve of curves) {
            for (const key of curve.keys) {
                if (key.value < minValue) {
                    minValue = key.value;
                }
                if (key.value > maxValue) {
                    maxValue = key.value;
                }
            }
        }

        // Add padding
        const padding = (maxValue - minValue) * 0.1 || 1;
        return { min: minValue - padding, max: maxValue + padding };
    }, [curves]);

    // Convert frame to x position (uses reference frames for full visible range)
    const frameToX = useCallback(
        (frame: number) => {
            const { referenceMinFrame, referenceMaxFrame } = state;
            const range = referenceMaxFrame - referenceMinFrame;
            if (range <= 0) {
                return graphOffsetX;
            }
            return graphOffsetX + ((frame - referenceMinFrame) / range) * viewWidth * scale + offsetX;
        },
        [state, viewWidth, scale, offsetX]
    );

    // Convert value to y position
    const valueToY = useCallback(
        (value: number) => {
            const range = valueRange.max - valueRange.min;
            if (range <= 0) {
                return safeHeight / 2;
            }
            return safeHeight - ((value - valueRange.min) / range) * safeHeight * scale + offsetY;
        },
        [valueRange, safeHeight, scale, offsetY]
    );

    // Convert x position to frame (uses reference frames for full visible range)
    const xToFrame = useCallback(
        (x: number) => {
            const { referenceMinFrame, referenceMaxFrame } = state;
            const range = referenceMaxFrame - referenceMinFrame;
            if (range <= 0) {
                return referenceMinFrame;
            }
            return referenceMinFrame + ((x - graphOffsetX - offsetX) / (viewWidth * scale)) * range;
        },
        [state, viewWidth, scale, offsetX]
    );

    // Convert y position to value
    const yToValue = useCallback(
        (y: number) => {
            const range = valueRange.max - valueRange.min;
            if (range <= 0) {
                return valueRange.min;
            }
            return valueRange.min + ((safeHeight - y + offsetY) / (safeHeight * scale)) * range;
        },
        [valueRange, safeHeight, scale, offsetY]
    );

    // Handle key frame changed from dragging
    const handleKeyFrameChanged = useCallback(
        (animation: Animation, keyIndex: number, component: number, newFrame: number) => {
            const keys = animation.getKeys();
            if (keyIndex >= 0 && keyIndex < keys.length) {
                keys[keyIndex].frame = newFrame;
                // Notify observers about the new frame value for spinbutton updates
                observables.onFrameSet.notifyObservers(newFrame);
                observables.onActiveAnimationChanged.notifyObservers({});
            }
        },
        [observables]
    );

    // Handle key value changed from dragging
    const handleKeyValueChanged = useCallback(
        (animation: Animation, keyIndex: number, component: number, newValue: number) => {
            const keys = animation.getKeys();
            if (keyIndex >= 0 && keyIndex < keys.length) {
                const key = keys[keyIndex];
                const dataType = animation.dataType;

                // Update the correct component based on data type
                if (dataType === AnimationEnum.ANIMATIONTYPE_FLOAT) {
                    key.value = newValue;
                } else if (dataType === AnimationEnum.ANIMATIONTYPE_VECTOR2) {
                    const componentKeys = ["x", "y"];
                    (key.value as Record<string, number>)[componentKeys[component]] = newValue;
                } else if (dataType === AnimationEnum.ANIMATIONTYPE_VECTOR3 || dataType === AnimationEnum.ANIMATIONTYPE_SIZE) {
                    const componentKeys = ["x", "y", "z"];
                    if (dataType === AnimationEnum.ANIMATIONTYPE_SIZE) {
                        componentKeys[0] = "width";
                        componentKeys[1] = "height";
                    }
                    (key.value as Record<string, number>)[componentKeys[component]] = newValue;
                } else if (dataType === AnimationEnum.ANIMATIONTYPE_COLOR3) {
                    const componentKeys = ["r", "g", "b"];
                    (key.value as Record<string, number>)[componentKeys[component]] = newValue;
                } else if (dataType === AnimationEnum.ANIMATIONTYPE_COLOR4) {
                    const componentKeys = ["r", "g", "b", "a"];
                    (key.value as Record<string, number>)[componentKeys[component]] = newValue;
                } else if (dataType === AnimationEnum.ANIMATIONTYPE_QUATERNION) {
                    const componentKeys = ["x", "y", "z", "w"];
                    (key.value as Record<string, number>)[componentKeys[component]] = newValue;
                }

                // Notify observers about the new value for spinbutton updates
                observables.onValueSet.notifyObservers(newValue);
                observables.onActiveAnimationChanged.notifyObservers({});
            }
        },
        [observables]
    );

    // Handle pointer events for panning
    const handlePointerDown = useCallback((e: React.PointerEvent) => {
        if (e.button === 1 || (e.button === 0 && e.altKey)) {
            // Middle click or Alt+left click for panning
            setIsPointerDown(true);
            setPointerStart({ x: e.clientX, y: e.clientY });
            e.currentTarget.setPointerCapture(e.pointerId);
        }
    }, []);

    const handlePointerMove = useCallback(
        (e: React.PointerEvent) => {
            if (!isPointerDown) {
                return;
            }

            const dx = e.clientX - pointerStart.x;
            const dy = e.clientY - pointerStart.y;

            setOffsetX((prev) => prev + dx);
            setOffsetY((prev) => prev + dy);
            setPointerStart({ x: e.clientX, y: e.clientY });

            observables.onGraphMoved.notifyObservers(offsetX + dx);
        },
        [isPointerDown, pointerStart, offsetX, observables]
    );

    const handlePointerUp = useCallback((e: React.PointerEvent) => {
        setIsPointerDown(false);
        e.currentTarget.releasePointerCapture(e.pointerId);
    }, []);

    // Handle wheel for zooming
    const handleWheel = useCallback(
        (e: React.WheelEvent) => {
            e.preventDefault();
            const delta = e.deltaY > 0 ? 0.9 : 1.1;
            const newScale = Math.max(0.5, Math.min(5, scale * delta));
            setScale(newScale);
            observables.onGraphScaled.notifyObservers(newScale);
        },
        [scale, observables]
    );

    // Calculate nice step size for grid lines
    const calculateNiceStep = useCallback((range: number, targetLines: number): number => {
        const roughStep = range / targetLines;
        const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
        const residual = roughStep / magnitude;

        let niceStep: number;
        if (residual <= 1.5) {
            niceStep = magnitude;
        } else if (residual <= 3) {
            niceStep = 2 * magnitude;
        } else if (residual <= 7) {
            niceStep = 5 * magnitude;
        } else {
            niceStep = 10 * magnitude;
        }

        return niceStep;
    }, []);

    // Render grid lines
    const renderGrid = useCallback(() => {
        const lines: JSX.Element[] = [];
        const range = valueRange.max - valueRange.min;

        // Calculate nice step for horizontal grid lines
        const valueStep = calculateNiceStep(range, 5);

        // Find the first nice value above min
        const startValue = Math.ceil(valueRange.min / valueStep) * valueStep;

        // Draw horizontal grid lines at nice values
        for (let value = startValue; value <= valueRange.max; value += valueStep) {
            const y = valueToY(value);
            const isZero = Math.abs(value) < valueStep * 0.001;
            lines.push(<line key={`h-${value}`} className={isZero ? styles.zeroLine : styles.gridLine} x1={graphOffsetX} y1={y} x2={width} y2={y} />);
        }

        // Always draw zero line if in range (in case it wasn't hit by the loop)
        if (valueRange.min < 0 && valueRange.max > 0) {
            const zeroInLoop = Math.abs(startValue % valueStep) < valueStep * 0.001 || Math.abs((startValue - valueStep) % valueStep) < valueStep * 0.001;
            if (!zeroInLoop) {
                const y = valueToY(0);
                lines.push(<line key="zero" className={styles.zeroLine} x1={graphOffsetX} y1={y} x2={safeWidth} y2={y} />);
            }
        }

        // Vertical grid lines (frame) - use reference frames for full range
        const { referenceMinFrame, referenceMaxFrame } = state;
        const frameRange = referenceMaxFrame - referenceMinFrame;
        const frameStep = calculateNiceStep(frameRange, 10);
        const startFrame = Math.ceil(referenceMinFrame / frameStep) * frameStep;

        for (let frame = startFrame; frame <= referenceMaxFrame; frame += frameStep) {
            const x = frameToX(frame);
            lines.push(<line key={`v-${frame}`} className={styles.gridLine} x1={x} y1={0} x2={x} y2={safeHeight} />);
        }

        return lines;
    }, [valueRange, frameToX, valueToY, state, safeWidth, safeHeight, styles, calculateNiceStep]);

    // Render value axis labels
    const renderValueAxis = useCallback(() => {
        const elements: JSX.Element[] = [];

        // Background for value axis
        elements.push(<rect key="axis-bg" className={styles.valueAxisBackground} x={0} y={0} width={graphOffsetX} height={safeHeight} />);

        // Value labels at nice step values (matching grid)
        const range = valueRange.max - valueRange.min;
        const valueStep = calculateNiceStep(range, 5);
        const startValue = Math.ceil(valueRange.min / valueStep) * valueStep;

        for (let value = startValue; value <= valueRange.max; value += valueStep) {
            const y = valueToY(value);
            // Format the value nicely
            let displayValue: string;
            if (Math.abs(value) < 0.0001 && value !== 0) {
                displayValue = value.toExponential(1);
            } else if (Math.abs(value) < 1) {
                displayValue = value.toFixed(Math.max(0, -Math.floor(Math.log10(valueStep))));
            } else {
                displayValue = value.toFixed(Math.min(2, Math.max(0, -Math.floor(Math.log10(valueStep)))));
            }
            elements.push(
                <text key={`label-${value}`} className={styles.valueAxisLabel} x={graphOffsetX - 4} y={y} textAnchor="end" dominantBaseline="middle">
                    {displayValue}
                </text>
            );
        }

        return elements;
    }, [valueRange, valueToY, safeHeight, styles, calculateNiceStep]);

    // Calculate active range overlay position
    const activeRangeLeft = frameToX(state.fromKey);
    const activeRangeRight = frameToX(state.toKey);
    const activeRangeWidth = activeRangeRight - activeRangeLeft;

    return (
        <div className={styles.root}>
            {/* Active range overlay (dark rectangle showing playback range) */}
            {state.activeAnimations.length > 0 && activeRangeWidth > 0 && (
                <div
                    className={styles.activeRangeOverlay}
                    style={{
                        left: Math.max(graphOffsetX, activeRangeLeft),
                        width: Math.min(activeRangeWidth, safeWidth - Math.max(graphOffsetX, activeRangeLeft)),
                    }}
                />
            )}
            <svg
                ref={svgRef}
                className={styles.svg}
                width={safeWidth}
                height={safeHeight}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onWheel={handleWheel}
            >
                {renderGrid()}

                {curves.map((curve) => {
                    const curveId = `${curve.animation.uniqueId}-${curve.component}`;
                    return (
                        <Curve
                            key={curveId}
                            curve={curve}
                            frameToX={frameToX}
                            valueToY={valueToY}
                            xToFrame={xToFrame}
                            yToValue={yToValue}
                            onKeyFrameChanged={handleKeyFrameChanged}
                            onKeyValueChanged={handleKeyValueChanged}
                            selectedKeyIndex={selectedKey?.curveId === curveId ? selectedKey.keyIndex : null}
                            onKeySelected={(keyIndex) => {
                                setSelectedKey(keyIndex !== null ? { curveId, keyIndex } : null);
                                // Update active key points in context and notify observables
                                if (keyIndex !== null && keyIndex < curve.keys.length) {
                                    const key = curve.keys[keyIndex];
                                    // Update the active key points in context
                                    actions.setActiveKeyPoints([{ curve, keyId: keyIndex }]);
                                    // Notify observables about the selected key's frame and value
                                    observables.onFrameSet.notifyObservers(key.frame);
                                    observables.onValueSet.notifyObservers(key.value);
                                    observables.onActiveKeyPointChanged.notifyObservers();
                                } else {
                                    actions.setActiveKeyPoints([]);
                                    observables.onActiveKeyPointChanged.notifyObservers();
                                }
                            }}
                        />
                    );
                })}

                {renderValueAxis()}
            </svg>
        </div>
    );
};
