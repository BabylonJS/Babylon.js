module BABYLON {
    /**
     * A spot light is defined by a position, a direction, an angle, and an exponent. 
     * These values define a cone of light starting from the position, emitting toward the direction.
     * The angle, in radians, defines the size (field of illumination) of the spotlight's conical beam, 
     * and the exponent defines the speed of the decay of the light with distance (reach).
     * Documentation: https://doc.babylonjs.com/babylon101/lights
     */
    export class SpotLight extends ShadowLight {
        /*
            upVector , rightVector and direction will form the coordinate system for this spot light. 
            These three vectors will be used as projection matrix when doing texture projection.
            
            Also we have the following rules always holds:
            direction cross up   = right
            right cross dirction = up
            up cross right       = forward

            light_near and light_far will control the range of the texture projection. If a plane is 
            out of the range in spot light space, there is no texture projection.

            Warning:
            Change the angle of the Spotlight, direction of the SpotLight will not re-compute the 
            projection matrix. Need to call computeTextureMatrix() to recompute manually. Add inheritance
            to the setting function of the 2 attributes will solve the problem.
        */

        private _angle: number;
        @serialize()
        /**
         * Gets the cone angle of the spot light in Radians.
         */
        public get angle(): number {
            return this._angle
        }
        /**
         * Sets the cone angle of the spot light in Radians.
         */
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

        /**
         * The light decay speed with the distance from the emission spot.
         */
        @serialize()
        public exponent: number;

        private _textureProjectionMatrix = Matrix.Zero();
        @serialize()
        /**
        * Allows reading the projecton texture
        */
        public get textureMatrix(): Matrix{
            return this._textureProjectionMatrix;
        }
        /**
        * Allows setting the value of projection texture
        */
        public set textureMatrix(value: Matrix) {
            this._textureProjectionMatrix = value;
        }

        protected _light_near :number;
        @serialize()
        /**
         * Gets the near clip of the Spotlight for texture projection.
         */
        public get light_near(): number {
            return this._light_near;
        }
        /**
         * Sets the near clip of the Spotlight for texture projection.
         */
        public set light_near(value: number) {
            this._light_near = value;
            this._computeTextureMatrix();
        }

        protected _light_far  :number;
        /**
         * Gets the far clip of the Spotlight for texture projection.
         */
        @serialize()
        public get light_far(): number {
            return this._light_far;
        }
        /**
         * Sets the far clip of the Spotlight for texture projection.
         */
        public set light_far(value: number) {
            this._light_far = value;
        }

        @serializeAsTexture("projectedLightTexture")
        private _projectedLightTexture: Nullable<BaseTexture>;;
        /** 
         * Gets the projection texture of the light.
        */
        public get projectedLightTexture(): Nullable<BaseTexture> {
            return this._projectedLightTexture;
        }
        /**
        * Sets the projection texture of the light.
        */
        public set projectedLightTexture(value: Nullable<BaseTexture>) {
            this._projectedLightTexture = value;
            this._light_far = 1000.0;
            this._light_near = 1e-6;
            this._computeTextureMatrix();
        }

        /**
         * Creates a SpotLight object in the scene. A spot light is a simply light oriented cone.
         * It can cast shadows.
         * Documentation : http://doc.babylonjs.com/tutorials/lights
         * @param name The light friendly name
         * @param position The position of the spot light in the scene
         * @param direction The direction of the light in the scene
         * @param angle The cone angle of the light in Radians
         * @param exponent The light decay speed with the distance from the emission spot
         * @param scene The scene the lights belongs to
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
         * @returns the class name
         */
        public getClassName(): string {
            return "SpotLight";
        }

        /**
         * Returns the integer 2.
         * @returns The light Type id as a constant defines in Light.LIGHTTYPEID_x
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

        /**
         * Main function for light texture projection matrix computing.
         */
        protected _computeTextureMatrix(): void {

            var viewLightMatrix = Matrix.Zero();
            Matrix.LookAtLHToRef(this.position, this.position.add(this.direction), Vector3.Up(), viewLightMatrix);

            var light_far = this.light_far;
            var light_near = this.light_near;

            var P = light_far / (light_far - light_near);
            var Q = - P * light_near;
            var S = 1.0 / Math.tan(this._angle / 2.0);
            var A = 1.0;
            
            var projectionLightMatrix = Matrix.Zero();
            Matrix.FromValuesToRef(S/A, 0.0, 0.0, 0.0,
                0.0, S, 0.0, 0.0,
                0.0, 0.0, P, 1.0,
                0.0, 0.0, Q, 0.0, projectionLightMatrix);

            var scaleMatrix = Matrix.Zero();
            Matrix.FromValuesToRef(0.5, 0.0, 0.0, 0.0,
                0.0, 0.5, 0.0, 0.0,
                0.0, 0.0, 0.5, 0.0,
                0.5, 0.5, 0.5, 1.0, scaleMatrix);
                
            this._textureProjectionMatrix.copyFrom(viewLightMatrix);
            this._textureProjectionMatrix.multiplyToRef(projectionLightMatrix, this._textureProjectionMatrix);
            this._textureProjectionMatrix.multiplyToRef(scaleMatrix, this._textureProjectionMatrix);
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
         * @param effect The effect to update
         * @param lightIndex The index of the light in the effect to update
         * @returns The spot light
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

            effect.setMatrix("textureProjectionMatrix" + lightIndex, this._textureProjectionMatrix);
            if (this.projectedLightTexture){
                effect.setTexture("projectionLightSampler" + lightIndex, this.projectedLightTexture);
            }
            return this;
        }

        /**
         * Disposes the light and the associated resources.
         */
        public dispose() : void {
            super.dispose();
            if (this._projectedLightTexture){
                this._projectedLightTexture.dispose();
            }
        }
    }
}