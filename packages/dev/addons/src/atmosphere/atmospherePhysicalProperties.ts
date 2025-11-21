// Copyright (c) Microsoft Corporation.
// MIT License

import type { IAtmospherePhysicalPropertiesOptions } from "./atmospherePhysicalPropertiesOptions";
import { Observable } from "core/Misc/observable";
import { Vector3 } from "core/Maths/math.vector";

const DefaultPlanetRadius = 6360.0;
const DefaultPlanetRadiusOffset = 0.01;
const DefaultAtmosphereThickness = 100.0;

// The scattering and absorption values are per kilometer measured at sea level.
const DefaultPeakRayleighScattering = new Vector3(0.005802, 0.013558, 0.0331);
const DefaultPeakMieScattering = new Vector3(0.003996, 0.003996, 0.003996);
const DefaultPeakMieAbsorption = new Vector3(0.000444, 0.000444, 0.000444);
const DefaultPeakOzoneAbsorption = new Vector3(0.00065, 0.001881, 0.000085);

/**
 * Describes the physical properties of the atmosphere. Assumes a spherical planet.
 * - "radius" values describe a distance from the planet's center.
 * - "height" values describe a distance from the planet's surface.
 * - Distances are in kilometers unless otherwise specified. Angles are in radians.
 */
export class AtmospherePhysicalProperties {
    /**
     * Notification for when properties of the {@link AtmospherePhysicalProperties} are changed.
     */
    public readonly onChangedObservable = new Observable<AtmospherePhysicalProperties>();

    private _planetRadius: number;
    private _planetRadiusOffset: number;
    private _atmosphereThickness: number;
    private _rayleighScatteringScale: number;
    private _peakRayleighScattering = new Vector3();
    private _mieScatteringScale: number;
    private _peakMieScattering = new Vector3();
    private _mieAbsorptionScale: number;
    private _peakMieAbsorption = new Vector3();
    private _ozoneAbsorptionScale: number;
    private _peakOzoneAbsorption = new Vector3();

    // Inferred values.
    private _planetRadiusWithOffset = 0;
    private _planetRadiusSquared = 0;
    private _atmosphereRadius = 0;
    private _atmosphereRadiusSquared = 0;
    private _horizonDistanceToAtmosphereEdge = 0;
    private _horizonDistanceToAtmosphereEdgeSquared = 0;
    private _rayleighScattering = new Vector3();
    private _mieScattering = new Vector3();
    private _mieAbsorption = new Vector3();
    private _mieExtinction = new Vector3();
    private _ozoneAbsorption = new Vector3();

    /**
     * The radius of the planet in kilometers.
     */
    public get planetRadius(): number {
        return this._planetRadius;
    }
    public set planetRadius(value: number) {
        if (this._planetRadius !== value) {
            this._planetRadius = value;
            this._recomputeDimensionalParameters();
            this.onChangedObservable.notifyObservers(this);
        }
    }

    /**
     * The squared radius of the planet in kilometers.
     */
    public get planetRadiusSquared(): number {
        return this._planetRadiusSquared;
    }

    /**
     * Offset applied to view points near the planet's surface. This should be greater than 0.
     * It prevents rendering issues close to the planet's surface.
     */
    public get planetRadiusOffset(): number {
        return this._planetRadiusOffset;
    }
    public set planetRadiusOffset(value: number) {
        if (this._planetRadiusOffset !== value) {
            this._planetRadiusOffset = value;
            this._recomputeDimensionalParameters();
            this.onChangedObservable.notifyObservers(this);
        }
    }

    /**
     * This is the {@link planetRadius} with the additional {@link planetRadiusOffset}, in kilometers.
     */
    public get planetRadiusWithOffset(): number {
        return this._planetRadiusWithOffset;
    }

    /**
     * The thickness of the atmosphere measured in kilometers.
     */
    public get atmosphereThickness(): number {
        return this._atmosphereThickness;
    }
    public set atmosphereThickness(value: number) {
        if (this._atmosphereThickness !== value) {
            this._atmosphereThickness = value;
            this._recomputeDimensionalParameters();
            this.onChangedObservable.notifyObservers(this);
        }
    }

    /**
     * The combined planet radius and atmosphere thickness in kilometers.
     */
    public get atmosphereRadius(): number {
        return this._atmosphereRadius;
    }

    /**
     * The atmosphere radius squared in kilometers.
     */
    public get atmosphereRadiusSquared(): number {
        return this._atmosphereRadiusSquared;
    }

