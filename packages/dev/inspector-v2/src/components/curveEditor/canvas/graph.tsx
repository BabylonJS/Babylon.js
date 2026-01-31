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
import { CurveData } from "./curveData";
import { Curve } from "./curve";
import { KeyPointComponent } from "./keyPoint";
import { ChannelColors, ColorChannelColors, DefaultCurveColor } from "../curveEditorColors";

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
        stroke: tokens.colorNeutralStroke1,
        strokeWidth: "1px",
    },
    selectionRect: {
        fill: "rgba(255, 255, 255, 0.1)",
        stroke: tokens.colorNeutralForeground1,
        strokeWidth: "1px",
        strokeDasharray: "4 4",
    },
    valueAxisLabel: {
        fill: tokens.colorNeutralForeground3,
        fontSize: "10px",
        fontFamily: "acumin-pro-condensed, sans-serif",
        userSelect: "none",
    },
    valueAxisBackground: {
        fill: tokens.colorNeutralBackground1,
    },
    activeRangeOverlay: {
        position: "absolute" as const,
        top: 0,
        height: "100%",
        backgroundColor: tokens.colorBrandBackground2,
        opacity: 0.3,
        pointerEvents: "none" as const,
    },
    inactiveRangeOverlay: {
        position: "absolute" as const,
        top: 0,
        height: "100%",
        backgroundColor: tokens.colorNeutralBackgroundStatic,
        opacity: 0.6,
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

    // Re-render when active animation or range changes
    // useCallback stabilizes the accessor to prevent infinite re-render loops
    useObservableState(
        useCallback(() => ({}), []),
        observables.onActiveAnimationChanged,
        observables.onRangeUpdated
    );

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

        // Note: Tangent operations (flatten, linear, break, unify, step) are handled by KeyPointComponent
        // Each selected keypoint subscribes to the observables and handles its own tangent updates (like v1)

        return () => {
            observables.onCreateOrUpdateKeyPointRequired.remove(onCreateOrUpdateKeyPointRequired);
            observables.onFrameRequired.remove(onFrameRequired);
            observables.onDeleteKeyActiveKeyPoints.remove(onDeleteKeyActiveKeyPoints);
        };
    }, [observables, state.activeAnimations, state.activeFrame, state.activeKeyPoints, actions]);

    const curves = useMemo((): CurveData[] => {
        const result: CurveData[] = [];

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
            const curvesToAdd: CurveData[] = [];

            // Create curves based on data type (like v1's _evaluateKeys)
            switch (animation.dataType) {
                case AnimationEnum.ANIMATIONTYPE_FLOAT:
                    curvesToAdd.push(new CurveData(channelColor || DefaultCurveColor, animation));
                    break;
                case AnimationEnum.ANIMATIONTYPE_VECTOR2:
                    if (!channelColor || channelColor === ChannelColors.X) {
                        curvesToAdd.push(new CurveData(ChannelColors.X, animation, "x", () => Vector2.Zero(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ChannelColors.Y) {
                        curvesToAdd.push(new CurveData(ChannelColors.Y, animation, "y", () => Vector2.Zero(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    break;
                case AnimationEnum.ANIMATIONTYPE_VECTOR3:
                    if (!channelColor || channelColor === ChannelColors.X) {
                        curvesToAdd.push(new CurveData(ChannelColors.X, animation, "x", () => Vector3.Zero(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ChannelColors.Y) {
                        curvesToAdd.push(new CurveData(ChannelColors.Y, animation, "y", () => Vector3.Zero(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ChannelColors.Z) {
                        curvesToAdd.push(new CurveData(ChannelColors.Z, animation, "z", () => Vector3.Zero(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    break;
                case AnimationEnum.ANIMATIONTYPE_COLOR3:
                    if (!channelColor || channelColor === ColorChannelColors.R) {
                        curvesToAdd.push(new CurveData(ColorChannelColors.R, animation, "r", () => Color3.Black(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ColorChannelColors.G) {
                        curvesToAdd.push(new CurveData(ColorChannelColors.G, animation, "g", () => Color3.Black(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ColorChannelColors.B) {
                        curvesToAdd.push(new CurveData(ColorChannelColors.B, animation, "b", () => Color3.Black(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    break;
                case AnimationEnum.ANIMATIONTYPE_COLOR4:
                    if (!channelColor || channelColor === ColorChannelColors.R) {
                        curvesToAdd.push(new CurveData(ColorChannelColors.R, animation, "r", () => new Color4(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ColorChannelColors.G) {
                        curvesToAdd.push(new CurveData(ColorChannelColors.G, animation, "g", () => new Color4(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ColorChannelColors.B) {
                        curvesToAdd.push(new CurveData(ColorChannelColors.B, animation, "b", () => new Color4(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ColorChannelColors.A) {
                        curvesToAdd.push(new CurveData(ColorChannelColors.A, animation, "a", () => new Color4(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    break;
                case AnimationEnum.ANIMATIONTYPE_QUATERNION:
                    if (!channelColor || channelColor === ChannelColors.X) {
                        curvesToAdd.push(new CurveData(ChannelColors.X, animation, "x", () => new Quaternion(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ChannelColors.Y) {
                        curvesToAdd.push(new CurveData(ChannelColors.Y, animation, "y", () => new Quaternion(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ChannelColors.Z) {
                        curvesToAdd.push(new CurveData(ChannelColors.Z, animation, "z", () => new Quaternion(), setDefaultInTangent, setDefaultOutTangent));
                    }
                    if (!channelColor || channelColor === ChannelColors.W) {
                        curvesToAdd.push(new CurveData(ChannelColors.W, animation, "w", () => new Quaternion(), setDefaultInTangent, setDefaultOutTangent));
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
    }, [state.activeAnimations, state.activeChannels]);

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

    // Calculate inactive (outside range) overlay positions
    const leftInactiveWidth = Math.max(0, activeRangeLeft - graphOffsetX);
    const rightInactiveLeft = Math.min(activeRangeRight, safeWidth);
    const rightInactiveWidth = Math.max(0, safeWidth - rightInactiveLeft);

    return (
        <div className={styles.root}>
            {/* Inactive range overlays (dark areas outside playback range) */}
            {state.activeAnimations.length > 0 && leftInactiveWidth > 0 && (
                <div
                    className={styles.inactiveRangeOverlay}
                    style={{
                        left: graphOffsetX,
                        width: leftInactiveWidth,
                    }}
                />
            )}
            {state.activeAnimations.length > 0 && rightInactiveWidth > 0 && (
                <div
                    className={styles.inactiveRangeOverlay}
                    style={{
                        left: rightInactiveLeft,
                        width: rightInactiveWidth,
                    }}
                />
            )}
            {/* Active range overlay (highlight showing playback range) */}
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
                                    actions.refreshTarget();
                                }}
                                onKeyValueChanged={(value: number) => {
                                    curve.updateKeyValue(keyIndex, value);
                                    actions.refreshTarget();
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
