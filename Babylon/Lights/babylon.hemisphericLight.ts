module BABYLON {
    export class HemisphericLight extends Light {
        public diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
        public specular = new BABYLON.Color3(1.0, 1.0, 1.0);
        public groundColor = new BABYLON.Color3(0.0, 0.0, 0.0);

        private _worldMatrix: Matrix;

        //ANY
        constructor(name: string, public direction: Vector3, scene) {
            super(name, scene);
        }

        //ANY
        public getShadowGenerator() {
            return null;
        }

        //ANY
        public transferToEffect(effect, directionUniformName: string, groundColorUniformName: string): void {
            var normalizeDirection = BABYLON.Vector3.Normalize(this.direction);
            effect.setFloat4(directionUniformName, normalizeDirection.x, normalizeDirection.y, normalizeDirection.z, 0);
            effect.setColor3(groundColorUniformName, this.groundColor.scale(this.intensity));
        }

        public _getWorldMatrix(): Matrix {
            if (!this._worldMatrix) {
                this._worldMatrix = BABYLON.Matrix.Identity();
            }

            return this._worldMatrix;
        }
    }
} 