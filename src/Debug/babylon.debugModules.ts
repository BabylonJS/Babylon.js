module BABYLON {
    export class Debug {
        public static AxesViewer = class AxesViewer {
            _xline = [Vector3.Zero(), Vector3.Zero()];
            _yline = [Vector3.Zero(), Vector3.Zero()];
            _zline = [Vector3.Zero(), Vector3.Zero()];

            _xmesh: Nullable<LinesMesh>;
            _ymesh: Nullable<LinesMesh>;
            _zmesh: Nullable<LinesMesh>;

            public scene: Nullable<Scene>;
            public scaleLines = 1;

            constructor(scene: Scene, scaleLines = 1) {

                this.scaleLines = scaleLines;

                this._xmesh = Mesh.CreateLines("xline", this._xline, scene, true);
                this._ymesh = Mesh.CreateLines("yline", this._yline, scene, true);
                this._zmesh = Mesh.CreateLines("zline", this._zline, scene, true);

                this._xmesh.renderingGroupId = 2;
                this._ymesh.renderingGroupId = 2;
                this._zmesh.renderingGroupId = 2;

                this._xmesh.material.checkReadyOnlyOnce = true;
                this._xmesh.color = new Color3(1, 0, 0);
                this._ymesh.material.checkReadyOnlyOnce = true;
                this._ymesh.color = new Color3(0, 1, 0);
                this._zmesh.material.checkReadyOnlyOnce = true;
                this._zmesh.color = new Color3(0, 0, 1);

                this.scene = scene;

            }

            public update(position: Vector3, xaxis: Vector3, yaxis: Vector3, zaxis: Vector3): void {

                var scaleLines = this.scaleLines;

                if (this._xmesh) {
                    this._xmesh.position.copyFrom(position);
                }
                if (this._ymesh) {
                    this._ymesh.position.copyFrom(position);
                }
                if (this._zmesh) {
                    this._zmesh.position.copyFrom(position);
                }

                var point2 = this._xline[1];
                point2.x = xaxis.x * scaleLines;
                point2.y = xaxis.y * scaleLines;
                point2.z = xaxis.z * scaleLines;
                Mesh.CreateLines("", this._xline, null, false, this._xmesh);

                point2 = this._yline[1];
                point2.x = yaxis.x * scaleLines;
                point2.y = yaxis.y * scaleLines;
                point2.z = yaxis.z * scaleLines;
                Mesh.CreateLines("", this._yline, null, false, this._ymesh);

                point2 = this._zline[1];
                point2.x = zaxis.x * scaleLines;
                point2.y = zaxis.y * scaleLines;
                point2.z = zaxis.z * scaleLines;
                Mesh.CreateLines("", this._zline, null, false, this._zmesh);

            }

            public dispose() {

                if (this._xmesh) {
                    this._xmesh.dispose();
                }

                if (this._ymesh) {
                    this._ymesh.dispose();
                }

                if (this._zmesh) {
                    this._zmesh.dispose();
                }

                this._xmesh = null;
                this._ymesh = null;
                this._zmesh = null;

                this.scene = null;
            }
        }

        public static BoneAxesViewer = class BoneAxesViewer extends Debug.AxesViewer {

            public mesh: Nullable<Mesh>;
            public bone: Nullable<Bone>;

            public pos = Vector3.Zero();
            public xaxis = Vector3.Zero();
            public yaxis = Vector3.Zero();
            public zaxis = Vector3.Zero();

            constructor(scene: Scene, bone: Bone, mesh: Mesh, scaleLines = 1) {

                super(scene, scaleLines);

                this.mesh = mesh;
                this.bone = bone;

            }

            public update(): void {

                if (!this.mesh || !this.bone) {
                    return;
                }

                var bone = this.bone;
                bone.getAbsolutePositionToRef(this.mesh, this.pos);
                bone.getDirectionToRef(Axis.X, this.mesh, this.xaxis);
                bone.getDirectionToRef(Axis.Y, this.mesh, this.yaxis);
                bone.getDirectionToRef(Axis.Z, this.mesh, this.zaxis);

                super.update(this.pos, this.xaxis, this.yaxis, this.zaxis);

            }

            public dispose() {

                if (this.mesh) {
                    this.mesh = null;
                    this.bone = null;

                    super.dispose();

                }
            }

        }

        public static PhysicsViewer = class PhysicsViewer {

            _impostors: Array<Nullable<PhysicsImpostor>> = [];
            _meshes: Array<Nullable<AbstractMesh>> = [];
            _scene: Nullable<Scene>;
            _numMeshes = 0;
            _physicsEnginePlugin: Nullable<IPhysicsEnginePlugin>;
            _renderFunction: () => void;

            _debugBoxMesh: Mesh;
            _debugSphereMesh: Mesh;
            _debugMaterial: StandardMaterial;

            constructor(scene: Scene) {
                this._scene = scene || Engine.LastCreatedScene;
                let physicEngine = this._scene.getPhysicsEngine();

                if (physicEngine) {
                    this._physicsEnginePlugin = physicEngine.getPhysicsPlugin();
                }
            }

            _updateDebugMeshes(): void {

                var plugin = this._physicsEnginePlugin;

                for (var i = 0; i < this._numMeshes; i++) {
                    let impostor = this._impostors[i];

                    if (!impostor) {
                        continue;
                    }

                    if (impostor.isDisposed) {
                        this.hideImpostor(this._impostors[i--]);
                    } else {
                        let mesh = this._meshes[i];

                        if (mesh && plugin) {
                            plugin.syncMeshWithImpostor(mesh, impostor);
                        }
                    }
                }

            }

            public showImpostor(impostor: PhysicsImpostor): void {

                if (!this._scene) {
                    return;
                }

                for (var i = 0; i < this._numMeshes; i++) {
                    if (this._impostors[i] == impostor) {
                        return;
                    }
                }

                var debugMesh = this._getDebugMesh(impostor, this._scene);

                if (debugMesh) {
                    this._impostors[this._numMeshes] = impostor;
                    this._meshes[this._numMeshes] = debugMesh;

                    if (this._numMeshes === 0) {
                        this._renderFunction = this._updateDebugMeshes.bind(this);
                        this._scene.registerBeforeRender(this._renderFunction);
                    }

                    this._numMeshes++;
                }

            }

            public hideImpostor(impostor: Nullable<PhysicsImpostor>) {

                if (!impostor || !this._scene) {
                    return;
                }

                var removed = false;

                for (var i = 0; i < this._numMeshes; i++) {
                    if (this._impostors[i] == impostor) {
                        let mesh = this._meshes[i];

                        if (!mesh) {
                            continue;
                        }

                        this._scene.removeMesh(mesh);
                        mesh.dispose();
                        this._numMeshes--;
                        if (this._numMeshes > 0) {
                            this._meshes[i] = this._meshes[this._numMeshes];
                            this._impostors[i] = this._impostors[this._numMeshes];
                            this._meshes[this._numMeshes] = null;
                            this._impostors[this._numMeshes] = null;
                        } else {
                            this._meshes[0] = null;
                            this._impostors[0] = null;
                        }
                        removed = true;
                        break;
                    }
                }

                if (removed && this._numMeshes === 0) {
                    this._scene.unregisterBeforeRender(this._renderFunction);
                }

            }

            _getDebugMaterial(scene: Scene): Material {
                if (!this._debugMaterial) {
                    this._debugMaterial = new StandardMaterial('', scene);
                    this._debugMaterial.wireframe = true;
                }

                return this._debugMaterial;
            }

            _getDebugBoxMesh(scene: Scene): AbstractMesh {
                if (!this._debugBoxMesh) {
                    this._debugBoxMesh = MeshBuilder.CreateBox('physicsBodyBoxViewMesh', { size: 1 }, scene);
                    this._debugBoxMesh.renderingGroupId = 1;
                    this._debugBoxMesh.rotationQuaternion = Quaternion.Identity();
                    this._debugBoxMesh.material = this._getDebugMaterial(scene);
                    scene.removeMesh(this._debugBoxMesh);
                }

                return this._debugBoxMesh.createInstance('physicsBodyBoxViewInstance');
            }

            _getDebugSphereMesh(scene: Scene): AbstractMesh {
                if (!this._debugSphereMesh) {
                    this._debugSphereMesh = MeshBuilder.CreateSphere('physicsBodySphereViewMesh', { diameter: 1 }, scene);
                    this._debugSphereMesh.renderingGroupId = 1;
                    this._debugSphereMesh.rotationQuaternion = Quaternion.Identity();
                    this._debugSphereMesh.material = this._getDebugMaterial(scene);
                    scene.removeMesh(this._debugSphereMesh);
                }

                return this._debugSphereMesh.createInstance('physicsBodyBoxViewInstance');
            }

            _getDebugMesh(impostor: PhysicsImpostor, scene: Scene): Nullable<AbstractMesh> {
                var mesh: Nullable<AbstractMesh> = null;

                if (impostor.type == PhysicsImpostor.BoxImpostor) {
                    mesh = this._getDebugBoxMesh(scene);
                    impostor.getBoxSizeToRef(mesh.scaling);
                } else if (impostor.type == PhysicsImpostor.SphereImpostor) {
                    mesh = this._getDebugSphereMesh(scene);
                    var radius = impostor.getRadius();
                    mesh.scaling.x = radius * 2;
                    mesh.scaling.y = radius * 2;
                    mesh.scaling.z = radius * 2;
                }

                return mesh;
            }

            public dispose() {

                for (var i = 0; i < this._numMeshes; i++) {
                    this.hideImpostor(this._impostors[i]);
                }

                if (this._debugBoxMesh) {
                    this._debugBoxMesh.dispose();
                }
                if (this._debugSphereMesh) {
                    this._debugSphereMesh.dispose();
                }
                if (this._debugMaterial) {
                    this._debugMaterial.dispose();
                }

                this._impostors.length = 0;
                this._scene = null;
                this._physicsEnginePlugin = null;

            }

        }

        public static SkeletonViewer = class SkeletonViewer {
            public color: Color3 = Color3.White();

            _scene: Scene;
            _debugLines = new Array<Array<Vector3>>();
            _debugMesh: Nullable<LinesMesh>;
            _isEnabled = false;
            _renderFunction: () => void;

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

            _getBonePosition(position: Vector3, bone: Bone, meshMat: Matrix, x = 0, y = 0, z = 0): void {
                var tmat = Tmp.Matrix[0];
                var parentBone = bone.getParent();
                tmat.copyFrom(bone.getLocalMatrix());

                if (x !== 0 || y !== 0 || z !== 0) {
                    var tmat2 = Tmp.Matrix[1];
                    Matrix.IdentityToRef(tmat2);
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

            _getLinesForBonesWithLength(bones: Bone[], meshMat: Matrix): void {
                var len = bones.length;
                var meshPos = this.mesh.position;
                for (var i = 0; i < len; i++) {
                    var bone = bones[i];
                    var points = this._debugLines[i];
                    if (!points) {
                        points = [Vector3.Zero(), Vector3.Zero()];
                        this._debugLines[i] = points;
                    }
                    this._getBonePosition(points[0], bone, meshMat);
                    this._getBonePosition(points[1], bone, meshMat, 0, bone.length, 0);
                    points[0].subtractInPlace(meshPos);
                    points[1].subtractInPlace(meshPos);
                }
            }

            _getLinesForBonesNoLength(bones: Bone[], meshMat: Matrix): void {
                var len = bones.length;
                var boneNum = 0;
                var meshPos = this.mesh.position;
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
                    points[0].subtractInPlace(meshPos);
                    points[1].subtractInPlace(meshPos);
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
                    this._debugMesh = MeshBuilder.CreateLineSystem("", { lines: this._debugLines, updatable: true, instance: null }, this._scene);
                    this._debugMesh.renderingGroupId = this.renderingGroupId;
                } else {
                    MeshBuilder.CreateLineSystem("", { lines: this._debugLines, updatable: true, instance: this._debugMesh }, this._scene);
                }
                this._debugMesh.position.copyFrom(this.mesh.position);
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


}