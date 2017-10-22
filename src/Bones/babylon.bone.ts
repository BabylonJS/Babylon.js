/// <reference path="..\babylon.node.ts" />

module BABYLON {
    export class Bone extends Node {

        private static _tmpVecs: Vector3[] = [Vector3.Zero(), Vector3.Zero()];
        private static _tmpQuat = Quaternion.Identity();
        private static _tmpMats: Matrix[] = [Matrix.Identity(), Matrix.Identity(), Matrix.Identity(), Matrix.Identity(), Matrix.Identity()];

        public children = new Array<Bone>();
        public animations = new Array<Animation>();
        public length: number;

        // Set this value to map this bone to a different index in the transform matrices.
        // Set this value to -1 to exclude the bone from the transform matrices.
        public _index: Nullable<number> = null;

        private _skeleton: Skeleton;
        private _localMatrix: Matrix;
        private _restPose: Matrix;
        private _baseMatrix: Matrix;
        private _worldTransform = new Matrix();
        private _absoluteTransform = new Matrix();
        private _invertedAbsoluteTransform = new Matrix();
        private _parent: Nullable<Bone>;

        private _scaleMatrix = Matrix.Identity();
        private _scaleVector = Vector3.One();
        private _negateScaleChildren = Vector3.One();
        private _scalingDeterminant = 1;

        get _matrix(): Matrix {
            return this._localMatrix;
        }

        set _matrix(val: Matrix) {
            if (this._localMatrix) {
                this._localMatrix.copyFrom(val);
            } else {
                this._localMatrix = val;
            }
        }

        constructor(public name: string, skeleton: Skeleton, parentBone: Nullable<Bone> = null, localMatrix: Nullable<Matrix> = null, 
                    restPose: Nullable<Matrix> = null, baseMatrix: Nullable<Matrix> = null, index: Nullable<number> = null) {
            super(name, skeleton.getScene());
            this._skeleton = skeleton;
            this._localMatrix = localMatrix ? localMatrix : Matrix.Identity();
            this._restPose = restPose ? restPose : this._localMatrix.clone();
            this._baseMatrix = baseMatrix ? baseMatrix : this._localMatrix.clone();
            this._index = index;

            skeleton.bones.push(this);

            this.setParent(parentBone, false);

            this._updateDifferenceMatrix();
        }

        // Members
        public getSkeleton(): Skeleton {
            return this._skeleton;
        }

        public getParent(): Nullable<Bone> {
            return this._parent;
        }

        public setParent(parent: Nullable<Bone>, updateDifferenceMatrix: boolean = true): void {
            if (this._parent === parent) {
                return;
            }

            if (this._parent) {
                var index = this._parent.children.indexOf(this);
                if (index !== -1) {
                    this._parent.children.splice(index);
                }
            }

            this._parent = parent;

            if (this._parent) {
                this._parent.children.push(this);
            }

            if (updateDifferenceMatrix) {
                this._updateDifferenceMatrix();
            }
        }

        public getLocalMatrix(): Matrix {
            return this._localMatrix;
        }

        public getBaseMatrix(): Matrix {
            return this._baseMatrix;
        }

        public getRestPose(): Matrix {
            return this._restPose;
        }      

        public returnToRest(): void {
            this.updateMatrix(this._restPose.clone());
        }

        public getWorldMatrix(): Matrix {
            return this._worldTransform;
        }

        public getInvertedAbsoluteTransform(): Matrix {
            return this._invertedAbsoluteTransform;
        }

        public getAbsoluteTransform(): Matrix {
            return this._absoluteTransform;
        }

        // Properties (matches AbstractMesh properties)
        public get position(): Vector3 {
            return this.getPosition();
        }

        public set position(newPosition: Vector3) {
            this.setPosition(newPosition);
        }

        public get rotation(): Vector3 {
            return this.getRotation();
        }

        public set rotation(newRotation: Vector3) {
            this.setRotation(newRotation);
        }

        public get rotationQuaternion() {
            return this.getRotationQuaternion();
        }

        public set rotationQuaternion(newRotation: Quaternion) {
            this.setRotationQuaternion(newRotation);
        }

        public get scaling(): Vector3 {
            return this.getScale();
        }

