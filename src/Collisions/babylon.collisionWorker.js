var BABYLON;
(function (BABYLON) {
    //If this file is included in the main thread, this will be initialized.
    BABYLON.WorkerIncluded = true;
    var CollisionCache = (function () {
        function CollisionCache() {
            this._meshes = {};
            this._geometries = {};
        }
        CollisionCache.prototype.getMeshes = function () {
            return this._meshes;
        };
        CollisionCache.prototype.getGeometries = function () {
            return this._geometries;
        };
        CollisionCache.prototype.getMesh = function (id) {
            return this._meshes[id];
        };
        CollisionCache.prototype.addMesh = function (mesh) {
            this._meshes[mesh.uniqueId] = mesh;
        };
        CollisionCache.prototype.removeMesh = function (uniqueId) {
            delete this._meshes[uniqueId];
        };
        CollisionCache.prototype.getGeometry = function (id) {
            return this._geometries[id];
        };
        CollisionCache.prototype.addGeometry = function (geometry) {
            this._geometries[geometry.id] = geometry;
        };
        CollisionCache.prototype.removeGeometry = function (id) {
            delete this._geometries[id];
        };
        return CollisionCache;
    }());
    BABYLON.CollisionCache = CollisionCache;
    var CollideWorker = (function () {
        function CollideWorker(collider, _collisionCache, finalPosition) {
            this.collider = collider;
            this._collisionCache = _collisionCache;
            this.finalPosition = finalPosition;
            this.collisionsScalingMatrix = BABYLON.Matrix.Zero();
            this.collisionTranformationMatrix = BABYLON.Matrix.Zero();
        }
        CollideWorker.prototype.collideWithWorld = function (position, velocity, maximumRetry, excludedMeshUniqueId) {
            //TODO CollisionsEpsilon should be defined here and not in the engine.
            var closeDistance = 0.01; //is initializing here correct? A quick look - looks like it is fine.
            if (this.collider.retry >= maximumRetry) {
                this.finalPosition.copyFrom(position);
                return;
            }
            this.collider._initialize(position, velocity, closeDistance);
            // Check all meshes
            var meshes = this._collisionCache.getMeshes();
            var keys = Object.keys(meshes);
            var len = keys.length;
            var uniqueId;
            for (var i = 0; i < len; ++i) {
                uniqueId = keys[i];
                if (parseInt(uniqueId) != excludedMeshUniqueId) {
                    var mesh = meshes[uniqueId];
                    if (mesh.checkCollisions)
                        this.checkCollision(mesh);
                }
            }
            if (!this.collider.collisionFound) {
                position.addToRef(velocity, this.finalPosition);
                return;
            }
            if (velocity.x !== 0 || velocity.y !== 0 || velocity.z !== 0) {
                this.collider._getResponse(position, velocity);
            }
            if (velocity.length() <= closeDistance) {
                this.finalPosition.copyFrom(position);
                return;
            }
            this.collider.retry++;
            this.collideWithWorld(position, velocity, maximumRetry, excludedMeshUniqueId);
        };
        CollideWorker.prototype.checkCollision = function (mesh) {
            if (!this.collider._canDoCollision(BABYLON.Vector3.FromArray(mesh.sphereCenter), mesh.sphereRadius, BABYLON.Vector3.FromArray(mesh.boxMinimum), BABYLON.Vector3.FromArray(mesh.boxMaximum))) {
                return;
            }
            ;
            // Transformation matrix
            BABYLON.Matrix.ScalingToRef(1.0 / this.collider.radius.x, 1.0 / this.collider.radius.y, 1.0 / this.collider.radius.z, this.collisionsScalingMatrix);
            var worldFromCache = BABYLON.Matrix.FromArray(mesh.worldMatrixFromCache);
            worldFromCache.multiplyToRef(this.collisionsScalingMatrix, this.collisionTranformationMatrix);
            this.processCollisionsForSubMeshes(this.collisionTranformationMatrix, mesh);
            //return colTransMat;
        };
        CollideWorker.prototype.processCollisionsForSubMeshes = function (transformMatrix, mesh) {
            //if (this._submeshesOctree && this.useOctreeForCollisions) {
            //    var radius = collider.velocityWorldLength + Math.max(collider.radius.x, collider.radius.y, collider.radius.z);
            //    var intersections = this._submeshesOctree.intersects(collider.basePointWorld, radius);
            //    len = intersections.length;
            //    subMeshes = intersections.data;
            //} else {
            var subMeshes = mesh.subMeshes;
            var len = subMeshes.length;
            //}
            if (!mesh.geometryId) {
                console.log("no mesh geometry id");
                return;
            }
            var meshGeometry = this._collisionCache.getGeometry(mesh.geometryId);
            if (!meshGeometry) {
                console.log("couldn't find geometry", mesh.geometryId);
                return;
            }
            for (var index = 0; index < len; index++) {
                var subMesh = subMeshes[index];
                // Bounding test
                if (len > 1 && !this.checkSubmeshCollision(subMesh))
                    continue;
                this.collideForSubMesh(subMesh, transformMatrix, meshGeometry);
                if (this.collider.collisionFound) {
                    this.collider.collidedMesh = mesh.uniqueId;
                }
            }
        };
        CollideWorker.prototype.collideForSubMesh = function (subMesh, transformMatrix, meshGeometry) {
            if (!meshGeometry['positionsArray']) {
                meshGeometry['positionsArray'] = [];
                for (var i = 0, len = meshGeometry.positions.length; i < len; i = i + 3) {
                    var p = BABYLON.Vector3.FromArray([meshGeometry.positions[i], meshGeometry.positions[i + 1], meshGeometry.positions[i + 2]]);
                    meshGeometry['positionsArray'].push(p);
                }
            }
            if (!subMesh['_lastColliderWorldVertices'] || !subMesh['_lastColliderTransformMatrix'].equals(transformMatrix)) {
                subMesh['_lastColliderTransformMatrix'] = transformMatrix.clone();
                subMesh['_lastColliderWorldVertices'] = [];
                subMesh['_trianglePlanes'] = [];
                var start = subMesh.verticesStart;
                var end = (subMesh.verticesStart + subMesh.verticesCount);
                for (var i = start; i < end; i++) {
                    subMesh['_lastColliderWorldVertices'].push(BABYLON.Vector3.TransformCoordinates(meshGeometry['positionsArray'][i], transformMatrix));
                }
            }
            // Collide
            this.collider._collide(subMesh['_trianglePlanes'], subMesh['_lastColliderWorldVertices'], meshGeometry.indices, subMesh.indexStart, subMesh.indexStart + subMesh.indexCount, subMesh.verticesStart, subMesh.hasMaterial);
        };
        CollideWorker.prototype.checkSubmeshCollision = function (subMesh) {
            return this.collider._canDoCollision(BABYLON.Vector3.FromArray(subMesh.sphereCenter), subMesh.sphereRadius, BABYLON.Vector3.FromArray(subMesh.boxMinimum), BABYLON.Vector3.FromArray(subMesh.boxMaximum));
        };
        return CollideWorker;
    }());
    BABYLON.CollideWorker = CollideWorker;
    var CollisionDetectorTransferable = (function () {
        function CollisionDetectorTransferable() {
        }
        CollisionDetectorTransferable.prototype.onInit = function (payload) {
            this._collisionCache = new CollisionCache();
            var reply = {
                error: BABYLON.WorkerReplyType.SUCCESS,
                taskType: BABYLON.WorkerTaskType.INIT
            };
            postMessage(reply, undefined);
        };
        CollisionDetectorTransferable.prototype.onUpdate = function (payload) {
            var _this = this;
            var replay = {
                error: BABYLON.WorkerReplyType.SUCCESS,
                taskType: BABYLON.WorkerTaskType.UPDATE
            };
            try {
                for (var id in payload.updatedGeometries) {
                    if (payload.updatedGeometries.hasOwnProperty(id)) {
                        this._collisionCache.addGeometry(payload.updatedGeometries[id]);
                    }
                }
                for (var uniqueId in payload.updatedMeshes) {
                    if (payload.updatedMeshes.hasOwnProperty(uniqueId)) {
                        this._collisionCache.addMesh(payload.updatedMeshes[uniqueId]);
                    }
                }
                payload.removedGeometries.forEach(function (id) {
                    _this._collisionCache.removeGeometry(id);
                });
                payload.removedMeshes.forEach(function (uniqueId) {
                    _this._collisionCache.removeMesh(uniqueId);
                });
            }
            catch (x) {
                replay.error = BABYLON.WorkerReplyType.UNKNOWN_ERROR;
            }
            postMessage(replay, undefined);
        };
        CollisionDetectorTransferable.prototype.onCollision = function (payload) {
            var finalPosition = BABYLON.Vector3.Zero();
            //create a new collider
            var collider = new BABYLON.Collider();
            collider.radius = BABYLON.Vector3.FromArray(payload.collider.radius);
            var colliderWorker = new CollideWorker(collider, this._collisionCache, finalPosition);
            colliderWorker.collideWithWorld(BABYLON.Vector3.FromArray(payload.collider.position), BABYLON.Vector3.FromArray(payload.collider.velocity), payload.maximumRetry, payload.excludedMeshUniqueId);
            var replyPayload = {
                collidedMeshUniqueId: collider.collidedMesh,
                collisionId: payload.collisionId,
                newPosition: finalPosition.asArray()
            };
            var reply = {
                error: BABYLON.WorkerReplyType.SUCCESS,
                taskType: BABYLON.WorkerTaskType.COLLIDE,
                payload: replyPayload
            };
            postMessage(reply, undefined);
        };
        return CollisionDetectorTransferable;
    }());
    BABYLON.CollisionDetectorTransferable = CollisionDetectorTransferable;
    //check if we are in a web worker, as this code should NOT run on the main UI thread
    try {
        if (self && self instanceof WorkerGlobalScope) {
            //Window hack to allow including babylonjs native code. the <any> is for typescript.
            window = {};
            //scripts were not included, standalone worker
            if (!BABYLON.Collider) {
                importScripts("./babylon.collisionCoordinator.js");
                importScripts("./babylon.collider.js");
                importScripts("../Math/babylon.math.js");
            }
            var collisionDetector = new CollisionDetectorTransferable();
            var onNewMessage = function (event) {
                var message = event.data;
                switch (message.taskType) {
                    case BABYLON.WorkerTaskType.INIT:
                        collisionDetector.onInit(message.payload);
                        break;
                    case BABYLON.WorkerTaskType.COLLIDE:
                        collisionDetector.onCollision(message.payload);
                        break;
                    case BABYLON.WorkerTaskType.UPDATE:
                        collisionDetector.onUpdate(message.payload);
                        break;
                }
            };
            self.onmessage = onNewMessage;
        }
    }
    catch (e) {
        console.log("single worker init");
    }
})(BABYLON || (BABYLON = {}));
