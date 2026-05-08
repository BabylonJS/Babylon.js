import { Clamp } from "./math.scalar.functions";
import { type DeepImmutable } from "../types";
import { type IEllipsoidLike, type ILatLonAltLike, type ILatLonLike } from "./math.geospatial";
import { type IVector3Like } from "./math.like";
import { Vector3FromFloatsToRef } from "./math.vector.functions";

const HalfPi = Math.PI / 2;
const DegreesToRadians = Math.PI / 180;

const EllipsoidFromSemiMajorAxisAndInverseFlattening = (semiMajorAxis: number, inverseFlattening: number): IEllipsoidLike => {
    const flattening = 1 / inverseFlattening;
    const semiMinorAxis = semiMajorAxis * (1 - flattening);
    const firstEccentricitySquared = 2 * flattening - flattening * flattening;
    const secondEccentricitySquared = firstEccentricitySquared / (1 - firstEccentricitySquared);
    return { semiMajorAxis, semiMinorAxis, flattening, firstEccentricitySquared, secondEccentricitySquared };
};

/**
 * The WGS84 reference ellipsoid used for Earth-related geospatial functions.
 * Derived from the semi-major axis (meters) and the inverse flattening.
 */
export const Wgs84Ellipsoid: DeepImmutable<IEllipsoidLike> = Object.freeze(EllipsoidFromSemiMajorAxisAndInverseFlattening(6378137.0, 298.257223563));

/**
 * Converts the latitude and longitude specified in degrees to an {@link ILatLonLike} in radians.
 * @param lat - The latitude in degrees
 * @param lon - The longitude in degrees
 * @param result - The resulting {@link ILatLonLike} in radians
 * @returns The resulting {@link ILatLonLike} in radians
 */
export function LatLonFromDegreesToRef<T extends ILatLonLike>(lat: number, lon: number, result: T): T {
    result.lat = lat * DegreesToRadians;
    result.lon = lon * DegreesToRadians;
    return result;
}

/**
 * Computes the normal (up direction) in ECEF (Earth-Centered, Earth-Fixed) coordinates from the specified latitude and longitude in radians.
 * For the calculation, latitude is clamped to -PI/2 to PI/2.
 * @param latLon - The latitude and longitude in radians
 * @param result - The resulting normal
 * @returns The resulting normal
 */
export function LatLonToNormalToRef<T extends IVector3Like>(latLon: DeepImmutable<ILatLonLike>, result: T): T {
    const lat = Clamp(latLon.lat, -HalfPi, HalfPi);
    const cosLat = Math.cos(lat);
    return Vector3FromFloatsToRef(cosLat * Math.cos(latLon.lon), cosLat * Math.sin(latLon.lon), Math.sin(lat), result);
}

/**
 * Converts latitude, longitude, and altitude to an ECEF (Earth-Centered, Earth-Fixed) position using the specified ellipsoid.
 * For the calculation, latitude is clamped to -PI/2 to PI/2.
 * @param latLonAlt - The latitude and longitude in radians, and the altitude relative to the reference ellipsoid's surface.
 * @param ellipsoid - Parameters for a reference ellipsoid (e.g., the {@link Wgs84Ellipsoid}).
 * @param result - The resulting ECEF position
 * @returns The resulting ECEF position
 */
export function EcefFromLatLonAltToRef<T extends IVector3Like>(
    latLonAlt: DeepImmutable<ILatLonAltLike>,
    ellipsoid: DeepImmutable<Pick<IEllipsoidLike, "semiMajorAxis" | "firstEccentricitySquared">>,
    result: T
): T {
    const lat = Clamp(latLonAlt.lat, -HalfPi, HalfPi);
    const { lon, alt } = latLonAlt;
    const { semiMajorAxis, firstEccentricitySquared } = ellipsoid;
    const sinLat = Math.sin(lat);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const N = semiMajorAxis / Math.sqrt(1 - firstEccentricitySquared * sinLat * sinLat);
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const NPlusAltTimesCosLat = (N + alt) * Math.cos(lat);
    return Vector3FromFloatsToRef(NPlusAltTimesCosLat * Math.cos(lon), NPlusAltTimesCosLat * Math.sin(lon), (N * (1 - firstEccentricitySquared) + alt) * sinLat, result);
}
