module BABYLON.Internals {

    class FileFaceOrientation
    {
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

    export class CubeMapToSphericalPolynomialTools {        

        private static FileFaces: FileFaceOrientation[] = [
            new FileFaceOrientation("left", new Vector3(1, 0, 0), new Vector3(0, 0, -1), new Vector3(0, -1, 0)), // +X east
            new FileFaceOrientation("right", new Vector3(-1, 0, 0), new Vector3(0, 0, 1), new Vector3(0, -1, 0)), // -X west
            new FileFaceOrientation("down", new Vector3(0, 1, 0), new Vector3(1, 0, 0), new Vector3(0, 0, 1)), // +Y north
            new FileFaceOrientation("up", new Vector3(0, -1, 0), new Vector3(1, 0, 0), new Vector3(0, 0, -1)), // -Y south
            new FileFaceOrientation("front", new Vector3(0, 0, 1), new Vector3(1, 0, 0), new Vector3(0, -1, 0)), // +Z top
            new FileFaceOrientation("back", new Vector3(0, 0, -1), new Vector3(-1, 0, 0), new Vector3(0, -1, 0))// -Z bottom
        ];
        
        public static ConvertCubeMapToSphericalPolynomial(cubeInfo: CubeMapInfo): SphericalPolynomial {
            var sphericalHarmonics = new SphericalHarmonics();
            var totalSolidAngle = 0.0;

            // The (u,v) range is [-1,+1], so the distance between each texel is 2/Size.
            var du = 2.0 / cubeInfo.size;
            var dv = du;

            // The (u,v) of the first texel is half a texel from the corner (-1,-1).
            var minUV = du * 0.5 - 1.0;

            for (var faceIndex = 0; faceIndex < 6; faceIndex++)
            {
                var fileFace = this.FileFaces[faceIndex];
                var dataArray = cubeInfo[fileFace.name];
                var v = minUV;

                // TODO: we could perform the summation directly into a SphericalPolynomial (SP), which is more efficient than SphericalHarmonic (SH).
                // This is possible because during the summation we do not need the SH-specific properties, e.g. orthogonality.
                // Because SP is still linear, so summation is fine in that basis.

                for (var y = 0; y < cubeInfo.size; y++)
                {
                    var u = minUV;

                    for (var x = 0; x < cubeInfo.size; x++)
                    {
                        // World direction (not normalised)
                        var worldDirection =
                            fileFace.worldAxisForFileX.scale(u).add(
                            fileFace.worldAxisForFileY.scale(v)).add(
                            fileFace.worldAxisForNormal);
                        worldDirection.normalize();

                        var deltaSolidAngle = Math.pow(1.0 + u * u + v * v, -3.0 / 2.0);

                        if (1) {
                            var r = dataArray[(y * cubeInfo.size * 3) + (x * 3) + 0];
                            var g = dataArray[(y * cubeInfo.size * 3) + (x * 3) + 1];
                            var b = dataArray[(y * cubeInfo.size * 3) + (x * 3) + 2];

                            var color = new Color3(r, g, b);

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

                            var color = new Color3(dataArray[(y * cubeInfo.size * 3) + (x * 3) + 0], 
                                dataArray[(y * cubeInfo.size * 3) + (x * 3) + 1], 
                                dataArray[(y * cubeInfo.size * 3) + (x * 3) + 2]);

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

            return SphericalPolynomial.getSphericalPolynomialFromHarmonics(sphericalHarmonics);
        }
    }
} 