        public set scaling(newScaling: Vector3) {
            this.setScale(newScaling.x, newScaling.y, newScaling.z);
        }

        // Methods
        public updateMatrix(matrix: Matrix, updateDifferenceMatrix = true): void {
            this._baseMatrix = matrix.clone();
            this._localMatrix = matrix.clone();

            this._skeleton._markAsDirty();

            if (updateDifferenceMatrix) {
                this._updateDifferenceMatrix();
            }
        }

        public _updateDifferenceMatrix(rootMatrix?: Matrix): void {
            if (!rootMatrix) {
                rootMatrix = this._baseMatrix;
            }

            if (this._parent) {
                rootMatrix.multiplyToRef(this._parent._absoluteTransform, this._absoluteTransform);
            } else {
                this._absoluteTransform.copyFrom(rootMatrix);
            }

            this._absoluteTransform.invertToRef(this._invertedAbsoluteTransform);

            for (var index = 0; index < this.children.length; index++) {
                this.children[index]._updateDifferenceMatrix();
            }

            this._scalingDeterminant = (this._absoluteTransform.determinant() < 0 ? -1 : 1);
        }

        public markAsDirty(): void {
            this._currentRenderId++;
            this._skeleton._markAsDirty();
        }

        public copyAnimationRange(source: Bone, rangeName: string, frameOffset: number, rescaleAsRequired = false, skelDimensionsRatio: Nullable<Vector3> = null): boolean {
            // all animation may be coming from a library skeleton, so may need to create animation
            if (this.animations.length === 0) {
                this.animations.push(new Animation(this.name, "_matrix", source.animations[0].framePerSecond, Animation.ANIMATIONTYPE_MATRIX, 0));
                this.animations[0].setKeys([]);
            }

            // get animation info / verify there is such a range from the source bone
            var sourceRange = source.animations[0].getRange(rangeName);
            if (!sourceRange) {
                return false;
            }
            var from = sourceRange.from;
            var to = sourceRange.to;
            var sourceKeys = source.animations[0].getKeys();
            
            // rescaling prep
            var sourceBoneLength = source.length;
            var sourceParent = source.getParent();
            var parent = this.getParent();
            var parentScalingReqd = rescaleAsRequired && sourceParent && sourceBoneLength && this.length && sourceBoneLength !== this.length;
            var parentRatio = parentScalingReqd && parent && sourceParent ? parent.length / sourceParent.length : 1;
            
            var dimensionsScalingReqd = rescaleAsRequired && !parent && skelDimensionsRatio && (skelDimensionsRatio.x !== 1 || skelDimensionsRatio.y !== 1 || skelDimensionsRatio.z !== 1);           
            
            var destKeys = this.animations[0].getKeys();
            
            // loop vars declaration
            var orig: { frame: number, value: Matrix };
            var origTranslation : Vector3;
            var mat: Matrix;

            for (var key = 0, nKeys = sourceKeys.length; key < nKeys; key++) {
                orig = sourceKeys[key];
                if (orig.frame >= from && orig.frame <= to) {
                    if (rescaleAsRequired) {
                        mat = orig.value.clone();
                        
                        // scale based on parent ratio, when bone has parent
                        if (parentScalingReqd) {
                            origTranslation = mat.getTranslation();
                            mat.setTranslation(origTranslation.scaleInPlace(parentRatio));
                            
                        // scale based on skeleton dimension ratio when root bone, and value is passed
                        } else if (dimensionsScalingReqd && skelDimensionsRatio) {
                            origTranslation = mat.getTranslation();
                            mat.setTranslation(origTranslation.multiplyInPlace(skelDimensionsRatio));                            

                        // use original when root bone, and no data for skelDimensionsRatio
                        } else {
                            mat = orig.value;                            
                        }
                    } else {
                        mat = orig.value;
                    }
                    destKeys.push({ frame: orig.frame + frameOffset, value: mat });
                }
            }
            this.animations[0].createRange(rangeName, from + frameOffset, to + frameOffset);
            return true;
        }

