import type { FunctionComponent } from "react";
import type { Animation } from "core/Animations/animation";

import { useCallback, useRef, useState } from "react";
import { AnimationKeyInterpolation } from "core/Animations/animationKey";
import { GraphColors } from "../curveEditorColors";

export type CurveKeyData = {
    /** Frame number */
    frame: number;
    /** Value at this frame */
    value: number;
    /** In tangent (slope coming into this key) */
    inTangent?: number;
    /** Out tangent (slope going out of this key) */
    outTangent?: number;
    /** Interpolation mode */
    interpolation?: AnimationKeyInterpolation;
};

export type CurveData = {
    /** The animation */
    animation: Animation;
    /** Color for this curve */
    color: string;
    /** Component index (0=x, 1=y, 2=z, etc.) */
    component: number;
    /** Key data points */
    keys: CurveKeyData[];
};

type CurveProps = {
    curve: CurveData;
    frameToX: (frame: number) => number;
    valueToY: (value: number) => number;
    xToFrame: (x: number) => number;
    yToValue: (y: number) => number;
    onKeyFrameChanged: (animation: Animation, keyIndex: number, component: number, newFrame: number) => void;
    onKeyValueChanged: (animation: Animation, keyIndex: number, component: number, newValue: number) => void;
    selectedKeyIndex: number | null;
    onKeySelected: (keyIndex: number | null) => void;
};

type DragState = {
    isDragging: boolean;
    keyIndex: number;
    startX: number;
    startY: number;
    startFrame: number;
    startValue: number;
    /** The pixel X position of the key when drag started */
    startKeyPixelX: number;
    /** The pixel Y position of the key when drag started */
    startKeyPixelY: number;
    currentFrame: number;
    currentValue: number;
};

/**
 * Single curve rendering component
 * @returns The curve SVG group
 */
