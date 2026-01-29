/**
 * KeyPointComponent for v2 curve editor - functional component version
 * This component renders individual key points on the curve editor canvas.
 * Includes full tangent editing support for feature parity with v1.
 */
import { Animation } from "core/Animations/animation";
import { AnimationKeyInterpolation } from "core/Animations/animationKey";
import { Vector2 } from "core/Maths/math.vector";
import type { Nullable } from "core/types";
import * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CurveData } from "./curve";
import type { KeyPoint } from "../curveEditorContext";
import { useCurveEditor } from "../curveEditorContext";
import { ExtractSlope, ProcessTangentMove, HandleLockedTangent } from "../utils/tangentUtils";

// Inline SVG data URIs for key point icons
const KEY_INACTIVE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' style='fill:none'/%3E%3Cpath d='M5,1.41a1,1,0,0,0-.71.3L1.71,4.29a1,1,0,0,0,0,1.41h0L4.29,8.29a1,1,0,0,0,1.41,0h0L8.29,5.71a1,1,0,0,0,0-1.41h0L5.71,1.71A1,1,0,0,0,5,1.41Z' style='fill:%23aaa'/%3E%3Cpolyline points='5 2.41 5 2.41 7.59 5 5 7.59 2.41 5 5 2.41 5 2.41' style='fill:%23111'/%3E%3C/svg%3E";

const KEY_SELECTED =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Crect width='10' height='10' style='fill:none'/%3E%3Crect x='2.17' y='2.17' width='5.66' height='5.66' rx='1' transform='translate(-2.07 5) rotate(-45)' style='fill:%23ffc017'/%3E%3C/svg%3E";

const KEY_ACTIVE =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M5,1.41a1,1,0,0,0-.71.3L1.71,4.29a1,1,0,0,0,0,1.41h0L4.29,8.29a1,1,0,0,0,1.41,0h0L8.29,5.71a1,1,0,0,0,0-1.41h0L5.71,1.71A1,1,0,0,0,5,1.41Z' style='fill:%23ffc017'/%3E%3Crect width='10' height='10' style='fill:none'/%3E%3Cpolyline points='5 2.41 5 2.41 7.59 5 5 7.59 2.41 5 5 2.41 5 2.41' style='fill:%23111'/%3E%3C/svg%3E";

/** Selection state for key points */
export enum SelectionState {
    None,
    Selected,
    Siblings,
}

/** Control mode for pointer interactions */
enum ControlMode {
    None,
    Key,
    TangentLeft,
    TangentRight,
}

/** Props for the KeyPointComponent */
interface IKeyPointComponentProps {
    x: number;
    y: number;
    getPreviousX: () => Nullable<number>;
    getNextX: () => Nullable<number>;
    invertX: (x: number) => number;
    invertY: (y: number) => number;
    convertX: (x: number) => number;
    convertY: (y: number) => number;
    scale: number;
    keyId: number;
    curve: CurveData;
    channel: string;
    onFrameValueChanged: (value: number) => void;
    onKeyValueChanged: (value: number) => void;
}

/**
 * KeyPointComponent - Renders a single key point on the curve editor
 * Handles selection, dragging, and tangent manipulation
 * @param props - The component props
 * @returns The rendered key point SVG element
 */
