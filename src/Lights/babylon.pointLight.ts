module BABYLON {
    export class PointLight extends Light implements IShadowLight {
        private _worldMatrix: Matrix;
        public transformedPosition: Vector3;

        @serializeAsVector3()
        public position: Vector3;

        @serialize()
        public shadowMinZ: number;
        @serialize()
        public shadowMaxZ: number;
        
        public customProjectionMatrixBuilder: (viewMatrix: Matrix, renderList: Array<AbstractMesh>, result: Matrix) => void;

        /**
         * Creates a PointLight object from the passed name and position (Vector3) and adds it in the scene.  
         * A PointLight emits the light in every direction.  
         * It can cast shadows.  
         * If the scene camera is already defined and you want to set your PointLight at the camera position, just set it :
         * ```javascript
         * var pointLight = new BABYLON.PointLight("pl", camera.position, scene);
         * ```
         * Documentation : http://doc.babylonjs.com/tutorials/lights  
         */
        constructor(name: string, position: Vector3, scene: Scene) {
            super(name, scene);
            this.position = position;
        }

        protected _buildUniformLayout(): void {
            this._uniformBuffer.addUniform("vLightData", 4);
            this._uniformBuffer.addUniform("vLightDiffuse", 4);
            this._uniformBuffer.addUniform("vLightSpecular", 3);
            this._uniformBuffer.addUniform("shadowsInfo", 3);
            this._uniformBuffer.create();
        }

        /**
         * Returns the string "PointLight"
         */
        public getClassName(): string {
            return "PointLight";
        } 
        /**
         * Returns a Vector3, the PointLight absolute position in the World.  
         */
        public getAbsolutePosition(): Vector3 {
            return this.transformedPosition ? this.transformedPosition : this.position;
        }
        /**
         * Computes the PointLight transformed position if parented.  Returns true if ok, false if not parented.  
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
         * Sets the passed Effect "effect" with the PointLight transformed position (or position, if none) and passed name (string).  
         * Returns the PointLight.  
         */
        public transferToEffect(effect: Effect, lightIndex: string): PointLight {

            if (this.parent && this.parent.getWorldMatrix) {
                this.computeTransformedPosition();

                this._uniformBuffer.updateFloat4("vLightData",
                    this.transformedPosition.x,
                    this.transformedPosition.y,
                    this.transformedPosition.z,
                    0.0,
                    lightIndex); 
                return this;
            }

            this._uniformBuffer.updateFloat4("vLightData", this.position.x, this.position.y, this.position.z, 0, lightIndex);
            return this;
        }
        /**
         * Boolean : returns true by default. 
         */
        public needCube(): boolean {
            return true;
        }
        /**
         * Boolean : returns false by default.  
         */
        public needRefreshPerFrame(): boolean {
            return false;
        }

        /**
         * Returns a new Vector3 aligned with the PointLight cube system according to the passed cube face index (integer).  
         */
        public getShadowDirection(faceIndex?: number): Vector3 {
            switch (faceIndex) {
                case 0:
                    return new Vector3(1.0, 0.0, 0.0);
                case 1:
                    return new Vector3(-1.0, 0.0, 0.0);
                case 2:
                    return new Vector3(0.0, -1.0, 0.0);
                case 3:
                    return new Vector3(0.0, 1.0, 0.0);
                case 4:
                    return new Vector3(0.0, 0.0, 1.0);
                case 5:
                    return new Vector3(0.0, 0.0, -1.0);
            }

            return Vector3.Zero();
        }
        
        /**
         * Return the depth scale used for the shadow map.
         */
        public getDepthScale(): number {
            return 30.0;
        }

        /**
         * Sets the passed matrix "matrix" as a left-handed perspective projection matrix with the following settings : 
         * - fov = PI / 2
         * - aspect ratio : 1.0
         * - z-near and far equal to the active camera minZ and maxZ.  
         * Returns the PointLight.  
         */
        public setShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): PointLight {
            if (this.customProjectionMatrixBuilder) {
                this.customProjectionMatrixBuilder(viewMatrix, renderList, matrix);
            } else {
                var activeCamera = this.getScene().activeCamera;
                Matrix.PerspectiveFovLHToRef(Math.PI / 2, 1.0, 
                this.shadowMinZ !== undefined ? this.shadowMinZ : activeCamera.minZ, this.shadowMaxZ !== undefined ? this.shadowMaxZ : activeCamera.maxZ, matrix);
            }
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
         * Returns the integer 0.  
         */
        public getTypeID(): number {
            return 0;
        }
    }
} 