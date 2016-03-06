var BABYLON;
(function (BABYLON) {
    var Debug;
    (function (Debug) {
        /**
        * Demo available here: http://www.babylonjs-playground.com/#1BZJVJ#8
        */
        var SkeletonViewer = (function () {
            function SkeletonViewer(skeleton, mesh, scene, autoUpdateBonesMatrices, renderingGroupId) {
                if (autoUpdateBonesMatrices === void 0) { autoUpdateBonesMatrices = true; }
                if (renderingGroupId === void 0) { renderingGroupId = 1; }
                this.skeleton = skeleton;
                this.mesh = mesh;
                this.autoUpdateBonesMatrices = autoUpdateBonesMatrices;
                this.renderingGroupId = renderingGroupId;
                this.color = BABYLON.Color3.White();
                this._debugLines = [];
                this._isEnabled = false;
                this._scene = scene;
                this.update();
                this._renderFunction = this.update.bind(this);
            }
            Object.defineProperty(SkeletonViewer.prototype, "isEnabled", {
                get: function () {
                    return this._isEnabled;
                },
                set: function (value) {
                    if (this._isEnabled === value) {
                        return;
                    }
                    this._isEnabled = value;
                    if (value) {
                        this._scene.registerBeforeRender(this._renderFunction);
                    }
                    else {
                        this._scene.unregisterBeforeRender(this._renderFunction);
                    }
                },
                enumerable: true,
                configurable: true
            });
            SkeletonViewer.prototype._getBonePosition = function (position, bone, meshMat, x, y, z) {
                if (x === void 0) { x = 0; }
                if (y === void 0) { y = 0; }
                if (z === void 0) { z = 0; }
                var tmat = BABYLON.Tmp.Matrix[0];
                var parentBone = bone.getParent();
                tmat.copyFrom(bone.getLocalMatrix());
                if (x !== 0 || y !== 0 || z !== 0) {
                    var tmat2 = BABYLON.Tmp.Matrix[1];
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
            };
            SkeletonViewer.prototype._getLinesForBonesWithLength = function (bones, meshMat) {
                var len = bones.length;
                for (var i = 0; i < len; i++) {
                    var bone = bones[i];
                    var points = this._debugLines[i];
                    if (!points) {
                        points = [BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero()];
                        this._debugLines[i] = points;
                    }
                    this._getBonePosition(points[0], bone, meshMat);
                    this._getBonePosition(points[1], bone, meshMat, 0, bone.length, 0);
                }
            };
            SkeletonViewer.prototype._getLinesForBonesNoLength = function (bones, meshMat) {
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
                        points = [BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero()];
                        this._debugLines[boneNum] = points;
                    }
                    this._getBonePosition(points[0], childBone, meshMat);
                    this._getBonePosition(points[1], parentBone, meshMat);
                    boneNum++;
                }
            };
            SkeletonViewer.prototype.update = function () {
                if (this.autoUpdateBonesMatrices) {
                    this._updateBoneMatrix(this.skeleton.bones[0]);
                }
                if (this.skeleton.bones[0].length === undefined) {
                    this._getLinesForBonesNoLength(this.skeleton.bones, this.mesh.getWorldMatrix());
                }
                else {
                    this._getLinesForBonesWithLength(this.skeleton.bones, this.mesh.getWorldMatrix());
                }
                if (!this._debugMesh) {
                    this._debugMesh = BABYLON.MeshBuilder.CreateLineSystem(null, { lines: this._debugLines, updatable: true }, this._scene);
                    this._debugMesh.renderingGroupId = this.renderingGroupId;
                }
                else {
                    BABYLON.MeshBuilder.CreateLineSystem(null, { lines: this._debugLines, updatable: true, instance: this._debugMesh }, this._scene);
                }
                this._debugMesh.color = this.color;
            };
            SkeletonViewer.prototype._updateBoneMatrix = function (bone) {
                if (bone.getParent()) {
                    bone.getLocalMatrix().multiplyToRef(bone.getParent().getAbsoluteTransform(), bone.getAbsoluteTransform());
                }
                var children = bone.children;
                var len = children.length;
                for (var i = 0; i < len; i++) {
                    this._updateBoneMatrix(children[i]);
                }
            };
            SkeletonViewer.prototype.dispose = function () {
                if (this._debugMesh) {
                    this.isEnabled = false;
                    this._debugMesh.dispose();
                    this._debugMesh = null;
                }
            };
            return SkeletonViewer;
        }());
        Debug.SkeletonViewer = SkeletonViewer;
    })(Debug = BABYLON.Debug || (BABYLON.Debug = {}));
})(BABYLON || (BABYLON = {}));
