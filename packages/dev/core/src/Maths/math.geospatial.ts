/** Latitude and longitude in radians. */
export interface ILatLonLike {
    /** Latitude in radians. */
    lat: number;
    /** Longitude in radians. */
    lon: number;
}

/** Latitude and longitude in radians, and altitude, typically meters. */
export interface ILatLonAltLike extends ILatLonLike {
    /** The height above the surface, typically meters. */
    alt: number;
}

/**
 * A reference ellipsoid used for geospatial functions.
 */
export interface IEllipsoidLike {
    /** The larger radius for the ellipsoid. */
    semiMajorAxis: number;
    /** The smaller radius for the ellipsoid. */
    semiMinorAxis: number;
    /** The flattening for the ellipsoid. Zero for a sphere. */
    flattening: number;
    /** The first eccentricity, squared. */
    firstEccentricitySquared: number;
    /** The second eccentricity, squared. */
    secondEccentricitySquared: number;
}
