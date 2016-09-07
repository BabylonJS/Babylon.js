var BABYLON;
(function (BABYLON) {
    var Internals;
    (function (Internals) {
        var FileFaceOrientation = (function () {
            function FileFaceOrientation(name, worldAxisForNormal, worldAxisForFileX, worldAxisForFileY) {
                this.name = name;
                this.worldAxisForNormal = worldAxisForNormal;
                this.worldAxisForFileX = worldAxisForFileX;
                this.worldAxisForFileY = worldAxisForFileY;
            }
            return FileFaceOrientation;
        })();
        ;
        /**
         * Helper class dealing with the extraction of spherical polynomial dataArray
         * from a cube map.
         */
        var CubeMapToSphericalPolynomialTools = (function () {
            function CubeMapToSphericalPolynomialTools() {
            }
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
                    for (var y = 0; y < cubeInfo.size; y++) {
                        var u = minUV;
                        for (var x = 0; x < cubeInfo.size; x++) {
                            // World direction (not normalised)
                            var worldDirection = fileFace.worldAxisForFileX.scale(u).add(fileFace.worldAxisForFileY.scale(v)).add(fileFace.worldAxisForNormal);
                            worldDirection.normalize();
                            var deltaSolidAngle = Math.pow(1.0 + u * u + v * v, -3.0 / 2.0);
                            if (1) {
                                var r = dataArray[(y * cubeInfo.size * 3) + (x * 3) + 0];
                                var g = dataArray[(y * cubeInfo.size * 3) + (x * 3) + 1];
                                var b = dataArray[(y * cubeInfo.size * 3) + (x * 3) + 2];
                                var color = new BABYLON.Color3(r, g, b);
                                sphericalHarmonics.addLight(worldDirection, color, deltaSolidAngle);
                            }
                            else {
                                if (faceIndex == 0) {
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 0] = 1;
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 1] = 0;
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 2] = 0;
                                }
                                else if (faceIndex == 1) {
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 0] = 0;
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 1] = 1;
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 2] = 0;
                                }
                                else if (faceIndex == 2) {
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 0] = 0;
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 1] = 0;
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 2] = 1;
                                }
                                else if (faceIndex == 3) {
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 0] = 1;
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 1] = 1;
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 2] = 0;
                                }
                                else if (faceIndex == 4) {
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 0] = 1;
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 1] = 0;
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 2] = 1;
                                }
                                else if (faceIndex == 5) {
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 0] = 0;
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 1] = 1;
                                    dataArray[(y * cubeInfo.size * 3) + (x * 3) + 2] = 1;
                                }
                                var color = new BABYLON.Color3(dataArray[(y * cubeInfo.size * 3) + (x * 3) + 0], dataArray[(y * cubeInfo.size * 3) + (x * 3) + 1], dataArray[(y * cubeInfo.size * 3) + (x * 3) + 2]);
                                sphericalHarmonics.addLight(worldDirection, color, deltaSolidAngle);
                            }
                            totalSolidAngle += deltaSolidAngle;
                            u += du;
                        }
                        v += dv;
                    }
                }
                var correctSolidAngle = 4.0 * Math.PI; // Solid angle for entire sphere is 4*pi
                var correction = correctSolidAngle / totalSolidAngle;
                sphericalHarmonics.scale(correction);
                // Additionally scale by pi -- audit needed
                sphericalHarmonics.scale(1.0 / Math.PI);
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
        })();
        Internals.CubeMapToSphericalPolynomialTools = CubeMapToSphericalPolynomialTools;
    })(Internals = BABYLON.Internals || (BABYLON.Internals = {}));
})(BABYLON || (BABYLON = {}));
