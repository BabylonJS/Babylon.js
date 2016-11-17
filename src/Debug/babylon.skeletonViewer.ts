module BABYLON.Debug {
    /**
    * Demo available here: http://www.babylonjs-playground.com/#1BZJVJ#8
    */
    export class SkeletonViewer {
        public color: Color3 = Color3.White();

        private _scene: Scene;
        private _debugLines = []; 
        private _debugMesh: LinesMesh;
        private _isEnabled = false;
        private _renderFunction: () => void;

        constructor(public skeleton: Skeleton, public mesh: AbstractMesh, scene: Scene, public autoUpdateBonesMatrices = true, public renderingGroupId = 1) {
            this._scene = scene;

            this.update();

            this._renderFunction = this.update.bind(this);
        }

        public set isEnabled(value: boolean) {
            if (this._isEnabled === value) {
                return;
            }

            this._isEnabled = value;

            if (value) {
                this._scene.registerBeforeRender(this._renderFunction);
            } else {
                this._scene.unregisterBeforeRender(this._renderFunction);
            }
        }

        public get isEnabled(): boolean {
            return this._isEnabled;
        }

        private _getBonePosition(position: Vector3, bone: Bone, meshMat: Matrix, x = 0, y = 0, z = 0): void {
            var tmat = Tmp.Matrix[0];
            var parentBone = bone.getParent();
            tmat.copyFrom(bone.getLocalMatrix());

            if (x !== 0 || y !== 0 || z !== 0) {
                var tmat2 = Tmp.Matrix[1];
                BABYLON.Matrix.IdentityToRef(tmat2);
                tmat2.m[12] = x;
                tmat2.m[13] = y;
                tmat2.m[14] = z;
                tmat2.multiplyToRef(tmat, tmat);
            }

            if (parentBone) {
                tmat.multiplyToRef(parentBone.getAbsoluteTransform(), tmat);
            }

            tmat.multiplyToRef(meshMat, tmat);

            position.x = tmat.m[12];
            position.y = tmat.m[13];
            position.z = tmat.m[14];
        }

        private _getLinesForBonesWithLength(bones: Bone[], meshMat: Matrix): void {
            var len = bones.length;
            for (var i = 0; i < len; i++) {
                var bone = bones[i];
                var points = this._debugLines[i];
                if (!points) {
                    points = [Vector3.Zero(), Vector3.Zero()];
                    this._debugLines[i] = points;
                }
                this._getBonePosition(points[0], bone, meshMat);
                this._getBonePosition(points[1], bone, meshMat, 0, bone.length, 0);
            }
        }

        private _getLinesForBonesNoLength(bones: Bone[], meshMat: Matrix): void {
            var len = bones.length;
            var boneNum = 0;
            for (var i = len - 1; i >= 0; i--) {
                var childBone = bones[i];
                var parentBone = childBone.getParent();
                if (!parentBone) {
                    continue;
                }
                var points = this._debugLines[boneNum];
                if (!points) {
                    points = [Vector3.Zero(), Vector3.Zero()];
                    this._debugLines[boneNum] = points;
                }
                childBone.getAbsolutePositionToRef(this.mesh, points[0]);
				parentBone.getAbsolutePositionToRef(this.mesh, points[1]);
                boneNum++;
            }
        }

        public update() {
            if (this.autoUpdateBonesMatrices) {
                this.skeleton.computeAbsoluteTransforms();
            }

            if (this.skeleton.bones[0].length === undefined) {
                this._getLinesForBonesNoLength(this.skeleton.bones, this.mesh.getWorldMatrix());
            } else {
                this._getLinesForBonesWithLength(this.skeleton.bones, this.mesh.getWorldMatrix());
            }

            if (!this._debugMesh) {
                this._debugMesh = BABYLON.MeshBuilder.CreateLineSystem(null, { lines: this._debugLines, updatable: true }, this._scene);
                this._debugMesh.renderingGroupId = this.renderingGroupId;
            } else {
                BABYLON.MeshBuilder.CreateLineSystem(null, { lines: this._debugLines, updatable: true, instance: this._debugMesh }, this._scene);
            }
            this._debugMesh.color = this.color;
        }

        public dispose() {
            if (this._debugMesh) {
                this.isEnabled = false;
                this._debugMesh.dispose();
                this._debugMesh = null;
            }
        }
    }
}
