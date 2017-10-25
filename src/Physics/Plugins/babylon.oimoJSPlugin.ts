module BABYLON {
    declare var require: any;
    declare var OIMO: any;

    export class OimoJSPlugin implements IPhysicsEnginePlugin {

        public world: any;
        public name: string = "OimoJSPlugin";
        public BJSOIMO: any;


        constructor(iterations?: number) {
            this.BJSOIMO = typeof OIMO !== 'undefined' ? OIMO : (typeof require !== 'undefined' ? require('./Oimo') : undefined);
            this.world = new this.BJSOIMO.World(1 / 60, 2, iterations, true);
            this.world.worldscale(1);
            this.world.clear();
            //making sure no stats are calculated
            this.world.isNoStat = true;
        }

        public setGravity(gravity: Vector3) {
            this.world.gravity.copy(gravity);
        }

        public setTimeStep(timeStep: number) {
            this.world.timeStep = timeStep;
        }

        public getTimeStep(): number {
            return this.world.timeStep;
        }

        private _tmpImpostorsArray: Array<PhysicsImpostor> = [];

        public executeStep(delta: number, impostors: Array<PhysicsImpostor>) {

            impostors.forEach(function (impostor) {
                impostor.beforeStep();
            });

            this.world.step();

            impostors.forEach((impostor) => {
                impostor.afterStep();
                //update the ordered impostors array
                this._tmpImpostorsArray[impostor.uniqueId] = impostor;
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

        }

        public applyImpulse(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3) {
            var mass = impostor.physicsBody.massInfo.mass;
            impostor.physicsBody.applyImpulse(contactPoint.scale(this.BJSOIMO.INV_SCALE), force.scale(this.BJSOIMO.INV_SCALE * mass));
        }
        public applyForce(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3) {
            Tools.Warn("Oimo doesn't support applying force. Using impule instead.");
            this.applyImpulse(impostor, force, contactPoint);
        }
        public generatePhysicsBody(impostor: PhysicsImpostor) {
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
                var bodyConfig: any = {
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
                let addToArray = (parent: IPhysicsEnabledObject) => {
                    if (!parent.getChildMeshes) return;
                    parent.getChildMeshes().forEach(function (m) {
                        if (m.physicsImpostor) {
                            impostors.push(m.physicsImpostor);
                            //m.physicsImpostor._init();
                        }
                    });
                }
                addToArray(impostor.object)

                let checkWithEpsilon = (value: number): number => {
                    return Math.max(value, PhysicsEngine.Epsilon);
                }

                impostors.forEach((i) => {
                    if (!impostor.object.rotationQuaternion) {
                        return;
                    }
                    //get the correct bounding box
                    var oldQuaternion = i.object.rotationQuaternion;
                    var rot = new this.BJSOIMO.Euler().setFromQuaternion({
                        x: impostor.object.rotationQuaternion.x,
                        y: impostor.object.rotationQuaternion.y,
                        z: impostor.object.rotationQuaternion.z,
                        s: impostor.object.rotationQuaternion.w
                    });


                    var extendSize = i.getObjectExtendSize();

                    if (i === impostor) {
                        var center = impostor.getObjectCenter();

                        impostor.object.position.subtractToRef(center, this._tmpPositionVector);

                        //Can also use Array.prototype.push.apply
                        bodyConfig.pos.push(center.x);
                        bodyConfig.pos.push(center.y);
                        bodyConfig.pos.push(center.z);

                        //tmp solution
                        bodyConfig.rot.push(rot.x / (this.BJSOIMO.degtorad || this.BJSOIMO.TO_RAD));
                        bodyConfig.rot.push(rot.y / (this.BJSOIMO.degtorad || this.BJSOIMO.TO_RAD));
                        bodyConfig.rot.push(rot.z / (this.BJSOIMO.degtorad || this.BJSOIMO.TO_RAD));
                    } else {
                        let localPosition = i.object.getAbsolutePosition().subtract(impostor.object.getAbsolutePosition());
                        bodyConfig.pos.push(localPosition.x);
                        bodyConfig.pos.push(localPosition.y);
                        bodyConfig.pos.push(localPosition.z);

                        //tmp solution until https://github.com/lo-th/OIMO.js/pull/37 is merged
                        bodyConfig.rot.push(0);
                        bodyConfig.rot.push(0);
                        bodyConfig.rot.push(0);
                    }

                    // register mesh
                    switch (i.type) {
                        case PhysicsImpostor.ParticleImpostor:
                            Tools.Warn("No Particle support in this.BJSOIMO.js. using SphereImpostor instead");
                        case PhysicsImpostor.SphereImpostor:
                            var radiusX = extendSize.x;
                            var radiusY = extendSize.y;
                            var radiusZ = extendSize.z;

                            var size = Math.max(
                                checkWithEpsilon(radiusX),
                                checkWithEpsilon(radiusY),
                                checkWithEpsilon(radiusZ)) / 2;

                            bodyConfig.type.push('sphere');
                            //due to the way oimo works with compounds, add 3 times
                            bodyConfig.size.push(size);
                            bodyConfig.size.push(size);
                            bodyConfig.size.push(size);
                            break;

                        case PhysicsImpostor.CylinderImpostor:
                            var sizeX = checkWithEpsilon(extendSize.x) / 2;
                            var sizeY = checkWithEpsilon(extendSize.y);
                            bodyConfig.type.push('cylinder');
                            bodyConfig.size.push(sizeX);
                            bodyConfig.size.push(sizeY);
                            //due to the way oimo works with compounds, add one more value.
                            bodyConfig.size.push(sizeY);
                            break;

                        case PhysicsImpostor.PlaneImpostor:
                        case PhysicsImpostor.BoxImpostor:
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

                impostor.physicsBody = new this.BJSOIMO.Body(bodyConfig).body//this.world.add(bodyConfig);

            } else {
                this._tmpPositionVector.copyFromFloats(0, 0, 0);
            }

            impostor.setDeltaPosition(this._tmpPositionVector);

            //this._tmpPositionVector.addInPlace(impostor.mesh.getBoundingInfo().boundingBox.center);
            //this.setPhysicsBodyTransformation(impostor, this._tmpPositionVector, impostor.mesh.rotationQuaternion);
        }

        private _tmpPositionVector: Vector3 = Vector3.Zero();

        public removePhysicsBody(impostor: PhysicsImpostor) {
            //impostor.physicsBody.dispose();
            //Same as : (older oimo versions)
            this.world.removeRigidBody(impostor.physicsBody);
        }

        public generateJoint(impostorJoint: PhysicsImpostorJoint) {
            var mainBody = impostorJoint.mainImpostor.physicsBody;
            var connectedBody = impostorJoint.connectedImpostor.physicsBody;

            if (!mainBody || !connectedBody) {
                return;
            }
            var jointData = impostorJoint.joint.jointData;
            var options = jointData.nativeParams || {};
            var type;
            var nativeJointData: any = {
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

            }
            switch (impostorJoint.joint.type) {
                case PhysicsJoint.BallAndSocketJoint:
                    type = "jointBall";
                    break;
                case PhysicsJoint.SpringJoint:
                    Tools.Warn("this.BJSOIMO.js doesn't support Spring Constraint. Simulating using DistanceJoint instead");
                    var springData = <SpringJointData>jointData;
                    nativeJointData.min = springData.length || nativeJointData.min;
                    //Max should also be set, just make sure it is at least min
                    nativeJointData.max = Math.max(nativeJointData.min, nativeJointData.max);
                case PhysicsJoint.DistanceJoint:
                    type = "jointDistance";
                    nativeJointData.max = (<DistanceJointData>jointData).maxDistance
                    break;
                case PhysicsJoint.PrismaticJoint:
                    type = "jointPrisme";
                    break;
                case PhysicsJoint.SliderJoint:
                    type = "jointSlide";
                    break;
                case PhysicsJoint.WheelJoint:
                    type = "jointWheel";
                    break;
                case PhysicsJoint.HingeJoint:
                default:
                    type = "jointHinge";
                    break;
            }
            nativeJointData.type = type;
            impostorJoint.joint.physicsJoint = new this.BJSOIMO.Link(nativeJointData).joint//this.world.add(nativeJointData);
        }

        public removeJoint(impostorJoint: PhysicsImpostorJoint) {
            //Bug in Oimo prevents us from disposing a joint in the playground
            //joint.joint.physicsJoint.dispose();
            //So we will bruteforce it!
            try {
                this.world.removeJoint(impostorJoint.joint.physicsJoint);
            } catch (e) {
                Tools.Warn(e);
            }

        }

        public isSupported(): boolean {
            return this.BJSOIMO !== undefined;
        }

        public setTransformationFromPhysicsBody(impostor: PhysicsImpostor) {
            if (!impostor.physicsBody.sleeping) {
                //TODO check that
                if (impostor.physicsBody.shapes.next) {
                    var parentShape = this._getLastShape(impostor.physicsBody);
                    impostor.object.position.x = parentShape.position.x * this.BJSOIMO.WORLD_SCALE;
                    impostor.object.position.y = parentShape.position.y * this.BJSOIMO.WORLD_SCALE;
                    impostor.object.position.z = parentShape.position.z * this.BJSOIMO.WORLD_SCALE;
                } else {
                    impostor.object.position.copyFrom(impostor.physicsBody.getPosition());

                }

                if (impostor.object.rotationQuaternion) {
                    impostor.object.rotationQuaternion.copyFrom(impostor.physicsBody.getQuaternion());
                    impostor.object.rotationQuaternion.normalize();
                }
            }
        }

        public setPhysicsBodyTransformation(impostor: PhysicsImpostor, newPosition: Vector3, newRotation: Quaternion) {
            var body = impostor.physicsBody;

            body.position.init(newPosition.x * this.BJSOIMO.INV_SCALE, newPosition.y * this.BJSOIMO.INV_SCALE, newPosition.z * this.BJSOIMO.INV_SCALE);

            body.orientation.init(newRotation.w, newRotation.x, newRotation.y, newRotation.z);
            body.syncShapes();
            body.awake();
        }

        private _getLastShape(body: any): any {
            var lastShape = body.shapes;
            while (lastShape.next) {
                lastShape = lastShape.next;
            }
            return lastShape;
        }

        public setLinearVelocity(impostor: PhysicsImpostor, velocity: Vector3) {
            impostor.physicsBody.linearVelocity.init(velocity.x, velocity.y, velocity.z);
        }

        public setAngularVelocity(impostor: PhysicsImpostor, velocity: Vector3) {
            impostor.physicsBody.angularVelocity.init(velocity.x, velocity.y, velocity.z);
        }

        public getLinearVelocity(impostor: PhysicsImpostor): Nullable<Vector3> {
            var v = impostor.physicsBody.linearVelocity;
            if (!v) {
                return null;
            }
            return new Vector3(v.x, v.y, v.z)
        }
        public getAngularVelocity(impostor: PhysicsImpostor): Nullable<Vector3> {
            var v = impostor.physicsBody.angularVelocity;
            if (!v) {
                return null;
            }
            return new Vector3(v.x, v.y, v.z)
        }

        public setBodyMass(impostor: PhysicsImpostor, mass: number) {
            var staticBody: boolean = mass === 0;
            //this will actually set the body's density and not its mass.
            //But this is how oimo treats the mass variable.
            impostor.physicsBody.shapes.density = staticBody ? 1 : mass;
            impostor.physicsBody.setupMass(staticBody ? 0x2 : 0x1);
        }

        public getBodyMass(impostor: PhysicsImpostor): number {
            return impostor.physicsBody.shapes.density;
        }

        public getBodyFriction(impostor: PhysicsImpostor): number {
            return impostor.physicsBody.shapes.friction;
        }

        public setBodyFriction(impostor: PhysicsImpostor, friction: number) {
            impostor.physicsBody.shapes.friction = friction;
        }

        public getBodyRestitution(impostor: PhysicsImpostor): number {
            return impostor.physicsBody.shapes.restitution;
        }

        public setBodyRestitution(impostor: PhysicsImpostor, restitution: number) {
            impostor.physicsBody.shapes.restitution = restitution;
        }

        public sleepBody(impostor: PhysicsImpostor) {
            impostor.physicsBody.sleep();
        }

        public wakeUpBody(impostor: PhysicsImpostor) {
            impostor.physicsBody.awake();
        }

        public updateDistanceJoint(joint: PhysicsJoint, maxDistance: number, minDistance?: number) {
            joint.physicsJoint.limitMotor.upperLimit = maxDistance;
            if (minDistance !== void 0) {
                joint.physicsJoint.limitMotor.lowerLimit = minDistance;
            }
        }

        public setMotor(joint: IMotorEnabledJoint, speed: number, maxForce?: number, motorIndex?: number) {
            //TODO separate rotational and transational motors.
            var motor = motorIndex ? joint.physicsJoint.rotationalLimitMotor2 : joint.physicsJoint.rotationalLimitMotor1 || joint.physicsJoint.rotationalLimitMotor || joint.physicsJoint.limitMotor;
            if (motor) {
                motor.setMotor(speed, maxForce);
            }
        }

        public setLimit(joint: IMotorEnabledJoint, upperLimit: number, lowerLimit?: number, motorIndex?: number) {
            //TODO separate rotational and transational motors.
            var motor = motorIndex ? joint.physicsJoint.rotationalLimitMotor2 : joint.physicsJoint.rotationalLimitMotor1 || joint.physicsJoint.rotationalLimitMotor || joint.physicsJoint.limitMotor;
            if (motor) {
                motor.setLimit(upperLimit, lowerLimit === void 0 ? -upperLimit : lowerLimit);
            }
        }

        public syncMeshWithImpostor(mesh: AbstractMesh, impostor: PhysicsImpostor) {
            var body = impostor.physicsBody;

            mesh.position.x = body.position.x;
            mesh.position.y = body.position.y;
            mesh.position.z = body.position.z;

            if (mesh.rotationQuaternion) {
                mesh.rotationQuaternion.x = body.orientation.x;
                mesh.rotationQuaternion.y = body.orientation.y;
                mesh.rotationQuaternion.z = body.orientation.z;
                mesh.rotationQuaternion.w = body.orientation.s;
            }
        }

        public getRadius(impostor: PhysicsImpostor): number {
            return impostor.physicsBody.shapes.radius;
        }

        public getBoxSizeToRef(impostor: PhysicsImpostor, result: Vector3): void {
            var shape = impostor.physicsBody.shapes;
            result.x = shape.halfWidth * 2;
            result.y = shape.halfHeight * 2;
            result.z = shape.halfDepth * 2;
        }

        public dispose() {
            this.world.clear();
        }
    }
}
