module BABYLON {
    export class SpotLight extends Light {

        private _transformedDirection: Vector3;
        private _transformedPosition: Vector3;
        private _worldMatrix: Matrix;

        constructor(name: string, public position: Vector3, public direction: Vector3, public angle: number, public exponent: number, scene: Scene) {
            super(name, scene);
        }

        public setDirectionToTarget(target: Vector3): Vector3 {
            this.direction = BABYLON.Vector3.Normalize(target.subtract(this.position));
            return this.direction;
        }

        public transferToEffect(effect: Effect, positionUniformName: string, directionUniformName: string): void {
            var normalizeDirection;

            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._transformedDirection) {
                    this._transformedDirection = BABYLON.Vector3.Zero();
                }
                if (!this._transformedPosition) {
                    this._transformedPosition = BABYLON.Vector3.Zero();
                }

                var parentWorldMatrix = this.parent.getWorldMatrix();

                BABYLON.Vector3.TransformCoordinatesToRef(this.position, parentWorldMatrix, this._transformedPosition);
                BABYLON.Vector3.TransformNormalToRef(this.direction, parentWorldMatrix, this._transformedDirection);

                effect.setFloat4(positionUniformName, this._transformedPosition.x, this._transformedPosition.y, this._transformedPosition.z, this.exponent);
                normalizeDirection = BABYLON.Vector3.Normalize(this._transformedDirection);
            } else {
                effect.setFloat4(positionUniformName, this.position.x, this.position.y, this.position.z, this.exponent);
                normalizeDirection = BABYLON.Vector3.Normalize(this.direction);
            }

            effect.setFloat4(directionUniformName, normalizeDirection.x, normalizeDirection.y, normalizeDirection.z, Math.cos(this.angle * 0.5));
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