    /**
     * Horizon distance from the planet's surface to the outer edge of the atmosphere in kilometers.
     */
    public get horizonDistanceToAtmosphereEdge(): number {
        return this._horizonDistanceToAtmosphereEdge;
    }

    /**
     * Horizon distance from the planet's surface to the outer edge of the atmosphere, squared, in kilometers.
     */
    public get horizonDistanceToAtmosphereEdgeSquared(): number {
        return this._horizonDistanceToAtmosphereEdgeSquared;
    }

    /**
     * The scale applied to {@link peakRayleighScattering}.
     */
    public get rayleighScatteringScale(): number {
        return this._rayleighScatteringScale;
    }
    public set rayleighScatteringScale(value: number) {
        if (this._rayleighScatteringScale !== value) {
            this._rayleighScatteringScale = value;
            this._recomputeRayleighScattering();
            this.onChangedObservable.notifyObservers(this);
        }
    }

    /**
     * The Rayleigh scattering per kilometer at sea level for red, green, and blue wavelengths.
     */
    public get peakRayleighScattering(): Vector3 {
        return this._peakRayleighScattering;
    }
    public set peakRayleighScattering(value: Vector3) {
        if (!this._peakRayleighScattering.equals(value)) {
            this._peakRayleighScattering.copyFrom(value);
            this._recomputeRayleighScattering();
            this.onChangedObservable.notifyObservers(this);
        }
    }

    /**
     * The Rayleigh scattering per kilometer at sea level for red, green, and blue wavelengths.
     * This value cannot be set directly. It is inferred by scaling {@link peakRayleighScattering} by {@link rayleighScatteringScale}.
     */
    public get rayleighScattering(): Vector3 {
        return this._rayleighScattering;
    }

    /**
     * The scale applied to {@link peakMieScattering}.
     */
    public get mieScatteringScale(): number {
        return this._mieScatteringScale;
    }
    public set mieScatteringScale(value: number) {
        if (this._mieScatteringScale !== value) {
            this._mieScatteringScale = value;
            this._recomputeMieScattering();
            this.onChangedObservable.notifyObservers(this);
        }
    }

    /**
     * The Mie scattering per kilometer at sea level for red, green, and blue wavelengths.
     */
    public get peakMieScattering(): Vector3 {
        return this._peakMieScattering;
    }
    public set peakMieScattering(value: Vector3) {
        if (!this._peakMieScattering.equals(value)) {
            this._peakMieScattering.copyFrom(value);
            this._recomputeMieScattering();
            this.onChangedObservable.notifyObservers(this);
        }
    }

    /**
     * The Mie scattering per kilometer at sea level for red, green, and blue wavelengths.
     * This value cannot be set directly. It is inferred by scaling {@link mieScatteringScale} by {@link peakMieScattering}.
     */
    public get mieScattering(): Vector3 {
        return this._mieScattering;
    }

    /**
     * The scale applied to {@link peakMieAbsorption}.
     */
    public get mieAbsorptionScale(): number {
        return this._mieAbsorptionScale;
    }
    public set mieAbsorptionScale(value: number) {
        if (this._mieAbsorptionScale !== value) {
            this._mieAbsorptionScale = value;
            this._recomputeMieAbsorption();
            this.onChangedObservable.notifyObservers(this);
        }
    }

    /**
     * The Mie absorption per kilometer at sea level for red, green, and blue wavelengths.
     */
    public get peakMieAbsorption(): Vector3 {
        return this._peakMieAbsorption;
    }
    public set peakMieAbsorption(value: Vector3) {
        if (!this._peakMieAbsorption.equals(value)) {
            this._peakMieAbsorption.copyFrom(value);
            this._recomputeMieAbsorption();
            this.onChangedObservable.notifyObservers(this);
        }
    }

    /**
     * The Mie absorption per kilometer at sea level for red, green, and blue wavelengths.
     * This value cannot be set directly. It is inferred by scaling {@link mieAbsorptionScale} by {@link peakMieAbsorption}.
     */
    public get mieAbsorption(): Vector3 {
        return this._mieAbsorption;
    }

    /**
     * The Mie extinction per kilometer at sea level for red, green, and blue wavelengths.
     * This value cannot be set directly. It is inferred by adding the {@link mieAbsorption} to the {@link mieScattering}.
     */
    public get mieExtinction(): Vector3 {
        return this._mieExtinction;
    }

