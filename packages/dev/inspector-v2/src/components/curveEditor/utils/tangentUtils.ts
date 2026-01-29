import { Vector2 } from "core/Maths/math.vector";

/**
 * Extract slope from a tangent vector
 * @param vec - The tangent vector (will be modified)
 * @param storedLength - Original length of the vector
 * @param isIn - Whether this is an in-tangent
 * @param keyValue - The value at the keyframe
 * @param keyFrame - The frame at the keyframe
 * @param invertX - Function to convert screen X to frame
 * @param invertY - Function to convert screen Y to value
 * @param stateX - Current X position in screen space
 * @param stateY - Current Y position in screen space
 * @returns The slope value
 */
export function ExtractSlope(
    vec: Vector2,
    storedLength: number,
    isIn: boolean,
    keyValue: number,
    keyFrame: number,
    invertX: (x: number) => number,
    invertY: (y: number) => number,
    stateX: number,
    stateY: number
): number {
    // Ensure vector points in the correct direction
    if (isIn && vec.x >= 0) {
        vec.x = -0.01;
    } else if (!isIn && vec.x <= 0) {
        vec.x = 0.01;
    }

    const currentPosition = vec.clone();
    currentPosition.normalize();
    currentPosition.scaleInPlace(storedLength);

    const value = isIn ? keyValue - invertY(currentPosition.y + stateY) : invertY(currentPosition.y + stateY) - keyValue;

    const frame = isIn ? keyFrame - invertX(currentPosition.x + stateX) : invertX(currentPosition.x + stateX) - keyFrame;

    return value / frame;
}

/**
 * Process tangent movement from a pointer event
 * @param deltaX - X movement in screen pixels
 * @param deltaY - Y movement in screen pixels
 * @param vec - The tangent vector (will be modified)
 * @param storedLength - Original length of the vector
 * @param scale - Current scale factor
 * @param isIn - Whether this is an in-tangent
 * @param keyValue - The value at the keyframe
 * @param keyFrame - The frame at the keyframe
 * @param invertX - Function to convert screen X to frame
 * @param invertY - Function to convert screen Y to value
 * @param stateX - Current X position in screen space
 * @param stateY - Current Y position in screen space
 * @returns The new slope value
 */
export function ProcessTangentMove(
    deltaX: number,
    deltaY: number,
    vec: Vector2,
    storedLength: number,
    scale: number,
    isIn: boolean,
    keyValue: number,
    keyFrame: number,
    invertX: (x: number) => number,
    invertY: (y: number) => number,
    stateX: number,
    stateY: number
): number {
    vec.x += deltaX * scale;
    vec.y += deltaY * scale;

    return ExtractSlope(vec, storedLength, isIn, keyValue, keyFrame, invertX, invertY, stateX, stateY);
}

/**
 * Calculate the tangent vectors for a keypoint
 * @param hasDefinedInTangent - Whether the key has a defined in tangent
 * @param hasDefinedOutTangent - Whether the key has a defined out tangent
 * @param convertedX - Frame value
 * @param convertedY - Value at the keyframe
 * @param inControlPointValue - The in control point value (value - tangent effect)
 * @param outControlPointValue - The out control point value (value + tangent effect)
 * @param convertX - Function to convert frame to screen X
 * @param convertY - Function to convert value to screen Y
 * @param stateX - Current X position in screen space
 * @param stateY - Current Y position in screen space
 * @param scale - Scale factor for display
 * @returns Object containing inVec, outVec, and their stored lengths
 */
export function CalculateTangentVectors(
    hasDefinedInTangent: boolean,
    hasDefinedOutTangent: boolean,
    convertedX: number,
    convertedY: number,
    inControlPointValue: number | undefined,
    outControlPointValue: number | undefined,
    convertX: (x: number) => number,
    convertY: (y: number) => number,
    stateX: number,
    stateY: number,
    scale: number
): {
    inVec: Vector2;
    outVec: Vector2;
    storedLengthIn: number;
    storedLengthOut: number;
} {
    let inVec: Vector2;
    let outVec: Vector2;

    if (hasDefinedInTangent && inControlPointValue !== undefined) {
        inVec = new Vector2(convertX(convertedX - 1) - stateX, convertY(inControlPointValue) - stateY);
    } else {
        inVec = new Vector2();
    }

    if (hasDefinedOutTangent && outControlPointValue !== undefined) {
        outVec = new Vector2(convertX(convertedX + 1) - stateX, convertY(outControlPointValue) - stateY);
    } else {
        outVec = new Vector2();
    }

    const storedLengthIn = inVec.length();
    const storedLengthOut = outVec.length();

    // Normalize and scale for display
    inVec.normalize();
    inVec.scaleInPlace(100 * scale);

    outVec.normalize();
    outVec.scaleInPlace(100 * scale);

    return { inVec, outVec, storedLengthIn, storedLengthOut };
}

/**
 * Handle locked tangent mode - when moving one tangent, adjust the other to maintain symmetry
 * @param inVec - The in-tangent vector
 * @param outVec - The out-tangent vector
 * @param controlMode - Which tangent is being controlled ('left' or 'right')
 * @param storedLengthIn - Original length of in-tangent
 * @param storedLengthOut - Original length of out-tangent
 * @param extractSlopeFn - Function to extract slope from a vector
 * @returns Object with updated slopes for both tangents
 */
export function HandleLockedTangent(
    inVec: Vector2,
    outVec: Vector2,
    controlMode: "left" | "right",
    storedLengthIn: number,
    storedLengthOut: number,
    extractSlopeFn: (vec: Vector2, storedLength: number, isIn: boolean) => number
): { inSlope: number; outSlope: number } {
    // Calculate angle between the two tangent vectors
    const va = inVec.clone().normalize();
    const vb = outVec.clone().normalize();
    let angleDiff = Math.acos(Math.min(1.0, Math.max(-1, Vector2.Dot(va, vb))));

    // Determine direction of angle
    const tmpVector = new Vector2();
    inVec.clone().normalize().rotateToRef(-angleDiff, tmpVector);
    if (Vector2.Distance(tmpVector, vb) > 0.01) {
        angleDiff = -angleDiff;
    }

    let inSlope: number;
    let outSlope: number;

    if (controlMode === "left") {
        inSlope = extractSlopeFn(inVec, storedLengthIn, true);

        // Rotate the in vector and use it for out
        inVec.rotateToRef(-angleDiff, tmpVector);
        tmpVector.x = Math.abs(tmpVector.x);
        outSlope = extractSlopeFn(tmpVector, storedLengthOut, false);
    } else {
        outSlope = extractSlopeFn(outVec, storedLengthOut, false);

        // Rotate the out vector and use it for in
        outVec.rotateToRef(angleDiff, tmpVector);
        tmpVector.x = -Math.abs(tmpVector.x);
        inSlope = extractSlopeFn(tmpVector, storedLengthIn, true);
    }

    return { inSlope, outSlope };
}
