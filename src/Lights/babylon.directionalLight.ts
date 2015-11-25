module BABYLON {
    export class DirectionalLight extends Light implements IShadowLight {
        public position: Vector3;

        private _transformedDirection: Vector3;
        public transformedPosition: Vector3;
        private _worldMatrix: Matrix;

        public shadowOrthoScale = 0.5;

        public autoUpdateExtends = true;

        // Cache
        private _orthoLeft = Number.MAX_VALUE;
        private _orthoRight = Number.MIN_VALUE;
        private _orthoTop = Number.MIN_VALUE;
        private _orthoBottom = Number.MAX_VALUE;

        constructor(name: string, public direction: Vector3, scene: Scene) {
            super(name, scene);

            this.position = direction.scale(-1);
        }

        public getAbsolutePosition(): Vector3 {
            return this.transformedPosition ? this.transformedPosition : this.position;
        }

        public setDirectionToTarget(target: Vector3): Vector3 {
            this.direction = Vector3.Normalize(target.subtract(this.position));
            return this.direction;
        }

        public setShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void {
            var activeCamera = this.getScene().activeCamera;

            // Check extends
            if (this.autoUpdateExtends || this._orthoLeft === Number.MAX_VALUE) {
                var tempVector3 = Vector3.Zero();

                this._orthoLeft = Number.MAX_VALUE;
                this._orthoRight = Number.MIN_VALUE;
                this._orthoTop = Number.MIN_VALUE;
                this._orthoBottom = Number.MAX_VALUE;

                for (var meshIndex = 0; meshIndex < renderList.length; meshIndex++) {
                    var mesh = renderList[meshIndex];

                    if (!mesh) {
                        continue;
                    }

                    var boundingInfo = mesh.getBoundingInfo();

                    if (!boundingInfo) {
                        continue;
                    }

                    var boundingBox = boundingInfo.boundingBox;

                    for (var index = 0; index < boundingBox.vectorsWorld.length; index++) {
                        Vector3.TransformCoordinatesToRef(boundingBox.vectorsWorld[index], viewMatrix, tempVector3);

                        if (tempVector3.x < this._orthoLeft)
                            this._orthoLeft = tempVector3.x;
                        if (tempVector3.y < this._orthoBottom)
                            this._orthoBottom = tempVector3.y;

                        if (tempVector3.x > this._orthoRight)
                            this._orthoRight = tempVector3.x;
                        if (tempVector3.y > this._orthoTop)
                            this._orthoTop = tempVector3.y;
                    }
                }
            }

            var xOffset = this._orthoRight - this._orthoLeft;
            var yOffset = this._orthoTop - this._orthoBottom;

            Matrix.OrthoOffCenterLHToRef(this._orthoLeft - xOffset * this.shadowOrthoScale, this._orthoRight + xOffset * this.shadowOrthoScale,
                this._orthoBottom - yOffset * this.shadowOrthoScale, this._orthoTop + yOffset * this.shadowOrthoScale,
                -activeCamera.maxZ, activeCamera.maxZ, matrix);
        }

        public supportsVSM(): boolean {
            return true;
        }

        public needRefreshPerFrame(): boolean {
            return true;
        }

        public needCube(): boolean {
            return false;
        }

        public getShadowDirection(faceIndex?: number): Vector3 {
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

        public transferToEffect(effect: Effect, directionUniformName: string): void {
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._transformedDirection) {
                    this._transformedDirection = Vector3.Zero();
                }

                Vector3.TransformNormalToRef(this.direction, this.parent.getWorldMatrix(), this._transformedDirection);
                effect.setFloat4(directionUniformName, this._transformedDirection.x, this._transformedDirection.y, this._transformedDirection.z, 1);

                return;
            }

            effect.setFloat4(directionUniformName, this.direction.x, this.direction.y, this.direction.z, 1);
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
            serializationObject.type = 1;
            serializationObject.position = this.position.asArray();
            serializationObject.direction = this.direction.asArray();

            return serializationObject;
        }
    }
}  