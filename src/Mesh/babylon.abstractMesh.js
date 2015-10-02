var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var AbstractMesh = (function (_super) {
        __extends(AbstractMesh, _super);
        function AbstractMesh(name, scene) {
            var _this = this;
            _super.call(this, name, scene);
            // Properties
            this.definedFacingForward = true; // orientation for POV movement & rotation
            this.position = new BABYLON.Vector3(0, 0, 0);
            this.rotation = new BABYLON.Vector3(0, 0, 0);
            this.scaling = new BABYLON.Vector3(1, 1, 1);
            this.billboardMode = AbstractMesh.BILLBOARDMODE_NONE;
            this.visibility = 1.0;
            this.alphaIndex = Number.MAX_VALUE;
            this.infiniteDistance = false;
            this.isVisible = true;
            this.isPickable = true;
            this.showBoundingBox = false;
            this.showSubMeshesBoundingBox = false;
            this.onDispose = null;
            this.isBlocker = false;
            this.renderingGroupId = 0;
            this.receiveShadows = false;
            this.renderOutline = false;
            this.outlineColor = BABYLON.Color3.Red();
            this.outlineWidth = 0.02;
            this.renderOverlay = false;
            this.overlayColor = BABYLON.Color3.Red();
            this.overlayAlpha = 0.5;
            this.hasVertexAlpha = false;
            this.useVertexColors = true;
            this.applyFog = true;
            this.computeBonesUsingShaders = true;
            this.scalingDeterminant = 1;
            this.useOctreeForRenderingSelection = true;
            this.useOctreeForPicking = true;
            this.useOctreeForCollisions = true;
            this.layerMask = 0x0FFFFFFF;
            this.alwaysSelectAsActiveMesh = false;
            // Physics
            this._physicImpostor = BABYLON.PhysicsEngine.NoImpostor;
            // Collisions
            this._checkCollisions = false;
            this.ellipsoid = new BABYLON.Vector3(0.5, 1, 0.5);
            this.ellipsoidOffset = new BABYLON.Vector3(0, 0, 0);
            this._collider = new BABYLON.Collider();
            this._oldPositionForCollisions = new BABYLON.Vector3(0, 0, 0);
            this._diffPositionForCollisions = new BABYLON.Vector3(0, 0, 0);
            this._newPositionForCollisions = new BABYLON.Vector3(0, 0, 0);
            // Edges
            this.edgesWidth = 1;
            this.edgesColor = new BABYLON.Color4(1, 0, 0, 1);
            // Cache
            this._localScaling = BABYLON.Matrix.Zero();
            this._localRotation = BABYLON.Matrix.Zero();
            this._localTranslation = BABYLON.Matrix.Zero();
            this._localBillboard = BABYLON.Matrix.Zero();
            this._localPivotScaling = BABYLON.Matrix.Zero();
            this._localPivotScalingRotation = BABYLON.Matrix.Zero();
            this._localWorld = BABYLON.Matrix.Zero();
            this._worldMatrix = BABYLON.Matrix.Zero();
            this._rotateYByPI = BABYLON.Matrix.RotationY(Math.PI);
            this._absolutePosition = BABYLON.Vector3.Zero();
            this._collisionsTransformMatrix = BABYLON.Matrix.Zero();
            this._collisionsScalingMatrix = BABYLON.Matrix.Zero();
            this._isDirty = false;
            this._pivotMatrix = BABYLON.Matrix.Identity();
            this._isDisposed = false;
            this._renderId = 0;
            this._intersectionsInProgress = new Array();
            this._onAfterWorldMatrixUpdate = new Array();
            this._isWorldMatrixFrozen = false;
            this._onCollisionPositionChange = function (collisionId, newPosition, collidedMesh) {
                if (collidedMesh === void 0) { collidedMesh = null; }
                //TODO move this to the collision coordinator!
                if (_this.getScene().workerCollisions)
                    newPosition.multiplyInPlace(_this._collider.radius);
                newPosition.subtractToRef(_this._oldPositionForCollisions, _this._diffPositionForCollisions);
                if (_this._diffPositionForCollisions.length() > BABYLON.Engine.CollisionsEpsilon) {
                    _this.position.addInPlace(_this._diffPositionForCollisions);
                }
                if (_this.onCollide && collidedMesh) {
                    _this.onCollide(collidedMesh);
                }
            };
            scene.addMesh(this);
        }
        Object.defineProperty(AbstractMesh, "BILLBOARDMODE_NONE", {
            get: function () {
                return AbstractMesh._BILLBOARDMODE_NONE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AbstractMesh, "BILLBOARDMODE_X", {
            get: function () {
                return AbstractMesh._BILLBOARDMODE_X;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AbstractMesh, "BILLBOARDMODE_Y", {
            get: function () {
                return AbstractMesh._BILLBOARDMODE_Y;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AbstractMesh, "BILLBOARDMODE_Z", {
            get: function () {
                return AbstractMesh._BILLBOARDMODE_Z;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AbstractMesh, "BILLBOARDMODE_ALL", {
            get: function () {
                return AbstractMesh._BILLBOARDMODE_ALL;
            },
            enumerable: true,
            configurable: true
        });
        // Methods
        AbstractMesh.prototype.disableEdgesRendering = function () {
            if (this._edgesRenderer !== undefined) {
                this._edgesRenderer.dispose();
                this._edgesRenderer = undefined;
            }
        };
        AbstractMesh.prototype.enableEdgesRendering = function (epsilon, checkVerticesInsteadOfIndices) {
            if (epsilon === void 0) { epsilon = 0.95; }
            if (checkVerticesInsteadOfIndices === void 0) { checkVerticesInsteadOfIndices = false; }
            this.disableEdgesRendering();
            this._edgesRenderer = new BABYLON.EdgesRenderer(this, epsilon, checkVerticesInsteadOfIndices);
        };
        Object.defineProperty(AbstractMesh.prototype, "isBlocked", {
            get: function () {
                return false;
            },
            enumerable: true,
            configurable: true
        });
        AbstractMesh.prototype.getLOD = function (camera) {
            return this;
        };
        AbstractMesh.prototype.getTotalVertices = function () {
            return 0;
        };
        AbstractMesh.prototype.getIndices = function () {
            return null;
        };
        AbstractMesh.prototype.getVerticesData = function (kind) {
            return null;
        };
        AbstractMesh.prototype.isVerticesDataPresent = function (kind) {
            return false;
        };
        AbstractMesh.prototype.getBoundingInfo = function () {
            if (this._masterMesh) {
                return this._masterMesh.getBoundingInfo();
            }
            if (!this._boundingInfo) {
                this._updateBoundingInfo();
            }
            return this._boundingInfo;
        };
        Object.defineProperty(AbstractMesh.prototype, "useBones", {
            get: function () {
                return this.skeleton && this.getScene().skeletonsEnabled && this.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind) && this.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind);
            },
            enumerable: true,
            configurable: true
        });
        AbstractMesh.prototype._preActivate = function () {
        };
        AbstractMesh.prototype._activate = function (renderId) {
            this._renderId = renderId;
        };
        AbstractMesh.prototype.getWorldMatrix = function () {
            if (this._masterMesh) {
                return this._masterMesh.getWorldMatrix();
            }
            if (this._currentRenderId !== this.getScene().getRenderId()) {
                this.computeWorldMatrix();
            }
            return this._worldMatrix;
        };
        Object.defineProperty(AbstractMesh.prototype, "worldMatrixFromCache", {
            get: function () {
                return this._worldMatrix;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(AbstractMesh.prototype, "absolutePosition", {
            get: function () {
                return this._absolutePosition;
            },
            enumerable: true,
            configurable: true
        });
        AbstractMesh.prototype.freezeWorldMatrix = function () {
            this._isWorldMatrixFrozen = false; // no guarantee world is not already frozen, switch off temporarily
            this.computeWorldMatrix(true);
            this._isWorldMatrixFrozen = true;
        };
        AbstractMesh.prototype.unfreezeWorldMatrix = function () {
            this._isWorldMatrixFrozen = false;
            this.computeWorldMatrix(true);
        };
        Object.defineProperty(AbstractMesh.prototype, "isWorldMatrixFrozen", {
            get: function () {
                return this._isWorldMatrixFrozen;
            },
            enumerable: true,
            configurable: true
        });
        AbstractMesh.prototype.rotate = function (axis, amount, space) {
            axis.normalize();
            if (!this.rotationQuaternion) {
                this.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
                this.rotation = BABYLON.Vector3.Zero();
            }
            var rotationQuaternion;
            if (!space || space === BABYLON.Space.LOCAL) {
                rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, amount);
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
        };
        AbstractMesh.prototype.translate = function (axis, distance, space) {
            var displacementVector = axis.scale(distance);
            if (!space || space === BABYLON.Space.LOCAL) {
                var tempV3 = this.getPositionExpressedInLocalSpace().add(displacementVector);
                this.setPositionWithLocalVector(tempV3);
            }
            else {
                this.setAbsolutePosition(this.getAbsolutePosition().add(displacementVector));
            }
        };
        AbstractMesh.prototype.getAbsolutePosition = function () {
            this.computeWorldMatrix();
            return this._absolutePosition;
        };
        AbstractMesh.prototype.setAbsolutePosition = function (absolutePosition) {
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
            }
            else {
                this.position.x = absolutePositionX;
                this.position.y = absolutePositionY;
                this.position.z = absolutePositionZ;
            }
        };
        // ================================== Point of View Movement =================================
        /**
         * Perform relative position change from the point of view of behind the front of the mesh.
         * This is performed taking into account the meshes current rotation, so you do not have to care.
         * Supports definition of mesh facing forward or backward.
         * @param {number} amountRight
         * @param {number} amountUp
         * @param {number} amountForward
         */
        AbstractMesh.prototype.movePOV = function (amountRight, amountUp, amountForward) {
            this.position.addInPlace(this.calcMovePOV(amountRight, amountUp, amountForward));
        };
        /**
         * Calculate relative position change from the point of view of behind the front of the mesh.
         * This is performed taking into account the meshes current rotation, so you do not have to care.
         * Supports definition of mesh facing forward or backward.
         * @param {number} amountRight
         * @param {number} amountUp
         * @param {number} amountForward
         */
        AbstractMesh.prototype.calcMovePOV = function (amountRight, amountUp, amountForward) {
            var rotMatrix = new BABYLON.Matrix();
            var rotQuaternion = (this.rotationQuaternion) ? this.rotationQuaternion : BABYLON.Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
            rotQuaternion.toRotationMatrix(rotMatrix);
            var translationDelta = BABYLON.Vector3.Zero();
            var defForwardMult = this.definedFacingForward ? -1 : 1;
            BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(amountRight * defForwardMult, amountUp, amountForward * defForwardMult, rotMatrix, translationDelta);
            return translationDelta;
        };
        // ================================== Point of View Rotation =================================
        /**
         * Perform relative rotation change from the point of view of behind the front of the mesh.
         * Supports definition of mesh facing forward or backward.
         * @param {number} flipBack
         * @param {number} twirlClockwise
         * @param {number} tiltRight
         */
        AbstractMesh.prototype.rotatePOV = function (flipBack, twirlClockwise, tiltRight) {
            this.rotation.addInPlace(this.calcRotatePOV(flipBack, twirlClockwise, tiltRight));
        };
        /**
         * Calculate relative rotation change from the point of view of behind the front of the mesh.
         * Supports definition of mesh facing forward or backward.
         * @param {number} flipBack
         * @param {number} twirlClockwise
         * @param {number} tiltRight
         */
        AbstractMesh.prototype.calcRotatePOV = function (flipBack, twirlClockwise, tiltRight) {
            var defForwardMult = this.definedFacingForward ? 1 : -1;
            return new BABYLON.Vector3(flipBack * defForwardMult, twirlClockwise, tiltRight * defForwardMult);
        };
        AbstractMesh.prototype.setPivotMatrix = function (matrix) {
            this._pivotMatrix = matrix;
            this._cache.pivotMatrixUpdated = true;
        };
        AbstractMesh.prototype.getPivotMatrix = function () {
            return this._pivotMatrix;
        };
        AbstractMesh.prototype._isSynchronized = function () {
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
            }
            else {
                if (!this._cache.rotation.equals(this.rotation))
                    return false;
            }
            if (!this._cache.scaling.equals(this.scaling))
                return false;
            return true;
        };
        AbstractMesh.prototype._initCache = function () {
            _super.prototype._initCache.call(this);
            this._cache.localMatrixUpdated = false;
            this._cache.position = BABYLON.Vector3.Zero();
            this._cache.scaling = BABYLON.Vector3.Zero();
            this._cache.rotation = BABYLON.Vector3.Zero();
            this._cache.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 0);
        };
        AbstractMesh.prototype.markAsDirty = function (property) {
            if (property === "rotation") {
                this.rotationQuaternion = null;
            }
            this._currentRenderId = Number.MAX_VALUE;
            this._isDirty = true;
        };
        AbstractMesh.prototype._updateBoundingInfo = function () {
            this._boundingInfo = this._boundingInfo || new BABYLON.BoundingInfo(this.absolutePosition, this.absolutePosition);
            this._boundingInfo._update(this.worldMatrixFromCache);
            this._updateSubMeshesBoundingInfo(this.worldMatrixFromCache);
        };
        AbstractMesh.prototype._updateSubMeshesBoundingInfo = function (matrix) {
            if (!this.subMeshes) {
                return;
            }
            for (var subIndex = 0; subIndex < this.subMeshes.length; subIndex++) {
                var subMesh = this.subMeshes[subIndex];
                subMesh.updateBoundingInfo(matrix);
            }
        };
        AbstractMesh.prototype.computeWorldMatrix = function (force) {
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
            BABYLON.Matrix.ScalingToRef(this.scaling.x * this.scalingDeterminant, this.scaling.y * this.scalingDeterminant, this.scaling.z * this.scalingDeterminant, this._localScaling);
            // Rotation
            if (this.rotationQuaternion) {
                this.rotationQuaternion.toRotationMatrix(this._localRotation);
                this._cache.rotationQuaternion.copyFrom(this.rotationQuaternion);
            }
            else {
                BABYLON.Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, this._localRotation);
                this._cache.rotation.copyFrom(this.rotation);
            }
            // Translation
            if (this.infiniteDistance && !this.parent) {
                var camera = this.getScene().activeCamera;
                if (camera) {
                    var cameraWorldMatrix = camera.getWorldMatrix();
                    var cameraGlobalPosition = new BABYLON.Vector3(cameraWorldMatrix.m[12], cameraWorldMatrix.m[13], cameraWorldMatrix.m[14]);
                    BABYLON.Matrix.TranslationToRef(this.position.x + cameraGlobalPosition.x, this.position.y + cameraGlobalPosition.y, this.position.z + cameraGlobalPosition.z, this._localTranslation);
                }
            }
            else {
                BABYLON.Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, this._localTranslation);
            }
            // Composing transformations
            this._pivotMatrix.multiplyToRef(this._localScaling, this._localPivotScaling);
            this._localPivotScaling.multiplyToRef(this._localRotation, this._localPivotScalingRotation);
            // Billboarding
            if (this.billboardMode !== AbstractMesh.BILLBOARDMODE_NONE && this.getScene().activeCamera) {
                var localPosition = this.position.clone();
                var zero = this.getScene().activeCamera.globalPosition.clone();
                if (this.parent && this.parent.position) {
                    localPosition.addInPlace(this.parent.position);
                    BABYLON.Matrix.TranslationToRef(localPosition.x, localPosition.y, localPosition.z, this._localTranslation);
                }
                if ((this.billboardMode & AbstractMesh.BILLBOARDMODE_ALL) !== AbstractMesh.BILLBOARDMODE_ALL) {
                    if (this.billboardMode & AbstractMesh.BILLBOARDMODE_X)
                        zero.x = localPosition.x + BABYLON.Engine.Epsilon;
                    if (this.billboardMode & AbstractMesh.BILLBOARDMODE_Y)
                        zero.y = localPosition.y + 0.001;
                    if (this.billboardMode & AbstractMesh.BILLBOARDMODE_Z)
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
            if (this.parent && this.parent.getWorldMatrix && this.billboardMode === AbstractMesh.BILLBOARDMODE_NONE) {
                this._markSyncedWithParent();
                if (this._meshToBoneReferal) {
                    if (!this._localMeshReferalTransform) {
                        this._localMeshReferalTransform = BABYLON.Matrix.Zero();
                    }
                    this._localWorld.multiplyToRef(this.parent.getWorldMatrix(), this._localMeshReferalTransform);
                    this._localMeshReferalTransform.multiplyToRef(this._meshToBoneReferal.getWorldMatrix(), this._worldMatrix);
                }
                else {
                    this._localWorld.multiplyToRef(this.parent.getWorldMatrix(), this._worldMatrix);
                }
            }
            else {
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
        };
        /**
        * If you'd like to be callbacked after the mesh position, rotation or scaling has been updated
        * @param func: callback function to add
        */
        AbstractMesh.prototype.registerAfterWorldMatrixUpdate = function (func) {
            this._onAfterWorldMatrixUpdate.push(func);
        };
        AbstractMesh.prototype.unregisterAfterWorldMatrixUpdate = function (func) {
            var index = this._onAfterWorldMatrixUpdate.indexOf(func);
            if (index > -1) {
                this._onAfterWorldMatrixUpdate.splice(index, 1);
            }
        };
        AbstractMesh.prototype.setPositionWithLocalVector = function (vector3) {
            this.computeWorldMatrix();
            this.position = BABYLON.Vector3.TransformNormal(vector3, this._localWorld);
        };
        AbstractMesh.prototype.getPositionExpressedInLocalSpace = function () {
            this.computeWorldMatrix();
            var invLocalWorldMatrix = this._localWorld.clone();
            invLocalWorldMatrix.invert();
            return BABYLON.Vector3.TransformNormal(this.position, invLocalWorldMatrix);
        };
        AbstractMesh.prototype.locallyTranslate = function (vector3) {
            this.computeWorldMatrix(true);
            this.position = BABYLON.Vector3.TransformCoordinates(vector3, this._localWorld);
        };
        AbstractMesh.prototype.lookAt = function (targetPoint, yawCor, pitchCor, rollCor) {
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
            this.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(yaw + yawCor, pitch + pitchCor, rollCor);
        };
        AbstractMesh.prototype.attachToBone = function (bone, affectedMesh) {
            this._meshToBoneReferal = affectedMesh;
            this.parent = bone;
            if (bone.getWorldMatrix().determinant() < 0) {
                this.scalingDeterminant *= -1;
            }
        };
        AbstractMesh.prototype.detachFromBone = function () {
            if (this.parent.getWorldMatrix().determinant() < 0) {
                this.scalingDeterminant *= -1;
            }
            this._meshToBoneReferal = null;
            this.parent = null;
        };
        AbstractMesh.prototype.isInFrustum = function (frustumPlanes) {
            return this._boundingInfo.isInFrustum(frustumPlanes);
        };
        AbstractMesh.prototype.isCompletelyInFrustum = function (camera) {
            if (!camera) {
                camera = this.getScene().activeCamera;
            }
            var transformMatrix = camera.getViewMatrix().multiply(camera.getProjectionMatrix());
            if (!this._boundingInfo.isCompletelyInFrustum(BABYLON.Frustum.GetPlanes(transformMatrix))) {
                return false;
            }
            return true;
        };
        AbstractMesh.prototype.intersectsMesh = function (mesh, precise) {
            if (!this._boundingInfo || !mesh._boundingInfo) {
                return false;
            }
            return this._boundingInfo.intersects(mesh._boundingInfo, precise);
        };
        AbstractMesh.prototype.intersectsPoint = function (point) {
            if (!this._boundingInfo) {
                return false;
            }
            return this._boundingInfo.intersectsPoint(point);
        };
        // Physics
        AbstractMesh.prototype.setPhysicsState = function (impostor, options) {
            var physicsEngine = this.getScene().getPhysicsEngine();
            if (!physicsEngine) {
                return null;
            }
            impostor = impostor || BABYLON.PhysicsEngine.NoImpostor;
            if (impostor.impostor) {
                // Old API
                options = impostor;
                impostor = impostor.impostor;
            }
            if (impostor === BABYLON.PhysicsEngine.NoImpostor) {
                physicsEngine._unregisterMesh(this);
                return null;
            }
            if (!options) {
                options = { mass: 0, friction: 0.2, restitution: 0.2 };
            }
            else {
                if (!options.mass && options.mass !== 0)
                    options.mass = 0;
                if (!options.friction && options.friction !== 0)
                    options.friction = 0.2;
                if (!options.restitution && options.restitution !== 0)
                    options.restitution = 0.2;
            }
            this._physicImpostor = impostor;
            this._physicsMass = options.mass;
            this._physicsFriction = options.friction;
            this._physicRestitution = options.restitution;
            return physicsEngine._registerMesh(this, impostor, options);
        };
        AbstractMesh.prototype.getPhysicsImpostor = function () {
            if (!this._physicImpostor) {
                return BABYLON.PhysicsEngine.NoImpostor;
            }
            return this._physicImpostor;
        };
        AbstractMesh.prototype.getPhysicsMass = function () {
            if (!this._physicsMass) {
                return 0;
            }
            return this._physicsMass;
        };
        AbstractMesh.prototype.getPhysicsFriction = function () {
            if (!this._physicsFriction) {
                return 0;
            }
            return this._physicsFriction;
        };
        AbstractMesh.prototype.getPhysicsRestitution = function () {
            if (!this._physicRestitution) {
                return 0;
            }
            return this._physicRestitution;
        };
        AbstractMesh.prototype.getPositionInCameraSpace = function (camera) {
            if (!camera) {
                camera = this.getScene().activeCamera;
            }
            return BABYLON.Vector3.TransformCoordinates(this.absolutePosition, camera.getViewMatrix());
        };
        AbstractMesh.prototype.getDistanceToCamera = function (camera) {
            if (!camera) {
                camera = this.getScene().activeCamera;
            }
            return this.absolutePosition.subtract(camera.position).length();
        };
        AbstractMesh.prototype.applyImpulse = function (force, contactPoint) {
            if (!this._physicImpostor) {
                return;
            }
            this.getScene().getPhysicsEngine()._applyImpulse(this, force, contactPoint);
        };
        AbstractMesh.prototype.setPhysicsLinkWith = function (otherMesh, pivot1, pivot2, options) {
            if (!this._physicImpostor) {
                return;
            }
            this.getScene().getPhysicsEngine()._createLink(this, otherMesh, pivot1, pivot2, options);
        };
        AbstractMesh.prototype.updatePhysicsBodyPosition = function () {
            if (!this._physicImpostor) {
                return;
            }
            this.getScene().getPhysicsEngine()._updateBodyPosition(this);
        };
        Object.defineProperty(AbstractMesh.prototype, "checkCollisions", {
            // Collisions
            get: function () {
                return this._checkCollisions;
            },
            set: function (collisionEnabled) {
                this._checkCollisions = collisionEnabled;
                if (this.getScene().workerCollisions) {
                    this.getScene().collisionCoordinator.onMeshUpdated(this);
                }
            },
            enumerable: true,
            configurable: true
        });
        AbstractMesh.prototype.moveWithCollisions = function (velocity) {
            var globalPosition = this.getAbsolutePosition();
            globalPosition.subtractFromFloatsToRef(0, this.ellipsoid.y, 0, this._oldPositionForCollisions);
            this._oldPositionForCollisions.addInPlace(this.ellipsoidOffset);
            this._collider.radius = this.ellipsoid;
            this.getScene().collisionCoordinator.getNewPosition(this._oldPositionForCollisions, velocity, this._collider, 3, this, this._onCollisionPositionChange, this.uniqueId);
        };
        // Submeshes octree
        /**
        * This function will create an octree to help select the right submeshes for rendering, picking and collisions
        * Please note that you must have a decent number of submeshes to get performance improvements when using octree
        */
        AbstractMesh.prototype.createOrUpdateSubmeshesOctree = function (maxCapacity, maxDepth) {
            if (maxCapacity === void 0) { maxCapacity = 64; }
            if (maxDepth === void 0) { maxDepth = 2; }
            if (!this._submeshesOctree) {
                this._submeshesOctree = new BABYLON.Octree(BABYLON.Octree.CreationFuncForSubMeshes, maxCapacity, maxDepth);
            }
            this.computeWorldMatrix(true);
            // Update octree
            var bbox = this.getBoundingInfo().boundingBox;
            this._submeshesOctree.update(bbox.minimumWorld, bbox.maximumWorld, this.subMeshes);
            return this._submeshesOctree;
        };
        // Collisions
        AbstractMesh.prototype._collideForSubMesh = function (subMesh, transformMatrix, collider) {
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
            collider._collide(subMesh._trianglePlanes, subMesh._lastColliderWorldVertices, this.getIndices(), subMesh.indexStart, subMesh.indexStart + subMesh.indexCount, subMesh.verticesStart, !!subMesh.getMaterial());
            if (collider.collisionFound) {
                collider.collidedMesh = this;
            }
        };
        AbstractMesh.prototype._processCollisionsForSubMeshes = function (collider, transformMatrix) {
            var subMeshes;
            var len;
            // Octrees
            if (this._submeshesOctree && this.useOctreeForCollisions) {
                var radius = collider.velocityWorldLength + Math.max(collider.radius.x, collider.radius.y, collider.radius.z);
                var intersections = this._submeshesOctree.intersects(collider.basePointWorld, radius);
                len = intersections.length;
                subMeshes = intersections.data;
            }
            else {
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
        };
        AbstractMesh.prototype._checkCollision = function (collider) {
            // Bounding box test
            if (!this._boundingInfo._checkCollision(collider))
                return;
            // Transformation matrix
            BABYLON.Matrix.ScalingToRef(1.0 / collider.radius.x, 1.0 / collider.radius.y, 1.0 / collider.radius.z, this._collisionsScalingMatrix);
            this.worldMatrixFromCache.multiplyToRef(this._collisionsScalingMatrix, this._collisionsTransformMatrix);
            this._processCollisionsForSubMeshes(collider, this._collisionsTransformMatrix);
        };
        // Picking
        AbstractMesh.prototype._generatePointsArray = function () {
            return false;
        };
        AbstractMesh.prototype.intersects = function (ray, fastCheck) {
            var pickingInfo = new BABYLON.PickingInfo();
            if (!this.subMeshes || !this._boundingInfo || !ray.intersectsSphere(this._boundingInfo.boundingSphere) || !ray.intersectsBox(this._boundingInfo.boundingBox)) {
                return pickingInfo;
            }
            if (!this._generatePointsArray()) {
                return pickingInfo;
            }
            var intersectInfo = null;
            // Octrees
            var subMeshes;
            var len;
            if (this._submeshesOctree && this.useOctreeForPicking) {
                var worldRay = BABYLON.Ray.Transform(ray, this.getWorldMatrix());
                var intersections = this._submeshesOctree.intersectsRay(worldRay);
                len = intersections.length;
                subMeshes = intersections.data;
            }
            else {
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
                var worldOrigin = BABYLON.Vector3.TransformCoordinates(ray.origin, world);
                var direction = ray.direction.clone();
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
                pickingInfo.subMeshId = intersectInfo.subMeshId;
                return pickingInfo;
            }
            return pickingInfo;
        };
        AbstractMesh.prototype.clone = function (name, newParent, doNotCloneChildren) {
            return null;
        };
        AbstractMesh.prototype.releaseSubMeshes = function () {
            if (this.subMeshes) {
                while (this.subMeshes.length) {
                    this.subMeshes[0].dispose();
                }
            }
            else {
                this.subMeshes = new Array();
            }
        };
        AbstractMesh.prototype.dispose = function (doNotRecurse) {
            var index;
            // Physics
            if (this.getPhysicsImpostor() !== BABYLON.PhysicsEngine.NoImpostor) {
                this.setPhysicsState(BABYLON.PhysicsEngine.NoImpostor);
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
            }
            else {
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
        };
        // Statics
        AbstractMesh._BILLBOARDMODE_NONE = 0;
        AbstractMesh._BILLBOARDMODE_X = 1;
        AbstractMesh._BILLBOARDMODE_Y = 2;
        AbstractMesh._BILLBOARDMODE_Z = 4;
        AbstractMesh._BILLBOARDMODE_ALL = 7;
        return AbstractMesh;
    })(BABYLON.Node);
    BABYLON.AbstractMesh = AbstractMesh;
})(BABYLON || (BABYLON = {}));
