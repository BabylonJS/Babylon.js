/** Latitude and longitude. */
export interface ILatLonLike {
    /** Latitude in radians. */
    lat: number;
    /** Longitude in radians. */
    lon: number;
}

/** Latitude, longitude, and altitude. */
export interface ILatLonAltLike extends ILatLonLike {
    /** The height above the surface. */
    alt: number;
}