        /**
         * Translate the bone in local or world space.
         * @param vec The amount to translate the bone.
         * @param space The space that the translation is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        public translate(vec: Vector3, space = Space.LOCAL, mesh?: AbstractMesh): void {
            var lm = this.getLocalMatrix();

            if(space == Space.LOCAL){
                lm.m[12] += vec.x;
                lm.m[13] += vec.y;
                lm.m[14] += vec.z;
            } else {
                var wm: Nullable<Matrix> = null;

                //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
                if (mesh){
                    wm = mesh.getWorldMatrix();
                }

                this._skeleton.computeAbsoluteTransforms();
                var tmat = Bone._tmpMats[0];
                var tvec = Bone._tmpVecs[0];

                if (this._parent) {
                    if (mesh && wm) {
                        tmat.copyFrom(this._parent.getAbsoluteTransform());
                        tmat.multiplyToRef(wm, tmat);
                    } else {
                        tmat.copyFrom(this._parent.getAbsoluteTransform());
                    }
                }

                tmat.m[12] = 0;
                tmat.m[13] = 0;
                tmat.m[14] = 0;

                tmat.invert();
                Vector3.TransformCoordinatesToRef(vec, tmat, tvec);

                lm.m[12] += tvec.x;
                lm.m[13] += tvec.y;
                lm.m[14] += tvec.z;

            }

            this.markAsDirty();
	        
        }

        /**
         * Set the postion of the bone in local or world space.
         * @param position The position to set the bone.
         * @param space The space that the position is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        public setPosition(position: Vector3, space = Space.LOCAL, mesh?: AbstractMesh): void {

            var lm = this.getLocalMatrix();

            if (space == Space.LOCAL) {
                lm.m[12] = position.x;
                lm.m[13] = position.y;
                lm.m[14] = position.z;
            } else {
                var wm: Nullable<Matrix> = null;

                //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
                if(mesh){
                    wm = mesh.getWorldMatrix();
                }

                this._skeleton.computeAbsoluteTransforms();

                var tmat = Bone._tmpMats[0];
                var vec = Bone._tmpVecs[0];

                if (this._parent) {
                    if (mesh && wm) {
                        tmat.copyFrom(this._parent.getAbsoluteTransform());
                        tmat.multiplyToRef(wm, tmat);
                    } else {
                        tmat.copyFrom(this._parent.getAbsoluteTransform());
                    }
                }

                tmat.invert();
                Vector3.TransformCoordinatesToRef(position, tmat, vec);

                lm.m[12] = vec.x;
                lm.m[13] = vec.y;
                lm.m[14] = vec.z;

            }

            this.markAsDirty();
	        
        }

        /**
         * Set the absolute postion of the bone (world space).
         * @param position The position to set the bone.
         * @param mesh The mesh that this bone is attached to.
         */
        public setAbsolutePosition(position:Vector3, mesh?: AbstractMesh){

            this.setPosition(position, Space.WORLD, mesh);

        }

        /**
         * Set the scale of the bone on the x, y and z axes.
         * @param x The scale of the bone on the x axis.
         * @param x The scale of the bone on the y axis.
         * @param z The scale of the bone on the z axis.
         * @param scaleChildren Set this to true if children of the bone should be scaled.
         */
        public setScale(x: number, y: number, z: number, scaleChildren = false): void {

            if (this.animations[0] && !this.animations[0].hasRunningRuntimeAnimations) {
                if (!scaleChildren) {
                    this._negateScaleChildren.x = 1/x;
                    this._negateScaleChildren.y = 1/y;
                    this._negateScaleChildren.z = 1/z;
                }
                this._syncScaleVector();
            }

            this.scale(x / this._scaleVector.x, y / this._scaleVector.y, z / this._scaleVector.z, scaleChildren);

        }

