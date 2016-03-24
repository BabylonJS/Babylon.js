var BABYLON;
(function (BABYLON) {
    var CannonJSPlugin = (function () {
        function CannonJSPlugin(_useDeltaForWorldStep, iterations) {
            if (_useDeltaForWorldStep === void 0) { _useDeltaForWorldStep = true; }
            if (iterations === void 0) { iterations = 10; }
            this._useDeltaForWorldStep = _useDeltaForWorldStep;
            this.name = "CannonJSPlugin";
            this._physicsMaterials = [];
            this._fixedTimeStep = 1 / 60;
            //See https://github.com/schteppe/cannon.js/blob/gh-pages/demos/collisionFilter.html
            this._currentCollisionGroup = 2;
            this._minus90X = new BABYLON.Quaternion(-0.7071067811865475, 0, 0, 0.7071067811865475);
            this._plus90X = new BABYLON.Quaternion(0.7071067811865475, 0, 0, 0.7071067811865475);
            this._tmpPosition = BABYLON.Vector3.Zero();
            this._tmpQuaternion = new BABYLON.Quaternion();
            this._tmpDeltaPosition = BABYLON.Vector3.Zero();
            this._tmpDeltaRotation = new BABYLON.Quaternion();
            this._tmpUnityRotation = new BABYLON.Quaternion();
            if (!this.isSupported()) {
                BABYLON.Tools.Error("CannonJS is not available. Please make sure you included the js file.");
                return;
            }
            this.world = new CANNON.World();
            this.world.broadphase = new CANNON.NaiveBroadphase();
            this.world.solver.iterations = iterations;
        }
        CannonJSPlugin.prototype.setGravity = function (gravity) {
            this.world.gravity.copy(gravity);
        };
        CannonJSPlugin.prototype.setTimeStep = function (timeStep) {
            this._fixedTimeStep = timeStep;
        };
        CannonJSPlugin.prototype.executeStep = function (delta, impostors) {
            this.world.step(this._fixedTimeStep, this._useDeltaForWorldStep ? delta * 1000 : 0, 3);
        };
        CannonJSPlugin.prototype.applyImpulse = function (impostor, force, contactPoint) {
            var worldPoint = new CANNON.Vec3(contactPoint.x, contactPoint.y, contactPoint.z);
            var impulse = new CANNON.Vec3(force.x, force.y, force.z);
            impostor.physicsBody.applyImpulse(impulse, worldPoint);
        };
        CannonJSPlugin.prototype.applyForce = function (impostor, force, contactPoint) {
            var worldPoint = new CANNON.Vec3(contactPoint.x, contactPoint.y, contactPoint.z);
            var impulse = new CANNON.Vec3(force.x, force.y, force.z);
            impostor.physicsBody.applyImpulse(impulse, worldPoint);
        };
        CannonJSPlugin.prototype.generatePhysicsBody = function (impostor) {
            //parent-child relationship. Does this impostor has a parent impostor?
            if (impostor.parent) {
                if (impostor.physicsBody) {
                    this.removePhysicsBody(impostor);
                    //TODO is that needed?
                    impostor.forceUpdate();
                }
                return;
            }
            //should a new body be created for this impostor?
            if (impostor.isBodyInitRequired()) {
                var shape = this._createShape(impostor);
                //unregister events, if body is being changed
                var oldBody = impostor.physicsBody;
                if (oldBody) {
                    this.removePhysicsBody(impostor);
                }
                //create the body and material
                var material = this._addMaterial("mat-" + impostor.uniqueId, impostor.getParam("friction"), impostor.getParam("restitution"));
                var bodyCreationObject = {
                    mass: impostor.getParam("mass"),
                    material: material
                };
                // A simple extend, in case native options were used.
                var nativeOptions = impostor.getParam("nativeOptions");
                for (var key in nativeOptions) {
                    if (nativeOptions.hasOwnProperty(key)) {
                        bodyCreationObject[key] = nativeOptions[key];
                    }
                }
                impostor.physicsBody = new CANNON.Body(bodyCreationObject);
                impostor.physicsBody.addEventListener("collide", impostor.onCollide);
                this.world.addEventListener("preStep", impostor.beforeStep);
                this.world.addEventListener("postStep", impostor.afterStep);
                impostor.physicsBody.addShape(shape);
                this.world.add(impostor.physicsBody);
                //try to keep the body moving in the right direction by taking old properties.
                //Should be tested!
                if (oldBody) {
                    ['force', 'torque', 'velocity', 'angularVelocity'].forEach(function (param) {
                        impostor.physicsBody[param].copy(oldBody[param]);
                    });
                }
                this._processChildMeshes(impostor);
            }
            //now update the body's transformation
            this._updatePhysicsBodyTransformation(impostor);
        };
        CannonJSPlugin.prototype._processChildMeshes = function (mainImpostor) {
            var _this = this;
            var meshChildren = mainImpostor.object.getChildMeshes ? mainImpostor.object.getChildMeshes() : [];
            if (meshChildren.length) {
                var processMesh = function (localPosition, mesh) {
                    var childImpostor = mesh.getPhysicsImpostor();
                    if (childImpostor) {
                        var parent = childImpostor.parent;
                        if (parent !== mainImpostor) {
                            var localPosition = mesh.position;
                            if (childImpostor.physicsBody) {
                                _this.removePhysicsBody(childImpostor);
                                childImpostor.physicsBody = null;
                            }
                            childImpostor.parent = mainImpostor;
                            childImpostor.resetUpdateFlags();
                            mainImpostor.physicsBody.addShape(_this._createShape(childImpostor), new CANNON.Vec3(localPosition.x, localPosition.y, localPosition.z));
                            //Add the mass of the children.
                            mainImpostor.physicsBody.mass += childImpostor.getParam("mass");
                        }
                    }
                    mesh.getChildMeshes().forEach(processMesh.bind(_this, mesh.position));
                };
                meshChildren.forEach(processMesh.bind(this, BABYLON.Vector3.Zero()));
            }
        };
        CannonJSPlugin.prototype.removePhysicsBody = function (impostor) {
            impostor.physicsBody.removeEventListener("collide", impostor.onCollide);
            this.world.removeEventListener("preStep", impostor.beforeStep);
            this.world.removeEventListener("postStep", impostor.afterStep);
            this.world.remove(impostor.physicsBody);
        };
        CannonJSPlugin.prototype.generateJoint = function (impostorJoint) {
            var mainBody = impostorJoint.mainImpostor.physicsBody;
            var connectedBody = impostorJoint.connectedImpostor.physicsBody;
            if (!mainBody || !connectedBody) {
                return;
            }
            var constraint;
            var jointData = impostorJoint.joint.jointData;
            //TODO - https://github.com/schteppe/cannon.js/blob/gh-pages/demos/collisionFilter.html
            var constraintData = {
                pivotA: jointData.mainPivot ? new CANNON.Vec3().copy(jointData.mainPivot) : null,
                pivotB: jointData.connectedPivot ? new CANNON.Vec3().copy(jointData.connectedPivot) : null,
                axisA: jointData.mainAxis ? new CANNON.Vec3().copy(jointData.mainAxis) : null,
                axisB: jointData.connectedAxis ? new CANNON.Vec3().copy(jointData.connectedAxis) : null,
                maxForce: jointData.nativeParams.maxForce,
                collideConnected: !!jointData.collision
            };
            //Not needed, Cannon has a collideConnected flag
            /*if (!jointData.collision) {
                //add 1st body to a collision group of its own, if it is not in 1
                if (mainBody.collisionFilterGroup === 1) {
                    mainBody.collisionFilterGroup = this._currentCollisionGroup;
                    this._currentCollisionGroup <<= 1;
                }
                if (connectedBody.collisionFilterGroup === 1) {
                    connectedBody.collisionFilterGroup = this._currentCollisionGroup;
                    this._currentCollisionGroup <<= 1;
                }
                //add their mask to the collisionFilterMask of each other:
                connectedBody.collisionFilterMask = connectedBody.collisionFilterMask | ~mainBody.collisionFilterGroup;
                mainBody.collisionFilterMask = mainBody.collisionFilterMask | ~connectedBody.collisionFilterGroup;
            }*/
            switch (impostorJoint.joint.type) {
                case BABYLON.PhysicsJoint.HingeJoint:
                case BABYLON.PhysicsJoint.Hinge2Joint:
                    constraint = new CANNON.HingeConstraint(mainBody, connectedBody, constraintData);
                    break;
                case BABYLON.PhysicsJoint.DistanceJoint:
                    constraint = new CANNON.DistanceConstraint(mainBody, connectedBody, jointData.maxDistance || 2);
                    break;
                case BABYLON.PhysicsJoint.SpringJoint:
                    var springData = jointData;
                    constraint = new CANNON.Spring(mainBody, connectedBody, {
                        restLength: springData.length,
                        stiffness: springData.stiffness,
                        damping: springData.damping,
                        localAnchorA: constraintData.pivotA,
                        localAnchorB: constraintData.pivotB
                    });
                    break;
                case BABYLON.PhysicsJoint.PointToPointJoint:
                case BABYLON.PhysicsJoint.BallAndSocketJoint:
                default:
                    constraint = new CANNON.PointToPointConstraint(mainBody, constraintData.pivotA, connectedBody, constraintData.pivotA, constraintData.maxForce);
                    break;
            }
            //set the collideConnected flag after the creation, since DistanceJoint ignores it.
            constraint.collideConnected = !!jointData.collision;
            impostorJoint.joint.physicsJoint = constraint;
            //don't add spring as constraint, as it is not one.
            if (impostorJoint.joint.type !== BABYLON.PhysicsJoint.SpringJoint) {
                this.world.addConstraint(constraint);
            }
            else {
                impostorJoint.mainImpostor.registerAfterPhysicsStep(function () {
                    constraint.applyForce();
                });
            }
        };
        CannonJSPlugin.prototype.removeJoint = function (joint) {
            //TODO
        };
        CannonJSPlugin.prototype._addMaterial = function (name, friction, restitution) {
            var index;
            var mat;
            for (index = 0; index < this._physicsMaterials.length; index++) {
                mat = this._physicsMaterials[index];
                if (mat.friction === friction && mat.restitution === restitution) {
                    return mat;
                }
            }
            var currentMat = new CANNON.Material("mat");
            currentMat.friction = friction;
            currentMat.restitution = restitution;
            this._physicsMaterials.push(currentMat);
            return currentMat;
        };
        CannonJSPlugin.prototype._checkWithEpsilon = function (value) {
            return value < BABYLON.PhysicsEngine.Epsilon ? BABYLON.PhysicsEngine.Epsilon : value;
        };
        CannonJSPlugin.prototype._createShape = function (impostor) {
            var object = impostor.object;
            var returnValue;
            var extendSize = impostor.getObjectExtendSize();
            switch (impostor.type) {
                case BABYLON.PhysicsEngine.SphereImpostor:
                    var radiusX = extendSize.x;
                    var radiusY = extendSize.y;
                    var radiusZ = extendSize.z;
                    returnValue = new CANNON.Sphere(Math.max(this._checkWithEpsilon(radiusX), this._checkWithEpsilon(radiusY), this._checkWithEpsilon(radiusZ)) / 2);
                    break;
                //TMP also for cylinder - TODO Cannon supports cylinder natively.
                case BABYLON.PhysicsImpostor.CylinderImpostor:
                    returnValue = new CANNON.Cylinder(this._checkWithEpsilon(extendSize.x) / 2, this._checkWithEpsilon(extendSize.x) / 2, this._checkWithEpsilon(extendSize.y), 16);
                    break;
                case BABYLON.PhysicsImpostor.BoxImpostor:
                    var box = extendSize.scale(0.5);
                    returnValue = new CANNON.Box(new CANNON.Vec3(this._checkWithEpsilon(box.x), this._checkWithEpsilon(box.y), this._checkWithEpsilon(box.z)));
                    break;
                case BABYLON.PhysicsImpostor.PlaneImpostor:
                    BABYLON.Tools.Warn("Attention, PlaneImposter might not behave as you expect. Consider using BoxImposter instead");
                    returnValue = new CANNON.Plane();
                    break;
                case BABYLON.PhysicsImpostor.MeshImpostor:
                    var rawVerts = object.getVerticesData ? object.getVerticesData(BABYLON.VertexBuffer.PositionKind) : [];
                    var rawFaces = object.getIndices ? object.getIndices() : [];
                    BABYLON.Tools.Warn("MeshImpostor only collides against spheres.");
                    returnValue = new CANNON.Trimesh(rawVerts, rawFaces);
                    break;
                case BABYLON.PhysicsImpostor.HeightmapImpostor:
                    returnValue = this._createHeightmap(object);
                    break;
                case BABYLON.PhysicsImpostor.ParticleImpostor:
                    returnValue = new CANNON.Particle();
                    break;
            }
            return returnValue;
        };
        CannonJSPlugin.prototype._createHeightmap = function (object, pointDepth) {
            var pos = object.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var matrix = [];
            //For now pointDepth will not be used and will be automatically calculated.
            //Future reference - try and find the best place to add a reference to the pointDepth variable.
            var arraySize = pointDepth || ~~(Math.sqrt(pos.length / 3) - 1);
            var dim = Math.min(object.getBoundingInfo().boundingBox.extendSize.x, object.getBoundingInfo().boundingBox.extendSize.z);
            var elementSize = dim * 2 / arraySize;
            var minY = object.getBoundingInfo().boundingBox.extendSize.y;
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
        CannonJSPlugin.prototype._updatePhysicsBodyTransformation = function (impostor) {
            var object = impostor.object;
            //make sure it is updated...
            object.computeWorldMatrix && object.computeWorldMatrix(true);
            // The delta between the mesh position and the mesh bounding box center
            var center = impostor.getObjectCenter();
            var extendSize = impostor.getObjectExtendSize();
            this._tmpDeltaPosition.copyFrom(object.position.subtract(center));
            this._tmpPosition.copyFrom(center);
            var quaternion = object.rotationQuaternion;
            //is shape is a plane or a heightmap, it must be rotated 90 degs in the X axis.
            if (impostor.type === BABYLON.PhysicsImpostor.PlaneImpostor || impostor.type === BABYLON.PhysicsImpostor.HeightmapImpostor || impostor.type === BABYLON.PhysicsImpostor.CylinderImpostor) {
                //-90 DEG in X, precalculated
                quaternion = quaternion.multiply(this._minus90X);
                //Invert! (Precalculated, 90 deg in X)
                //No need to clone. this will never change.
                impostor.setDeltaRotation(this._plus90X);
            }
            //If it is a heightfield, if should be centered.
            if (impostor.type === BABYLON.PhysicsEngine.HeightmapImpostor) {
                var mesh = object;
                //calculate the correct body position:
                var rotationQuaternion = mesh.rotationQuaternion;
                mesh.rotationQuaternion = this._tmpUnityRotation;
                mesh.computeWorldMatrix(true);
                //get original center with no rotation
                var c = center.clone();
                var oldPivot = mesh.getPivotMatrix() || BABYLON.Matrix.Translation(0, 0, 0);
                //rotation is back
                mesh.rotationQuaternion = rotationQuaternion;
                //calculate the new center using a pivot (since Cannon.js doesn't center height maps)
                var p = BABYLON.Matrix.Translation(mesh.getBoundingInfo().boundingBox.extendSize.x, 0, -mesh.getBoundingInfo().boundingBox.extendSize.z);
                mesh.setPivotMatrix(p);
                mesh.computeWorldMatrix(true);
                //calculate the translation
                var translation = mesh.getBoundingInfo().boundingBox.center.subtract(center).subtract(mesh.position).negate();
                this._tmpPosition.copyFromFloats(translation.x, translation.y - mesh.getBoundingInfo().boundingBox.extendSize.y, translation.z);
                //add it inverted to the delta 
                this._tmpDeltaPosition.copyFrom(mesh.getBoundingInfo().boundingBox.center.subtract(c));
                this._tmpDeltaPosition.y += mesh.getBoundingInfo().boundingBox.extendSize.y;
                mesh.setPivotMatrix(oldPivot);
                mesh.computeWorldMatrix(true);
            }
            else if (impostor.type === BABYLON.PhysicsEngine.MeshImpostor) {
                this._tmpDeltaPosition.copyFromFloats(0, 0, 0);
                this._tmpPosition.copyFrom(object.position);
            }
            impostor.setDeltaPosition(this._tmpDeltaPosition);
            //Now update the impostor object
            impostor.physicsBody.position.copy(this._tmpPosition);
            impostor.physicsBody.quaternion.copy(quaternion);
        };
        CannonJSPlugin.prototype.setTransformationFromPhysicsBody = function (impostor) {
            impostor.object.position.copyFrom(impostor.physicsBody.position);
            impostor.object.rotationQuaternion.copyFrom(impostor.physicsBody.quaternion);
        };
        CannonJSPlugin.prototype.setPhysicsBodyTransformation = function (impostor, newPosition, newRotation) {
            impostor.physicsBody.position.copy(newPosition);
            impostor.physicsBody.quaternion.copy(newRotation);
        };
        CannonJSPlugin.prototype.isSupported = function () {
            return window.CANNON !== undefined;
        };
        CannonJSPlugin.prototype.setLinearVelocity = function (impostor, velocity) {
            impostor.physicsBody.velocity.copy(velocity);
        };
        CannonJSPlugin.prototype.setAngularVelocity = function (impostor, velocity) {
            impostor.physicsBody.angularVelocity.copy(velocity);
        };
        CannonJSPlugin.prototype.getLinearVelocity = function (impostor) {
            var v = impostor.physicsBody.velocity;
            if (!v)
                return null;
            return new BABYLON.Vector3(v.x, v.y, v.z);
        };
        CannonJSPlugin.prototype.getAngularVelocity = function (impostor) {
            var v = impostor.physicsBody.angularVelocity;
            if (!v)
                return null;
            return new BABYLON.Vector3(v.x, v.y, v.z);
        };
        CannonJSPlugin.prototype.setBodyMass = function (impostor, mass) {
            impostor.physicsBody.mass = mass;
            impostor.physicsBody.updateMassProperties();
        };
        CannonJSPlugin.prototype.sleepBody = function (impostor) {
            impostor.physicsBody.sleep();
        };
        CannonJSPlugin.prototype.wakeUpBody = function (impostor) {
            impostor.physicsBody.wakeUp();
        };
        CannonJSPlugin.prototype.updateDistanceJoint = function (joint, maxDistance, minDistance) {
            joint.physicsJoint.distance = maxDistance;
        };
        CannonJSPlugin.prototype.enableMotor = function (joint, motorIndex) {
            if (!motorIndex) {
                joint.physicsJoint.enableMotor();
            }
        };
        CannonJSPlugin.prototype.disableMotor = function (joint, motorIndex) {
            if (!motorIndex) {
                joint.physicsJoint.disableMotor();
            }
        };
        CannonJSPlugin.prototype.setMotor = function (joint, speed, maxForce, motorIndex) {
            if (!motorIndex) {
                joint.physicsJoint.enableMotor();
                joint.physicsJoint.setMotorSpeed(speed);
                if (maxForce) {
                    this.setLimit(joint, maxForce);
                }
            }
        };
        CannonJSPlugin.prototype.setLimit = function (joint, upperLimit, lowerLimit) {
            joint.physicsJoint.motorEquation.maxForce = upperLimit;
            joint.physicsJoint.motorEquation.minForce = lowerLimit === void 0 ? -upperLimit : lowerLimit;
        };
        CannonJSPlugin.prototype.dispose = function () {
            //nothing to do, actually.
        };
        return CannonJSPlugin;
    })();
    BABYLON.CannonJSPlugin = CannonJSPlugin;
})(BABYLON || (BABYLON = {}));
