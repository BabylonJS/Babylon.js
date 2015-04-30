var BABYLON;
(function (BABYLON) {
    var CollisionCoordinator = (function () {
        function CollisionCoordinator(_scene) {
            this._scene = _scene;
            this._scaledPosition = BABYLON.Vector3.Zero();
            this._scaledVelocity = BABYLON.Vector3.Zero();
            this._finalPosition = BABYLON.Vector3.Zero();
            this._collisionsCallbackArray = [];
            //TODO initialize worker here
        }
        // Collisions
        CollisionCoordinator.prototype._getNewPosition = function (position, velocity, collider, maximumRetry, excludedMesh, onNewPosition, collisionIndex) {
            if (excludedMesh === void 0) { excludedMesh = null; }
            if (collisionIndex === void 0) { collisionIndex = 0; }
            position.divideToRef(collider.radius, this._scaledPosition);
            velocity.divideToRef(collider.radius, this._scaledVelocity);
            if (this._scene.workerCollisions) {
            }
            else {
                collider.retry = 0;
                collider.initialVelocity = this._scaledVelocity;
                collider.initialPosition = this._scaledPosition;
                this._collideWithWorld(this._scaledPosition, this._scaledVelocity, collider, maximumRetry, this._finalPosition, excludedMesh);
                this._finalPosition.multiplyInPlace(collider.radius);
                //run the callback
                onNewPosition(collisionIndex, this._finalPosition, collider.collidedMesh);
            }
        };
        CollisionCoordinator.prototype._collideWithWorld = function (position, velocity, collider, maximumRetry, finalPosition, excludedMesh) {
            if (excludedMesh === void 0) { excludedMesh = null; }
            var closeDistance = BABYLON.Engine.CollisionsEpsilon * 10.0;
            if (collider.retry >= maximumRetry) {
                finalPosition.copyFrom(position);
                return;
            }
            collider._initialize(position, velocity, closeDistance);
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
        return CollisionCoordinator;
    })();
    BABYLON.CollisionCoordinator = CollisionCoordinator;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.collisionCoordinator.js.map