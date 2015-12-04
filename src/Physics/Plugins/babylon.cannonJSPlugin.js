var BABYLON;
(function (BABYLON) {
    var CannonJSPlugin = (function () {
        function CannonJSPlugin() {
            this._registeredMeshes = [];
            this._physicsMaterials = [];
            this.name = "cannon";
            this.updateBodyPosition = function (mesh) {
                for (var index = 0; index < this._registeredMeshes.length; index++) {
                    var registeredMesh = this._registeredMeshes[index];
                    if (registeredMesh.mesh === mesh || registeredMesh.mesh === mesh.parent) {
                        var body = registeredMesh.body;
                        var center = mesh.getBoundingInfo().boundingBox.center;
                        body.position.set(center.x, center.y, center.z);
                        body.quaternion.copy(mesh.rotationQuaternion);
                        if (registeredMesh.deltaRotation) {
                            var tmpQ = new CANNON.Quaternion(-0.7071067811865475, 0, 0, 0.7071067811865475);
                            body.quaternion = body.quaternion.mult(tmpQ);
                        }
                        if (registeredMesh.heightmap) {
                            //calculate the correct body position:
                            var rotationQuaternion = mesh.rotationQuaternion;
                            mesh.rotationQuaternion = new BABYLON.Quaternion();
                            mesh.computeWorldMatrix(true);
                            //get original center with no rotation
                            var center = mesh.getBoundingInfo().boundingBox.center.clone();
                            var oldPivot = mesh.getPivotMatrix() || BABYLON.Matrix.Translation(0, 0, 0);
                            //rotation is back
                            mesh.rotationQuaternion = rotationQuaternion;
                            //calculate the new center using a pivot (since Cannon.js doesn't center height maps)
                            var p = BABYLON.Matrix.Translation(mesh.getBoundingInfo().boundingBox.extendSize.x, 0, -mesh.getBoundingInfo().boundingBox.extendSize.z);
                            mesh.setPivotMatrix(p);
                            mesh.computeWorldMatrix(true);
                            //calculate the translation
                            var translation = mesh.getBoundingInfo().boundingBox.center.subtract(center).subtract(mesh.position).negate();
                            body.position = new CANNON.Vec3(translation.x, translation.y - mesh.getBoundingInfo().boundingBox.extendSize.y, translation.z);
                            //add it inverted to the delta 
                            registeredMesh.delta = mesh.getBoundingInfo().boundingBox.center.subtract(center);
                            registeredMesh.delta.y += mesh.getBoundingInfo().boundingBox.extendSize.y;
                            mesh.setPivotMatrix(oldPivot);
                            mesh.computeWorldMatrix(true);
                        }
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
            var _this = this;
            this._world.step(delta);
            this._registeredMeshes.forEach(function (registeredMesh) {
                // Body position
                var bodyX = registeredMesh.body.position.x, bodyY = registeredMesh.body.position.y, bodyZ = registeredMesh.body.position.z;
                registeredMesh.mesh.position.x = bodyX + registeredMesh.delta.x;
                registeredMesh.mesh.position.y = bodyY + registeredMesh.delta.y;
                registeredMesh.mesh.position.z = bodyZ + registeredMesh.delta.z;
                registeredMesh.mesh.rotationQuaternion.copyFrom(registeredMesh.body.quaternion);
                if (registeredMesh.deltaRotation) {
                    registeredMesh.mesh.rotationQuaternion.multiplyInPlace(registeredMesh.deltaRotation);
                }
                //is the physics collision callback is set?
                if (registeredMesh.mesh.onPhysicsCollide) {
                    if (!registeredMesh.collisionFunction) {
                        registeredMesh.collisionFunction = function (e) {
                            //find the mesh that collided with the registered mesh
                            for (var idx = 0; idx < _this._registeredMeshes.length; idx++) {
                                if (_this._registeredMeshes[idx].body == e.body) {
                                    registeredMesh.mesh.onPhysicsCollide(_this._registeredMeshes[idx].mesh);
                                }
                            }
                        };
                        registeredMesh.body.addEventListener("collide", registeredMesh.collisionFunction);
                    }
                }
                else {
                    //unregister, in case the function was removed for some reason
                    if (registeredMesh.collisionFunction) {
                        registeredMesh.body.removeEventListener("collide", registeredMesh.collisionFunction);
                    }
                }
            });
        };
        CannonJSPlugin.prototype.setGravity = function (gravity) {
            this._gravity = gravity;
            this._world.gravity.set(gravity.x, gravity.y, gravity.z);
        };
        CannonJSPlugin.prototype.getGravity = function () {
            return this._gravity;
        };
        CannonJSPlugin.prototype.registerMesh = function (mesh, impostor, options) {
            this.unregisterMesh(mesh);
            if (!mesh.rotationQuaternion) {
                mesh.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z);
            }
            mesh.computeWorldMatrix(true);
            var shape = this._createShape(mesh, impostor);
            return this._createRigidBodyFromShape(shape, mesh, options);
        };
        CannonJSPlugin.prototype._createShape = function (mesh, impostor) {
            //get the correct bounding box
            var oldQuaternion = mesh.rotationQuaternion;
            mesh.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 1);
            mesh.computeWorldMatrix(true);
            var returnValue;
            switch (impostor) {
                case BABYLON.PhysicsEngine.SphereImpostor:
                    var bbox = mesh.getBoundingInfo().boundingBox;
                    var radiusX = bbox.maximumWorld.x - bbox.minimumWorld.x;
                    var radiusY = bbox.maximumWorld.y - bbox.minimumWorld.y;
                    var radiusZ = bbox.maximumWorld.z - bbox.minimumWorld.z;
                    returnValue = new CANNON.Sphere(Math.max(this._checkWithEpsilon(radiusX), this._checkWithEpsilon(radiusY), this._checkWithEpsilon(radiusZ)) / 2);
                    break;
                //TMP also for cylinder - TODO Cannon supports cylinder natively.
                case BABYLON.PhysicsEngine.CylinderImpostor:
                    BABYLON.Tools.Warn("CylinderImposter not yet implemented, using BoxImposter instead");
                case BABYLON.PhysicsEngine.BoxImpostor:
                    bbox = mesh.getBoundingInfo().boundingBox;
                    var min = bbox.minimumWorld;
                    var max = bbox.maximumWorld;
                    var box = max.subtract(min).scale(0.5);
                    returnValue = new CANNON.Box(new CANNON.Vec3(this._checkWithEpsilon(box.x), this._checkWithEpsilon(box.y), this._checkWithEpsilon(box.z)));
                    break;
                case BABYLON.PhysicsEngine.PlaneImpostor:
                    BABYLON.Tools.Warn("Attention, Cannon.js PlaneImposter might not behave as you wish. Consider using BoxImposter instead");
                    returnValue = new CANNON.Plane();
                    break;
                case BABYLON.PhysicsEngine.MeshImpostor:
                    var rawVerts = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                    var rawFaces = mesh.getIndices();
                    returnValue = this._createConvexPolyhedron(rawVerts, rawFaces, mesh);
                    break;
                case BABYLON.PhysicsEngine.HeightmapImpostor:
                    returnValue = this._createHeightmap(mesh);
                    break;
            }
            mesh.rotationQuaternion = oldQuaternion;
            return returnValue;
        };
        CannonJSPlugin.prototype._createConvexPolyhedron = function (rawVerts, rawFaces, mesh) {
            var verts = [], faces = [];
            mesh.computeWorldMatrix(true);
            //reuse this variable
            var transformed = BABYLON.Vector3.Zero();
            // Get vertices
            for (var i = 0; i < rawVerts.length; i += 3) {
                BABYLON.Vector3.TransformNormalFromFloatsToRef(rawVerts[i], rawVerts[i + 1], rawVerts[i + 2], mesh.getWorldMatrix(), transformed);
                verts.push(new CANNON.Vec3(transformed.x, transformed.y, transformed.z));
            }
            // Get faces
            for (var j = 0; j < rawFaces.length; j += 3) {
                faces.push([rawFaces[j], rawFaces[j + 2], rawFaces[j + 1]]);
            }
            var shape = new CANNON.ConvexPolyhedron(verts, faces);
            return shape;
        };
        CannonJSPlugin.prototype._createHeightmap = function (mesh, pointDepth) {
            var pos = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var matrix = [];
            //For now pointDepth will not be used and will be automatically calculated.
            //Future reference - try and find the best place to add a reference to the pointDepth variable.
            var arraySize = pointDepth || ~~(Math.sqrt(pos.length / 3) - 1);
            var dim = Math.min(mesh.getBoundingInfo().boundingBox.extendSize.x, mesh.getBoundingInfo().boundingBox.extendSize.z);
            var elementSize = dim * 2 / arraySize;
            var minY = mesh.getBoundingInfo().boundingBox.extendSize.y;
            for (var i = 0; i < pos.length; i = i + 3) {
                var x = Math.round((pos[i + 0]) / elementSize + arraySize / 2);
                var z = Math.round(((pos[i + 2]) / elementSize - arraySize / 2) * -1);
                var y = pos[i + 1] + minY;
                if (!matrix[x]) {
                    matrix[x] = [];
                }
                if (!matrix[x][z]) {
                    matrix[x][z] = y;
                }
                matrix[x][z] = Math.max(y, matrix[x][z]);
            }
            for (var x = 0; x <= arraySize; ++x) {
                if (!matrix[x]) {
                    var loc = 1;
                    while (!matrix[(x + loc) % arraySize]) {
                        loc++;
                    }
                    matrix[x] = matrix[(x + loc) % arraySize].slice();
                }
                for (var z = 0; z <= arraySize; ++z) {
                    if (!matrix[x][z]) {
                        var loc = 1;
                        var newValue;
                        while (newValue === undefined) {
                            newValue = matrix[x][(z + loc++) % arraySize];
                        }
                        matrix[x][z] = newValue;
                    }
                }
            }
            var shape = new CANNON.Heightfield(matrix, {
                elementSize: elementSize
            });
            //For future reference, needed for body transformation
            shape.minY = minY;
            return shape;
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
            var currentMat = new CANNON.Material("mat");
            this._physicsMaterials.push(currentMat);
            for (index = 0; index < this._physicsMaterials.length; index++) {
                mat = this._physicsMaterials[index];
                var contactMaterial = new CANNON.ContactMaterial(mat, currentMat, { friction: friction, restitution: restitution });
                this._world.addContactMaterial(contactMaterial);
            }
            return currentMat;
        };
        CannonJSPlugin.prototype._createRigidBodyFromShape = function (shape, mesh, options) {
            if (!mesh.rotationQuaternion) {
                mesh.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z);
            }
            // The delta between the mesh position and the mesh bounding box center
            var bbox = mesh.getBoundingInfo().boundingBox;
            var deltaPosition = mesh.position.subtract(bbox.center);
            var deltaRotation;
            var material = this._addMaterial(options.friction, options.restitution);
            var body = new CANNON.Body({
                mass: options.mass,
                material: material,
                position: new CANNON.Vec3(bbox.center.x, bbox.center.y, bbox.center.z)
            });
            body.quaternion = new CANNON.Quaternion(mesh.rotationQuaternion.x, mesh.rotationQuaternion.y, mesh.rotationQuaternion.z, mesh.rotationQuaternion.w);
            //is shape is a plane or a heightmap, it must be rotated 90 degs in the X axis.
            if (shape.type === CANNON.Shape.types.PLANE || shape.type === CANNON.Shape.types.HEIGHTFIELD) {
                //-90 DEG in X, precalculated
                var tmpQ = new CANNON.Quaternion(-0.7071067811865475, 0, 0, 0.7071067811865475);
                body.quaternion = body.quaternion.mult(tmpQ);
                //Invert! (Precalculated, 90 deg in X)
                deltaRotation = new BABYLON.Quaternion(0.7071067811865475, 0, 0, 0.7071067811865475);
            }
            //If it is a heightfield, if should be centered.
            if (shape.type === CANNON.Shape.types.HEIGHTFIELD) {
                //calculate the correct body position:
                var rotationQuaternion = mesh.rotationQuaternion;
                mesh.rotationQuaternion = new BABYLON.Quaternion();
                mesh.computeWorldMatrix(true);
                //get original center with no rotation
                var center = mesh.getBoundingInfo().boundingBox.center.clone();
                var oldPivot = mesh.getPivotMatrix() || BABYLON.Matrix.Translation(0, 0, 0);
                //rotation is back
                mesh.rotationQuaternion = rotationQuaternion;
                //calculate the new center using a pivot (since Cannon.js doesn't center height maps)
                var p = BABYLON.Matrix.Translation(mesh.getBoundingInfo().boundingBox.extendSize.x, 0, -mesh.getBoundingInfo().boundingBox.extendSize.z);
                mesh.setPivotMatrix(p);
                mesh.computeWorldMatrix(true);
                //calculate the translation
                var translation = mesh.getBoundingInfo().boundingBox.center.subtract(center).subtract(mesh.position).negate();
                body.position = new CANNON.Vec3(translation.x, translation.y - mesh.getBoundingInfo().boundingBox.extendSize.y, translation.z);
                //add it inverted to the delta 
                deltaPosition = mesh.getBoundingInfo().boundingBox.center.subtract(center);
                deltaPosition.y += mesh.getBoundingInfo().boundingBox.extendSize.y;
                mesh.setPivotMatrix(oldPivot);
                mesh.computeWorldMatrix(true);
            }
            //add the shape
            body.addShape(shape);
            this._world.add(body);
            this._registeredMeshes.push({ mesh: mesh, body: body, material: material, delta: deltaPosition, deltaRotation: deltaRotation, heightmap: shape.type === CANNON.Shape.types.HEIGHTFIELD });
            return body;
        };
        CannonJSPlugin.prototype.registerMeshesAsCompound = function (parts, options) {
            var initialMesh = parts[0].mesh;
            this.unregisterMesh(initialMesh);
            initialMesh.computeWorldMatrix(true);
            var initialShape = this._createShape(initialMesh, parts[0].impostor);
            var body = this._createRigidBodyFromShape(initialShape, initialMesh, options);
            for (var index = 1; index < parts.length; index++) {
                var mesh = parts[index].mesh;
                mesh.computeWorldMatrix(true);
                var shape = this._createShape(mesh, parts[index].impostor);
                var localPosition = mesh.position;
                body.addShape(shape, new CANNON.Vec3(localPosition.x, localPosition.y, localPosition.z));
            }
            return body;
        };
        CannonJSPlugin.prototype._unbindBody = function (body) {
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];
                if (registeredMesh.body === body) {
                    this._world.remove(registeredMesh.body);
                    registeredMesh.body = null;
                    registeredMesh.delta = null;
                    registeredMesh.deltaRotation = null;
                }
            }
        };
        CannonJSPlugin.prototype.unregisterMesh = function (mesh) {
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];
                if (registeredMesh.mesh === mesh) {
                    // Remove body
                    if (registeredMesh.body) {
                        this._unbindBody(registeredMesh.body);
                    }
                    this._registeredMeshes.splice(index, 1);
                    return;
                }
            }
        };
        CannonJSPlugin.prototype.applyImpulse = function (mesh, force, contactPoint) {
            var worldPoint = new CANNON.Vec3(contactPoint.x, contactPoint.y, contactPoint.z);
            var impulse = new CANNON.Vec3(force.x, force.y, force.z);
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
            var constraint = new CANNON.PointToPointConstraint(body1, new CANNON.Vec3(pivot1.x, pivot1.y, pivot1.z), body2, new CANNON.Vec3(pivot2.x, pivot2.y, pivot2.z));
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
        CannonJSPlugin.prototype.getWorldObject = function () {
            return this._world;
        };
        CannonJSPlugin.prototype.getPhysicsBodyOfMesh = function (mesh) {
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];
                if (registeredMesh.mesh === mesh) {
                    return registeredMesh.body;
                }
            }
            return null;
        };
        return CannonJSPlugin;
    })();
    BABYLON.CannonJSPlugin = CannonJSPlugin;
})(BABYLON || (BABYLON = {}));
