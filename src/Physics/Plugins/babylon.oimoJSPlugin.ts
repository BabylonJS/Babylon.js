module BABYLON {
    declare var OIMO;

    export class OimoJSPlugin {

        public world: any;
        public name: string = "OimoJSPlugin";

        constructor(iterations?: number) {
            this.world = new OIMO.World(1 / 60, 2, iterations, true);
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

        private _tmpImpostorsArray: Array<PhysicsImpostor> = [];

        public executeStep(delta: number, impostors: Array<PhysicsImpostor>) {

            impostors.forEach(function (impostor) {
                impostor.beforeStep();
            });

            this.world.step();

            impostors.forEach((impostor) => {
                impostor.afterStep();
                //update the ordered impostors array
                this._tmpImpostorsArray[impostor.mesh.uniqueId] = impostor;
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
            impostor.physicsBody.applyImpulse(contactPoint.scale(OIMO.INV_SCALE), force.scale(OIMO.INV_SCALE * mass));
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

            impostor.mesh.computeWorldMatrix(true);

            if (impostor.isBodyInitRequired()) {
                if (!impostor.mesh.rotationQuaternion) {
                    impostor.mesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(impostor.mesh.rotation.y, impostor.mesh.rotation.x, impostor.mesh.rotation.z);
                }


                var bodyConfig: any = {
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
                function addToArray(parent: AbstractMesh) {
                    parent.getChildMeshes().forEach(function (m) {
                        if (m.physicsImpostor) {
                            impostors.push(m.physicsImpostor);
                            m.physicsImpostor._init();
                        }
                    });
                }
                addToArray(impostor.mesh)

                function checkWithEpsilon(value: number): number {
                    return Math.max(value, PhysicsEngine.Epsilon);
                }

                impostors.forEach((i) => {
                    
                    //get the correct bounding box
                    var oldQuaternion = i.mesh.rotationQuaternion;
                    var rot = new OIMO.Euler().setFromQuaternion({ x: impostor.mesh.rotationQuaternion.x, y: impostor.mesh.rotationQuaternion.y, z: impostor.mesh.rotationQuaternion.z, s: impostor.mesh.rotationQuaternion.w });

                    i.mesh.rotationQuaternion = new Quaternion(0, 0, 0, 1);
                    i.mesh.computeWorldMatrix(true);

                    var bbox = i.mesh.getBoundingInfo().boundingBox;

                    if (i === impostor) {

                        impostor.mesh.position.subtractToRef(impostor.mesh.getBoundingInfo().boundingBox.center, this._tmpPositionVector);

                        //Can also use Array.prototype.push.apply
                        bodyConfig.pos.push(bbox.center.x);
                        bodyConfig.pos.push(bbox.center.y);
                        bodyConfig.pos.push(bbox.center.z);
                        
                        //tmp solution
                        bodyConfig.rot.push(rot.x / (OIMO.degtorad || OIMO.TO_RAD));
                        bodyConfig.rot.push(rot.y / (OIMO.degtorad || OIMO.TO_RAD));
                        bodyConfig.rot.push(rot.z / (OIMO.degtorad || OIMO.TO_RAD));
                    } else {
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
                        case PhysicsEngine.SphereImpostor:
                            var radiusX = bbox.maximumWorld.x - bbox.minimumWorld.x;
                            var radiusY = bbox.maximumWorld.y - bbox.minimumWorld.y;
                            var radiusZ = bbox.maximumWorld.z - bbox.minimumWorld.z;

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

                        case PhysicsEngine.PlaneImpostor:
                        //TODO Oimo now supports cylinder!
                        case PhysicsEngine.CylinderImpostor:
                        case PhysicsEngine.BoxImpostor:
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

                impostor.physicsBody = new OIMO.Body(bodyConfig).body//this.world.add(bodyConfig);

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
                    Tools.Warn("Oimo.js doesn't support Spring Constraint. Simulating using DistanceJoint instead");
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
            impostorJoint.joint.physicsJoint = new OIMO.Link(nativeJointData).joint//this.world.add(nativeJointData);
        }

        public removeJoint(joint: PhysicsImpostorJoint) {
            joint.joint.physicsJoint.dispose();
        }

        public isSupported(): boolean {
            return OIMO !== undefined;
        }

        public setTransformationFromPhysicsBody(impostor: PhysicsImpostor) {
            if (!impostor.physicsBody.sleeping) {
                //TODO check that
                if (impostor.physicsBody.shapes.next) {
                    var parentShape = this._getLastShape(impostor.physicsBody);
                    impostor.mesh.position.x = parentShape.position.x * OIMO.WORLD_SCALE;
                    impostor.mesh.position.y = parentShape.position.y * OIMO.WORLD_SCALE;
                    impostor.mesh.position.z = parentShape.position.z * OIMO.WORLD_SCALE;
                } else {
                    impostor.mesh.position.copyFrom(impostor.physicsBody.getPosition());

                }
                impostor.mesh.rotationQuaternion.copyFrom(impostor.physicsBody.getQuaternion());
            }
        }

        public setPhysicsBodyTransformation(impostor: PhysicsImpostor, newPosition: Vector3, newRotation: Quaternion) {
            var body = impostor.physicsBody;

            body.position.init(newPosition.x * OIMO.INV_SCALE, newPosition.y * OIMO.INV_SCALE, newPosition.z * OIMO.INV_SCALE);

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

        public setVelocity(impostor: PhysicsImpostor, velocity: Vector3) {
            impostor.physicsBody.linearVelocity.init(velocity.x, velocity.y, velocity.z);
        }

        public sleepBody(impostor: PhysicsImpostor) {
            impostor.physicsBody.sleep();
        }

        public wakeUpBody(impostor: PhysicsImpostor) {
            impostor.physicsBody.awake();
        }

        public dispose() {
            this.world.clear();
        }
    }
}

