module BABYLON {
    export class AbstractMesh extends Node implements IDisposable {
        // Statics
        private static _BILLBOARDMODE_NONE = 0;
        private static _BILLBOARDMODE_X = 1;
        private static _BILLBOARDMODE_Y = 2;
        private static _BILLBOARDMODE_Z = 4;
        private static _BILLBOARDMODE_ALL = 7;

        public static get BILLBOARDMODE_NONE(): number {
            return AbstractMesh._BILLBOARDMODE_NONE;
        }

        public static get BILLBOARDMODE_X(): number {
            return AbstractMesh._BILLBOARDMODE_X;
        }

        public static get BILLBOARDMODE_Y(): number {
            return AbstractMesh._BILLBOARDMODE_Y;
        }

        public static get BILLBOARDMODE_Z(): number {
            return AbstractMesh._BILLBOARDMODE_Z;
        }

        public static get BILLBOARDMODE_ALL(): number {
            return AbstractMesh._BILLBOARDMODE_ALL;
        }

        // Properties
        public position = new BABYLON.Vector3(0, 0, 0);
        public rotation = new BABYLON.Vector3(0, 0, 0);
        public rotationQuaternion: Quaternion;
        public scaling = new BABYLON.Vector3(1, 1, 1);
        public billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_NONE;
        public visibility = 1.0;
        public infiniteDistance = false;
        public isVisible = true;
        public isPickable = true;
        public showBoundingBox = false;
        public showSubMeshesBoundingBox = false;
        public onDispose = null;
        public checkCollisions = false;
        public skeleton: Skeleton;
        public renderingGroupId = 0;
        public material: Material;
        public receiveShadows = false;
        public actionManager: ActionManager;

        public useOctreeForRenderingSelection = true;
        public useOctreeForPicking = true;
        public useOctreeForCollisions = true;

        public layerMask: number = 0xFFFFFFFF;

        // Physics
        public _physicImpostor = PhysicsEngine.NoImpostor;
        public _physicsMass: number;
        public _physicsFriction: number;
        public _physicRestitution: number;

        // Cache
        private _localScaling = BABYLON.Matrix.Zero();
        private _localRotation = BABYLON.Matrix.Zero();
        private _localTranslation = BABYLON.Matrix.Zero();
        private _localBillboard = BABYLON.Matrix.Zero();
        private _localPivotScaling = BABYLON.Matrix.Zero();
        private _localPivotScalingRotation = BABYLON.Matrix.Zero();
        private _localWorld = BABYLON.Matrix.Zero();
        private _worldMatrix = BABYLON.Matrix.Zero();
        private _rotateYByPI = BABYLON.Matrix.RotationY(Math.PI);
        private _absolutePosition = BABYLON.Vector3.Zero();
        private _collisionsTransformMatrix = BABYLON.Matrix.Zero();
        private _collisionsScalingMatrix = BABYLON.Matrix.Zero();
        public _positions: Vector3[];
        private _isDirty = false;

        public _boundingInfo: BoundingInfo;
        private _pivotMatrix = BABYLON.Matrix.Identity();
        public _isDisposed = false;
        public _renderId = 0;

        public subMeshes: SubMesh[];
        public _submeshesOctree: Octree<SubMesh>;

        constructor(name: string, scene: Scene) {
            super(name, scene);

            scene.meshes.push(this);
        }

        // Methods
        public getTotalVertices(): number {
            return 0;
        }

        public getIndices(): number[] {
            return null;
        }

        public getVerticesData(kind: string): number[] {
            return null;
        }

        public isVerticesDataPresent(kind: string): boolean {
            return false;
        }

        public getBoundingInfo(): BoundingInfo {
            return this._boundingInfo;
        }

        public _preActivate(): void {
        }

        public _activate(renderId: number): void {
            this._renderId = renderId;
        }

        public getWorldMatrix(): Matrix {
            if (this._currentRenderId !== this.getScene().getRenderId()) {
                this.computeWorldMatrix();
            }
            return this._worldMatrix;
        }

        public get worldMatrixFromCache(): Matrix {
            return this._worldMatrix;
        }

