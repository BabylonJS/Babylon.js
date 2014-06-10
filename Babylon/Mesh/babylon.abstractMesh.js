var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var AbstractMesh = (function (_super) {
        __extends(AbstractMesh, _super);
        function AbstractMesh(name, scene) {
            _super.call(this, name, scene);
            // Properties
            this.position = new BABYLON.Vector3(0, 0, 0);
            this.rotation = new BABYLON.Vector3(0, 0, 0);
            this.scaling = new BABYLON.Vector3(1, 1, 1);
            this.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_NONE;
            this.visibility = 1.0;
            this.infiniteDistance = false;
            this.isVisible = true;
            this.isPickable = true;
            this.showBoundingBox = false;
            this.showSubMeshesBoundingBox = false;
            this.onDispose = null;
            this.checkCollisions = false;
            this.renderingGroupId = 0;
            this.receiveShadows = false;
            this.useOctreeForRenderingSelection = true;
            this.useOctreeForPicking = true;
            this.useOctreeForCollisions = true;
            this.layerMask = 0xFFFFFFFF;
            // Physics
            this._physicImpostor = BABYLON.PhysicsEngine.NoImpostor;
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

            scene.meshes.push(this);
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
            return this._boundingInfo;
        };

        AbstractMesh.prototype._preActivate = function () {
        };

        AbstractMesh.prototype._activate = function (renderId) {
            this._renderId = renderId;
        };

        AbstractMesh.prototype.getWorldMatrix = function () {
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

        AbstractMesh.prototype.rotate = function (axis, amount, space) {
            if (!this.rotationQuaternion) {
                this.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
                this.rotation = BABYLON.Vector3.Zero();
            }

            if (!space || space == 0 /* LOCAL */) {
                var rotationQuaternion = BABYLON.Quaternion.RotationAxis(axis, amount);
                this.rotationQuaternion = this.rotationQuaternion.multiply(rotationQuaternion);
            } else {
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

            if (!space || space == 0 /* LOCAL */) {
                var tempV3 = this.getPositionExpressedInLocalSpace().add(displacementVector);
                this.setPositionWithLocalVector(tempV3);
            } else {
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
            } else {
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
            } else {
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

            if (!this.subMeshes) {
                return;
            }

            for (var subIndex = 0; subIndex < this.subMeshes.length; subIndex++) {
                var subMesh = this.subMeshes[subIndex];

                subMesh.updateBoundingInfo(this.worldMatrixFromCache);
            }
        };

        AbstractMesh.prototype.computeWorldMatrix = function (force) {
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

                if (this.parent && this.parent.position) {
                    localPosition.addInPlace(this.parent.position);
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
            this.computeWorldMatrix();

            this.position = BABYLON.Vector3.TransformCoordinates(vector3, this._localWorld);
        };

        AbstractMesh.prototype.lookAt = function (targetPoint, yawCor, pitchCor, rollCor) {
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
        };

        AbstractMesh.prototype.isInFrustum = function (frustumPlanes) {
            if (!this._boundingInfo.isInFrustum(frustumPlanes)) {
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
                return;
            }

            if (impostor.impostor) {
                // Old API
                options = impostor;
                impostor = impostor.impostor;
            }

            impostor = impostor || BABYLON.PhysicsEngine.NoImpostor;

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

        AbstractMesh.prototype.applyImpulse = function (force, contactPoint) {
            if (!this._physicImpostor) {
                return;
            }

            this.getScene().getPhysicsEngine()._applyImpulse(this, force, contactPoint);
        };

        AbstractMesh.prototype.setPhysicsLinkWith = function (otherMesh, pivot1, pivot2) {
            if (!this._physicImpostor) {
                return;
            }

            this.getScene().getPhysicsEngine()._createLink(this, otherMesh, pivot1, pivot2);
        };

        // Submeshes octree
        /**
        * This function will create an octree to help select the right submeshes for rendering, picking and collisions
        * Please note that you must have a decent number of submeshes to get performance improvements when using octree
        */
        AbstractMesh.prototype.createOrUpdateSubmeshesOctree = function (maxCapacity, maxDepth) {
            if (typeof maxCapacity === "undefined") { maxCapacity = 64; }
            if (typeof maxDepth === "undefined") { maxDepth = 2; }
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
            collider._collide(subMesh, subMesh._lastColliderWorldVertices, this.getIndices(), subMesh.indexStart, subMesh.indexStart + subMesh.indexCount, subMesh.verticesStart);
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
        };

        AbstractMesh.prototype.clone = function (name, newParent, doNotCloneChildren) {
            return null;
        };

        AbstractMesh.prototype.releaseSubMeshes = function () {
            if (this.subMeshes) {
                while (this.subMeshes.length) {
                    this.subMeshes[0].dispose();
                }
            } else {
                this.subMeshes = new Array();
            }
        };

        AbstractMesh.prototype.dispose = function (doNotRecurse) {
            // Physics
            if (this.getPhysicsImpostor() != BABYLON.PhysicsEngine.NoImpostor) {
                this.setPhysicsState(BABYLON.PhysicsEngine.NoImpostor);
            }

            // SubMeshes
            this.releaseSubMeshes();

            // Remove from scene
            var index = this.getScene().meshes.indexOf(this);
            this.getScene().meshes.splice(index, 1);

            if (!doNotRecurse) {
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
        };
        AbstractMesh._BILLBOARDMODE_NONE = 0;
        AbstractMesh._BILLBOARDMODE_X = 1;
        AbstractMesh._BILLBOARDMODE_Y = 2;
        AbstractMesh._BILLBOARDMODE_Z = 4;
        AbstractMesh._BILLBOARDMODE_ALL = 7;
        return AbstractMesh;
    })(BABYLON.Node);
    BABYLON.AbstractMesh = AbstractMesh;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.abstractMesh.js.map