        /**
         * Scale the bone on the x, y and z axes. 
         * @param x The amount to scale the bone on the x axis.
         * @param x The amount to scale the bone on the y axis.
         * @param z The amount to scale the bone on the z axis.
         * @param scaleChildren Set this to true if children of the bone should be scaled.
         */
        public scale(x: number, y: number, z: number, scaleChildren = false): void {
	
            var locMat = this.getLocalMatrix();
            var origLocMat = Bone._tmpMats[0];
            origLocMat.copyFrom(locMat);

            var origLocMatInv = Bone._tmpMats[1];
            origLocMatInv.copyFrom(origLocMat);
            origLocMatInv.invert();

            var scaleMat = Bone._tmpMats[2];
            Matrix.FromValuesToRef(x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1, scaleMat);
            this._scaleMatrix.multiplyToRef(scaleMat, this._scaleMatrix);
            this._scaleVector.x *= x;
            this._scaleVector.y *= y;
            this._scaleVector.z *= z;

            locMat.multiplyToRef(origLocMatInv, locMat);
            locMat.multiplyToRef(scaleMat, locMat);
            locMat.multiplyToRef(origLocMat, locMat);

            var parent = this.getParent();

            if (parent) {
                locMat.multiplyToRef(parent.getAbsoluteTransform(), this.getAbsoluteTransform());
            }else {
                this.getAbsoluteTransform().copyFrom(locMat);
            }

            var len = this.children.length;

            scaleMat.invert();
            
            for (var i = 0; i < len; i++) {
                var child = this.children[i];
                var cm = child.getLocalMatrix();
                cm.multiplyToRef(scaleMat, cm);
                var lm = child.getLocalMatrix();
                lm.m[12] *= x;
                lm.m[13] *= y;
                lm.m[14] *= z;
            }

            this.computeAbsoluteTransforms();
            
            if (scaleChildren) {
                for (var i = 0; i < len; i++) {
                    this.children[i].scale(x, y, z, scaleChildren);
                }
            }          

            this.markAsDirty();

        }

        /**
         * Set the yaw, pitch, and roll of the bone in local or world space.
         * @param yaw The rotation of the bone on the y axis.
         * @param pitch The rotation of the bone on the x axis.
         * @param roll The rotation of the bone on the z axis.
         * @param space The space that the axes of rotation are in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        public setYawPitchRoll(yaw: number, pitch: number, roll: number, space = Space.LOCAL, mesh?: AbstractMesh): void {
	
            var rotMat = Bone._tmpMats[0];
            Matrix.RotationYawPitchRollToRef(yaw, pitch, roll, rotMat);
            
            var rotMatInv = Bone._tmpMats[1];
            
            this._getNegativeRotationToRef(rotMatInv, space, mesh);
	
            rotMatInv.multiplyToRef(rotMat, rotMat);
            
            this._rotateWithMatrix(rotMat, space, mesh);
            
        }

        /**
         * Rotate the bone on an axis in local or world space.
         * @param axis The axis to rotate the bone on.
         * @param amount The amount to rotate the bone.
         * @param space The space that the axis is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        public rotate(axis: Vector3, amount: number, space = Space.LOCAL, mesh?: AbstractMesh): void {
            
            var rmat = Bone._tmpMats[0];
            rmat.m[12] = 0;
            rmat.m[13] = 0;
            rmat.m[14] = 0;
            
            Matrix.RotationAxisToRef(axis, amount, rmat);
            
            this._rotateWithMatrix(rmat, space, mesh);
            
        }

        /**
         * Set the rotation of the bone to a particular axis angle in local or world space.
         * @param axis The axis to rotate the bone on.
         * @param angle The angle that the bone should be rotated to.
         * @param space The space that the axis is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        public setAxisAngle(axis: Vector3, angle: number, space = Space.LOCAL, mesh?: AbstractMesh): void {

            var rotMat = Bone._tmpMats[0];
            Matrix.RotationAxisToRef(axis, angle, rotMat);
            var rotMatInv = Bone._tmpMats[1];
            
            this._getNegativeRotationToRef(rotMatInv, space, mesh);
            
            rotMatInv.multiplyToRef(rotMat, rotMat);
            this._rotateWithMatrix(rotMat, space, mesh);

        }

        /**
         * Set the euler rotation of the bone in local of world space.
         * @param rotation The euler rotation that the bone should be set to.
         * @param space The space that the rotation is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        public setRotation(rotation: Vector3, space = Space.LOCAL, mesh?: AbstractMesh): void {
            
            this.setYawPitchRoll(rotation.y, rotation.x, rotation.z, space, mesh);

        }

        /**
         * Set the quaternion rotation of the bone in local of world space.
         * @param quat The quaternion rotation that the bone should be set to.
         * @param space The space that the rotation is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        public setRotationQuaternion(quat: Quaternion, space = Space.LOCAL, mesh?: AbstractMesh): void {

            var rotMatInv = Bone._tmpMats[0];

            this._getNegativeRotationToRef(rotMatInv, space, mesh);

            var rotMat = Bone._tmpMats[1];
            Matrix.FromQuaternionToRef(quat, rotMat);

            rotMatInv.multiplyToRef(rotMat, rotMat);

            this._rotateWithMatrix(rotMat, space, mesh);

        }

        /**
         * Set the rotation matrix of the bone in local of world space.
         * @param rotMat The rotation matrix that the bone should be set to.
         * @param space The space that the rotation is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         */
        public setRotationMatrix(rotMat: Matrix, space = Space.LOCAL, mesh?: AbstractMesh): void {

            var rotMatInv = Bone._tmpMats[0];
            
            this._getNegativeRotationToRef(rotMatInv, space, mesh);

            var rotMat2 = Bone._tmpMats[1];
            rotMat2.copyFrom(rotMat);

            rotMatInv.multiplyToRef(rotMat, rotMat2);
            
            this._rotateWithMatrix(rotMat2, space, mesh);

        }

