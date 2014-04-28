module BABYLON {
    export class DirectionalLight extends Light {
        public position: Vector3;

        private _transformedDirection: Vector3;
        public _transformedPosition: Vector3;
        private _worldMatrix: Matrix;

        constructor(name: string, public direction: Vector3, scene: Scene) {
            super(name, scene);

            this.position = direction.scale(-1);
        }

        public setDirectionToTarget(target: Vector3): Vector3 {
            this.direction = BABYLON.Vector3.Normalize(target.subtract(this.position));
            return this.direction;
        }

        public _computeTransformedPosition(): boolean {
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._transformedPosition) {
                    this._transformedPosition = BABYLON.Vector3.Zero();
                }

                BABYLON.Vector3.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), this._transformedPosition);
                return true;
            }

            return false;
        }

        public transferToEffect(effect: Effect, directionUniformName: string): void {
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._transformedDirection) {
                    this._transformedDirection = BABYLON.Vector3.Zero();
                }

                BABYLON.Vector3.TransformNormalToRef(this.direction, this.parent.getWorldMatrix(), this._transformedDirection);
                effect.setFloat4(directionUniformName, this._transformedDirection.x, this._transformedDirection.y, this._transformedDirection.z, 1);

                return;
            }

            effect.setFloat4(directionUniformName, this.direction.x, this.direction.y, this.direction.z, 1);
        }

        public _getWorldMatrix(): Matrix {
            if (!this._worldMatrix) {
                this._worldMatrix = BABYLON.Matrix.Identity();
            }

            BABYLON.Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix);

            return this._worldMatrix;
        }
    }
}  