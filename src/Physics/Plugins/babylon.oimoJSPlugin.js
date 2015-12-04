var BABYLON;
(function (BABYLON) {
    var OimoJSPlugin = (function () {
        function OimoJSPlugin() {
            this._registeredMeshes = [];
            this.name = "oimo";
            /**
             * Update the body position according to the mesh position
             * @param mesh
             */
            this.updateBodyPosition = function (mesh) {
                for (var index = 0; index < this._registeredMeshes.length; index++) {
                    var registeredMesh = this._registeredMeshes[index];
                    var body = registeredMesh.body.body;
                    var updated = false;
                    var newPosition;
                    if (registeredMesh.mesh === mesh || registeredMesh.mesh === mesh.parent) {
                        mesh.computeWorldMatrix(true);
                        newPosition = mesh.getBoundingInfo().boundingBox.center;
                        updated = true;
                    }
                    else if (registeredMesh.mesh.parent === mesh) {
                        mesh.computeWorldMatrix(true);
                        registeredMesh.mesh.computeWorldMatrix(true);
                        newPosition = registeredMesh.mesh.getAbsolutePosition();
                        updated = true;
                    }
                    if (updated) {
                        body.setPosition(new OIMO.Vec3(newPosition.x, newPosition.y, newPosition.z));
                        body.setQuaternion(mesh.rotationQuaternion);
                        body.sleeping = false;
                        //force Oimo to update the body's position
                        body.updatePosition(1);
                    }
                }
            };
        }
        OimoJSPlugin.prototype._checkWithEpsilon = function (value) {
            return value < BABYLON.PhysicsEngine.Epsilon ? BABYLON.PhysicsEngine.Epsilon : value;
        };
        OimoJSPlugin.prototype.initialize = function (iterations) {
            this._world = new OIMO.World(null, null, iterations);
            this._world.clear();
        };
        OimoJSPlugin.prototype.setGravity = function (gravity) {
            this._gravity = this._world.gravity = gravity;
        };
        OimoJSPlugin.prototype.getGravity = function () {
            return this._gravity;
        };
        OimoJSPlugin.prototype.registerMesh = function (mesh, impostor, options) {
            this.unregisterMesh(mesh);
            if (!mesh.rotationQuaternion) {
                mesh.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z);
            }
            mesh.computeWorldMatrix(true);
            var bbox = mesh.getBoundingInfo().boundingBox;
            // The delta between the mesh position and the mesh bounding box center
            var deltaPosition = mesh.position.subtract(bbox.center);
            //calculate rotation to fit Oimo's needs (Euler...)
            var rot = new OIMO.Euler().setFromQuaternion({ x: mesh.rotationQuaternion.x, y: mesh.rotationQuaternion.y, z: mesh.rotationQuaternion.z, s: mesh.rotationQuaternion.w });
            //get the correct bounding box
            var oldQuaternion = mesh.rotationQuaternion;
            mesh.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 1);
            mesh.computeWorldMatrix(true);
            var bodyConfig = {
                name: mesh.uniqueId,
                pos: [bbox.center.x, bbox.center.y, bbox.center.z],
                rot: [rot.x / OIMO.TO_RAD, rot.y / OIMO.TO_RAD, rot.z / OIMO.TO_RAD],
                move: options.mass != 0,
                config: [options.mass, options.friction, options.restitution],
                world: this._world
            };
            // register mesh
            switch (impostor) {
                case BABYLON.PhysicsEngine.SphereImpostor:
                    var radiusX = bbox.maximumWorld.x - bbox.minimumWorld.x;
                    var radiusY = bbox.maximumWorld.y - bbox.minimumWorld.y;
                    var radiusZ = bbox.maximumWorld.z - bbox.minimumWorld.z;
                    var size = Math.max(this._checkWithEpsilon(radiusX), this._checkWithEpsilon(radiusY), this._checkWithEpsilon(radiusZ)) / 2;
                    bodyConfig.type = 'sphere';
                    bodyConfig.size = [size];
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
                    bodyConfig.type = 'box';
                    bodyConfig.size = [sizeX, sizeY, sizeZ];
                    break;
            }
            var body = new OIMO.Body(bodyConfig);
            //We have to access the rigid body's properties to set the quaternion. 
            //The setQuaternion function of Oimo only sets the newOrientation that is only set after an impulse is given or a collision.
            //body.body.orientation = new OIMO.Quat(mesh.rotationQuaternion.w, mesh.rotationQuaternion.x, mesh.rotationQuaternion.y, mesh.rotationQuaternion.z);
            //TEST
            //body.body.resetQuaternion(new OIMO.Quat(mesh.rotationQuaternion.w, mesh.rotationQuaternion.x, mesh.rotationQuaternion.y, mesh.rotationQuaternion.z));
            //update the internal rotation matrix
            //body.body.syncShapes();
            this._registeredMeshes.push({
                mesh: mesh,
                body: body,
                delta: deltaPosition
            });
            //for the sake of consistency.
            mesh.rotationQuaternion = oldQuaternion;
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
                name: initialMesh.uniqueId,
                type: types,
                size: sizes,
                pos: positions,
                rot: rotations,
                move: options.mass != 0,
                config: [options.mass, options.friction, options.restitution],
                world: this._world
            });
            //Reset the body's rotation to be of the initial mesh's.
            var rot = new OIMO.Euler().setFromQuaternion({ x: initialMesh.rotationQuaternion.x, y: initialMesh.rotationQuaternion.y, z: initialMesh.rotationQuaternion.z, s: initialMesh.rotationQuaternion.w });
            body.resetRotation(rot.x / OIMO.TO_RAD, rot.y / OIMO.TO_RAD, rot.z / OIMO.TO_RAD);
            this._registeredMeshes.push({
                mesh: initialMesh,
                body: body
            });
            return body;
        };
        OimoJSPlugin.prototype._createBodyAsCompound = function (part, options, initialMesh) {
            var mesh = part.mesh;
            if (!mesh.rotationQuaternion) {
                mesh.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z);
            }
            // We need the bounding box/sphere info to compute the physics body
            mesh.computeWorldMatrix(true);
            var rot = new OIMO.Euler().setFromQuaternion({ x: mesh.rotationQuaternion.x, y: mesh.rotationQuaternion.y, z: mesh.rotationQuaternion.z, s: mesh.rotationQuaternion.w });
            var bodyParameters = {
                name: mesh.uniqueId,
                pos: [mesh.position.x, mesh.position.y, mesh.position.z],
                //A bug in Oimo (Body class) prevents us from using rot directly.
                rot: [0, 0, 0],
                //For future reference, if the bug will ever be fixed.
                realRot: [rot.x / OIMO.TO_RAD, rot.y / OIMO.TO_RAD, rot.z / OIMO.TO_RAD]
            };
            var oldQuaternion = mesh.rotationQuaternion;
            mesh.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 1);
            mesh.computeWorldMatrix(true);
            switch (part.impostor) {
                case BABYLON.PhysicsEngine.SphereImpostor:
                    var bbox = mesh.getBoundingInfo().boundingBox;
                    var radiusX = bbox.maximumWorld.x - bbox.minimumWorld.x;
                    var radiusY = bbox.maximumWorld.y - bbox.minimumWorld.y;
                    var radiusZ = bbox.maximumWorld.z - bbox.minimumWorld.z;
                    var size = Math.max(this._checkWithEpsilon(radiusX), this._checkWithEpsilon(radiusY), this._checkWithEpsilon(radiusZ)) / 2;
                    bodyParameters.type = 'sphere';
                    bodyParameters.size = [size, size, size];
                    break;
                case BABYLON.PhysicsEngine.PlaneImpostor:
                case BABYLON.PhysicsEngine.CylinderImpostor:
                case BABYLON.PhysicsEngine.BoxImpostor:
                    bbox = mesh.getBoundingInfo().boundingBox;
                    var min = bbox.minimumWorld;
                    var max = bbox.maximumWorld;
                    var box = max.subtract(min);
                    var sizeX = this._checkWithEpsilon(box.x);
                    var sizeY = this._checkWithEpsilon(box.y);
                    var sizeZ = this._checkWithEpsilon(box.z);
                    bodyParameters.type = 'box';
                    bodyParameters.size = [sizeX, sizeY, sizeZ];
                    break;
            }
            mesh.rotationQuaternion = oldQuaternion;
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
        OimoJSPlugin.prototype.getWorldObject = function () {
            return this._world;
        };
        OimoJSPlugin.prototype.getPhysicsBodyOfMesh = function (mesh) {
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];
                if (registeredMesh.mesh === mesh) {
                    return registeredMesh.body;
                }
            }
            return null;
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
                if (!this._registeredMeshes[i].delta) {
                    this._registeredMeshes[i].delta = BABYLON.Vector3.Zero();
                }
                if (!body.sleeping) {
                    //TODO check that
                    if (body.shapes.next) {
                        var parentShape = this._getLastShape(body);
                        mesh.position.x = parentShape.position.x * OIMO.WORLD_SCALE;
                        mesh.position.y = parentShape.position.y * OIMO.WORLD_SCALE;
                        mesh.position.z = parentShape.position.z * OIMO.WORLD_SCALE;
                    }
                    else {
                        mesh.position.copyFrom(body.getPosition()).addInPlace(this._registeredMeshes[i].delta);
                    }
                    mesh.rotationQuaternion.copyFrom(body.getQuaternion());
                    mesh.computeWorldMatrix();
                }
                //check if the collide callback is set. 
                if (mesh.onPhysicsCollide) {
                    var meshUniqueName = mesh.uniqueId;
                    var contact = this._world.contacts;
                    while (contact !== null) {
                        //is this body colliding with any other?
                        if ((contact.body1.name == mesh.uniqueId || contact.body2.name == mesh.uniqueId) && contact.touching && !contact.body1.sleeping && !contact.body2.sleeping) {
                            var otherUniqueId = contact.body1.name == mesh.uniqueId ? contact.body2.name : contact.body1.name;
                            //get the mesh and execute the callback
                            var otherMesh = mesh.getScene().getMeshByUniqueID(otherUniqueId);
                            if (otherMesh)
                                mesh.onPhysicsCollide(otherMesh);
                        }
                        contact = contact.next;
                    }
                }
            }
        };
        return OimoJSPlugin;
    })();
    BABYLON.OimoJSPlugin = OimoJSPlugin;
})(BABYLON || (BABYLON = {}));
