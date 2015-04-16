module BABYLON {
    export class PointLight extends Light {
        private _worldMatrix: Matrix;
        private _transformedPosition: Vector3;

        constructor(name: string, public position: Vector3, scene: Scene) {
            super(name, scene);
        }

        public getAbsolutePosition(): Vector3 {
            return this._transformedPosition ? this._transformedPosition : this.position;
        }

        public transferToEffect(effect: Effect, positionUniformName: string): void {
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._transformedPosition) {
                    this._transformedPosition = Vector3.Zero();
                }

                Vector3.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), this._transformedPosition);
                effect.setFloat4(positionUniformName, this._transformedPosition.x, this._transformedPosition.y, this._transformedPosition.z, 0);

                return;
            }

            effect.setFloat4(positionUniformName, this.position.x, this.position.y, this.position.z, 0);
        }

        public getShadowGenerator(): ShadowGenerator {
            return null;
        }

        public _getWorldMatrix(): Matrix {
            if (!this._worldMatrix) {
                this._worldMatrix = Matrix.Identity();
            }

            Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix);

            return this._worldMatrix;
        }
    }
} 