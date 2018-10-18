module BABYLON {
    /**
     * A TransformNode is an object that is not rendered but can be used as a center of transformation. This can decrease memory usage and increase rendering speed compared to using an empty mesh as a parent and is less complicated than using a pivot matrix.
     * @see https://doc.babylonjs.com/how_to/transformnode
     */
    export class TransformNode extends Node {
        // Statics
        /**
         * Object will not rotate to face the camera
         */
        public static BILLBOARDMODE_NONE = 0;
        /**
         * Object will rotate to face the camera but only on the x axis
         */
        public static BILLBOARDMODE_X = 1;
        /**
         * Object will rotate to face the camera but only on the y axis
         */
        public static BILLBOARDMODE_Y = 2;
        /**
         * Object will rotate to face the camera but only on the z axis
         */
        public static BILLBOARDMODE_Z = 4;
        /**
         * Object will rotate to face the camera
         */
        public static BILLBOARDMODE_ALL = 7;

        private _forward = new Vector3(0, 0, 1);
        private _forwardInverted = new Vector3(0, 0, -1);
        private _up = new Vector3(0, 1, 0);
        private _right = new Vector3(1, 0, 0);
        private _rightInverted = new Vector3(-1, 0, 0);

        // Properties
        @serializeAsVector3("position")
        private _position = Vector3.Zero();

        @serializeAsVector3("rotation")
        private _rotation = Vector3.Zero();

        @serializeAsQuaternion("rotationQuaternion")
        private _rotationQuaternion: Nullable<Quaternion>;

        @serializeAsVector3("scaling")
        protected _scaling = Vector3.One();
        protected _isDirty = false;
        private _transformToBoneReferal: Nullable<TransformNode>;

        /**
        * Set the billboard mode. Default is 0.
        *
        * | Value | Type | Description |
        * | --- | --- | --- |
        * | 0 | BILLBOARDMODE_NONE |  |
        * | 1 | BILLBOARDMODE_X |  |
        * | 2 | BILLBOARDMODE_Y |  |
        * | 4 | BILLBOARDMODE_Z |  |
        * | 7 | BILLBOARDMODE_ALL |  |
        *
        */
        @serialize()
        public billboardMode = TransformNode.BILLBOARDMODE_NONE;

        /**
         * Multiplication factor on scale x/y/z when computing the world matrix. Eg. for a 1x1x1 cube setting this to 2 will make it a 2x2x2 cube
         */
        @serialize()
        public scalingDeterminant = 1;

        /**
         * Sets the distance of the object to max, often used by skybox
         */
        @serialize()
        public infiniteDistance = false;

        /**
         * Gets or sets a boolean indicating that non uniform scaling (when at least one component is different from others) should be ignored.
         * By default the system will update normals to compensate
         */
        @serialize()
        public ignoreNonUniformScaling = false;

        // Cache
        /** @hidden */
        public _poseMatrix: Matrix;
        private _localWorld = Matrix.Zero();

        private _absolutePosition = Vector3.Zero();
        private _pivotMatrix = Matrix.Identity();
        private _pivotMatrixInverse: Matrix;
        private _postMultiplyPivotMatrix = false;

        protected _isWorldMatrixFrozen = false;

        /** @hidden */
        public _indexInSceneTransformNodesArray = -1;

        /**
        * An event triggered after the world matrix is updated
        */
        public onAfterWorldMatrixUpdateObservable = new Observable<TransformNode>();

        constructor(name: string, scene: Nullable<Scene> = null, isPure = true) {
            super(name, scene);

            if (isPure) {
                this.getScene().addTransformNode(this);
            }
        }

        /**
         * Gets a string identifying the name of the class
         * @returns "TransformNode" string
         */
        public getClassName(): string {
            return "TransformNode";
        }

        /**
          * Gets or set the node position (default is (0.0, 0.0, 0.0))
          */
         public get position(): Vector3 {
            return this._position;
        }

        public set position(newPosition: Vector3) {
            this._position = newPosition;
            this._isDirty = true;
        }

        /**
          * Gets or sets the rotation property : a Vector3 defining the rotation value in radians around each local axis X, Y, Z  (default is (0.0, 0.0, 0.0)).
          * If rotation quaternion is set, this Vector3 will be ignored and copy from the quaternion
          */
        public get rotation(): Vector3 {
            return this._rotation;
        }

        public set rotation(newRotation: Vector3) {
            this._rotation = newRotation;
            this._isDirty = true;
        }

        /**
         * Gets or sets the scaling property : a Vector3 defining the node scaling along each local axis X, Y, Z (default is (0.0, 0.0, 0.0)).
         */
        public get scaling(): Vector3 {
            return this._scaling;
        }

        public set scaling(newScaling: Vector3) {
            this._scaling = newScaling;
            this._isDirty = true;
        }

        /**
         * Gets or sets the rotation Quaternion property : this a Quaternion object defining the node rotation by using a unit quaternion (null by default).
         * If set, only the rotationQuaternion is then used to compute the node rotation (ie. node.rotation will be ignored)
         */
        public get rotationQuaternion(): Nullable<Quaternion> {
            return this._rotationQuaternion;
        }

        public set rotationQuaternion(quaternion: Nullable<Quaternion>) {
            this._rotationQuaternion = quaternion;
            //reset the rotation vector.
            if (quaternion) {
                this.rotation.setAll(0.0);
            }
        }

        /**
         * The forward direction of that transform in world space.
         */
        public get forward(): Vector3 {
            return Vector3.Normalize(Vector3.TransformNormal(
                this.getScene().useRightHandedSystem ? this._forwardInverted : this._forward,
                this.getWorldMatrix()
            ));
        }

        /**
         * The up direction of that transform in world space.
         */
        public get up(): Vector3 {
            return Vector3.Normalize(Vector3.TransformNormal(
                this._up,
                this.getWorldMatrix()
            ));
        }

        /**
         * The right direction of that transform in world space.
         */
        public get right(): Vector3 {
            return Vector3.Normalize(Vector3.TransformNormal(
                this.getScene().useRightHandedSystem ? this._rightInverted : this._right,
                this.getWorldMatrix()
            ));
        }

        /**
         * Copies the parameter passed Matrix into the mesh Pose matrix.
         * @param matrix the matrix to copy the pose from
         * @returns this TransformNode.
         */
        public updatePoseMatrix(matrix: Matrix): TransformNode {
            this._poseMatrix.copyFrom(matrix);
            return this;
        }

        /**
         * Returns the mesh Pose matrix.
         * @returns the pose matrix
         */
        public getPoseMatrix(): Matrix {
            return this._poseMatrix;
        }

        /** @hidden */
        public _isSynchronized(): boolean {
            if (this._isDirty) {
                return false;
            }

            if (this.billboardMode !== this._cache.billboardMode || this.billboardMode !== TransformNode.BILLBOARDMODE_NONE) {
                return false;
            }

            if (this._cache.pivotMatrixUpdated) {
                return false;
            }

            if (this.infiniteDistance) {
                return false;
            }

            if (!this._cache.position.equals(this._position)) {
                return false;
            }

            if (this._rotationQuaternion) {
                if (!this._cache.rotationQuaternion.equals(this._rotationQuaternion)) {
                    return false;
                }
            }

            if (!this._cache.rotation.equals(this._rotation)) {
                return false;
            }

            if (!this._cache.scaling.equals(this._scaling)) {
                return false;
            }

            return true;
        }

        /** @hidden */
        public _initCache() {
            super._initCache();

            this._cache.localMatrixUpdated = false;
            this._cache.position = Vector3.Zero();
            this._cache.scaling = Vector3.Zero();
            this._cache.rotation = Vector3.Zero();
            this._cache.rotationQuaternion = new Quaternion(0, 0, 0, 0);
            this._cache.billboardMode = -1;
        }

         /**
         * Flag the transform node as dirty (Forcing it to update everything)
         * @param property if set to "rotation" the objects rotationQuaternion will be set to null
         * @returns this transform node
         */
        public markAsDirty(property: string): TransformNode {
            if (property === "rotation") {
                this.rotationQuaternion = null;
            }
            this._currentRenderId = Number.MAX_VALUE;
            this._isDirty = true;
            return this;
        }

        /**
         * Returns the current mesh absolute position.
         * Returns a Vector3.
         */
        public get absolutePosition(): Vector3 {
            return this._absolutePosition;
        }

        /**
         * Sets a new matrix to apply before all other transformation
         * @param matrix defines the transform matrix
         * @returns the current TransformNode
         */
        public setPreTransformMatrix(matrix: Matrix): TransformNode {
            return this.setPivotMatrix(matrix, false);
        }

        /**
         * Sets a new pivot matrix to the current node
         * @param matrix defines the new pivot matrix to use
         * @param postMultiplyPivotMatrix defines if the pivot matrix must be cancelled in the world matrix. When this parameter is set to true (default), the inverse of the pivot matrix is also applied at the end to cancel the transformation effect
         * @returns the current TransformNode
        */
        public setPivotMatrix(matrix: Readonly<Matrix>, postMultiplyPivotMatrix = true): TransformNode {
            this._pivotMatrix.copyFrom(matrix);
            this._cache.pivotMatrixUpdated = true;
            this._postMultiplyPivotMatrix = postMultiplyPivotMatrix;

            if (this._postMultiplyPivotMatrix) {
                if (!this._pivotMatrixInverse) {
                    this._pivotMatrixInverse = Matrix.Invert(this._pivotMatrix);
                } else {
                    this._pivotMatrix.invertToRef(this._pivotMatrixInverse);
                }
            }

            return this;
        }

        /**
         * Returns the mesh pivot matrix.
         * Default : Identity.
         * @returns the matrix
         */
        public getPivotMatrix(): Matrix {
            return this._pivotMatrix;
        }

        /**
         * Prevents the World matrix to be computed any longer.
         * @returns the TransformNode.
         */
        public freezeWorldMatrix(): TransformNode {
            this._isWorldMatrixFrozen = false;  // no guarantee world is not already frozen, switch off temporarily
            this.computeWorldMatrix(true);
            this._isWorldMatrixFrozen = true;
            return this;
        }

        /**
         * Allows back the World matrix computation.
         * @returns the TransformNode.
         */
        public unfreezeWorldMatrix() {
            this._isWorldMatrixFrozen = false;
            this.computeWorldMatrix(true);
            return this;
        }

        /**
         * True if the World matrix has been frozen.
         */
        public get isWorldMatrixFrozen(): boolean {
            return this._isWorldMatrixFrozen;
        }

        /**
        * Retuns the mesh absolute position in the World.
        * @returns a Vector3.
        */
        public getAbsolutePosition(): Vector3 {
            this.computeWorldMatrix();
            return this._absolutePosition;
        }

        /**
         * Sets the mesh absolute position in the World from a Vector3 or an Array(3).
         * @param absolutePosition the absolute position to set
         * @returns the TransformNode.
         */
        public setAbsolutePosition(absolutePosition: Vector3): TransformNode {
            if (!absolutePosition) {
                return this;
            }
            var absolutePositionX;
            var absolutePositionY;
            var absolutePositionZ;
            if (absolutePosition.x === undefined) {
                if (arguments.length < 3) {
                    return this;
                }
                absolutePositionX = arguments[0];
                absolutePositionY = arguments[1];
                absolutePositionZ = arguments[2];
            }
            else {
                absolutePositionX = absolutePosition.x;
                absolutePositionY = absolutePosition.y;
                absolutePositionZ = absolutePosition.z;
            }
            if (this.parent) {
                const invertParentWorldMatrix = Tmp.Matrix[0];
                this.parent.getWorldMatrix().invertToRef(invertParentWorldMatrix);
                Vector3.TransformCoordinatesFromFloatsToRef(absolutePositionX, absolutePositionY, absolutePositionZ, invertParentWorldMatrix, this.position);
            } else {
                this.position.x = absolutePositionX;
                this.position.y = absolutePositionY;
                this.position.z = absolutePositionZ;
            }
            return this;
        }

        /**
         * Sets the mesh position in its local space.
         * @param vector3 the position to set in localspace
         * @returns the TransformNode.
         */
        public setPositionWithLocalVector(vector3: Vector3): TransformNode {
            this.computeWorldMatrix();
            this.position = Vector3.TransformNormal(vector3, this._localWorld);
            return this;
        }

        /**
         * Returns the mesh position in the local space from the current World matrix values.
         * @returns a new Vector3.
         */
        public getPositionExpressedInLocalSpace(): Vector3 {
            this.computeWorldMatrix();
            const invLocalWorldMatrix = Tmp.Matrix[0];
            this._localWorld.invertToRef(invLocalWorldMatrix);
            return Vector3.TransformNormal(this.position, invLocalWorldMatrix);
        }

        /**
         * Translates the mesh along the passed Vector3 in its local space.
         * @param vector3 the distance to translate in localspace
         * @returns the TransformNode.
         */
        public locallyTranslate(vector3: Vector3): TransformNode {
            this.computeWorldMatrix(true);
            this.position = Vector3.TransformCoordinates(vector3, this._localWorld);
            return this;
        }

        private static _lookAtVectorCache = new Vector3(0, 0, 0);

        /**
         * Orients a mesh towards a target point. Mesh must be drawn facing user.
         * @param targetPoint the position (must be in same space as current mesh) to look at
         * @param yawCor optional yaw (y-axis) correction in radians
         * @param pitchCor optional pitch (x-axis) correction in radians
         * @param rollCor optional roll (z-axis) correction in radians
         * @param space the choosen space of the target
         * @returns the TransformNode.
         */
        public lookAt(targetPoint: Vector3, yawCor: number = 0, pitchCor: number = 0, rollCor: number = 0, space: Space = Space.LOCAL): TransformNode {
            var dv = TransformNode._lookAtVectorCache;
            var pos = space === Space.LOCAL ? this.position : this.getAbsolutePosition();
            targetPoint.subtractToRef(pos, dv);
            var yaw = -Math.atan2(dv.z, dv.x) - Math.PI / 2;
            var len = Math.sqrt(dv.x * dv.x + dv.z * dv.z);
            var pitch = Math.atan2(dv.y, len);
            if (this.rotationQuaternion) {
                Quaternion.RotationYawPitchRollToRef(yaw + yawCor, pitch + pitchCor, rollCor, this.rotationQuaternion);
            }
            else {
                this.rotation.x = pitch + pitchCor;
                this.rotation.y = yaw + yawCor;
                this.rotation.z = rollCor;
            }
            return this;
        }

        /**
          * Returns a new Vector3 that is the localAxis, expressed in the mesh local space, rotated like the mesh.
          * This Vector3 is expressed in the World space.
          * @param localAxis axis to rotate
          * @returns a new Vector3 that is the localAxis, expressed in the mesh local space, rotated like the mesh.
          */
        public getDirection(localAxis: Vector3): Vector3 {
            var result = Vector3.Zero();

            this.getDirectionToRef(localAxis, result);

            return result;
        }

        /**
         * Sets the Vector3 "result" as the rotated Vector3 "localAxis" in the same rotation than the mesh.
         * localAxis is expressed in the mesh local space.
         * result is computed in the Wordl space from the mesh World matrix.
         * @param localAxis axis to rotate
         * @param result the resulting transformnode
         * @returns this TransformNode.
         */
        public getDirectionToRef(localAxis: Vector3, result: Vector3): TransformNode {
            Vector3.TransformNormalToRef(localAxis, this.getWorldMatrix(), result);
            return this;
        }

        /**
         * Sets a new pivot point to the current node
         * @param point defines the new pivot point to use
         * @param space defines if the point is in world or local space (local by default)
         * @returns the current TransformNode
        */
        public setPivotPoint(point: Vector3, space: Space = Space.LOCAL): TransformNode {
            if (this.getScene().getRenderId() == 0) {
                this.computeWorldMatrix(true);
            }

            var wm = this.getWorldMatrix();

            if (space == Space.WORLD) {
                var tmat = Tmp.Matrix[0];
                wm.invertToRef(tmat);
                point = Vector3.TransformCoordinates(point, tmat);
            }

            return this.setPivotMatrix(Matrix.Translation(-point.x, -point.y, -point.z), true);
        }

        /**
         * Returns a new Vector3 set with the mesh pivot point coordinates in the local space.
         * @returns the pivot point
         */
        public getPivotPoint(): Vector3 {
            var point = Vector3.Zero();
            this.getPivotPointToRef(point);
            return point;
        }

        /**
         * Sets the passed Vector3 "result" with the coordinates of the mesh pivot point in the local space.
         * @param result the vector3 to store the result
         * @returns this TransformNode.
         */
        public getPivotPointToRef(result: Vector3): TransformNode {
            result.x = -this._pivotMatrix.m[12];
            result.y = -this._pivotMatrix.m[13];
            result.z = -this._pivotMatrix.m[14];
            return this;
        }

        /**
         * Returns a new Vector3 set with the mesh pivot point World coordinates.
         * @returns a new Vector3 set with the mesh pivot point World coordinates.
         */
        public getAbsolutePivotPoint(): Vector3 {
            var point = Vector3.Zero();
            this.getAbsolutePivotPointToRef(point);
            return point;
        }

        /**
         * Sets the Vector3 "result" coordinates with the mesh pivot point World coordinates.
         * @param result vector3 to store the result
         * @returns this TransformNode.
         */
        public getAbsolutePivotPointToRef(result: Vector3): TransformNode {
            result.x = this._pivotMatrix.m[12];
            result.y = this._pivotMatrix.m[13];
            result.z = this._pivotMatrix.m[14];
            this.getPivotPointToRef(result);
            Vector3.TransformCoordinatesToRef(result, this.getWorldMatrix(), result);
            return this;
        }

        /**
         * Defines the passed node as the parent of the current node.
         * The node will remain exactly where it is and its position / rotation will be updated accordingly
         * @param node the node ot set as the parent
         * @returns this TransformNode.
         */
        public setParent(node: Nullable<Node>): TransformNode {
            if (!node && !this.parent) {
                return this;
            }

            var quatRotation = Tmp.Quaternion[0];
            var position = Tmp.Vector3[0];
            var scale = Tmp.Vector3[1];

            if (!node) {
                if (this.parent && this.parent.computeWorldMatrix) {
                    this.parent.computeWorldMatrix(true);
                }
                this.computeWorldMatrix(true);
                this.getWorldMatrix().decompose(scale, quatRotation, position);
            } else {
                var diffMatrix = Tmp.Matrix[0];
                var invParentMatrix = Tmp.Matrix[1];

                this.computeWorldMatrix(true);
                node.computeWorldMatrix(true);

                node.getWorldMatrix().invertToRef(invParentMatrix);
                this.getWorldMatrix().multiplyToRef(invParentMatrix, diffMatrix);
                diffMatrix.decompose(scale, quatRotation, position);
            }

            if (this.rotationQuaternion) {
                this.rotationQuaternion.copyFrom(quatRotation);
            } else {
                quatRotation.toEulerAnglesToRef(this.rotation);
            }

            this.scaling.copyFrom(scale);
            this.position.copyFrom(position);

            this.parent = node;
            return this;
        }

        private _nonUniformScaling = false;
        /**
         * True if the scaling property of this object is non uniform eg. (1,2,1)
         */
        public get nonUniformScaling(): boolean {
            return this._nonUniformScaling;
        }

        /** @hidden */
        public _updateNonUniformScalingState(value: boolean): boolean {
            if (this._nonUniformScaling === value) {
                return false;
            }

            this._nonUniformScaling = value;
            return true;
        }

        /**
         * Attach the current TransformNode to another TransformNode associated with a bone
         * @param bone Bone affecting the TransformNode
         * @param affectedTransformNode TransformNode associated with the bone
         * @returns this object
         */
        public attachToBone(bone: Bone, affectedTransformNode: TransformNode): TransformNode {
            this._transformToBoneReferal = affectedTransformNode;
            this.parent = bone;

            if (bone.getWorldMatrix().determinant() < 0) {
                this.scalingDeterminant *= -1;
            }
            return this;
        }

        /**
         * Detach the transform node if its associated with a bone
         * @returns this object
         */
        public detachFromBone(): TransformNode {
            if (!this.parent) {
                return this;
            }

            if (this.parent.getWorldMatrix().determinant() < 0) {
                this.scalingDeterminant *= -1;
            }
            this._transformToBoneReferal = null;
            this.parent = null;
            return this;
        }

        private static _rotationAxisCache = new Quaternion();
        /**
         * Rotates the mesh around the axis vector for the passed angle (amount) expressed in radians, in the given space.
         * space (default LOCAL) can be either BABYLON.Space.LOCAL, either BABYLON.Space.WORLD.
         * Note that the property `rotationQuaternion` is then automatically updated and the property `rotation` is set to (0,0,0) and no longer used.
         * The passed axis is also normalized.
         * @param axis the axis to rotate around
         * @param amount the amount to rotate in radians
         * @param space Space to rotate in (Default: local)
         * @returns the TransformNode.
         */
        public rotate(axis: Vector3, amount: number, space?: Space): TransformNode {
            axis.normalize();
            if (!this.rotationQuaternion) {
                this.rotationQuaternion = this.rotation.toQuaternion();
                this.rotation.setAll(0);
            }
            var rotationQuaternion: Quaternion;
            if (!space || (space as any) === Space.LOCAL) {
                rotationQuaternion = Quaternion.RotationAxisToRef(axis, amount, TransformNode._rotationAxisCache);
                this.rotationQuaternion.multiplyToRef(rotationQuaternion, this.rotationQuaternion);
            }
            else {
                if (this.parent) {
                    const invertParentWorldMatrix = Tmp.Matrix[0];
                    this.parent.getWorldMatrix().invertToRef(invertParentWorldMatrix);
                    axis = Vector3.TransformNormal(axis, invertParentWorldMatrix);
                }
                rotationQuaternion = Quaternion.RotationAxisToRef(axis, amount, TransformNode._rotationAxisCache);
                rotationQuaternion.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);
            }
            return this;
        }

        /**
         * Rotates the mesh around the axis vector for the passed angle (amount) expressed in radians, in world space.
         * Note that the property `rotationQuaternion` is then automatically updated and the property `rotation` is set to (0,0,0) and no longer used.
         * The passed axis is also normalized. .
         * Method is based on http://www.euclideanspace.com/maths/geometry/affine/aroundPoint/index.htm
         * @param point the point to rotate around
         * @param axis the axis to rotate around
         * @param amount the amount to rotate in radians
         * @returns the TransformNode
         */
        public rotateAround(point: Vector3, axis: Vector3, amount: number): TransformNode {
            axis.normalize();
            if (!this.rotationQuaternion) {
                this.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
                this.rotation.setAll(0);
            }

            const tmpVector = Tmp.Vector3[0];
            const finalScale = Tmp.Vector3[1];
            const finalTranslation = Tmp.Vector3[2];

            const finalRotation = Tmp.Quaternion[0];

            const translationMatrix = Tmp.Matrix[0]; // T
            const translationMatrixInv = Tmp.Matrix[1]; // T'
            const rotationMatrix = Tmp.Matrix[2]; // R
            const finalMatrix = Tmp.Matrix[3]; // T' x R x T

            point.subtractToRef(this.position, tmpVector);
            Matrix.TranslationToRef(tmpVector.x, tmpVector.y, tmpVector.z, translationMatrix); // T
            Matrix.TranslationToRef(-tmpVector.x, -tmpVector.y, -tmpVector.z, translationMatrixInv); // T'
            Matrix.RotationAxisToRef(axis, amount, rotationMatrix); // R

            translationMatrixInv.multiplyToRef(rotationMatrix, finalMatrix); // T' x R
            finalMatrix.multiplyToRef(translationMatrix, finalMatrix);  // T' x R x T

            finalMatrix.decompose(finalScale, finalRotation, finalTranslation);

            this.position.addInPlace(finalTranslation);
            finalRotation.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);

            return this;
        }

        /**
         * Translates the mesh along the axis vector for the passed distance in the given space.
         * space (default LOCAL) can be either BABYLON.Space.LOCAL, either BABYLON.Space.WORLD.
         * @param axis the axis to translate in
         * @param distance the distance to translate
         * @param space Space to rotate in (Default: local)
         * @returns the TransformNode.
         */
        public translate(axis: Vector3, distance: number, space?: Space): TransformNode {
            var displacementVector = axis.scale(distance);
            if (!space || (space as any) === Space.LOCAL) {
                var tempV3 = this.getPositionExpressedInLocalSpace().add(displacementVector);
                this.setPositionWithLocalVector(tempV3);
            }
            else {
                this.setAbsolutePosition(this.getAbsolutePosition().add(displacementVector));
            }
            return this;
        }

        /**
         * Adds a rotation step to the mesh current rotation.
         * x, y, z are Euler angles expressed in radians.
         * This methods updates the current mesh rotation, either mesh.rotation, either mesh.rotationQuaternion if it's set.
         * This means this rotation is made in the mesh local space only.
         * It's useful to set a custom rotation order different from the BJS standard one YXZ.
         * Example : this rotates the mesh first around its local X axis, then around its local Z axis, finally around its local Y axis.
         * ```javascript
         * mesh.addRotation(x1, 0, 0).addRotation(0, 0, z2).addRotation(0, 0, y3);
         * ```
         * Note that `addRotation()` accumulates the passed rotation values to the current ones and computes the .rotation or .rotationQuaternion updated values.
         * Under the hood, only quaternions are used. So it's a little faster is you use .rotationQuaternion because it doesn't need to translate them back to Euler angles.
         * @param x Rotation to add
         * @param y Rotation to add
         * @param z Rotation to add
         * @returns the TransformNode.
         */
        public addRotation(x: number, y: number, z: number): TransformNode {
            var rotationQuaternion;
            if (this.rotationQuaternion) {
                rotationQuaternion = this.rotationQuaternion;
            }
            else {
                rotationQuaternion = Tmp.Quaternion[1];
                Quaternion.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, rotationQuaternion);
            }
            var accumulation = Tmp.Quaternion[0];
            Quaternion.RotationYawPitchRollToRef(y, x, z, accumulation);
            rotationQuaternion.multiplyInPlace(accumulation);
            if (!this.rotationQuaternion) {
                rotationQuaternion.toEulerAnglesToRef(this.rotation);
            }
            return this;
        }

        /**
         * Computes the world matrix of the node
         * @param force defines if the cache version should be invalidated forcing the world matrix to be created from scratch
         * @returns the world matrix
         */
        public computeWorldMatrix(force?: boolean): Matrix {
            if (this._isWorldMatrixFrozen) {
                return this._worldMatrix;
            }

            if (!force && this.isSynchronized()) {
                this._currentRenderId = this.getScene().getRenderId();
                return this._worldMatrix;
            }

            this._updateCache();
            this._cache.position.copyFrom(this.position);
            this._cache.scaling.copyFrom(this.scaling);
            this._cache.pivotMatrixUpdated = false;
            this._cache.billboardMode = this.billboardMode;
            this._currentRenderId = this.getScene().getRenderId();
            this._childRenderId = this.getScene().getRenderId();
            this._isDirty = false;

            // Scaling
            Matrix.ScalingToRef(this.scaling.x * this.scalingDeterminant, this.scaling.y * this.scalingDeterminant, this.scaling.z * this.scalingDeterminant, Tmp.Matrix[1]);

            // Rotation

            //rotate, if quaternion is set and rotation was used
            if (this.rotationQuaternion) {
                var len = this.rotation.length();
                if (len) {
                    this.rotationQuaternion.multiplyInPlace(Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z));
                    this.rotation.copyFromFloats(0, 0, 0);
                }
            }

            if (this.rotationQuaternion) {
                this.rotationQuaternion.toRotationMatrix(Tmp.Matrix[0]);
                this._cache.rotationQuaternion.copyFrom(this.rotationQuaternion);
            } else {
                Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, Tmp.Matrix[0]);
                this._cache.rotation.copyFrom(this.rotation);
            }

            // Translation
            let camera = (<Camera>this.getScene().activeCamera);

            if (this.infiniteDistance && !this.parent && camera) {

                var cameraWorldMatrix = camera.getWorldMatrix();

                var cameraGlobalPosition = new Vector3(cameraWorldMatrix.m[12], cameraWorldMatrix.m[13], cameraWorldMatrix.m[14]);

                Matrix.TranslationToRef(this.position.x + cameraGlobalPosition.x, this.position.y + cameraGlobalPosition.y,
                    this.position.z + cameraGlobalPosition.z, Tmp.Matrix[2]);
            } else {
                Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, Tmp.Matrix[2]);
            }

            // Composing transformations
            this._pivotMatrix.multiplyToRef(Tmp.Matrix[1], Tmp.Matrix[4]);
            Tmp.Matrix[4].multiplyToRef(Tmp.Matrix[0], Tmp.Matrix[5]);

            // Billboarding (testing PG:http://www.babylonjs-playground.com/#UJEIL#13)
            if (this.billboardMode !== TransformNode.BILLBOARDMODE_NONE && camera) {
                if ((this.billboardMode & TransformNode.BILLBOARDMODE_ALL) !== TransformNode.BILLBOARDMODE_ALL) {
                    // Need to decompose each rotation here
                    var currentPosition = Tmp.Vector3[3];

                    if (this.parent && this.parent.getWorldMatrix) {
                        if (this._transformToBoneReferal) {
                            this.parent.getWorldMatrix().multiplyToRef(this._transformToBoneReferal.getWorldMatrix(), Tmp.Matrix[6]);
                            Vector3.TransformCoordinatesToRef(this.position, Tmp.Matrix[6], currentPosition);
                        } else {
                            Vector3.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), currentPosition);
                        }
                    } else {
                        currentPosition.copyFrom(this.position);
                    }

                    currentPosition.subtractInPlace(camera.globalPosition);

                    var finalEuler = Tmp.Vector3[4].copyFromFloats(0, 0, 0);
                    if ((this.billboardMode & TransformNode.BILLBOARDMODE_X) === TransformNode.BILLBOARDMODE_X) {
                        finalEuler.x = Math.atan2(-currentPosition.y, currentPosition.z);
                    }

                    if ((this.billboardMode & TransformNode.BILLBOARDMODE_Y) === TransformNode.BILLBOARDMODE_Y) {
                        finalEuler.y = Math.atan2(currentPosition.x, currentPosition.z);
                    }

                    if ((this.billboardMode & TransformNode.BILLBOARDMODE_Z) === TransformNode.BILLBOARDMODE_Z) {
                        finalEuler.z = Math.atan2(currentPosition.y, currentPosition.x);
                    }

                    Matrix.RotationYawPitchRollToRef(finalEuler.y, finalEuler.x, finalEuler.z, Tmp.Matrix[0]);
                } else {
                    Tmp.Matrix[1].copyFrom(camera.getViewMatrix());

                    Tmp.Matrix[1].setTranslationFromFloats(0, 0, 0);
                    Tmp.Matrix[1].invertToRef(Tmp.Matrix[0]);
                }

                Tmp.Matrix[1].copyFrom(Tmp.Matrix[5]);
                Tmp.Matrix[1].multiplyToRef(Tmp.Matrix[0], Tmp.Matrix[5]);
            }

            // Post multiply inverse of pivotMatrix
            if (this._postMultiplyPivotMatrix) {
                Tmp.Matrix[5].multiplyToRef(this._pivotMatrixInverse, Tmp.Matrix[5]);
            }

            // Local world
            Tmp.Matrix[5].multiplyToRef(Tmp.Matrix[2], this._localWorld);

            // Parent
            if (this.parent && this.parent.getWorldMatrix) {
                if (this.billboardMode !== TransformNode.BILLBOARDMODE_NONE) {
                    if (this._transformToBoneReferal) {
                        this.parent.getWorldMatrix().multiplyToRef(this._transformToBoneReferal.getWorldMatrix(), Tmp.Matrix[6]);
                        Tmp.Matrix[5].copyFrom(Tmp.Matrix[6]);
                    } else {
                        Tmp.Matrix[5].copyFrom(this.parent.getWorldMatrix());
                    }

                    this._localWorld.getTranslationToRef(Tmp.Vector3[5]);
                    Vector3.TransformCoordinatesToRef(Tmp.Vector3[5], Tmp.Matrix[5], Tmp.Vector3[5]);
                    this._worldMatrix.copyFrom(this._localWorld);
                    this._worldMatrix.setTranslation(Tmp.Vector3[5]);

                } else {
                    if (this._transformToBoneReferal) {
                        this._localWorld.multiplyToRef(this.parent.getWorldMatrix(), Tmp.Matrix[6]);
                        Tmp.Matrix[6].multiplyToRef(this._transformToBoneReferal.getWorldMatrix(), this._worldMatrix);
                    } else {
                        this._localWorld.multiplyToRef(this.parent.getWorldMatrix(), this._worldMatrix);
                    }
                }
                this._markSyncedWithParent();
            } else {
                this._worldMatrix.copyFrom(this._localWorld);
            }

            // Normal matrix
            if (!this.ignoreNonUniformScaling) {
                if (this.scaling.isNonUniform) {
                    this._updateNonUniformScalingState(true);
                } else if (this.parent && (<TransformNode>this.parent)._nonUniformScaling) {
                    this._updateNonUniformScalingState((<TransformNode>this.parent)._nonUniformScaling);
                } else {
                    this._updateNonUniformScalingState(false);
                }
            } else {
                this._updateNonUniformScalingState(false);
            }

            this._afterComputeWorldMatrix();

            // Absolute position
            this._absolutePosition.copyFromFloats(this._worldMatrix.m[12], this._worldMatrix.m[13], this._worldMatrix.m[14]);

            // Callbacks
            this.onAfterWorldMatrixUpdateObservable.notifyObservers(this);

            if (!this._poseMatrix) {
                this._poseMatrix = Matrix.Invert(this._worldMatrix);
            }

            // Cache the determinant
            this._worldMatrixDeterminant = this._worldMatrix.determinant();

            return this._worldMatrix;
        }

        protected _afterComputeWorldMatrix(): void {
        }

        /**
        * If you'd like to be called back after the mesh position, rotation or scaling has been updated.
        * @param func callback function to add
        *
        * @returns the TransformNode.
        */
        public registerAfterWorldMatrixUpdate(func: (mesh: TransformNode) => void): TransformNode {
            this.onAfterWorldMatrixUpdateObservable.add(func);
            return this;
        }

        /**
         * Removes a registered callback function.
         * @param func callback function to remove
         * @returns the TransformNode.
         */
        public unregisterAfterWorldMatrixUpdate(func: (mesh: TransformNode) => void): TransformNode {
            this.onAfterWorldMatrixUpdateObservable.removeCallback(func);
            return this;
        }

        /**
         * Clone the current transform node
         * @param name Name of the new clone
         * @param newParent New parent for the clone
         * @param doNotCloneChildren Do not clone children hierarchy
         * @returns the new transform node
         */
        public clone(name: string, newParent: Node, doNotCloneChildren?: boolean): Nullable<TransformNode> {
            var result = SerializationHelper.Clone(() => new TransformNode(name, this.getScene()), this);

            result.name = name;
            result.id = name;

            if (newParent) {
                result.parent = newParent;
            }

            if (!doNotCloneChildren) {
                // Children
                let directDescendants = this.getDescendants(true);
                for (let index = 0; index < directDescendants.length; index++) {
                    var child = directDescendants[index];

                    if ((<any>child).clone) {
                        (<any>child).clone(name + "." + child.name, result);
                    }
                }
            }

            return result;
        }

        /**
         * Serializes the objects information.
         * @param currentSerializationObject defines the object to serialize in
         * @returns the serialized object
         */
        public serialize(currentSerializationObject?: any): any {
            let serializationObject = SerializationHelper.Serialize(this, currentSerializationObject);
            serializationObject.type = this.getClassName();

            // Parent
            if (this.parent) {
                serializationObject.parentId = this.parent.id;
            }

            if (Tags && Tags.HasTags(this)) {
                serializationObject.tags = Tags.GetTags(this);
            }

            serializationObject.localMatrix = this.getPivotMatrix().asArray();

            serializationObject.isEnabled = this.isEnabled();

            // Parent
            if (this.parent) {
                serializationObject.parentId = this.parent.id;
            }

            return serializationObject;
        }

        // Statics
        /**
         * Returns a new TransformNode object parsed from the source provided.
         * @param parsedTransformNode is the source.
         * @param scene the scne the object belongs to
         * @param rootUrl is a string, it's the root URL to prefix the `delayLoadingFile` property with
         * @returns a new TransformNode object parsed from the source provided.
         */
        public static Parse(parsedTransformNode: any, scene: Scene, rootUrl: string): TransformNode {
            var transformNode = SerializationHelper.Parse(() => new TransformNode(parsedTransformNode.name, scene), parsedTransformNode, scene, rootUrl);

            if (Tags) {
                Tags.AddTagsTo(transformNode, parsedTransformNode.tags);
            }

            if (parsedTransformNode.localMatrix) {
                transformNode.setPreTransformMatrix(Matrix.FromArray(parsedTransformNode.localMatrix));
            } else if (parsedTransformNode.pivotMatrix) {
                transformNode.setPivotMatrix(Matrix.FromArray(parsedTransformNode.pivotMatrix));
            }

            transformNode.setEnabled(parsedTransformNode.isEnabled);

            // Parent
            if (parsedTransformNode.parentId) {
                transformNode._waitingParentId = parsedTransformNode.parentId;
            }

            return transformNode;
        }

        /**
         * Releases resources associated with this transform node.
         * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
         * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
         */
        public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures = false): void {
            // Animations
            this.getScene().stopAnimation(this);

            // Remove from scene
            this.getScene().removeTransformNode(this);

            this.onAfterWorldMatrixUpdateObservable.clear();

            super.dispose(doNotRecurse, disposeMaterialAndTextures);
        }

    }
}
