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
                _this._tmpImpostorsArray[impostor.uniqueId] = impostor;
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
            if (impostor.isBodyInitRequired()) {
                var bodyConfig = {
                    name: impostor.uniqueId,
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
                    if (!parent.getChildMeshes)
                        return;
                    parent.getChildMeshes().forEach(function (m) {
                        if (m.physicsImpostor) {
                            impostors.push(m.physicsImpostor);
                            m.physicsImpostor._init();
                        }
                    });
                }
                addToArray(impostor.object);
                function checkWithEpsilon(value) {
                    return Math.max(value, BABYLON.PhysicsEngine.Epsilon);
                }
                impostors.forEach(function (i) {
                    //get the correct bounding box
                    var oldQuaternion = i.object.rotationQuaternion;
                    var rot = new OIMO.Euler().setFromQuaternion({
                        x: impostor.object.rotationQuaternion.x,
                        y: impostor.object.rotationQuaternion.y,
                        z: impostor.object.rotationQuaternion.z,
                        s: impostor.object.rotationQuaternion.w
                    });
                    var extendSize = i.getObjectExtendSize();
                    if (i === impostor) {
                        var center = impostor.getObjectCenter();
                        impostor.object.position.subtractToRef(center, _this._tmpPositionVector);
                        //Can also use Array.prototype.push.apply
                        bodyConfig.pos.push(center.x);
                        bodyConfig.pos.push(center.y);
                        bodyConfig.pos.push(center.z);
                        //tmp solution
                        bodyConfig.rot.push(rot.x / (OIMO.degtorad || OIMO.TO_RAD));
                        bodyConfig.rot.push(rot.y / (OIMO.degtorad || OIMO.TO_RAD));
                        bodyConfig.rot.push(rot.z / (OIMO.degtorad || OIMO.TO_RAD));
                    }
                    else {
                        bodyConfig.pos.push(i.object.position.x);
                        bodyConfig.pos.push(i.object.position.y);
                        bodyConfig.pos.push(i.object.position.z);
                        //tmp solution until https://github.com/lo-th/Oimo.js/pull/37 is merged
                        bodyConfig.rot.push(0);
                        bodyConfig.rot.push(0);
                        bodyConfig.rot.push(0);
                    }
                    // register mesh
                    switch (i.type) {
                        case BABYLON.PhysicsImpostor.ParticleImpostor:
                            BABYLON.Tools.Warn("No Particle support in Oimo.js. using SphereImpostor instead");
                        case BABYLON.PhysicsImpostor.SphereImpostor:
                            var radiusX = extendSize.x;
                            var radiusY = extendSize.y;
                            var radiusZ = extendSize.z;
                            var size = Math.max(checkWithEpsilon(radiusX), checkWithEpsilon(radiusY), checkWithEpsilon(radiusZ)) / 2;
                            bodyConfig.type.push('sphere');
                            //due to the way oimo works with compounds, add 3 times
                            bodyConfig.size.push(size);
                            bodyConfig.size.push(size);
                            bodyConfig.size.push(size);
                            break;
                        case BABYLON.PhysicsImpostor.CylinderImpostor:
                            var sizeX = checkWithEpsilon(extendSize.x) / 2;
                            var sizeY = checkWithEpsilon(extendSize.y);
                            bodyConfig.type.push('cylinder');
                            bodyConfig.size.push(sizeX);
                            bodyConfig.size.push(sizeY);
                            //due to the way oimo works with compounds, add one more value.
                            bodyConfig.size.push(sizeY);
                            break;
                        case BABYLON.PhysicsImpostor.PlaneImpostor:
                        case BABYLON.PhysicsImpostor.BoxImpostor:
                        default:
                            var sizeX = checkWithEpsilon(extendSize.x);
                            var sizeY = checkWithEpsilon(extendSize.y);
                            var sizeZ = checkWithEpsilon(extendSize.z);
                            bodyConfig.type.push('box');
                            bodyConfig.size.push(sizeX);
                            bodyConfig.size.push(sizeY);
                            bodyConfig.size.push(sizeZ);
                            break;
                    }
                    //actually not needed, but hey...
                    i.object.rotationQuaternion = oldQuaternion;
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
        OimoJSPlugin.prototype.removeJoint = function (impostorJoint) {
            //Bug in Oimo prevents us from disposing a joint in the playground
            //joint.joint.physicsJoint.dispose();
            //So we will bruteforce it!
            try {
                this.world.removeJoint(impostorJoint.joint.physicsJoint);
            }
            catch (e) {
                BABYLON.Tools.Warn(e);
            }
        };
        OimoJSPlugin.prototype.isSupported = function () {
            return OIMO !== undefined;
        };
        OimoJSPlugin.prototype.setTransformationFromPhysicsBody = function (impostor) {
            if (!impostor.physicsBody.sleeping) {
                //TODO check that
                if (impostor.physicsBody.shapes.next) {
                    var parentShape = this._getLastShape(impostor.physicsBody);
                    impostor.object.position.x = parentShape.position.x * OIMO.WORLD_SCALE;
                    impostor.object.position.y = parentShape.position.y * OIMO.WORLD_SCALE;
                    impostor.object.position.z = parentShape.position.z * OIMO.WORLD_SCALE;
                }
                else {
                    impostor.object.position.copyFrom(impostor.physicsBody.getPosition());
                }
                impostor.object.rotationQuaternion.copyFrom(impostor.physicsBody.getQuaternion());
                impostor.object.rotationQuaternion.normalize();
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
            joint.physicsJoint.limitMotor.upperLimit = maxDistance;
            if (minDistance !== void 0) {
                joint.physicsJoint.limitMotor.lowerLimit = minDistance;
            }
        };
        OimoJSPlugin.prototype.setMotor = function (joint, speed, maxForce, motorIndex) {
            //TODO separate rotational and transational motors.
            var motor = motorIndex ? joint.physicsJoint.rotationalLimitMotor2 : joint.physicsJoint.rotationalLimitMotor1 || joint.physicsJoint.rotationalLimitMotor || joint.physicsJoint.limitMotor;
            if (motor) {
                motor.setMotor(speed, maxForce);
            }
        };
        OimoJSPlugin.prototype.setLimit = function (joint, upperLimit, lowerLimit, motorIndex) {
            //TODO separate rotational and transational motors.
            var motor = motorIndex ? joint.physicsJoint.rotationalLimitMotor2 : joint.physicsJoint.rotationalLimitMotor1 || joint.physicsJoint.rotationalLimitMotor || joint.physicsJoint.limitMotor;
            if (motor) {
                motor.setLimit(upperLimit, lowerLimit === void 0 ? -upperLimit : lowerLimit);
            }
        };
        OimoJSPlugin.prototype.dispose = function () {
            this.world.clear();
        };
        return OimoJSPlugin;
    }());
    BABYLON.OimoJSPlugin = OimoJSPlugin;
})(BABYLON || (BABYLON = {}));
