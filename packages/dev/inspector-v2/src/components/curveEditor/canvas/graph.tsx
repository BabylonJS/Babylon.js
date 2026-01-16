import type { FunctionComponent } from "react";
import type { Animation } from "core/Animations/animation";

import { makeStyles, tokens } from "@fluentui/react-components";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animation as AnimationEnum } from "core/Animations/animation";

import { useCurveEditor } from "../curveEditorContext";
import { Curve, type CurveData } from "./curve";

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
        stroke: "#666666",
        strokeWidth: "1px",
    },
    selectionRect: {
        fill: "rgba(255, 255, 255, 0.1)",
        stroke: "#ffffff",
        strokeWidth: "1px",
        strokeDasharray: "4 4",
    },
    valueAxisLabel: {
        fill: "#555555",
        fontSize: "10px",
        fontFamily: "acumin-pro-condensed, sans-serif",
        userSelect: "none",
    },
    valueAxisBackground: {
        fill: "#111111",
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
    const [updateCounter, forceUpdate] = useState(0);
    const [selectedKey, setSelectedKey] = useState<{ curveId: string; keyIndex: number } | null>(null);

    // Ensure dimensions are valid
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);

    const graphOffsetX = 30;
    const viewWidth = safeWidth - graphOffsetX;

    // Subscribe to animation changes to force re-render
    useEffect(() => {
        const onActiveAnimationChanged = observables.onActiveAnimationChanged.add(() => {
            forceUpdate((c) => c + 1);
        });

        const onRangeUpdated = observables.onRangeUpdated.add(() => {
            forceUpdate((c) => c + 1);
        });

        return () => {
            observables.onActiveAnimationChanged.remove(onActiveAnimationChanged);
            observables.onRangeUpdated.remove(onRangeUpdated);
        };
    }, [observables]);

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
                    color: color || "#ffffff",
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
                if (!color || color === "#DB3E3E") {
                    result.push({
                        animation,
                        color: "#DB3E3E",
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
                if (!color || color === "#51E22D") {
                    result.push({
                        animation,
                        color: "#51E22D",
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
                if (!color || color === "#DB3E3E") {
                    result.push({
                        animation,
                        color: "#DB3E3E",
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
                if (!color || color === "#51E22D") {
                    result.push({
                        animation,
                        color: "#51E22D",
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
                if (!color || color === "#00A3FF") {
                    result.push({
                        animation,
                        color: "#00A3FF",
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
                if (!color || color === "#DB3E3E") {
                    result.push({
                        animation,
                        color: "#DB3E3E",
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
                if (!color || color === "#51E22D") {
                    result.push({
                        animation,
                        color: "#51E22D",
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
                if (!color || color === "#00A3FF") {
                    result.push({
                        animation,
                        color: "#00A3FF",
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
                if (!color || color === "#DB3E3E") {
                    result.push({
                        animation,
                        color: "#DB3E3E",
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
                if (!color || color === "#51E22D") {
                    result.push({
                        animation,
                        color: "#51E22D",
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
                if (!color || color === "#00A3FF") {
                    result.push({
                        animation,
                        color: "#00A3FF",
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
                if (!color || color === "#FFFFFF") {
                    result.push({
                        animation,
                        color: "#FFFFFF",
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
                if (!color || color === "#DB3E3E") {
                    result.push({
                        animation,
                        color: "#DB3E3E",
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
                if (!color || color === "#51E22D") {
                    result.push({
                        animation,
                        color: "#51E22D",
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
                if (!color || color === "#00A3FF") {
                    result.push({
                        animation,
                        color: "#00A3FF",
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
                if (!color || color === "#8700FF") {
                    result.push({
                        animation,
                        color: "#8700FF",
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
    }, [state.activeAnimations, state.activeChannels, updateCounter]);

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

    // Convert frame to x position
    const frameToX = useCallback(
        (frame: number) => {
            const { fromKey, toKey } = state;
            const range = toKey - fromKey;
            if (range <= 0) {
                return graphOffsetX;
            }
            return graphOffsetX + ((frame - fromKey) / range) * viewWidth * scale + offsetX;
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

    // Convert x position to frame
    const xToFrame = useCallback(
        (x: number) => {
            const { fromKey, toKey } = state;
            const range = toKey - fromKey;
            if (range <= 0) {
                return fromKey;
            }
            return fromKey + ((x - graphOffsetX - offsetX) / (viewWidth * scale)) * range;
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
                forceUpdate((c) => c + 1);
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

                forceUpdate((c) => c + 1);
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

        // Vertical grid lines (frame)
        const { fromKey, toKey } = state;
        const frameRange = toKey - fromKey;
        const frameStep = calculateNiceStep(frameRange, 10);
        const startFrame = Math.ceil(fromKey / frameStep) * frameStep;

        for (let frame = startFrame; frame <= toKey; frame += frameStep) {
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

    return (
        <div className={styles.root}>
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
                {/* Grid */}
                {renderGrid()}

                {/* Curves */}
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

                {/* Value Axis - rendered last to be on top */}
                {renderValueAxis()}
            </svg>
        </div>
    );
};
