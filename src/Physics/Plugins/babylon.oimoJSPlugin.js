var BABYLON;
(function (BABYLON) {
    var OimoJSPlugin = (function () {
        function OimoJSPlugin() {
            this._registeredMeshes = [];
            /**
             * Update the body position according to the mesh position
             * @param mesh
             */
            this.updateBodyPosition = function (mesh) {
                for (var index = 0; index < this._registeredMeshes.length; index++) {
                    var registeredMesh = this._registeredMeshes[index];
                    if (registeredMesh.mesh === mesh || registeredMesh.mesh === mesh.parent) {
                        var body = registeredMesh.body.body;
                        mesh.computeWorldMatrix(true);
                        var center = mesh.getBoundingInfo().boundingBox.center;
                        body.setPosition(new OIMO.Vec3(center.x, center.y, center.z));
                        body.setRotation(new OIMO.Vec3(mesh.rotation.x, mesh.rotation.y, mesh.rotation.z));
                        body.sleeping = false;
                        return;
                    }
                    // Case where the parent has been updated
                    if (registeredMesh.mesh.parent === mesh) {
                        mesh.computeWorldMatrix(true);
                        registeredMesh.mesh.computeWorldMatrix(true);
                        var absolutePosition = registeredMesh.mesh.getAbsolutePosition();
                        var absoluteRotation = mesh.rotation;
                        body = registeredMesh.body.body;
                        body.setPosition(new OIMO.Vec3(absolutePosition.x, absolutePosition.y, absolutePosition.z));
                        body.setRotation(new OIMO.Vec3(absoluteRotation.x, absoluteRotation.y, absoluteRotation.z));
                        body.sleeping = false;
                        return;
                    }
                }
            };
        }
        OimoJSPlugin.prototype._checkWithEpsilon = function (value) {
            return value < BABYLON.PhysicsEngine.Epsilon ? BABYLON.PhysicsEngine.Epsilon : value;
        };
        OimoJSPlugin.prototype.initialize = function (iterations) {
            this._world = new OIMO.World();
            this._world.clear();
        };
        OimoJSPlugin.prototype.setGravity = function (gravity) {
            this._world.gravity = gravity;
        };
        OimoJSPlugin.prototype.registerMesh = function (mesh, impostor, options) {
            var body = null;
            this.unregisterMesh(mesh);
            mesh.computeWorldMatrix(true);
            var initialRotation = null;
            if (mesh.rotationQuaternion) {
                initialRotation = mesh.rotationQuaternion.clone();
                mesh.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 1);
                mesh.computeWorldMatrix(true);
            }
            var bbox = mesh.getBoundingInfo().boundingBox;
            // The delta between the mesh position and the mesh bounding box center
            var deltaPosition = mesh.position.subtract(bbox.center);
            // Transform delta position with the rotation
            if (initialRotation) {
                var m = new BABYLON.Matrix();
                initialRotation.toRotationMatrix(m);
                deltaPosition = BABYLON.Vector3.TransformCoordinates(deltaPosition, m);
            }
            // register mesh
            switch (impostor) {
                case BABYLON.PhysicsEngine.SphereImpostor:
                    var radiusX = bbox.maximumWorld.x - bbox.minimumWorld.x;
                    var radiusY = bbox.maximumWorld.y - bbox.minimumWorld.y;
                    var radiusZ = bbox.maximumWorld.z - bbox.minimumWorld.z;
                    var size = Math.max(this._checkWithEpsilon(radiusX), this._checkWithEpsilon(radiusY), this._checkWithEpsilon(radiusZ)) / 2;
                    body = new OIMO.Body({
                        type: 'sphere',
                        size: [size],
                        pos: [bbox.center.x, bbox.center.y, bbox.center.z],
                        rot: [mesh.rotation.x / OIMO.TO_RAD, mesh.rotation.y / OIMO.TO_RAD, mesh.rotation.z / OIMO.TO_RAD],
                        move: options.mass != 0,
                        config: [options.mass, options.friction, options.restitution],
                        world: this._world
                    });
                    break;
                case BABYLON.PhysicsEngine.PlaneImpostor:
                //Oimo "fakes" a cylinder as a box, so why don't we!
                case BABYLON.PhysicsEngine.CylinderImpostor:
                case BABYLON.PhysicsEngine.BoxImpostor:
                    var min = bbox.minimumWorld;
                    var max = bbox.maximumWorld;
                    var box = max.subtract(min);
                    var sizeX = this._checkWithEpsilon(box.x);
                    var sizeY = this._checkWithEpsilon(box.y);
                    var sizeZ = this._checkWithEpsilon(box.z);
                    body = new OIMO.Body({
                        type: 'box',
                        size: [sizeX, sizeY, sizeZ],
                        pos: [bbox.center.x, bbox.center.y, bbox.center.z],
                        rot: [mesh.rotation.x / OIMO.TO_RAD, mesh.rotation.y / OIMO.TO_RAD, mesh.rotation.z / OIMO.TO_RAD],
                        move: options.mass != 0,
                        config: [options.mass, options.friction, options.restitution],
                        world: this._world
                    });
                    break;
            }
            //If quaternion was set as the rotation of the object
            if (initialRotation) {
                //We have to access the rigid body's properties to set the quaternion. 
                //The setQuaternion function of Oimo only sets the newOrientation that is only set after an impulse is given or a collision.
                body.body.orientation = new OIMO.Quat(initialRotation.w, initialRotation.x, initialRotation.y, initialRotation.z);
                //update the internal rotation matrix
                body.body.syncShapes();
            }
            this._registeredMeshes.push({
                mesh: mesh,
                body: body,
                delta: deltaPosition
            });
            return body;
        };
        OimoJSPlugin.prototype.registerMeshesAsCompound = function (parts, options) {
            var types = [], sizes = [], positions = [], rotations = [];
            var initialMesh = parts[0].mesh;
            for (var index = 0; index < parts.length; index++) {
                var part = parts[index];
                var bodyParameters = this._createBodyAsCompound(part, options, initialMesh);
                types.push(bodyParameters.type);
                sizes.push.apply(sizes, bodyParameters.size);
                positions.push.apply(positions, bodyParameters.pos);
                rotations.push.apply(rotations, bodyParameters.rot);
            }
            var body = new OIMO.Body({
                type: types,
                size: sizes,
                pos: positions,
                rot: rotations,
                move: options.mass != 0,
                config: [options.mass, options.friction, options.restitution],
                world: this._world
            });
            this._registeredMeshes.push({
                mesh: initialMesh,
                body: body
            });
            return body;
        };
        OimoJSPlugin.prototype._createBodyAsCompound = function (part, options, initialMesh) {
            var bodyParameters = null;
            var mesh = part.mesh;
            // We need the bounding box/sphere info to compute the physics body
            mesh.computeWorldMatrix();
            switch (part.impostor) {
                case BABYLON.PhysicsEngine.SphereImpostor:
                    var bbox = mesh.getBoundingInfo().boundingBox;
                    var radiusX = bbox.maximumWorld.x - bbox.minimumWorld.x;
                    var radiusY = bbox.maximumWorld.y - bbox.minimumWorld.y;
                    var radiusZ = bbox.maximumWorld.z - bbox.minimumWorld.z;
                    var size = Math.max(this._checkWithEpsilon(radiusX), this._checkWithEpsilon(radiusY), this._checkWithEpsilon(radiusZ)) / 2;
                    bodyParameters = {
                        type: 'sphere',
                        /* bug with oimo : sphere needs 3 sizes in this case */
                        size: [size, -1, -1],
                        pos: [mesh.position.x, mesh.position.y, mesh.position.z],
                        rot: [mesh.rotation.x / OIMO.TO_RAD, mesh.rotation.y / OIMO.TO_RAD, mesh.rotation.z / OIMO.TO_RAD]
                    };
                    break;
                case BABYLON.PhysicsEngine.PlaneImpostor:
                case BABYLON.PhysicsEngine.BoxImpostor:
                    bbox = mesh.getBoundingInfo().boundingBox;
                    var min = bbox.minimumWorld;
                    var max = bbox.maximumWorld;
                    var box = max.subtract(min);
                    var sizeX = this._checkWithEpsilon(box.x);
                    var sizeY = this._checkWithEpsilon(box.y);
                    var sizeZ = this._checkWithEpsilon(box.z);
                    var relativePosition = mesh.position;
                    bodyParameters = {
                        type: 'box',
                        size: [sizeX, sizeY, sizeZ],
                        pos: [relativePosition.x, relativePosition.y, relativePosition.z],
                        rot: [mesh.rotation.x / OIMO.TO_RAD, mesh.rotation.y / OIMO.TO_RAD, mesh.rotation.z / OIMO.TO_RAD]
                    };
                    break;
            }
            return bodyParameters;
        };
        OimoJSPlugin.prototype.unregisterMesh = function (mesh) {
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];
                if (registeredMesh.mesh === mesh || registeredMesh.mesh === mesh.parent) {
                    if (registeredMesh.body) {
                        this._world.removeRigidBody(registeredMesh.body.body);
                        this._unbindBody(registeredMesh.body);
                    }
                    this._registeredMeshes.splice(index, 1);
                    return;
                }
            }
        };
        OimoJSPlugin.prototype._unbindBody = function (body) {
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];
                if (registeredMesh.body === body) {
                    registeredMesh.body = null;
                }
            }
        };
        OimoJSPlugin.prototype.applyImpulse = function (mesh, force, contactPoint) {
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];
                if (registeredMesh.mesh === mesh || registeredMesh.mesh === mesh.parent) {
                    // Get object mass to have a behaviour similar to cannon.js
                    var mass = registeredMesh.body.body.massInfo.mass;
                    // The force is scaled with the mass of object
                    registeredMesh.body.body.applyImpulse(contactPoint.scale(OIMO.INV_SCALE), force.scale(OIMO.INV_SCALE * mass));
                    return;
                }
            }
        };
        OimoJSPlugin.prototype.createLink = function (mesh1, mesh2, pivot1, pivot2, options) {
            var body1 = null, body2 = null;
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];
                if (registeredMesh.mesh === mesh1) {
                    body1 = registeredMesh.body.body;
                }
                else if (registeredMesh.mesh === mesh2) {
                    body2 = registeredMesh.body.body;
                }
            }
            if (!body1 || !body2) {
                return false;
            }
            if (!options) {
                options = {};
            }
            new OIMO.Link({
                type: options.type,
                body1: body1,
                body2: body2,
                min: options.min,
                max: options.max,
                axe1: options.axe1,
                axe2: options.axe2,
                pos1: [pivot1.x, pivot1.y, pivot1.z],
                pos2: [pivot2.x, pivot2.y, pivot2.z],
                collision: options.collision,
                spring: options.spring,
                world: this._world
            });
            return true;
        };
        OimoJSPlugin.prototype.dispose = function () {
            this._world.clear();
            while (this._registeredMeshes.length) {
                this.unregisterMesh(this._registeredMeshes[0].mesh);
            }
        };
        OimoJSPlugin.prototype.isSupported = function () {
            return OIMO !== undefined;
        };
        OimoJSPlugin.prototype._getLastShape = function (body) {
            var lastShape = body.shapes;
            while (lastShape.next) {
                lastShape = lastShape.next;
            }
            return lastShape;
        };
        OimoJSPlugin.prototype.runOneStep = function (time) {
            this._world.step();
            // Update the position of all registered meshes
            var i = this._registeredMeshes.length;
            var m;
            while (i--) {
                var body = this._registeredMeshes[i].body.body;
                var mesh = this._registeredMeshes[i].mesh;
                var delta = this._registeredMeshes[i].delta;
                if (!body.sleeping) {
                    if (body.shapes.next) {
                        var parentShape = this._getLastShape(body);
                        mesh.position.x = parentShape.position.x * OIMO.WORLD_SCALE;
                        mesh.position.y = parentShape.position.y * OIMO.WORLD_SCALE;
                        mesh.position.z = parentShape.position.z * OIMO.WORLD_SCALE;
                        var mtx = BABYLON.Matrix.FromArray(body.getMatrix());
                        if (!mesh.rotationQuaternion) {
                            mesh.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 1);
                        }
                        mesh.rotationQuaternion.fromRotationMatrix(mtx);
                        mesh.computeWorldMatrix();
                    }
                    else {
                        m = body.getMatrix();
                        mtx = BABYLON.Matrix.FromArray(m);
                        // Body position
                        var bodyX = mtx.m[12], bodyY = mtx.m[13], bodyZ = mtx.m[14];
                        if (!delta) {
                            mesh.position.x = bodyX;
                            mesh.position.y = bodyY;
                            mesh.position.z = bodyZ;
                        }
                        else {
                            mesh.position.x = bodyX + delta.x;
                            mesh.position.y = bodyY + delta.y;
                            mesh.position.z = bodyZ + delta.z;
                        }
                        if (!mesh.rotationQuaternion) {
                            mesh.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 1);
                        }
                        BABYLON.Quaternion.FromRotationMatrixToRef(mtx, mesh.rotationQuaternion);
                        mesh.computeWorldMatrix();
                    }
                }
            }
        };
        return OimoJSPlugin;
    })();
    BABYLON.OimoJSPlugin = OimoJSPlugin;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.oimoJSPlugin.js.map