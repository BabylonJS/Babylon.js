import { Vector3 } from "babylonjs";
import { TextureCube } from './texture';
/**
 * Spherical polynomial coefficients (counter part to spherical harmonic coefficients used in shader irradiance calculation)
 * @ignoreChildren
 */
export interface SphericalPolynomalCoefficients {
    x: Vector3;
    y: Vector3;
    z: Vector3;
    xx: Vector3;
    yy: Vector3;
    zz: Vector3;
    yz: Vector3;
    zx: Vector3;
    xy: Vector3;
}
/**
 * Wraps data and maps required for environments with physically based rendering
 */
export interface PBREnvironment {
    /**
     * Spherical Polynomial Coefficients representing an irradiance map
     */
    irradiancePolynomialCoefficients: SphericalPolynomalCoefficients;
    /**
     * Specular cubemap
     */
    specularTexture?: TextureCube;
    /**
     * A scale factor applied to RGB values after reading from environment maps
     */
    textureIntensityScale: number;
}
/**
         * Environment map representations: layouts, projections and approximations
         */
export declare type MapType = 'irradiance_sh_coefficients_9' | 'cubemap_faces';
/**
 * Image type used for environment map
 */
export declare type ImageType = 'png';
/**
 * A generic field in JSON that report's its type
 */
export interface TypedObject<T> {
    type: T;
}
/**
 * Describes a range of bytes starting at byte pos (inclusive) and finishing at byte pos + length - 1
 */
export interface ByteRange {
    pos: number;
    length: number;
}
/**
 * Complete Spectre Environment JSON Descriptor
 */
export interface EnvJsonDescriptor {
    radiance: TypedObject<MapType>;
    irradiance: TypedObject<MapType>;
    specular: TypedObject<MapType>;
}
/**
 * Spherical harmonic coefficients to provide an irradiance map
 */
export interface IrradianceSHCoefficients9 extends TypedObject<MapType> {
    l00: Array<number>;
    l1_1: Array<number>;
    l10: Array<number>;
    l11: Array<number>;
    l2_2: Array<number>;
    l2_1: Array<number>;
    l20: Array<number>;
    l21: Array<number>;
    l22: Array<number>;
}
/**
 * A generic set of images, where the image content is specified by byte ranges in the mipmaps field
 */
export interface ImageSet<T> extends TypedObject<MapType> {
    imageType: ImageType;
    width: number;
    height: number;
    mipmaps: Array<T>;
    multiplier: number;
}
/**
 * A set of cubemap faces
 */
export declare type CubemapFaces = ImageSet<Array<ByteRange>>;
/**
 * A single image containing an atlas of equirectangular-projection maps across all mip levels
 */
export declare type EquirectangularMipmapAtlas = ImageSet<ByteRange>;
/**
 * A static class proving methods to aid parsing Spectre environment files
 */
export declare class EnvironmentDeserializer {
    /**
     * Parses an arraybuffer into a new PBREnvironment object
     * @param arrayBuffer The arraybuffer of the Spectre environment file
     * @return a PBREnvironment object
     */
    static Parse(arrayBuffer: ArrayBuffer): PBREnvironment;
    /**
     * Convert from irradiance to outgoing radiance for Lambertian BDRF, suitable for efficient shader evaluation.
     *	  L = (1/pi) * E * rho
     *
     * This is done by an additional scale by 1/pi, so is a fairly trivial operation but important conceptually.
     * @param harmonics Spherical harmonic coefficients (9)
     */
    private static _ConvertSHIrradianceToLambertianRadiance(harmonics);
    /**
     * Convert spherical harmonics to spherical polynomial coefficients
     * @param harmonics Spherical harmonic coefficients (9)
     * @param outPolynomialCoefficents Polynomial coefficients (9) object to store result
     */
    private static _ConvertSHToSP(harmonics, outPolynomialCoefficents);
    /**
     * Multiplies harmonic coefficients in place
     * @param harmonics Spherical harmonic coefficients (9)
     * @param scaleFactor Value to multiply by
     */
    private static _ScaleSH(harmonics, scaleFactor);
}