export const Curve: FunctionComponent<CurveProps> = ({ curve, frameToX, valueToY, xToFrame, yToValue, onKeyFrameChanged, onKeyValueChanged, selectedKeyIndex, onKeySelected }) => {
    const [, forceUpdate] = useState(0);

    // Use ref to store drag state - this avoids stale closures in event handlers
    const dragStateRef = useRef<DragState>({
        isDragging: false,
        keyIndex: -1,
        startX: 0,
        startY: 0,
        startFrame: 0,
        startValue: 0,
        startKeyPixelX: 0,
        startKeyPixelY: 0,
        currentFrame: 0,
        currentValue: 0,
    });

    // Store stable references for callbacks to avoid stale closures during drag
    const curveRef = useRef(curve);
    curveRef.current = curve;
    const callbacksRef = useRef({ onKeyFrameChanged, onKeyValueChanged, frameToX, valueToY, xToFrame, yToValue });
    callbacksRef.current = { onKeyFrameChanged, onKeyValueChanged, frameToX, valueToY, xToFrame, yToValue };

    // Store the original key bounds when drag starts to avoid issues with changing data
    const dragBoundsRef = useRef<{ prevFrame: number | null; nextFrame: number | null }>({ prevFrame: null, nextFrame: null });

    // Force update ref for triggering re-renders from event handlers
    const forceUpdateRef = useRef(() => forceUpdate((c) => c + 1));
    forceUpdateRef.current = () => forceUpdate((c) => c + 1);

    // Sample rate for bezier curves
    const sampleRate = 10;

    // Property names for each component
    const componentProperties = ["x", "y", "z", "w"];

    // Generate path data for the curve
    const generatePath = () => {
        if (curve.keys.length < 2) {
            return "";
        }

        const currentDragState = dragStateRef.current;

        // Create a working copy of keys, applying dragged position if dragging
        const workingKeys = curve.keys.map((k, i) => {
            if (currentDragState.isDragging && currentDragState.keyIndex === i) {
                return { ...k, frame: currentDragState.currentFrame, value: currentDragState.currentValue };
            }
            return k;
        });

        // Filter out any keys with invalid data
        const validKeys = workingKeys.filter((k) => Number.isFinite(k.frame) && Number.isFinite(k.value));
        if (validKeys.length < 2) {
            return "";
        }

        const startX = frameToX(validKeys[0].frame);
        const startY = valueToY(validKeys[0].value);
        if (!Number.isFinite(startX) || !Number.isFinite(startY)) {
            return "";
        }

        let path = `M ${startX} ${startY}`;

        const animation = curve.animation;
        const property = componentProperties[curve.component];

        for (let i = 1; i < validKeys.length; i++) {
            const prevKey = validKeys[i - 1];
            const currentKey = validKeys[i];

            const x2 = frameToX(currentKey.frame);
            const y2 = valueToY(currentKey.value);

            // Skip if coordinates are invalid
            if (!Number.isFinite(x2) || !Number.isFinite(y2)) {
                continue;
            }

            // Check for step interpolation
            if (prevKey.interpolation === AnimationKeyInterpolation.STEP) {
                // Step: horizontal then vertical
                const y1 = valueToY(prevKey.value);
                path += ` L ${x2} ${y1} L ${x2} ${y2}`;
                continue;
            }

            const prevFrame = prevKey.frame;
            const currentFrame = currentKey.frame;
            const frameDist = currentFrame - prevFrame;

            // Check if we have tangents - if so, sample the bezier curve
            const outTangent = prevKey.outTangent;
            const inTangent = currentKey.inTangent;

            if (outTangent === undefined && inTangent === undefined) {
                // No tangents - draw a straight line
                path += ` L ${x2} ${y2}`;
            } else {
                // Sample the curve using animation.evaluate
                for (let frame = prevFrame; frame < currentFrame; frame += frameDist / sampleRate) {
                    const keyValue = animation.evaluate(frame);
                    const value = property && typeof keyValue === "object" && keyValue !== null ? keyValue[property] : keyValue;
                    if (Number.isFinite(value)) {
                        path += ` L ${frameToX(frame)} ${valueToY(value)}`;
                    }
                }
                path += ` L ${x2} ${y2}`;
            }
        }

        return path;
    };

    // Handle pointer down on a key point
    const handleKeyPointerDown = useCallback(
        (e: React.PointerEvent, keyIndex: number, key: CurveKeyData) => {
            e.preventDefault();
            e.stopPropagation();

            // Select the key point
            onKeySelected(keyIndex);

            // Store bounds at drag start to avoid issues with changing data
            const prevKey = keyIndex > 0 ? curve.keys[keyIndex - 1] : null;
            const nextKey = keyIndex < curve.keys.length - 1 ? curve.keys[keyIndex + 1] : null;
            dragBoundsRef.current = {
                prevFrame: prevKey?.frame ?? null,
                nextFrame: nextKey?.frame ?? null,
            };

            // Store the key's current pixel position at drag start
            // This ensures we track relative movement correctly even if conversion functions change
            const keyPixelX = frameToX(key.frame);
            const keyPixelY = valueToY(key.value);

            dragStateRef.current = {
                isDragging: true,
                keyIndex,
                startX: e.clientX,
                startY: e.clientY,
                startFrame: key.frame,
                startValue: key.value,
                startKeyPixelX: keyPixelX,
                startKeyPixelY: keyPixelY,
                currentFrame: key.frame,
                currentValue: key.value,
            };

            // Capture pointer on the target element
            (e.target as Element).setPointerCapture(e.pointerId);
            forceUpdateRef.current();
        },
        [onKeySelected, curve.keys, frameToX, valueToY]
    );

    // Handle pointer move on key point
    const handleKeyPointerMove = useCallback((e: React.PointerEvent) => {
        const currentDragState = dragStateRef.current;
        if (!currentDragState.isDragging) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();

        const { xToFrame, yToValue, onKeyFrameChanged, onKeyValueChanged } = callbacksRef.current;

        const dx = e.clientX - currentDragState.startX;
        const dy = e.clientY - currentDragState.startY;

        // Use the stored pixel position from drag start + delta
        // This avoids issues where frameToX/valueToY might return different values
        // due to scale/offset changes during drag
        const currentX = currentDragState.startKeyPixelX + dx;
        const currentY = currentDragState.startKeyPixelY + dy;

        const newFrame = xToFrame(currentX);
        const newValue = yToValue(currentY);

        const keyIndex = currentDragState.keyIndex;

        // Use stored bounds from drag start
        const { prevFrame, nextFrame } = dragBoundsRef.current;

        // Constrain frame to stay between adjacent keys
        let constrainedFrame = newFrame;
        if (prevFrame !== null) {
            constrainedFrame = Math.max(prevFrame + 0.01, constrainedFrame);
        }
        if (nextFrame !== null) {
            constrainedFrame = Math.min(nextFrame - 0.01, constrainedFrame);
        }

        // Don't allow moving the first key's frame
        if (keyIndex === 0) {
            constrainedFrame = currentDragState.startFrame;
        }

        // Update drag state ref
        dragStateRef.current = {
            ...currentDragState,
            currentFrame: constrainedFrame,
            currentValue: newValue,
        };

        // Update the actual animation keys in real-time so bezier curves render correctly
        const currentCurve = curveRef.current;
        onKeyFrameChanged(currentCurve.animation, keyIndex, currentCurve.component, constrainedFrame);
        onKeyValueChanged(currentCurve.animation, keyIndex, currentCurve.component, newValue);

        // Trigger re-render to update the curve path
        forceUpdateRef.current();
    }, []);

    // Handle pointer up on key point
    const handleKeyPointerUp = useCallback((e: React.PointerEvent) => {
        const currentDragState = dragStateRef.current;
        if (currentDragState.isDragging) {
            e.preventDefault();
            e.stopPropagation();

            const { onKeyFrameChanged, onKeyValueChanged } = callbacksRef.current;
            const currentCurve = curveRef.current;

            // Commit the final position to the animation
            onKeyFrameChanged(currentCurve.animation, currentDragState.keyIndex, currentCurve.component, currentDragState.currentFrame);
            onKeyValueChanged(currentCurve.animation, currentDragState.keyIndex, currentCurve.component, currentDragState.currentValue);

            dragStateRef.current = {
                isDragging: false,
                keyIndex: -1,
                startX: 0,
                startY: 0,
                startFrame: 0,
                startValue: 0,
                startKeyPixelX: 0,
                startKeyPixelY: 0,
                currentFrame: 0,
                currentValue: 0,
            };

            // Release pointer capture
            (e.target as Element).releasePointerCapture(e.pointerId);
            forceUpdateRef.current();
        }
    }, []);

    // Calculate tangent control point positions using v1 logic
    // In v1, tangents are slopes: inTangent/outTangent represent dy/dx in data space
    // The control point is at (frame ± 1, value ∓ tangent) in data space
    const getTangentControlPoints = useCallback(
        (keyIndex: number) => {
            const key = curve.keys[keyIndex];
            const currentDragState = dragStateRef.current;

            // Use dragged position if this key is being dragged
            const isBeingDragged = currentDragState.isDragging && currentDragState.keyIndex === keyIndex;
            const keyFrame = isBeingDragged ? currentDragState.currentFrame : key.frame;
            const keyValue = isBeingDragged ? currentDragState.currentValue : key.value;

            const x = frameToX(keyFrame);
            const y = valueToY(keyValue);
            const tangentLength = 100; // pixels (matches v1 scale factor)

            const hasIn = keyIndex > 0;
            const hasOut = keyIndex < curve.keys.length - 1;

            // Calculate in tangent (left side)
            let inX = x;
            let inY = y;
            if (hasIn) {
                // Get inTangent value, or calculate from adjacent keys if undefined
                let inTangent = key.inTangent;
                if (inTangent === undefined) {
                    // Evaluate default tangent from adjacent keys (like v1's evaluateInTangent)
                    const prevKey = curve.keys[keyIndex - 1];
                    const frameDelta = keyFrame - prevKey.frame;
                    if (frameDelta !== 0) {
                        inTangent = (keyValue - prevKey.value) / frameDelta;
                    } else {
                        inTangent = 0;
                    }
                }

                // In v1: control point is at (frame - 1, value - inTangent) in data space
                // Then converted to screen space and used to create a direction vector
                const controlPointFrame = keyFrame - 1;
                const controlPointValue = keyValue - inTangent;
                const ctrlX = frameToX(controlPointFrame);
                const ctrlY = valueToY(controlPointValue);

                // Create direction vector from key to control point
                const dx = ctrlX - x;
                const dy = ctrlY - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    // Normalize and scale
                    inX = x + (dx / dist) * tangentLength;
                    inY = y + (dy / dist) * tangentLength;
                }
            }

            // Calculate out tangent (right side)
            let outX = x;
            let outY = y;
            if (hasOut) {
                // Get outTangent value, or calculate from adjacent keys if undefined
                let outTangent = key.outTangent;
                if (outTangent === undefined) {
                    // Evaluate default tangent from adjacent keys (like v1's evaluateOutTangent)
                    const nextKey = curve.keys[keyIndex + 1];
                    const frameDelta = nextKey.frame - keyFrame;
                    if (frameDelta !== 0) {
                        outTangent = (nextKey.value - keyValue) / frameDelta;
                    } else {
                        outTangent = 0;
                    }
                }

                // In v1: control point is at (frame + 1, value + outTangent) in data space
                // Then converted to screen space and used to create a direction vector
                const controlPointFrame = keyFrame + 1;
                const controlPointValue = keyValue + outTangent;
                const ctrlX = frameToX(controlPointFrame);
                const ctrlY = valueToY(controlPointValue);

                // Create direction vector from key to control point
                const dx = ctrlX - x;
                const dy = ctrlY - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 0) {
                    // Normalize and scale
                    outX = x + (dx / dist) * tangentLength;
                    outY = y + (dy / dist) * tangentLength;
                }
            }

            return { x, y, inX, inY, outX, outY, hasIn, hasOut };
        },
        [curve.keys, frameToX, valueToY]
    );

    // Render key points
    const renderKeyPoints = useCallback(() => {
        const elements: JSX.Element[] = [];
        const currentDragState = dragStateRef.current;

        curve.keys
            .filter((key) => Number.isFinite(key.frame) && Number.isFinite(key.value))
            .forEach((key, index) => {
                // Use dragged position if this key is being dragged
                const isBeingDragged = currentDragState.isDragging && currentDragState.keyIndex === index;
                const displayFrame = isBeingDragged ? currentDragState.currentFrame : key.frame;
                const displayValue = isBeingDragged ? currentDragState.currentValue : key.value;

                const x = frameToX(displayFrame);
                const y = valueToY(displayValue);

                // Skip if coordinates are invalid
                if (!Number.isFinite(x) || !Number.isFinite(y)) {
                    return;
                }

                const isSelected = selectedKeyIndex === index;
                const size = 6;

                // If selected, show tangent lines
                if (isSelected) {
                    const tangentResult = getTangentControlPoints(index);

                    // Draw tangent lines - in tangent (left)
                    if (tangentResult.hasIn) {
                        elements.push(
                            <line
                                key={`tangent-in-line-${index}`}
                                x1={tangentResult.x}
                                y1={tangentResult.y}
                                x2={tangentResult.inX}
                                y2={tangentResult.inY}
                                stroke={GraphColors.tangentHandle}
                                strokeWidth={2}
                            />
                        );
                        elements.push(
                            <circle
                                key={`tangent-in-${index}`}
                                cx={tangentResult.inX}
                                cy={tangentResult.inY}
                                r={5}
                                fill={GraphColors.tangentHandle}
                                stroke={GraphColors.keypointStroke}
                                strokeWidth={1}
                                style={{ cursor: "pointer" }}
                            />
                        );
                    }
                    // Out tangent (right)
                    if (tangentResult.hasOut) {
                        elements.push(
                            <line
                                key={`tangent-out-line-${index}`}
                                x1={tangentResult.x}
                                y1={tangentResult.y}
                                x2={tangentResult.outX}
                                y2={tangentResult.outY}
                                stroke={GraphColors.tangentHandle}
                                strokeWidth={2}
                            />
                        );
                        elements.push(
                            <circle
                                key={`tangent-out-${index}`}
                                cx={tangentResult.outX}
                                cy={tangentResult.outY}
                                r={5}
                                fill={GraphColors.tangentHandle}
                                stroke={GraphColors.keypointStroke}
                                strokeWidth={1}
                                style={{ cursor: "pointer" }}
                            />
                        );
                    }
                }

                // Diamond points: top, right, bottom, left
                const points = `${x},${y - size} ${x + size},${y} ${x},${y + size} ${x - size},${y}`;

                elements.push(
                    <polygon
                        key={`key-${index}`}
                        points={points}
                        fill={isBeingDragged || isSelected ? GraphColors.keypointStroke : curve.color}
                        stroke={isSelected ? GraphColors.selectedKeypoint : GraphColors.keypointStroke}
                        strokeWidth={isSelected ? 2 : 1}
                        style={{ cursor: "pointer" }}
                        onPointerDown={(e) => handleKeyPointerDown(e, index, key)}
                        onPointerMove={handleKeyPointerMove}
                        onPointerUp={handleKeyPointerUp}
                    />
                );
            });

        return elements;
    }, [curve, frameToX, valueToY, selectedKeyIndex, handleKeyPointerDown, handleKeyPointerMove, handleKeyPointerUp, getTangentControlPoints]);

    return (
        <g>
            <path d={generatePath()} fill="none" stroke={curve.color} strokeWidth={2} />

            {renderKeyPoints()}
        </g>
    );
};
