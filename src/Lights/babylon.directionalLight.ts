/// <reference path="babylon.light.ts" />

module BABYLON {
    export class DirectionalLight extends Light implements IShadowLight {
        @serializeAsVector3()
        public position: Vector3;

        @serializeAsVector3()
        public direction: Vector3

        private _transformedDirection: Vector3;
        public transformedPosition: Vector3;
        private _worldMatrix: Matrix;

        @serialize()
        public shadowOrthoScale = 0.5;

        @serialize()
        public autoUpdateExtends = true;

        // Cache
        private _orthoLeft = Number.MAX_VALUE;
        private _orthoRight = Number.MIN_VALUE;
        private _orthoTop = Number.MIN_VALUE;
        private _orthoBottom = Number.MAX_VALUE;

        /**
         * Creates a DirectionalLight object in the scene, oriented towards the passed direction (Vector3).  
         * The directional light is emitted from everywhere in the given direction.  
         * It can cast shawdows.  
         * Documentation : http://doc.babylonjs.com/tutorials/lights  
         */
        constructor(name: string, direction: Vector3, scene: Scene) {
            super(name, scene);
            this.position = direction.scale(-1.0);
            this.direction = direction;
        }
        /**
         * Returns the string "DirectionalLight".  
         */
        public getClassName(): string {
            return "DirectionalLight";
        }           
        /**
         * Returns the DirectionalLight absolute position in the World.  
         */
        public getAbsolutePosition(): Vector3 {
            return this.transformedPosition ? this.transformedPosition : this.position;
        }
        /**
         * Sets the DirectionalLight direction toward the passed target (Vector3).  
         * Returns the updated DirectionalLight direction (Vector3).  
         */
        public setDirectionToTarget(target: Vector3): Vector3 {
            this.direction = Vector3.Normalize(target.subtract(this.position));
            return this.direction;
        }
        /**
         * Sets the passed matrix "matrix" as projection matrix for the shadows cast by the light according to the passed view matrix.  
         * Returns the DirectionalLight.  
         */
        public setShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): DirectionalLight {
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

            return this;
        }

        /**
         * Boolean : true by default.  
         */
        public supportsVSM(): boolean {
            return true;
        }
        /**
         * Boolean : true by default.  
         */
        public needRefreshPerFrame(): boolean {
            return true;
        }
        /**
         * Boolean : false by default.  
         */
        public needCube(): boolean {
            return false;
        }
        /**
         * Returns the light direction (Vector3) for any passed face index.    
         */
        public getShadowDirection(faceIndex?: number): Vector3 {
            return this.direction;
        }
        /**
         * Computes the light transformed position in case the light is parented. Returns true if parented, else false.  
         */
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
        /**
         * Sets the passed Effect object with the DirectionalLight transformed position (or position if not parented) and the passed name.  
         * Returns the DirectionalLight.  
         */
        public transferToEffect(effect: Effect, directionUniformName: string): DirectionalLight {
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._transformedDirection) {
                    this._transformedDirection = Vector3.Zero();
                }
                Vector3.TransformNormalToRef(this.direction, this.parent.getWorldMatrix(), this._transformedDirection);
                effect.setFloat4(directionUniformName, this._transformedDirection.x, this._transformedDirection.y, this._transformedDirection.z, 1);
                return this;
            }
            effect.setFloat4(directionUniformName, this.direction.x, this.direction.y, this.direction.z, 1);
            return this;
        }

        public _getWorldMatrix(): Matrix {
            if (!this._worldMatrix) {
                this._worldMatrix = Matrix.Identity();
            }

            Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix);

            return this._worldMatrix;
        }
        /**
         * Returns the integer 1.  
         */
        public getTypeID(): number {
            return 1;
        }
    }
}  