        public get absolutePosition(): Vector3 {
            return this._absolutePosition;
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

            if (this.billboardMode !== AbstractMesh.BILLBOARDMODE_NONE)
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

        public _updateBoundingInfo(): void {
            this._boundingInfo = this._boundingInfo || new BABYLON.BoundingInfo(this.absolutePosition, this.absolutePosition);

            this._boundingInfo._update(this.worldMatrixFromCache);

            if (!this.subMeshes) {
                return;
            }

            for (var subIndex = 0; subIndex < this.subMeshes.length; subIndex++) {
                var subMesh = this.subMeshes[subIndex];

                subMesh.updateBoundingInfo(this.worldMatrixFromCache);
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
            if (this.billboardMode !== AbstractMesh.BILLBOARDMODE_NONE) {
                var localPosition = this.position.clone();
                var zero = this.getScene().activeCamera.position.clone();

                if (this.parent && (<any>this.parent).position) {
                    localPosition.addInPlace((<any>this.parent).position);
                    BABYLON.Matrix.TranslationToRef(localPosition.x, localPosition.y, localPosition.z, this._localTranslation);
                }

                if ((this.billboardMode & AbstractMesh.BILLBOARDMODE_ALL) === AbstractMesh.BILLBOARDMODE_ALL) {
                    zero = this.getScene().activeCamera.position;
                } else {
                    if (this.billboardMode & BABYLON.AbstractMesh.BILLBOARDMODE_X)
                        zero.x = localPosition.x + BABYLON.Engine.Epsilon;
                    if (this.billboardMode & BABYLON.AbstractMesh.BILLBOARDMODE_Y)
                        zero.y = localPosition.y + 0.001;
                    if (this.billboardMode & BABYLON.AbstractMesh.BILLBOARDMODE_Z)
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
            if (this.parent && this.parent.getWorldMatrix && this.billboardMode === BABYLON.AbstractMesh.BILLBOARDMODE_NONE) {
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

        public isInFrustum(frustumPlanes: Plane[]): boolean {
            if (!this._boundingInfo.isInFrustum(frustumPlanes)) {
                return false;
            }

            return true;
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

        // Submeshes octree

        /**
        * This function will create an octree to help select the right submeshes for rendering, picking and collisions
        * Please note that you must have a decent number of submeshes to get performance improvements when using octree
        */
        public createOrUpdateSubmeshesOctree(maxCapacity = 64, maxDepth = 2): Octree<SubMesh> {
            if (!this._submeshesOctree) {
                this._submeshesOctree = new BABYLON.Octree<SubMesh>(Octree.CreationFuncForSubMeshes, maxCapacity, maxDepth);
            }

            this.computeWorldMatrix(true);            

            // Update octree
            var bbox = this.getBoundingInfo().boundingBox;
            this._submeshesOctree.update(bbox.minimumWorld, bbox.maximumWorld, this.subMeshes);

            return this._submeshesOctree;
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

        public _processCollisionsForSubMeshes(collider: Collider, transformMatrix: Matrix): void {
            var subMeshes: SubMesh[];
            var len: number;            

            // Octrees
            if (this._submeshesOctree && this.useOctreeForCollisions) {
                var radius = collider.velocityWorldLength + Math.max(collider.radius.x, collider.radius.y, collider.radius.z);
                var intersections = this._submeshesOctree.intersects(collider.basePointWorld, radius);

                len = intersections.length;
                subMeshes = intersections.data;
            } else {
                subMeshes = this.subMeshes;
                len = subMeshes.length;
            }

            for (var index = 0; index < len; index++) {
                var subMesh = subMeshes[index];

                // Bounding test
                if (len > 1 && !subMesh._checkCollision(collider))
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
            this.worldMatrixFromCache.multiplyToRef(this._collisionsScalingMatrix, this._collisionsTransformMatrix);

            this._processCollisionsForSubMeshes(collider, this._collisionsTransformMatrix);
        }

        // Picking
        public _generatePointsArray(): boolean {
            return false;
        }

        public intersects(ray: Ray, fastCheck?: boolean): PickingInfo {
            var pickingInfo = new BABYLON.PickingInfo();

            if (!this.subMeshes || !this._boundingInfo || !ray.intersectsSphere(this._boundingInfo.boundingSphere) || !ray.intersectsBox(this._boundingInfo.boundingBox)) {
                return pickingInfo;
            }

            if (!this._generatePointsArray()) {
                return pickingInfo;
            }

            var intersectInfo: IntersectionInfo = null;

            // Octrees
            var subMeshes: SubMesh[];
            var len: number;

            if (this._submeshesOctree && this.useOctreeForPicking) {
                var worldRay = Ray.Transform(ray, this.getWorldMatrix());
                var intersections = this._submeshesOctree.intersectsRay(worldRay);

                len = intersections.length;
                subMeshes = intersections.data;
            } else {
                subMeshes = this.subMeshes;
                len = subMeshes.length;
            }

            for (var index = 0; index < len; index++) {
                var subMesh = subMeshes[index];

                // Bounding test
                if (len > 1 && !subMesh.canIntersects(ray))
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

        public clone(name: string, newParent: Node, doNotCloneChildren?: boolean): AbstractMesh {
            return null;
        }

        public releaseSubMeshes(): void {
            if (this.subMeshes) {
                while (this.subMeshes.length) {
                    this.subMeshes[0].dispose();
                }
            } else {
                this.subMeshes = new Array<SubMesh>();
            }
        }

        public dispose(doNotRecurse?: boolean): void {
            // Physics
            if (this.getPhysicsImpostor() != PhysicsEngine.NoImpostor) {
                this.setPhysicsState(PhysicsEngine.NoImpostor);
            }

            // SubMeshes
            this.releaseSubMeshes();

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
    }
}