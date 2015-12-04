module BABYLON {

    //WebWorker code will be inserted to this variable.
    export var CollisionWorker = "";

    export interface ICollisionCoordinator {
        getNewPosition(position: Vector3, velocity: Vector3, collider: Collider, maximumRetry: number, excludedMesh: AbstractMesh, onNewPosition: (collisionIndex: number, newPosition: Vector3, collidedMesh?: AbstractMesh) => void, collisionIndex: number): void;
        init(scene: Scene): void;
        destroy(): void;

        //Update meshes and geometries
        onMeshAdded(mesh: AbstractMesh);
        onMeshUpdated(mesh: AbstractMesh);
        onMeshRemoved(mesh: AbstractMesh);
        onGeometryAdded(geometry: Geometry);
        onGeometryUpdated(geometry: Geometry);
        onGeometryDeleted(geometry: Geometry);
    }

    export interface SerializedMesh {
        id: string;
        name: string;
        uniqueId: number;
        geometryId: string;
        sphereCenter: Array<number>;
        sphereRadius: number;
        boxMinimum: Array<number>;
        boxMaximum: Array<number>;
        worldMatrixFromCache: any;
        subMeshes: Array<SerializedSubMesh>;
        checkCollisions: boolean;
    }

    export interface SerializedSubMesh {
        position: number;
        verticesStart: number;
        verticesCount: number;
        indexStart: number;
        indexCount: number;
        hasMaterial: boolean;
        sphereCenter: Array<number>;
        sphereRadius: number;
        boxMinimum: Array<number>;
        boxMaximum: Array<number>;
    }

    export interface SerializedGeometry {
        id: string;
        positions: Float32Array;
        indices: Int32Array;
        normals: Float32Array;
        //uvs?: Float32Array;
    }

    export interface BabylonMessage {
        taskType: WorkerTaskType;
        payload: InitPayload | CollidePayload | UpdatePayload /*any for TS under 1.4*/;
    }

    export interface SerializedColliderToWorker {
        position: Array<number>;
        velocity: Array<number>;
        radius: Array<number>;
    }

    export enum WorkerTaskType {
        INIT,
        UPDATE,
        COLLIDE
    }

    export interface WorkerReply {
        error: WorkerReplyType;
        taskType: WorkerTaskType;
        payload?: any;
    }

    export interface CollisionReplyPayload {
        newPosition: Array<number>;
        collisionId: number;
        collidedMeshUniqueId: number;
    }

    export interface InitPayload {

    }

    export interface CollidePayload {
        collisionId: number;
        collider: SerializedColliderToWorker;
        maximumRetry: number;
        excludedMeshUniqueId?: number;
    }

    export interface UpdatePayload {
        updatedMeshes: { [n: number]: SerializedMesh; };
        updatedGeometries: { [s: string]: SerializedGeometry; };
        removedMeshes: Array<number>;
        removedGeometries: Array<string>;
    }

    export enum WorkerReplyType {
        SUCCESS,
        UNKNOWN_ERROR
    }

    export class CollisionCoordinatorWorker implements ICollisionCoordinator {

        private _scene: Scene;

        private _scaledPosition = Vector3.Zero();
        private _scaledVelocity = Vector3.Zero();

        private _collisionsCallbackArray: Array<(collisionIndex: number, newPosition: Vector3, collidedMesh?: AbstractMesh) => void>;

        private _init: boolean;
        private _runningUpdated: number;
        private _runningCollisionTask: boolean;
        private _worker: Worker;

        private _addUpdateMeshesList: { [n: number]: SerializedMesh; }
        private _addUpdateGeometriesList: { [s: string]: SerializedGeometry; };
        private _toRemoveMeshesArray: Array<number>;
        private _toRemoveGeometryArray: Array<string>;

        constructor() {
            this._collisionsCallbackArray = [];
            this._init = false;
            this._runningUpdated = 0;
            this._runningCollisionTask = false;

            this._addUpdateMeshesList = {};
            this._addUpdateGeometriesList = {};
            this._toRemoveGeometryArray = [];
            this._toRemoveMeshesArray = [];
        }

        public static SerializeMesh = function (mesh: AbstractMesh): SerializedMesh {
            var submeshes: Array<SerializedSubMesh> = [];
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
                    }
                });
            }

            var geometryId: string = null;
            if (mesh instanceof Mesh) {
                geometryId = (<Mesh>mesh).geometry ? (<Mesh>mesh).geometry.id : null;
            } else if (mesh instanceof InstancedMesh) {
                geometryId = ((<InstancedMesh>mesh).sourceMesh && (<InstancedMesh>mesh).sourceMesh.geometry) ? (<InstancedMesh>mesh).sourceMesh.geometry.id : null;
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
            }
        }

        public static SerializeGeometry = function (geometry: Geometry): SerializedGeometry {
            return {
                id: geometry.id,
                positions: new Float32Array(geometry.getVerticesData(VertexBuffer.PositionKind) || []),
                normals: new Float32Array(geometry.getVerticesData(VertexBuffer.NormalKind) || []),
                indices: new Int32Array(geometry.getIndices() || []),
                //uvs: new Float32Array(geometry.getVerticesData(VertexBuffer.UVKind) || [])
            }
        }

        public getNewPosition(position: Vector3, velocity: Vector3, collider: Collider, maximumRetry: number, excludedMesh: AbstractMesh, onNewPosition: (collisionIndex: number, newPosition: Vector3, collidedMesh?: AbstractMesh) => void, collisionIndex: number): void {
            if (!this._init) return;
            if (this._collisionsCallbackArray[collisionIndex] || this._collisionsCallbackArray[collisionIndex + 100000]) return;

            position.divideToRef(collider.radius, this._scaledPosition);
            velocity.divideToRef(collider.radius, this._scaledVelocity);

            this._collisionsCallbackArray[collisionIndex] = onNewPosition;

            var payload: CollidePayload = {
                collider: {
                    position: this._scaledPosition.asArray(),
                    velocity: this._scaledVelocity.asArray(),
                    radius: collider.radius.asArray()
                },
                collisionId: collisionIndex,
                excludedMeshUniqueId: excludedMesh ? excludedMesh.uniqueId : null,
                maximumRetry: maximumRetry
            };
            var message: BabylonMessage = {
                payload: payload,
                taskType: WorkerTaskType.COLLIDE
            }
            this._worker.postMessage(message);

        }

        public init(scene: Scene): void {
            this._scene = scene;
            this._scene.registerAfterRender(this._afterRender);
            var workerUrl = BABYLON.WorkerIncluded ? Engine.CodeRepository + "Collisions/babylon.collisionWorker.js" : URL.createObjectURL(new Blob([BABYLON.CollisionWorker], { type: 'application/javascript' }));
            this._worker = new Worker(workerUrl);
            this._worker.onmessage = this._onMessageFromWorker;
            var message: BabylonMessage = {
                payload: {},
                taskType: WorkerTaskType.INIT
            }
            this._worker.postMessage(message);
        }

        public destroy(): void {
            this._scene.unregisterAfterRender(this._afterRender);
            this._worker.terminate();
        }

        public onMeshAdded(mesh: AbstractMesh) {
            mesh.registerAfterWorldMatrixUpdate(this.onMeshUpdated);
            this.onMeshUpdated(mesh);
        }

        public onMeshUpdated = (mesh: AbstractMesh) => {
            this._addUpdateMeshesList[mesh.uniqueId] = CollisionCoordinatorWorker.SerializeMesh(mesh);
        }

        public onMeshRemoved(mesh: AbstractMesh) {
            this._toRemoveMeshesArray.push(mesh.uniqueId);
        }

        public onGeometryAdded(geometry: Geometry) {
            //TODO this will break if the user uses his own function. This should be an array of callbacks!
            geometry.onGeometryUpdated = this.onGeometryUpdated;
            this.onGeometryUpdated(geometry);
        }

        public onGeometryUpdated = (geometry: Geometry) => {
            this._addUpdateGeometriesList[geometry.id] = CollisionCoordinatorWorker.SerializeGeometry(geometry);
        }

        public onGeometryDeleted(geometry: Geometry) {
            this._toRemoveGeometryArray.push(geometry.id);
        }

        private _afterRender = () => {

            if (!this._init) return;

            if (this._toRemoveGeometryArray.length == 0 && this._toRemoveMeshesArray.length == 0 && Object.keys(this._addUpdateGeometriesList).length == 0 && Object.keys(this._addUpdateMeshesList).length == 0) {
                return;
            }

            //5 concurrent updates were sent to the web worker and were not yet processed. Abort next update.
            //TODO make sure update runs as fast as possible to be able to update 60 FPS.
            if (this._runningUpdated > 4) {
                return;
            }

            ++this._runningUpdated;

            var payload: UpdatePayload = {
                updatedMeshes: this._addUpdateMeshesList,
                updatedGeometries: this._addUpdateGeometriesList,
                removedGeometries: this._toRemoveGeometryArray,
                removedMeshes: this._toRemoveMeshesArray
            };
            var message: BabylonMessage = {
                payload: payload,
                taskType: WorkerTaskType.UPDATE
            }
            var serializable = [];
            for (var id in payload.updatedGeometries) {
                if (payload.updatedGeometries.hasOwnProperty(id)) {
                    //prepare transferables
                    serializable.push((<UpdatePayload>message.payload).updatedGeometries[id].indices.buffer);
                    serializable.push((<UpdatePayload>message.payload).updatedGeometries[id].normals.buffer);
                    serializable.push((<UpdatePayload>message.payload).updatedGeometries[id].positions.buffer);
                }
            }

            this._worker.postMessage(message, serializable);
            this._addUpdateMeshesList = {};
            this._addUpdateGeometriesList = {};
            this._toRemoveGeometryArray = [];
            this._toRemoveMeshesArray = [];
        }

        private _onMessageFromWorker = (e: MessageEvent) => {
            var returnData = <WorkerReply>e.data;
            if (returnData.error != WorkerReplyType.SUCCESS) {
                //TODO what errors can be returned from the worker?
                Tools.Warn("error returned from worker!");
                return;
            }

            switch (returnData.taskType) {
                case WorkerTaskType.INIT:
                    this._init = true;
                    //Update the worked with ALL of the scene's current state
                    this._scene.meshes.forEach((mesh) => {
                        this.onMeshAdded(mesh);
                    });

                    this._scene.getGeometries().forEach((geometry) => {
                        this.onGeometryAdded(geometry);
                    });

                    break;
                case WorkerTaskType.UPDATE:
                    this._runningUpdated--;
                    break;
                case WorkerTaskType.COLLIDE:
                    this._runningCollisionTask = false;
                    var returnPayload: CollisionReplyPayload = returnData.payload;
                    if (!this._collisionsCallbackArray[returnPayload.collisionId]) return;

                    this._collisionsCallbackArray[returnPayload.collisionId](returnPayload.collisionId, Vector3.FromArray(returnPayload.newPosition), this._scene.getMeshByUniqueID(returnPayload.collidedMeshUniqueId));
                    //cleanup
                    this._collisionsCallbackArray[returnPayload.collisionId] = undefined;
                    break;
            }
        }
    }

    export class CollisionCoordinatorLegacy implements ICollisionCoordinator {

        private _scene: Scene;

        private _scaledPosition = Vector3.Zero();
        private _scaledVelocity = Vector3.Zero();

        private _finalPosition = Vector3.Zero();

        public getNewPosition(position: Vector3, velocity: Vector3, collider: Collider, maximumRetry: number, excludedMesh: AbstractMesh, onNewPosition: (collisionIndex: number, newPosition: Vector3, collidedMesh?: AbstractMesh) => void, collisionIndex: number): void {
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
        }

        public init(scene: Scene): void {
            this._scene = scene;
        }

        public destroy(): void {
            //Legacy need no destruction method.
        }

        //No update in legacy mode
        public onMeshAdded(mesh: AbstractMesh) { }
        public onMeshUpdated(mesh: AbstractMesh) { }
        public onMeshRemoved(mesh: AbstractMesh) { }
        public onGeometryAdded(geometry: Geometry) { }
        public onGeometryUpdated(geometry: Geometry) { }
        public onGeometryDeleted(geometry: Geometry) { }

        private _collideWithWorld(position: Vector3, velocity: Vector3, collider: Collider, maximumRetry: number, finalPosition: Vector3, excludedMesh: AbstractMesh = null): void {
            var closeDistance = Engine.CollisionsEpsilon * 10.0;

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
        }
    }
}


