module BABYLON {
    export class Light extends Node {
        public diffuse = new Color3(1.0, 1.0, 1.0);
        public specular = new Color3(1.0, 1.0, 1.0);
        public intensity = 1.0;
        public range = Number.MAX_VALUE;
        public excludedMeshes = new Array<AbstractMesh>();

        public _shadowGenerator: ShadowGenerator;
        private _parentedWorldMatrix: Matrix;
        public _excludedMeshesIds = new Array<string>();

        constructor(name: string, scene: Scene) {
            super(name, scene);

            scene.lights.push(this);
        }

        public getShadowGenerator(): ShadowGenerator {
            return this._shadowGenerator;
        }

        public transferToEffect(effect: Effect, uniformName0?: string, uniformName1?: string): void {
        }

        public _getWorldMatrix(): Matrix {
            return Matrix.Identity();
        }

        public getWorldMatrix(): Matrix {
            this._currentRenderId = this.getScene().getRenderId();

            var worldMatrix = this._getWorldMatrix();

            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._parentedWorldMatrix) {
                    this._parentedWorldMatrix = BABYLON.Matrix.Identity();
                }

                worldMatrix.multiplyToRef(this.parent.getWorldMatrix(), this._parentedWorldMatrix);

                return this._parentedWorldMatrix;
            }

            return worldMatrix;
        }

        public dispose(): void {
            if (this._shadowGenerator) {
                this._shadowGenerator.dispose();
                this._shadowGenerator = null;
            }

            // Remove from scene
            var index = this.getScene().lights.indexOf(this);
            this.getScene().lights.splice(index, 1);
        }
    }
} 