        private _rotateWithMatrix(rmat: Matrix, space = Space.LOCAL, mesh?: AbstractMesh): void {

            var lmat = this.getLocalMatrix();
            var lx = lmat.m[12];
            var ly = lmat.m[13];
            var lz = lmat.m[14];
            var parent = this.getParent();
            var parentScale = Bone._tmpMats[3];
            var parentScaleInv = Bone._tmpMats[4];

            if (parent) {
                if (space == Space.WORLD) {
                    if (mesh) {
                        parentScale.copyFrom(mesh.getWorldMatrix());
                        parent.getAbsoluteTransform().multiplyToRef(parentScale, parentScale);
                    }else {
                        parentScale.copyFrom(parent.getAbsoluteTransform());
                    }
                }else {
                    parentScale = parent._scaleMatrix;
                }
                parentScaleInv.copyFrom(parentScale);
                parentScaleInv.invert();
                lmat.multiplyToRef(parentScale, lmat);
                lmat.multiplyToRef(rmat, lmat);
                lmat.multiplyToRef(parentScaleInv, lmat);
            }else {
                if (space == Space.WORLD && mesh) {
                    parentScale.copyFrom(mesh.getWorldMatrix());
                    parentScaleInv.copyFrom(parentScale);
                    parentScaleInv.invert();
                    lmat.multiplyToRef(parentScale, lmat);
                    lmat.multiplyToRef(rmat, lmat);
                    lmat.multiplyToRef(parentScaleInv, lmat);
                }else {
                    lmat.multiplyToRef(rmat, lmat);
                }
            }

            lmat.m[12] = lx;
            lmat.m[13] = ly;
            lmat.m[14] = lz;

            this.computeAbsoluteTransforms();

            this.markAsDirty();

        }

        private _getNegativeRotationToRef(rotMatInv: Matrix, space = Space.LOCAL, mesh?: AbstractMesh): void {

            if (space == Space.WORLD) {
                var scaleMatrix = Bone._tmpMats[2];
                scaleMatrix.copyFrom(this._scaleMatrix);
                rotMatInv.copyFrom(this.getAbsoluteTransform());
                
                if (mesh) {
                    rotMatInv.multiplyToRef(mesh.getWorldMatrix(), rotMatInv);
                    var meshScale = Bone._tmpMats[3];
                    Matrix.ScalingToRef(mesh.scaling.x, mesh.scaling.y, mesh.scaling.z, meshScale);
                    scaleMatrix.multiplyToRef(meshScale, scaleMatrix);
                }

                rotMatInv.invert();
                scaleMatrix.m[0] *= this._scalingDeterminant;
                rotMatInv.multiplyToRef(scaleMatrix, rotMatInv);
            } else {
                rotMatInv.copyFrom(this.getLocalMatrix());
                rotMatInv.invert();
                var scaleMatrix = Bone._tmpMats[2];
                scaleMatrix.copyFrom(this._scaleMatrix);

                if (this._parent) {
                    var pscaleMatrix = Bone._tmpMats[3];
                    pscaleMatrix.copyFrom(this._parent._scaleMatrix);
                    pscaleMatrix.invert();
                    pscaleMatrix.multiplyToRef(rotMatInv, rotMatInv);
                } else {
                    scaleMatrix.m[0] *= this._scalingDeterminant;
                }

                rotMatInv.multiplyToRef(scaleMatrix, rotMatInv);
            }

        }

