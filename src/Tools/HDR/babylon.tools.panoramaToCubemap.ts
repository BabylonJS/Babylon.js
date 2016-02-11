module BABYLON.Internals {
    export interface CubeMapInfo {
        front: Float32Array;
        back: Float32Array;
        left: Float32Array;
        right: Float32Array;
        up: Float32Array;
        down: Float32Array;
        size: number;
    }

    export class PanoramaToCubeMapTools {

        private static FACE_FRONT = [
            new Vector3(-1.0, -1.0, -1.0),
            new Vector3(1.0, -1.0, -1.0),
            new Vector3(-1.0, 1.0, -1.0),
            new Vector3(1.0, 1.0, -1.0)
        ];
        private static FACE_BACK = [
            new Vector3(1.0, -1.0, 1.0),
            new Vector3(-1.0, -1.0, 1.0),
            new Vector3(1.0, 1.0, 1.0),
            new Vector3(-1.0, 1.0, 1.0)
        ];
        private static FACE_LEFT = [
            new Vector3(1.0, -1.0, -1.0),
            new Vector3(1.0, -1.0, 1.0),
            new Vector3(1.0, 1.0, -1.0),
            new Vector3(1.0, 1.0, 1.0)
        ];
        private static FACE_RIGHT = [
            new Vector3(-1.0, -1.0, 1.0),
            new Vector3(-1.0, -1.0, -1.0),
            new Vector3(-1.0, 1.0, 1.0),
            new Vector3(-1.0, 1.0, -1.0)
        ];
        private static FACE_UP = [
            new Vector3(-1.0, 1.0, -1.0),
            new Vector3(1.0, 1.0, -1.0),
            new Vector3(-1.0, 1.0, 1.0),
            new Vector3(1.0, 1.0, 1.0)
        ];
        private static FACE_DOWN = [
            new Vector3(-1.0, -1.0, 1.0),
            new Vector3(1.0, -1.0, 1.0),
            new Vector3(-1.0, -1.0, -1.0),
            new Vector3(1.0, -1.0, -1.0)
        ];

        public static ConvertPanoramaToCubemap(float32Array: Float32Array, inputWidth: number, inputHeight: number, size: number): CubeMapInfo {
            if (!float32Array) {
                throw "ConvertPanoramaToCubemap: input cannot be null";
            }

            if (float32Array.length != inputWidth * inputHeight * 3) {
                throw "ConvertPanoramaToCubemap: input size is wrong";
            }

            var textureFront  = this.CreateCubemapTexture(size, this.FACE_FRONT, float32Array, inputWidth, inputHeight);
            var textureBack   = this.CreateCubemapTexture(size, this.FACE_BACK, float32Array, inputWidth, inputHeight);
            var textureLeft   = this.CreateCubemapTexture(size, this.FACE_LEFT, float32Array, inputWidth, inputHeight);
            var textureRight  = this.CreateCubemapTexture(size, this.FACE_RIGHT, float32Array, inputWidth, inputHeight);
            var textureUp     = this.CreateCubemapTexture(size, this.FACE_UP, float32Array, inputWidth, inputHeight);
            var textureDown   = this.CreateCubemapTexture(size, this.FACE_DOWN, float32Array, inputWidth, inputHeight);

            return {
                front: textureFront,
                back: textureBack,
                left: textureLeft,
                right: textureRight,
                up: textureUp,
                down: textureDown,
                size: size
            };
        }

        private static CreateCubemapTexture(texSize: number, faceData: Vector3[], float32Array: Float32Array, inputWidth: number, inputHeight: number) {
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
        }

        private static CalcProjectionSpherical(vDir: Vector3, float32Array: Float32Array, inputWidth: number, inputHeight: number): any {
            var theta = Math.atan2(vDir.z, vDir.x);
            var phi   = Math.acos(vDir.y);
            
            while (theta < -Math.PI) theta += 2 * Math.PI;
            while (theta > Math.PI) theta -= 2 * Math.PI;

            var dx = theta / Math.PI;
            var dy = phi / Math.PI;
            
            // recenter.
            dx = dx * 0.5 + 0.5;

            var px = Math.round(dx * inputWidth);
            if (px < 0) px = 0;
            else if (px >= inputWidth) px = inputWidth - 1;

            var py = Math.round(dy * inputHeight);
            if (py < 0) py = 0;
            else if (py >= inputHeight) py = inputHeight - 1;

            var inputY = (inputHeight - py - 1);
            var r = float32Array[inputY * inputWidth * 3 + (px * 3) + 0];
            var g = float32Array[inputY * inputWidth * 3 + (px * 3) + 1];
            var b = float32Array[inputY * inputWidth * 3 + (px * 3) + 2];

            return {
                r: r,
                g: g,
                b: b
            };
        }
    }
} 