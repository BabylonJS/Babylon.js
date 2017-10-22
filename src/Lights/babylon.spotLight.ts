module BABYLON {
    export class SpotLight extends ShadowLight {
        private _angle: number;
        @serialize()
        public get angle(): number {
            return this._angle
        }
        public set angle(value: number) {
            this._angle = value;
            this.forceProjectionMatrixCompute();
        }

        private _shadowAngleScale: number;
        @serialize()
        /**
         * Allows scaling the angle of the light for shadow generation only.
         */
        public get shadowAngleScale(): number {
            return this._shadowAngleScale
        }
        /**
         * Allows scaling the angle of the light for shadow generation only.
         */
        public set shadowAngleScale(value: number) {
            this._shadowAngleScale = value;
            this.forceProjectionMatrixCompute();
        }

        @serialize()
        public exponent: number;
        
        /**
         * Creates a SpotLight object in the scene with the passed parameters :   
         * - `position` (Vector3) is the initial SpotLight position,  
         * - `direction` (Vector3) is the initial SpotLight direction,  
         * - `angle` (float, in radians) is the spot light cone angle,
         * - `exponent` (float) is the light decay speed with the distance from the emission spot.  
         * A spot light is a simply light oriented cone.   
         * It can cast shadows.  
         * Documentation : http://doc.babylonjs.com/tutorials/lights  
         */
        constructor(name: string, position: Vector3, direction: Vector3, angle: number, exponent: number, scene: Scene) {
            super(name, scene);

            this.position = position;
            this.direction = direction;
            this.angle = angle;
            this.exponent = exponent;
        }

        /**
         * Returns the string "SpotLight".
         */
        public getClassName(): string {
            return "SpotLight";
        }

        /**
         * Returns the integer 2.
         */
        public getTypeID(): number {
            return Light.LIGHTTYPEID_SPOTLIGHT;
        }

        /**
         * Sets the passed matrix "matrix" as perspective projection matrix for the shadows and the passed view matrix with the fov equal to the SpotLight angle and and aspect ratio of 1.0.  
         * Returns the SpotLight.  
         */
        protected _setDefaultShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void {
            var activeCamera = this.getScene().activeCamera;

            if (!activeCamera) {
                return;
            }

            this._shadowAngleScale = this._shadowAngleScale || 1;
            var angle = this._shadowAngleScale * this._angle;
            
            Matrix.PerspectiveFovLHToRef(angle, 1.0, 
            this.getDepthMinZ(activeCamera), this.getDepthMaxZ(activeCamera), matrix);
        }

        protected _buildUniformLayout(): void {
            this._uniformBuffer.addUniform("vLightData", 4);
            this._uniformBuffer.addUniform("vLightDiffuse", 4);
            this._uniformBuffer.addUniform("vLightSpecular", 3);
            this._uniformBuffer.addUniform("vLightDirection", 3);
            this._uniformBuffer.addUniform("shadowsInfo", 3);
            this._uniformBuffer.addUniform("depthValues", 2);
            this._uniformBuffer.create();
        }

        /**
         * Sets the passed Effect object with the SpotLight transfomed position (or position if not parented) and normalized direction.  
         * Return the SpotLight.   
         */
        public transferToEffect(effect: Effect, lightIndex: string): SpotLight {
            var normalizeDirection;

            if (this.computeTransformedInformation()) {
                this._uniformBuffer.updateFloat4("vLightData",
                    this.transformedPosition.x,
                    this.transformedPosition.y,
                    this.transformedPosition.z,
                    this.exponent,
                    lightIndex);

                normalizeDirection = Vector3.Normalize(this.transformedDirection);
            } else {
                this._uniformBuffer.updateFloat4("vLightData",
                    this.position.x,
                    this.position.y,
                    this.position.z,
                    this.exponent,
                    lightIndex);

                normalizeDirection = Vector3.Normalize(this.direction);
            }

            this._uniformBuffer.updateFloat4("vLightDirection",
                normalizeDirection.x,
                normalizeDirection.y,
                normalizeDirection.z,
                Math.cos(this.angle * 0.5),
                lightIndex);
            return this;
        }
    }
}