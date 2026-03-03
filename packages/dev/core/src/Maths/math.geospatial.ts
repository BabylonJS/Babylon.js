/** Latitude and longitude in radians. */
export interface ILatLonLike {
    /** Latitude in radians. */
    lat: number;
    /** Longitude in radians. */
    lon: number;
}

/** Latitude and longitude in radians, and altitude in meters. */
export interface ILatLonAltLike extends ILatLonLike {
    /** The height above the surface in meters. */
    alt: number;
}
