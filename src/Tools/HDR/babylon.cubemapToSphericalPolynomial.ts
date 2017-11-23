module BABYLON.Internals {

    class FileFaceOrientation {
        public name: string;
        public worldAxisForNormal: Vector3; // the world axis corresponding to the normal to the face
        public worldAxisForFileX: Vector3; // the world axis corresponding to texture right x-axis in file
        public worldAxisForFileY: Vector3; // the world axis corresponding to texture down y-axis in file

        public constructor(name: string, worldAxisForNormal: Vector3, worldAxisForFileX: Vector3, worldAxisForFileY: Vector3) {
            this.name = name;
            this.worldAxisForNormal = worldAxisForNormal;
            this.worldAxisForFileX = worldAxisForFileX;
            this.worldAxisForFileY = worldAxisForFileY;
        }
    };
    
    /**
     * Helper class dealing with the extraction of spherical polynomial dataArray
     * from a cube map.
     */
    export class CubeMapToSphericalPolynomialTools {

        private static FileFaces: FileFaceOrientation[] = [
            new FileFaceOrientation("right", new Vector3(1, 0, 0), new Vector3(0, 0, -1), new Vector3(0, -1, 0)), // +X east
            new FileFaceOrientation("left", new Vector3(-1, 0, 0), new Vector3(0, 0, 1), new Vector3(0, -1, 0)), // -X west
            new FileFaceOrientation("up", new Vector3(0, 1, 0), new Vector3(1, 0, 0), new Vector3(0, 0, 1)), // +Y north
            new FileFaceOrientation("down", new Vector3(0, -1, 0), new Vector3(1, 0, 0), new Vector3(0, 0, -1)), // -Y south
            new FileFaceOrientation("front", new Vector3(0, 0, 1), new Vector3(1, 0, 0), new Vector3(0, -1, 0)), // +Z top
            new FileFaceOrientation("back", new Vector3(0, 0, -1), new Vector3(-1, 0, 0), new Vector3(0, -1, 0))// -Z bottom
        ];

        /**
         * Converts a texture to the according Spherical Polynomial data. 
         * This extracts the first 3 orders only as they are the only one used in the lighting.
         * 
         * @param texture The texture to extract the information from.
         * @return The Spherical Polynomial data.
         */
        public static ConvertCubeMapTextureToSphericalPolynomial(texture: BaseTexture) {
            if (!texture.isCube) {
                // Only supports cube Textures currently.
                return null;
            }

            var size = texture.getSize().width;
            var right = texture.readPixels(0);
            var left = texture.readPixels(1);

            var up: Nullable<ArrayBufferView>;
            var down: Nullable<ArrayBufferView>;
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
            var format = Engine.TEXTUREFORMAT_RGBA;
            var type = Engine.TEXTURETYPE_UNSIGNED_INT;
            if (texture.textureType && texture.textureType !== Engine.TEXTURETYPE_UNSIGNED_INT) {
                type = Engine.TEXTURETYPE_FLOAT;
            }

            var cubeInfo: CubeMapInfo = {
                size,
                right,
                left,
                up,
                down,
                front,
                back,
                format,
                type,
                gammaSpace,
            };

            return this.ConvertCubeMapToSphericalPolynomial(cubeInfo);
        }

        /**
         * Converts a cubemap to the according Spherical Polynomial data. 
         * This extracts the first 3 orders only as they are the only one used in the lighting.
         * 
         * @param cubeInfo The Cube map to extract the information from.
         * @return The Spherical Polynomial data.
         */
        public static ConvertCubeMapToSphericalPolynomial(cubeInfo: CubeMapInfo): SphericalPolynomial {
            var sphericalHarmonics = new SphericalHarmonics();
            var totalSolidAngle = 0.0;

            // The (u,v) range is [-1,+1], so the distance between each texel is 2/Size.
            var du = 2.0 / cubeInfo.size;
            var dv = du;

            // The (u,v) of the first texel is half a texel from the corner (-1,-1).
            var minUV = du * 0.5 - 1.0;

            for (var faceIndex = 0; faceIndex < 6; faceIndex++) {
                var fileFace = this.FileFaces[faceIndex];
                var dataArray = (<any>cubeInfo)[fileFace.name];
                var v = minUV;

                // TODO: we could perform the summation directly into a SphericalPolynomial (SP), which is more efficient than SphericalHarmonic (SH).
                // This is possible because during the summation we do not need the SH-specific properties, e.g. orthogonality.
                // Because SP is still linear, so summation is fine in that basis.
                const stride = cubeInfo.format === Engine.TEXTUREFORMAT_RGBA ? 4 : 3;
                for (var y = 0; y < cubeInfo.size; y++) {
                    var u = minUV;

                    for (var x = 0; x < cubeInfo.size; x++) {
                        // World direction (not normalised)
                        var worldDirection =
                            fileFace.worldAxisForFileX.scale(u).add(
                                fileFace.worldAxisForFileY.scale(v)).add(
                                fileFace.worldAxisForNormal);
                        worldDirection.normalize();

                        var deltaSolidAngle = Math.pow(1.0 + u * u + v * v, -3.0 / 2.0);

                        var r = dataArray[(y * cubeInfo.size * stride) + (x * stride) + 0];
                        var g = dataArray[(y * cubeInfo.size * stride) + (x * stride) + 1];
                        var b = dataArray[(y * cubeInfo.size * stride) + (x * stride) + 2];

                        // Handle Integer types.
                        if (cubeInfo.type === Engine.TEXTURETYPE_UNSIGNED_INT) {
                            r /= 255;
                            g /= 255;
                            b /= 255;
                        }

                        // Handle Gamma space textures.
                        if (cubeInfo.gammaSpace) {
                            r = Math.pow(Scalar.Clamp(r), ToLinearSpace);
                            g = Math.pow(Scalar.Clamp(g), ToLinearSpace);
                            b = Math.pow(Scalar.Clamp(b), ToLinearSpace);
                        }

                        var color = new Color3(r, g, b);

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

            return SphericalPolynomial.getSphericalPolynomialFromHarmonics(sphericalHarmonics);
        }
    }
} 
