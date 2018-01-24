var __extends = (this && this.__extends) || (function () {
var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
return function (d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
})();


import * as BABYLON from 'babylonjs/core/es6';
var BABYLON;
(function (BABYLON) {
    var SphericalPolynomial = /** @class */ (function () {
        function SphericalPolynomial() {
            this.x = BABYLON.Vector3.Zero();
            this.y = BABYLON.Vector3.Zero();
            this.z = BABYLON.Vector3.Zero();
            this.xx = BABYLON.Vector3.Zero();
            this.yy = BABYLON.Vector3.Zero();
            this.zz = BABYLON.Vector3.Zero();
            this.xy = BABYLON.Vector3.Zero();
            this.yz = BABYLON.Vector3.Zero();
            this.zx = BABYLON.Vector3.Zero();
        }
        SphericalPolynomial.prototype.addAmbient = function (color) {
            var colorVector = new BABYLON.Vector3(color.r, color.g, color.b);
            this.xx = this.xx.add(colorVector);
            this.yy = this.yy.add(colorVector);
            this.zz = this.zz.add(colorVector);
        };
        SphericalPolynomial.getSphericalPolynomialFromHarmonics = function (harmonics) {
            var result = new SphericalPolynomial();
            result.x = harmonics.L11.scale(1.02333);
            result.y = harmonics.L1_1.scale(1.02333);
            result.z = harmonics.L10.scale(1.02333);
            result.xx = harmonics.L00.scale(0.886277).subtract(harmonics.L20.scale(0.247708)).add(harmonics.L22.scale(0.429043));
            result.yy = harmonics.L00.scale(0.886277).subtract(harmonics.L20.scale(0.247708)).subtract(harmonics.L22.scale(0.429043));
            result.zz = harmonics.L00.scale(0.886277).add(harmonics.L20.scale(0.495417));
            result.yz = harmonics.L2_1.scale(0.858086);
            result.zx = harmonics.L21.scale(0.858086);
            result.xy = harmonics.L2_2.scale(0.858086);
            result.scale(1.0 / Math.PI);
            return result;
        };
        SphericalPolynomial.prototype.scale = function (scale) {
            this.x = this.x.scale(scale);
            this.y = this.y.scale(scale);
            this.z = this.z.scale(scale);
            this.xx = this.xx.scale(scale);
            this.yy = this.yy.scale(scale);
            this.zz = this.zz.scale(scale);
            this.yz = this.yz.scale(scale);
            this.zx = this.zx.scale(scale);
            this.xy = this.xy.scale(scale);
        };
        return SphericalPolynomial;
    }());
    BABYLON.SphericalPolynomial = SphericalPolynomial;
    var SphericalHarmonics = /** @class */ (function () {
        function SphericalHarmonics() {
            this.L00 = BABYLON.Vector3.Zero();
            this.L1_1 = BABYLON.Vector3.Zero();
            this.L10 = BABYLON.Vector3.Zero();
            this.L11 = BABYLON.Vector3.Zero();
            this.L2_2 = BABYLON.Vector3.Zero();
            this.L2_1 = BABYLON.Vector3.Zero();
            this.L20 = BABYLON.Vector3.Zero();
            this.L21 = BABYLON.Vector3.Zero();
            this.L22 = BABYLON.Vector3.Zero();
        }
        SphericalHarmonics.prototype.addLight = function (direction, color, deltaSolidAngle) {
            var colorVector = new BABYLON.Vector3(color.r, color.g, color.b);
            var c = colorVector.scale(deltaSolidAngle);
            this.L00 = this.L00.add(c.scale(0.282095));
            this.L1_1 = this.L1_1.add(c.scale(0.488603 * direction.y));
            this.L10 = this.L10.add(c.scale(0.488603 * direction.z));
            this.L11 = this.L11.add(c.scale(0.488603 * direction.x));
            this.L2_2 = this.L2_2.add(c.scale(1.092548 * direction.x * direction.y));
            this.L2_1 = this.L2_1.add(c.scale(1.092548 * direction.y * direction.z));
            this.L21 = this.L21.add(c.scale(1.092548 * direction.x * direction.z));
            this.L20 = this.L20.add(c.scale(0.315392 * (3.0 * direction.z * direction.z - 1.0)));
            this.L22 = this.L22.add(c.scale(0.546274 * (direction.x * direction.x - direction.y * direction.y)));
        };
        SphericalHarmonics.prototype.scale = function (scale) {
            this.L00 = this.L00.scale(scale);
            this.L1_1 = this.L1_1.scale(scale);
            this.L10 = this.L10.scale(scale);
            this.L11 = this.L11.scale(scale);
            this.L2_2 = this.L2_2.scale(scale);
            this.L2_1 = this.L2_1.scale(scale);
            this.L20 = this.L20.scale(scale);
            this.L21 = this.L21.scale(scale);
            this.L22 = this.L22.scale(scale);
        };
        SphericalHarmonics.prototype.convertIncidentRadianceToIrradiance = function () {
            // Convert from incident radiance (Li) to irradiance (E) by applying convolution with the cosine-weighted hemisphere.
            //
            //      E_lm = A_l * L_lm
            // 
            // In spherical harmonics this convolution amounts to scaling factors for each frequency band.
            // This corresponds to equation 5 in "An Efficient Representation for Irradiance Environment Maps", where
            // the scaling factors are given in equation 9.
            // Constant (Band 0)
            this.L00 = this.L00.scale(3.141593);
            // Linear (Band 1)
            this.L1_1 = this.L1_1.scale(2.094395);
            this.L10 = this.L10.scale(2.094395);
            this.L11 = this.L11.scale(2.094395);
            // Quadratic (Band 2)
            this.L2_2 = this.L2_2.scale(0.785398);
            this.L2_1 = this.L2_1.scale(0.785398);
            this.L20 = this.L20.scale(0.785398);
            this.L21 = this.L21.scale(0.785398);
            this.L22 = this.L22.scale(0.785398);
        };
        SphericalHarmonics.prototype.convertIrradianceToLambertianRadiance = function () {
            // Convert from irradiance to outgoing radiance for Lambertian BDRF, suitable for efficient shader evaluation.
            //      L = (1/pi) * E * rho
            // 
            // This is done by an additional scale by 1/pi, so is a fairly trivial operation but important conceptually.
            this.scale(1.0 / Math.PI);
            // The resultant SH now represents outgoing radiance, so includes the Lambert 1/pi normalisation factor but without albedo (rho) applied
            // (The pixel shader must apply albedo after texture fetches, etc).
        };
        SphericalHarmonics.getsphericalHarmonicsFromPolynomial = function (polynomial) {
            var result = new SphericalHarmonics();
            result.L00 = polynomial.xx.scale(0.376127).add(polynomial.yy.scale(0.376127)).add(polynomial.zz.scale(0.376126));
            result.L1_1 = polynomial.y.scale(0.977204);
            result.L10 = polynomial.z.scale(0.977204);
            result.L11 = polynomial.x.scale(0.977204);
            result.L2_2 = polynomial.xy.scale(1.16538);
            result.L2_1 = polynomial.yz.scale(1.16538);
            result.L20 = polynomial.zz.scale(1.34567).subtract(polynomial.xx.scale(0.672834)).subtract(polynomial.yy.scale(0.672834));
            result.L21 = polynomial.zx.scale(1.16538);
            result.L22 = polynomial.xx.scale(1.16538).subtract(polynomial.yy.scale(1.16538));
            result.scale(Math.PI);
            return result;
        };
        return SphericalHarmonics;
    }());
    BABYLON.SphericalHarmonics = SphericalHarmonics;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.sphericalPolynomial.js.map

var BABYLON;
(function (BABYLON) {
    var FileFaceOrientation = /** @class */ (function () {
        function FileFaceOrientation(name, worldAxisForNormal, worldAxisForFileX, worldAxisForFileY) {
            this.name = name;
            this.worldAxisForNormal = worldAxisForNormal;
            this.worldAxisForFileX = worldAxisForFileX;
            this.worldAxisForFileY = worldAxisForFileY;
        }
        return FileFaceOrientation;
    }());
    ;
    /**
     * Helper class dealing with the extraction of spherical polynomial dataArray
     * from a cube map.
     */
    var CubeMapToSphericalPolynomialTools = /** @class */ (function () {
        function CubeMapToSphericalPolynomialTools() {
        }
        /**
         * Converts a texture to the according Spherical Polynomial data.
         * This extracts the first 3 orders only as they are the only one used in the lighting.
         *
         * @param texture The texture to extract the information from.
         * @return The Spherical Polynomial data.
         */
        CubeMapToSphericalPolynomialTools.ConvertCubeMapTextureToSphericalPolynomial = function (texture) {
            if (!texture.isCube) {
                // Only supports cube Textures currently.
                return null;
            }
            var size = texture.getSize().width;
            var right = texture.readPixels(0);
            var left = texture.readPixels(1);
            var up;
            var down;
            if (texture.isRenderTarget) {
                up = texture.readPixels(3);
                down = texture.readPixels(2);
            }
            else {
                up = texture.readPixels(2);
                down = texture.readPixels(3);
            }
            var front = texture.readPixels(4);
            var back = texture.readPixels(5);
            var gammaSpace = texture.gammaSpace;
            // Always read as RGBA.
            var format = BABYLON.Engine.TEXTUREFORMAT_RGBA;
            var type = BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT;
            if (texture.textureType && texture.textureType !== BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT) {
                type = BABYLON.Engine.TEXTURETYPE_FLOAT;
            }
            var cubeInfo = {
                size: size,
                right: right,
                left: left,
                up: up,
                down: down,
                front: front,
                back: back,
                format: format,
                type: type,
                gammaSpace: gammaSpace,
            };
            return this.ConvertCubeMapToSphericalPolynomial(cubeInfo);
        };
        /**
         * Converts a cubemap to the according Spherical Polynomial data.
         * This extracts the first 3 orders only as they are the only one used in the lighting.
         *
         * @param cubeInfo The Cube map to extract the information from.
         * @return The Spherical Polynomial data.
         */
        CubeMapToSphericalPolynomialTools.ConvertCubeMapToSphericalPolynomial = function (cubeInfo) {
            var sphericalHarmonics = new BABYLON.SphericalHarmonics();
            var totalSolidAngle = 0.0;
            // The (u,v) range is [-1,+1], so the distance between each texel is 2/Size.
            var du = 2.0 / cubeInfo.size;
            var dv = du;
            // The (u,v) of the first texel is half a texel from the corner (-1,-1).
            var minUV = du * 0.5 - 1.0;
            for (var faceIndex = 0; faceIndex < 6; faceIndex++) {
                var fileFace = this.FileFaces[faceIndex];
                var dataArray = cubeInfo[fileFace.name];
                var v = minUV;
                // TODO: we could perform the summation directly into a SphericalPolynomial (SP), which is more efficient than SphericalHarmonic (SH).
                // This is possible because during the summation we do not need the SH-specific properties, e.g. orthogonality.
                // Because SP is still linear, so summation is fine in that basis.
                var stride = cubeInfo.format === BABYLON.Engine.TEXTUREFORMAT_RGBA ? 4 : 3;
                for (var y = 0; y < cubeInfo.size; y++) {
                    var u = minUV;
                    for (var x = 0; x < cubeInfo.size; x++) {
                        // World direction (not normalised)
                        var worldDirection = fileFace.worldAxisForFileX.scale(u).add(fileFace.worldAxisForFileY.scale(v)).add(fileFace.worldAxisForNormal);
                        worldDirection.normalize();
                        var deltaSolidAngle = Math.pow(1.0 + u * u + v * v, -3.0 / 2.0);
                        var r = dataArray[(y * cubeInfo.size * stride) + (x * stride) + 0];
                        var g = dataArray[(y * cubeInfo.size * stride) + (x * stride) + 1];
                        var b = dataArray[(y * cubeInfo.size * stride) + (x * stride) + 2];
                        // Handle Integer types.
                        if (cubeInfo.type === BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT) {
                            r /= 255;
                            g /= 255;
                            b /= 255;
                        }
                        // Handle Gamma space textures.
                        if (cubeInfo.gammaSpace) {
                            r = Math.pow(BABYLON.Scalar.Clamp(r), BABYLON.ToLinearSpace);
                            g = Math.pow(BABYLON.Scalar.Clamp(g), BABYLON.ToLinearSpace);
                            b = Math.pow(BABYLON.Scalar.Clamp(b), BABYLON.ToLinearSpace);
                        }
                        var color = new BABYLON.Color3(r, g, b);
                        sphericalHarmonics.addLight(worldDirection, color, deltaSolidAngle);
                        totalSolidAngle += deltaSolidAngle;
                        u += du;
                    }
                    v += dv;
                }
            }
            // Solid angle for entire sphere is 4*pi
            var sphereSolidAngle = 4.0 * Math.PI;
            // Adjust the solid angle to allow for how many faces we processed.
            var facesProcessed = 6.0;
            var expectedSolidAngle = sphereSolidAngle * facesProcessed / 6.0;
            // Adjust the harmonics so that the accumulated solid angle matches the expected solid angle. 
            // This is needed because the numerical integration over the cube uses a 
            // small angle approximation of solid angle for each texel (see deltaSolidAngle),
            // and also to compensate for accumulative error due to float precision in the summation.
            var correctionFactor = expectedSolidAngle / totalSolidAngle;
            sphericalHarmonics.scale(correctionFactor);
            sphericalHarmonics.convertIncidentRadianceToIrradiance();
            sphericalHarmonics.convertIrradianceToLambertianRadiance();
            return BABYLON.SphericalPolynomial.getSphericalPolynomialFromHarmonics(sphericalHarmonics);
        };
        CubeMapToSphericalPolynomialTools.FileFaces = [
            new FileFaceOrientation("right", new BABYLON.Vector3(1, 0, 0), new BABYLON.Vector3(0, 0, -1), new BABYLON.Vector3(0, -1, 0)),
            new FileFaceOrientation("left", new BABYLON.Vector3(-1, 0, 0), new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(0, -1, 0)),
            new FileFaceOrientation("up", new BABYLON.Vector3(0, 1, 0), new BABYLON.Vector3(1, 0, 0), new BABYLON.Vector3(0, 0, 1)),
            new FileFaceOrientation("down", new BABYLON.Vector3(0, -1, 0), new BABYLON.Vector3(1, 0, 0), new BABYLON.Vector3(0, 0, -1)),
            new FileFaceOrientation("front", new BABYLON.Vector3(0, 0, 1), new BABYLON.Vector3(1, 0, 0), new BABYLON.Vector3(0, -1, 0)),
            new FileFaceOrientation("back", new BABYLON.Vector3(0, 0, -1), new BABYLON.Vector3(-1, 0, 0), new BABYLON.Vector3(0, -1, 0)) // -Z bottom
        ];
        return CubeMapToSphericalPolynomialTools;
    }());
    BABYLON.CubeMapToSphericalPolynomialTools = CubeMapToSphericalPolynomialTools;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.cubemapToSphericalPolynomial.js.map

BABYLON.Effect.ShadersStore['defaultVertexShader'] = "#include<__decl__defaultVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<helperFunctions>\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nvarying vec2 vDiffuseUV;\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nvarying vec2 vAmbientUV;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nvarying vec2 vEmissiveUV;\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nvarying vec2 vLightmapUV;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nvarying vec2 vSpecularUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL \nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normalUpdated);\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif\n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nif (vSpecularInfos.x == 0.)\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<bumpVertex>\n#include<clipPlaneVertex>\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n#ifdef VERTEXCOLOR\n\nvColor=color;\n#endif\n#include<pointCloudVertex>\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['defaultPixelShader'] = "#include<__decl__defaultFragment>\n#if defined(BUMP) || !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\n#define RECIPROCAL_PI2 0.15915494\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\n#if DIFFUSEDIRECTUV == 1\n#define vDiffuseUV vMainUV1\n#elif DIFFUSEDIRECTUV == 2\n#define vDiffuseUV vMainUV2\n#else\nvarying vec2 vDiffuseUV;\n#endif\nuniform sampler2D diffuseSampler;\n#endif\n#ifdef AMBIENT\n#if AMBIENTDIRECTUV == 1\n#define vAmbientUV vMainUV1\n#elif AMBIENTDIRECTUV == 2\n#define vAmbientUV vMainUV2\n#else\nvarying vec2 vAmbientUV;\n#endif\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\n#if EMISSIVEDIRECTUV == 1\n#define vEmissiveUV vMainUV1\n#elif EMISSIVEDIRECTUV == 2\n#define vEmissiveUV vMainUV2\n#else\nvarying vec2 vEmissiveUV;\n#endif\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\n#if LIGHTMAPDIRECTUV == 1\n#define vLightmapUV vMainUV1\n#elif LIGHTMAPDIRECTUV == 2\n#define vLightmapUV vMainUV2\n#else\nvarying vec2 vLightmapUV;\n#endif\nuniform sampler2D lightmapSampler;\n#endif\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\n#if SPECULARDIRECTUV == 1\n#define vSpecularUV vMainUV1\n#elif SPECULARDIRECTUV == 2\n#define vSpecularUV vMainUV2\n#else\nvarying vec2 vSpecularUV;\n#endif\nuniform sampler2D specularSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#include<imageProcessingDeclaration>\n#include<imageProcessingFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMDIFFUSE\nalpha*=baseColor.a;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 baseAmbientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nbaseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#endif\n\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#ifdef SPECULAR\nvec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\nspecularColor=specularMapColor.rgb;\n#ifdef GLOSSINESS\nglossiness=glossiness*specularMapColor.a;\n#endif\n#endif\n#else\nfloat glossiness=0.;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\nfloat shadow=1.;\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n\nvec3 refractionColor=vec3(0.,0.,0.);\n#ifdef REFRACTION\nvec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\nrefractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n}\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\nrefractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n#endif\n#endif\n\nvec3 reflectionColor=vec3(0.,0.,0.);\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef REFLECTIONMAP_3D\n#ifdef ROUGHNESS\nfloat bias=vReflectionInfos.y;\n#ifdef SPECULARTERM\n#ifdef SPECULAR\n#ifdef GLOSSINESS\nbias*=(1.0-specularMapColor.a);\n#endif\n#endif\n#endif\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n#else\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\nreflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n#endif\n#ifdef REFLECTIONFRESNEL\nfloat reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n#ifdef REFLECTIONFRESNELFROMSPECULAR\n#ifdef SPECULARTERM\nreflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#endif\n#endif\n#ifdef REFRACTIONFRESNEL\nfloat refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\nrefractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 emissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nemissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nemissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef DIFFUSEFRESNEL\nfloat diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\ndiffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\n#ifdef LINKEMISSIVEWITHDIFFUSE\nvec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#endif\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef REFLECTIONOVERALPHA\nalpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n#else\nvec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n#endif\n\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\ncolor.rgb*=lightmapColor;\n#else\ncolor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\n#include<logDepthFragment>\n#include<fogFragment>\n\n\n#ifdef IMAGEPROCESSINGPOSTPROCESS\ncolor.rgb=toLinearSpace(color.rgb);\n#else\n#ifdef IMAGEPROCESSING\ncolor.rgb=toLinearSpace(color.rgb);\ncolor=applyImageProcessing(color);\n#endif\n#endif\n#ifdef PREMULTIPLYALPHA\n\ncolor.rgb*=color.a;\n#endif\ngl_FragColor=color;\n}";

var BABYLON;
(function (BABYLON) {
    /**
     * Helper class usefull to convert panorama picture to their cubemap representation in 6 faces.
     */
    var PanoramaToCubeMapTools = /** @class */ (function () {
        function PanoramaToCubeMapTools() {
        }
        /**
         * Converts a panorma stored in RGB right to left up to down format into a cubemap (6 faces).
         *
         * @param float32Array The source data.
         * @param inputWidth The width of the input panorama.
         * @param inputhHeight The height of the input panorama.
         * @param size The willing size of the generated cubemap (each faces will be size * size pixels)
         * @return The cubemap data
         */
        PanoramaToCubeMapTools.ConvertPanoramaToCubemap = function (float32Array, inputWidth, inputHeight, size) {
            if (!float32Array) {
                throw "ConvertPanoramaToCubemap: input cannot be null";
            }
            if (float32Array.length != inputWidth * inputHeight * 3) {
                throw "ConvertPanoramaToCubemap: input size is wrong";
            }
            var textureFront = this.CreateCubemapTexture(size, this.FACE_FRONT, float32Array, inputWidth, inputHeight);
            var textureBack = this.CreateCubemapTexture(size, this.FACE_BACK, float32Array, inputWidth, inputHeight);
            var textureLeft = this.CreateCubemapTexture(size, this.FACE_LEFT, float32Array, inputWidth, inputHeight);
            var textureRight = this.CreateCubemapTexture(size, this.FACE_RIGHT, float32Array, inputWidth, inputHeight);
            var textureUp = this.CreateCubemapTexture(size, this.FACE_UP, float32Array, inputWidth, inputHeight);
            var textureDown = this.CreateCubemapTexture(size, this.FACE_DOWN, float32Array, inputWidth, inputHeight);
            return {
                front: textureFront,
                back: textureBack,
                left: textureLeft,
                right: textureRight,
                up: textureUp,
                down: textureDown,
                size: size,
                type: BABYLON.Engine.TEXTURETYPE_FLOAT,
                format: BABYLON.Engine.TEXTUREFORMAT_RGB,
                gammaSpace: false,
            };
        };
        PanoramaToCubeMapTools.CreateCubemapTexture = function (texSize, faceData, float32Array, inputWidth, inputHeight) {
            var buffer = new ArrayBuffer(texSize * texSize * 4 * 3);
            var textureArray = new Float32Array(buffer);
            var rotDX1 = faceData[1].subtract(faceData[0]).scale(1 / texSize);
            var rotDX2 = faceData[3].subtract(faceData[2]).scale(1 / texSize);
            var dy = 1 / texSize;
            var fy = 0;
            for (var y = 0; y < texSize; y++) {
                var xv1 = faceData[0];
                var xv2 = faceData[2];
                for (var x = 0; x < texSize; x++) {
                    var v = xv2.subtract(xv1).scale(fy).add(xv1);
                    v.normalize();
                    var color = this.CalcProjectionSpherical(v, float32Array, inputWidth, inputHeight);
                    // 3 channels per pixels
                    textureArray[y * texSize * 3 + (x * 3) + 0] = color.r;
                    textureArray[y * texSize * 3 + (x * 3) + 1] = color.g;
                    textureArray[y * texSize * 3 + (x * 3) + 2] = color.b;
                    xv1 = xv1.add(rotDX1);
                    xv2 = xv2.add(rotDX2);
                }
                fy += dy;
            }
            return textureArray;
        };
        PanoramaToCubeMapTools.CalcProjectionSpherical = function (vDir, float32Array, inputWidth, inputHeight) {
            var theta = Math.atan2(vDir.z, vDir.x);
            var phi = Math.acos(vDir.y);
            while (theta < -Math.PI)
                theta += 2 * Math.PI;
            while (theta > Math.PI)
                theta -= 2 * Math.PI;
            var dx = theta / Math.PI;
            var dy = phi / Math.PI;
            // recenter.
            dx = dx * 0.5 + 0.5;
            var px = Math.round(dx * inputWidth);
            if (px < 0)
                px = 0;
            else if (px >= inputWidth)
                px = inputWidth - 1;
            var py = Math.round(dy * inputHeight);
            if (py < 0)
                py = 0;
            else if (py >= inputHeight)
                py = inputHeight - 1;
            var inputY = (inputHeight - py - 1);
            var r = float32Array[inputY * inputWidth * 3 + (px * 3) + 0];
            var g = float32Array[inputY * inputWidth * 3 + (px * 3) + 1];
            var b = float32Array[inputY * inputWidth * 3 + (px * 3) + 2];
            return {
                r: r,
                g: g,
                b: b
            };
        };
        PanoramaToCubeMapTools.FACE_FRONT = [
            new BABYLON.Vector3(-1.0, -1.0, -1.0),
            new BABYLON.Vector3(1.0, -1.0, -1.0),
            new BABYLON.Vector3(-1.0, 1.0, -1.0),
            new BABYLON.Vector3(1.0, 1.0, -1.0)
        ];
        PanoramaToCubeMapTools.FACE_BACK = [
            new BABYLON.Vector3(1.0, -1.0, 1.0),
            new BABYLON.Vector3(-1.0, -1.0, 1.0),
            new BABYLON.Vector3(1.0, 1.0, 1.0),
            new BABYLON.Vector3(-1.0, 1.0, 1.0)
        ];
        PanoramaToCubeMapTools.FACE_RIGHT = [
            new BABYLON.Vector3(1.0, -1.0, -1.0),
            new BABYLON.Vector3(1.0, -1.0, 1.0),
            new BABYLON.Vector3(1.0, 1.0, -1.0),
            new BABYLON.Vector3(1.0, 1.0, 1.0)
        ];
        PanoramaToCubeMapTools.FACE_LEFT = [
            new BABYLON.Vector3(-1.0, -1.0, 1.0),
            new BABYLON.Vector3(-1.0, -1.0, -1.0),
            new BABYLON.Vector3(-1.0, 1.0, 1.0),
            new BABYLON.Vector3(-1.0, 1.0, -1.0)
        ];
        PanoramaToCubeMapTools.FACE_DOWN = [
            new BABYLON.Vector3(-1.0, 1.0, -1.0),
            new BABYLON.Vector3(1.0, 1.0, -1.0),
            new BABYLON.Vector3(-1.0, 1.0, 1.0),
            new BABYLON.Vector3(1.0, 1.0, 1.0)
        ];
        PanoramaToCubeMapTools.FACE_UP = [
            new BABYLON.Vector3(-1.0, -1.0, 1.0),
            new BABYLON.Vector3(1.0, -1.0, 1.0),
            new BABYLON.Vector3(-1.0, -1.0, -1.0),
            new BABYLON.Vector3(1.0, -1.0, -1.0)
        ];
        return PanoramaToCubeMapTools;
    }());
    BABYLON.PanoramaToCubeMapTools = PanoramaToCubeMapTools;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.panoramaToCubemap.js.map

var BABYLON;
(function (BABYLON) {
    ;
    /**
     * This groups tools to convert HDR texture to native colors array.
     */
    var HDRTools = /** @class */ (function () {
        function HDRTools() {
        }
        HDRTools.Ldexp = function (mantissa, exponent) {
            if (exponent > 1023) {
                return mantissa * Math.pow(2, 1023) * Math.pow(2, exponent - 1023);
            }
            if (exponent < -1074) {
                return mantissa * Math.pow(2, -1074) * Math.pow(2, exponent + 1074);
            }
            return mantissa * Math.pow(2, exponent);
        };
        HDRTools.Rgbe2float = function (float32array, red, green, blue, exponent, index) {
            if (exponent > 0) {
                exponent = this.Ldexp(1.0, exponent - (128 + 8));
                float32array[index + 0] = red * exponent;
                float32array[index + 1] = green * exponent;
                float32array[index + 2] = blue * exponent;
            }
            else {
                float32array[index + 0] = 0;
                float32array[index + 1] = 0;
                float32array[index + 2] = 0;
            }
        };
        HDRTools.readStringLine = function (uint8array, startIndex) {
            var line = "";
            var character = "";
            for (var i = startIndex; i < uint8array.length - startIndex; i++) {
                character = String.fromCharCode(uint8array[i]);
                if (character == "\n") {
                    break;
                }
                line += character;
            }
            return line;
        };
        /**
         * Reads header information from an RGBE texture stored in a native array.
         * More information on this format are available here:
         * https://en.wikipedia.org/wiki/RGBE_image_format
         *
         * @param uint8array The binary file stored in  native array.
         * @return The header information.
         */
        HDRTools.RGBE_ReadHeader = function (uint8array) {
            var height = 0;
            var width = 0;
            var line = this.readStringLine(uint8array, 0);
            if (line[0] != '#' || line[1] != '?') {
                throw "Bad HDR Format.";
            }
            var endOfHeader = false;
            var findFormat = false;
            var lineIndex = 0;
            do {
                lineIndex += (line.length + 1);
                line = this.readStringLine(uint8array, lineIndex);
                if (line == "FORMAT=32-bit_rle_rgbe") {
                    findFormat = true;
                }
                else if (line.length == 0) {
                    endOfHeader = true;
                }
            } while (!endOfHeader);
            if (!findFormat) {
                throw "HDR Bad header format, unsupported FORMAT";
            }
            lineIndex += (line.length + 1);
            line = this.readStringLine(uint8array, lineIndex);
            var sizeRegexp = /^\-Y (.*) \+X (.*)$/g;
            var match = sizeRegexp.exec(line);
            // TODO. Support +Y and -X if needed.
            if (!match || match.length < 3) {
                throw "HDR Bad header format, no size";
            }
            width = parseInt(match[2]);
            height = parseInt(match[1]);
            if (width < 8 || width > 0x7fff) {
                throw "HDR Bad header format, unsupported size";
            }
            lineIndex += (line.length + 1);
            return {
                height: height,
                width: width,
                dataPosition: lineIndex
            };
        };
        /**
         * Returns the cubemap information (each faces texture data) extracted from an RGBE texture.
         * This RGBE texture needs to store the information as a panorama.
         *
         * More information on this format are available here:
         * https://en.wikipedia.org/wiki/RGBE_image_format
         *
         * @param buffer The binary file stored in an array buffer.
         * @param size The expected size of the extracted cubemap.
         * @return The Cube Map information.
         */
        HDRTools.GetCubeMapTextureData = function (buffer, size) {
            var uint8array = new Uint8Array(buffer);
            var hdrInfo = this.RGBE_ReadHeader(uint8array);
            var data = this.RGBE_ReadPixels_RLE(uint8array, hdrInfo);
            var cubeMapData = BABYLON.PanoramaToCubeMapTools.ConvertPanoramaToCubemap(data, hdrInfo.width, hdrInfo.height, size);
            return cubeMapData;
        };
        /**
         * Returns the pixels data extracted from an RGBE texture.
         * This pixels will be stored left to right up to down in the R G B order in one array.
         *
         * More information on this format are available here:
         * https://en.wikipedia.org/wiki/RGBE_image_format
         *
         * @param uint8array The binary file stored in an array buffer.
         * @param hdrInfo The header information of the file.
         * @return The pixels data in RGB right to left up to down order.
         */
        HDRTools.RGBE_ReadPixels = function (uint8array, hdrInfo) {
            // Keep for multi format supports.
            return this.RGBE_ReadPixels_RLE(uint8array, hdrInfo);
        };
        HDRTools.RGBE_ReadPixels_RLE = function (uint8array, hdrInfo) {
            var num_scanlines = hdrInfo.height;
            var scanline_width = hdrInfo.width;
            var a, b, c, d, count;
            var dataIndex = hdrInfo.dataPosition;
            var index = 0, endIndex = 0, i = 0;
            var scanLineArrayBuffer = new ArrayBuffer(scanline_width * 4); // four channel R G B E
            var scanLineArray = new Uint8Array(scanLineArrayBuffer);
            // 3 channels of 4 bytes per pixel in float.
            var resultBuffer = new ArrayBuffer(hdrInfo.width * hdrInfo.height * 4 * 3);
            var resultArray = new Float32Array(resultBuffer);
            // read in each successive scanline
            while (num_scanlines > 0) {
                a = uint8array[dataIndex++];
                b = uint8array[dataIndex++];
                c = uint8array[dataIndex++];
                d = uint8array[dataIndex++];
                if (a != 2 || b != 2 || (c & 0x80)) {
                    // this file is not run length encoded
                    throw "HDR Bad header format, not RLE";
                }
                if (((c << 8) | d) != scanline_width) {
                    throw "HDR Bad header format, wrong scan line width";
                }
                index = 0;
                // read each of the four channels for the scanline into the buffer
                for (i = 0; i < 4; i++) {
                    endIndex = (i + 1) * scanline_width;
                    while (index < endIndex) {
                        a = uint8array[dataIndex++];
                        b = uint8array[dataIndex++];
                        if (a > 128) {
                            // a run of the same value
                            count = a - 128;
                            if ((count == 0) || (count > endIndex - index)) {
                                throw "HDR Bad Format, bad scanline data (run)";
                            }
                            while (count-- > 0) {
                                scanLineArray[index++] = b;
                            }
                        }
                        else {
                            // a non-run
                            count = a;
                            if ((count == 0) || (count > endIndex - index)) {
                                throw "HDR Bad Format, bad scanline data (non-run)";
                            }
                            scanLineArray[index++] = b;
                            if (--count > 0) {
                                for (var j = 0; j < count; j++) {
                                    scanLineArray[index++] = uint8array[dataIndex++];
                                }
                            }
                        }
                    }
                }
                // now convert data from buffer into floats
                for (i = 0; i < scanline_width; i++) {
                    a = scanLineArray[i];
                    b = scanLineArray[i + scanline_width];
                    c = scanLineArray[i + 2 * scanline_width];
                    d = scanLineArray[i + 3 * scanline_width];
                    this.Rgbe2float(resultArray, a, b, c, d, (hdrInfo.height - num_scanlines) * scanline_width * 3 + i * 3);
                }
                num_scanlines--;
            }
            return resultArray;
        };
        return HDRTools;
    }());
    BABYLON.HDRTools = HDRTools;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.hdr.js.map


var BABYLON;
(function (BABYLON) {
    /**
     * This represents a texture coming from an HDR input.
     *
     * The only supported format is currently panorama picture stored in RGBE format.
     * Example of such files can be found on HDRLib: http://hdrlib.com/
     */
    var HDRCubeTexture = /** @class */ (function (_super) {
        __extends(HDRCubeTexture, _super);
        /**
         * Instantiates an HDRTexture from the following parameters.
         *
         * @param url The location of the HDR raw data (Panorama stored in RGBE format)
         * @param scene The scene the texture will be used in
         * @param size The cubemap desired size (the more it increases the longer the generation will be) If the size is omitted this implies you are using a preprocessed cubemap.
         * @param noMipmap Forces to not generate the mipmap if true
         * @param generateHarmonics Specifies wether you want to extract the polynomial harmonics during the generation process
         * @param useInGammaSpace Specifies if the texture will be use in gamma or linear space (the PBR material requires those texture in linear space, but the standard material would require them in Gamma space)
         * @param usePMREMGenerator Specifies wether or not to generate the CubeMap through CubeMapGen to avoid seams issue at run time.
         */
        function HDRCubeTexture(url, scene, size, noMipmap, generateHarmonics, useInGammaSpace, usePMREMGenerator, onLoad, onError) {
            if (noMipmap === void 0) { noMipmap = false; }
            if (generateHarmonics === void 0) { generateHarmonics = true; }
            if (useInGammaSpace === void 0) { useInGammaSpace = false; }
            if (usePMREMGenerator === void 0) { usePMREMGenerator = false; }
            if (onLoad === void 0) { onLoad = null; }
            if (onError === void 0) { onError = null; }
            var _this = _super.call(this, scene) || this;
            _this._useInGammaSpace = false;
            _this._generateHarmonics = true;
            _this._isBABYLONPreprocessed = false;
            _this._onLoad = null;
            _this._onError = null;
            /**
             * The texture coordinates mode. As this texture is stored in a cube format, please modify carefully.
             */
            _this.coordinatesMode = BABYLON.Texture.CUBIC_MODE;
            /**
             * Specifies wether the texture has been generated through the PMREMGenerator tool.
             * This is usefull at run time to apply the good shader.
             */
            _this.isPMREM = false;
            _this._isBlocking = true;
            if (!url) {
                return _this;
            }
            _this.name = url;
            _this.url = url;
            _this.hasAlpha = false;
            _this.isCube = true;
            _this._textureMatrix = BABYLON.Matrix.Identity();
            _this._onLoad = onLoad;
            _this._onError = onError;
            _this.gammaSpace = false;
            var caps = scene.getEngine().getCaps();
            if (size) {
                _this._isBABYLONPreprocessed = false;
                _this._noMipmap = noMipmap;
                _this._size = size;
                _this._useInGammaSpace = useInGammaSpace;
                _this._usePMREMGenerator = usePMREMGenerator &&
                    caps.textureLOD &&
                    caps.textureFloat &&
                    !_this._useInGammaSpace;
            }
            else {
                _this._isBABYLONPreprocessed = true;
                _this._noMipmap = false;
                _this._useInGammaSpace = false;
                _this._usePMREMGenerator = caps.textureLOD && caps.textureFloat &&
                    !_this._useInGammaSpace;
            }
            _this.isPMREM = _this._usePMREMGenerator;
            _this._texture = _this._getFromCache(url, _this._noMipmap);
            if (!_this._texture) {
                if (!scene.useDelayedTextureLoading) {
                    _this.loadTexture();
                }
                else {
                    _this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NOTLOADED;
                }
            }
            return _this;
        }
        Object.defineProperty(HDRCubeTexture.prototype, "isBlocking", {
            /**
             * Gets wether or not the texture is blocking during loading.
             */
            get: function () {
                return this._isBlocking;
            },
            /**
             * Sets wether or not the texture is blocking during loading.
             */
            set: function (value) {
                this._isBlocking = value;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Occurs when the file is a preprocessed .babylon.hdr file.
         */
        HDRCubeTexture.prototype.loadBabylonTexture = function () {
            var _this = this;
            var mipLevels = 0;
            var floatArrayView = null;
            var scene = this.getScene();
            var mipmapGenerator = (!this._useInGammaSpace && scene && scene.getEngine().getCaps().textureFloat) ? function (data) {
                var mips = new Array();
                if (!floatArrayView) {
                    return mips;
                }
                var startIndex = 30;
                for (var level = 0; level < mipLevels; level++) {
                    mips.push([]);
                    // Fill each pixel of the mip level.
                    var faceSize = Math.pow(_this._size >> level, 2) * 3;
                    for (var faceIndex = 0; faceIndex < 6; faceIndex++) {
                        var faceData = floatArrayView.subarray(startIndex, startIndex + faceSize);
                        mips[level].push(faceData);
                        startIndex += faceSize;
                    }
                }
                return mips;
            } : null;
            var callback = function (buffer) {
                var scene = _this.getScene();
                if (!scene) {
                    return null;
                }
                // Create Native Array Views
                var intArrayView = new Int32Array(buffer);
                floatArrayView = new Float32Array(buffer);
                // Fill header.
                var version = intArrayView[0]; // Version 1. (MAy be use in case of format changes for backward compaibility)
                _this._size = intArrayView[1]; // CubeMap max mip face size.
                // Update Texture Information.
                if (!_this._texture) {
                    return null;
                }
                _this._texture.updateSize(_this._size, _this._size);
                // Fill polynomial information.
                var sphericalPolynomial = new BABYLON.SphericalPolynomial();
                sphericalPolynomial.x.copyFromFloats(floatArrayView[2], floatArrayView[3], floatArrayView[4]);
                sphericalPolynomial.y.copyFromFloats(floatArrayView[5], floatArrayView[6], floatArrayView[7]);
                sphericalPolynomial.z.copyFromFloats(floatArrayView[8], floatArrayView[9], floatArrayView[10]);
                sphericalPolynomial.xx.copyFromFloats(floatArrayView[11], floatArrayView[12], floatArrayView[13]);
                sphericalPolynomial.yy.copyFromFloats(floatArrayView[14], floatArrayView[15], floatArrayView[16]);
                sphericalPolynomial.zz.copyFromFloats(floatArrayView[17], floatArrayView[18], floatArrayView[19]);
                sphericalPolynomial.xy.copyFromFloats(floatArrayView[20], floatArrayView[21], floatArrayView[22]);
                sphericalPolynomial.yz.copyFromFloats(floatArrayView[23], floatArrayView[24], floatArrayView[25]);
                sphericalPolynomial.zx.copyFromFloats(floatArrayView[26], floatArrayView[27], floatArrayView[28]);
                _this.sphericalPolynomial = sphericalPolynomial;
                // Fill pixel data.
                mipLevels = intArrayView[29]; // Number of mip levels.
                var startIndex = 30;
                var data = [];
                var faceSize = Math.pow(_this._size, 2) * 3;
                for (var faceIndex = 0; faceIndex < 6; faceIndex++) {
                    data.push(floatArrayView.subarray(startIndex, startIndex + faceSize));
                    startIndex += faceSize;
                }
                var results = [];
                var byteArray = null;
                // Push each faces.
                for (var k = 0; k < 6; k++) {
                    var dataFace = null;
                    // To be deprecated.
                    if (version === 1) {
                        var j = ([0, 2, 4, 1, 3, 5])[k]; // Transforms +X+Y+Z... to +X-X+Y-Y...
                        dataFace = data[j];
                    }
                    // If special cases.
                    if (!mipmapGenerator && dataFace) {
                        if (!scene.getEngine().getCaps().textureFloat) {
                            // 3 channels of 1 bytes per pixel in bytes.
                            var byteBuffer = new ArrayBuffer(faceSize);
                            byteArray = new Uint8Array(byteBuffer);
                        }
                        for (var i = 0; i < _this._size * _this._size; i++) {
                            // Put in gamma space if requested.
                            if (_this._useInGammaSpace) {
                                dataFace[(i * 3) + 0] = Math.pow(dataFace[(i * 3) + 0], BABYLON.ToGammaSpace);
                                dataFace[(i * 3) + 1] = Math.pow(dataFace[(i * 3) + 1], BABYLON.ToGammaSpace);
                                dataFace[(i * 3) + 2] = Math.pow(dataFace[(i * 3) + 2], BABYLON.ToGammaSpace);
                            }
                            // Convert to int texture for fallback.
                            if (byteArray) {
                                var r = Math.max(dataFace[(i * 3) + 0] * 255, 0);
                                var g = Math.max(dataFace[(i * 3) + 1] * 255, 0);
                                var b = Math.max(dataFace[(i * 3) + 2] * 255, 0);
                                // May use luminance instead if the result is not accurate.
                                var max = Math.max(Math.max(r, g), b);
                                if (max > 255) {
                                    var scale = 255 / max;
                                    r *= scale;
                                    g *= scale;
                                    b *= scale;
                                }
                                byteArray[(i * 3) + 0] = r;
                                byteArray[(i * 3) + 1] = g;
                                byteArray[(i * 3) + 2] = b;
                            }
                        }
                    }
                    // Fill the array accordingly.
                    if (byteArray) {
                        results.push(byteArray);
                    }
                    else {
                        results.push(dataFace);
                    }
                }
                return results;
            };
            if (scene) {
                this._texture = scene.getEngine().createRawCubeTextureFromUrl(this.url, scene, this._size, BABYLON.Engine.TEXTUREFORMAT_RGB, scene.getEngine().getCaps().textureFloat ? BABYLON.Engine.TEXTURETYPE_FLOAT : BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT, this._noMipmap, callback, mipmapGenerator, this._onLoad, this._onError);
            }
        };
        /**
         * Occurs when the file is raw .hdr file.
         */
        HDRCubeTexture.prototype.loadHDRTexture = function () {
            var _this = this;
            var callback = function (buffer) {
                var scene = _this.getScene();
                if (!scene) {
                    return null;
                }
                // Extract the raw linear data.
                var data = BABYLON.HDRTools.GetCubeMapTextureData(buffer, _this._size);
                // Generate harmonics if needed.
                if (_this._generateHarmonics) {
                    var sphericalPolynomial = BABYLON.CubeMapToSphericalPolynomialTools.ConvertCubeMapToSphericalPolynomial(data);
                    _this.sphericalPolynomial = sphericalPolynomial;
                }
                var results = [];
                var byteArray = null;
                // Push each faces.
                for (var j = 0; j < 6; j++) {
                    // Create uintarray fallback.
                    if (!scene.getEngine().getCaps().textureFloat) {
                        // 3 channels of 1 bytes per pixel in bytes.
                        var byteBuffer = new ArrayBuffer(_this._size * _this._size * 3);
                        byteArray = new Uint8Array(byteBuffer);
                    }
                    var dataFace = (data[HDRCubeTexture._facesMapping[j]]);
                    // If special cases.
                    if (_this._useInGammaSpace || byteArray) {
                        for (var i = 0; i < _this._size * _this._size; i++) {
                            // Put in gamma space if requested.
                            if (_this._useInGammaSpace) {
                                dataFace[(i * 3) + 0] = Math.pow(dataFace[(i * 3) + 0], BABYLON.ToGammaSpace);
                                dataFace[(i * 3) + 1] = Math.pow(dataFace[(i * 3) + 1], BABYLON.ToGammaSpace);
                                dataFace[(i * 3) + 2] = Math.pow(dataFace[(i * 3) + 2], BABYLON.ToGammaSpace);
                            }
                            // Convert to int texture for fallback.
                            if (byteArray) {
                                var r = Math.max(dataFace[(i * 3) + 0] * 255, 0);
                                var g = Math.max(dataFace[(i * 3) + 1] * 255, 0);
                                var b = Math.max(dataFace[(i * 3) + 2] * 255, 0);
                                // May use luminance instead if the result is not accurate.
                                var max = Math.max(Math.max(r, g), b);
                                if (max > 255) {
                                    var scale = 255 / max;
                                    r *= scale;
                                    g *= scale;
                                    b *= scale;
                                }
                                byteArray[(i * 3) + 0] = r;
                                byteArray[(i * 3) + 1] = g;
                                byteArray[(i * 3) + 2] = b;
                            }
                        }
                    }
                    if (byteArray) {
                        results.push(byteArray);
                    }
                    else {
                        results.push(dataFace);
                    }
                }
                return results;
            };
            var mipmapGenerator = null;
            // TODO. Implement In code PMREM Generator following the LYS toolset generation.
            // if (!this._noMipmap &&
            //     this._usePMREMGenerator) {
            //     mipmapGenerator = (data: ArrayBufferView[]) => {
            //         // Custom setup of the generator matching with the PBR shader values.
            //         var generator = new BABYLON.PMREMGenerator(data,
            //             this._size,
            //             this._size,
            //             0,
            //             3,
            //             this.getScene().getEngine().getCaps().textureFloat,
            //             2048,
            //             0.25,
            //             false,
            //             true);
            //         return generator.filterCubeMap();
            //     };
            // }
            var scene = this.getScene();
            if (scene) {
                this._texture = scene.getEngine().createRawCubeTextureFromUrl(this.url, scene, this._size, BABYLON.Engine.TEXTUREFORMAT_RGB, scene.getEngine().getCaps().textureFloat ? BABYLON.Engine.TEXTURETYPE_FLOAT : BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT, this._noMipmap, callback, mipmapGenerator, this._onLoad, this._onError);
            }
        };
        /**
         * Starts the loading process of the texture.
         */
        HDRCubeTexture.prototype.loadTexture = function () {
            if (this._isBABYLONPreprocessed) {
                this.loadBabylonTexture();
            }
            else {
                this.loadHDRTexture();
            }
        };
        HDRCubeTexture.prototype.clone = function () {
            var scene = this.getScene();
            if (!scene) {
                return this;
            }
            var size = (this._isBABYLONPreprocessed ? null : this._size);
            var newTexture = new HDRCubeTexture(this.url, scene, size, this._noMipmap, this._generateHarmonics, this._useInGammaSpace, this._usePMREMGenerator);
            // Base texture
            newTexture.level = this.level;
            newTexture.wrapU = this.wrapU;
            newTexture.wrapV = this.wrapV;
            newTexture.coordinatesIndex = this.coordinatesIndex;
            newTexture.coordinatesMode = this.coordinatesMode;
            return newTexture;
        };
        // Methods
        HDRCubeTexture.prototype.delayLoad = function () {
            if (this.delayLoadState !== BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
                return;
            }
            this.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
            this._texture = this._getFromCache(this.url, this._noMipmap);
            if (!this._texture) {
                this.loadTexture();
            }
        };
        HDRCubeTexture.prototype.getReflectionTextureMatrix = function () {
            return this._textureMatrix;
        };
        HDRCubeTexture.prototype.setReflectionTextureMatrix = function (value) {
            this._textureMatrix = value;
        };
        HDRCubeTexture.Parse = function (parsedTexture, scene, rootUrl) {
            var texture = null;
            if (parsedTexture.name && !parsedTexture.isRenderTarget) {
                var size = parsedTexture.isBABYLONPreprocessed ? null : parsedTexture.size;
                texture = new HDRCubeTexture(rootUrl + parsedTexture.name, scene, size, parsedTexture.noMipmap, parsedTexture.generateHarmonics, parsedTexture.useInGammaSpace, parsedTexture.usePMREMGenerator);
                texture.name = parsedTexture.name;
                texture.hasAlpha = parsedTexture.hasAlpha;
                texture.level = parsedTexture.level;
                texture.coordinatesMode = parsedTexture.coordinatesMode;
                texture.isBlocking = parsedTexture.isBlocking;
            }
            return texture;
        };
        HDRCubeTexture.prototype.serialize = function () {
            if (!this.name) {
                return null;
            }
            var serializationObject = {};
            serializationObject.name = this.name;
            serializationObject.hasAlpha = this.hasAlpha;
            serializationObject.isCube = true;
            serializationObject.level = this.level;
            serializationObject.size = this._size;
            serializationObject.coordinatesMode = this.coordinatesMode;
            serializationObject.useInGammaSpace = this._useInGammaSpace;
            serializationObject.generateHarmonics = this._generateHarmonics;
            serializationObject.usePMREMGenerator = this._usePMREMGenerator;
            serializationObject.isBABYLONPreprocessed = this._isBABYLONPreprocessed;
            serializationObject.customType = "BABYLON.HDRCubeTexture";
            serializationObject.noMipmap = this._noMipmap;
            serializationObject.isBlocking = this._isBlocking;
            return serializationObject;
        };
        /**
         * Saves as a file the data contained in the texture in a binary format.
         * This can be used to prevent the long loading tie associated with creating the seamless texture as well
         * as the spherical used in the lighting.
         * @param url The HDR file url.
         * @param size The size of the texture data to generate (one of the cubemap face desired width).
         * @param onError Method called if any error happens during download.
         * @return The packed binary data.
         */
        HDRCubeTexture.generateBabylonHDROnDisk = function (url, size, onError) {
            if (onError === void 0) { onError = null; }
            var callback = function (buffer) {
                var data = new Blob([buffer], { type: 'application/octet-stream' });
                // Returns a URL you can use as a href.
                var objUrl = window.URL.createObjectURL(data);
                // Simulates a link to it and click to dowload.
                var a = document.createElement("a");
                document.body.appendChild(a);
                a.style.display = "none";
                a.href = objUrl;
                a.download = "envmap.babylon.hdr";
                a.click();
            };
            HDRCubeTexture.generateBabylonHDR(url, size, callback, onError);
        };
        /**
         * Serializes the data contained in the texture in a binary format.
         * This can be used to prevent the long loading tie associated with creating the seamless texture as well
         * as the spherical used in the lighting.
         * @param url The HDR file url.
         * @param size The size of the texture data to generate (one of the cubemap face desired width).
         * @param onError Method called if any error happens during download.
         * @return The packed binary data.
         */
        HDRCubeTexture.generateBabylonHDR = function (url, size, callback, onError) {
            if (onError === void 0) { onError = null; }
            // Needs the url tho create the texture.
            if (!url) {
                return;
            }
            // Check Power of two size.
            if (!BABYLON.Tools.IsExponentOfTwo(size)) {
                return;
            }
            // Coming Back in 3.x.
            BABYLON.Tools.Error("Generation of Babylon HDR is coming back in 3.2.");
        };
        HDRCubeTexture._facesMapping = [
            "right",
            "left",
            "up",
            "down",
            "front",
            "back"
        ];
        return HDRCubeTexture;
    }(BABYLON.BaseTexture));
    BABYLON.HDRCubeTexture = HDRCubeTexture;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.hdrCubeTexture.js.map

BABYLON.Effect.IncludesShadersStore['depthPrePass'] = "#ifdef DEPTHPREPASS\ngl_FragColor=vec4(0.,0.,0.,1.0);\nreturn;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesDeclaration'] = "#if NUM_BONE_INFLUENCERS>0\nuniform mat4 mBones[BonesPerMesh];\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#if NUM_BONE_INFLUENCERS>4\nattribute vec4 matricesIndicesExtra;\nattribute vec4 matricesWeightsExtra;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesDeclaration'] = "#ifdef INSTANCES\nattribute vec4 world0;\nattribute vec4 world1;\nattribute vec4 world2;\nattribute vec4 world3;\n#else\nuniform mat4 world;\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertexDeclaration'] = "#ifdef POINTSIZE\nuniform float pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertexDeclaration'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n#endif\n";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertexDeclaration'] = "#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertexDeclaration'] = "#ifdef FOG\nvarying vec3 vFogDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexGlobalDeclaration'] = "#ifdef MORPHTARGETS\nuniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexDeclaration'] = "#ifdef MORPHTARGETS\nattribute vec3 position{X};\n#ifdef MORPHTARGETS_NORMAL\nattribute vec3 normal{X};\n#endif\n#ifdef MORPHTARGETS_TANGENT\nattribute vec3 tangent{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthDeclaration'] = "#ifdef LOGARITHMICDEPTH\nuniform float logarithmicDepthConstant;\nvarying float vFragmentDepth;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertex'] = "#ifdef MORPHTARGETS\npositionUpdated+=(position{X}-position)*morphTargetInfluences[{X}];\n#ifdef MORPHTARGETS_NORMAL\nnormalUpdated+=(normal{X}-normal)*morphTargetInfluences[{X}];\n#endif\n#ifdef MORPHTARGETS_TANGENT\ntangentUpdated.xyz+=(tangent{X}-tangent.xyz)*morphTargetInfluences[{X}];\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesVertex'] = "#ifdef INSTANCES\nmat4 finalWorld=mat4(world0,world1,world2,world3);\n#else\nmat4 finalWorld=world;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesVertex'] = "#if NUM_BONE_INFLUENCERS>0\nmat4 influence;\ninfluence=mBones[int(matricesIndices[0])]*matricesWeights[0];\n#if NUM_BONE_INFLUENCERS>1\ninfluence+=mBones[int(matricesIndices[1])]*matricesWeights[1];\n#endif \n#if NUM_BONE_INFLUENCERS>2\ninfluence+=mBones[int(matricesIndices[2])]*matricesWeights[2];\n#endif \n#if NUM_BONE_INFLUENCERS>3\ninfluence+=mBones[int(matricesIndices[3])]*matricesWeights[3];\n#endif \n#if NUM_BONE_INFLUENCERS>4\ninfluence+=mBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];\n#endif \n#if NUM_BONE_INFLUENCERS>5\ninfluence+=mBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];\n#endif \n#if NUM_BONE_INFLUENCERS>6\ninfluence+=mBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];\n#endif \n#if NUM_BONE_INFLUENCERS>7\ninfluence+=mBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];\n#endif \nfinalWorld=finalWorld*influence;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertex'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL)\nvec3 tbnNormal=normalize(normalUpdated);\nvec3 tbnTangent=normalize(tangentUpdated.xyz);\nvec3 tbnBitangent=cross(tbnNormal,tbnTangent)*tangentUpdated.w;\nvTBN=mat3(finalWorld)*mat3(tbnTangent,tbnBitangent,tbnNormal);\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertex'] = "#ifdef CLIPPLANE\nfClipDistance=dot(worldPos,vClipPlane);\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertex'] = "#ifdef FOG\nvFogDistance=(view*worldPos).xyz;\n#endif";
BABYLON.Effect.IncludesShadersStore['shadowsVertex'] = "#ifdef SHADOWS\n#if defined(SHADOW{X}) && !defined(SHADOWCUBE{X})\nvPositionFromLight{X}=lightMatrix{X}*worldPos;\nvDepthMetric{X}=((vPositionFromLight{X}.z+light{X}.depthValues.x)/(light{X}.depthValues.y));\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertex'] = "#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthVertex'] = "#ifdef LOGARITHMICDEPTH\nvFragmentDepth=1.0+gl_Position.w;\ngl_Position.z=log2(max(0.000001,vFragmentDepth))*logarithmicDepthConstant;\n#endif";
BABYLON.Effect.IncludesShadersStore['helperFunctions'] = "const float PI=3.1415926535897932384626433832795;\nconst float LinearEncodePowerApprox=2.2;\nconst float GammaEncodePowerApprox=1.0/LinearEncodePowerApprox;\nconst vec3 LuminanceEncodeApprox=vec3(0.2126,0.7152,0.0722);\nmat3 transposeMat3(mat3 inMatrix) {\nvec3 i0=inMatrix[0];\nvec3 i1=inMatrix[1];\nvec3 i2=inMatrix[2];\nmat3 outMatrix=mat3(\nvec3(i0.x,i1.x,i2.x),\nvec3(i0.y,i1.y,i2.y),\nvec3(i0.z,i1.z,i2.z)\n);\nreturn outMatrix;\n}\n\nmat3 inverseMat3(mat3 inMatrix) {\nfloat a00=inMatrix[0][0],a01=inMatrix[0][1],a02=inMatrix[0][2];\nfloat a10=inMatrix[1][0],a11=inMatrix[1][1],a12=inMatrix[1][2];\nfloat a20=inMatrix[2][0],a21=inMatrix[2][1],a22=inMatrix[2][2];\nfloat b01=a22*a11-a12*a21;\nfloat b11=-a22*a10+a12*a20;\nfloat b21=a21*a10-a11*a20;\nfloat det=a00*b01+a01*b11+a02*b21;\nreturn mat3(b01,(-a22*a01+a02*a21),(a12*a01-a02*a11),\nb11,(a22*a00-a02*a20),(-a12*a00+a02*a10),\nb21,(-a21*a00+a01*a20),(a11*a00-a01*a10))/det;\n}\nfloat computeFallOff(float value,vec2 clipSpace,float frustumEdgeFalloff)\n{\nfloat mask=smoothstep(1.0-frustumEdgeFalloff,1.0,clamp(dot(clipSpace,clipSpace),0.,1.));\nreturn mix(value,1.0,mask);\n}\nvec3 applyEaseInOut(vec3 x){\nreturn x*x*(3.0-2.0*x);\n}\nvec3 toLinearSpace(vec3 color)\n{\nreturn pow(color,vec3(LinearEncodePowerApprox));\n}\nvec3 toGammaSpace(vec3 color)\n{\nreturn pow(color,vec3(GammaEncodePowerApprox));\n}\nfloat square(float value)\n{\nreturn value*value;\n}\nfloat getLuminance(vec3 color)\n{\nreturn clamp(dot(color,LuminanceEncodeApprox),0.,1.);\n}\n\nfloat getRand(vec2 seed) {\nreturn fract(sin(dot(seed.xy ,vec2(12.9898,78.233)))*43758.5453);\n}\nvec3 dither(vec2 seed,vec3 color) {\nfloat rand=getRand(seed);\ncolor+=mix(-0.5/255.0,0.5/255.0,rand);\ncolor=max(color,0.0);\nreturn color;\n}";
BABYLON.Effect.IncludesShadersStore['lightFragmentDeclaration'] = "#ifdef LIGHT{X}\nuniform vec4 vLightData{X};\nuniform vec4 vLightDiffuse{X};\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular{X};\n#else\nvec3 vLightSpecular{X}=vec3(0.);\n#endif\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\nuniform vec4 shadowsInfo{X};\nuniform vec2 depthValues{X};\n#endif\n#ifdef SPOTLIGHT{X}\nuniform vec4 vLightDirection{X};\n#endif\n#ifdef HEMILIGHT{X}\nuniform vec3 vLightGround{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['lightsFragmentFunctions'] = "\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n#ifdef NDOTL\nfloat ndl;\n#endif\n};\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 lightVectorW;\nfloat attenuation=1.0;\nif (lightData.w == 0.)\n{\nvec3 direction=lightData.xyz-vPositionW;\nattenuation=max(0.,1.0-length(direction)/range);\nlightVectorW=normalize(direction);\n}\nelse\n{\nlightVectorW=normalize(-lightData.xyz);\n}\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 direction=lightData.xyz-vPositionW;\nvec3 lightVectorW=normalize(direction);\nfloat attenuation=max(0.,1.0-length(direction)/range);\n\nfloat cosAngle=max(0.,dot(lightDirection.xyz,-lightVectorW));\nif (cosAngle>=lightDirection.w)\n{\ncosAngle=max(0.,pow(cosAngle,lightData.w));\nattenuation*=cosAngle;\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nresult.diffuse=vec3(0.);\n#ifdef SPECULARTERM\nresult.specular=vec3(0.);\n#endif\n#ifdef NDOTL\nresult.ndl=0.;\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float glossiness) {\nlightingInfo result;\n\nfloat ndl=dot(vNormal,lightData.xyz)*0.5+0.5;\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=mix(groundColor,diffuseColor,ndl);\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightData.xyz);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor;\n#endif\nreturn result;\n}\n";
BABYLON.Effect.IncludesShadersStore['lightUboDeclaration'] = "#ifdef LIGHT{X}\nuniform Light{X}\n{\nvec4 vLightData;\nvec4 vLightDiffuse;\nvec3 vLightSpecular;\n#ifdef SPOTLIGHT{X}\nvec4 vLightDirection;\n#endif\n#ifdef HEMILIGHT{X}\nvec3 vLightGround;\n#endif\nvec4 shadowsInfo;\nvec2 depthValues;\n} light{X};\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultVertexDeclaration'] = "\nuniform mat4 viewProjection;\nuniform mat4 view;\n#ifdef DIFFUSE\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\nuniform mat4 specularMatrix;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n";
BABYLON.Effect.IncludesShadersStore['defaultFragmentDeclaration'] = "uniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\nuniform vec3 vEmissiveColor;\n\n#ifdef DIFFUSE\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY \nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform vec2 vTangentSpaceParams;\n#endif\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)\nuniform mat4 view;\n#endif\n#ifdef REFRACTION\nuniform vec4 vRefractionInfos;\n#ifndef REFRACTIONMAP_3D\nuniform mat4 refractionMatrix;\n#endif\n#ifdef REFRACTIONFRESNEL\nuniform vec4 refractionLeftColor;\nuniform vec4 refractionRightColor;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\n#endif\n#ifdef DIFFUSEFRESNEL\nuniform vec4 diffuseLeftColor;\nuniform vec4 diffuseRightColor;\n#endif\n#ifdef OPACITYFRESNEL\nuniform vec4 opacityParts;\n#endif\n#ifdef EMISSIVEFRESNEL\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\n#endif\n\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\n#ifdef REFLECTIONMAP_SKYBOX\n#else\n#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\nuniform mat4 reflectionMatrix;\n#endif\n#endif\n#ifdef REFLECTIONFRESNEL\nuniform vec4 reflectionLeftColor;\nuniform vec4 reflectionRightColor;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultUboDeclaration'] = "layout(std140,column_major) uniform;\nuniform Material\n{\nvec4 diffuseLeftColor;\nvec4 diffuseRightColor;\nvec4 opacityParts;\nvec4 reflectionLeftColor;\nvec4 reflectionRightColor;\nvec4 refractionLeftColor;\nvec4 refractionRightColor;\nvec4 emissiveLeftColor; \nvec4 emissiveRightColor;\nvec2 vDiffuseInfos;\nvec2 vAmbientInfos;\nvec2 vOpacityInfos;\nvec2 vReflectionInfos;\nvec2 vEmissiveInfos;\nvec2 vLightmapInfos;\nvec2 vSpecularInfos;\nvec3 vBumpInfos;\nmat4 diffuseMatrix;\nmat4 ambientMatrix;\nmat4 opacityMatrix;\nmat4 reflectionMatrix;\nmat4 emissiveMatrix;\nmat4 lightmapMatrix;\nmat4 specularMatrix;\nmat4 bumpMatrix; \nvec4 vTangentSpaceParams;\nmat4 refractionMatrix;\nvec4 vRefractionInfos;\nvec4 vSpecularColor;\nvec3 vEmissiveColor;\nvec4 vDiffuseColor;\nfloat pointSize; \n};\nuniform Scene {\nmat4 viewProjection;\nmat4 view;\n};";
BABYLON.Effect.IncludesShadersStore['shadowsFragmentFunctions'] = "#ifdef SHADOWS\n#ifndef SHADOWFLOAT\nfloat unpack(vec4 color)\n{\nconst vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);\nreturn dot(color,bit_shift);\n}\n#endif\nfloat computeShadowCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadow=textureCube(shadowSampler,directionToLight).x;\n#endif\nif (depth>shadow)\n{\nreturn darkness;\n}\nreturn 1.0;\n}\nfloat computeShadowWithPCFCube(vec3 lightPosition,samplerCube shadowSampler,float mapSize,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\nfloat visibility=1.;\nvec3 poissonDisk[4];\npoissonDisk[0]=vec3(-1.0,1.0,-1.0);\npoissonDisk[1]=vec3(1.0,-1.0,-1.0);\npoissonDisk[2]=vec3(-1.0,-1.0,-1.0);\npoissonDisk[3]=vec3(1.0,-1.0,1.0);\n\n#ifndef SHADOWFLOAT\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize))<depth) visibility-=0.25;\n#else\nif (textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize).x<depth) visibility-=0.25;\n#endif\nreturn min(1.0,visibility+darkness);\n}\nfloat computeShadowWithESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness); \nreturn esm;\n}\nfloat computeShadowWithCloseESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn esm;\n}\nfloat computeShadow(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadow=texture2D(shadowSampler,uv).x;\n#endif\nif (shadowPixelDepth>shadow)\n{\nreturn computeFallOff(darkness,clipSpace.xy,frustumEdgeFalloff);\n}\nreturn 1.;\n}\nfloat computeShadowWithPCF(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float mapSize,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\nfloat visibility=1.;\nvec2 poissonDisk[4];\npoissonDisk[0]=vec2(-0.94201624,-0.39906216);\npoissonDisk[1]=vec2(0.94558609,-0.76890725);\npoissonDisk[2]=vec2(-0.094184101,-0.92938870);\npoissonDisk[3]=vec2(0.34495938,0.29387760);\n\n#ifndef SHADOWFLOAT\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[0]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[1]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[2]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[3]*mapSize))<shadowPixelDepth) visibility-=0.25;\n#else\nif (texture2D(shadowSampler,uv+poissonDisk[0]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[1]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[2]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[3]*mapSize).x<shadowPixelDepth) visibility-=0.25;\n#endif\nreturn computeFallOff(min(1.0,visibility+darkness),clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithCloseESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0); \n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\n#endif\n";
BABYLON.Effect.IncludesShadersStore['fresnelFunction'] = "#ifdef FRESNEL\nfloat computeFresnelTerm(vec3 viewDirection,vec3 worldNormal,float bias,float power)\n{\nfloat fresnelTerm=pow(bias+abs(dot(viewDirection,worldNormal)),power);\nreturn clamp(fresnelTerm,0.,1.);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['reflectionFunction'] = "vec3 computeReflectionCoords(vec4 worldPos,vec3 worldNormal)\n{\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvec3 direction=normalize(vDirectionW);\nfloat t=clamp(direction.y*-0.5+0.5,0.,1.0);\nfloat s=atan(direction.z,direction.x)*RECIPROCAL_PI2+0.5;\n#ifdef REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED\nreturn vec3(1.0-s,t,0);\n#else\nreturn vec3(s,t,0);\n#endif\n#endif\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\nvec3 cameraToVertex=normalize(worldPos.xyz-vEyePosition.xyz);\nvec3 r=reflect(cameraToVertex,worldNormal);\nfloat t=clamp(r.y*-0.5+0.5,0.,1.0);\nfloat s=atan(r.z,r.x)*RECIPROCAL_PI2+0.5;\nreturn vec3(s,t,0);\n#endif\n#ifdef REFLECTIONMAP_SPHERICAL\nvec3 viewDir=normalize(vec3(view*worldPos));\nvec3 viewNormal=normalize(vec3(view*vec4(worldNormal,0.0)));\nvec3 r=reflect(viewDir,viewNormal);\nr.z=r.z-1.0;\nfloat m=2.0*length(r);\nreturn vec3(r.x/m+0.5,1.0-r.y/m-0.5,0);\n#endif\n#ifdef REFLECTIONMAP_PLANAR\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=normalize(reflect(viewDir,worldNormal));\nreturn vec3(reflectionMatrix*vec4(coords,1));\n#endif\n#ifdef REFLECTIONMAP_CUBIC\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=reflect(viewDir,worldNormal);\n#ifdef INVERTCUBICMAP\ncoords.y=1.0-coords.y;\n#endif\nreturn vec3(reflectionMatrix*vec4(coords,0));\n#endif\n#ifdef REFLECTIONMAP_PROJECTION\nreturn vec3(reflectionMatrix*(view*worldPos));\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nreturn vPositionUVW;\n#endif\n#ifdef REFLECTIONMAP_EXPLICIT\nreturn vec3(0,0,0);\n#endif\n}";
BABYLON.Effect.IncludesShadersStore['imageProcessingDeclaration'] = "#ifdef EXPOSURE\nuniform float exposureLinear;\n#endif\n#ifdef CONTRAST\nuniform float contrast;\n#endif\n#ifdef VIGNETTE\nuniform vec2 vInverseScreenSize;\nuniform vec4 vignetteSettings1;\nuniform vec4 vignetteSettings2;\n#endif\n#ifdef COLORCURVES\nuniform vec4 vCameraColorCurveNegative;\nuniform vec4 vCameraColorCurveNeutral;\nuniform vec4 vCameraColorCurvePositive;\n#endif\n#ifdef COLORGRADING\n#ifdef COLORGRADING3D\nuniform highp sampler3D txColorTransform;\n#else\nuniform sampler2D txColorTransform;\n#endif\nuniform vec4 colorTransformSettings;\n#endif";
BABYLON.Effect.IncludesShadersStore['imageProcessingFunctions'] = "#if defined(COLORGRADING) && !defined(COLORGRADING3D)\n\nvec3 sampleTexture3D(sampler2D colorTransform,vec3 color,vec2 sampler3dSetting)\n{\nfloat sliceSize=2.0*sampler3dSetting.x; \n#ifdef SAMPLER3DGREENDEPTH\nfloat sliceContinuous=(color.g-sampler3dSetting.x)*sampler3dSetting.y;\n#else\nfloat sliceContinuous=(color.b-sampler3dSetting.x)*sampler3dSetting.y;\n#endif\nfloat sliceInteger=floor(sliceContinuous);\n\n\nfloat sliceFraction=sliceContinuous-sliceInteger;\n#ifdef SAMPLER3DGREENDEPTH\nvec2 sliceUV=color.rb;\n#else\nvec2 sliceUV=color.rg;\n#endif\nsliceUV.x*=sliceSize;\nsliceUV.x+=sliceInteger*sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice0Color=texture2D(colorTransform,sliceUV);\nsliceUV.x+=sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice1Color=texture2D(colorTransform,sliceUV);\nvec3 result=mix(slice0Color.rgb,slice1Color.rgb,sliceFraction);\n#ifdef SAMPLER3DBGRMAP\ncolor.rgb=result.rgb;\n#else\ncolor.rgb=result.bgr;\n#endif\nreturn color;\n}\n#endif\nvec4 applyImageProcessing(vec4 result) {\n#ifdef EXPOSURE\nresult.rgb*=exposureLinear;\n#endif\n#ifdef VIGNETTE\n\nvec2 viewportXY=gl_FragCoord.xy*vInverseScreenSize;\nviewportXY=viewportXY*2.0-1.0;\nvec3 vignetteXY1=vec3(viewportXY*vignetteSettings1.xy+vignetteSettings1.zw,1.0);\nfloat vignetteTerm=dot(vignetteXY1,vignetteXY1);\nfloat vignette=pow(vignetteTerm,vignetteSettings2.w);\n\nvec3 vignetteColor=vignetteSettings2.rgb;\n#ifdef VIGNETTEBLENDMODEMULTIPLY\nvec3 vignetteColorMultiplier=mix(vignetteColor,vec3(1,1,1),vignette);\nresult.rgb*=vignetteColorMultiplier;\n#endif\n#ifdef VIGNETTEBLENDMODEOPAQUE\nresult.rgb=mix(vignetteColor,result.rgb,vignette);\n#endif\n#endif\n#ifdef TONEMAPPING\nconst float tonemappingCalibration=1.590579;\nresult.rgb=1.0-exp2(-tonemappingCalibration*result.rgb);\n#endif\n\nresult.rgb=toGammaSpace(result.rgb);\nresult.rgb=clamp(result.rgb,0.0,1.0);\n#ifdef CONTRAST\n\nvec3 resultHighContrast=applyEaseInOut(result.rgb);\nif (contrast<1.0) {\n\nresult.rgb=mix(vec3(0.5,0.5,0.5),result.rgb,contrast);\n} else {\n\nresult.rgb=mix(result.rgb,resultHighContrast,contrast-1.0);\n}\n#endif\n\n#ifdef COLORGRADING\nvec3 colorTransformInput=result.rgb*colorTransformSettings.xxx+colorTransformSettings.yyy;\n#ifdef COLORGRADING3D\nvec3 colorTransformOutput=texture(txColorTransform,colorTransformInput).rgb;\n#else\nvec3 colorTransformOutput=sampleTexture3D(txColorTransform,colorTransformInput,colorTransformSettings.yz).rgb;\n#endif\nresult.rgb=mix(result.rgb,colorTransformOutput,colorTransformSettings.www);\n#endif\n#ifdef COLORCURVES\n\nfloat luma=getLuminance(result.rgb);\nvec2 curveMix=clamp(vec2(luma*3.0-1.5,luma*-3.0+1.5),vec2(0.0),vec2(1.0));\nvec4 colorCurve=vCameraColorCurveNeutral+curveMix.x*vCameraColorCurvePositive-curveMix.y*vCameraColorCurveNegative;\nresult.rgb*=colorCurve.rgb;\nresult.rgb=mix(vec3(luma),result.rgb,colorCurve.a);\n#endif\nreturn result;\n}";
BABYLON.Effect.IncludesShadersStore['bumpFragmentFunctions'] = "#ifdef BUMP\n#if BUMPDIRECTUV == 1\n#define vBumpUV vMainUV1\n#elif BUMPDIRECTUV == 2\n#define vBumpUV vMainUV2\n#else\nvarying vec2 vBumpUV;\n#endif\nuniform sampler2D bumpSampler;\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n\nmat3 cotangent_frame(vec3 normal,vec3 p,vec2 uv)\n{\n\nuv=gl_FrontFacing ? uv : -uv;\n\nvec3 dp1=dFdx(p);\nvec3 dp2=dFdy(p);\nvec2 duv1=dFdx(uv);\nvec2 duv2=dFdy(uv);\n\nvec3 dp2perp=cross(dp2,normal);\nvec3 dp1perp=cross(normal,dp1);\nvec3 tangent=dp2perp*duv1.x+dp1perp*duv2.x;\nvec3 bitangent=dp2perp*duv1.y+dp1perp*duv2.y;\n\ntangent*=vTangentSpaceParams.x;\nbitangent*=vTangentSpaceParams.y;\n\nfloat invmax=inversesqrt(max(dot(tangent,tangent),dot(bitangent,bitangent)));\nreturn mat3(tangent*invmax,bitangent*invmax,normal);\n}\nvec3 perturbNormal(mat3 cotangentFrame,vec2 uv)\n{\nvec3 map=texture2D(bumpSampler,uv).xyz;\nmap=map*2.0-1.0;\n#ifdef NORMALXYSCALE\nmap=normalize(map*vec3(vBumpInfos.y,vBumpInfos.y,1.0));\n#endif\nreturn normalize(cotangentFrame*map);\n}\n#ifdef PARALLAX\nconst float minSamples=4.;\nconst float maxSamples=15.;\nconst int iMaxSamples=15;\n\nvec2 parallaxOcclusion(vec3 vViewDirCoT,vec3 vNormalCoT,vec2 texCoord,float parallaxScale) {\nfloat parallaxLimit=length(vViewDirCoT.xy)/vViewDirCoT.z;\nparallaxLimit*=parallaxScale;\nvec2 vOffsetDir=normalize(vViewDirCoT.xy);\nvec2 vMaxOffset=vOffsetDir*parallaxLimit;\nfloat numSamples=maxSamples+(dot(vViewDirCoT,vNormalCoT)*(minSamples-maxSamples));\nfloat stepSize=1.0/numSamples;\n\nfloat currRayHeight=1.0;\nvec2 vCurrOffset=vec2(0,0);\nvec2 vLastOffset=vec2(0,0);\nfloat lastSampledHeight=1.0;\nfloat currSampledHeight=1.0;\nfor (int i=0; i<iMaxSamples; i++)\n{\ncurrSampledHeight=texture2D(bumpSampler,vBumpUV+vCurrOffset).w;\n\nif (currSampledHeight>currRayHeight)\n{\nfloat delta1=currSampledHeight-currRayHeight;\nfloat delta2=(currRayHeight+stepSize)-lastSampledHeight;\nfloat ratio=delta1/(delta1+delta2);\nvCurrOffset=(ratio)* vLastOffset+(1.0-ratio)*vCurrOffset;\n\nbreak;\n}\nelse\n{\ncurrRayHeight-=stepSize;\nvLastOffset=vCurrOffset;\nvCurrOffset+=stepSize*vMaxOffset;\nlastSampledHeight=currSampledHeight;\n}\n}\nreturn vCurrOffset;\n}\nvec2 parallaxOffset(vec3 viewDir,float heightScale)\n{\n\nfloat height=texture2D(bumpSampler,vBumpUV).w;\nvec2 texCoordOffset=heightScale*viewDir.xy*height;\nreturn -texCoordOffset;\n}\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragmentDeclaration'] = "#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragmentDeclaration'] = "#ifdef FOG\n#define FOGMODE_NONE 0.\n#define FOGMODE_EXP 1.\n#define FOGMODE_EXP2 2.\n#define FOGMODE_LINEAR 3.\n#define E 2.71828\nuniform vec4 vFogInfos;\nuniform vec3 vFogColor;\nvarying vec3 vFogDistance;\nfloat CalcFogFactor()\n{\nfloat fogCoeff=1.0;\nfloat fogStart=vFogInfos.y;\nfloat fogEnd=vFogInfos.z;\nfloat fogDensity=vFogInfos.w;\nfloat fogDistance=length(vFogDistance);\nif (FOGMODE_LINEAR == vFogInfos.x)\n{\nfogCoeff=(fogEnd-fogDistance)/(fogEnd-fogStart);\n}\nelse if (FOGMODE_EXP == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDensity);\n}\nelse if (FOGMODE_EXP2 == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDistance*fogDensity*fogDensity);\n}\nreturn clamp(fogCoeff,0.0,1.0);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragment'] = "#ifdef CLIPPLANE\nif (fClipDistance>0.0)\n{\ndiscard;\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpFragment'] = "vec2 uvOffset=vec2(0.0,0.0);\n#if defined(BUMP) || defined(PARALLAX)\n#ifdef NORMALXYSCALE\nfloat normalScale=1.0;\n#else \nfloat normalScale=vBumpInfos.y;\n#endif\n#if defined(TANGENT) && defined(NORMAL)\nmat3 TBN=vTBN;\n#else\nmat3 TBN=cotangent_frame(normalW*normalScale,vPositionW,vBumpUV);\n#endif\n#endif\n#ifdef PARALLAX\nmat3 invTBN=transposeMat3(TBN);\n#ifdef PARALLAXOCCLUSION\nuvOffset=parallaxOcclusion(invTBN*-viewDirectionW,invTBN*normalW,vBumpUV,vBumpInfos.z);\n#else\nuvOffset=parallaxOffset(invTBN*viewDirectionW,vBumpInfos.z);\n#endif\n#endif\n#ifdef BUMP\nnormalW=perturbNormal(TBN,vBumpUV+uvOffset);\n#endif";
BABYLON.Effect.IncludesShadersStore['lightFragment'] = "#ifdef LIGHT{X}\n#if defined(SHADOWONLY) || (defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X}))\n\n#else\n#ifdef PBR\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#else\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,glossiness);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#endif\n#endif\n#ifdef SHADOW{X}\n#ifdef SHADOWCLOSEESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithCloseESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithCloseESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else\n#ifdef SHADOWESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else \n#ifdef SHADOWPCF{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithPCFCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadowWithPCF(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#else\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadow(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#endif\n#endif\n#endif\n#ifdef SHADOWONLY\n#ifndef SHADOWINUSE\n#define SHADOWINUSE\n#endif\nglobalShadow+=shadow;\nshadowLightCount+=1.0;\n#endif\n#else\nshadow=1.;\n#endif\n#ifndef SHADOWONLY\n#ifdef CUSTOMUSERLIGHTING\ndiffuseBase+=computeCustomDiffuseLighting(info,diffuseBase,shadow);\n#ifdef SPECULARTERM\nspecularBase+=computeCustomSpecularLighting(info,specularBase,shadow);\n#endif\n#elif defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})\ndiffuseBase+=lightmapColor*shadow;\n#ifdef SPECULARTERM\n#ifndef LIGHTMAPNOSPECULAR{X}\nspecularBase+=info.specular*shadow*lightmapColor;\n#endif\n#endif\n#else\ndiffuseBase+=info.diffuse*shadow;\n#ifdef SPECULARTERM\nspecularBase+=info.specular*shadow;\n#endif\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthFragment'] = "#ifdef LOGARITHMICDEPTH\ngl_FragDepthEXT=log2(vFragmentDepth)*logarithmicDepthConstant*0.5;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragment'] = "#ifdef FOG\nfloat fog=CalcFogFactor();\ncolor.rgb=fog*color.rgb+(1.0-fog)*vFogColor;\n#endif";
var SphericalPolynomial = BABYLON.SphericalPolynomial;
var SphericalHarmonics = BABYLON.SphericalHarmonics;
var CubeMapToSphericalPolynomialTools = BABYLON.CubeMapToSphericalPolynomialTools;
var PanoramaToCubeMapTools = BABYLON.PanoramaToCubeMapTools;
var HDRTools = BABYLON.HDRTools;
var reprocessed = BABYLON.reprocessed;
var reprocessed = BABYLON.reprocessed;
var reprocessed = BABYLON.reprocessed;
var reprocessed = BABYLON.reprocessed;
var HDRCubeTexture = BABYLON.HDRCubeTexture;

export { SphericalPolynomial,SphericalHarmonics,CubeMapToSphericalPolynomialTools,PanoramaToCubeMapTools,HDRTools,reprocessed,reprocessed,reprocessed,reprocessed,HDRCubeTexture };