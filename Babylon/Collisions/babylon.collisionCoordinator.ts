module BABYLON {
    
    export class CollisionCoordinator {
        
        private _collisionsCallbackArray: Array<Function>;

        private _scaledPosition = Vector3.Zero();
        private _scaledVelocity = Vector3.Zero();

        private _finalPosition = Vector3.Zero();
        
        constructor(private _scene:Scene) {
            this._collisionsCallbackArray = [];
            //TODO initialize worker here
        }    

        // Collisions
        public _getNewPosition(position: Vector3, velocity: Vector3, collider: Collider, maximumRetry: number, excludedMesh: AbstractMesh = null, onNewPosition?: (collisionId : number, newPosition: BABYLON.Vector3, collidedMesh?: BABYLON.AbstractMesh) => void, collisionIndex: number = 0): void {
            position.divideToRef(collider.radius, this._scaledPosition);
            velocity.divideToRef(collider.radius, this._scaledVelocity);

            if (this._scene.workerCollisions) {

            } else {
                collider.retry = 0;
                collider.initialVelocity = this._scaledVelocity;
                collider.initialPosition = this._scaledPosition;
                this._collideWithWorld(this._scaledPosition, this._scaledVelocity, collider, maximumRetry, this._finalPosition, excludedMesh);
                
                this._finalPosition.multiplyInPlace(collider.radius);
                //run the callback
                onNewPosition(collisionIndex, this._finalPosition, collider.collidedMesh);
            }
        }

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