export const KeyPointComponent: React.FunctionComponent<IKeyPointComponentProps> = (props) => {
    const { x: initialX, y: initialY, getPreviousX, getNextX, invertX, invertY, convertX, convertY, scale, keyId, curve, channel, onFrameValueChanged, onKeyValueChanged } = props;

    const { state, actions, observables } = useCurveEditor();

    // Local state
    const [selectedState, setSelectedState] = useState<SelectionState>(SelectionState.None);
    const [tangentSelectedIndex, setTangentSelectedIndex] = useState(-1);
    const [currentX, setCurrentX] = useState(initialX);
    const [currentY, setCurrentY] = useState(initialY);
    const [, setForceUpdate] = useState(0);

    // Refs
    const svgHostRef = useRef<SVGSVGElement>(null);
    const keyPointRef = useRef<SVGImageElement>(null);
    const pointerIsDown = useRef(false);
    const sourcePointerX = useRef(0);
    const sourcePointerY = useRef(0);
    const controlMode = useRef<ControlMode>(ControlMode.None);
    const lockX = useRef(false);
    const lockY = useRef(false);
    const accumulatedX = useRef(0);
    const accumulatedY = useRef(0);

    // Tangent vectors (mutable refs for performance)
    const inVec = useRef(new Vector2());
    const outVec = useRef(new Vector2());
    const storedLengthIn = useRef(0);
    const storedLengthOut = useRef(0);

    // Suppress unused variable warnings
    void channel;

    // Update position when props change
    useEffect(() => {
        setCurrentX(initialX);
        setCurrentY(initialY);
    }, [initialX, initialY]);

    // Check if this key point is selected
    const isSelected = useCallback(() => {
        return state.activeKeyPoints?.some((kp: KeyPoint) => kp.curve === curve && kp.keyId === keyId) ?? false;
    }, [state.activeKeyPoints, curve, keyId]);

    // Check if this is the main key point
    const isMainKeyPoint = useCallback(() => {
        return state.mainKeyPoint?.curve === curve && state.mainKeyPoint?.keyId === keyId;
    }, [state.mainKeyPoint, curve, keyId]);

    // Update selection state
    useEffect(() => {
        if (isSelected()) {
            setSelectedState(isMainKeyPoint() ? SelectionState.Selected : SelectionState.Siblings);
        } else {
            setSelectedState(SelectionState.None);
            setTangentSelectedIndex(-1);
        }
    }, [state.activeKeyPoints, state.mainKeyPoint, curve, keyId, isSelected, isMainKeyPoint]);

    // Extract slope helper that uses current state
    const extractSlope = useCallback(
        (vec: Vector2, storedLength: number, isIn: boolean) => {
            const keys = curve.keys;
            return ExtractSlope(vec, storedLength, isIn, keys[keyId].value, keys[keyId].frame, invertX, invertY, currentX, currentY);
        },
        [curve, keyId, invertX, invertY, currentX, currentY]
    );

    // Tangent operations
    const flattenTangent = useCallback(() => {
        observables.onInterpolationModeSet.notifyObservers({ keyId, value: AnimationKeyInterpolation.NONE });
        if (tangentSelectedIndex === -1 || tangentSelectedIndex === 0) {
            if (keyId !== 0) {
                curve.updateInTangentFromControlPoint(keyId, 0);
            }
        }
        if (tangentSelectedIndex === -1 || tangentSelectedIndex === 1) {
            if (keyId !== curve.keys.length - 1) {
                curve.updateOutTangentFromControlPoint(keyId, 0);
            }
        }
        setForceUpdate((v) => v + 1);
    }, [observables, keyId, tangentSelectedIndex, curve]);

    const linearTangent = useCallback(() => {
        observables.onInterpolationModeSet.notifyObservers({ keyId, value: AnimationKeyInterpolation.NONE });
        if (tangentSelectedIndex === -1 || tangentSelectedIndex === 0) {
            if (keyId !== 0) {
                curve.storeDefaultInTangent(keyId);
            }
        }
        if (tangentSelectedIndex === -1 || tangentSelectedIndex === 1) {
            if (keyId !== curve.keys.length - 1) {
                curve.storeDefaultOutTangent(keyId);
            }
        }
        curve.onDataUpdatedObservable.notifyObservers();
        setForceUpdate((v) => v + 1);
    }, [observables, keyId, tangentSelectedIndex, curve]);

    const breakTangent = useCallback(() => {
        observables.onInterpolationModeSet.notifyObservers({ keyId, value: AnimationKeyInterpolation.NONE });
        curve.updateLockedTangentMode(keyId, false);
        setForceUpdate((v) => v + 1);
    }, [observables, keyId, curve]);

    const unifyTangent = useCallback(() => {
        observables.onInterpolationModeSet.notifyObservers({ keyId, value: AnimationKeyInterpolation.NONE });
        curve.updateLockedTangentMode(keyId, true);
        setForceUpdate((v) => v + 1);
    }, [observables, keyId, curve]);

    const stepTangent = useCallback(() => {
        observables.onInterpolationModeSet.notifyObservers({ keyId, value: AnimationKeyInterpolation.STEP });
        setForceUpdate((v) => v + 1);
    }, [observables, keyId]);

    // Subscribe to tangent operation observables
    useEffect(() => {
        const flattenObserver = observables.onFlattenTangentRequired.add(() => {
            if (isSelected()) {
                flattenTangent();
            }
        });

        const linearObserver = observables.onLinearTangentRequired.add(() => {
            if (isSelected()) {
                linearTangent();
            }
        });

        const breakObserver = observables.onBreakTangentRequired.add(() => {
            if (isSelected()) {
                breakTangent();
            }
        });

        const unifyObserver = observables.onUnifyTangentRequired.add(() => {
            if (isSelected()) {
                unifyTangent();
            }
        });

        const stepObserver = observables.onStepTangentRequired.add(() => {
            if (isSelected()) {
                stepTangent();
            }
        });

        return () => {
            observables.onFlattenTangentRequired.remove(flattenObserver);
            observables.onLinearTangentRequired.remove(linearObserver);
            observables.onBreakTangentRequired.remove(breakObserver);
            observables.onUnifyTangentRequired.remove(unifyObserver);
            observables.onStepTangentRequired.remove(stepObserver);
        };
    }, [observables, isSelected, flattenTangent, linearTangent, breakTangent, unifyTangent, stepTangent]);

    // Handle selection rectangle
    useEffect(() => {
        const observer = observables.onSelectionRectangleMoved.add((rect1: DOMRect) => {
            if (!keyPointRef.current) {
                return;
            }

            const animationType = curve.animation.dataType;
            const isQuaternionAnimation = animationType === Animation.ANIMATIONTYPE_QUATERNION;
            if (isQuaternionAnimation) {
                return;
            }

            const rect2 = keyPointRef.current.getBoundingClientRect();
            const overlap = !(rect1.right < rect2.left || rect1.left > rect2.right || rect1.bottom < rect2.top || rect1.top > rect2.bottom);

            // Update activeKeyPoints based on overlap
            actions.setActiveKeyPoints((prev) => {
                const current = prev || [];
                const isCurrentlySelected = current.some((kp) => kp.curve === curve && kp.keyId === keyId);

                if (overlap && !isCurrentlySelected) {
                    return [...current, { curve, keyId }];
                } else if (!overlap && isCurrentlySelected) {
                    return current.filter((kp) => !(kp.curve === curve && kp.keyId === keyId));
                }
                return prev;
            });
        });

        return () => {
            observables.onSelectionRectangleMoved.remove(observer);
        };
    }, [observables, curve, keyId, actions]);

    // Handle select all keys
    useEffect(() => {
        const observer = observables.onSelectAllKeys.add(() => {
            actions.setActiveKeyPoints((prev) => {
                const current = prev || [];
                const isCurrentlySelected = current.some((kp) => kp.curve === curve && kp.keyId === keyId);
                if (!isCurrentlySelected) {
                    return [...current, { curve, keyId }];
                }
                return prev;
            });
        });

        return () => {
            observables.onSelectAllKeys.remove(observer);
        };
    }, [observables, actions, curve, keyId]);

    // Mouse/pointer handlers
    const handlePointerDown = useCallback(
        (evt: React.PointerEvent<SVGSVGElement>) => {
            const animationType = curve.animation.dataType;
            const isQuaternionAnimation = animationType === Animation.ANIMATIONTYPE_QUATERNION;

            if (isQuaternionAnimation) {
                return;
            }

            evt.preventDefault();
            evt.stopPropagation();

            pointerIsDown.current = true;
            sourcePointerX.current = evt.nativeEvent.offsetX;
            sourcePointerY.current = evt.nativeEvent.offsetY;

            // Determine control mode based on target
            const target = evt.nativeEvent.target as HTMLElement;
            if (target.tagName === "image") {
                controlMode.current = ControlMode.Key;
                setTangentSelectedIndex(-1);
            } else if (target.classList.contains("left-tangent")) {
                controlMode.current = ControlMode.TangentLeft;
                setTangentSelectedIndex(0);
            } else if (target.classList.contains("right-tangent")) {
                controlMode.current = ControlMode.TangentRight;
                setTangentSelectedIndex(1);
            }

            // Reset lock state
            lockX.current = false;
            lockY.current = false;
            accumulatedX.current = 0;
            accumulatedY.current = 0;

            // Handle selection
            if (!evt.ctrlKey) {
                if (!isSelected()) {
                    actions.setActiveKeyPoints([{ curve, keyId }]);
                }
            } else {
                actions.setActiveKeyPoints((prev) => {
                    const current = prev || [];
                    const isCurrentlySelected = current.some((kp) => kp.curve === curve && kp.keyId === keyId);
                    if (isCurrentlySelected) {
                        return current.filter((kp) => !(kp.curve === curve && kp.keyId === keyId));
                    } else {
                        return [...current, { curve, keyId }];
                    }
                });
            }

            observables.onActiveKeyPointChanged.notifyObservers();

            // Capture pointer for drag
            (evt.target as SVGSVGElement).setPointerCapture(evt.pointerId);
        },
        [curve, keyId, actions, observables, isSelected]
    );

    const handlePointerMove = useCallback(
        (evt: React.PointerEvent<SVGSVGElement>) => {
            if (!pointerIsDown.current || selectedState !== SelectionState.Selected) {
                return;
            }

            const diffX = evt.nativeEvent.offsetX - sourcePointerX.current;
            const diffY = evt.nativeEvent.offsetY - sourcePointerY.current;

            if (controlMode.current === ControlMode.Key) {
                // Handle shift-lock for constrained movement
                if (evt.shiftKey) {
                    if (!lockX.current && !lockY.current) {
                        accumulatedX.current += Math.abs(diffX);
                        accumulatedY.current += Math.abs(diffY);

                        if (accumulatedX.current > 5 || accumulatedY.current > 5) {
                            if (accumulatedX.current > accumulatedY.current) {
                                lockY.current = true;
                            } else {
                                lockX.current = true;
                            }
                        }
                    }
                } else {
                    lockX.current = false;
                    lockY.current = false;
                }

                // Calculate new position
                let newX = currentX + (lockX.current ? 0 : diffX * scale);
                let newY = currentY + (lockY.current ? 0 : diffY * scale);

                // Constrain to valid frame range
                const previousX = getPreviousX();
                const nextX = getNextX();
                const epsilon = 0.01;

                if (previousX !== null) {
                    newX = Math.max(previousX + epsilon, newX);
                }
                if (nextX !== null) {
                    newX = Math.min(nextX - epsilon, newX);
                }

                // Check frame lock constraints
                if (keyId !== 0 && !(state.lockLastFrameFrame && keyId === curve.keys.length - 1)) {
                    const frame = invertX(newX);
                    onFrameValueChanged(frame);
                    observables.onFrameSet.notifyObservers(frame);
                } else {
                    newX = currentX;
                }

                // Check value lock constraints
                if (state.lockLastFrameValue && keyId === curve.keys.length - 1) {
                    newY = currentY;
                }

                const value = invertY(newY);
                onKeyValueChanged(value);
                observables.onValueSet.notifyObservers(value);

                setCurrentX(newX);
                setCurrentY(newY);
            } else {
                // Tangent manipulation
                const keys = curve.keys;
                const isLockedTangent = keys[keyId].lockedTangent && keyId !== 0 && keyId !== keys.length - 1;

                if (controlMode.current === ControlMode.TangentLeft) {
                    const newSlope = ProcessTangentMove(
                        diffX,
                        diffY,
                        inVec.current,
                        storedLengthIn.current,
                        scale,
                        true,
                        keys[keyId].value,
                        keys[keyId].frame,
                        invertX,
                        invertY,
                        currentX,
                        currentY
                    );
                    curve.updateInTangentFromControlPoint(keyId, newSlope);

                    if (isLockedTangent) {
                        const { outSlope } = HandleLockedTangent(inVec.current, outVec.current, "left", storedLengthIn.current, storedLengthOut.current, extractSlope);
                        curve.updateOutTangentFromControlPoint(keyId, outSlope);
                    }
                } else if (controlMode.current === ControlMode.TangentRight) {
                    const newSlope = ProcessTangentMove(
                        diffX,
                        diffY,
                        outVec.current,
                        storedLengthOut.current,
                        scale,
                        false,
                        keys[keyId].value,
                        keys[keyId].frame,
                        invertX,
                        invertY,
                        currentX,
                        currentY
                    );
                    curve.updateOutTangentFromControlPoint(keyId, newSlope);

                    if (isLockedTangent) {
                        const { inSlope } = HandleLockedTangent(inVec.current, outVec.current, "right", storedLengthIn.current, storedLengthOut.current, extractSlope);
                        curve.updateInTangentFromControlPoint(keyId, inSlope);
                    }
                }

                actions.refreshTarget();
                setForceUpdate((v) => v + 1);
            }

            observables.onActiveKeyDataChanged.notifyObservers(keyId);
            sourcePointerX.current = evt.nativeEvent.offsetX;
            sourcePointerY.current = evt.nativeEvent.offsetY;
        },
        [
            currentX,
            currentY,
            selectedState,
            getPreviousX,
            getNextX,
            invertX,
            invertY,
            scale,
            onFrameValueChanged,
            onKeyValueChanged,
            curve,
            keyId,
            state.lockLastFrameFrame,
            state.lockLastFrameValue,
            observables,
            actions,
            extractSlope,
        ]
    );

    const handlePointerUp = useCallback((evt: React.PointerEvent<SVGSVGElement>) => {
        pointerIsDown.current = false;
        controlMode.current = ControlMode.None;
        (evt.target as SVGSVGElement).releasePointerCapture(evt.pointerId);
        evt.stopPropagation();
    }, []);

    // Get the key data
    const keys = curve.keys;
    const key = keys[keyId];
    if (!key) {
        return null;
    }

    const animationType = curve.animation.dataType;
    const isColorAnimation = animationType === Animation.ANIMATIONTYPE_COLOR3 || animationType === Animation.ANIMATIONTYPE_COLOR4;
    const isQuaternionAnimation = animationType === Animation.ANIMATIONTYPE_QUATERNION;

    // Determine icon based on selection state
    let icon: string;
    switch (selectedState) {
        case SelectionState.Selected:
            icon = KEY_SELECTED;
            break;
        case SelectionState.Siblings:
            icon = KEY_ACTIVE;
            break;
        default:
            icon = KEY_INACTIVE;
            break;
    }

    // Get tangent information
    const isLockedTangent = key.lockedTangent ?? true;
    const hasStepTangentIn = keys[keyId - 1]?.interpolation ?? false;
    const hasStepTangentOut = key.interpolation ?? false;
    const hasDefinedInTangent = curve.hasDefinedInTangent(keyId);
    const hasDefinedOutTangent = curve.hasDefinedOutTangent(keyId);

    // Calculate tangent vectors
    const convertedX = invertX(currentX);
    const convertedY = invertY(currentY);

    if (hasDefinedInTangent) {
        const inControlPointValue = convertedY - curve.getInControlPoint(keyId)!;
        inVec.current = new Vector2(convertX(convertedX - 1) - currentX, convertY(inControlPointValue) - currentY);
    } else {
        inVec.current = new Vector2();
    }

    if (hasDefinedOutTangent) {
        const outControlPointValue = convertedY + curve.getOutControlPoint(keyId)!;
        outVec.current = new Vector2(convertX(convertedX + 1) - currentX, convertY(outControlPointValue) - currentY);
    } else {
        outVec.current = new Vector2();
    }

    storedLengthIn.current = inVec.current.length();
    storedLengthOut.current = outVec.current.length();

    // Normalize and scale for display
    inVec.current.normalize();
    inVec.current.scaleInPlace(100 * scale);
    outVec.current.normalize();
    outVec.current.scaleInPlace(100 * scale);

    return (
        <svg
            ref={svgHostRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            x={currentX}
            y={currentY}
            style={{ cursor: isQuaternionAnimation ? "auto" : "pointer", overflow: "auto", opacity: isQuaternionAnimation ? "25%" : "100%" }}
        >
            <image ref={keyPointRef} x={`-${8 * scale}`} y={`-${8 * scale}`} width={`${16 * scale}`} height={`${16 * scale}`} href={icon} />
            {selectedState === SelectionState.Selected && (
                <g>
                    {/* Left/In tangent */}
                    {keyId !== 0 && !hasStepTangentIn && !isColorAnimation && !isQuaternionAnimation && hasDefinedInTangent && (
                        <>
                            <line
                                x1={0}
                                y1={0}
                                x2={`${inVec.current.x}px`}
                                y2={`${inVec.current.y}px`}
                                style={{
                                    stroke: tangentSelectedIndex === 0 || tangentSelectedIndex === -1 ? "#F9BF00" : "#AAAAAA",
                                    strokeWidth: `${1 * scale}`,
                                    strokeDasharray: isLockedTangent ? "" : "2, 2",
                                }}
                            />
                            <circle
                                className="left-tangent"
                                cx={`${inVec.current.x}px`}
                                cy={`${inVec.current.y}px`}
                                r={`${4 * scale}`}
                                style={{
                                    fill: tangentSelectedIndex === 0 || tangentSelectedIndex === -1 ? "#F9BF00" : "#AAAAAA",
                                }}
                            />
                        </>
                    )}
                    {/* Right/Out tangent */}
                    {keyId !== keys.length - 1 && !hasStepTangentOut && !isColorAnimation && !isQuaternionAnimation && hasDefinedOutTangent && (
                        <>
                            <line
                                x1={0}
                                y1={0}
                                x2={`${outVec.current.x}px`}
                                y2={`${outVec.current.y}px`}
                                style={{
                                    stroke: tangentSelectedIndex === 1 || tangentSelectedIndex === -1 ? "#F9BF00" : "#AAAAAA",
                                    strokeWidth: `${1 * scale}`,
                                    strokeDasharray: isLockedTangent ? "" : "2, 2",
                                }}
                            />
                            <circle
                                className="right-tangent"
                                cx={`${outVec.current.x}px`}
                                cy={`${outVec.current.y}px`}
                                r={`${4 * scale}`}
                                style={{
                                    fill: tangentSelectedIndex === 1 || tangentSelectedIndex === -1 ? "#F9BF00" : "#AAAAAA",
                                }}
                            />
                        </>
                    )}
                </g>
            )}
        </svg>
    );
};

export default KeyPointComponent;
