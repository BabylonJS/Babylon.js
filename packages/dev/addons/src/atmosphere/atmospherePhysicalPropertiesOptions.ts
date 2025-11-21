// Copyright (c) Microsoft Corporation.
// MIT License

import type { Vector3 } from "core/Maths/math.vector";

/**
 * The options for the {@link AtmospherePhysicalProperties} that describe the planet, the atmosphere, and scattering.
 */
export interface IAtmospherePhysicalPropertiesOptions {
    /**
     * The radius of the planet in kilometers.
     */
    planetRadius?: number;

    /**
     * The minimum camera radius (distance from the planet's center) allowed when rendering the atmosphere.
     * This should be greater than 0.
     * It prevents rendering issues close to the planet's surface.
     */
    planetRadiusOffset?: number;

    /**
     * The thickness of the atmosphere measured in kilometers from the planet's surface to the outer edge of the atmosphere.
     */
    atmosphereThickness?: number;

    /**
     * The scale applied to the Rayleigh scattering.
     */
    rayleighScatteringScale?: number;

    /**
     * The Rayleigh scattering per kilometer at sea level for red, green, and blue wavelengths.
     */
    peakRayleighScattering?: Vector3;

    /**
     * The scale applied to the Mie scattering.
     */
    mieScatteringScale?: number;

    /**
     * The Mie scattering per kilometer at sea level for red, green, and blue wavelengths.
     */
    peakMieScattering?: Vector3;

    /**
     * The scale applied to the Mie absorption.
     */
    mieAbsorptionScale?: number;

    /**
     * The Mie absorption per kilometer at sea level for red, green, and blue wavelengths.
     */
    peakMieAbsorption?: Vector3;

    /**
     * The scale applied to the ozone absorption.
     */
    ozoneAbsorptionScale?: number;

    /**
     * The ozone absorption per kilometer at sea level for red, green, and blue wavelengths.
     */
    peakOzoneAbsorption?: Vector3;
}
