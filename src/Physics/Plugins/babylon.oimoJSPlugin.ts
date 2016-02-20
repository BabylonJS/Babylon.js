module BABYLON {
    declare var OIMO;

    export class OimoJSPlugin {

        public world: any;
        public name: string = "OimoJSPlugin";

        constructor(iterations?: number) {
            this.world = new OIMO.World(1/60, 2, iterations);
            this.world.clear();
            this.world.isNoStat = true;
        }

        public setGravity(gravity: Vector3) {
            this.world.gravity.copy(gravity);
        }

        private _tmpImpostorsArray: Array<PhysicsImpostor> = [];

        public executeStep(delta: number, impostors: Array<PhysicsImpostor>) {

            impostors.forEach(function(impostor) {
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
            impostor.physicsBody.applyImpulse(contactPoint.scale(OIMO.INV_SCALE), force.scale(OIMO.INV_SCALE));

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

                impostor.mesh.position.subtractToRef(impostor.mesh.getBoundingInfo().boundingBox.center, this._tmpPositionVector);
            
                var bodyConfig: any = {
                    name: impostor.mesh.uniqueId,
                    //Oimo must have mass, also for static objects.
                    config: [impostor.getParam("mass") || 1, impostor.getParam("friction"), impostor.getParam("restitution")],
                    size: [],
                    type: [],
                    pos: [],
                    rot: [],
                    move: impostor.getParam("mass") !== 0
                };

                var impostors = [impostor];
                function addToArray(parent: AbstractMesh) {
                    parent.getChildMeshes().forEach(function(m) {
                        if (m.physicsImpostor) {
                            impostors.push(m.physicsImpostor);
                        }
                        addToArray(m);
                    });
                }
                addToArray(impostor.mesh)

                function checkWithEpsilon(value: number): number {
                    return Math.max(value, PhysicsEngine.Epsilon);
                }

                impostors.forEach(function(i) {
                    
                    //get the correct bounding box
                    var oldQuaternion = i.mesh.rotationQuaternion;
                    i.mesh.rotationQuaternion = new Quaternion(0, 0, 0, 1);
                    i.mesh.computeWorldMatrix(true);

                    var bbox = i.mesh.getBoundingInfo().boundingBox;
                    var rot = new OIMO.Euler().setFromQuaternion({ x: impostor.mesh.rotationQuaternion.x, y: impostor.mesh.rotationQuaternion.y, z: impostor.mesh.rotationQuaternion.z, s: impostor.mesh.rotationQuaternion.w });

                    if (i === impostor) {
                        //Can also use Array.prototype.push.apply
                        bodyConfig.pos.push(bbox.center.x);
                        bodyConfig.pos.push(bbox.center.y);
                        bodyConfig.pos.push(bbox.center.z);
                    } else {
                        bodyConfig.pos.push(i.mesh.position.x);
                        bodyConfig.pos.push(i.mesh.position.y);
                        bodyConfig.pos.push(i.mesh.position.z);
                    }

                    bodyConfig.rot.push(rot.x / OIMO.degtorad);
                    bodyConfig.rot.push(rot.y / OIMO.degtorad);
                    bodyConfig.rot.push(rot.z / OIMO.degtorad);
                    
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

                impostor.physicsBody = this.world.add(bodyConfig);

                impostor.setDeltaPosition(this._tmpPositionVector);

            } else {
                this._tmpPositionVector.copyFromFloats(0, 0, 0);
            }
            this._tmpPositionVector.addInPlace(impostor.mesh.getBoundingInfo().boundingBox.center);
            this.setPhysicsBodyTransformation(impostor, this._tmpPositionVector, impostor.mesh.rotationQuaternion);
        }

        private _tmpPositionVector: Vector3 = Vector3.Zero();

        public removePhysicsBody(impostor: PhysicsImpostor) {
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
            switch (impostorJoint.joint.type) {
                case PhysicsJoint.BallAndSocketJoint:
                    type = "jointBall";
                    break;
                case PhysicsJoint.DistanceJoint:
                    type = "jointDistance";
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
            impostorJoint.joint.physicsJoint = this.world.add({
                type: type,
                body1: mainBody.body,
                body2: connectedBody.body,
                min: options.min,
                max: options.max,
                axe1: jointData.mainAxis ? jointData.mainAxis.asArray() : null,
                axe2: jointData.connectedAxis ? jointData.connectedAxis.asArray() : null,
                pos1: jointData.mainPivot ? jointData.mainPivot.asArray() : null,
                pos2: jointData.connectedPivot ? jointData.connectedPivot.asArray() : null,
                collision: options.collision,
                spring: options.spring
            });
        }

        public removeJoint(joint: PhysicsImpostorJoint) {
            //TODO
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
            
            if(!newPosition.equalsWithEpsilon(impostor.mesh.position)) {
                body.setPosition(newPosition);
            }
            
            body.setQuaternion(newRotation);
        }

        private _getLastShape(body: any): any {
            var lastShape = body.shapes;
            while (lastShape.next) {
                lastShape = lastShape.next;
            }
            return lastShape;
        }

        public dispose() {
            this.world.clear();
        }
    }

    /*export class OldOimoJSPlugin {
        private _world;
        private _registeredMeshes = [];

        public name = "oimo";

        private _gravity: Vector3;

        private _checkWithEpsilon(value: number): number {
            return value < PhysicsEngine.Epsilon ? PhysicsEngine.Epsilon : value;
        }

        public initialize(iterations?: number): void {
            this._world = new OIMO.World(null, null, iterations);
            this._world.clear();
        }

        public setGravity(gravity: Vector3): void {
            this._gravity = this._world.gravity = gravity;
        }

        public getGravity(): Vector3 {
            return this._gravity;
        }

        public registerMesh(mesh: AbstractMesh, impostor: number, options: PhysicsImpostorParameters): any {
            this.unregisterMesh(mesh);

            if (!mesh.rotationQuaternion) {
                mesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z);
            }

            mesh.computeWorldMatrix(true);

            var bbox = mesh.getBoundingInfo().boundingBox;

            // The delta between the mesh position and the mesh bounding box center
            var deltaPosition = mesh.position.subtract(bbox.center);
            
            //calculate rotation to fit Oimo's needs (Euler...)
            var rot = new OIMO.Euler().setFromQuaternion({ x: mesh.rotationQuaternion.x, y: mesh.rotationQuaternion.y, z: mesh.rotationQuaternion.z, s: mesh.rotationQuaternion.w });

            //get the correct bounding box
            var oldQuaternion = mesh.rotationQuaternion;
            mesh.rotationQuaternion = new Quaternion(0, 0, 0, 1);
            mesh.computeWorldMatrix(true);

            var bodyConfig: any = {
                name: mesh.uniqueId,
                //pos: [bbox.center.x, bbox.center.y, bbox.center.z],
                //rot: [rot.x / OIMO.TO_RAD, rot.y / OIMO.TO_RAD, rot.z / OIMO.TO_RAD],
                move: options.mass != 0,
                config: [options.mass, options.friction, options.restitution],
                type: [],
                shape: [],
                pos: [],
                rot: []
            };

            // register mesh
            switch (impostor) {
                case PhysicsEngine.SphereImpostor:
                    var radiusX = bbox.maximumWorld.x - bbox.minimumWorld.x;
                    var radiusY = bbox.maximumWorld.y - bbox.minimumWorld.y;
                    var radiusZ = bbox.maximumWorld.z - bbox.minimumWorld.z;

                    var size = Math.max(
                        this._checkWithEpsilon(radiusX),
                        this._checkWithEpsilon(radiusY),
                        this._checkWithEpsilon(radiusZ)) / 2;

                    bodyConfig.type = 'sphere';
                    bodyConfig.size = [size];
                    break;

                case PhysicsEngine.PlaneImpostor:
                //Oimo "fakes" a cylinder as a box, so why don't we!
                case PhysicsEngine.CylinderImpostor:
                case PhysicsEngine.BoxImpostor:

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
        }

        public registerMeshesAsCompound(parts: any[], options: PhysicsImpostorParameters): any {
            var types = [],
                sizes = [],
                positions = [],
                rotations = [];

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
        }

        private _createBodyAsCompound(part: any, options: PhysicsImpostorParameters, initialMesh: AbstractMesh): any {
            var mesh = part.mesh;

            if (!mesh.rotationQuaternion) {
                mesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z);
            }
			
            // We need the bounding box/sphere info to compute the physics body
            mesh.computeWorldMatrix(true);

            var rot = new OIMO.Euler().setFromQuaternion({ x: mesh.rotationQuaternion.x, y: mesh.rotationQuaternion.y, z: mesh.rotationQuaternion.z, s: mesh.rotationQuaternion.w });

            var bodyParameters: any = {
                name: mesh.uniqueId,
                pos: [mesh.position.x, mesh.position.y, mesh.position.z],
                //A bug in Oimo (Body class) prevents us from using rot directly.
                rot: [0, 0, 0],
                //For future reference, if the bug will ever be fixed.
                realRot: [rot.x / OIMO.TO_RAD, rot.y / OIMO.TO_RAD, rot.z / OIMO.TO_RAD]
            };

            var oldQuaternion = mesh.rotationQuaternion;
            mesh.rotationQuaternion = new Quaternion(0, 0, 0, 1);
            mesh.computeWorldMatrix(true);

            switch (part.impostor) {
                case PhysicsEngine.SphereImpostor:
                    var bbox = mesh.getBoundingInfo().boundingBox;
                    var radiusX = bbox.maximumWorld.x - bbox.minimumWorld.x;
                    var radiusY = bbox.maximumWorld.y - bbox.minimumWorld.y;
                    var radiusZ = bbox.maximumWorld.z - bbox.minimumWorld.z;

                    var size = Math.max(
                        this._checkWithEpsilon(radiusX),
                        this._checkWithEpsilon(radiusY),
                        this._checkWithEpsilon(radiusZ)) / 2;

                    bodyParameters.type = 'sphere';
                    bodyParameters.size = [size, size, size];

                    break;

                case PhysicsEngine.PlaneImpostor:
                case PhysicsEngine.CylinderImpostor:
                case PhysicsEngine.BoxImpostor:
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
        }

        public unregisterMesh(mesh: AbstractMesh): void {
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
        }

        private _unbindBody(body: any): void {
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];
                if (registeredMesh.body === body) {
                    registeredMesh.body = null;
                }
            }
        }

        public updateBodyPosition = function(mesh: AbstractMesh): void {

            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];
                var body = registeredMesh.body.body;
                var updated: boolean = false;
                var newPosition: Vector3;
                if (registeredMesh.mesh === mesh || registeredMesh.mesh === mesh.parent) {
                    mesh.computeWorldMatrix(true);

                    newPosition = mesh.getBoundingInfo().boundingBox.center;

                    updated = true;
                }
                // Case where the parent has been updated
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
        }

        public applyImpulse(mesh: AbstractMesh, force: Vector3, contactPoint: Vector3): void {
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
        }

        public createLink(mesh1: AbstractMesh, mesh2: AbstractMesh, pivot1: Vector3, pivot2: Vector3, options?: any): boolean {
            var body1 = null,
                body2 = null;
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];
                if (registeredMesh.mesh === mesh1) {
                    body1 = registeredMesh.body.body;
                } else if (registeredMesh.mesh === mesh2) {
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

        }

        public dispose(): void {
            this._world.clear();
            while (this._registeredMeshes.length) {
                this.unregisterMesh(this._registeredMeshes[0].mesh);
            }
        }

        public isSupported(): boolean {
            return OIMO !== undefined;
        }

        public getWorldObject(): any {
            return this._world;
        }

        public getPhysicsBodyOfMesh(mesh: AbstractMesh) {
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];
                if (registeredMesh.mesh === mesh) {
                    return registeredMesh.body;
                }
            }
            return null;
        }

        private _getLastShape(body: any): any {
            var lastShape = body.shapes;
            while (lastShape.next) {
                lastShape = lastShape.next;
            }
            return lastShape;
        }

        public runOneStep(time: number): void {
            this._world.step();

            // Update the position of all registered meshes
            var i = this._registeredMeshes.length;
            var m;
            while (i--) {

                var body = this._registeredMeshes[i].body.body;
                var mesh = this._registeredMeshes[i].mesh;

                if (!this._registeredMeshes[i].delta) {
                    this._registeredMeshes[i].delta = Vector3.Zero();
                }

                if (!body.sleeping) {
                    //TODO check that
                    if (body.shapes.next) {
                        var parentShape = this._getLastShape(body);
                        mesh.position.x = parentShape.position.x * OIMO.WORLD_SCALE;
                        mesh.position.y = parentShape.position.y * OIMO.WORLD_SCALE;
                        mesh.position.z = parentShape.position.z * OIMO.WORLD_SCALE;
                    } else {
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
                                mesh.onPhysicsCollide(otherMesh, contact);
                        }
                        contact = contact.next;
                    }
                }
            }
        }
    }*/
}