        /**
         * Get the scale of the bone
         * @returns the scale of the bone
         */
        public getScale(): Vector3 {
            
            return this._scaleVector.clone();
            
        }

        /**
         * Copy the scale of the bone to a vector3.
         * @param result The vector3 to copy the scale to
         */
        public getScaleToRef(result: Vector3): void {
	
            result.copyFrom(this._scaleVector);
            
        }

        /**
         * Get the position of the bone in local or world space.
         * @param space The space that the returned position is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @returns The position of the bone
         */
        public getPosition(space = Space.LOCAL, mesh: Nullable<AbstractMesh> = null): Vector3 {
            var pos = Vector3.Zero();

            this.getPositionToRef(space, mesh, pos);

            return pos;
        }

        /**
         * Copy the position of the bone to a vector3 in local or world space.
         * @param space The space that the returned position is in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @param result The vector3 to copy the position to.
         */
        public getPositionToRef(space = Space.LOCAL, mesh: Nullable<AbstractMesh>, result: Vector3): void {

            if (space == Space.LOCAL){
                var lm = this.getLocalMatrix();

                result.x = lm.m[12];
                result.y = lm.m[13];
                result.z = lm.m[14];
            } else {               
                var wm: Nullable<Matrix> = null;
                
                //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
                if (mesh){
                    wm = mesh.getWorldMatrix();
                }
                
                this._skeleton.computeAbsoluteTransforms();
                
                var tmat = Bone._tmpMats[0];

                if (mesh && wm) {
                    tmat.copyFrom(this.getAbsoluteTransform());
                    tmat.multiplyToRef(wm, tmat);
                }else{
                    tmat = this.getAbsoluteTransform();
                }

                result.x = tmat.m[12];
                result.y = tmat.m[13];
                result.z = tmat.m[14];
            }
        }

        /**
         * Get the absolute position of the bone (world space).
         * @param mesh The mesh that this bone is attached to.
         * @returns The absolute position of the bone
         */
        public getAbsolutePosition(mesh: Nullable<AbstractMesh> = null): Vector3 {

            var pos = Vector3.Zero();

            this.getPositionToRef(Space.WORLD, mesh, pos);

            return pos;

        }

        /**
         * Copy the absolute position of the bone (world space) to the result param.
         * @param mesh The mesh that this bone is attached to.
         * @param result The vector3 to copy the absolute position to.
         */
        public getAbsolutePositionToRef(mesh: AbstractMesh, result: Vector3) {

            this.getPositionToRef(Space.WORLD, mesh, result);

        }

        /**
         * Compute the absolute transforms of this bone and its children.
         */
        public computeAbsoluteTransforms(): void {

            if (this._parent) {
                this._localMatrix.multiplyToRef(this._parent._absoluteTransform, this._absoluteTransform);
            } else {
                this._absoluteTransform.copyFrom(this._localMatrix);

                var poseMatrix = this._skeleton.getPoseMatrix();

                if(poseMatrix){
                    this._absoluteTransform.multiplyToRef(poseMatrix, this._absoluteTransform);					
                }
            }

            var children = this.children;
            var len = children.length;

            for (var i = 0; i < len; i++) {
                children[i].computeAbsoluteTransforms();
            }

        }

