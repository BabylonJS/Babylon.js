module BABYLON {
    export class Bone extends Node {
        public children = new Array<Bone>();
        public animations = new Array<Animation>();
        public length: number;

        private _skeleton: Skeleton;
        public _matrix: Matrix;
        private _restPose: Matrix;
        private _baseMatrix: Matrix;
        private _worldTransform = new Matrix();
        private _absoluteTransform = new Matrix();
        private _invertedAbsoluteTransform = new Matrix();
        private _parent: Bone;

        private _scaleMatrix = Matrix.Identity();
        private _scaleVector = new Vector3(1, 1, 1);
        private _negateScaleChildren = new Vector3(1, 1, 1);
        
        constructor(public name: string, skeleton: Skeleton, parentBone: Bone, matrix: Matrix, restPose?: Matrix) {
            super(name, skeleton.getScene());
            this._skeleton = skeleton;
            this._matrix = matrix;
            this._baseMatrix = matrix;
            this._restPose = restPose ? restPose : matrix.clone();

            skeleton.bones.push(this);

            if (parentBone) {
                this._parent = parentBone;
                parentBone.children.push(this);
            } else {
                this._parent = null;
            }

            this._updateDifferenceMatrix();
        }

        // Members
        public getParent(): Bone {
            return this._parent;
        }

        public getLocalMatrix(): Matrix {
            return this._matrix;
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

        // Methods
        public updateMatrix(matrix: Matrix, updateDifferenceMatrix = true): void {
            this._baseMatrix = matrix.clone();
            this._matrix = matrix.clone();

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
        }

        public markAsDirty(): void {
            this._currentRenderId++;
            this._skeleton._markAsDirty();
        }

        public copyAnimationRange(source: Bone, rangeName: string, frameOffset: number, rescaleAsRequired = false, skelDimensionsRatio : Vector3 = null): boolean {
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
            var parentRatio = parentScalingReqd ? parent.length / sourceParent.length : null;
            
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
                        } else if (dimensionsScalingReqd) {
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

        public translate (vec: Vector3): void {

            var lm = this.getLocalMatrix();

            lm.m[12] += vec.x;
            lm.m[13] += vec.y;
            lm.m[14] += vec.z;

            this.markAsDirty();
	        
        }

        public setPosition (position: Vector3): void {

            var lm = this.getLocalMatrix();

            lm.m[12] = position.x;
            lm.m[13] = position.y;
            lm.m[14] = position.z;

            this.markAsDirty();
	        
        }

        public setAbsolutePosition (position: Vector3, mesh: AbstractMesh = null): void {

            this._skeleton.computeAbsoluteTransforms();

            var tmat = Tmp.Matrix[0];
            var vec = Tmp.Vector3[0];

            if (mesh) {
                tmat.copyFrom(this._parent.getAbsoluteTransform());
                tmat.multiplyToRef(mesh.getWorldMatrix(), tmat);
            }else {
                tmat.copyFrom(this._parent.getAbsoluteTransform());
            }

            tmat.invert();
			Vector3.TransformCoordinatesToRef(position, tmat, vec);

			var lm = this.getLocalMatrix();
            lm.m[12] = vec.x;
            lm.m[13] = vec.y;
            lm.m[14] = vec.z;
            
            this.markAsDirty();
			
	        
        }

        public setScale (x: number, y: number, z: number, scaleChildren = false): void {

            if (this.animations[0] && !this.animations[0].isStopped()) {
                if (!scaleChildren) {
                    this._negateScaleChildren.x = 1/x;
                    this._negateScaleChildren.y = 1/y;
                    this._negateScaleChildren.z = 1/z;
                }
                this._syncScaleVector();
            }

	        this.scale(x / this._scaleVector.x, y / this._scaleVector.y, z / this._scaleVector.z, scaleChildren);

        }

        public scale (x: number, y: number, z: number, scaleChildren = false): void {
	
            var locMat = this.getLocalMatrix();
            var origLocMat = Tmp.Matrix[0];
            origLocMat.copyFrom(locMat);

            var origLocMatInv = Tmp.Matrix[1];
            origLocMatInv.copyFrom(origLocMat);
            origLocMatInv.invert();

            var scaleMat = Tmp.Matrix[2];
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

        public setYawPitchRoll (yaw: number, pitch: number, roll: number, space = Space.LOCAL, mesh: AbstractMesh = null): void {
	
            var rotMat = Tmp.Matrix[0];
            Matrix.RotationYawPitchRollToRef(yaw, pitch, roll, rotMat);
            
            var rotMatInv = Tmp.Matrix[1];
            
            this._getNegativeRotationToRef(rotMatInv, space, mesh);
	
            rotMatInv.multiplyToRef(rotMat, rotMat);
            
            this._rotateWithMatrix(rotMat, space, mesh);
            
        }

        public rotate (axis: Vector3, amount: number, space = Space.LOCAL, mesh: AbstractMesh = null): void {
            
            var rmat = Tmp.Matrix[0];
            rmat.m[12] = 0;
            rmat.m[13] = 0;
            rmat.m[14] = 0;
            
            Matrix.RotationAxisToRef(axis, amount, rmat);
            
            this._rotateWithMatrix(rmat, space, mesh);
            
        }

        public setAxisAngle (axis: Vector3, angle: number, space = Space.LOCAL, mesh: AbstractMesh = null): void {

            var rotMat = Tmp.Matrix[0];
            Matrix.RotationAxisToRef(axis, angle, rotMat);
            var rotMatInv = Tmp.Matrix[1];
            
            this._getNegativeRotationToRef(rotMatInv, space, mesh);
            
            rotMatInv.multiplyToRef(rotMat, rotMat);
            this._rotateWithMatrix(rotMat, space, mesh);

        }

        public setRotationMatrix (rotMat: Matrix, space = Space.LOCAL, mesh: AbstractMesh = null): void {

            var rotMatInv = Tmp.Matrix[1];
            
            this._getNegativeRotationToRef(rotMatInv, space, mesh);

            rotMatInv.multiplyToRef(rotMat, rotMat);
            
            this._rotateWithMatrix(rotMat, space, mesh);

        }

        private _rotateWithMatrix (rmat: Matrix, space = Space.LOCAL, mesh: AbstractMesh = null): void {

            var lmat = this.getLocalMatrix();
            var lx = lmat.m[12];
            var ly = lmat.m[13];
            var lz = lmat.m[14];
            var parent = this.getParent();
            var parentScale = Tmp.Matrix[3];
            var parentScaleInv = Tmp.Matrix[4];

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

        private _getNegativeRotationToRef(rotMatInv: Matrix, space = Space.LOCAL, mesh: AbstractMesh = null): void {

            if (space == Space.WORLD) {
                var scaleMatrix = BABYLON.Tmp.Matrix[2];
				scaleMatrix.copyFrom(this._scaleMatrix);
				rotMatInv.copyFrom(this.getAbsoluteTransform());
				if (mesh) {
                    rotMatInv.multiplyToRef(mesh.getWorldMatrix(), rotMatInv);
					var meshScale = BABYLON.Tmp.Matrix[3];
					BABYLON.Matrix.ScalingToRef(mesh.scaling.x, mesh.scaling.y, mesh.scaling.z, meshScale);
					scaleMatrix.multiplyToRef(meshScale, scaleMatrix);
                }
				rotMatInv.invert();
                scaleMatrix.m[0] *= -1;
                rotMatInv.multiplyToRef(scaleMatrix, rotMatInv);
            } else {
                rotMatInv.copyFrom(this.getLocalMatrix());
                rotMatInv.invert();
                var scaleMatrix = Tmp.Matrix[2];
                scaleMatrix.copyFrom(this._scaleMatrix);
                if (this._parent) {
                    var pscaleMatrix = Tmp.Matrix[3];
                    pscaleMatrix.copyFrom(this._parent._scaleMatrix);
                    pscaleMatrix.invert();
                    pscaleMatrix.multiplyToRef(rotMatInv, rotMatInv);
                } else {
                    scaleMatrix.m[0] *= -1;
                }
                rotMatInv.multiplyToRef(scaleMatrix, rotMatInv);
            }

        }

        public getScale(): Vector3 {
            
            return this._scaleVector.clone();
            
        }

        public getScaleToRef(result: Vector3): void {
	
            result.copyFrom(this._scaleVector);
            
        }

        public getAbsolutePosition (mesh: AbstractMesh = null): Vector3 {

            var pos = Vector3.Zero();

            this.getAbsolutePositionToRef(mesh, pos);

            return pos;

        }

        public getAbsolutePositionToRef (mesh: AbstractMesh = null, result: Vector3): void {

            this._skeleton.computeAbsoluteTransforms();
            
            var tmat = Tmp.Matrix[0];

            if (mesh) {
                tmat.copyFrom(this.getAbsoluteTransform());
                tmat.multiplyToRef(mesh.getWorldMatrix(), tmat);
            }else{
                tmat = this.getAbsoluteTransform();
            }

            result.x = tmat.m[12];
            result.y = tmat.m[13];
            result.z = tmat.m[14];

        }

        public computeAbsoluteTransforms (): void {

            if (this._parent) {
                this._matrix.multiplyToRef(this._parent._absoluteTransform, this._absoluteTransform);
            } else {
                this._absoluteTransform.copyFrom(this._matrix);

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

        private _syncScaleVector = function(): void{
            
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

        }

        public getDirection (localAxis: Vector3, mesh: AbstractMesh): Vector3{

            var result = Vector3.Zero();

            this.getDirectionToRef(localAxis, mesh, result);
            
            return result;

        }

        public getDirectionToRef (localAxis: Vector3, mesh: AbstractMesh, result: Vector3): void {

            this._skeleton.computeAbsoluteTransforms();
            
            var mat = BABYLON.Tmp.Matrix[0];

            mat.copyFrom(this.getAbsoluteTransform());

            if(mesh){
                mat.multiplyToRef(mesh.getWorldMatrix(), mat);
            }

            Vector3.TransformNormalToRef(localAxis, mat, result);

            if (this._scaleVector.x != 1 || this._scaleVector.y != 1 || this._scaleVector.z != 1) {
                result.normalize();
            }

        }

        public getRotation(mesh: AbstractMesh): Quaternion {

            var result = Quaternion.Identity();

            this.getRotationToRef(mesh, result);

            return result;

        }

        public getRotationToRef(mesh: AbstractMesh, result: Quaternion): void{

            var mat = Tmp.Matrix[0];
            var amat = this.getAbsoluteTransform();
            var wmat = mesh.getWorldMatrix();

            amat.multiplyToRef(wmat, mat);

            mat.decompose(Tmp.Vector3[0], result, Tmp.Vector3[1]);

        }

    }
} 