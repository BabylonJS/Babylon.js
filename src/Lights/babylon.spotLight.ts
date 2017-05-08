﻿module BABYLON {
    export class SpotLight extends Light implements IShadowLight {
        @serializeAsVector3()
        public position: Vector3;

        @serializeAsVector3()
        public direction: Vector3;

        @serialize()
        public angle: number;

        @serialize()
        public exponent: number;
        
        @serialize()
        public shadowMinZ: number;
        @serialize()
        public shadowMaxZ: number;

        public transformedPosition: Vector3;

        public customProjectionMatrixBuilder: (viewMatrix: Matrix, renderList: Array<AbstractMesh>, result: Matrix) => void;

        private _transformedDirection: Vector3;
        private _worldMatrix: Matrix;

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

        protected _buildUniformLayout(): void {
            this._uniformBuffer.addUniform("vLightData", 4);
            this._uniformBuffer.addUniform("vLightDiffuse", 4);
            this._uniformBuffer.addUniform("vLightSpecular", 3);
            this._uniformBuffer.addUniform("vLightDirection", 3);
            this._uniformBuffer.addUniform("shadowsInfo", 3);
            this._uniformBuffer.create();
        }
        
        /**
         * Returns the string "SpotLight".  
         */
        public getClassName(): string {
            return "SpotLight";
        }         
        /**
         * Returns the SpotLight absolute position in the World (Vector3).  
         */
        public getAbsolutePosition(): Vector3 {
            return this.transformedPosition ? this.transformedPosition : this.position;
        }

        /**
         * Return the depth scale used for the shadow map.
         */
        public getDepthScale(): number {
            return 30.0;
        }
        
        /**
         * Sets the passed matrix "matrix" as perspective projection matrix for the shadows and the passed view matrix with the fov equal to the SpotLight angle and and aspect ratio of 1.0.  
         * Returns the SpotLight.  
         */
        public setShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): SpotLight {
            if (this.customProjectionMatrixBuilder) {
                this.customProjectionMatrixBuilder(viewMatrix, renderList, matrix);
            } else {
                var activeCamera = this.getScene().activeCamera;
                Matrix.PerspectiveFovLHToRef(this.angle, 1.0, 
                this.shadowMinZ !== undefined ? this.shadowMinZ : activeCamera.minZ, this.shadowMaxZ !== undefined ? this.shadowMaxZ : activeCamera.maxZ, matrix);
            }
            return this;
        }
        /**
         * Boolean : false by default.  
         */
        public needCube(): boolean {
            return false;
        }
        /**
         * Boolean : false by default.  
         */
        public needRefreshPerFrame(): boolean {
            return false;
        }
        /**
         * Returns the SpotLight direction (Vector3) for any passed face index.  
         */
        public getShadowDirection(faceIndex?: number): Vector3 {
            return this.direction;
        }
        /**
         * Updates the SpotLight direction towards the passed target (Vector3).  
         * Returns the updated direction.  
         */
        public setDirectionToTarget(target: Vector3): Vector3 {
            this.direction = Vector3.Normalize(target.subtract(this.position));
            return this.direction;
        }
        /**
         * Computes the SpotLight transformed position if parented.  Returns true if parented, else false. 
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
         * Sets the passed Effect object with the SpotLight transfomed position (or position if not parented) and normalized direction.  
         * Return the SpotLight.   
         */
        public transferToEffect(effect: Effect, lightIndex: string): SpotLight {
            var normalizeDirection;

            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._transformedDirection) {
                    this._transformedDirection = Vector3.Zero();
                }

                this.computeTransformedPosition();
                
                Vector3.TransformNormalToRef(this.direction, this.parent.getWorldMatrix(), this._transformedDirection);

                this._uniformBuffer.updateFloat4("vLightData",
                    this.transformedPosition.x,
                    this.transformedPosition.y,
                    this.transformedPosition.z,
                    this.exponent,
                    lightIndex);

                normalizeDirection = Vector3.Normalize(this._transformedDirection);
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

        public _getWorldMatrix(): Matrix {
            if (!this._worldMatrix) {
                this._worldMatrix = Matrix.Identity();
            }

            Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix);

            return this._worldMatrix;
        }
        /**
         * Returns the integer 2.  
         */
        public getTypeID(): number {
            return 2;
        }
        /**
         * Returns the SpotLight rotation (Vector3).  
         */
        public getRotation(): Vector3 {
            this.direction.normalize();
            var xaxis = BABYLON.Vector3.Cross(this.direction, BABYLON.Axis.Y);
            var yaxis = BABYLON.Vector3.Cross(xaxis, this.direction);
            return Vector3.RotationFromAxis(xaxis, yaxis, this.direction);
        }
    }
}