        private _syncScaleVector(): void{
            
            var lm = this.getLocalMatrix();
            
            var xsq = (lm.m[0] * lm.m[0] + lm.m[1] * lm.m[1] + lm.m[2] * lm.m[2]);
            var ysq = (lm.m[4] * lm.m[4] + lm.m[5] * lm.m[5] + lm.m[6] * lm.m[6]);
            var zsq = (lm.m[8] * lm.m[8] + lm.m[9] * lm.m[9] + lm.m[10] * lm.m[10]);
            
            var xs = lm.m[0] * lm.m[1] * lm.m[2] * lm.m[3] < 0 ? -1 : 1;
            var ys = lm.m[4] * lm.m[5] * lm.m[6] * lm.m[7] < 0 ? -1 : 1;
            var zs = lm.m[8] * lm.m[9] * lm.m[10] * lm.m[11] < 0 ? -1 : 1;
            
            this._scaleVector.x = xs * Math.sqrt(xsq);
            this._scaleVector.y = ys * Math.sqrt(ysq);
            this._scaleVector.z = zs * Math.sqrt(zsq);
            
            if (this._parent) {
                this._scaleVector.x /= this._parent._negateScaleChildren.x;
                this._scaleVector.y /= this._parent._negateScaleChildren.y;
                this._scaleVector.z /= this._parent._negateScaleChildren.z;
            }
            
            Matrix.FromValuesToRef(this._scaleVector.x, 0, 0, 0, 0,  this._scaleVector.y, 0, 0, 0, 0,  this._scaleVector.z, 0, 0, 0, 0, 1, this._scaleMatrix);

        }

        /**
         * Get the world direction from an axis that is in the local space of the bone.
         * @param localAxis The local direction that is used to compute the world direction.
         * @param mesh The mesh that this bone is attached to.
         * @returns The world direction
         */
        public getDirection(localAxis: Vector3, mesh: Nullable<AbstractMesh> = null): Vector3{

            var result = Vector3.Zero();

            this.getDirectionToRef(localAxis, mesh, result);
            
            return result;

        }

        /**
         * Copy the world direction to a vector3 from an axis that is in the local space of the bone.
         * @param localAxis The local direction that is used to compute the world direction.
         * @param mesh The mesh that this bone is attached to.
         * @param result The vector3 that the world direction will be copied to.
         */
        public getDirectionToRef(localAxis: Vector3, mesh: Nullable<AbstractMesh> = null, result: Vector3): void {

            var wm: Nullable<Matrix> = null;

            //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
            if(mesh){
                wm = mesh.getWorldMatrix();
            }

            this._skeleton.computeAbsoluteTransforms();
            
            var mat = Bone._tmpMats[0];

            mat.copyFrom(this.getAbsoluteTransform());

            if (mesh && wm) {
                mat.multiplyToRef(wm, mat);
            }

            Vector3.TransformNormalToRef(localAxis, mat, result);

            result.normalize();

        }

        /**
         * Get the euler rotation of the bone in local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @returns The euler rotation
         */
        public getRotation(space = Space.LOCAL, mesh: Nullable<AbstractMesh> = null): Vector3 {

            var result = Vector3.Zero();

            this.getRotationToRef(space, mesh, result);
            
            return result;

        }

        /**
         * Copy the euler rotation of the bone to a vector3.  The rotation can be in either local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @param result The vector3 that the rotation should be copied to.
         */
        public getRotationToRef(space = Space.LOCAL, mesh: Nullable<AbstractMesh> = null, result: Vector3): void {

            var quat = Bone._tmpQuat;

            this.getRotationQuaternionToRef(space, mesh, quat);
            
            quat.toEulerAnglesToRef(result);

        }

        /**
         * Get the quaternion rotation of the bone in either local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @returns The quaternion rotation
         */
        public getRotationQuaternion(space = Space.LOCAL, mesh: Nullable<AbstractMesh> = null): Quaternion {

            var result = Quaternion.Identity();

            this.getRotationQuaternionToRef(space, mesh, result);

            return result;

        }

        /**
         * Copy the quaternion rotation of the bone to a quaternion.  The rotation can be in either local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @param result The quaternion that the rotation should be copied to.
         */
        public getRotationQuaternionToRef(space = Space.LOCAL, mesh: Nullable<AbstractMesh> = null, result: Quaternion): void{

            if(space == Space.LOCAL){

                this.getLocalMatrix().decompose(Bone._tmpVecs[0], result, Bone._tmpVecs[1]);

            }else{

                var mat = Bone._tmpMats[0];
                var amat = this.getAbsoluteTransform();

                if(mesh){
                    amat.multiplyToRef(mesh.getWorldMatrix(), mat);
                }else{
                    mat.copyFrom(amat);
                }

                mat.m[0] *= this._scalingDeterminant;
                mat.m[1] *= this._scalingDeterminant;
                mat.m[2] *= this._scalingDeterminant;

                mat.decompose(Bone._tmpVecs[0], result, Bone._tmpVecs[1]);

            }
        }

