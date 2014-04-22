module BABYLON {
    export class Light extends Node {
        public intensity = 1.0;
        public animations; //ANY
        public excludedMeshes; //ANY

        private _shadowGenerator; //ANY
        private _parentedWorldMatrix: Matrix;

        //ANY
        constructor(name: string, scene) {
            super(name, scene);

            scene.lights.push(this);

            // Exclusions
            this.excludedMeshes = [];
        }

        //ANY
        public getShadowGenerator() {
            return this._shadowGenerator;
        }

        // ANY
        public transferToEffect(effect, uniformName0?: string, uniformName1?: string): void {
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