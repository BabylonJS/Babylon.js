﻿module BABYLON {
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
        public definedFacingForward = true; // orientation for POV movement & rotation
        public position = new Vector3(0, 0, 0);
        public rotation = new Vector3(0, 0, 0);
        public rotationQuaternion: Quaternion;
        public scaling = new Vector3(1, 1, 1);
        public billboardMode = AbstractMesh.BILLBOARDMODE_NONE;
        public visibility = 1.0;
        public alphaIndex = Number.MAX_VALUE;
        public infiniteDistance = false;
        public isVisible = true;
        public isPickable = true;
        public showBoundingBox = false;
        public showSubMeshesBoundingBox = false;
        public onDispose = null;
        public isBlocker = false;
        public skeleton: Skeleton;
        public renderingGroupId = 0;
        public material: Material;
        public receiveShadows = false;
        public actionManager: ActionManager;
        public renderOutline = false;
        public outlineColor = Color3.Red();
        public outlineWidth = 0.02;
        public renderOverlay = false;
        public overlayColor = Color3.Red();
        public overlayAlpha = 0.5;
        public hasVertexAlpha = false;
        public useVertexColors = true;
        public applyFog = true;
        public computeBonesUsingShaders = true;
        public scalingDeterminant = 1;

        public useOctreeForRenderingSelection = true;
        public useOctreeForPicking = true;
        public useOctreeForCollisions = true;

        public layerMask: number = 0x0FFFFFFF;

        public alwaysSelectAsActiveMesh = false;

        // Physics
        public _physicImpostor = PhysicsEngine.NoImpostor;
        public _physicsMass: number;
        public _physicsFriction: number;
        public _physicRestitution: number;

        // Collisions
        private _checkCollisions = false;
        public ellipsoid = new Vector3(0.5, 1, 0.5);
        public ellipsoidOffset = new Vector3(0, 0, 0);
        private _collider = new Collider();
        private _oldPositionForCollisions = new Vector3(0, 0, 0);
        private _diffPositionForCollisions = new Vector3(0, 0, 0);
        private _newPositionForCollisions = new Vector3(0, 0, 0);
        public onCollide: (collidedMesh: AbstractMesh) => void;

        // Attach to bone
        private _meshToBoneReferal: AbstractMesh;

        // Edges
        public edgesWidth = 1;
        public edgesColor = new Color4(1, 0, 0, 1);
        public _edgesRenderer: EdgesRenderer;

        // Cache
        private _localScaling = Matrix.Zero();
        private _localRotation = Matrix.Zero();
        private _localTranslation = Matrix.Zero();
        private _localBillboard = Matrix.Zero();
        private _localPivotScaling = Matrix.Zero();
        private _localPivotScalingRotation = Matrix.Zero();
        private _localMeshReferalTransform: Matrix;
        private _localWorld = Matrix.Zero();
        public _worldMatrix = Matrix.Zero();
        private _rotateYByPI = Matrix.RotationY(Math.PI);
        private _absolutePosition = Vector3.Zero();
        private _collisionsTransformMatrix = Matrix.Zero();
        private _collisionsScalingMatrix = Matrix.Zero();
        public _positions: Vector3[];
        private _isDirty = false;
        public _masterMesh: AbstractMesh;

        public _boundingInfo: BoundingInfo;
        private _pivotMatrix = Matrix.Identity();
        public _isDisposed = false;
        public _renderId = 0;

        public subMeshes: SubMesh[];
        public _submeshesOctree: Octree<SubMesh>;
        public _intersectionsInProgress = new Array<AbstractMesh>();

        private _onAfterWorldMatrixUpdate = new Array<(mesh: AbstractMesh) => void>();

        private _isWorldMatrixFrozen = false;

        // Loading properties
        public _waitingActions: any;
        public _waitingFreezeWorldMatrix: boolean;

        constructor(name: string, scene: Scene) {
            super(name, scene);

            scene.addMesh(this);
        }

        // Methods
        public disableEdgesRendering(): void {
            if (this._edgesRenderer !== undefined) {
                this._edgesRenderer.dispose();
                this._edgesRenderer = undefined;
            }
        }
        public enableEdgesRendering(epsilon = 0.95, checkVerticesInsteadOfIndices = false) {
            this.disableEdgesRendering();

            this._edgesRenderer = new EdgesRenderer(this, epsilon, checkVerticesInsteadOfIndices);
        }

        public get isBlocked(): boolean {
            return false;
        }

        public getLOD(camera: Camera): AbstractMesh {
            return this;
        }

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
            if (this._masterMesh) {
                return this._masterMesh.getBoundingInfo();
            }

            if (!this._boundingInfo) {
                this._updateBoundingInfo();
            }
            return this._boundingInfo;
        }

        public get useBones(): boolean {
            return this.skeleton && this.getScene().skeletonsEnabled && this.isVerticesDataPresent(VertexBuffer.MatricesIndicesKind) && this.isVerticesDataPresent(VertexBuffer.MatricesWeightsKind);
        }

        public _preActivate(): void {
        }

        public _activate(renderId: number): void {
            this._renderId = renderId;
        }

        public getWorldMatrix(): Matrix {
            if (this._masterMesh) {
                return this._masterMesh.getWorldMatrix();
            }

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

        public freezeWorldMatrix() {
            this._isWorldMatrixFrozen = false;  // no guarantee world is not already frozen, switch off temporarily
            this.computeWorldMatrix(true);
            this._isWorldMatrixFrozen = true;
        }

        public unfreezeWorldMatrix() {
            this._isWorldMatrixFrozen = false;
            this.computeWorldMatrix(true);
        }

        public get isWorldMatrixFrozen(): boolean {
            return this._isWorldMatrixFrozen;
        }

        public rotate(axis: Vector3, amount: number, space: Space): void {
            axis.normalize();

            if (!this.rotationQuaternion) {
                this.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
                this.rotation = Vector3.Zero();
            }
            var rotationQuaternion: Quaternion;
            if (!space || space === Space.LOCAL) {
                rotationQuaternion = Quaternion.RotationAxis(axis, amount);
                this.rotationQuaternion = this.rotationQuaternion.multiply(rotationQuaternion);
            }
            else {
                if (this.parent) {
                    var invertParentWorldMatrix = this.parent.getWorldMatrix().clone();
                    invertParentWorldMatrix.invert();

                    axis = Vector3.TransformNormal(axis, invertParentWorldMatrix);
                }
                rotationQuaternion = Quaternion.RotationAxis(axis, amount);
                this.rotationQuaternion = rotationQuaternion.multiply(this.rotationQuaternion);
            }
        }

        public translate(axis: Vector3, distance: number, space: Space): void {
            var displacementVector = axis.scale(distance);

            if (!space || space === Space.LOCAL) {
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

                var worldPosition = new Vector3(absolutePositionX, absolutePositionY, absolutePositionZ);

                this.position = Vector3.TransformCoordinates(worldPosition, invertParentWorldMatrix);
            } else {
                this.position.x = absolutePositionX;
                this.position.y = absolutePositionY;
                this.position.z = absolutePositionZ;
            }
        }
        // ================================== Point of View Movement =================================
        /**
         * Perform relative position change from the point of view of behind the front of the mesh.
         * This is performed taking into account the meshes current rotation, so you do not have to care.
         * Supports definition of mesh facing forward or backward.
         * @param {number} amountRight
         * @param {number} amountUp
         * @param {number} amountForward
         */
        public movePOV(amountRight: number, amountUp: number, amountForward: number): void {
            this.position.addInPlace(this.calcMovePOV(amountRight, amountUp, amountForward));
        }

        /**
         * Calculate relative position change from the point of view of behind the front of the mesh.
         * This is performed taking into account the meshes current rotation, so you do not have to care.
         * Supports definition of mesh facing forward or backward.
         * @param {number} amountRight
         * @param {number} amountUp
         * @param {number} amountForward
         */
        public calcMovePOV(amountRight: number, amountUp: number, amountForward: number): Vector3 {
            var rotMatrix = new Matrix();
            var rotQuaternion = (this.rotationQuaternion) ? this.rotationQuaternion : Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
            rotQuaternion.toRotationMatrix(rotMatrix);

            var translationDelta = Vector3.Zero();
            var defForwardMult = this.definedFacingForward ? -1 : 1;
            Vector3.TransformCoordinatesFromFloatsToRef(amountRight * defForwardMult, amountUp, amountForward * defForwardMult, rotMatrix, translationDelta);
            return translationDelta;
        }
        // ================================== Point of View Rotation =================================
        /**
         * Perform relative rotation change from the point of view of behind the front of the mesh.
         * Supports definition of mesh facing forward or backward.
         * @param {number} flipBack
         * @param {number} twirlClockwise
         * @param {number} tiltRight
         */
        public rotatePOV(flipBack: number, twirlClockwise: number, tiltRight: number): void {
            this.rotation.addInPlace(this.calcRotatePOV(flipBack, twirlClockwise, tiltRight));
        }

        /**
         * Calculate relative rotation change from the point of view of behind the front of the mesh.
         * Supports definition of mesh facing forward or backward.
         * @param {number} flipBack
         * @param {number} twirlClockwise
         * @param {number} tiltRight
         */
        public calcRotatePOV(flipBack: number, twirlClockwise: number, tiltRight: number): Vector3 {
            var defForwardMult = this.definedFacingForward ? 1 : -1;
            return new Vector3(flipBack * defForwardMult, twirlClockwise, tiltRight * defForwardMult);
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
            this._cache.position = Vector3.Zero();
            this._cache.scaling = Vector3.Zero();
            this._cache.rotation = Vector3.Zero();
            this._cache.rotationQuaternion = new Quaternion(0, 0, 0, 0);
        }

        public markAsDirty(property: string): void {
            if (property === "rotation") {
                this.rotationQuaternion = null;
            }
            this._currentRenderId = Number.MAX_VALUE;
            this._isDirty = true;
        }

        public _updateBoundingInfo(): void {
            this._boundingInfo = this._boundingInfo || new BoundingInfo(this.absolutePosition, this.absolutePosition);

            this._boundingInfo._update(this.worldMatrixFromCache);

            this._updateSubMeshesBoundingInfo(this.worldMatrixFromCache);
        }

        public _updateSubMeshesBoundingInfo(matrix: Matrix): void {
            if (!this.subMeshes) {
                return;
            }

            for (var subIndex = 0; subIndex < this.subMeshes.length; subIndex++) {
                var subMesh = this.subMeshes[subIndex];

                subMesh.updateBoundingInfo(matrix);
            }
        }

        public computeWorldMatrix(force?: boolean): Matrix {
            if (this._isWorldMatrixFrozen) {
                return this._worldMatrix;
            }

            if (!force && (this._currentRenderId === this.getScene().getRenderId() || this.isSynchronized(true))) {
                return this._worldMatrix;
            }

            this._cache.position.copyFrom(this.position);
            this._cache.scaling.copyFrom(this.scaling);
            this._cache.pivotMatrixUpdated = false;
            this._currentRenderId = this.getScene().getRenderId();
            this._isDirty = false;

            // Scaling
            Matrix.ScalingToRef(this.scaling.x * this.scalingDeterminant, this.scaling.y * this.scalingDeterminant, this.scaling.z * this.scalingDeterminant, this._localScaling);

            // Rotation
            if (this.rotationQuaternion) {
                this.rotationQuaternion.toRotationMatrix(this._localRotation);
                this._cache.rotationQuaternion.copyFrom(this.rotationQuaternion);
            } else {
                Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._localRotation);
                this._cache.rotation.copyFrom(this.rotation);
            }

            // Translation
            if (this.infiniteDistance && !this.parent) {
                var camera = this.getScene().activeCamera;
                if (camera) {
                    var cameraWorldMatrix = camera.getWorldMatrix();

                    var cameraGlobalPosition = new Vector3(cameraWorldMatrix.m[12], cameraWorldMatrix.m[13], cameraWorldMatrix.m[14]);

                    Matrix.TranslationToRef(this.position.x + cameraGlobalPosition.x, this.position.y + cameraGlobalPosition.y,
                        this.position.z + cameraGlobalPosition.z, this._localTranslation);
                }
            } else {
                Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._localTranslation);
            }

            // Composing transformations
            this._pivotMatrix.multiplyToRef(this._localScaling, this._localPivotScaling);
            this._localPivotScaling.multiplyToRef(this._localRotation, this._localPivotScalingRotation);

            // Billboarding
            if (this.billboardMode !== AbstractMesh.BILLBOARDMODE_NONE && this.getScene().activeCamera) {
                var localPosition = this.position.clone();
                var zero = this.getScene().activeCamera.globalPosition.clone();

                if (this.parent && (<any>this.parent).position) {
                    localPosition.addInPlace((<any>this.parent).position);
                    Matrix.TranslationToRef(localPosition.x, localPosition.y, localPosition.z, this._localTranslation);
                }

                if ((this.billboardMode & AbstractMesh.BILLBOARDMODE_ALL) !== AbstractMesh.BILLBOARDMODE_ALL) {
                    if (this.billboardMode & AbstractMesh.BILLBOARDMODE_X)
                        zero.x = localPosition.x + Engine.Epsilon;
                    if (this.billboardMode & AbstractMesh.BILLBOARDMODE_Y)
                        zero.y = localPosition.y + 0.001;
                    if (this.billboardMode & AbstractMesh.BILLBOARDMODE_Z)
                        zero.z = localPosition.z + 0.001;
                }

                Matrix.LookAtLHToRef(localPosition, zero, Vector3.Up(), this._localBillboard);
                this._localBillboard.m[12] = this._localBillboard.m[13] = this._localBillboard.m[14] = 0;

                this._localBillboard.invert();

                this._localPivotScalingRotation.multiplyToRef(this._localBillboard, this._localWorld);
                this._rotateYByPI.multiplyToRef(this._localWorld, this._localPivotScalingRotation);
            }

            // Local world
            this._localPivotScalingRotation.multiplyToRef(this._localTranslation, this._localWorld);

            // Parent
            if (this.parent && this.parent.getWorldMatrix && this.billboardMode === AbstractMesh.BILLBOARDMODE_NONE) {
                this._markSyncedWithParent();

                if (this._meshToBoneReferal) {
                    if (!this._localMeshReferalTransform) {
                        this._localMeshReferalTransform = Matrix.Zero();
                    }

                    this._localWorld.multiplyToRef(this.parent.getWorldMatrix(), this._localMeshReferalTransform);
                    this._localMeshReferalTransform.multiplyToRef(this._meshToBoneReferal.getWorldMatrix(), this._worldMatrix);
                } else {
                    this._localWorld.multiplyToRef(this.parent.getWorldMatrix(), this._worldMatrix);
                }
            } else {
                this._worldMatrix.copyFrom(this._localWorld);
            }

            // Bounding info
            this._updateBoundingInfo();

            // Absolute position
            this._absolutePosition.copyFromFloats(this._worldMatrix.m[12], this._worldMatrix.m[13], this._worldMatrix.m[14]);

            // Callbacks
            for (var callbackIndex = 0; callbackIndex < this._onAfterWorldMatrixUpdate.length; callbackIndex++) {
                this._onAfterWorldMatrixUpdate[callbackIndex](this);
            }

            return this._worldMatrix;
        }

        /**
        * If you'd like to be callbacked after the mesh position, rotation or scaling has been updated
        * @param func: callback function to add
        */
        public registerAfterWorldMatrixUpdate(func: (mesh: AbstractMesh) => void): void {
            this._onAfterWorldMatrixUpdate.push(func);
        }

        public unregisterAfterWorldMatrixUpdate(func: (mesh: AbstractMesh) => void): void {
            var index = this._onAfterWorldMatrixUpdate.indexOf(func);

            if (index > -1) {
                this._onAfterWorldMatrixUpdate.splice(index, 1);
            }
        }

        public setPositionWithLocalVector(vector3: Vector3): void {
            this.computeWorldMatrix();

            this.position = Vector3.TransformNormal(vector3, this._localWorld);
        }

        public getPositionExpressedInLocalSpace(): Vector3 {
            this.computeWorldMatrix();
            var invLocalWorldMatrix = this._localWorld.clone();
            invLocalWorldMatrix.invert();

            return Vector3.TransformNormal(this.position, invLocalWorldMatrix);
        }

        public locallyTranslate(vector3: Vector3): void {
            this.computeWorldMatrix(true);

            this.position = Vector3.TransformCoordinates(vector3, this._localWorld);
        }

        public lookAt(targetPoint: Vector3, yawCor: number, pitchCor: number, rollCor: number): void {
            /// <summary>Orients a mesh towards a target point. Mesh must be drawn facing user.</summary>
            /// <param name="targetPoint" type="Vector3">The position (must be in same space as current mesh) to look at</param>
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
            this.rotationQuaternion = Quaternion.RotationYawPitchRoll(yaw + yawCor, pitch + pitchCor, rollCor);
        }

        public attachToBone(bone: Bone, affectedMesh: AbstractMesh): void {
            this._meshToBoneReferal = affectedMesh;
            this.parent = bone;

            if (bone.getWorldMatrix().determinant() < 0) {
                this.scalingDeterminant *= -1;
            }
        }

        public detachFromBone(): void {
            if (this.parent.getWorldMatrix().determinant() < 0) {
                this.scalingDeterminant *= -1;
            }

            this._meshToBoneReferal = null;
            this.parent = null;
        }

        public isInFrustum(frustumPlanes: Plane[]): boolean {
            return this._boundingInfo.isInFrustum(frustumPlanes);
        }

        public isCompletelyInFrustum(camera?: Camera): boolean {
            if (!camera) {
                camera = this.getScene().activeCamera;
            }

            var transformMatrix = camera.getViewMatrix().multiply(camera.getProjectionMatrix());

            if (!this._boundingInfo.isCompletelyInFrustum(Frustum.GetPlanes(transformMatrix))) {
                return false;
            }

            return true;
        }

        public intersectsMesh(mesh: AbstractMesh, precise?: boolean): boolean {
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
        public setPhysicsState(impostor?: any, options?: PhysicsBodyCreationOptions): any {
            var physicsEngine = this.getScene().getPhysicsEngine();

            if (!physicsEngine) {
                return null;
            }

            impostor = impostor || PhysicsEngine.NoImpostor;

            if (impostor.impostor) {
                // Old API
                options = impostor;
                impostor = impostor.impostor;
            }

            if (impostor === PhysicsEngine.NoImpostor) {
                physicsEngine._unregisterMesh(this);
                return null;
            }

            if (!options) {
                options = { mass: 0, friction: 0.2, restitution: 0.2 };
            } else {
                if (!options.mass && options.mass !== 0) options.mass = 0;
                if (!options.friction && options.friction !== 0) options.friction = 0.2;
                if (!options.restitution && options.restitution !== 0) options.restitution = 0.2;
            }

            this._physicImpostor = impostor;
            this._physicsMass = options.mass;
            this._physicsFriction = options.friction;
            this._physicRestitution = options.restitution;


            return physicsEngine._registerMesh(this, impostor, options);
        }

        public getPhysicsImpostor(): number {
            if (!this._physicImpostor) {
                return PhysicsEngine.NoImpostor;
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

        public getPositionInCameraSpace(camera?: Camera): Vector3 {
            if (!camera) {
                camera = this.getScene().activeCamera;
            }

            return Vector3.TransformCoordinates(this.absolutePosition, camera.getViewMatrix());
        }

        public getDistanceToCamera(camera?: Camera): number {
            if (!camera) {
                camera = this.getScene().activeCamera;
            }

            return this.absolutePosition.subtract(camera.position).length();
        }

        public applyImpulse(force: Vector3, contactPoint: Vector3): void {
            if (!this._physicImpostor) {
                return;
            }

            this.getScene().getPhysicsEngine()._applyImpulse(this, force, contactPoint);
        }

        public setPhysicsLinkWith(otherMesh: Mesh, pivot1: Vector3, pivot2: Vector3, options?: any): void {
            if (!this._physicImpostor) {
                return;
            }

            this.getScene().getPhysicsEngine()._createLink(this, otherMesh, pivot1, pivot2, options);
        }

        public updatePhysicsBodyPosition(): void {
            if (!this._physicImpostor) {
                return;
            }
            this.getScene().getPhysicsEngine()._updateBodyPosition(this);
        }


        // Collisions

        public get checkCollisions(): boolean {
            return this._checkCollisions;
        }

        public set checkCollisions(collisionEnabled: boolean) {
            this._checkCollisions = collisionEnabled;
            if (this.getScene().workerCollisions) {
                this.getScene().collisionCoordinator.onMeshUpdated(this);
            }
        }

        public moveWithCollisions(velocity: Vector3): void {
            var globalPosition = this.getAbsolutePosition();

            globalPosition.subtractFromFloatsToRef(0, this.ellipsoid.y, 0, this._oldPositionForCollisions);
            this._oldPositionForCollisions.addInPlace(this.ellipsoidOffset);
            this._collider.radius = this.ellipsoid;

            this.getScene().collisionCoordinator.getNewPosition(this._oldPositionForCollisions, velocity, this._collider, 3, this, this._onCollisionPositionChange, this.uniqueId);
        }

        private _onCollisionPositionChange = (collisionId: number, newPosition: Vector3, collidedMesh: AbstractMesh = null) => {
            //TODO move this to the collision coordinator!
            if (this.getScene().workerCollisions)
                newPosition.multiplyInPlace(this._collider.radius);

            newPosition.subtractToRef(this._oldPositionForCollisions, this._diffPositionForCollisions);

            if (this._diffPositionForCollisions.length() > Engine.CollisionsEpsilon) {
                this.position.addInPlace(this._diffPositionForCollisions);
            }

            if (this.onCollide && collidedMesh) {
                this.onCollide(collidedMesh);
            }
        }

        // Submeshes octree

        /**
        * This function will create an octree to help select the right submeshes for rendering, picking and collisions
        * Please note that you must have a decent number of submeshes to get performance improvements when using octree
        */
        public createOrUpdateSubmeshesOctree(maxCapacity = 64, maxDepth = 2): Octree<SubMesh> {
            if (!this._submeshesOctree) {
                this._submeshesOctree = new Octree<SubMesh>(Octree.CreationFuncForSubMeshes, maxCapacity, maxDepth);
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
                    subMesh._lastColliderWorldVertices.push(Vector3.TransformCoordinates(this._positions[i], transformMatrix));
                }
            }
            // Collide
            collider._collide(subMesh._trianglePlanes, subMesh._lastColliderWorldVertices, this.getIndices(), subMesh.indexStart, subMesh.indexStart + subMesh.indexCount, subMesh.verticesStart, !!subMesh.getMaterial());
            if (collider.collisionFound) {
                collider.collidedMesh = this;
            }
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
            Matrix.ScalingToRef(1.0 / collider.radius.x, 1.0 / collider.radius.y, 1.0 / collider.radius.z, this._collisionsScalingMatrix);
            this.worldMatrixFromCache.multiplyToRef(this._collisionsScalingMatrix, this._collisionsTransformMatrix);

            this._processCollisionsForSubMeshes(collider, this._collisionsTransformMatrix);
        }

        // Picking
        public _generatePointsArray(): boolean {
            return false;
        }

        public intersects(ray: Ray, fastCheck?: boolean): PickingInfo {
            var pickingInfo = new PickingInfo();

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
                        intersectInfo.subMeshId = index;

                        if (fastCheck) {
                            break;
                        }
                    }
                }
            }

            if (intersectInfo) {
                // Get picked point
                var world = this.getWorldMatrix();
                var worldOrigin = Vector3.TransformCoordinates(ray.origin, world);
                var direction = ray.direction.clone();
                direction = direction.scale(intersectInfo.distance);
                var worldDirection = Vector3.TransformNormal(direction, world);

                var pickedPoint = worldOrigin.add(worldDirection);

                // Return result
                pickingInfo.hit = true;
                pickingInfo.distance = Vector3.Distance(worldOrigin, pickedPoint);
                pickingInfo.pickedPoint = pickedPoint;
                pickingInfo.pickedMesh = this;
                pickingInfo.bu = intersectInfo.bu;
                pickingInfo.bv = intersectInfo.bv;
                pickingInfo.faceId = intersectInfo.faceId;
                pickingInfo.subMeshId = intersectInfo.subMeshId;
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
            var index: number;

            // Physics
            if (this.getPhysicsImpostor() !== PhysicsEngine.NoImpostor) {
                this.setPhysicsState(PhysicsEngine.NoImpostor);
            }

            // Intersections in progress
            for (index = 0; index < this._intersectionsInProgress.length; index++) {
                var other = this._intersectionsInProgress[index];

                var pos = other._intersectionsInProgress.indexOf(this);
                other._intersectionsInProgress.splice(pos, 1);
            }

            this._intersectionsInProgress = [];

            // Edges
            if (this._edgesRenderer) {
                this._edgesRenderer.dispose();
                this._edgesRenderer = null;
            }

            // SubMeshes
            this.releaseSubMeshes();

            // Remove from scene
            this.getScene().removeMesh(this);

            if (!doNotRecurse) {
                // Particles
                for (index = 0; index < this.getScene().particleSystems.length; index++) {
                    if (this.getScene().particleSystems[index].emitter === this) {
                        this.getScene().particleSystems[index].dispose();
                        index--;
                    }
                }

                // Children
                var objects = this.getScene().meshes.slice(0);
                for (index = 0; index < objects.length; index++) {
                    if (objects[index].parent === this) {
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

            this._onAfterWorldMatrixUpdate = [];

            this._isDisposed = true;

            // Callback
            if (this.onDispose) {
                this.onDispose();
            }
        }
    }
}


