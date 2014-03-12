"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.PhysicsEngine = function (gravity, iterations) {
        this._world = new CANNON.World();
        this._world.broadphase = new CANNON.NaiveBroadphase();
        this._world.solver.iterations = iterations;

        this._registeredMeshes = [];
        this._physicsMaterials = [];

        this._setGravity(gravity);
    };

    BABYLON.PhysicsEngine.prototype._runOneStep = function (delta) {
        if (delta > 0.1) {
            delta = 0.1;
        } else if (delta <= 0) {
            delta = 1.0 / 60.0;
        }

        this._world.step(delta);

        for (var index = 0; index < this._registeredMeshes.length; index++) {
            var registeredMesh = this._registeredMeshes[index];

            if (registeredMesh.isChild) {
                continue;
            }

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

            var contactMaterial = new CANNON.ContactMaterial(mat, currentMat, mat.friction * currentMat.friction, mat.restitution * currentMat.restitution);
            contactMaterial.contactEquationStiffness = 1e10;
            contactMaterial.contactEquationRegularizationTime = 10;

            this._world.addContactMaterial(contactMaterial);
        }

        return currentMat;
    };

    BABYLON.PhysicsEngine.prototype._setGravity = function (gravity) {
        this.gravity = gravity || new BABYLON.Vector3(0, -9.82, 0);
        this._world.gravity.set(this.gravity.x, this.gravity.z, this.gravity.y);
    };

    BABYLON.PhysicsEngine.prototype._checkWithEpsilon = function (value) {
        return value < BABYLON.PhysicsEngine.Epsilon ? BABYLON.PhysicsEngine.Epsilon : value;
    };

    BABYLON.PhysicsEngine.prototype._registerMesh = function (mesh, options, onlyShape) {
        var shape = null;
        var initialRotation;

        if (mesh.rotationQuaternion) {
            initialRotation = mesh.rotationQuaternion.clone();
            mesh.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 1);
        }

        this._unregisterMesh(mesh);

        mesh.computeWorldMatrix(true);

        switch (options.impostor) {
            case BABYLON.PhysicsEngine.SphereImpostor:
                var bbox = mesh.getBoundingInfo().boundingBox;
                var radiusX = bbox.maximumWorld.x - bbox.minimumWorld.x;
                var radiusY = bbox.maximumWorld.y - bbox.minimumWorld.y;
                var radiusZ = bbox.maximumWorld.z - bbox.minimumWorld.z;

                shape = new CANNON.Sphere(Math.max(this._checkWithEpsilon(radiusX), this._checkWithEpsilon(radiusY), this._checkWithEpsilon(radiusZ)) / 2);
                break;
            case BABYLON.PhysicsEngine.BoxImpostor:
                var bbox = mesh.getBoundingInfo().boundingBox;
                var min = bbox.minimumWorld;
                var max = bbox.maximumWorld;
                var box = max.subtract(min).scale(0.5);
                shape = new CANNON.Box(new CANNON.Vec3(this._checkWithEpsilon(box.x), this._checkWithEpsilon(box.z), this._checkWithEpsilon(box.y)));
                break;
            case BABYLON.PhysicsEngine.PlaneImpostor:
                shape = new CANNON.Plane();
                break;
            case BABYLON.PhysicsEngine.MeshImpostor:
                var rawVerts = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                var rawFaces = mesh.getIndices();

                var verts = [], faces = [];

                mesh.computeWorldMatrix(true);

                // Get vertices
                for (var i = 0; i < rawVerts.length; i += 3) {
                    var transformed = BABYLON.Vector3.Zero();

                    BABYLON.Vector3.TransformNormalFromFloatsToRef(rawVerts[i], rawVerts[i + 1], rawVerts[i + 2], mesh.getWorldMatrix(), transformed);
                    verts.push(new CANNON.Vec3(transformed.x, transformed.z, transformed.y));
                }

                // Get faces
                for (var j = 0; j < rawFaces.length; j += 3) {
                    faces.push([rawFaces[j], rawFaces[j + 2], rawFaces[j + 1]]);
                }

                // Construct polyhedron
                shape = new CANNON.ConvexPolyhedron(verts, faces);
                break;
        }

        if (onlyShape) {
            return shape;
        }

        var material = this._addMaterial(options.friction, options.restitution);
        var body = new CANNON.RigidBody(options.mass, shape, material);

        if (initialRotation) {
            body.quaternion.x = initialRotation.x;
            body.quaternion.z = initialRotation.y;
            body.quaternion.y = initialRotation.z;
            body.quaternion.w = -initialRotation.w;
        }

        body.position.set(mesh.position.x, mesh.position.z, mesh.position.y);
        this._world.add(body);

        this._registeredMeshes.push({ mesh: mesh, body: body, material: material });

        return body;
    };

    BABYLON.PhysicsEngine.prototype._registerCompound = function (options) {
        var compoundShape = new CANNON.Compound();
        var initialMesh = options.parts[0].mesh;
        var initialPosition = initialMesh.position;

        for (var index = 0; index < options.parts.length; index++) {
            var mesh = options.parts[index].mesh;

            var shape = this._registerMesh(mesh, options.parts[index], true);

            if (index == 0) { // Parent
                compoundShape.addChild(shape, new CANNON.Vec3(0, 0, 0));
            } else {
                compoundShape.addChild(shape, new CANNON.Vec3(mesh.position.x, mesh.position.z, mesh.position.y));
            }
        }

        var material = this._addMaterial(options.friction, options.restitution);
        var body = new CANNON.RigidBody(options.mass, compoundShape, material);

        body.position.set(initialPosition.x, initialPosition.z, initialPosition.y);
        this._world.add(body);

        for (var index = 0; index < options.parts.length; index++) {
            var mesh = options.parts[index].mesh;
            this._registeredMeshes.push({ mesh: mesh, body: body, material: material, isChild: index != 0 });
        }

        body.parts = options.parts;

        return body;
    };

    BABYLON.PhysicsEngine.prototype._unbindBody = function (body) {
        for (var index = 0; index < this._registeredMeshes.length; index++) {
            var registeredMesh = this._registeredMeshes[index];

            if (registeredMesh.body === body) {
                registeredMesh.body = null;
            }
        }
    };

    BABYLON.PhysicsEngine.prototype._unregisterMesh = function (mesh) {
        for (var index = 0; index < this._registeredMeshes.length; index++) {
            var registeredMesh = this._registeredMeshes[index];

            if (registeredMesh.mesh === mesh) {
                // Remove body
                if (registeredMesh.body) {
                    this._world.remove(registeredMesh.body);

                    this._unbindBody(registeredMesh.body);
                }

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
    BABYLON.PhysicsEngine.IsSupported = function () {
        return window.CANNON !== undefined;
    };

    BABYLON.PhysicsEngine.NoImpostor = 0;
    BABYLON.PhysicsEngine.SphereImpostor = 1;
    BABYLON.PhysicsEngine.BoxImpostor = 2;
    BABYLON.PhysicsEngine.PlaneImpostor = 3;
    BABYLON.PhysicsEngine.CompoundImpostor = 4;
    BABYLON.PhysicsEngine.MeshImpostor = 4;

    BABYLON.PhysicsEngine.Epsilon = 0.001;
})();
