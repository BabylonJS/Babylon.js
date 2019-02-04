import { Vector3 } from 'babylonjs/Maths/math';
import { Tools } from 'babylonjs/Misc/tools';
import { TextureCube, PixelFormat, PixelType } from './texture';

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
export type MapType =
    'irradiance_sh_coefficients_9' |
    'cubemap_faces';

/**
 * Image type used for environment map
 */
export type ImageType = 'png';

//Payload Descriptor

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
export type CubemapFaces = ImageSet<Array<ByteRange>>;

/**
 * A single image containing an atlas of equirectangular-projection maps across all mip levels
 */
export type EquirectangularMipmapAtlas = ImageSet<ByteRange>;

/**
 * A static class proving methods to aid parsing Spectre environment files
 */
export class EnvironmentDeserializer {

    /**
     * Parses an arraybuffer into a new PBREnvironment object
     * @param arrayBuffer The arraybuffer of the Spectre environment file
     * @return a PBREnvironment object
     */
    public static Parse(arrayBuffer: ArrayBuffer): PBREnvironment {
        var environment: PBREnvironment = {
            //irradiance
            irradiancePolynomialCoefficients: {
                x: new Vector3(0, 0, 0),
                y: new Vector3(0, 0, 0),
                z: new Vector3(0, 0, 0),
                xx: new Vector3(0, 0, 0),
                yy: new Vector3(0, 0, 0),
                zz: new Vector3(0, 0, 0),
                yz: new Vector3(0, 0, 0),
                zx: new Vector3(0, 0, 0),
                xy: new Vector3(0, 0, 0)
            },

            //specular
            textureIntensityScale: 1.0,
        };

        //read .env
        let littleEndian = false;

        let magicBytes = [0x86, 0x16, 0x87, 0x96, 0xf6, 0xd6, 0x96, 0x36];

        let dataView = new DataView(arrayBuffer);
        let pos = 0;

        for (let i = 0; i < magicBytes.length; i++) {
            if (dataView.getUint8(pos++) !== magicBytes[i]) {
                Tools.Error('Not a Spectre environment map');
            }
        }

        let version = dataView.getUint16(pos, littleEndian); pos += 2;

        if (version !== 1) {
            Tools.Warn('Unsupported Spectre environment map version "' + version + '"');
        }

        //read json descriptor - collect characters up to null terminator
        let descriptorString = '';
        let charCode = 0x00;
        while ((charCode = dataView.getUint8(pos++))) {
            descriptorString += String.fromCharCode(charCode);
        }

        let descriptor: EnvJsonDescriptor = JSON.parse(descriptorString);

        let payloadPos = pos;

        //irradiance
        switch (descriptor.irradiance.type) {
            case 'irradiance_sh_coefficients_9':
                //irradiance
                let harmonics = <IrradianceSHCoefficients9>descriptor.irradiance;

                EnvironmentDeserializer._ConvertSHIrradianceToLambertianRadiance(harmonics);

                //harmonics now represent radiance
                EnvironmentDeserializer._ConvertSHToSP(harmonics, environment.irradiancePolynomialCoefficients);
                break;
            default:
                Tools.Error('Unhandled MapType descriptor.irradiance.type (' + descriptor.irradiance.type + ')');
        }

        //specular
        switch (descriptor.specular.type) {
            case 'cubemap_faces':

                var specularDescriptor = <CubemapFaces>descriptor.specular;

                let specularTexture = environment.specularTexture = new TextureCube(PixelFormat.RGBA, PixelType.UNSIGNED_BYTE);
                environment.textureIntensityScale = specularDescriptor.multiplier != null ? specularDescriptor.multiplier : 1.0;

                let mipmaps = specularDescriptor.mipmaps;
                let imageType = specularDescriptor.imageType;

                for (let l = 0; l < mipmaps.length; l++) {
                    let faceRanges = mipmaps[l];

                    specularTexture.source[l] = [];

                    for (let i = 0; i < 6; i++) {

                        let range = faceRanges[i];
                        let bytes = new Uint8Array(arrayBuffer, payloadPos + range.pos, range.length);

                        switch (imageType) {
                            case 'png':

                                //construct image element from bytes
                                let image = new Image();
                                let src = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }));
                                image.src = src;
                                specularTexture.source[l][i] = image;

                                break;
                            default:
                                Tools.Error('Unhandled ImageType descriptor.specular.imageType (' + imageType + ')');
                        }
                    }
                }

                break;
            default:
                Tools.Error('Unhandled MapType descriptor.specular.type (' + descriptor.specular.type + ')');
        }

        return environment;
    }

    /**
     * Convert from irradiance to outgoing radiance for Lambertian BDRF, suitable for efficient shader evaluation.
     *	  L = (1/pi) * E * rho
     *
     * This is done by an additional scale by 1/pi, so is a fairly trivial operation but important conceptually.
     * @param harmonics Spherical harmonic coefficients (9)
     */
    private static _ConvertSHIrradianceToLambertianRadiance(harmonics: any): void {
        EnvironmentDeserializer._ScaleSH(harmonics, 1 / Math.PI);
        // The resultant SH now represents outgoing radiance, so includes the Lambert 1/pi normalisation factor but without albedo (rho) applied
        // (The pixel shader must apply albedo after texture fetches, etc).
    }

    /**
     * Convert spherical harmonics to spherical polynomial coefficients
     * @param harmonics Spherical harmonic coefficients (9)
     * @param outPolynomialCoefficents Polynomial coefficients (9) object to store result
     */
    private static _ConvertSHToSP(harmonics: any, outPolynomialCoefficents: SphericalPolynomalCoefficients) {
        const rPi = 1 / Math.PI;

        //x
        outPolynomialCoefficents.x.x = 1.02333 * harmonics.l11[0] * rPi;
        outPolynomialCoefficents.x.y = 1.02333 * harmonics.l11[1] * rPi;
        outPolynomialCoefficents.x.z = 1.02333 * harmonics.l11[2] * rPi;

        outPolynomialCoefficents.y.x = 1.02333 * harmonics.l1_1[0] * rPi;
        outPolynomialCoefficents.y.y = 1.02333 * harmonics.l1_1[1] * rPi;
        outPolynomialCoefficents.y.z = 1.02333 * harmonics.l1_1[2] * rPi;

        outPolynomialCoefficents.z.x = 1.02333 * harmonics.l10[0] * rPi;
        outPolynomialCoefficents.z.y = 1.02333 * harmonics.l10[1] * rPi;
        outPolynomialCoefficents.z.z = 1.02333 * harmonics.l10[2] * rPi;

        //xx
        outPolynomialCoefficents.xx.x = (0.886277 * harmonics.l00[0] - 0.247708 * harmonics.l20[0] + 0.429043 * harmonics.l22[0]) * rPi;
        outPolynomialCoefficents.xx.y = (0.886277 * harmonics.l00[1] - 0.247708 * harmonics.l20[1] + 0.429043 * harmonics.l22[1]) * rPi;
        outPolynomialCoefficents.xx.z = (0.886277 * harmonics.l00[2] - 0.247708 * harmonics.l20[2] + 0.429043 * harmonics.l22[2]) * rPi;

        outPolynomialCoefficents.yy.x = (0.886277 * harmonics.l00[0] - 0.247708 * harmonics.l20[0] - 0.429043 * harmonics.l22[0]) * rPi;
        outPolynomialCoefficents.yy.y = (0.886277 * harmonics.l00[1] - 0.247708 * harmonics.l20[1] - 0.429043 * harmonics.l22[1]) * rPi;
        outPolynomialCoefficents.yy.z = (0.886277 * harmonics.l00[2] - 0.247708 * harmonics.l20[2] - 0.429043 * harmonics.l22[2]) * rPi;

        outPolynomialCoefficents.zz.x = (0.886277 * harmonics.l00[0] + 0.495417 * harmonics.l20[0]) * rPi;
        outPolynomialCoefficents.zz.y = (0.886277 * harmonics.l00[1] + 0.495417 * harmonics.l20[1]) * rPi;
        outPolynomialCoefficents.zz.z = (0.886277 * harmonics.l00[2] + 0.495417 * harmonics.l20[2]) * rPi;

        //yz
        outPolynomialCoefficents.yz.x = 0.858086 * harmonics.l2_1[0] * rPi;
        outPolynomialCoefficents.yz.y = 0.858086 * harmonics.l2_1[1] * rPi;
        outPolynomialCoefficents.yz.z = 0.858086 * harmonics.l2_1[2] * rPi;

        outPolynomialCoefficents.zx.x = 0.858086 * harmonics.l21[0] * rPi;
        outPolynomialCoefficents.zx.y = 0.858086 * harmonics.l21[1] * rPi;
        outPolynomialCoefficents.zx.z = 0.858086 * harmonics.l21[2] * rPi;

        outPolynomialCoefficents.xy.x = 0.858086 * harmonics.l2_2[0] * rPi;
        outPolynomialCoefficents.xy.y = 0.858086 * harmonics.l2_2[1] * rPi;
        outPolynomialCoefficents.xy.z = 0.858086 * harmonics.l2_2[2] * rPi;
    }

    /**
     * Multiplies harmonic coefficients in place
     * @param harmonics Spherical harmonic coefficients (9)
     * @param scaleFactor Value to multiply by
     */
    private static _ScaleSH(harmonics: any, scaleFactor: number) {
        harmonics.l00[0] *= scaleFactor;
        harmonics.l00[1] *= scaleFactor;
        harmonics.l00[2] *= scaleFactor;
        harmonics.l1_1[0] *= scaleFactor;
        harmonics.l1_1[1] *= scaleFactor;
        harmonics.l1_1[2] *= scaleFactor;
        harmonics.l10[0] *= scaleFactor;
        harmonics.l10[1] *= scaleFactor;
        harmonics.l10[2] *= scaleFactor;
        harmonics.l11[0] *= scaleFactor;
        harmonics.l11[1] *= scaleFactor;
        harmonics.l11[2] *= scaleFactor;
        harmonics.l2_2[0] *= scaleFactor;
        harmonics.l2_2[1] *= scaleFactor;
        harmonics.l2_2[2] *= scaleFactor;
        harmonics.l2_1[0] *= scaleFactor;
        harmonics.l2_1[1] *= scaleFactor;
        harmonics.l2_1[2] *= scaleFactor;
        harmonics.l20[0] *= scaleFactor;
        harmonics.l20[1] *= scaleFactor;
        harmonics.l20[2] *= scaleFactor;
        harmonics.l21[0] *= scaleFactor;
        harmonics.l21[1] *= scaleFactor;
        harmonics.l21[2] *= scaleFactor;
        harmonics.l22[0] *= scaleFactor;
        harmonics.l22[1] *= scaleFactor;
        harmonics.l22[2] *= scaleFactor;
    }
}
