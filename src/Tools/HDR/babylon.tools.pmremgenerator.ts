module BABYLON.Internals {
    export class PMREMGenerator {
        
        constructor(public levelCount: number) {
        }

        public generateMipmaps(faces: ArrayBufferView[]): ArrayBufferView[][] {
            // Prepare a well sized result.
            var result: ArrayBufferView[][] = [];
            var totalAngle = Math.PI * 2;
            var levelBlurAngle = totalAngle / this.levelCount;
            var currentLevel = 0;
            
            // TODO Handle none full float 
            // / 4 in full float
            var currentArraySize = faces[0].byteLength / 4;
            var currentPixelsCount = currentArraySize / 3;
            var currentCubeFaceSize = Math.sqrt(currentPixelsCount);
            
            // Find back the max number of levels in the cube map.
            var totalLevelCount = Math.log(currentCubeFaceSize) * Math.LOG2E;
            
            // Go accross levels.
            for (let i = 1; i <= this.levelCount; i++) {
                // Prepare output arrays.
                result.length++;
                
                // Prepare required data.
                currentLevel++;
                currentCubeFaceSize = Math.pow(2, totalLevelCount - currentLevel); 
                currentPixelsCount = currentCubeFaceSize * currentCubeFaceSize * 3;
                
                // Go accross faces.
                for (let j = 0; j < 6; j++) {
                    // Prepare output arrays.
                    result[i].length++;
                    
                    // TODO Handle none full float.
                    var data = new Float32Array(currentPixelsCount);
                    
                    // Go accross each pixels to fill in.
                    for (let y = 0; y < currentCubeFaceSize; y++) {
                        
                        // Scanline
                        for (let x = 0; x < currentCubeFaceSize; x++) {
                            
                            var color = this.getCosineBlur(faces, x, y, j);
                            
                            data[(y * currentCubeFaceSize + x) * 3 + 0] = color.r;
                            data[(y * currentCubeFaceSize + x) * 3 + 1] = color.g;
                            data[(y * currentCubeFaceSize + x) * 3 + 2] = color.b;
                        } 
                    }
                    
                    result[i][j] = data;
                }    
            }
            
            return result;
        }
        
        private static _tempColor: Color3 = new Color3();
        
        private getCosineBlur(faces: ArrayBufferView[], x: number, y:number, faceIndex: number): Color3 {
            PMREMGenerator._tempColor.r = faceIndex / 6;
            PMREMGenerator._tempColor.r = faceIndex / 6;
            PMREMGenerator._tempColor.r = faceIndex / 6;
            
            return PMREMGenerator._tempColor;
        }
    }
} 