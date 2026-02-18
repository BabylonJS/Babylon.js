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
import type { CurveData } from "./curveData";
import type { KeyPoint, MainKeyPointInfo, MainKeyPointPosition } from "../curveEditorContext";
import { useCurveEditor } from "../curveEditorContext";

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

    // Track current position in refs to avoid stale closure issues during drag
    const currentXRef = useRef(initialX);
    const currentYRef = useRef(initialY);

    // Suppress unused variable warnings
    void channel;

    // Update position when props change
    useEffect(() => {
        setCurrentX(initialX);
        setCurrentY(initialY);
        currentXRef.current = initialX;
        currentYRef.current = initialY;
    }, [initialX, initialY]);

    // Helper to compare curves by identity (animation + property) rather than reference
    const curvesMatch = useCallback((c1: CurveData, c2: CurveData) => {
        return c1.animation.uniqueId === c2.animation.uniqueId && c1.property === c2.property;
    }, []);

    // Check if this key point is selected
    const isSelected = useCallback(() => {
        return state.activeKeyPoints?.some((kp: KeyPoint) => curvesMatch(kp.curve, curve) && kp.keyId === keyId) ?? false;
    }, [state.activeKeyPoints, curve, keyId, curvesMatch]);

    // Update selection state
    // v1 logic: "Selected" means this keypoint is in activeKeyPoints
    // "Siblings" means another keypoint with same keyId but different curve (same animation) is selected
    useEffect(() => {
        if (isSelected()) {
            // This keypoint is directly selected
            setSelectedState(SelectionState.Selected);

            // Notify frame/value observers so the top bar displays correct values (like v1's _onActiveKeyPointChanged)
            observables.onFrameSet.notifyObservers(invertX(currentXRef.current));
            observables.onValueSet.notifyObservers(invertY(currentYRef.current));
        } else if (state.activeKeyPoints) {
            // Check if a sibling (same keyId, different curve, same animation) is selected
            let isSibling = false;
            for (const activeKeyPoint of state.activeKeyPoints) {
                if (activeKeyPoint.keyId === keyId && !curvesMatch(activeKeyPoint.curve, curve) && activeKeyPoint.curve.animation.uniqueId === curve.animation.uniqueId) {
                    isSibling = true;
                    break;
                }
            }
            if (isSibling) {
                setSelectedState(SelectionState.Siblings);
            } else {
                setSelectedState(SelectionState.None);
                setTangentSelectedIndex(-1);
            }
        } else {
            setSelectedState(SelectionState.None);
            setTangentSelectedIndex(-1);
        }
    }, [state.activeKeyPoints, state.mainKeyPoint, curve, keyId, isSelected, curvesMatch, observables, invertX, invertY]);

    // Extract slope from a tangent vector
    const extractSlope = useCallback(
        (vec: Vector2, storedLength: number, isIn: boolean) => {
            const keys = curve.keys;
            const keyValue = keys[keyId].value;
            const keyFrame = keys[keyId].frame;

            // Ensure vector points in the correct direction (modifies vec directly like v1)
            if (isIn && vec.x >= 0) {
                vec.x = -0.01;
            } else if (!isIn && vec.x <= 0) {
                vec.x = 0.01;
            }

            // Clone AFTER direction correction (like v1)
            const currentPosition = vec.clone();
            currentPosition.normalize();
            currentPosition.scaleInPlace(storedLength);

            // Use refs for current position to avoid stale closure during drag
            const cx = currentXRef.current;
            const cy = currentYRef.current;
            const value = isIn ? keyValue - invertY(currentPosition.y + cy) : invertY(currentPosition.y + cy) - keyValue;
            const frame = isIn ? keyFrame - invertX(currentPosition.x + cx) : invertX(currentPosition.x + cx) - keyFrame;

            return value / frame;
        },
        [curve, keyId, invertX, invertY]
    );

    // Tangent operations
    const flattenTangent = useCallback(() => {
        // First update the interpolation mode to NONE without triggering observers
        const keys = curve.keys;
        const animationKeys = curve.animation.getKeys();
        keys[keyId].interpolation = AnimationKeyInterpolation.NONE;
        animationKeys[keyId].interpolation = AnimationKeyInterpolation.NONE;

        // Then update the tangents
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
        // Notify curve to re-render path
        curve.onDataUpdatedObservable.notifyObservers();
        setForceUpdate((v) => v + 1);
    }, [keyId, tangentSelectedIndex, curve]);

    const linearTangent = useCallback(() => {
        // First update the interpolation mode to NONE without triggering observers
        const keys = curve.keys;
        const animationKeys = curve.animation.getKeys();
        keys[keyId].interpolation = AnimationKeyInterpolation.NONE;
        animationKeys[keyId].interpolation = AnimationKeyInterpolation.NONE;

        // Then update the tangents
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

        // Notify once after all changes are done
        curve.onDataUpdatedObservable.notifyObservers();
        setForceUpdate((v) => v + 1);
    }, [keyId, tangentSelectedIndex, curve]);

    const breakTangent = useCallback(() => {
        // Update interpolation without triggering intermediate observers
        const keys = curve.keys;
        const animationKeys = curve.animation.getKeys();
        keys[keyId].interpolation = AnimationKeyInterpolation.NONE;
        animationKeys[keyId].interpolation = AnimationKeyInterpolation.NONE;

        curve.updateLockedTangentMode(keyId, false);
        curve.onDataUpdatedObservable.notifyObservers();
        setForceUpdate((v) => v + 1);
    }, [keyId, curve]);

    const unifyTangent = useCallback(() => {
        // Update interpolation without triggering intermediate observers
        const keys = curve.keys;
        const animationKeys = curve.animation.getKeys();
        keys[keyId].interpolation = AnimationKeyInterpolation.NONE;
        animationKeys[keyId].interpolation = AnimationKeyInterpolation.NONE;

        curve.updateLockedTangentMode(keyId, true);
        curve.onDataUpdatedObservable.notifyObservers();
        setForceUpdate((v) => v + 1);
    }, [keyId, curve]);

    const stepTangent = useCallback(() => {
        curve.updateInterpolationMode(keyId, AnimationKeyInterpolation.STEP);
        setForceUpdate((v) => v + 1);
    }, [keyId, curve]);

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
                const matchesCurve = (kp: KeyPoint) => kp.curve.animation.uniqueId === curve.animation.uniqueId && kp.curve.property === curve.property && kp.keyId === keyId;
                const isCurrentlySelected = current.some(matchesCurve);

                if (overlap && !isCurrentlySelected) {
                    return [...current, { curve, keyId }];
                } else if (!overlap && isCurrentlySelected) {
                    return current.filter((kp) => !matchesCurve(kp));
                }
                return prev;
            });
        });

        return () => {
            observables.onSelectionRectangleMoved.remove(observer);
        };
    }, [observables, curve, keyId, actions]);

    // Handle frame manually entered from top bar
    useEffect(() => {
        const observer = observables.onFrameManuallyEntered.add((newValue) => {
            if (selectedState === SelectionState.None) {
                return;
            }

            let newX = convertX(newValue);

            // Clamp to neighbors
            const previousX = getPreviousX();
            const nextX = getNextX();
            if (previousX !== null) {
                newX = Math.max(previousX, newX);
            }
            if (nextX !== null) {
                newX = Math.min(nextX, newX);
            }

            const frame = invertX(newX);
            currentXRef.current = newX;
            setCurrentX(newX);
            onFrameValueChanged(frame);
        });

        return () => {
            observables.onFrameManuallyEntered.remove(observer);
        };
    }, [observables, selectedState, convertX, invertX, getPreviousX, getNextX, onFrameValueChanged]);

    // Handle value manually entered from top bar
    useEffect(() => {
        const observer = observables.onValueManuallyEntered.add((newValue) => {
            if (selectedState !== SelectionState.Selected) {
                return;
            }

            const newY = convertY(newValue);
            currentYRef.current = newY;
            setCurrentY(newY);
            onKeyValueChanged(newValue);
        });

        return () => {
            observables.onValueManuallyEntered.remove(observer);
        };
    }, [observables, selectedState, convertY, onKeyValueChanged]);

    // Handle select all keys
    useEffect(() => {
        const observer = observables.onSelectAllKeys.add(() => {
            actions.setActiveKeyPoints((prev) => {
                const current = prev || [];
                const matchesCurve = (kp: KeyPoint) => kp.curve.animation.uniqueId === curve.animation.uniqueId && kp.curve.property === curve.property && kp.keyId === keyId;
                const isCurrentlySelected = current.some(matchesCurve);
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

    // Track active key points count in a ref to avoid stale closure in handlePointerMove
    const activeKeyPointsRef = useRef(state.activeKeyPoints);
    activeKeyPointsRef.current = state.activeKeyPoints;

    // Multi-point movement: store offset from main key point
    const offsetToMain = useRef({ x: 0, y: 0 });
    const isMainKeyPoint = useRef(false);

    // When a main key point is set (multi-selection), store offset from it
    useEffect(() => {
        const observer = observables.onMainKeyPointSet.add((info: MainKeyPointInfo) => {
            // Check if WE are the main key point
            if (info.curve === curve && info.keyId === keyId) {
                isMainKeyPoint.current = true;
                return;
            }
            isMainKeyPoint.current = false;

            // Store offset from the main key point position
            offsetToMain.current = {
                x: currentXRef.current - info.x,
                y: currentYRef.current - info.y,
            };
        });

        return () => {
            observables.onMainKeyPointSet.remove(observer);
        };
    }, [observables, curve, keyId]);

    // When the main key point moves, follow it with offset
    useEffect(() => {
        const observer = observables.onMainKeyPointMoved.add((pos: MainKeyPointPosition) => {
            // Skip if we ARE the main key point
            if (isMainKeyPoint.current) {
                return;
            }

            if (selectedState === SelectionState.None) {
                return;
            }

            // Move frame for selected + siblings (but not first key)
            if (keyId !== 0) {
                const newX = pos.x + offsetToMain.current.x;
                currentXRef.current = newX;
                setCurrentX(newX);
                onFrameValueChanged(invertX(newX));
            }

            // Move value only for directly selected points
            if (selectedState === SelectionState.Selected) {
                const newY = pos.y + offsetToMain.current.y;
                currentYRef.current = newY;
                setCurrentY(newY);
                onKeyValueChanged(invertY(newY));
            }
        });

        return () => {
            observables.onMainKeyPointMoved.remove(observer);
        };
    }, [observables, curve, keyId, selectedState, invertX, invertY, onFrameValueChanged, onKeyValueChanged]);

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

            // Handle selection (matches v1's _select logic)
            if (!evt.ctrlKey) {
                if (!isSelected()) {
                    // Not in list, not multi-select: clear and add self
                    actions.setActiveKeyPoints([{ curve, keyId }]);
                    // Single selection → no mainKeyPoint (like v1)
                    actions.setMainKeyPoint(null);
                } else {
                    // Already in list, not multi-select:
                    // If >1 selected, promote this to mainKeyPoint (DON'T clear others — v1 behavior)
                    // If only 1, mainKeyPoint = null
                    if (state.activeKeyPoints && state.activeKeyPoints.length > 1) {
                        const info: MainKeyPointInfo = { x: currentXRef.current, y: currentYRef.current, curve, keyId };
                        actions.setMainKeyPoint({ curve, keyId });
                        queueMicrotask(() => {
                            observables.onMainKeyPointSet.notifyObservers(info);
                        });
                    } else {
                        actions.setMainKeyPoint(null);
                    }
                }
            } else {
                // Ctrl-click: toggle selection
                if (isSelected()) {
                    // Remove from list
                    actions.setActiveKeyPoints((prev) => {
                        const current = prev || [];
                        const matchesCurve = (kp: KeyPoint) =>
                            kp.curve.animation.uniqueId === curve.animation.uniqueId && kp.curve.property === curve.property && kp.keyId === keyId;
                        return current.filter((kp) => !matchesCurve(kp));
                    });
                    actions.setMainKeyPoint(null);
                } else {
                    // Add to list
                    actions.setActiveKeyPoints((prev) => {
                        const current = prev || [];
                        return [...current, { curve, keyId }];
                    });
                    // Multi selection is now engaged
                    if ((state.activeKeyPoints?.length ?? 0) + 1 > 1) {
                        const info: MainKeyPointInfo = { x: currentXRef.current, y: currentYRef.current, curve, keyId };
                        actions.setMainKeyPoint({ curve, keyId });
                        queueMicrotask(() => {
                            observables.onMainKeyPointSet.notifyObservers(info);
                        });
                    } else {
                        actions.setMainKeyPoint(null);
                    }
                }
            }

            observables.onActiveKeyPointChanged.notifyObservers();

            // Capture pointer for drag
            (evt.target as SVGSVGElement).setPointerCapture(evt.pointerId);
        },
        [curve, keyId, actions, observables, isSelected, state.activeKeyPoints]
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

                // Calculate new position using refs to avoid stale closure
                let newX = currentXRef.current + (lockX.current ? 0 : diffX * scale);
                let newY = currentYRef.current + (lockY.current ? 0 : diffY * scale);

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
                    newX = currentXRef.current;
                }

                // Check value lock constraints
                if (state.lockLastFrameValue && keyId === curve.keys.length - 1) {
                    newY = currentYRef.current;
                }

                const value = invertY(newY);
                onKeyValueChanged(value);
                observables.onValueSet.notifyObservers(value);

                // Update both ref and state
                currentXRef.current = newX;
                currentYRef.current = newY;
                setCurrentX(newX);
                setCurrentY(newY);

                // Notify other selected key points to follow (multi-point movement)
                const activeKeyPoints = activeKeyPointsRef.current;
                if (activeKeyPoints && activeKeyPoints.length > 1) {
                    requestAnimationFrame(() => {
                        observables.onMainKeyPointMoved.notifyObservers({ x: newX, y: newY });
                    });
                }
            } else {
                // Tangent manipulation
                const keys = curve.keys;
                const isLockedTangent = keys[keyId].lockedTangent && keyId !== 0 && keyId !== keys.length - 1;

                // Calculate angle diff BEFORE modifying the tangent (like v1 does)
                let angleDiff = 0;
                if (isLockedTangent) {
                    const va = inVec.current.clone().normalize();
                    const vb = outVec.current.clone().normalize();
                    angleDiff = Math.acos(Math.min(1.0, Math.max(-1, Vector2.Dot(va, vb))));

                    // Determine direction of angle
                    const tmpCheck = new Vector2();
                    va.rotateToRef(-angleDiff, tmpCheck);
                    if (Vector2.Distance(tmpCheck, vb) > 0.01) {
                        angleDiff = -angleDiff;
                    }
                }

                if (controlMode.current === ControlMode.TangentLeft) {
                    // Update the vector in place - multiply by scale to match v1 behavior
                    inVec.current.x += diffX * scale;
                    inVec.current.y += diffY * scale;

                    const newSlope = extractSlope(inVec.current, storedLengthIn.current, true);
                    curve.updateInTangentFromControlPoint(keyId, newSlope);

                    if (isLockedTangent) {
                        // Rotate the moved inVec by -angleDiff to get the outVec direction
                        const tmpVector = new Vector2();
                        inVec.current.rotateToRef(-angleDiff, tmpVector);
                        tmpVector.x = Math.abs(tmpVector.x); // Ensure out tangent points right
                        const outSlope = extractSlope(tmpVector, storedLengthOut.current, false);
                        curve.updateOutTangentFromControlPoint(keyId, outSlope);
                        // Update outVec visually to match the rotated position
                        outVec.current.copyFrom(tmpVector);
                        outVec.current.normalize();
                        outVec.current.scaleInPlace(100 * scale);
                    }
                } else if (controlMode.current === ControlMode.TangentRight) {
                    // Update the vector in place - multiply by scale to match v1 behavior
                    outVec.current.x += diffX * scale;
                    outVec.current.y += diffY * scale;

                    const newSlope = extractSlope(outVec.current, storedLengthOut.current, false);
                    curve.updateOutTangentFromControlPoint(keyId, newSlope);

                    if (isLockedTangent) {
                        // Rotate the moved outVec by angleDiff to get the inVec direction
                        const tmpVector = new Vector2();
                        outVec.current.rotateToRef(angleDiff, tmpVector);
                        tmpVector.x = -Math.abs(tmpVector.x); // Ensure in tangent points left
                        const inSlope = extractSlope(tmpVector, storedLengthIn.current, true);
                        curve.updateInTangentFromControlPoint(keyId, inSlope);
                        // Update inVec visually to match the rotated position
                        inVec.current.copyFrom(tmpVector);
                        inVec.current.normalize();
                        inVec.current.scaleInPlace(100 * scale);
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

    // Calculate tangent vectors from curve data (like v1's render method)
    // This recalculates on every render, including after tangent updates
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
