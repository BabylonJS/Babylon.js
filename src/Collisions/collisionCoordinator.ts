import { Nullable } from "types";
import { Scene } from "scene";
import { Vector3 } from "Maths/math";
import { Engine } from "Engines/engine";
import { Collider } from "./collider";
import { Geometry } from "Meshes/geometry";
import { AbstractMesh } from "Meshes/abstractMesh";

    /** @hidden */
    export interface ICollisionCoordinator {
        getNewPosition(position: Vector3, displacement: Vector3, collider: Collider, maximumRetry: number, excludedMesh: Nullable<AbstractMesh>, onNewPosition: (collisionIndex: number, newPosition: Vector3, collidedMesh: Nullable<AbstractMesh>) => void, collisionIndex: number): void;
        init(scene: Scene): void;
        destroy(): void;

        //Update meshes and geometries
        onMeshAdded(mesh: AbstractMesh): void;
        onMeshUpdated(mesh: AbstractMesh): void;
        onMeshRemoved(mesh: AbstractMesh): void;
        onGeometryAdded(geometry: Geometry): void;
        onGeometryUpdated(geometry: Geometry): void;
        onGeometryDeleted(geometry: Geometry): void;
    }

    /** @hidden */
    export class CollisionCoordinatorLegacy implements ICollisionCoordinator {

        private _scene: Scene;

        private _scaledPosition = Vector3.Zero();
        private _scaledVelocity = Vector3.Zero();

        private _finalPosition = Vector3.Zero();

        public getNewPosition(position: Vector3, displacement: Vector3, collider: Collider, maximumRetry: number, excludedMesh: AbstractMesh, onNewPosition: (collisionIndex: number, newPosition: Vector3, collidedMesh: Nullable<AbstractMesh>) => void, collisionIndex: number): void {
            position.divideToRef(collider._radius, this._scaledPosition);
            displacement.divideToRef(collider._radius, this._scaledVelocity);
            collider.collidedMesh = null;
            collider._retry = 0;
            collider._initialVelocity = this._scaledVelocity;
            collider._initialPosition = this._scaledPosition;
            this._collideWithWorld(this._scaledPosition, this._scaledVelocity, collider, maximumRetry, this._finalPosition, excludedMesh);

            this._finalPosition.multiplyInPlace(collider._radius);
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

        private _collideWithWorld(position: Vector3, velocity: Vector3, collider: Collider, maximumRetry: number, finalPosition: Vector3, excludedMesh: Nullable<AbstractMesh> = null): void {
            var closeDistance = Engine.CollisionsEpsilon * 10.0;

            if (collider._retry >= maximumRetry) {
                finalPosition.copyFrom(position);
                return;
            }

            // Check if this is a mesh else camera or -1
            var collisionMask = (excludedMesh ? excludedMesh.collisionMask : collider.collisionMask);

            collider._initialize(position, velocity, closeDistance);

            // Check all meshes
            for (var index = 0; index < this._scene.meshes.length; index++) {
                var mesh = this._scene.meshes[index];
                if (mesh.isEnabled() && mesh.checkCollisions && mesh.subMeshes && mesh !== excludedMesh && ((collisionMask & mesh.collisionGroup) !== 0)) {
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

            collider._retry++;
            this._collideWithWorld(position, velocity, collider, maximumRetry, finalPosition, excludedMesh);
        }
    }
