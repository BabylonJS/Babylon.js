/** Latitude and longitude. */
export interface ILatLonLike {
    /** Latitude in radians. Range: [-π/2, π/2]. */
    lat: number;
    /** Longitude in radians. */
    lon: number;
}

/** Latitude, longitude, and altitude. */
export interface ILatLonAltLike extends ILatLonLike {
    /** The height above the surface. */
    alt: number;
}
