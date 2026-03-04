import { Clamp } from "./math.scalar.functions";
import type { DeepImmutable } from "../types";
import type { ILatLonLike } from "./math.geospatial";
import type { IVector3Like } from "./math.like";
import { Vector3FromFloatsToRef } from "./math.vector.functions";

/**
 * Converts the latitude and longitude specified in degrees to an {@link ILatLonLike} in radians.
 * @param lat - The latitude in degrees
 * @param lon - The longitude in degrees
 * @param result - The resulting {@link ILatLonLike} in radians
 * @returns The resulting {@link ILatLonLike} in radians
 */
export function LatLonFromDegreesToRef<T extends ILatLonLike>(lat: number, lon: number, result: T): T {
    result.lat = (lat * Math.PI) / 180;
    result.lon = (lon * Math.PI) / 180;
    return result;
}

/**
 * Computes the normal (up direction) in ECEF (Earth-Centered, Earth-Fixed) coordinates from the specified latitude and longitude in radians.
 * Will clamp the latitude to -PI/2 to PI/2.
 * @param latLon - The latitude and longitude in radians
 * @param result - The resulting normal
 * @returns The resulting normal
 */
export function LatLonToNormalToRef<T extends IVector3Like>(latLon: DeepImmutable<ILatLonLike>, result: T): T {
    const lat = Clamp(latLon.lat, -Math.PI / 2, Math.PI / 2);
    const cosLat = Math.cos(lat);
    return Vector3FromFloatsToRef(cosLat * Math.cos(latLon.lon), cosLat * Math.sin(latLon.lon), Math.sin(lat), result);
}
