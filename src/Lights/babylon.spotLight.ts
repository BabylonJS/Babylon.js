module BABYLON {
    export class SpotLight extends Light implements IShadowLight {

        public transformedPosition: Vector3;

        private _transformedDirection: Vector3;
        private _worldMatrix: Matrix;

        constructor(name: string, public position: Vector3, public direction: Vector3, public angle: number, public exponent: number, scene: Scene) {
            super(name, scene);
        }

        public getAbsolutePosition(): Vector3 {
            return this.transformedPosition ? this.transformedPosition : this.position;
        }

        public setShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void {
            var activeCamera = this.getScene().activeCamera;
            Matrix.PerspectiveFovLHToRef(this.angle, 1.0, activeCamera.minZ, activeCamera.maxZ, matrix);
        }

        public needCube(): boolean {
            return false;
        }

        public supportsVSM(): boolean {
            return true;
        }

        public needRefreshPerFrame(): boolean {
            return false;
        }

        public getShadowDirection(faceIndex?: number): Vector3 {
            return this.direction;
        }
        
        public setDirectionToTarget(target: Vector3): Vector3 {
            this.direction = Vector3.Normalize(target.subtract(this.position));
            return this.direction;
        }

        public computeTransformedPosition(): boolean {
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this.transformedPosition) {
                    this.transformedPosition = Vector3.Zero();
                }

                Vector3.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), this.transformedPosition);
                return true;
            }

            return false;
        }

        public transferToEffect(effect: Effect, positionUniformName: string, directionUniformName: string): void {
            var normalizeDirection;

            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._transformedDirection) {
                    this._transformedDirection = Vector3.Zero();
                }

                this.computeTransformedPosition();
                
                Vector3.TransformNormalToRef(this.direction, this.parent.getWorldMatrix(), this._transformedDirection);

                effect.setFloat4(positionUniformName, this.transformedPosition.x, this.transformedPosition.y, this.transformedPosition.z, this.exponent);
                normalizeDirection = Vector3.Normalize(this._transformedDirection);
            } else {
                effect.setFloat4(positionUniformName, this.position.x, this.position.y, this.position.z, this.exponent);
                normalizeDirection = Vector3.Normalize(this.direction);
            }

            effect.setFloat4(directionUniformName, normalizeDirection.x, normalizeDirection.y, normalizeDirection.z, Math.cos(this.angle * 0.5));
        }

        public _getWorldMatrix(): Matrix {
            if (!this._worldMatrix) {
                this._worldMatrix = Matrix.Identity();
            }

            Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix);

            return this._worldMatrix;
        }

        public serialize(): any {
            var serializationObject = super.serialize();

            serializationObject.type = 2;
            serializationObject.position = this.position.asArray();
            serializationObject.direction = this.position.asArray();
            serializationObject.angle = this.angle;
            serializationObject.exponent = this.exponent;

            return serializationObject;
        }
    }
}