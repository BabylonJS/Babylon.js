module BABYLON {

    //If this file is included in the main thread, this will be initialized.
    export var WorkerIncluded: boolean = true;

    export class CollisionCache {
        private _meshes: { [n: number]: SerializedMesh; } = {};
        private _geometries: { [s: number]: SerializedGeometry; } = {};

        public getMeshes(): { [n: number]: SerializedMesh; } {
            return this._meshes;
        }

        public getGeometries(): { [s: number]: SerializedGeometry; } {
            return this._geometries;
        }

        public getMesh(id: any): SerializedMesh {
            return this._meshes[id];
        }

        public addMesh(mesh: SerializedMesh) {
            this._meshes[mesh.uniqueId] = mesh;
        }

        public removeMesh(uniqueId: number) {
            delete this._meshes[uniqueId];
        }

        public getGeometry(id: string): SerializedGeometry {
            return this._geometries[id];
        }

        public addGeometry(geometry: SerializedGeometry) {
            this._geometries[geometry.id] = geometry;
        }

        public removeGeometry(id: string) {
            delete this._geometries[id];
        }
    }

    export class CollideWorker {

        private collisionsScalingMatrix = Matrix.Zero();
        private collisionTranformationMatrix = Matrix.Zero();

        constructor(public collider: Collider, private _collisionCache: CollisionCache, private finalPosition: Vector3) {

        }

        public collideWithWorld(position: Vector3, velocity: Vector3, maximumRetry: number, excludedMeshUniqueId?: number) {

            //TODO CollisionsEpsilon should be defined here and not in the engine.
            const closeDistance = 0.01; //is initializing here correct? A quick look - looks like it is fine.
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
                    var mesh: SerializedMesh = meshes[uniqueId];
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
        }

        private checkCollision(mesh: SerializedMesh) {

            if (!this.collider._canDoCollision(Vector3.FromArray(mesh.sphereCenter), mesh.sphereRadius, Vector3.FromArray(mesh.boxMinimum), Vector3.FromArray(mesh.boxMaximum))) {
                return;
            };

            // Transformation matrix
            Matrix.ScalingToRef(1.0 / this.collider.radius.x, 1.0 / this.collider.radius.y, 1.0 / this.collider.radius.z, this.collisionsScalingMatrix);
            var worldFromCache = Matrix.FromArray(mesh.worldMatrixFromCache);
            worldFromCache.multiplyToRef(this.collisionsScalingMatrix, this.collisionTranformationMatrix);

            this.processCollisionsForSubMeshes(this.collisionTranformationMatrix, mesh);
            //return colTransMat;
        }

        private processCollisionsForSubMeshes(transformMatrix: Matrix, mesh: SerializedMesh): void { // No Octrees for now
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
                    this.collider.collidedMesh = <any>mesh.uniqueId;
                }
            }
        }

        private collideForSubMesh(subMesh: SerializedSubMesh, transformMatrix: Matrix, meshGeometry: SerializedGeometry): void {
            if (!meshGeometry['positionsArray']) {
                meshGeometry['positionsArray'] = [];
                for (var i = 0, len = meshGeometry.positions.length; i < len; i = i + 3) {
                    var p = Vector3.FromArray([meshGeometry.positions[i], meshGeometry.positions[i + 1], meshGeometry.positions[i + 2]]);
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
                    subMesh['_lastColliderWorldVertices'].push(Vector3.TransformCoordinates(meshGeometry['positionsArray'][i], transformMatrix));
                }
            }        

            // Collide
            this.collider._collide(subMesh['_trianglePlanes'], subMesh['_lastColliderWorldVertices'], <any>meshGeometry.indices, subMesh.indexStart, subMesh.indexStart + subMesh.indexCount, subMesh.verticesStart, subMesh.hasMaterial);

        }

        private checkSubmeshCollision(subMesh: SerializedSubMesh): boolean {
            return this.collider._canDoCollision(Vector3.FromArray(subMesh.sphereCenter), subMesh.sphereRadius, Vector3.FromArray(subMesh.boxMinimum), Vector3.FromArray(subMesh.boxMaximum));
        }
    }

    export interface ICollisionDetector {
        onInit(payload: InitPayload): void;
        onUpdate(payload: UpdatePayload): void;
        onCollision(payload: CollidePayload): void;
    }

    export class CollisionDetectorTransferable implements ICollisionDetector {
        private _collisionCache: CollisionCache;

        public onInit(payload: InitPayload) {
            this._collisionCache = new CollisionCache();
            var reply: WorkerReply = {
                error: WorkerReplyType.SUCCESS,
                taskType: WorkerTaskType.INIT
            }
            postMessage(reply, undefined);
        }

        public onUpdate(payload: UpdatePayload) {
            var replay: WorkerReply = {
                error: WorkerReplyType.SUCCESS,
                taskType: WorkerTaskType.UPDATE
            }

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

                payload.removedGeometries.forEach((id) => {
                    this._collisionCache.removeGeometry(id);
                });

                payload.removedMeshes.forEach((uniqueId) => {
                    this._collisionCache.removeMesh(uniqueId);
                });

            } catch (x) {
                replay.error = WorkerReplyType.UNKNOWN_ERROR;
            }


            postMessage(replay, undefined);
        }

        public onCollision(payload: CollidePayload) {
            var finalPosition = Vector3.Zero();
            //create a new collider
            var collider = new Collider();
            collider.radius = Vector3.FromArray(payload.collider.radius);

            var colliderWorker = new CollideWorker(collider, this._collisionCache, finalPosition);
            colliderWorker.collideWithWorld(Vector3.FromArray(payload.collider.position), Vector3.FromArray(payload.collider.velocity), payload.maximumRetry, payload.excludedMeshUniqueId);
            var replyPayload: CollisionReplyPayload = {
                collidedMeshUniqueId: <any>collider.collidedMesh,
                collisionId: payload.collisionId,
                newPosition: finalPosition.asArray()
            }
            var reply: WorkerReply = {
                error: WorkerReplyType.SUCCESS,
                taskType: WorkerTaskType.COLLIDE,
                payload: replyPayload
            }
            postMessage(reply, undefined);
        }
    }

    //TypeScript doesn't know WorkerGlobalScope
    declare class WorkerGlobalScope { }

    //check if we are in a web worker, as this code should NOT run on the main UI thread
    try {
        if (self && self instanceof WorkerGlobalScope) {

            //Window hack to allow including babylonjs native code. the <any> is for typescript.
            window = <any>{};

            //scripts were not included, standalone worker
            if (!BABYLON.Collider) {
                importScripts("./babylon.collisionCoordinator.js");
                importScripts("./babylon.collider.js");
                importScripts("../Math/babylon.math.js");
            }

            var collisionDetector: ICollisionDetector = new CollisionDetectorTransferable();

            var onNewMessage = (event: MessageEvent) => {
                var message = <BabylonMessage>event.data;
                switch (message.taskType) {
                case WorkerTaskType.INIT:
                    collisionDetector.onInit(<InitPayload>message.payload);
                    break;
                case WorkerTaskType.COLLIDE:
                    collisionDetector.onCollision(<CollidePayload>message.payload);
                    break;
                case WorkerTaskType.UPDATE:
                    collisionDetector.onUpdate(<UpdatePayload>message.payload);
                    break;
                }
            }

            self.onmessage = onNewMessage;
        }
    } catch (e) {
        console.log("single worker init");
    }
}
