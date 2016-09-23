module BABYLON {
    export class PointLight extends Light implements IShadowLight {
        private _worldMatrix: Matrix;
        public transformedPosition: Vector3;

        @serializeAsVector3()
        public position: Vector3;

        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, scene);

            this.position = position;
        }

        public getAbsolutePosition(): Vector3 {
            return this.transformedPosition ? this.transformedPosition : this.position;
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

        public transferToEffect(effect: Effect, positionUniformName: string): void {
            if (this.parent && this.parent.getWorldMatrix) {
                this.computeTransformedPosition();

                if (this.getScene().useRightHandedSystem) {
                    effect.setFloat4(positionUniformName,
                        -this.transformedPosition.x,
                        -this.transformedPosition.y,
                        -this.transformedPosition.z,
                        0);
                } else {
                    effect.setFloat4(positionUniformName,
                        this.transformedPosition.x,
                        this.transformedPosition.y,
                        this.transformedPosition.z,
                        0); 
                }

                return;
            }

            if (this.getScene().useRightHandedSystem) {
                effect.setFloat4(positionUniformName, -this.position.x, -this.position.y, -this.position.z, 0);
            } else {
                effect.setFloat4(positionUniformName, this.position.x, this.position.y, this.position.z, 0);
            }
        }

        public needCube(): boolean {
            return true;
        }

        public supportsVSM(): boolean {
            return false;
        }

        public needRefreshPerFrame(): boolean {
            return false;
        }

        public getShadowDirection(faceIndex?: number): Vector3 {
            switch (faceIndex) {
                case 0:
                    return new Vector3(1, 0, 0);
                case 1:
                    return new Vector3(-1, 0, 0);
                case 2:
                    return new Vector3(0, -1, 0);
                case 3:
                    return new Vector3(0, 1, 0);
                case 4:
                    return new Vector3(0, 0, 1);
                case 5:
                    return new Vector3(0, 0, -1);
            }

            return Vector3.Zero();
        }

        public setShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void {
            var activeCamera = this.getScene().activeCamera;
            Matrix.PerspectiveFovLHToRef(Math.PI / 2, 1.0, activeCamera.minZ, activeCamera.maxZ, matrix);
        }

        public _getWorldMatrix(): Matrix {
            if (!this._worldMatrix) {
                this._worldMatrix = Matrix.Identity();
            }

            Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix);

            return this._worldMatrix;
        }

        public getTypeID(): number {
            return 0;
        }
    }
} 