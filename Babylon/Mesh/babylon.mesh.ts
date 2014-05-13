module BABYLON {
    export class Mesh extends Node implements IGetSetVerticesData {
        // Statics
        private static _BILLBOARDMODE_NONE = 0;
        private static _BILLBOARDMODE_X = 1;
        private static _BILLBOARDMODE_Y = 2;
        private static _BILLBOARDMODE_Z = 4;
        private static _BILLBOARDMODE_ALL = 7;

        public static get BILLBOARDMODE_NONE(): number {
            return Mesh._BILLBOARDMODE_NONE;
        }

        public static get BILLBOARDMODE_X(): number {
            return Mesh._BILLBOARDMODE_X;
        }

        public static get BILLBOARDMODE_Y(): number {
            return Mesh._BILLBOARDMODE_Y;
        }

        public static get BILLBOARDMODE_Z(): number {
            return Mesh._BILLBOARDMODE_Z;
        }

        public static get BILLBOARDMODE_ALL(): number {
            return Mesh._BILLBOARDMODE_ALL;
        }

        // Members
        public position = new BABYLON.Vector3(0, 0, 0);
        public rotation = new BABYLON.Vector3(0, 0, 0);
        public rotationQuaternion = null;
        public scaling = new BABYLON.Vector3(1, 1, 1);
        public delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NONE;
        public material = null;
        public isVisible = true;
        public isPickable = true;
        public visibility = 1.0;
        public billboardMode = BABYLON.Mesh.BILLBOARDMODE_NONE;
        public checkCollisions = false;
        public receiveShadows = false;
        public _isDisposed = false;
        public onDispose = null;
        public skeleton = null;
        public renderingGroupId = 0;
        public infiniteDistance = false;
        public showBoundingBox = false;
        public subMeshes: SubMesh[];
        public delayLoadingFile: string;
        public actionManager: ActionManager;

        // Cache
        private _positions = null;
        private _localScaling = BABYLON.Matrix.Zero();
        private _localRotation = BABYLON.Matrix.Zero();
        private _localTranslation = BABYLON.Matrix.Zero();
        private _localBillboard = BABYLON.Matrix.Zero();
        private _localPivotScaling = BABYLON.Matrix.Zero();
        private _localPivotScalingRotation = BABYLON.Matrix.Zero();
        private _localWorld = BABYLON.Matrix.Zero();
        private _worldMatrix = BABYLON.Matrix.Zero();
        private _rotateYByPI = BABYLON.Matrix.RotationY(Math.PI);
        private _collisionsTransformMatrix = BABYLON.Matrix.Zero();
        private _collisionsScalingMatrix = BABYLON.Matrix.Zero();
        private _absolutePosition = BABYLON.Vector3.Zero();
        private _isDirty = false;

        // Physics
        public _physicImpostor = PhysicsEngine.NoImpostor;
        public _physicsMass: number;
        public _physicsFriction: number;
        public _physicRestitution: number;

        // Private
        public _geometry: Geometry;
        public _boundingInfo: BoundingInfo;
        private _pivotMatrix = BABYLON.Matrix.Identity();
        private _renderId = 0;
        private _onBeforeRenderCallbacks = [];
        private _delayInfo; //ANY
        private _animationStarted = false;
        private _delayLoadingFunction: (any, Mesh) => void;

        constructor(name: string, scene: Scene) {
            super(name, scene);

            scene.meshes.push(this);
        }

        public getBoundingInfo(): BoundingInfo {
            return this._boundingInfo;
        }

        public getWorldMatrix(): Matrix {
            if (this._currentRenderId !== this.getScene().getRenderId()) {
                this.computeWorldMatrix();
            }
            return this._worldMatrix;
        }

        public rotate(axis: Vector3, amount: number, space: Space): void {
            if (!this.rotationQuaternion) {
                this.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
                this.rotation = BABYLON.Vector3.Zero();
            }

            if (!space || space == BABYLON.Space.LOCAL) {
                var rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, amount);
                this.rotationQuaternion = this.rotationQuaternion.multiply(rotationQuaternion);
            }
            else {
                if (this.parent) {
                    var invertParentWorldMatrix = this.parent.getWorldMatrix().clone();
                    invertParentWorldMatrix.invert();

                    axis = BABYLON.Vector3.TransformNormal(axis, invertParentWorldMatrix);
                }
                rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, amount);
                this.rotationQuaternion = rotationQuaternion.multiply(this.rotationQuaternion);
            }
        }

        public translate(axis: Vector3, distance: number, space: Space): void {
            var displacementVector = axis.scale(distance);

            if (!space || space == BABYLON.Space.LOCAL) {
                var tempV3 = this.getPositionExpressedInLocalSpace().add(displacementVector);
                this.setPositionWithLocalVector(tempV3);
            }
            else {
                this.setAbsolutePosition(this.getAbsolutePosition().add(displacementVector));
            }
        }

        public getAbsolutePosition(): Vector3 {
            this.computeWorldMatrix();
            return this._absolutePosition;
        }

        public setAbsolutePosition(absolutePosition: Vector3): void {
            if (!absolutePosition) {
                return;
            }

            var absolutePositionX;
            var absolutePositionY;
            var absolutePositionZ;

            if (absolutePosition.x === undefined) {
                if (arguments.length < 3) {
                    return;
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

                var worldPosition = new BABYLON.Vector3(absolutePositionX, absolutePositionY, absolutePositionZ);

                this.position = BABYLON.Vector3.TransformCoordinates(worldPosition, invertParentWorldMatrix);
            } else {
                this.position.x = absolutePositionX;
                this.position.y = absolutePositionY;
                this.position.z = absolutePositionZ;
            }
        }

        public getTotalVertices(): number {
            if (!this._geometry) {
                return 0;
            }
            return this._geometry.getTotalVertices();
        }

        public getVerticesData(kind): number[] {
            if (!this._geometry) {
                return null;
            }
            return this._geometry.getVerticesData(kind);
        }

        public getVertexBuffer(kind): VertexBuffer {
            if (!this._geometry) {
                return undefined;
            }
            return this._geometry.getVertexBuffer(kind);
        }

        public isVerticesDataPresent(kind: string): boolean {
            if (!this._geometry) {
                if (this._delayInfo) {
                    return this._delayInfo.indexOf(kind) !== -1;
                }
                return false;
            }
            return this._geometry.isVerticesDataPresent(kind);
        }

        public getVerticesDataKinds(): string[] {
            if (!this._geometry) {
                var result = [];
                if (this._delayInfo) {
                    for (var kind in this._delayInfo) {
                        result.push(kind);
                    }
                }
                return result;
            }
            return this._geometry.getVerticesDataKinds();
        }

        public getTotalIndices(): number {
            if (!this._geometry) {
                return 0;
            }
            return this._geometry.getTotalIndices();
        }

        public getIndices(): number[] {
            if (!this._geometry) {
                return [];
            }
            return this._geometry.getIndices();
        }

        public setPivotMatrix(matrix: Matrix): void {
            this._pivotMatrix = matrix;
            this._cache.pivotMatrixUpdated = true;
        }

        public getPivotMatrix(): Matrix {
            return this._pivotMatrix;
        }

        public _isSynchronized(): boolean {
            if (this._isDirty) {
                return false;
            }

            if (this.billboardMode !== Mesh.BILLBOARDMODE_NONE)
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
            } else {
                if (!this._cache.rotation.equals(this.rotation))
                    return false;
            }

            if (!this._cache.scaling.equals(this.scaling))
                return false;

            return true;
        }

        public isReady(): boolean {
            return this._isReady;
        }

        public isAnimated(): boolean {
            return this._animationStarted;
        }

        public isDisposed(): boolean {
            return this._isDisposed;
        }

        // Methods
        public _initCache() {
            super._initCache();

            this._cache.localMatrixUpdated = false;
            this._cache.position = BABYLON.Vector3.Zero();
            this._cache.scaling = BABYLON.Vector3.Zero();
            this._cache.rotation = BABYLON.Vector3.Zero();
            this._cache.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 0);
        }

        public markAsDirty(property: string): void {
            if (property === "rotation") {
                this.rotationQuaternion = null;
            }
            this._currentRenderId = Number.MAX_VALUE;
            this._isDirty = true;
        }

        public refreshBoundingInfo(): void {
            var data = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);

            if (data) {
                var extend = BABYLON.Tools.ExtractMinAndMax(data, 0, this.getTotalVertices());
                this._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);
            }

            if (this.subMeshes) {
                for (var index = 0; index < this.subMeshes.length; index++) {
                    this.subMeshes[index].refreshBoundingInfo();
                }
            }

            this._updateBoundingInfo();
        }

        public _updateBoundingInfo(): void {
            this._boundingInfo = this._boundingInfo || new BABYLON.BoundingInfo(this._absolutePosition, this._absolutePosition);

            this._boundingInfo._update(this._worldMatrix);

            if (!this.subMeshes) {
                return;
            }

            for (var subIndex = 0; subIndex < this.subMeshes.length; subIndex++) {
                var subMesh = this.subMeshes[subIndex];

                subMesh.updateBoundingInfo(this._worldMatrix);
            }
        }

        public computeWorldMatrix(force?: boolean): Matrix {
            if (!force && (this._currentRenderId == this.getScene().getRenderId() || this.isSynchronized(true))) {
                return this._worldMatrix;
            }

            this._cache.position.copyFrom(this.position);
            this._cache.scaling.copyFrom(this.scaling);
            this._cache.pivotMatrixUpdated = false;
            this._currentRenderId = this.getScene().getRenderId();
            this._isDirty = false;

            // Scaling
            BABYLON.Matrix.ScalingToRef(this.scaling.x, this.scaling.y, this.scaling.z, this._localScaling);

            // Rotation
            if (this.rotationQuaternion) {
                this.rotationQuaternion.toRotationMatrix(this._localRotation);
                this._cache.rotationQuaternion.copyFrom(this.rotationQuaternion);
            } else {
                BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._localRotation);
                this._cache.rotation.copyFrom(this.rotation);
            }

            // Translation
            if (this.infiniteDistance && !this.parent) {
                var camera = this.getScene().activeCamera;
                var cameraWorldMatrix = camera.getWorldMatrix();

                var cameraGlobalPosition = new BABYLON.Vector3(cameraWorldMatrix.m[12], cameraWorldMatrix.m[13], cameraWorldMatrix.m[14]);

                BABYLON.Matrix.TranslationToRef(this.position.x + cameraGlobalPosition.x, this.position.y + cameraGlobalPosition.y, this.position.z + cameraGlobalPosition.z, this._localTranslation);
            } else {
                BABYLON.Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._localTranslation);
            }

            // Composing transformations
            this._pivotMatrix.multiplyToRef(this._localScaling, this._localPivotScaling);
            this._localPivotScaling.multiplyToRef(this._localRotation, this._localPivotScalingRotation);

            // Billboarding
            if (this.billboardMode !== Mesh.BILLBOARDMODE_NONE) {
                var localPosition = this.position.clone();
                var zero = this.getScene().activeCamera.position.clone();

                if (this.parent && (<any>this.parent).position) {
                    localPosition.addInPlace((<any>this.parent).position);
                    BABYLON.Matrix.TranslationToRef(localPosition.x, localPosition.y, localPosition.z, this._localTranslation);
                }

                if ((this.billboardMode & Mesh.BILLBOARDMODE_ALL) === Mesh.BILLBOARDMODE_ALL) {
                    zero = this.getScene().activeCamera.position;
                } else {
                    if (this.billboardMode & BABYLON.Mesh.BILLBOARDMODE_X)
                        zero.x = localPosition.x + BABYLON.Engine.Epsilon;
                    if (this.billboardMode & BABYLON.Mesh.BILLBOARDMODE_Y)
                        zero.y = localPosition.y + 0.001;
                    if (this.billboardMode & BABYLON.Mesh.BILLBOARDMODE_Z)
                        zero.z = localPosition.z + 0.001;
                }

                BABYLON.Matrix.LookAtLHToRef(localPosition, zero, BABYLON.Vector3.Up(), this._localBillboard);
                this._localBillboard.m[12] = this._localBillboard.m[13] = this._localBillboard.m[14] = 0;

                this._localBillboard.invert();

                this._localPivotScalingRotation.multiplyToRef(this._localBillboard, this._localWorld);
                this._rotateYByPI.multiplyToRef(this._localWorld, this._localPivotScalingRotation);
            }

            // Local world
            this._localPivotScalingRotation.multiplyToRef(this._localTranslation, this._localWorld);

            // Parent
            if (this.parent && this.parent.getWorldMatrix && this.billboardMode === BABYLON.Mesh.BILLBOARDMODE_NONE) {
                this._localWorld.multiplyToRef(this.parent.getWorldMatrix(), this._worldMatrix);
            } else {
                this._worldMatrix.copyFrom(this._localWorld);
            }

            // Bounding info
            this._updateBoundingInfo();

            // Absolute position
            this._absolutePosition.copyFromFloats(this._worldMatrix.m[12], this._worldMatrix.m[13], this._worldMatrix.m[14]);

            return this._worldMatrix;
        }


        public _createGlobalSubMesh(): SubMesh {
            var totalVertices = this.getTotalVertices();
            if (!totalVertices || !this.getIndices()) {
                return null;
            }

            this.subMeshes = [];
            return new BABYLON.SubMesh(0, 0, totalVertices, 0, this.getTotalIndices(), this);
        }

        public subdivide(count: number): void {
            if (count < 1) {
                return;
            }

            var totalIndices = this.getTotalIndices();
            var subdivisionSize = totalIndices / count;
            var offset = 0;

            this.subMeshes = [];
            for (var index = 0; index < count; index++) {
                BABYLON.SubMesh.CreateFromIndices(0, offset, Math.min(subdivisionSize, totalIndices - offset), this);

                offset += subdivisionSize;
            }
        }

        public setVerticesData(data: number[], kind: string, updatable?: boolean): void {
            if (!this._geometry) {
                var vertexData = new BABYLON.VertexData();
                vertexData.set(data, kind);

                var scene = this.getScene();

                new BABYLON.Geometry(Geometry.RandomId(), scene.getEngine(), vertexData, updatable, this);
            }
            else {
                this._geometry.setVerticesData(data, kind, updatable);
            }
        }

        public updateVerticesData(kind: string, data: number[], updateExtends?: boolean, makeItUnique?: boolean): void {
            if (!this._geometry) {
                return;
            }
            if (!makeItUnique) {
                this._geometry.updateVerticesData(kind, data, updateExtends);
            }
            else {
                this.makeGeometryUnique();
                this.updateVerticesData(kind, data, updateExtends, false);
            }
        }

        public makeGeometryUnique() {
            if (!this._geometry) {
                return;
            }
            var geometry = this._geometry.copy(Geometry.RandomId());
            geometry.applyToMesh(this);
        }

        public setIndices(indices: number[]): void {
            if (!this._geometry) {
                var vertexData = new BABYLON.VertexData();
                vertexData.indices = indices;

                var scene = this.getScene();

                new BABYLON.Geometry(BABYLON.Geometry.RandomId(), scene.getEngine(), vertexData, false, this);
            }
            else {
                this._geometry.setIndices(indices);
            }
        }

        // ANY
        public bindAndDraw(subMesh: SubMesh, effect, wireframe?: boolean): void {
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }

            var engine = this.getScene().getEngine();

            // Wireframe
            var indexToBind = this._geometry.getIndexBuffer();
            var useTriangles = true;

            if (wireframe) {
                indexToBind = subMesh.getLinesIndexBuffer(this.getIndices(), engine);
                useTriangles = false;
            }

            // VBOs
            engine.bindMultiBuffers(this._geometry.getVertexBuffers(), indexToBind, effect);

            // Draw order
            engine.draw(useTriangles, useTriangles ? subMesh.indexStart : 0, useTriangles ? subMesh.indexCount : subMesh.linesIndexCount);
        }

        public registerBeforeRender(func: () => void): void {
            this._onBeforeRenderCallbacks.push(func);
        }

        public unregisterBeforeRender(func: () => void): void {
            var index = this._onBeforeRenderCallbacks.indexOf(func);

            if (index > -1) {
                this._onBeforeRenderCallbacks.splice(index, 1);
            }
        }

        public render(subMesh: SubMesh): void {
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }

            for (var callbackIndex = 0; callbackIndex < this._onBeforeRenderCallbacks.length; callbackIndex++) {
                this._onBeforeRenderCallbacks[callbackIndex]();
            }

            // World
            var world = this.getWorldMatrix();

            // Material
            var effectiveMaterial = subMesh.getMaterial();

            if (!effectiveMaterial || !effectiveMaterial.isReady(this)) {
                return;
            }

            effectiveMaterial._preBind();
            effectiveMaterial.bind(world, this);

            // Bind and draw
            var engine = this.getScene().getEngine();
            this.bindAndDraw(subMesh, effectiveMaterial.getEffect(), engine.forceWireframe || effectiveMaterial.wireframe);

            // Unbind
            effectiveMaterial.unbind();
        }

        public getEmittedParticleSystems(): ParticleSystem[] {
            var results = new Array<ParticleSystem>();
            for (var index = 0; index < this.getScene().particleSystems.length; index++) {
                var particleSystem = this.getScene().particleSystems[index];
                if (particleSystem.emitter === this) {
                    results.push(particleSystem);
                }
            }

            return results;
        }

        public getHierarchyEmittedParticleSystems(): ParticleSystem[] {
            var results = new Array<ParticleSystem>();
            var descendants = this.getDescendants();
            descendants.push(this);

            for (var index = 0; index < this.getScene().particleSystems.length; index++) {
                var particleSystem = this.getScene().particleSystems[index];
                if (descendants.indexOf(particleSystem.emitter) !== -1) {
                    results.push(particleSystem);
                }
            }

            return results;
        }

        public getChildren(): Node[] {
            var results = [];
            for (var index = 0; index < this.getScene().meshes.length; index++) {
                var mesh = this.getScene().meshes[index];
                if (mesh.parent == this) {
                    results.push(mesh);
                }
            }

            return results;
        }

        public isInFrustum(frustumPlanes: Plane[]): boolean {
            if (this.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADING) {
                return false;
            }

            if (!this._boundingInfo.isInFrustum(frustumPlanes)) {
                return false;
            }

            var that = this;
            var scene = this.getScene();

            if (this._geometry) {
                this._geometry.load(scene);
            }
            else if (that.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
                that.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADING;

                scene._addPendingData(that);

                BABYLON.Tools.LoadFile(this.delayLoadingFile, function (data) {
                    that._delayLoadingFunction(JSON.parse(data), that);
                    that.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_LOADED;
                    scene._removePendingData(that);
                }, function () { }, scene.database);
            }

            return true;
        }

        public setMaterialByID(id: string): void {
            var materials = this.getScene().materials;
            for (var index = 0; index < materials.length; index++) {
                if (materials[index].id == id) {
                    this.material = materials[index];
                    return;
                }
            }

            // Multi
            var multiMaterials = this.getScene().multiMaterials;
            for (index = 0; index < multiMaterials.length; index++) {
                if (multiMaterials[index].id == id) {
                    this.material = multiMaterials[index];
                    return;
                }
            }
        }

        public getAnimatables(): IAnimatable[] {
            var results = [];

            if (this.material) {
                results.push(this.material);
            }

            return results;
        }

        // Geometry
        public setPositionWithLocalVector(vector3: Vector3): void {
            this.computeWorldMatrix();

            this.position = BABYLON.Vector3.TransformNormal(vector3, this._localWorld);
        }

        public getPositionExpressedInLocalSpace(): Vector3 {
            this.computeWorldMatrix();
            var invLocalWorldMatrix = this._localWorld.clone();
            invLocalWorldMatrix.invert();

            return BABYLON.Vector3.TransformNormal(this.position, invLocalWorldMatrix);
        }

        public locallyTranslate(vector3: Vector3): void {
            this.computeWorldMatrix();

            this.position = BABYLON.Vector3.TransformCoordinates(vector3, this._localWorld);
        }

        public bakeTransformIntoVertices(transform: Matrix): void {
            // Position
            if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
                return;
            }

            this._resetPointsArrayCache();

            var data = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var temp = [];
            for (var index = 0; index < data.length; index += 3) {
                BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.FromArray(data, index), transform).toArray(temp, index);
            }

            this.setVerticesData(temp, BABYLON.VertexBuffer.PositionKind, this.getVertexBuffer(BABYLON.VertexBuffer.PositionKind).isUpdatable());

            // Normals
            if (!this.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
                return;
            }

            data = this.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            for (index = 0; index < data.length; index += 3) {
                BABYLON.Vector3.TransformNormal(BABYLON.Vector3.FromArray(data, index), transform).toArray(temp, index);
            }

            this.setVerticesData(temp, BABYLON.VertexBuffer.NormalKind, this.getVertexBuffer(BABYLON.VertexBuffer.NormalKind).isUpdatable());
        }

        public lookAt(targetPoint: Vector3, yawCor: number, pitchCor: number, rollCor: number): void {
            /// <summary>Orients a mesh towards a target point. Mesh must be drawn facing user.</summary>
            /// <param name="targetPoint" type="BABYLON.Vector3">The position (must be in same space as current mesh) to look at</param>
            /// <param name="yawCor" type="Number">optional yaw (y-axis) correction in radians</param>
            /// <param name="pitchCor" type="Number">optional pitch (x-axis) correction in radians</param>
            /// <param name="rollCor" type="Number">optional roll (z-axis) correction in radians</param>
            /// <returns>Mesh oriented towards targetMesh</returns>

            yawCor = yawCor || 0; // default to zero if undefined 
            pitchCor = pitchCor || 0;
            rollCor = rollCor || 0;

            var dv = targetPoint.subtract(this.position);
            var yaw = -Math.atan2(dv.z, dv.x) - Math.PI / 2;
            var len = Math.sqrt(dv.x * dv.x + dv.z * dv.z);
            var pitch = Math.atan2(dv.y, len);
            this.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(yaw + yawCor, pitch + pitchCor, rollCor);
        }

        // Cache
        public _resetPointsArrayCache(): void {
            this._positions = null;
        }

        public _generatePointsArray(): void {
            if (this._positions)
                return;

            this._positions = [];

            var data = this.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            for (var index = 0; index < data.length; index += 3) {
                this._positions.push(BABYLON.Vector3.FromArray(data, index));
            }
        }

        // Collisions
        public _collideForSubMesh(subMesh: SubMesh, transformMatrix: Matrix, collider: Collider): void {
            this._generatePointsArray();
            // Transformation
            if (!subMesh._lastColliderWorldVertices || !subMesh._lastColliderTransformMatrix.equals(transformMatrix)) {
                subMesh._lastColliderTransformMatrix = transformMatrix.clone();
                subMesh._lastColliderWorldVertices = [];
                subMesh._trianglePlanes = [];
                var start = subMesh.verticesStart;
                var end = (subMesh.verticesStart + subMesh.verticesCount);
                for (var i = start; i < end; i++) {
                    subMesh._lastColliderWorldVertices.push(BABYLON.Vector3.TransformCoordinates(this._positions[i], transformMatrix));
                }
            }
            // Collide
            collider._collide(subMesh, subMesh._lastColliderWorldVertices, this.getIndices(), subMesh.indexStart, subMesh.indexStart + subMesh.indexCount, subMesh.verticesStart);
        }

        public _processCollisionsForSubModels(collider: Collider, transformMatrix: Matrix): void {
            for (var index = 0; index < this.subMeshes.length; index++) {
                var subMesh = this.subMeshes[index];

                // Bounding test
                if (this.subMeshes.length > 1 && !subMesh._checkCollision(collider))
                    continue;

                this._collideForSubMesh(subMesh, transformMatrix, collider);
            }
        }

        public _checkCollision(collider: Collider): void {
            // Bounding box test
            if (!this._boundingInfo._checkCollision(collider))
                return;

            // Transformation matrix
            BABYLON.Matrix.ScalingToRef(1.0 / collider.radius.x, 1.0 / collider.radius.y, 1.0 / collider.radius.z, this._collisionsScalingMatrix);
            this._worldMatrix.multiplyToRef(this._collisionsScalingMatrix, this._collisionsTransformMatrix);

            this._processCollisionsForSubModels(collider, this._collisionsTransformMatrix);
        }

        public intersectsMesh(mesh: Mesh, precise?: boolean): boolean {
            if (!this._boundingInfo || !mesh._boundingInfo) {
                return false;
            }

            return this._boundingInfo.intersects(mesh._boundingInfo, precise);
        }

        public intersectsPoint(point: Vector3): boolean {
            if (!this._boundingInfo) {
                return false;
            }

            return this._boundingInfo.intersectsPoint(point);
        }

        // Picking
        public intersects(ray: Ray, fastCheck?: boolean): PickingInfo {
            var pickingInfo = new BABYLON.PickingInfo();

            if (!this._boundingInfo || !ray.intersectsSphere(this._boundingInfo.boundingSphere) || !ray.intersectsBox(this._boundingInfo.boundingBox)) {
                return pickingInfo;
            }

            this._generatePointsArray();

            var intersectInfo: IntersectionInfo = null;

            for (var index = 0; index < this.subMeshes.length; index++) {
                var subMesh = this.subMeshes[index];

                // Bounding test
                if (this.subMeshes.length > 1 && !subMesh.canIntersects(ray))
                    continue;

                var currentIntersectInfo = subMesh.intersects(ray, this._positions, this.getIndices(), fastCheck);

                if (currentIntersectInfo) {
                    if (fastCheck || !intersectInfo || currentIntersectInfo.distance < intersectInfo.distance) {
                        intersectInfo = currentIntersectInfo;

                        if (fastCheck) {
                            break;
                        }
                    }
                }
            }

            if (intersectInfo) {
                // Get picked point
                var world = this.getWorldMatrix();
                var worldOrigin = BABYLON.Vector3.TransformCoordinates(ray.origin, world);
                var direction = ray.direction.clone();
                direction.normalize();
                direction = direction.scale(intersectInfo.distance);
                var worldDirection = BABYLON.Vector3.TransformNormal(direction, world);

                var pickedPoint = worldOrigin.add(worldDirection);

                // Return result
                pickingInfo.hit = true;
                pickingInfo.distance = BABYLON.Vector3.Distance(worldOrigin, pickedPoint);
                pickingInfo.pickedPoint = pickedPoint;
                pickingInfo.pickedMesh = this;
                pickingInfo.bu = intersectInfo.bu;
                pickingInfo.bv = intersectInfo.bv;
                pickingInfo.faceId = intersectInfo.faceId;
                return pickingInfo;
            }

            return pickingInfo;
        }

        // Clone
        public clone(name: string, newParent: Node, doNotCloneChildren?: boolean): Mesh {
            var result = new BABYLON.Mesh(name, this.getScene());

            // Geometry
            this._geometry.applyToMesh(result);

            // Deep copy
            BABYLON.Tools.DeepCopy(this, result, ["name", "material", "skeleton"], []);

            // Bounding info
            var extend = BABYLON.Tools.ExtractMinAndMax(this.getVerticesData(BABYLON.VertexBuffer.PositionKind), 0, this.getTotalVertices());
            result._boundingInfo = new BABYLON.BoundingInfo(extend.minimum, extend.maximum);

            // Material
            result.material = this.material;

            // Parent
            if (newParent) {
                result.parent = newParent;
            }

            if (!doNotCloneChildren) {
                // Children
                for (var index = 0; index < this.getScene().meshes.length; index++) {
                    var mesh = this.getScene().meshes[index];

                    if (mesh.parent == this) {
                        mesh.clone(mesh.name, result);
                    }
                }
            }

            // Particles
            for (index = 0; index < this.getScene().particleSystems.length; index++) {
                var system = this.getScene().particleSystems[index];

                if (system.emitter == this) {
                    system.clone(system.name, result);
                }
            }

            result.computeWorldMatrix(true);

            return result;
        }

        // Dispose
        public dispose(doNotRecurse?: boolean): void {
            if (this._geometry) {
                this._geometry.releaseForMesh(this);
            }

            // Physics
            if (this.getPhysicsImpostor() != PhysicsEngine.NoImpostor) {
                this.setPhysicsState(PhysicsEngine.NoImpostor);
            }

            // Remove from scene
            var index = this.getScene().meshes.indexOf(this);
            this.getScene().meshes.splice(index, 1);

            if (!doNotRecurse) {
                // Particles
                for (index = 0; index < this.getScene().particleSystems.length; index++) {
                    if (this.getScene().particleSystems[index].emitter == this) {
                        this.getScene().particleSystems[index].dispose();
                        index--;
                    }
                }

                // Children
                var objects = this.getScene().meshes.slice(0);
                for (index = 0; index < objects.length; index++) {
                    if (objects[index].parent == this) {
                        objects[index].dispose();
                    }
                }
            } else {
                for (index = 0; index < this.getScene().meshes.length; index++) {
                    var obj = this.getScene().meshes[index];
                    if (obj.parent === this) {
                        obj.parent = null;
                        obj.computeWorldMatrix(true);
                    }
                }
            }

            this._isDisposed = true;

            // Callback
            if (this.onDispose) {
                this.onDispose();
            }
        }

        // Physics
        public setPhysicsState(impostor?: any, options?: PhysicsBodyCreationOptions): void {
            var physicsEngine = this.getScene().getPhysicsEngine();

            if (!physicsEngine) {
                return;
            }

            if (impostor.impostor) {
                // Old API
                options = impostor;
                impostor = impostor.impostor;
            }

            impostor = impostor || PhysicsEngine.NoImpostor;

            if (impostor === BABYLON.PhysicsEngine.NoImpostor) {
                physicsEngine._unregisterMesh(this);
                return;
            }

            options.mass = options.mass || 0;
            options.friction = options.friction || 0.2;
            options.restitution = options.restitution || 0.9;

            this._physicImpostor = impostor;
            this._physicsMass = options.mass;
            this._physicsFriction = options.friction;
            this._physicRestitution = options.restitution;


            physicsEngine._registerMesh(this, impostor, options);
        }

        public getPhysicsImpostor(): number {
            if (!this._physicImpostor) {
                return BABYLON.PhysicsEngine.NoImpostor;
            }

            return this._physicImpostor;
        }

        public getPhysicsMass(): number {
            if (!this._physicsMass) {
                return 0;
            }

            return this._physicsMass;
        }

        public getPhysicsFriction(): number {
            if (!this._physicsFriction) {
                return 0;
            }

            return this._physicsFriction;
        }

        public getPhysicsRestitution(): number {
            if (!this._physicRestitution) {
                return 0;
            }

            return this._physicRestitution;
        }

        public applyImpulse(force: Vector3, contactPoint: Vector3): void {
            if (!this._physicImpostor) {
                return;
            }

            this.getScene().getPhysicsEngine()._applyImpulse(this, force, contactPoint);
        }

        public setPhysicsLinkWith(otherMesh: Mesh, pivot1: Vector3, pivot2: Vector3): void {
            if (!this._physicImpostor) {
                return;
            }

            this.getScene().getPhysicsEngine()._createLink(this, otherMesh, pivot1, pivot2);
        }

        // Geometric tools
        public convertToFlatShadedMesh(): void {
            /// <summary>Update normals and vertices to get a flat shading rendering.</summary>
            /// <summary>Warning: This may imply adding vertices to the mesh in order to get exactly 3 vertices per face</summary>

            var kinds = this.getVerticesDataKinds();
            var vbs = [];
            var data = [];
            var newdata = [];
            var updatableNormals = false;
            for (var kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                var kind = kinds[kindIndex];
                var vertexBuffer = this.getVertexBuffer(kind);

                if (kind === BABYLON.VertexBuffer.NormalKind) {
                    updatableNormals = vertexBuffer.isUpdatable();
                    kinds.splice(kindIndex, 1);
                    kindIndex--;
                    continue;
                }

                vbs[kind] = vertexBuffer;
                data[kind] = vbs[kind].getData();
                newdata[kind] = [];
            }

            // Save previous submeshes
            var previousSubmeshes = this.subMeshes.slice(0);

            var indices = this.getIndices();
            var totalIndices = this.getTotalIndices();

            // Generating unique vertices per face
            for (index = 0; index < totalIndices; index++) {
                var vertexIndex = indices[index];

                for (kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                    kind = kinds[kindIndex];
                    var stride = vbs[kind].getStrideSize();

                    for (var offset = 0; offset < stride; offset++) {
                        newdata[kind].push(data[kind][vertexIndex * stride + offset]);
                    }
                }
            }

            // Updating faces & normal
            var normals = [];
            var positions = newdata[BABYLON.VertexBuffer.PositionKind];
            for (var index = 0; index < totalIndices; index += 3) {
                indices[index] = index;
                indices[index + 1] = index + 1;
                indices[index + 2] = index + 2;

                var p1 = BABYLON.Vector3.FromArray(positions, index * 3);
                var p2 = BABYLON.Vector3.FromArray(positions, (index + 1) * 3);
                var p3 = BABYLON.Vector3.FromArray(positions, (index + 2) * 3);

                var p1p2 = p1.subtract(p2);
                var p3p2 = p3.subtract(p2);

                var normal = BABYLON.Vector3.Normalize(BABYLON.Vector3.Cross(p1p2, p3p2));

                // Store same normals for every vertex
                for (var localIndex = 0; localIndex < 3; localIndex++) {
                    normals.push(normal.x);
                    normals.push(normal.y);
                    normals.push(normal.z);
                }
            }

            this.setIndices(indices);
            this.setVerticesData(normals, BABYLON.VertexBuffer.NormalKind, updatableNormals);

            // Updating vertex buffers
            for (kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                kind = kinds[kindIndex];
                this.setVerticesData(newdata[kind], kind, vbs[kind].isUpdatable());
            }

            // Updating submeshes
            this.subMeshes = [];
            for (var submeshIndex = 0; submeshIndex < previousSubmeshes.length; submeshIndex++) {
                var previousOne = previousSubmeshes[submeshIndex];
                var subMesh = new BABYLON.SubMesh(previousOne.materialIndex, previousOne.indexStart, previousOne.indexCount, previousOne.indexStart, previousOne.indexCount, this);
            }
        }

        // Statics
        public static CreateBox(name: string, size: number, scene: Scene, updatable?: boolean): Mesh {
            var box = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateBox(size);

            vertexData.applyToMesh(box, updatable);

            return box;
        }

        public static CreateSphere(name: string, segments: number, diameter: number, scene: Scene, updatable?: boolean): Mesh {
            var sphere = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateSphere(segments, diameter);

            vertexData.applyToMesh(sphere, updatable);

            return sphere;
        }

        // Cylinder and cone (Code inspired by SharpDX.org)
        public static CreateCylinder(name: string, height: number, diameterTop: number, diameterBottom: number, tessellation: number, scene: Scene, updatable?: boolean): Mesh {
            var cylinder = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateCylinder(height, diameterTop, diameterBottom, tessellation);

            vertexData.applyToMesh(cylinder, updatable);

            return cylinder;
        }

        // Torus  (Code from SharpDX.org)
        public static CreateTorus(name: string, diameter, thickness: number, tessellation: number, scene: Scene, updatable?: boolean): Mesh {
            var torus = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateTorus(diameter, thickness, tessellation);

            vertexData.applyToMesh(torus, updatable);

            return torus;
        }

        public static CreateTorusKnot(name: string, radius: number, tube: number, radialSegments: number, tubularSegments: number, p: number, q: number, scene: Scene, updatable?: boolean): Mesh {
            var torusKnot = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateTorusKnot(radius, tube, radialSegments, tubularSegments, p, q);

            vertexData.applyToMesh(torusKnot, updatable);

            return torusKnot;
        }

        // Plane & ground
        public static CreatePlane(name: string, size: number, scene: Scene, updatable?: boolean): Mesh {
            var plane = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreatePlane(size);

            vertexData.applyToMesh(plane, updatable);

            return plane;
        }

        public static CreateGround(name: string, width: number, height: number, subdivisions: number, scene: Scene, updatable?: boolean): Mesh {
            var ground = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateGround(width, height, subdivisions);

            vertexData.applyToMesh(ground, updatable);

            return ground;
        }

        public static CreateGroundFromHeightMap(name: string, url: string, width: number, height: number, subdivisions: number, minHeight: number, maxHeight: number, scene: Scene, updatable?: boolean): Mesh {
            var ground = new BABYLON.Mesh(name, scene);

            var onload = img => {
                // Getting height map data
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                var heightMapWidth = img.width;
                var heightMapHeight = img.height;
                canvas.width = heightMapWidth;
                canvas.height = heightMapHeight;

                context.drawImage(img, 0, 0);

                // Create VertexData from map data
                var buffer = context.getImageData(0, 0, heightMapWidth, heightMapHeight).data;
                var vertexData = VertexData.CreateGroundFromHeightMap(width, height, subdivisions, minHeight, maxHeight, buffer, heightMapWidth, heightMapHeight);

                vertexData.applyToMesh(ground, updatable);

                ground._isReady = true;
            };

            Tools.LoadImage(url, onload, () => {}, scene.database);

            ground._isReady = false;

            return ground;
        }

        // Tools
        public static MinMax(meshes: Mesh[]): {min: Vector3; max: Vector3} {
            var minVector = null;
            var maxVector = null;
            for (var i in meshes) {
                var mesh = meshes[i];
                var boundingBox = mesh.getBoundingInfo().boundingBox;
                if (!minVector) {
                    minVector = boundingBox.minimumWorld;
                    maxVector = boundingBox.maximumWorld;
                    continue;
                }
                minVector.MinimizeInPlace(boundingBox.minimumWorld);
                maxVector.MaximizeInPlace(boundingBox.maximumWorld);
            }

            return {
                min: minVector,
                max: maxVector
            };
        }

        public static Center(meshesOrMinMaxVector): Vector3 {
            var minMaxVector = meshesOrMinMaxVector.min !== undefined ? meshesOrMinMaxVector : BABYLON.Mesh.MinMax(meshesOrMinMaxVector);
            return BABYLON.Vector3.Center(minMaxVector.min, minMaxVector.max);
        }
    }
} 