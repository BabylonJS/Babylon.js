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
import { Curve as SharedCurve } from "shared-ui-components/curveEditor/curve";
import { Curve } from "./curve";
import { KeyPointComponent } from "./keyPointComponent";
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

        // Helper to get component index from property name (inverse of getComponentProperty)
        const getComponentFromProperty = (dataType: number, property: string | undefined): number => {
            if (!property) {
                // Float type or no property
                return 0;
            }
            if (dataType === AnimationEnum.ANIMATIONTYPE_VECTOR2) {
                return ["x", "y"].indexOf(property);
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_VECTOR3) {
                return ["x", "y", "z"].indexOf(property);
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_COLOR3) {
                return ["r", "g", "b"].indexOf(property);
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_COLOR4) {
                return ["r", "g", "b", "a"].indexOf(property);
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_QUATERNION) {
                return ["x", "y", "z", "w"].indexOf(property);
            }
            return 0;
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

        // Helper to calculate default tangent slope between two keys for a specific component
        const calculateDefaultSlope = (keys: IAnimationKey[], fromIndex: number, toIndex: number, dataType: number, component: number): number => {
            if (fromIndex < 0 || toIndex < 0 || fromIndex >= keys.length || toIndex >= keys.length) {
                return 0;
            }
            const fromKey = keys[fromIndex];
            const toKey = keys[toIndex];
            const frameDelta = toKey.frame - fromKey.frame;
            if (frameDelta === 0) {
                return 0;
            }
            const prop = getComponentProperty(dataType, component);
            let fromValue: number, toValue: number;
            if (prop === null) {
                fromValue = fromKey.value as number;
                toValue = toKey.value as number;
            } else {
                fromValue = (fromKey.value as Record<string, number>)[prop];
                toValue = (toKey.value as Record<string, number>)[prop];
            }
            return (toValue - fromValue) / frameDelta;
        };

        // Helper to get all component properties for a data type
        const getAllComponentProperties = (dataType: number): string[] => {
            if (dataType === AnimationEnum.ANIMATIONTYPE_FLOAT) {
                return [];
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_VECTOR2) {
                return ["x", "y"];
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_VECTOR3) {
                return ["x", "y", "z"];
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_COLOR3) {
                return ["r", "g", "b"];
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_COLOR4) {
                return ["r", "g", "b", "a"];
            } else if (dataType === AnimationEnum.ANIMATIONTYPE_QUATERNION) {
                return ["x", "y", "z", "w"];
            }
            return [];
        };

        // Helper to ensure adjacent tangent exists for bezier interpolation to work
        // Babylon requires BOTH outTangent on startKey AND inTangent on endKey
        // When creating a new tangent, initialize ALL components with default slopes (like v1 does)
        const ensureAdjacentTangent = (keys: IAnimationKey[], keyId: number, tangentType: "inTangent" | "outTangent", dataType: number, _component: number) => {
            if (tangentType === "inTangent" && keyId > 0) {
                // We set inTangent on keyId, so ensure keyId-1 has outTangent
                const prevKey = keys[keyId - 1];
                if (prevKey.outTangent === undefined || prevKey.outTangent === null) {
                    // Create tangent object and initialize ALL components with default slopes
                    const allProps = getAllComponentProperties(dataType);
                    if (allProps.length === 0) {
                        // Float type
                        const slope = calculateDefaultSlope(keys, keyId - 1, keyId, dataType, 0);
                        prevKey.outTangent = slope;
                    } else {
                        // Compound type - set all components
                        prevKey.outTangent = createTangentObject(dataType);
                        for (let i = 0; i < allProps.length; i++) {
                            const slope = calculateDefaultSlope(keys, keyId - 1, keyId, dataType, i);
                            (prevKey.outTangent as Record<string, number>)[allProps[i]] = slope;
                        }
                    }
                }
            } else if (tangentType === "outTangent" && keyId < keys.length - 1) {
                // We set outTangent on keyId, so ensure keyId+1 has inTangent
                const nextKey = keys[keyId + 1];
                if (nextKey.inTangent === undefined || nextKey.inTangent === null) {
                    // Create tangent object and initialize ALL components with default slopes
                    const allProps = getAllComponentProperties(dataType);
                    if (allProps.length === 0) {
                        // Float type
                        const slope = calculateDefaultSlope(keys, keyId, keyId + 1, dataType, 0);
                        nextKey.inTangent = slope;
                    } else {
                        // Compound type - set all components
                        nextKey.inTangent = createTangentObject(dataType);
                        for (let i = 0; i < allProps.length; i++) {
                            const slope = calculateDefaultSlope(keys, keyId, keyId + 1, dataType, i);
                            (nextKey.inTangent as Record<string, number>)[allProps[i]] = slope;
                        }
                    }
                }
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
                const dataType = animation.dataType;
                const component = getComponentFromProperty(dataType, keyPoint.curve.property);

                if (keyId >= 0 && keyId < keys.length) {
                    const key = keys[keyId];
                    // Set interpolation to NONE (bezier)
                    key.interpolation = undefined;
                    // Set tangents to 0 (flat/horizontal)
                    if (keyId > 0) {
                        setTangentComponent(key, "inTangent", dataType, component, 0);
                        // Ensure previous key has outTangent for bezier to work
                        ensureAdjacentTangent(keys, keyId, "inTangent", dataType, component);
                    }
                    if (keyId < keys.length - 1) {
                        setTangentComponent(key, "outTangent", dataType, component, 0);
                        // Ensure next key has inTangent for bezier to work
                        ensureAdjacentTangent(keys, keyId, "outTangent", dataType, component);
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
                const dataType = animation.dataType;
                const component = getComponentFromProperty(dataType, keyPoint.curve.property);
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
                            // Ensure previous key has outTangent for bezier to work
                            ensureAdjacentTangent(keys, keyId, "inTangent", dataType, component);
                        }
                    }
                    if (keyId < keys.length - 1) {
                        const nextKey = keys[keyId + 1];
                        const frameDiff = nextKey.frame - key.frame;
                        if (frameDiff !== 0) {
                            const slope = (getKeyValue(nextKey) - getKeyValue(key)) / frameDiff;
                            setTangentComponent(key, "outTangent", dataType, component, slope);
                            // Ensure next key has inTangent for bezier to work
                            ensureAdjacentTangent(keys, keyId, "outTangent", dataType, component);
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

    // Get curves from active animations - creates SharedCurve instances like v1
    const curves = useMemo((): SharedCurve[] => {
        const result: SharedCurve[] = [];

        // Helper to set default tangents across all curves (like v1)
        const setDefaultInTangent = (keyId: number) => {
            for (const curve of result) {
                curve.storeDefaultInTangent(keyId);
            }
        };
        const setDefaultOutTangent = (keyId: number) => {
            for (const curve of result) {
                curve.storeDefaultOutTangent(keyId);
            }
        };

        for (const animation of state.activeAnimations) {
            const keys = animation.getKeys();
            if (keys.length === 0) {
                continue;
            }

            const channelColor = state.activeChannels[animation.uniqueId];
            const curvesToAdd: SharedCurve[] = [];

            // Create curves based on data type (like v1's _evaluateKeys)
            switch (animation.dataType) {
                case AnimationEnum.ANIMATIONTYPE_FLOAT:
                    curvesToAdd.push(new SharedCurve(channelColor || DefaultCurveColor, animation));
                    break;
                case AnimationEnum.ANIMATIONTYPE_VECTOR2:
                    if (!channelColor || channelColor === ChannelColors.X) {
                        curvesToAdd.push(new SharedCurve(ChannelColors.X, animation, "x", () => Vector2.Zero(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ChannelColors.Y) {
                        curvesToAdd.push(new SharedCurve(ChannelColors.Y, animation, "y", () => Vector2.Zero(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    break;
                case AnimationEnum.ANIMATIONTYPE_VECTOR3:
                    if (!channelColor || channelColor === ChannelColors.X) {
                        curvesToAdd.push(new SharedCurve(ChannelColors.X, animation, "x", () => Vector3.Zero(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ChannelColors.Y) {
                        curvesToAdd.push(new SharedCurve(ChannelColors.Y, animation, "y", () => Vector3.Zero(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ChannelColors.Z) {
                        curvesToAdd.push(new SharedCurve(ChannelColors.Z, animation, "z", () => Vector3.Zero(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    break;
                case AnimationEnum.ANIMATIONTYPE_COLOR3:
                    if (!channelColor || channelColor === ColorChannelColors.R) {
                        curvesToAdd.push(new SharedCurve(ColorChannelColors.R, animation, "r", () => Color3.Black(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ColorChannelColors.G) {
                        curvesToAdd.push(new SharedCurve(ColorChannelColors.G, animation, "g", () => Color3.Black(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ColorChannelColors.B) {
                        curvesToAdd.push(new SharedCurve(ColorChannelColors.B, animation, "b", () => Color3.Black(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    break;
                case AnimationEnum.ANIMATIONTYPE_COLOR4:
                    if (!channelColor || channelColor === ColorChannelColors.R) {
                        curvesToAdd.push(new SharedCurve(ColorChannelColors.R, animation, "r", () => new Color4(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ColorChannelColors.G) {
                        curvesToAdd.push(new SharedCurve(ColorChannelColors.G, animation, "g", () => new Color4(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ColorChannelColors.B) {
                        curvesToAdd.push(new SharedCurve(ColorChannelColors.B, animation, "b", () => new Color4(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ColorChannelColors.A) {
                        curvesToAdd.push(new SharedCurve(ColorChannelColors.A, animation, "a", () => new Color4(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    break;
                case AnimationEnum.ANIMATIONTYPE_QUATERNION:
                    if (!channelColor || channelColor === ChannelColors.X) {
                        curvesToAdd.push(new SharedCurve(ChannelColors.X, animation, "x", () => new Quaternion(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ChannelColors.Y) {
                        curvesToAdd.push(new SharedCurve(ChannelColors.Y, animation, "y", () => new Quaternion(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ChannelColors.Z) {
                        curvesToAdd.push(new SharedCurve(ChannelColors.Z, animation, "z", () => new Quaternion(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ChannelColors.W) {
                        curvesToAdd.push(new SharedCurve(ChannelColors.W, animation, "w", () => new Quaternion(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    break;
            }

            // Populate keys for each curve (like v1's _extractValuesFromKeys)
            for (const key of keys) {
                const lockedTangent = key.lockedTangent ?? true;

                for (const curve of curvesToAdd) {
                    const prop = curve.property;
                    const value = prop ? (key.value as Record<string, number>)[prop] : (key.value as number);
                    const inTangent = prop ? key.inTangent?.[prop] : (key.inTangent as number | undefined);
                    const outTangent = prop ? key.outTangent?.[prop] : (key.outTangent as number | undefined);

                    curve.keys.push({
                        frame: key.frame,
                        value,
                        inTangent,
                        outTangent,
                        lockedTangent,
                        interpolation: key.interpolation,
                    });
                }
            }

            result.push(...curvesToAdd);
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

    // Note: Key frame/value changes are now handled directly via curve.updateKeyFrame/updateKeyValue
    // in the KeyPoint component

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
                    const curveId = `${curve.animation.uniqueId}-${curve.property || "value"}`;
                    return <Curve key={curveId} curve={curve} convertX={frameToX} convertY={valueToY} />;
                })}

                {/* Render key points separately - like v1 does with KeyPointComponent */}
                {curves.map((curve) => {
                    const curveId = `${curve.animation.uniqueId}-${curve.property || "value"}`;

                    return curve.keys.map((key, keyIndex) => {
                        const x = frameToX(key.frame);
                        const y = valueToY(key.value);
                        if (!Number.isFinite(x) || !Number.isFinite(y)) {
                            return null;
                        }

                        return (
                            <KeyPointComponent
                                key={`${curveId}-key-${keyIndex}`}
                                x={x}
                                y={y}
                                getPreviousX={() => (keyIndex > 0 ? frameToX(curve.keys[keyIndex - 1].frame) : null)}
                                getNextX={() => (keyIndex < curve.keys.length - 1 ? frameToX(curve.keys[keyIndex + 1].frame) : null)}
                                invertX={xToFrame}
                                invertY={yToValue}
                                convertX={frameToX}
                                convertY={valueToY}
                                scale={scale}
                                keyId={keyIndex}
                                curve={curve}
                                channel={curve.color}
                                onFrameValueChanged={(frame: number) => {
                                    curve.updateKeyFrame(keyIndex, frame);
                                    observables.onFrameSet.notifyObservers(frame);
                                    observables.onActiveAnimationChanged.notifyObservers({});
                                }}
                                onKeyValueChanged={(value: number) => {
                                    curve.updateKeyValue(keyIndex, value);
                                    observables.onValueSet.notifyObservers(value);
                                    observables.onActiveAnimationChanged.notifyObservers({});
                                }}
                            />
                        );
                    });
                })}

                {renderValueAxis()}
            </svg>
        </div>
    );
};
