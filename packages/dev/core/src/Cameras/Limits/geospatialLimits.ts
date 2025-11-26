import { Epsilon } from "../../Maths/math.constants";
/**
 * Limits for geospatial cameras with altitude/radius synchronization
 */
export class GeospatialLimits {
    private _altitudeMin: number = Epsilon;
    private _altitudeMax: number;
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
     * @param planetRadius The radius of the planet (used for altitude/radius conversions)
     */
    constructor(planetRadius: number) {
        this._planetRadius = planetRadius;
    }

    /**
     * Gets the minimum altitude (height above planet surface)
     */
    public get altitudeMin(): number {
        return this._altitudeMin;
    }

    /**
     * Sets the minimum altitude and syncs it with radius
     */
    public set altitudeMin(value: number) {
        this._altitudeMin = value;
        this._radiusMin = this._planetRadius + value;
    }

    /**
     * Gets the maximum altitude (height above planet surface)
     */
    public get altitudeMax(): number {
        return this._altitudeMax;
    }

    /**
     * Sets the maximum altitude and syncs it with radius
     */
    public set altitudeMax(value: number) {
        this._altitudeMax = value;
        this._radiusMax = this._planetRadius + value;
    }

    public get radiusMin(): number {
        return this._radiusMin;
    }

    /**
     * Sets the minimum radius and syncs it with altitude
     */
    public set radiusMin(value: number) {
        this._radiusMin = value;
        this._altitudeMin = value - this._planetRadius;
    }

    public get radiusMax(): number {
        return this._radiusMax;
    }

    /**
     * Sets the maximum radius and syncs it with altitude
     */
    public set radiusMax(value: number) {
        this._radiusMax = value;
        this._altitudeMax = value - this._planetRadius;
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
        // Update radius limits to maintain current altitude
        this._radiusMin = value + this._altitudeMin;
        this._radiusMax = value + this._altitudeMax;
    }
}
