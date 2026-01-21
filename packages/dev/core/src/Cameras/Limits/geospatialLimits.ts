import { Epsilon } from "../../Maths/math.constants";
/**
 * Limits for geospatial camera
 */
export class GeospatialLimits {
    private _planetRadius: number;
    private _radiusMin: number = Epsilon;
    private _radiusMax: number = Infinity;

    /** Gets the minimum pitch angle (angle from horizon) -- 0 means looking straight down at planet */
    public pitchMin: number = Epsilon;

    /**  Gets the maximum pitch angle (angle from horizon) -- Pi/1 means looking at horizon */
    public pitchMax: number = Math.PI / 2;

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
}
