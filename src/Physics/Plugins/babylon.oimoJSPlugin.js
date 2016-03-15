var BABYLON;
(function (BABYLON) {
    var OimoJSPlugin = (function () {
        function OimoJSPlugin(iterations) {
            this.name = "OimoJSPlugin";
            this._tmpImpostorsArray = [];
            this._tmpPositionVector = BABYLON.Vector3.Zero();
            this.world = new OIMO.World(1 / 60, 2, iterations, true);
            this.world.clear();
            //making sure no stats are calculated
            this.world.isNoStat = true;
        }
        OimoJSPlugin.prototype.setGravity = function (gravity) {
            this.world.gravity.copy(gravity);
        };
        OimoJSPlugin.prototype.setTimeStep = function (timeStep) {
            this.world.timeStep = timeStep;
        };
        OimoJSPlugin.prototype.executeStep = function (delta, impostors) {
            var _this = this;
            impostors.forEach(function (impostor) {
                impostor.beforeStep();
            });
            this.world.step();
            impostors.forEach(function (impostor) {
                impostor.afterStep();
                //update the ordered impostors array
                _this._tmpImpostorsArray[impostor.mesh.uniqueId] = impostor;
            });
            //check for collisions
            var contact = this.world.contacts;
            while (contact !== null) {
                if (contact.touching && !contact.body1.sleeping && !contact.body2.sleeping) {
                    contact = contact.next;
                    continue;
                }
                //is this body colliding with any other? get the impostor
                var mainImpostor = this._tmpImpostorsArray[+contact.body1.name];
                var collidingImpostor = this._tmpImpostorsArray[+contact.body2.name];
                if (!mainImpostor || !collidingImpostor) {
                    contact = contact.next;
                    continue;
                }
                mainImpostor.onCollide({ body: collidingImpostor.physicsBody });
                collidingImpostor.onCollide({ body: mainImpostor.physicsBody });
                contact = contact.next;
            }
        };
        OimoJSPlugin.prototype.applyImpulse = function (impostor, force, contactPoint) {
            var mass = impostor.physicsBody.massInfo.mass;
            impostor.physicsBody.applyImpulse(contactPoint.scale(OIMO.INV_SCALE), force.scale(OIMO.INV_SCALE * mass));
        };
        OimoJSPlugin.prototype.applyForce = function (impostor, force, contactPoint) {
            BABYLON.Tools.Warn("Oimo doesn't support applying force. Using impule instead.");
            this.applyImpulse(impostor, force, contactPoint);
        };
        OimoJSPlugin.prototype.generatePhysicsBody = function (impostor) {
            var _this = this;
            //parent-child relationship. Does this impostor has a parent impostor?
            if (impostor.parent) {
                if (impostor.physicsBody) {
                    this.removePhysicsBody(impostor);
                    //TODO is that needed?
                    impostor.forceUpdate();
                }
                return;
            }
            impostor.mesh.computeWorldMatrix(true);
            if (impostor.isBodyInitRequired()) {
                if (!impostor.mesh.rotationQuaternion) {
                    impostor.mesh.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(impostor.mesh.rotation.y, impostor.mesh.rotation.x, impostor.mesh.rotation.z);
                }
                var bodyConfig = {
                    name: impostor.mesh.uniqueId,
                    //Oimo must have mass, also for static objects.
                    config: [impostor.getParam("mass") || 1, impostor.getParam("friction"), impostor.getParam("restitution")],
                    size: [],
                    type: [],
                    pos: [],
                    rot: [],
                    move: impostor.getParam("mass") !== 0,
                    //Supporting older versions of Oimo
                    world: this.world
                };
                var impostors = [impostor];
                function addToArray(parent) {
                    parent.getChildMeshes().forEach(function (m) {
                        if (m.physicsImpostor) {
                            impostors.push(m.physicsImpostor);
                            m.physicsImpostor._init();
                        }
                    });
                }
                addToArray(impostor.mesh);
                function checkWithEpsilon(value) {
                    return Math.max(value, BABYLON.PhysicsEngine.Epsilon);
                }
                impostors.forEach(function (i) {
                    //get the correct bounding box
                    var oldQuaternion = i.mesh.rotationQuaternion;
                    var rot = new OIMO.Euler().setFromQuaternion({ x: impostor.mesh.rotationQuaternion.x, y: impostor.mesh.rotationQuaternion.y, z: impostor.mesh.rotationQuaternion.z, s: impostor.mesh.rotationQuaternion.w });
                    i.mesh.rotationQuaternion = new BABYLON.Quaternion(0, 0, 0, 1);
                    i.mesh.computeWorldMatrix(true);
                    var bbox = i.mesh.getBoundingInfo().boundingBox;
                    if (i === impostor) {
                        impostor.mesh.position.subtractToRef(impostor.mesh.getBoundingInfo().boundingBox.center, _this._tmpPositionVector);
                        //Can also use Array.prototype.push.apply
                        bodyConfig.pos.push(bbox.center.x);
                        bodyConfig.pos.push(bbox.center.y);
                        bodyConfig.pos.push(bbox.center.z);
                        //tmp solution
                        bodyConfig.rot.push(rot.x / (OIMO.degtorad || OIMO.TO_RAD));
                        bodyConfig.rot.push(rot.y / (OIMO.degtorad || OIMO.TO_RAD));
                        bodyConfig.rot.push(rot.z / (OIMO.degtorad || OIMO.TO_RAD));
                    }
                    else {
                        bodyConfig.pos.push(i.mesh.position.x);
                        bodyConfig.pos.push(i.mesh.position.y);
                        bodyConfig.pos.push(i.mesh.position.z);
                        //tmp solution until https://github.com/lo-th/Oimo.js/pull/37 is merged
                        bodyConfig.rot.push(0);
                        bodyConfig.rot.push(0);
                        bodyConfig.rot.push(0);
                    }
                    // register mesh
                    switch (i.type) {
                        case BABYLON.PhysicsEngine.SphereImpostor:
                            var radiusX = bbox.maximumWorld.x - bbox.minimumWorld.x;
                            var radiusY = bbox.maximumWorld.y - bbox.minimumWorld.y;
                            var radiusZ = bbox.maximumWorld.z - bbox.minimumWorld.z;
                            var size = Math.max(checkWithEpsilon(radiusX), checkWithEpsilon(radiusY), checkWithEpsilon(radiusZ)) / 2;
                            bodyConfig.type.push('sphere');
                            //due to the way oimo works with compounds, add 3 times
                            bodyConfig.size.push(size);
                            bodyConfig.size.push(size);
                            bodyConfig.size.push(size);
                            break;
                        case BABYLON.PhysicsEngine.PlaneImpostor:
                        //TODO Oimo now supports cylinder!
                        case BABYLON.PhysicsEngine.CylinderImpostor:
                        case BABYLON.PhysicsEngine.BoxImpostor:
                        default:
                            var min = bbox.minimumWorld;
                            var max = bbox.maximumWorld;
                            var box = max.subtract(min);
                            var sizeX = checkWithEpsilon(box.x);
                            var sizeY = checkWithEpsilon(box.y);
                            var sizeZ = checkWithEpsilon(box.z);
                            bodyConfig.type.push('box');
                            bodyConfig.size.push(sizeX);
                            bodyConfig.size.push(sizeY);
                            bodyConfig.size.push(sizeZ);
                            break;
                    }
                    //actually not needed, but hey...
                    i.mesh.rotationQuaternion = oldQuaternion;
                });
                impostor.physicsBody = new OIMO.Body(bodyConfig).body; //this.world.add(bodyConfig);
            }
            else {
                this._tmpPositionVector.copyFromFloats(0, 0, 0);
            }
            impostor.setDeltaPosition(this._tmpPositionVector);
            //this._tmpPositionVector.addInPlace(impostor.mesh.getBoundingInfo().boundingBox.center);
            //this.setPhysicsBodyTransformation(impostor, this._tmpPositionVector, impostor.mesh.rotationQuaternion);
        };
        OimoJSPlugin.prototype.removePhysicsBody = function (impostor) {
            //impostor.physicsBody.dispose();
            //Same as : (older oimo versions)
            this.world.removeRigidBody(impostor.physicsBody);
        };
        OimoJSPlugin.prototype.generateJoint = function (impostorJoint) {
            var mainBody = impostorJoint.mainImpostor.physicsBody;
            var connectedBody = impostorJoint.connectedImpostor.physicsBody;
            if (!mainBody || !connectedBody) {
                return;
            }
            var jointData = impostorJoint.joint.jointData;
            var options = jointData.nativeParams || {};
            var type;
            var nativeJointData = {
                body1: mainBody,
                body2: connectedBody,
                axe1: options.axe1 || (jointData.mainAxis ? jointData.mainAxis.asArray() : null),
                axe2: options.axe2 || (jointData.connectedAxis ? jointData.connectedAxis.asArray() : null),
                pos1: options.pos1 || (jointData.mainPivot ? jointData.mainPivot.asArray() : null),
                pos2: options.pos2 || (jointData.connectedPivot ? jointData.connectedPivot.asArray() : null),
                min: options.min,
                max: options.max,
                collision: options.collision || jointData.collision,
                spring: options.spring,
                //supporting older version of Oimo
                world: this.world
            };
            switch (impostorJoint.joint.type) {
                case BABYLON.PhysicsJoint.BallAndSocketJoint:
                    type = "jointBall";
                    break;
                case BABYLON.PhysicsJoint.SpringJoint:
                    BABYLON.Tools.Warn("Oimo.js doesn't support Spring Constraint. Simulating using DistanceJoint instead");
                    var springData = jointData;
                    nativeJointData.min = springData.length || nativeJointData.min;
                    //Max should also be set, just make sure it is at least min
                    nativeJointData.max = Math.max(nativeJointData.min, nativeJointData.max);
                case BABYLON.PhysicsJoint.DistanceJoint:
                    type = "jointDistance";
                    nativeJointData.max = jointData.maxDistance;
                    break;
                case BABYLON.PhysicsJoint.PrismaticJoint:
                    type = "jointPrisme";
                    break;
                case BABYLON.PhysicsJoint.SliderJoint:
                    type = "jointSlide";
                    break;
                case BABYLON.PhysicsJoint.WheelJoint:
                    type = "jointWheel";
                    break;
                case BABYLON.PhysicsJoint.HingeJoint:
                default:
                    type = "jointHinge";
                    break;
            }
            nativeJointData.type = type;
            impostorJoint.joint.physicsJoint = new OIMO.Link(nativeJointData).joint; //this.world.add(nativeJointData);
        };
        OimoJSPlugin.prototype.removeJoint = function (joint) {
            joint.joint.physicsJoint.dispose();
        };
        OimoJSPlugin.prototype.isSupported = function () {
            return OIMO !== undefined;
        };
        OimoJSPlugin.prototype.setTransformationFromPhysicsBody = function (impostor) {
            if (!impostor.physicsBody.sleeping) {
                //TODO check that
                if (impostor.physicsBody.shapes.next) {
                    var parentShape = this._getLastShape(impostor.physicsBody);
                    impostor.mesh.position.x = parentShape.position.x * OIMO.WORLD_SCALE;
                    impostor.mesh.position.y = parentShape.position.y * OIMO.WORLD_SCALE;
                    impostor.mesh.position.z = parentShape.position.z * OIMO.WORLD_SCALE;
                }
                else {
                    impostor.mesh.position.copyFrom(impostor.physicsBody.getPosition());
                }
                impostor.mesh.rotationQuaternion.copyFrom(impostor.physicsBody.getQuaternion());
            }
        };
        OimoJSPlugin.prototype.setPhysicsBodyTransformation = function (impostor, newPosition, newRotation) {
            var body = impostor.physicsBody;
            body.position.init(newPosition.x * OIMO.INV_SCALE, newPosition.y * OIMO.INV_SCALE, newPosition.z * OIMO.INV_SCALE);
            body.orientation.init(newRotation.w, newRotation.x, newRotation.y, newRotation.z);
            body.syncShapes();
            body.awake();
        };
        OimoJSPlugin.prototype._getLastShape = function (body) {
            var lastShape = body.shapes;
            while (lastShape.next) {
                lastShape = lastShape.next;
            }
            return lastShape;
        };
        OimoJSPlugin.prototype.setLinearVelocity = function (impostor, velocity) {
            impostor.physicsBody.linearVelocity.init(velocity.x, velocity.y, velocity.z);
        };
        OimoJSPlugin.prototype.setAngularVelocity = function (impostor, velocity) {
            impostor.physicsBody.angularVelocity.init(velocity.x, velocity.y, velocity.z);
        };
        OimoJSPlugin.prototype.getLinearVelocity = function (impostor) {
            var v = impostor.physicsBody.linearVelocity;
            if (!v)
                return null;
            return new BABYLON.Vector3(v.x, v.y, v.z);
        };
        OimoJSPlugin.prototype.getAngularVelocity = function (impostor) {
            var v = impostor.physicsBody.angularVelocity;
            if (!v)
                return null;
            return new BABYLON.Vector3(v.x, v.y, v.z);
        };
        OimoJSPlugin.prototype.setBodyMass = function (impostor, mass) {
            var staticBody = mass === 0;
            //this will actually set the body's density and not its mass.
            //But this is how oimo treats the mass variable.
            impostor.physicsBody.shapes.density = staticBody ? 1 : mass;
            impostor.physicsBody.setupMass(staticBody ? 0x2 : 0x1);
        };
        OimoJSPlugin.prototype.sleepBody = function (impostor) {
            impostor.physicsBody.sleep();
        };
        OimoJSPlugin.prototype.wakeUpBody = function (impostor) {
            impostor.physicsBody.awake();
        };
        OimoJSPlugin.prototype.updateDistanceJoint = function (joint, maxDistance, minDistance) {
            joint.physicsJoint.limitMotoe.upperLimit = maxDistance;
            if (minDistance !== void 0) {
                joint.physicsJoint.limitMotoe.lowerLimit = minDistance;
            }
        };
        OimoJSPlugin.prototype.setMotor = function (joint, force, maxForce, motorIndex) {
            var motor = motorIndex ? joint.physicsJoint.rotationalLimitMotor2 : joint.physicsJoint.rotationalLimitMotor1 || joint.physicsJoint.limitMotor;
            if (motor) {
                motor.setMotor(force, maxForce);
            }
        };
        OimoJSPlugin.prototype.setLimit = function (joint, upperLimit, lowerLimit, motorIndex) {
            var motor = motorIndex ? joint.physicsJoint.rotationalLimitMotor2 : joint.physicsJoint.rotationalLimitMotor1 || joint.physicsJoint.limitMotor;
            if (motor) {
                motor.setLimit(upperLimit, lowerLimit || -upperLimit);
            }
        };
        OimoJSPlugin.prototype.dispose = function () {
            this.world.clear();
        };
        return OimoJSPlugin;
    })();
    BABYLON.OimoJSPlugin = OimoJSPlugin;
})(BABYLON || (BABYLON = {}));
