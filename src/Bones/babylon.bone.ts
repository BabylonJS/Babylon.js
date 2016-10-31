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

        private _scaleMatrix: Matrix = BABYLON.Matrix.Identity();
        private _scaleVector: Vector3 = new BABYLON.Vector3(1, 1, 1);
        
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

        public scale (x: number, y: number, z: number, scaleChildren = false): void {
	
            var locMat = this.getLocalMatrix();
            var origLocMat = BABYLON.Tmp.Matrix[0];
            origLocMat.copyFrom(locMat);

            var origLocMatInv = BABYLON.Tmp.Matrix[1];
            origLocMatInv.copyFrom(origLocMat);
            origLocMatInv.invert();

            var scaleMat = BABYLON.Tmp.Matrix[2];
            BABYLON.Matrix.FromValuesToRef(x, 0, 0, 0, 0, y, 0, 0, 0, 0, z, 0, 0, 0, 0, 1, scaleMat);
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

            for (var i = 0; i < len; i++) {
                var parentAbsMat = this.children[i]._parent.getAbsoluteTransform();
                this.children[i].getLocalMatrix().multiplyToRef(parentAbsMat, this.children[i].getAbsoluteTransform());
            }

            scaleMat.invert();
            
            if (this.children[0]) {
                var child = this.children[0];
                var cm = child.getLocalMatrix();
                cm.multiplyToRef(scaleMat, cm);
                var lm = child.getLocalMatrix();
                lm.m[12] *= x;
                lm.m[13] *= y;
                lm.m[14] *= z;
            }
            
            if (scaleChildren) {
                for (var i = 0; i < len; i++) {
                    this.children[i].scale(x, y, z, scaleChildren);
                    
                }
            }          

            this.markAsDirty();

        }

        public setYawPitchRoll (yaw: number, pitch: number, roll: number, space = BABYLON.Space.LOCAL, mesh: BABYLON.AbstractMesh = null): void {
	
            var rotMat = BABYLON.Tmp.Matrix[0];
            BABYLON.Matrix.RotationYawPitchRollToRef(yaw, pitch, roll, rotMat);
            var rotMatInv = BABYLON.Tmp.Matrix[1];
            
            if (space == BABYLON.Space.WORLD) {
                
                rotMatInv.copyFrom(this.getAbsoluteTransform());
                
                if (mesh) {
                    rotMatInv.multiplyToRef(mesh.getWorldMatrix(), rotMatInv);
                }
                
                rotMatInv.invert();
                
                var scaleMatrix = BABYLON.Tmp.Matrix[2];
                scaleMatrix.copyFrom(this._scaleMatrix);
                scaleMatrix.m[0] *= -1;
                    
                rotMatInv.multiplyToRef(scaleMatrix, rotMatInv);
                rotMatInv.multiplyToRef(rotMat, rotMat);
            
            }else {
                
                rotMatInv.copyFrom(this.getLocalMatrix());
                rotMatInv.invert();
                
                var scaleMatrix = BABYLON.Tmp.Matrix[2];
                
                scaleMatrix.copyFrom(this._scaleMatrix);
                
                if (this._parent) {
                    var pscaleMatrix = BABYLON.Tmp.Matrix[3];
                    pscaleMatrix.copyFrom(this._parent._scaleMatrix);
                    pscaleMatrix.invert();
                    pscaleMatrix.multiplyToRef(rotMatInv, rotMatInv);
                }
                
                rotMatInv.multiplyToRef(scaleMatrix, rotMatInv);
                rotMatInv.multiplyToRef(rotMat, rotMat);
                
            }
            
            this._rotateWithMatrix(rotMat, space, mesh);
            
        }

        public rotate (axis: BABYLON.Vector3, amount: number, space = BABYLON.Space.LOCAL, mesh: BABYLON.AbstractMesh = null): void {
            
            var rmat = BABYLON.Tmp.Matrix[0];
            rmat.m[12] = 0;
            rmat.m[13] = 0;
            rmat.m[14] = 0;
            
            BABYLON.Matrix.RotationAxisToRef(axis, amount, rmat);
            
            this._rotateWithMatrix(rmat, space, mesh);
            
        }

        private _rotateWithMatrix (rmat:BABYLON.Matrix, space = BABYLON.Space.LOCAL, mesh: BABYLON.AbstractMesh = null): void {

            var lmat = this.getLocalMatrix();
            var lx = lmat.m[12];
            var ly = lmat.m[13];
            var lz = lmat.m[14];
            var parent = this.getParent();
            var parentScale = BABYLON.Tmp.Matrix[3];
            var parentScaleInv = BABYLON.Tmp.Matrix[4];

            if (parent) {
                if (space == BABYLON.Space.WORLD) {
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
                if (space == BABYLON.Space.WORLD && mesh) {
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

            if (parent) {
                var parentAbsMat = this._parent.getAbsoluteTransform();
                lmat.multiplyToRef(parentAbsMat, this.getAbsoluteTransform());
            }else {
                this.getAbsoluteTransform().copyFrom(lmat);
            }

            var len = this.children.length;
            for (var i = 0; i < len; i++) {
                var parentAbsMat = this.children[i]._parent.getAbsoluteTransform();
                this.children[i].getLocalMatrix().multiplyToRef(parentAbsMat, this.children[i].getAbsoluteTransform());
            }

            this.markAsDirty();
            
        }

        public getScale(): Vector3 {
            
            return this._scaleVector.clone();
            
        }

        public getScaleToRef(result:Vector3): void {
	
            result.copyFrom(this._scaleVector);
            
        }

        public getAbsolutePosition (mesh: BABYLON.AbstractMesh = null): BABYLON.Vector3 {

            var pos = BABYLON.Vector3.Zero();

            this.getAbsolutePositionToRef(mesh, pos);

            return pos;

        }

        public getAbsolutePositionToRef (mesh: BABYLON.AbstractMesh = null, result: BABYLON.Vector3): void {

            this._skeleton.computeAbsoluteTransforms();
            
            var tmat = BABYLON.Tmp.Matrix[0];

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
            }

            var children = this.children;
            var len = children.length;

            for (var i = 0; i < len; i++) {
                children[i].computeAbsoluteTransforms();
            }

        }

    }
} 