import { Epsilon } from "../../Maths/math.constants";
import { Vector2 } from "../../Maths/math.vector";
import { Clamp } from "../../Maths/math.scalar.functions";
/**
 * Limits for geospatial camera
 */
export class GeospatialLimits {
    private _planetRadius: number;
    private _radiusMin: number = 10;
    private _radiusMax: number = Infinity;

    /** Gets the minimum pitch angle (angle from horizon) -- 0 means looking straight down at planet */
    public pitchMin: number = Epsilon;

    /**  Gets the maximum pitch angle (angle from horizon) -- Pi/2 means looking at horizon */
    public pitchMax: number = Math.PI / 2 - 0.01;

    /**
     * Controls how pitch is disabled as the camera zooms out.
     * x = radius scale at which full pitch is allowed (e.g., 1.5 means 1.5 * planetRadius)
     * y = radius scale at which pitch is fully disabled (forced to pitchMin)
     * Set to undefined to disable this feature.
     */
    public pitchDisabledRadiusScale?: Vector2 = new Vector2(2, 4);

    /** Gets the minimum yaw angle (rotation around up axis) */
    public yawMin: number = -Infinity;

    /** Gets the maximum yaw angle (rotation around up axis) */
    public yawMax: number = Infinity;
    /**
     * Defines the distance used to consider the camera in pan mode vs pinch/zoom.
     * Basically if your fingers moves away from more than this distance you will be considered
     * in pinch mode.
     */
    public pinchToPanMax: number = 20;

    /**
     * @param planetRadius The radius of the planet
     */
    constructor(planetRadius: number) {
        this._planetRadius = planetRadius;
        this.radiusMax = planetRadius * 4;
    }

    public get radiusMin(): number {
        return this._radiusMin;
    }

    /**
     * Sets the minimum radius
     */
    public set radiusMin(value: number) {
        this._radiusMin = value;
    }

    public get radiusMax(): number {
        return this._radiusMax;
    }

    /**
     * Sets the maximum radius
     */
    public set radiusMax(value: number) {
        this._radiusMax = value;
    }

    /**
     * Gets the planet radius used for altitude/radius conversions
     */
    public get planetRadius(): number {
        return this._planetRadius;
    }

    /** Sets the planet radius and updates the radius limits to maintain current altitude */
    public set planetRadius(value: number) {
        this._planetRadius = value;
    }

    /**
     * Clamps a zoom distance to respect the radius limits.
     * @param zoomDistance The requested zoom distance (positive = zoom in, negative = zoom out)
     * @param currentRadius The current camera radius
     * @param distanceToTarget Optional distance to the zoom target point (used for zoom-in clamping)
     * @returns The clamped zoom distance
     */
    public clampZoomDistance(zoomDistance: number, currentRadius: number, distanceToTarget?: number): number {
        if (zoomDistance > 0) {
            // Zooming IN - don't zoom past the surface or below radiusMin
            const maxZoomIn = (distanceToTarget ?? currentRadius) - this._radiusMin;
            return Math.min(zoomDistance, Math.max(0, maxZoomIn));
        } else {
            // Zooming OUT - don't exceed radiusMax
            const maxZoomOut = this._radiusMax - currentRadius;
            return Math.max(zoomDistance, -Math.max(0, maxZoomOut));
        }
    }

    /**
     * Computes the effective maximum pitch based on the current camera radius.
     * When pitchDisabledRadiusScale is set, pitch is interpolated from pitchMax to pitchMin
     * as the camera zooms out from x*planetRadius to y*planetRadius.
     * @param currentRadius The current camera radius (distance from planet center)
     * @returns The effective maximum pitch angle
     */
    public getEffectivePitchMax(currentRadius: number): number {
        if (!this.pitchDisabledRadiusScale) {
            return this.pitchMax;
        }

        const fullPitchRadius = this.pitchDisabledRadiusScale.x * this._planetRadius;
        const noPitchRadius = this.pitchDisabledRadiusScale.y * this._planetRadius;

        if (currentRadius <= fullPitchRadius) {
            // Full pitch allowed
            return this.pitchMax;
        } else if (currentRadius >= noPitchRadius) {
            // No pitch allowed
            return this.pitchMin;
        } else {
            // Interpolate between pitchMax and pitchMin
            const t = (currentRadius - fullPitchRadius) / (noPitchRadius - fullPitchRadius);
            const clampedT = Clamp(t, 0, 1);
            return this.pitchMax * (1 - clampedT) + this.pitchMin * clampedT;
        }
    }
}
