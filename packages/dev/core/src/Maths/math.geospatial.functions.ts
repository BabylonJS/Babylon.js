import type { DeepImmutable } from "../types";
import type { ILatLonLike } from "./math.geospatial";
import type { IVector3Like } from "./math.like";
import { Vector3FromFloatsToRef } from "./math.vector.functions";

/**
 * Computes the normal (up direction) in ECEF (Earth-Centered, Earth-Fixed) coordinates from the specified latitude and longitude.
 * @param latLon - The latitude and longitude in radians
 * @param result - The resulting normal
 * @returns The resulting normal
 */
export function LatLonToNormalToRef<T extends IVector3Like>(latLon: DeepImmutable<ILatLonLike>, result: T): T {
    const cosLat = Math.cos(latLon.lat);
    return Vector3FromFloatsToRef(cosLat * Math.cos(latLon.lon), cosLat * Math.sin(latLon.lon), Math.sin(latLon.lat), result);
}