        /**
         * Get the rotation matrix of the bone in local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @returns The rotation matrix
         */
        public getRotationMatrix(space = Space.LOCAL, mesh: AbstractMesh): Matrix {

            var result = Matrix.Identity();

            this.getRotationMatrixToRef(space, mesh, result);

            return result;

        }

        /**
         * Copy the rotation matrix of the bone to a matrix.  The rotation can be in either local or world space.
         * @param space The space that the rotation should be in.
         * @param mesh The mesh that this bone is attached to.  This is only used in world space.
         * @param result The quaternion that the rotation should be copied to.
         */
        public getRotationMatrixToRef(space = Space.LOCAL, mesh: AbstractMesh, result: Matrix): void{

            if(space == Space.LOCAL){

                this.getLocalMatrix().getRotationMatrixToRef(result);

            }else{

                var mat = Bone._tmpMats[0];
                var amat = this.getAbsoluteTransform();

                if(mesh){
                    amat.multiplyToRef(mesh.getWorldMatrix(), mat);
                }else{
                    mat.copyFrom(amat);
                }

                mat.m[0] *= this._scalingDeterminant;
                mat.m[1] *= this._scalingDeterminant;
                mat.m[2] *= this._scalingDeterminant;

                mat.getRotationMatrixToRef(result);
                
            }

        }

        /**
         * Get the world position of a point that is in the local space of the bone.
         * @param position The local position
         * @param mesh The mesh that this bone is attached to.
         * @returns The world position
         */
        public getAbsolutePositionFromLocal(position:Vector3, mesh: Nullable<AbstractMesh> = null): Vector3{

            var result = Vector3.Zero();

            this.getAbsolutePositionFromLocalToRef(position, mesh, result);

            return result;

        }

        /**
         * Get the world position of a point that is in the local space of the bone and copy it to the result param.
         * @param position The local position
         * @param mesh The mesh that this bone is attached to.
         * @param result The vector3 that the world position should be copied to.
         */
        public getAbsolutePositionFromLocalToRef(position:Vector3, mesh: Nullable<AbstractMesh> = null, result:Vector3): void{

            var wm: Nullable<Matrix> = null;

            //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
            if(mesh){
                wm = mesh.getWorldMatrix();
            }

            this._skeleton.computeAbsoluteTransforms();

            var tmat = Bone._tmpMats[0];
            
            if (mesh && wm) {
                tmat.copyFrom(this.getAbsoluteTransform());
                tmat.multiplyToRef(wm, tmat);
            }else{
                tmat = this.getAbsoluteTransform();
            }

            Vector3.TransformCoordinatesToRef(position, tmat, result);

        }

        /**
         * Get the local position of a point that is in world space.
         * @param position The world position
         * @param mesh The mesh that this bone is attached to.
         * @returns The local position
         */
        public getLocalPositionFromAbsolute(position:Vector3, mesh: Nullable<AbstractMesh> = null): Vector3{

            var result = Vector3.Zero();

            this.getLocalPositionFromAbsoluteToRef(position, mesh, result);

            return result;

        }

        /**
         * Get the local position of a point that is in world space and copy it to the result param.
         * @param position The world position
         * @param mesh The mesh that this bone is attached to.
         * @param result The vector3 that the local position should be copied to.
         */
        public getLocalPositionFromAbsoluteToRef(position:Vector3, mesh: Nullable<AbstractMesh> = null, result:Vector3): void{

            var wm: Nullable<Matrix> = null;

            //mesh.getWorldMatrix() needs to be called before skeleton.computeAbsoluteTransforms()
            if(mesh){
                wm = mesh.getWorldMatrix();
            }

            this._skeleton.computeAbsoluteTransforms();

            var tmat = Bone._tmpMats[0];

            tmat.copyFrom(this.getAbsoluteTransform());
            
            if (mesh && wm) {
                tmat.multiplyToRef(wm, tmat);
            }

            tmat.invert();

            Vector3.TransformCoordinatesToRef(position, tmat, result);

        }

    }
} 