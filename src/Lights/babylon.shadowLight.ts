module BABYLON {
    export interface IShadowLight extends Light {
        id: string;
        position: Vector3;
        direction: Vector3;
        transformedPosition: Vector3;
        transformedDirection: Vector3;
        name: string;
        shadowMinZ: number;
        shadowMaxZ: number;

        computeTransformedInformation(): boolean;
        getScene(): Scene;

        customProjectionMatrixBuilder: (viewMatrix: Matrix, renderList: Array<AbstractMesh>, result: Matrix) => void;
        setShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): IShadowLight;
        getDepthScale(): number;

        needCube(): boolean;
        needProjectionMatrixCompute(): boolean;
        forceProjectionMatrixCompute(): void;

        getShadowDirection(faceIndex?: number): Vector3;

        /**
         * Gets the minZ used for shadow according to both the scene and the light.
         * @param activeCamera 
         */
         getDepthMinZ(activeCamera: Camera): number;

        /**
         * Gets the minZ used for shadow according to both the scene and the light.
         * @param activeCamera 
         */
        getDepthMaxZ(activeCamera: Camera): number;
    }

    export abstract class ShadowLight extends Light implements IShadowLight {

        protected abstract _setDefaultShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void;

        @serializeAsVector3()
        public position: Vector3;

        protected _direction: Vector3;
        @serializeAsVector3()
        public get direction(): Vector3 {
            return this._direction;
        }
        public set direction(value: Vector3) {
            this._direction = value;
        }

        private _shadowMinZ: number;
        @serialize()
        public get shadowMinZ(): number {
            return this._shadowMinZ
        }
        public set shadowMinZ(value: number) {
            this._shadowMinZ = value;
            this.forceProjectionMatrixCompute();
        }

        private _shadowMaxZ: number;
        @serialize()
        public get shadowMaxZ(): number {
            return this._shadowMaxZ
        }
        public set shadowMaxZ(value: number) {
            this._shadowMaxZ = value;
            this.forceProjectionMatrixCompute();
        }

        public customProjectionMatrixBuilder: (viewMatrix: Matrix, renderList: Array<AbstractMesh>, result: Matrix) => void;

        public transformedPosition: Vector3;

        public transformedDirection: Vector3;

        private _worldMatrix: Matrix;
        private _needProjectionMatrixCompute: boolean = true;

        /**
         * Computes the light transformed position/direction in case the light is parented. Returns true if parented, else false.
         */
        public computeTransformedInformation(): boolean {
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this.transformedPosition) {
                    this.transformedPosition = Vector3.Zero();
                }
                Vector3.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), this.transformedPosition);

                // In case the direction is present.
                if (this.direction) {
                    if (!this.transformedDirection) {
                        this.transformedDirection = Vector3.Zero();
                    }
                    Vector3.TransformNormalToRef(this.direction, this.parent.getWorldMatrix(), this.transformedDirection);
                }
                return true;
            }
            return false;
        }

        /**
         * Return the depth scale used for the shadow map.
         */
        public getDepthScale(): number {
            return 50.0;
        }

        /**
         * Returns the light direction (Vector3) for any passed face index.
         */
        public getShadowDirection(faceIndex?: number): Vector3 {
            return this.transformedDirection ? this.transformedDirection : this.direction;
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
         * Returns the light rotation (Vector3).
         */
        public getRotation(): Vector3 {
            this.direction.normalize();
            var xaxis = BABYLON.Vector3.Cross(this.direction, BABYLON.Axis.Y);
            var yaxis = BABYLON.Vector3.Cross(xaxis, this.direction);
            return Vector3.RotationFromAxis(xaxis, yaxis, this.direction);
        }

        /**
         * Boolean : false by default.
         */
        public needCube(): boolean {
            return false;
        }

        /**
         * Specifies wether or not the projection matrix should be recomputed this frame.
         */
        public needProjectionMatrixCompute(): boolean {
            return this._needProjectionMatrixCompute;
        }

        /**
         * Forces the shadow generator to recompute the projection matrix even if position and direction did not changed.
         */
        public forceProjectionMatrixCompute(): void {
            this._needProjectionMatrixCompute = true;
        }

        /**
         * Get the world matrix of the sahdow lights.
         */
        public _getWorldMatrix(): Matrix {
            if (!this._worldMatrix) {
                this._worldMatrix = Matrix.Identity();
            }

            Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._worldMatrix);

            return this._worldMatrix;
        }

        /**
         * Gets the minZ used for shadow according to both the scene and the light.
         * @param activeCamera 
         */
        public getDepthMinZ(activeCamera: Camera): number {
            return this.shadowMinZ !== undefined ? this.shadowMinZ : activeCamera.minZ;
        }

        /**
         * Gets the maxZ used for shadow according to both the scene and the light.
         * @param activeCamera 
         */
        public getDepthMaxZ(activeCamera: Camera): number {
             return this.shadowMaxZ !== undefined ? this.shadowMaxZ : activeCamera.maxZ;
        }

        /**
         * Sets the projection matrix according to the type of light and custom projection matrix definition.
         * Returns the light.
         */
        public setShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): IShadowLight {
            if (this.customProjectionMatrixBuilder) {
                this.customProjectionMatrixBuilder(viewMatrix, renderList, matrix);
            }
            else {
                this._setDefaultShadowProjectionMatrix(matrix, viewMatrix, renderList);
            }
            return this;
        }
    }
}
