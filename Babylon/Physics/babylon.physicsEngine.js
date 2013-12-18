"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.PhysicsEngine = function (gravity) {
        this.gravity = gravity || new BABYLON.Vector3(0, 0, -9.82);

        this._world = new CANNON.World();
        this._world.broadphase = new CANNON.NaiveBroadphase();
        this._world.gravity.set(this.gravity.x, this.gravity.y, this.gravity.z);

        this._registeredMeshes = [];
        this._physicsMaterials = [];
    };

    BABYLON.PhysicsEngine.prototype._runOneStep = function (delta) {
        if (delta > 1.0) {
            delta = 1.0;
        }
            
        this._world.step(delta);
        
        for (var index = 0; index < this._registeredMeshes.length; index++) {
            var registeredMesh = this._registeredMeshes[index];

            registeredMesh.mesh.position.x = registeredMesh.body.position.x;
            registeredMesh.mesh.position.y = registeredMesh.body.position.z;
            registeredMesh.mesh.position.z = registeredMesh.body.position.y;
            
            if (!registeredMesh.mesh.rotationQuaternion) {
                registeredMesh.mesh.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 1);
            }

            registeredMesh.mesh.rotationQuaternion.x = registeredMesh.body.quaternion.x;
            registeredMesh.mesh.rotationQuaternion.y = registeredMesh.body.quaternion.z;
            registeredMesh.mesh.rotationQuaternion.z = registeredMesh.body.quaternion.y;
            registeredMesh.mesh.rotationQuaternion.w = -registeredMesh.body.quaternion.w;
        }
    };

    BABYLON.PhysicsEngine.prototype._addMaterial = function (friction, restitution) {
        var index;
        var mat;

        for (index = 0; index < this._physicsMaterials.length; index++) {
            mat = this._physicsMaterials[index];
            
            if (mat.friction === friction && mat.restitution === restitution) {
                return mat;
            }
        }

        var currentMat = new CANNON.Material();
        currentMat.friction = friction;
        currentMat.restitution = restitution;
        this._physicsMaterials.push(currentMat);

        for (index = 0; index < this._physicsMaterials.length; index++) {
            mat = this._physicsMaterials[index];
            
            var contactMaterial = new CANNON.ContactMaterial(mat, currentMat, Math.max(mat.friction, currentMat.friction), mat.restitution * currentMat.restitution);
            this._world.addContactMaterial(contactMaterial);
        }

        return currentMat;
    };

    BABYLON.PhysicsEngine.prototype._setGravity = function (gravity) {
        this._world.gravity.set(this.gravity.x, this.gravity.y, this.gravity.z);
    };

    BABYLON.PhysicsEngine.prototype._registerMesh = function (mesh, options) {
        var shape = null;
        
        this._unregisterMesh(mesh);

        mesh.computeWorldMatrix(true);

        switch (options.impostor) {
            case BABYLON.PhysicsEngine.SphereImpostor:
                var bbox = mesh.getBoundingInfo().boundingBox;
                var radiusX = bbox.maximumWorld.x - bbox.minimumWorld.x;
                var radiusY = bbox.maximumWorld.y - bbox.minimumWorld.y;
                var radiusZ = bbox.maximumWorld.z - bbox.minimumWorld.z;
                
                shape = new CANNON.Sphere(Math.max(radiusX, radiusY, radiusZ) / 2);
                break;
            case BABYLON.PhysicsEngine.BoxImpostor:
                var bbox = mesh.getBoundingInfo().boundingBox;
                var min = bbox.minimumWorld;
                var max = bbox.maximumWorld;
                var box = max.subtract(min).scale(0.5);
                shape = new CANNON.Box(new CANNON.Vec3(box.x, box.z, box.y));
                break;
            case BABYLON.PhysicsEngine.PlaneImpostor:
                shape = new CANNON.Plane();
                break;
        }
        
        var material = this._addMaterial(options.friction, options.restitution);
        var body = new CANNON.RigidBody(options.mass, shape, material);
        
        body.position.set(mesh.position.x, mesh.position.z, mesh.position.y);
        this._world.add(body);

        this._registeredMeshes.push({ mesh: mesh, body: body, material:material});
    };
    
    BABYLON.PhysicsEngine.prototype._unregisterMesh = function (mesh) {
        for (var index = 0; index < this._registeredMeshes.length; index++) {
            var registeredMesh = this._registeredMeshes[index];

            if (registeredMesh.mesh === mesh) {
                // Remove
                this._world.remove(registeredMesh.body);
                this._registeredMeshes.splice(index, 1);
                return;
            }
        }
    };
    
    BABYLON.PhysicsEngine.prototype._applyImpulse = function (mesh, force, contactPoint) {
        var worldPoint = new CANNON.Vec3(contactPoint.x, contactPoint.z, contactPoint.y);
        var impulse = new CANNON.Vec3(force.x, force.z, force.y);

        for (var index = 0; index < this._registeredMeshes.length; index++) {
            var registeredMesh = this._registeredMeshes[index];

            if (registeredMesh.mesh === mesh) {
                registeredMesh.body.applyImpulse(impulse, worldPoint);
                return;
            }
        }
    };

    BABYLON.PhysicsEngine.prototype._createLink = function (mesh1, mesh2, pivot1, pivot2) {
        var body1, body2;
        for (var index = 0; index < this._registeredMeshes.length; index++) {
            var registeredMesh = this._registeredMeshes[index];

            if (registeredMesh.mesh === mesh1) {
                body1 = registeredMesh.body;
            } else if (registeredMesh.mesh === mesh2) {
                body2 = registeredMesh.body;
            } 
        }
        
        if (!body1 || !body2) {
            return;
        }
        
        var constraint = new CANNON.PointToPointConstraint(body1, new CANNON.Vec3(pivot1.x, pivot1.z, pivot1.y), body2, new CANNON.Vec3(pivot2.x, pivot2.z, pivot2.y));
        this._world.addConstraint(constraint);
    };

    BABYLON.PhysicsEngine.prototype.dispose = function () {
        while (this._registeredMeshes.length) {
            this._unregisterMesh(this._registeredMeshes[0].mesh);
        }
    };

    // Statics
    BABYLON.PhysicsEngine.IsSupported = function() {
        return CANNON !== undefined;
    };

    BABYLON.PhysicsEngine.NoImpostor = 0;
    BABYLON.PhysicsEngine.SphereImpostor = 1;
    BABYLON.PhysicsEngine.BoxImpostor = 2;
    BABYLON.PhysicsEngine.PlaneImpostor = 3;
})();
