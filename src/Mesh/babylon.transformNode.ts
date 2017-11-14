module BABYLON {
    export class TransformNode extends Node {
        // Statics
        public static BILLBOARDMODE_NONE = 0;
        public static BILLBOARDMODE_X = 1;
        public static BILLBOARDMODE_Y = 2;
        public static BILLBOARDMODE_Z = 4;
        public static BILLBOARDMODE_ALL = 7;
        
        // Properties
        private _rotation = Vector3.Zero();
        private _rotationQuaternion: Nullable<Quaternion>;
        protected _scaling = Vector3.One();
        protected _isDirty = false;
        private _transformToBoneReferal: Nullable<TransformNode>;
        
        public billboardMode = AbstractMesh.BILLBOARDMODE_NONE;
        public scalingDeterminant = 1;
        public infiniteDistance = false;
        public position = Vector3.Zero();
                        
        // Cache        
        public _poseMatrix: Matrix;
        private _localWorld = Matrix.Zero();
        public _worldMatrix = Matrix.Zero();
        private _absolutePosition = Vector3.Zero();
        private _pivotMatrix = Matrix.Identity();
        private _pivotMatrixInverse: Matrix;
        private _postMultiplyPivotMatrix = false;        
        
        protected _isWorldMatrixFrozen = false;

        /**
        * An event triggered after the world matrix is updated
        * @type {BABYLON.Observable}
        */
        public onAfterWorldMatrixUpdateObservable = new Observable<TransformNode>();        

        constructor(name: string, scene: Nullable<Scene> = null, isPure = true) {
            super(name, scene);

            if (isPure) {
                this.getScene().addTransformNode(this);
            }
        }        
                
       /**
         * Rotation property : a Vector3 depicting the rotation value in radians around each local axis X, Y, Z. 
         * If rotation quaternion is set, this Vector3 will (almost always) be the Zero vector!
         * Default : (0.0, 0.0, 0.0)
         */
        public get rotation(): Vector3 {
            return this._rotation;
        }

        public set rotation(newRotation: Vector3) {
            this._rotation = newRotation;
        }

        /**
         * Scaling property : a Vector3 depicting the mesh scaling along each local axis X, Y, Z.  
         * Default : (1.0, 1.0, 1.0)
         */
        public get scaling(): Vector3 {
            return this._scaling;
        }

        /**
         * Scaling property : a Vector3 depicting the mesh scaling along each local axis X, Y, Z.  
         * Default : (1.0, 1.0, 1.0)
        */
        public set scaling(newScaling: Vector3) {
            this._scaling = newScaling;
        }

        /**
         * Rotation Quaternion property : this a Quaternion object depicting the mesh rotation by using a unit quaternion. 
         * It's null by default.  
         * If set, only the rotationQuaternion is then used to compute the mesh rotation and its property `.rotation\ is then ignored and set to (0.0, 0.0, 0.0)
         */
        public get rotationQuaternion(): Nullable<Quaternion> {
            return this._rotationQuaternion;
        }

        public set rotationQuaternion(quaternion: Nullable<Quaternion>) {
            this._rotationQuaternion = quaternion;
            //reset the rotation vector. 
            if (quaternion && this.rotation.length()) {
                this.rotation.copyFromFloats(0.0, 0.0, 0.0);
            }
        }

        /**
         * Returns the latest update of the World matrix
         * Returns a Matrix.  
         */
        public getWorldMatrix(): Matrix {
            if (this._currentRenderId !== this.getScene().getRenderId()) {
                this.computeWorldMatrix();
            }
            return this._worldMatrix;
        }

        /**
         * Returns directly the latest state of the mesh World matrix. 
         * A Matrix is returned.    
         */
        public get worldMatrixFromCache(): Matrix {
            return this._worldMatrix;
        }

        /**
         * Copies the paramater passed Matrix into the mesh Pose matrix.  
         * Returns the AbstractMesh.  
         */
        public updatePoseMatrix(matrix: Matrix): TransformNode {
            this._poseMatrix.copyFrom(matrix);
            return this;
        }

        /**
         * Returns the mesh Pose matrix.  
         * Returned object : Matrix
         */
        public getPoseMatrix(): Matrix {
            return this._poseMatrix;
        }
        
        public _isSynchronized(): boolean {
            if (this._isDirty) {
                return false;
            }

            if (this.billboardMode !== this._cache.billboardMode || this.billboardMode !== AbstractMesh.BILLBOARDMODE_NONE)
                return false;

            if (this._cache.pivotMatrixUpdated) {
                return false;
            }

            if (this.infiniteDistance) {
                return false;
            }

            if (!this._cache.position.equals(this.position))
                return false;

            if (this.rotationQuaternion) {
                if (!this._cache.rotationQuaternion.equals(this.rotationQuaternion))
                    return false;
            }

            if (!this._cache.rotation.equals(this.rotation))
                return false;

            if (!this._cache.scaling.equals(this.scaling))
                return false;

            return true;
        }

        public _initCache() {
            super._initCache();

            this._cache.localMatrixUpdated = false;
            this._cache.position = Vector3.Zero();
            this._cache.scaling = Vector3.Zero();
            this._cache.rotation = Vector3.Zero();
            this._cache.rotationQuaternion = new Quaternion(0, 0, 0, 0);
            this._cache.billboardMode = -1;
        }

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
         * Retuns a Vector3.
         */
        public get absolutePosition(): Vector3 {
            return this._absolutePosition;
        }

        /**
         * Sets a new pivot matrix to the mesh.  
         * Returns the AbstractMesh.
        */
        public setPivotMatrix(matrix: Matrix, postMultiplyPivotMatrix = false): TransformNode {
            this._pivotMatrix = matrix.clone();
            this._cache.pivotMatrixUpdated = true;
            this._postMultiplyPivotMatrix = postMultiplyPivotMatrix;

            if (this._postMultiplyPivotMatrix) {
                this._pivotMatrixInverse = Matrix.Invert(matrix);
            }
            return this;
        }

        /**
         * Returns the mesh pivot matrix.
         * Default : Identity.  
         * A Matrix is returned.  
         */
        public getPivotMatrix(): Matrix {
            return this._pivotMatrix;
        }

        /**
         * Prevents the World matrix to be computed any longer.
         * Returns the AbstractMesh.  
         */
        public freezeWorldMatrix(): TransformNode {
            this._isWorldMatrixFrozen = false;  // no guarantee world is not already frozen, switch off temporarily
            this.computeWorldMatrix(true);
            this._isWorldMatrixFrozen = true;
            return this;
        }

        /**
         * Allows back the World matrix computation. 
         * Returns the AbstractMesh.  
         */
        public unfreezeWorldMatrix() {
            this._isWorldMatrixFrozen = false;
            this.computeWorldMatrix(true);
            return this;
        }

        /**
         * True if the World matrix has been frozen.  
         * Returns a boolean.  
         */
        public get isWorldMatrixFrozen(): boolean {
            return this._isWorldMatrixFrozen;
        }

     /**
         * Retuns the mesh absolute position in the World.  
         * Returns a Vector3.
         */
        public getAbsolutePosition(): Vector3 {
            this.computeWorldMatrix();
            return this._absolutePosition;
        }

        /**
         * Sets the mesh absolute position in the World from a Vector3 or an Array(3).
         * Returns the AbstractMesh.  
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
                var invertParentWorldMatrix = this.parent.getWorldMatrix().clone();
                invertParentWorldMatrix.invert();
                var worldPosition = new Vector3(absolutePositionX, absolutePositionY, absolutePositionZ);
                this.position = Vector3.TransformCoordinates(worldPosition, invertParentWorldMatrix);
            } else {
                this.position.x = absolutePositionX;
                this.position.y = absolutePositionY;
                this.position.z = absolutePositionZ;
            }
            return this;
        }   

      /**
         * Sets the mesh position in its local space.  
         * Returns the AbstractMesh.  
         */
        public setPositionWithLocalVector(vector3: Vector3): TransformNode {
            this.computeWorldMatrix();
            this.position = Vector3.TransformNormal(vector3, this._localWorld);
            return this;
        }

        /**
         * Returns the mesh position in the local space from the current World matrix values.
         * Returns a new Vector3.
         */
        public getPositionExpressedInLocalSpace(): Vector3 {
            this.computeWorldMatrix();
            var invLocalWorldMatrix = this._localWorld.clone();
            invLocalWorldMatrix.invert();

            return Vector3.TransformNormal(this.position, invLocalWorldMatrix);
        }

        /**
         * Translates the mesh along the passed Vector3 in its local space.  
         * Returns the AbstractMesh. 
         */
        public locallyTranslate(vector3: Vector3): TransformNode {
            this.computeWorldMatrix(true);
            this.position = Vector3.TransformCoordinates(vector3, this._localWorld);
            return this;
        }

        private static _lookAtVectorCache = new Vector3(0, 0, 0);
        public lookAt(targetPoint: Vector3, yawCor: number = 0, pitchCor: number = 0, rollCor: number = 0, space: Space = Space.LOCAL): TransformNode {
            /// <summary>Orients a mesh towards a target point. Mesh must be drawn facing user.</summary>
            /// <param name="targetPoint" type="Vector3">The position (must be in same space as current mesh) to look at</param>
            /// <param name="yawCor" type="Number">optional yaw (y-axis) correction in radians</param>
            /// <param name="pitchCor" type="Number">optional pitch (x-axis) correction in radians</param>
            /// <param name="rollCor" type="Number">optional roll (z-axis) correction in radians</param>
            /// <returns>Mesh oriented towards targetMesh</returns>

            var dv = AbstractMesh._lookAtVectorCache;
            var pos = space === Space.LOCAL ? this.position : this.getAbsolutePosition();
            targetPoint.subtractToRef(pos, dv);
            var yaw = -Math.atan2(dv.z, dv.x) - Math.PI / 2;
            var len = Math.sqrt(dv.x * dv.x + dv.z * dv.z);
            var pitch = Math.atan2(dv.y, len);
            this.rotationQuaternion = this.rotationQuaternion || new Quaternion();
            Quaternion.RotationYawPitchRollToRef(yaw + yawCor, pitch + pitchCor, rollCor, this.rotationQuaternion);
            return this;
        }        

       /**
         * Returns a new Vector3 what is the localAxis, expressed in the mesh local space, rotated like the mesh.  
         * This Vector3 is expressed in the World space.  
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
         * Returns the AbstractMesh.  
         */
        public getDirectionToRef(localAxis: Vector3, result: Vector3): TransformNode {
            Vector3.TransformNormalToRef(localAxis, this.getWorldMatrix(), result);
            return this;
        }

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

            Vector3.TransformCoordinatesToRef(point, wm, this.position);
            this._pivotMatrix.m[12] = -point.x;
            this._pivotMatrix.m[13] = -point.y;
            this._pivotMatrix.m[14] = -point.z;
            this._cache.pivotMatrixUpdated = true;
            return this;
        }

        /**
         * Returns a new Vector3 set with the mesh pivot point coordinates in the local space.  
         */
        public getPivotPoint(): Vector3 {
            var point = Vector3.Zero();
            this.getPivotPointToRef(point);
            return point;
        }

        /**
         * Sets the passed Vector3 "result" with the coordinates of the mesh pivot point in the local space.   
         * Returns the AbstractMesh.   
         */
        public getPivotPointToRef(result: Vector3): TransformNode {
            result.x = -this._pivotMatrix.m[12];
            result.y = -this._pivotMatrix.m[13];
            result.z = -this._pivotMatrix.m[14];
            return this;
        }

        /**
         * Returns a new Vector3 set with the mesh pivot point World coordinates.  
         */
        public getAbsolutePivotPoint(): Vector3 {
            var point = Vector3.Zero();
            this.getAbsolutePivotPointToRef(point);
            return point;
        }

        /**
         * Sets the Vector3 "result" coordinates with the mesh pivot point World coordinates.  
         * Returns the AbstractMesh.  
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
         * Defines the passed mesh as the parent of the current mesh.  
         * Returns the AbstractMesh.  
         */
        public setParent(mesh: Nullable<AbstractMesh>): TransformNode {
            var parent = (<AbstractMesh>mesh);

            if (mesh == null) {

                var rotation = Tmp.Quaternion[0];
                var position = Tmp.Vector3[0];
                var scale = Tmp.Vector3[1];

                this.getWorldMatrix().decompose(scale, rotation, position);

                if (this.rotationQuaternion) {
                    this.rotationQuaternion.copyFrom(rotation);
                } else {
                    rotation.toEulerAnglesToRef(this.rotation);
                }

                this.position.x = position.x;
                this.position.y = position.y;
                this.position.z = position.z;

            } else {

                var position = Tmp.Vector3[0];
                var m1 = Tmp.Matrix[0];

                parent.getWorldMatrix().invertToRef(m1);
                Vector3.TransformCoordinatesToRef(this.position, m1, position);

                this.position.copyFrom(position);
            }
            this.parent = parent;
            return this;
        }       
        
        private _nonUniformScaling = false;
        public get nonUniformScaling(): boolean {
            return this._nonUniformScaling;
        }

        public _updateNonUniformScalingState(value: boolean): boolean {
            if (this._nonUniformScaling === value) {
                return false;
            }

            this._nonUniformScaling = true;
            return true;
        }        

        /**
         * Attach the current TransformNode to another TransformNode associated with a bone
         * @param bone Bone affecting the TransformNode
         * @param affectedTransformNode TransformNode associated with the bone 
         */
        public attachToBone(bone: Bone, affectedTransformNode: TransformNode): TransformNode {
            this._transformToBoneReferal = affectedTransformNode;
            this.parent = bone;

            if (bone.getWorldMatrix().determinant() < 0) {
                this.scalingDeterminant *= -1;
            }
            return this;
        }

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
         * Returns the AbstractMesh.
         */
        public rotate(axis: Vector3, amount: number, space?: Space): TransformNode {
            axis.normalize();
            if (!this.rotationQuaternion) {
                this.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
                this.rotation = Vector3.Zero();
            }
            var rotationQuaternion: Quaternion;
            if (!space || (space as any) === Space.LOCAL) {
                rotationQuaternion = Quaternion.RotationAxisToRef(axis, amount, AbstractMesh._rotationAxisCache);
                this.rotationQuaternion.multiplyToRef(rotationQuaternion, this.rotationQuaternion);
            }
            else {
                if (this.parent) {
                    var invertParentWorldMatrix = this.parent.getWorldMatrix().clone();
                    invertParentWorldMatrix.invert();
                    axis = Vector3.TransformNormal(axis, invertParentWorldMatrix);
                }
                rotationQuaternion = Quaternion.RotationAxisToRef(axis, amount, AbstractMesh._rotationAxisCache);
                rotationQuaternion.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);
            }
            return this;
        }

        /**
         * Rotates the mesh around the axis vector for the passed angle (amount) expressed in radians, in world space.  
         * Note that the property `rotationQuaternion` is then automatically updated and the property `rotation` is set to (0,0,0) and no longer used.  
         * The passed axis is also normalized.  
         * Returns the AbstractMesh.
         * Method is based on http://www.euclideanspace.com/maths/geometry/affine/aroundPoint/index.htm
         */
        public rotateAround(point: Vector3, axis: Vector3, amount: number): TransformNode {
            axis.normalize();
            if (!this.rotationQuaternion) {
                this.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
                this.rotation.copyFromFloats(0, 0, 0);
            }
            point.subtractToRef(this.position, Tmp.Vector3[0]);
            Matrix.TranslationToRef(Tmp.Vector3[0].x, Tmp.Vector3[0].y, Tmp.Vector3[0].z, Tmp.Matrix[0]);
            Tmp.Matrix[0].invertToRef(Tmp.Matrix[2]);
            Matrix.RotationAxisToRef(axis, amount, Tmp.Matrix[1]);
            Tmp.Matrix[2].multiplyToRef(Tmp.Matrix[1], Tmp.Matrix[2]);
            Tmp.Matrix[2].multiplyToRef(Tmp.Matrix[0], Tmp.Matrix[2]);

            Tmp.Matrix[2].decompose(Tmp.Vector3[0], Tmp.Quaternion[0], Tmp.Vector3[1]);

            this.position.addInPlace(Tmp.Vector3[1]);
            Tmp.Quaternion[0].multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);

            return this;
        }

        /**
         * Translates the mesh along the axis vector for the passed distance in the given space.  
         * space (default LOCAL) can be either BABYLON.Space.LOCAL, either BABYLON.Space.WORLD.
         * Returns the AbstractMesh.
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
         * Returns the AbstractMesh.  
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
            var accumulation = BABYLON.Tmp.Quaternion[0];
            Quaternion.RotationYawPitchRollToRef(y, x, z, accumulation);
            rotationQuaternion.multiplyInPlace(accumulation);
            if (!this.rotationQuaternion) {
                rotationQuaternion.toEulerAnglesToRef(this.rotation);
            }
            return this;
        }        
        
        /**
         * Computes the mesh World matrix and returns it.  
         * If the mesh world matrix is frozen, this computation does nothing more than returning the last frozen values.  
         * If the parameter `force` is let to `false` (default), the current cached World matrix is returned. 
         * If the parameter `force`is set to `true`, the actual computation is done.  
         * Returns the mesh World Matrix.
         */
        public computeWorldMatrix(force?: boolean): Matrix {
            if (this._isWorldMatrixFrozen) {
                return this._worldMatrix;
            }

            if (!force && this.isSynchronized(true)) {
                return this._worldMatrix;
            }

            this._cache.position.copyFrom(this.position);
            this._cache.scaling.copyFrom(this.scaling);
            this._cache.pivotMatrixUpdated = false;
            this._cache.billboardMode = this.billboardMode;
            this._currentRenderId = this.getScene().getRenderId();
            this._isDirty = false;

            // Scaling
            Matrix.ScalingToRef(this.scaling.x * this.scalingDeterminant, this.scaling.y * this.scalingDeterminant, this.scaling.z * this.scalingDeterminant, Tmp.Matrix[1]);

            // Rotation

            //rotate, if quaternion is set and rotation was used
            if (this.rotationQuaternion) {
                var len = this.rotation.length();
                if (len) {
                    this.rotationQuaternion.multiplyInPlace(BABYLON.Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z))
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
            if (this.billboardMode !== AbstractMesh.BILLBOARDMODE_NONE && camera) {
                if ((this.billboardMode & AbstractMesh.BILLBOARDMODE_ALL) !== AbstractMesh.BILLBOARDMODE_ALL) {
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
                    if ((this.billboardMode & AbstractMesh.BILLBOARDMODE_X) === AbstractMesh.BILLBOARDMODE_X) {
                        finalEuler.x = Math.atan2(-currentPosition.y, currentPosition.z);
                    }

                    if ((this.billboardMode & AbstractMesh.BILLBOARDMODE_Y) === AbstractMesh.BILLBOARDMODE_Y) {
                        finalEuler.y = Math.atan2(currentPosition.x, currentPosition.z);
                    }

                    if ((this.billboardMode & AbstractMesh.BILLBOARDMODE_Z) === AbstractMesh.BILLBOARDMODE_Z) {
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

            // Local world
            Tmp.Matrix[5].multiplyToRef(Tmp.Matrix[2], this._localWorld);

            // Parent
            if (this.parent && this.parent.getWorldMatrix) {
                if (this.billboardMode !== AbstractMesh.BILLBOARDMODE_NONE) {
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

            // Post multiply inverse of pivotMatrix
            if (this._postMultiplyPivotMatrix) {
                this._worldMatrix.multiplyToRef(this._pivotMatrixInverse, this._worldMatrix);
            }

            // Normal matrix
            if (this.scaling.isNonUniform) {
                this._updateNonUniformScalingState(true);
            } else if (this.parent && (<TransformNode>this.parent)._nonUniformScaling) {
                this._updateNonUniformScalingState((<TransformNode>this.parent)._nonUniformScaling);
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

            return this._worldMatrix;
        }   

        protected _afterComputeWorldMatrix(): void {
        }

        /**
        * If you'd like to be called back after the mesh position, rotation or scaling has been updated.  
        * @param func: callback function to add
        *
        * Returns the TransformNode. 
        */
        public registerAfterWorldMatrixUpdate(func: (mesh: TransformNode) => void): TransformNode {
            this.onAfterWorldMatrixUpdateObservable.add(func);
            return this;
        }

        /**
         * Removes a registered callback function.  
         * Returns the TransformNode.
         */
        public unregisterAfterWorldMatrixUpdate(func: (mesh: TransformNode) => void): TransformNode {
            this.onAfterWorldMatrixUpdateObservable.removeCallback(func);
            return this;
        }        

        public clone(name: string, newParent: Node): Nullable<TransformNode> {
            var result = SerializationHelper.Clone(() => new TransformNode(name, this.getScene()), this);

            result.name = name;
            result.id = name;

            if (newParent) {
                result.parent = newParent;
            }

            return result;
        }        

        public serialize(serializationObject: any = null): any {
            if (!serializationObject) {
                serializationObject = {};
            }

            serializationObject.name = this.name;
            serializationObject.id = this.id;
            serializationObject.type = this.getClassName();

            if (Tags && Tags.HasTags(this)) {
                serializationObject.tags = Tags.GetTags(this);
            }

            serializationObject.position = this.position.asArray();

            if (this.rotationQuaternion) {
                serializationObject.rotationQuaternion = this.rotationQuaternion.asArray();
            } else if (this.rotation) {
                serializationObject.rotation = this.rotation.asArray();
            }

            serializationObject.scaling = this.scaling.asArray();
            serializationObject.localMatrix = this.getPivotMatrix().asArray();

            serializationObject.isEnabled = this.isEnabled();
            serializationObject.infiniteDistance = this.infiniteDistance;

            serializationObject.billboardMode = this.billboardMode;

            // Parent
            if (this.parent) {
                serializationObject.parentId = this.parent.id;
            }

            // Metadata
            if (this.metadata) {
                serializationObject.metadata = this.metadata;
            }

            return serializationObject;
        }

        // Statics
        /**
         * Returns a new TransformNode object parsed from the source provided.   
         * The parameter `parsedMesh` is the source.   
         * The parameter `rootUrl` is a string, it's the root URL to prefix the `delayLoadingFile` property with
         */
        public static Parse(parsedTransformNode: any, scene: Scene, rootUrl: string): TransformNode {
            var transformNode = new TransformNode(parsedTransformNode.name, scene);

            transformNode.id = parsedTransformNode.id;

            if (Tags) {
                Tags.AddTagsTo(transformNode, parsedTransformNode.tags);
            }

            transformNode.position = Vector3.FromArray(parsedTransformNode.position);

            if (parsedTransformNode.metadata !== undefined) {
                transformNode.metadata = parsedTransformNode.metadata;
            }

            if (parsedTransformNode.rotationQuaternion) {
                transformNode.rotationQuaternion = Quaternion.FromArray(parsedTransformNode.rotationQuaternion);
            } else if (parsedTransformNode.rotation) {
                transformNode.rotation = Vector3.FromArray(parsedTransformNode.rotation);
            }

            transformNode.scaling = Vector3.FromArray(parsedTransformNode.scaling);

            if (parsedTransformNode.localMatrix) {
                transformNode.setPivotMatrix(Matrix.FromArray(parsedTransformNode.localMatrix));
            } else if (parsedTransformNode.pivotMatrix) {
                transformNode.setPivotMatrix(Matrix.FromArray(parsedTransformNode.pivotMatrix));
            }

            transformNode.setEnabled(parsedTransformNode.isEnabled);
            transformNode.infiniteDistance = parsedTransformNode.infiniteDistance;

            transformNode.billboardMode = parsedTransformNode.billboardMode;

            // Parent
            if (parsedTransformNode.parentId) {
                transformNode._waitingParentId = parsedTransformNode.parentId;
            }
         
            return transformNode;
        }        
    }
}