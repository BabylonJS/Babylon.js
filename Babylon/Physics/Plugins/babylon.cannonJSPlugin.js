var BABYLON;
(function (BABYLON) {
    var CannonJSPlugin = (function () {
        function CannonJSPlugin() {
            this._registeredMeshes = [];
            this._physicsMaterials = [];
            this.updateBodyPosition = function (mesh) {
                for (var index = 0; index < this._registeredMeshes.length; index++) {
                    var registeredMesh = this._registeredMeshes[index];
                    if (registeredMesh.mesh === mesh || registeredMesh.mesh === mesh.parent) {
                        var body = registeredMesh.body;
                        var center = mesh.getBoundingInfo().boundingBox.center;
                        body.position.set(center.x, center.z, center.y);
                        body.quaternion.x = mesh.rotationQuaternion.x;
                        body.quaternion.z = mesh.rotationQuaternion.y;
                        body.quaternion.y = mesh.rotationQuaternion.z;
                        body.quaternion.w = -mesh.rotationQuaternion.w;
                        return;
                    }
                }
            };
        }
        CannonJSPlugin.prototype.initialize = function (iterations) {
            if (iterations === void 0) { iterations = 10; }
            this._world = new CANNON.World();
            this._world.broadphase = new CANNON.NaiveBroadphase();
            this._world.solver.iterations = iterations;
        };
        CannonJSPlugin.prototype._checkWithEpsilon = function (value) {
            return value < BABYLON.PhysicsEngine.Epsilon ? BABYLON.PhysicsEngine.Epsilon : value;
        };
        CannonJSPlugin.prototype.runOneStep = function (delta) {
            this._world.step(delta);
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];
                if (registeredMesh.isChild) {
                    continue;
                }
                // Body position
                var bodyX = registeredMesh.body.position.x, bodyY = registeredMesh.body.position.y, bodyZ = registeredMesh.body.position.z;
                var deltaPos = registeredMesh.delta;
                if (deltaPos) {
                    registeredMesh.mesh.position.x = bodyX + deltaPos.x;
                    registeredMesh.mesh.position.y = bodyZ + deltaPos.y;
                    registeredMesh.mesh.position.z = bodyY + deltaPos.z;
                }
                else {
                    registeredMesh.mesh.position.x = bodyX;
                    registeredMesh.mesh.position.y = bodyZ;
                    registeredMesh.mesh.position.z = bodyY;
                }
                if (!registeredMesh.mesh.rotationQuaternion) {
                    registeredMesh.mesh.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 1);
                }
                registeredMesh.mesh.rotationQuaternion.x = registeredMesh.body.quaternion.x;
                registeredMesh.mesh.rotationQuaternion.y = registeredMesh.body.quaternion.z;
                registeredMesh.mesh.rotationQuaternion.z = registeredMesh.body.quaternion.y;
                registeredMesh.mesh.rotationQuaternion.w = -registeredMesh.body.quaternion.w;
            }
        };
        CannonJSPlugin.prototype.setGravity = function (gravity) {
            this._world.gravity.set(gravity.x, gravity.z, gravity.y);
        };
        CannonJSPlugin.prototype.registerMesh = function (mesh, impostor, options) {
            this.unregisterMesh(mesh);
            mesh.computeWorldMatrix(true);
            switch (impostor) {
                case BABYLON.PhysicsEngine.SphereImpostor:
                    var bbox = mesh.getBoundingInfo().boundingBox;
                    var radiusX = bbox.maximumWorld.x - bbox.minimumWorld.x;
                    var radiusY = bbox.maximumWorld.y - bbox.minimumWorld.y;
                    var radiusZ = bbox.maximumWorld.z - bbox.minimumWorld.z;
                    return this._createSphere(Math.max(this._checkWithEpsilon(radiusX), this._checkWithEpsilon(radiusY), this._checkWithEpsilon(radiusZ)) / 2, mesh, options);
                case BABYLON.PhysicsEngine.BoxImpostor:
                    bbox = mesh.getBoundingInfo().boundingBox;
                    var min = bbox.minimumWorld;
                    var max = bbox.maximumWorld;
                    var box = max.subtract(min).scale(0.5);
                    return this._createBox(this._checkWithEpsilon(box.x), this._checkWithEpsilon(box.y), this._checkWithEpsilon(box.z), mesh, options);
                case BABYLON.PhysicsEngine.PlaneImpostor:
                    return this._createPlane(mesh, options);
                case BABYLON.PhysicsEngine.MeshImpostor:
                    var rawVerts = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                    var rawFaces = mesh.getIndices();
                    return this._createConvexPolyhedron(rawVerts, rawFaces, mesh, options);
            }
            return null;
        };
        CannonJSPlugin.prototype._createSphere = function (radius, mesh, options) {
            var shape = new CANNON.Sphere(radius);
            if (!options) {
                return shape;
            }
            return this._createRigidBodyFromShape(shape, mesh, options.mass, options.friction, options.restitution);
        };
        CannonJSPlugin.prototype._createBox = function (x, y, z, mesh, options) {
            var shape = new CANNON.Box(new CANNON.Vec3(x, z, y));
            if (!options) {
                return shape;
            }
            return this._createRigidBodyFromShape(shape, mesh, options.mass, options.friction, options.restitution);
        };
        CannonJSPlugin.prototype._createPlane = function (mesh, options) {
            var shape = new CANNON.Plane();
            if (!options) {
                return shape;
            }
            return this._createRigidBodyFromShape(shape, mesh, options.mass, options.friction, options.restitution);
        };
        CannonJSPlugin.prototype._createConvexPolyhedron = function (rawVerts, rawFaces, mesh, options) {
            var verts = [], faces = [];
            mesh.computeWorldMatrix(true);
            for (var i = 0; i < rawVerts.length; i += 3) {
                var transformed = BABYLON.Vector3.Zero();
                BABYLON.Vector3.TransformNormalFromFloatsToRef(rawVerts[i], rawVerts[i + 1], rawVerts[i + 2], mesh.getWorldMatrix(), transformed);
                verts.push(new CANNON.Vec3(transformed.x, transformed.z, transformed.y));
            }
            for (var j = 0; j < rawFaces.length; j += 3) {
                faces.push([rawFaces[j], rawFaces[j + 2], rawFaces[j + 1]]);
            }
            var shape = new CANNON.ConvexPolyhedron(verts, faces);
            if (!options) {
                return shape;
            }
            return this._createRigidBodyFromShape(shape, mesh, options.mass, options.friction, options.restitution);
        };
        CannonJSPlugin.prototype._addMaterial = function (friction, restitution) {
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
        CannonJSPlugin.prototype._createRigidBodyFromShape = function (shape, mesh, mass, friction, restitution) {
            var initialRotation = null;
            if (mesh.rotationQuaternion) {
                initialRotation = mesh.rotationQuaternion.clone();
                mesh.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 1);
            }
            // The delta between the mesh position and the mesh bounding box center
            var bbox = mesh.getBoundingInfo().boundingBox;
            var deltaPosition = mesh.position.subtract(bbox.center);
            var material = this._addMaterial(friction, restitution);
            var body = new CANNON.RigidBody(mass, shape, material);
            if (initialRotation) {
                body.quaternion.x = initialRotation.x;
                body.quaternion.z = initialRotation.y;
                body.quaternion.y = initialRotation.z;
                body.quaternion.w = -initialRotation.w;
            }
            body.position.set(bbox.center.x, bbox.center.z, bbox.center.y);
            this._world.add(body);
            this._registeredMeshes.push({ mesh: mesh, body: body, material: material, delta: deltaPosition });
            return body;
        };
        CannonJSPlugin.prototype.registerMeshesAsCompound = function (parts, options) {
            var compoundShape = new CANNON.Compound();
            for (var index = 0; index < parts.length; index++) {
                var mesh = parts[index].mesh;
                var shape = this.registerMesh(mesh, parts[index].impostor);
                if (index == 0) {
                    compoundShape.addChild(shape, new CANNON.Vec3(0, 0, 0));
                }
                else {
                    compoundShape.addChild(shape, new CANNON.Vec3(mesh.position.x, mesh.position.z, mesh.position.y));
                }
            }
            var initialMesh = parts[0].mesh;
            var body = this._createRigidBodyFromShape(compoundShape, initialMesh, options.mass, options.friction, options.restitution);
            body.parts = parts;
            return body;
        };
        CannonJSPlugin.prototype._unbindBody = function (body) {
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];
                if (registeredMesh.body === body) {
                    registeredMesh.body = null;
                    registeredMesh.delta = 0;
                }
            }
        };
        CannonJSPlugin.prototype.unregisterMesh = function (mesh) {
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
        CannonJSPlugin.prototype.applyImpulse = function (mesh, force, contactPoint) {
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
        CannonJSPlugin.prototype.createLink = function (mesh1, mesh2, pivot1, pivot2) {
            var body1 = null, body2 = null;
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];
                if (registeredMesh.mesh === mesh1) {
                    body1 = registeredMesh.body;
                }
                else if (registeredMesh.mesh === mesh2) {
                    body2 = registeredMesh.body;
                }
            }
            if (!body1 || !body2) {
                return false;
            }
            var constraint = new CANNON.PointToPointConstraint(body1, new CANNON.Vec3(pivot1.x, pivot1.z, pivot1.y), body2, new CANNON.Vec3(pivot2.x, pivot2.z, pivot2.y));
            this._world.addConstraint(constraint);
            return true;
        };
        CannonJSPlugin.prototype.dispose = function () {
            while (this._registeredMeshes.length) {
                this.unregisterMesh(this._registeredMeshes[0].mesh);
            }
        };
        CannonJSPlugin.prototype.isSupported = function () {
            return window.CANNON !== undefined;
        };
        return CannonJSPlugin;
    })();
    BABYLON.CannonJSPlugin = CannonJSPlugin;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.cannonJSPlugin.js.map