var BABYLON;
(function (BABYLON) {
    //WebWorker code will be inserted to this variable.
    BABYLON.CollisionWorker = "";
    (function (WorkerTaskType) {
        WorkerTaskType[WorkerTaskType["INIT"] = 0] = "INIT";
        WorkerTaskType[WorkerTaskType["UPDATE"] = 1] = "UPDATE";
        WorkerTaskType[WorkerTaskType["COLLIDE"] = 2] = "COLLIDE";
    })(BABYLON.WorkerTaskType || (BABYLON.WorkerTaskType = {}));
    var WorkerTaskType = BABYLON.WorkerTaskType;
    (function (WorkerReplyType) {
        WorkerReplyType[WorkerReplyType["SUCCESS"] = 0] = "SUCCESS";
        WorkerReplyType[WorkerReplyType["UNKNOWN_ERROR"] = 1] = "UNKNOWN_ERROR";
    })(BABYLON.WorkerReplyType || (BABYLON.WorkerReplyType = {}));
    var WorkerReplyType = BABYLON.WorkerReplyType;
    var CollisionCoordinatorWorker = (function () {
        function CollisionCoordinatorWorker() {
            var _this = this;
            this._scaledPosition = BABYLON.Vector3.Zero();
            this._scaledVelocity = BABYLON.Vector3.Zero();
            this.onMeshUpdated = function (mesh) {
                _this._addUpdateMeshesList[mesh.uniqueId] = CollisionCoordinatorWorker.SerializeMesh(mesh);
            };
            this.onGeometryUpdated = function (geometry) {
                _this._addUpdateGeometriesList[geometry.id] = CollisionCoordinatorWorker.SerializeGeometry(geometry);
            };
            this._afterRender = function () {
                if (!_this._init)
                    return;
                if (_this._toRemoveGeometryArray.length == 0 && _this._toRemoveMeshesArray.length == 0 && Object.keys(_this._addUpdateGeometriesList).length == 0 && Object.keys(_this._addUpdateMeshesList).length == 0) {
                    return;
                }
                //5 concurrent updates were sent to the web worker and were not yet processed. Abort next update.
                //TODO make sure update runs as fast as possible to be able to update 60 FPS.
                if (_this._runningUpdated > 4) {
                    return;
                }
                ++_this._runningUpdated;
                var payload = {
                    updatedMeshes: _this._addUpdateMeshesList,
                    updatedGeometries: _this._addUpdateGeometriesList,
                    removedGeometries: _this._toRemoveGeometryArray,
                    removedMeshes: _this._toRemoveMeshesArray
                };
                var message = {
                    payload: payload,
                    taskType: WorkerTaskType.UPDATE
                };
                var serializable = [];
                for (var id in payload.updatedGeometries) {
                    if (payload.updatedGeometries.hasOwnProperty(id)) {
                        //prepare transferables
                        serializable.push(message.payload.updatedGeometries[id].indices.buffer);
                        serializable.push(message.payload.updatedGeometries[id].normals.buffer);
                        serializable.push(message.payload.updatedGeometries[id].positions.buffer);
                    }
                }
                _this._worker.postMessage(message, serializable);
                _this._addUpdateMeshesList = {};
                _this._addUpdateGeometriesList = {};
                _this._toRemoveGeometryArray = [];
                _this._toRemoveMeshesArray = [];
            };
            this._onMessageFromWorker = function (e) {
                var returnData = e.data;
                if (returnData.error != WorkerReplyType.SUCCESS) {
                    //TODO what errors can be returned from the worker?
                    BABYLON.Tools.Warn("error returned from worker!");
                    return;
                }
                switch (returnData.taskType) {
                    case WorkerTaskType.INIT:
                        _this._init = true;
                        //Update the worked with ALL of the scene's current state
                        _this._scene.meshes.forEach(function (mesh) {
                            _this.onMeshAdded(mesh);
                        });
                        _this._scene.getGeometries().forEach(function (geometry) {
                            _this.onGeometryAdded(geometry);
                        });
                        break;
                    case WorkerTaskType.UPDATE:
                        _this._runningUpdated--;
                        break;
                    case WorkerTaskType.COLLIDE:
                        _this._runningCollisionTask = false;
                        var returnPayload = returnData.payload;
                        if (!_this._collisionsCallbackArray[returnPayload.collisionId])
                            return;
                        _this._collisionsCallbackArray[returnPayload.collisionId](returnPayload.collisionId, BABYLON.Vector3.FromArray(returnPayload.newPosition), _this._scene.getMeshByUniqueID(returnPayload.collidedMeshUniqueId));
                        //cleanup
                        _this._collisionsCallbackArray[returnPayload.collisionId] = undefined;
                        break;
                }
            };
            this._collisionsCallbackArray = [];
            this._init = false;
            this._runningUpdated = 0;
            this._runningCollisionTask = false;
            this._addUpdateMeshesList = {};
            this._addUpdateGeometriesList = {};
            this._toRemoveGeometryArray = [];
            this._toRemoveMeshesArray = [];
        }
        CollisionCoordinatorWorker.prototype.getNewPosition = function (position, velocity, collider, maximumRetry, excludedMesh, onNewPosition, collisionIndex) {
            if (!this._init)
                return;
            if (this._collisionsCallbackArray[collisionIndex] || this._collisionsCallbackArray[collisionIndex + 100000])
                return;
            position.divideToRef(collider.radius, this._scaledPosition);
            velocity.divideToRef(collider.radius, this._scaledVelocity);
            this._collisionsCallbackArray[collisionIndex] = onNewPosition;
            var payload = {
                collider: {
                    position: this._scaledPosition.asArray(),
                    velocity: this._scaledVelocity.asArray(),
                    radius: collider.radius.asArray()
                },
                collisionId: collisionIndex,
                excludedMeshUniqueId: excludedMesh ? excludedMesh.uniqueId : null,
                maximumRetry: maximumRetry
            };
            var message = {
                payload: payload,
                taskType: WorkerTaskType.COLLIDE
            };
            this._worker.postMessage(message);
        };
        CollisionCoordinatorWorker.prototype.init = function (scene) {
            this._scene = scene;
            this._scene.registerAfterRender(this._afterRender);
            var workerUrl = BABYLON.WorkerIncluded ? BABYLON.Engine.CodeRepository + "Collisions/babylon.collisionWorker.js" : URL.createObjectURL(new Blob([BABYLON.CollisionWorker], { type: 'application/javascript' }));
            this._worker = new Worker(workerUrl);
            this._worker.onmessage = this._onMessageFromWorker;
            var message = {
                payload: {},
                taskType: WorkerTaskType.INIT
            };
            this._worker.postMessage(message);
        };
        CollisionCoordinatorWorker.prototype.destroy = function () {
            this._scene.unregisterAfterRender(this._afterRender);
            this._worker.terminate();
        };
        CollisionCoordinatorWorker.prototype.onMeshAdded = function (mesh) {
            mesh.registerAfterWorldMatrixUpdate(this.onMeshUpdated);
            this.onMeshUpdated(mesh);
        };
        CollisionCoordinatorWorker.prototype.onMeshRemoved = function (mesh) {
            this._toRemoveMeshesArray.push(mesh.uniqueId);
        };
        CollisionCoordinatorWorker.prototype.onGeometryAdded = function (geometry) {
            //TODO this will break if the user uses his own function. This should be an array of callbacks!
            geometry.onGeometryUpdated = this.onGeometryUpdated;
            this.onGeometryUpdated(geometry);
        };
        CollisionCoordinatorWorker.prototype.onGeometryDeleted = function (geometry) {
            this._toRemoveGeometryArray.push(geometry.id);
        };
        CollisionCoordinatorWorker.SerializeMesh = function (mesh) {
            var submeshes = [];
            if (mesh.subMeshes) {
                submeshes = mesh.subMeshes.map(function (sm, idx) {
                    return {
                        position: idx,
                        verticesStart: sm.verticesStart,
                        verticesCount: sm.verticesCount,
                        indexStart: sm.indexStart,
                        indexCount: sm.indexCount,
                        hasMaterial: !!sm.getMaterial(),
                        sphereCenter: sm.getBoundingInfo().boundingSphere.centerWorld.asArray(),
                        sphereRadius: sm.getBoundingInfo().boundingSphere.radiusWorld,
                        boxMinimum: sm.getBoundingInfo().boundingBox.minimumWorld.asArray(),
                        boxMaximum: sm.getBoundingInfo().boundingBox.maximumWorld.asArray()
                    };
                });
            }
            var geometryId = null;
            if (mesh instanceof BABYLON.Mesh) {
                geometryId = mesh.geometry ? mesh.geometry.id : null;
            }
            else if (mesh instanceof BABYLON.InstancedMesh) {
                geometryId = (mesh.sourceMesh && mesh.sourceMesh.geometry) ? mesh.sourceMesh.geometry.id : null;
            }
            return {
                uniqueId: mesh.uniqueId,
                id: mesh.id,
                name: mesh.name,
                geometryId: geometryId,
                sphereCenter: mesh.getBoundingInfo().boundingSphere.centerWorld.asArray(),
                sphereRadius: mesh.getBoundingInfo().boundingSphere.radiusWorld,
                boxMinimum: mesh.getBoundingInfo().boundingBox.minimumWorld.asArray(),
                boxMaximum: mesh.getBoundingInfo().boundingBox.maximumWorld.asArray(),
                worldMatrixFromCache: mesh.worldMatrixFromCache.asArray(),
                subMeshes: submeshes,
                checkCollisions: mesh.checkCollisions
            };
        };
        CollisionCoordinatorWorker.SerializeGeometry = function (geometry) {
            return {
                id: geometry.id,
                positions: new Float32Array(geometry.getVerticesData(BABYLON.VertexBuffer.PositionKind) || []),
                normals: new Float32Array(geometry.getVerticesData(BABYLON.VertexBuffer.NormalKind) || []),
                indices: new Int32Array(geometry.getIndices() || []),
            };
        };
        return CollisionCoordinatorWorker;
    }());
    BABYLON.CollisionCoordinatorWorker = CollisionCoordinatorWorker;
    var CollisionCoordinatorLegacy = (function () {
        function CollisionCoordinatorLegacy() {
            this._scaledPosition = BABYLON.Vector3.Zero();
            this._scaledVelocity = BABYLON.Vector3.Zero();
            this._finalPosition = BABYLON.Vector3.Zero();
        }
        CollisionCoordinatorLegacy.prototype.getNewPosition = function (position, velocity, collider, maximumRetry, excludedMesh, onNewPosition, collisionIndex) {
            position.divideToRef(collider.radius, this._scaledPosition);
            velocity.divideToRef(collider.radius, this._scaledVelocity);
            collider.collidedMesh = null;
            collider.retry = 0;
            collider.initialVelocity = this._scaledVelocity;
            collider.initialPosition = this._scaledPosition;
            this._collideWithWorld(this._scaledPosition, this._scaledVelocity, collider, maximumRetry, this._finalPosition, excludedMesh);
            this._finalPosition.multiplyInPlace(collider.radius);
            //run the callback
            onNewPosition(collisionIndex, this._finalPosition, collider.collidedMesh);
        };
        CollisionCoordinatorLegacy.prototype.init = function (scene) {
            this._scene = scene;
        };
        CollisionCoordinatorLegacy.prototype.destroy = function () {
            //Legacy need no destruction method.
        };
        //No update in legacy mode
        CollisionCoordinatorLegacy.prototype.onMeshAdded = function (mesh) { };
        CollisionCoordinatorLegacy.prototype.onMeshUpdated = function (mesh) { };
        CollisionCoordinatorLegacy.prototype.onMeshRemoved = function (mesh) { };
        CollisionCoordinatorLegacy.prototype.onGeometryAdded = function (geometry) { };
        CollisionCoordinatorLegacy.prototype.onGeometryUpdated = function (geometry) { };
        CollisionCoordinatorLegacy.prototype.onGeometryDeleted = function (geometry) { };
        CollisionCoordinatorLegacy.prototype._collideWithWorld = function (position, velocity, collider, maximumRetry, finalPosition, excludedMesh) {
            if (excludedMesh === void 0) { excludedMesh = null; }
            var closeDistance = BABYLON.Engine.CollisionsEpsilon * 10.0;
            if (collider.retry >= maximumRetry) {
                finalPosition.copyFrom(position);
                return;
            }
            collider._initialize(position, velocity, closeDistance);
            // Check all meshes
            for (var index = 0; index < this._scene.meshes.length; index++) {
                var mesh = this._scene.meshes[index];
                if (mesh.isEnabled() && mesh.checkCollisions && mesh.subMeshes && mesh !== excludedMesh) {
                    mesh._checkCollision(collider);
                }
            }
            if (!collider.collisionFound) {
                position.addToRef(velocity, finalPosition);
                return;
            }
            if (velocity.x !== 0 || velocity.y !== 0 || velocity.z !== 0) {
                collider._getResponse(position, velocity);
            }
            if (velocity.length() <= closeDistance) {
                finalPosition.copyFrom(position);
                return;
            }
            collider.retry++;
            this._collideWithWorld(position, velocity, collider, maximumRetry, finalPosition, excludedMesh);
        };
        return CollisionCoordinatorLegacy;
    }());
    BABYLON.CollisionCoordinatorLegacy = CollisionCoordinatorLegacy;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.collisionCoordinator.js.map