/**
 * Prepare the list of uniforms associated with the ColorCurves effects.
 * @param uniformsList The list of uniforms used in the effect
 */
export function PrepareUniformsForColorCurves(uniformsList: string[]): void {
    uniformsList.push("vCameraColorCurveNeutral", "vCameraColorCurvePositive", "vCameraColorCurveNegative");
}