    /**
     * The scale applied to {@link peakOzoneAbsorption}.
     */
    public get ozoneAbsorptionScale(): number {
        return this._ozoneAbsorptionScale;
    }
    public set ozoneAbsorptionScale(value: number) {
        if (this._ozoneAbsorptionScale !== value) {
            this._ozoneAbsorptionScale = value;
            this._recomputeOzoneAbsorption();
            this.onChangedObservable.notifyObservers(this);
        }
    }

    /**
     * The ozone absorption per kilometer measured at a height corresponding to it's peak concentration,
     * for red, green, and blue wavelengths.
     */
    public get peakOzoneAbsorption(): Vector3 {
        return this._peakOzoneAbsorption;
    }
    public set peakOzoneAbsorption(value: Vector3) {
        if (!this._peakOzoneAbsorption.equals(value)) {
            this._peakOzoneAbsorption.copyFrom(value);
            this._recomputeOzoneAbsorption();
            this.onChangedObservable.notifyObservers(this);
        }
    }

    /**
     * The ozone absorption per kilometer at sea level for red, green, and blue wavelengths.
     * This value cannot be set directly. It is inferred by scaling {@link peakOzoneAbsorption} by {@link ozoneAbsorptionScale}.
     */
    public get ozoneAbsorption(): Vector3 {
        return this._ozoneAbsorption;
    }

    /**
     * Constructs the {@link AtmospherePhysicalProperties}.
     * @param options - The options for the {@link AtmospherePhysicalProperties}.
     */
    constructor(options?: IAtmospherePhysicalPropertiesOptions) {
        this._planetRadius = options?.planetRadius ?? DefaultPlanetRadius;
        this._planetRadiusOffset = options?.planetRadiusOffset ?? DefaultPlanetRadiusOffset;
        this._atmosphereThickness = options?.atmosphereThickness ?? DefaultAtmosphereThickness;
        this._rayleighScatteringScale = options?.rayleighScatteringScale ?? 1.0;
        this._peakRayleighScattering.copyFrom(options?.peakRayleighScattering ?? DefaultPeakRayleighScattering);
        this._mieScatteringScale = options?.mieScatteringScale ?? 1.0;
        this._peakMieScattering.copyFrom(options?.peakMieScattering ?? DefaultPeakMieScattering);
        this._mieAbsorptionScale = options?.mieAbsorptionScale ?? 1.0;
        this._peakMieAbsorption.copyFrom(options?.peakMieAbsorption ?? DefaultPeakMieAbsorption);
        this._ozoneAbsorptionScale = options?.ozoneAbsorptionScale ?? 1.0;
        this._peakOzoneAbsorption.copyFrom(options?.peakOzoneAbsorption ?? DefaultPeakOzoneAbsorption);

        // Compute inferred values.
        this._recomputeDimensionalParameters();
        this._recomputeRayleighScattering();
        this._recomputeMieScattering();
        this._recomputeMieAbsorption();
        this._recomputeOzoneAbsorption();
    }

    private _recomputeDimensionalParameters(): void {
        this._planetRadiusWithOffset = this._planetRadius + this._planetRadiusOffset;
        this._planetRadiusSquared = this._planetRadius * this._planetRadius;
        this._atmosphereRadius = this._planetRadius + this._atmosphereThickness;
        this._atmosphereRadiusSquared = this._atmosphereRadius * this._atmosphereRadius;
        this._horizonDistanceToAtmosphereEdgeSquared = this._atmosphereRadiusSquared - this._planetRadiusSquared;
        this._horizonDistanceToAtmosphereEdge = Math.sqrt(this._horizonDistanceToAtmosphereEdgeSquared);
    }

    private _recomputeRayleighScattering(): void {
        this._peakRayleighScattering.scaleToRef(this._rayleighScatteringScale, this._rayleighScattering);
    }

    private _recomputeMieScattering(): void {
        this._peakMieScattering.scaleToRef(this._mieScatteringScale, this._mieScattering);
        this._recomputeMieExtinction();
    }

    private _recomputeMieAbsorption(): void {
        this._peakMieAbsorption.scaleToRef(this._mieAbsorptionScale, this._mieAbsorption);
        this._recomputeMieExtinction();
    }

    private _recomputeMieExtinction(): void {
        this._mieAbsorption.addToRef(this._mieScattering, this._mieExtinction);
    }

    private _recomputeOzoneAbsorption(): void {
        this._peakOzoneAbsorption.scaleToRef(this._ozoneAbsorptionScale, this._ozoneAbsorption);
    }
}
