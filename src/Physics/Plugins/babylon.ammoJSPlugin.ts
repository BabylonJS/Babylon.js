module BABYLON {
    declare var Ammo: any;

    /** @hidden */
    export class AmmoJSPlugin implements IPhysicsEnginePlugin {
        public BJSAMMO:any;
        public world: any;
        public name: string = "AmmoJSPlugin";

        private _fixedTimeStep: number = 1 / 60;
        private _tmpQuaternion = new BABYLON.Quaternion();
        private _tmpAmmoTransform:any;
        private _tmpAmmoQuaternion:any;

        public constructor(private _useDeltaForWorldStep: boolean = true, iterations: number = 10) {
            if(typeof Ammo === "function"){
                Ammo();
            }
            this.BJSAMMO = Ammo;
            if (!this.isSupported()) {
                Tools.Error("AmmoJS is not available. Please make sure you included the js file.");
                return;
            }

            var collisionConfiguration  = new this.BJSAMMO.btDefaultCollisionConfiguration();
            var dispatcher              = new this.BJSAMMO.btCollisionDispatcher(collisionConfiguration);
            var overlappingPairCache    = new this.BJSAMMO.btDbvtBroadphase();
            var solver                  = new this.BJSAMMO.btSequentialImpulseConstraintSolver();
            this.world           = new this.BJSAMMO.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
            this._tmpAmmoTransform = new this.BJSAMMO.btTransform();
            this._tmpAmmoQuaternion = new this.BJSAMMO.btQuaternion(0,0,0,1);
        }

        public setGravity(gravity: Vector3): void {
            this.world.setGravity(new this.BJSAMMO.btVector3(gravity.x, gravity.y, gravity.z));
        }

        public setTimeStep(timeStep: number) {
            this._fixedTimeStep = timeStep;
        }

        public getTimeStep(): number {
            return this._fixedTimeStep;
        }

        public executeStep(delta: number, impostors: Array<PhysicsImpostor>): void {
            impostors.forEach(function(impostor) {
                impostor.beforeStep();
            });
            this.world.stepSimulation(this._fixedTimeStep, this._useDeltaForWorldStep ? delta : 0, 3);
            impostors.forEach((impostor) => {
                impostor.afterStep();
            });
        }

        public applyImpulse(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3) {
            var worldPoint = new this.BJSAMMO.btVector3(contactPoint.x, contactPoint.y, contactPoint.z);
            var impulse = new this.BJSAMMO.btVector3(force.x, force.y, force.z);

            impostor.physicsBody.applyImpulse(impulse, worldPoint);
        }

        public applyForce(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3) {
            var worldPoint = new this.BJSAMMO.btVector3(contactPoint.x, contactPoint.y, contactPoint.z);
            var impulse = new this.BJSAMMO.btVector3(force.x, force.y, force.z);

            impostor.physicsBody.applyForce(impulse, worldPoint);
        }

        public generatePhysicsBody(impostor: PhysicsImpostor) {
            //parent-child relationship
            if (impostor.parent) {
                if (impostor.physicsBody) {
                    this.removePhysicsBody(impostor);
                    impostor.forceUpdate();
                }
                return;
            }

            if (impostor.isBodyInitRequired()) {
                var colShape = this._createShape(impostor);
                var mass          = impostor.getParam("mass")
                var isDynamic     = (mass !== 0)
                var localInertia  = new Ammo.btVector3(0, 0, 0);
                var startTransform  = new Ammo.btTransform();
                startTransform.setIdentity();
                if (isDynamic){
                    colShape.calculateLocalInertia(mass,localInertia);
                }
                startTransform.setOrigin(new Ammo.btVector3(impostor.object.position.x, impostor.object.position.y, impostor.object.position.z));
                var myMotionState = new Ammo.btDefaultMotionState(startTransform)
                var rbInfo        = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia)
                var body          = new Ammo.btRigidBody(rbInfo);
                body.setRestitution(impostor.getParam("restitution"));
                this.world.addRigidBody(body);
                impostor.physicsBody = body;
            }
        }


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
            if(!jointData.mainPivot){
                jointData.mainPivot = new Vector3(0,0,0);
            }
            if(!jointData.connectedPivot){
                jointData.connectedPivot = new Vector3(0,0,0);
            }

            var joint:any;
            switch (impostorJoint.joint.type) {
                case PhysicsJoint.BallAndSocketJoint:
                    joint = new Ammo.btPoint2PointConstraint(mainBody, connectedBody, new Ammo.btVector3(jointData.mainPivot.x, jointData.mainPivot.y, jointData.mainPivot.z), new Ammo.btVector3(jointData.connectedPivot.x, jointData.connectedPivot.y, jointData.connectedPivot.z));
                    break;
                // case PhysicsJoint.SpringJoint:
                //     Tools.Warn("OIMO.js doesn't support Spring Constraint. Simulating using DistanceJoint instead");
                //     var springData = <SpringJointData>jointData;
                //     nativeJointData.min = springData.length || nativeJointData.min;
                //     //Max should also be set, just make sure it is at least min
                //     nativeJointData.max = Math.max(nativeJointData.min, nativeJointData.max);
                // case PhysicsJoint.DistanceJoint:
                //     type = "jointDistance";
                //     nativeJointData.max = (<DistanceJointData>jointData).maxDistance;
                //     break;
                // case PhysicsJoint.PrismaticJoint:
                //     type = "jointPrisme";
                //     break;
                // case PhysicsJoint.SliderJoint:
                //     type = "jointSlide";
                //     break;
                // case PhysicsJoint.WheelJoint:
                //     type = "jointWheel";
                //     break;
                case PhysicsJoint.HingeJoint:
                    joint = new Ammo.btHingeConstraint(mainBody, connectedBody, new Ammo.btVector3(jointData.mainPivot.x, jointData.mainPivot.y, jointData.mainPivot.z), new Ammo.btVector3(jointData.connectedPivot.x, jointData.connectedPivot.y, jointData.connectedPivot.z));
                    break;
                default:
                    joint = new Ammo.btPoint2PointConstraint(mainBody, connectedBody, new Ammo.btVector3(jointData.mainPivot.x, jointData.mainPivot.y, jointData.mainPivot.z), new Ammo.btVector3(jointData.connectedPivot.x, jointData.connectedPivot.y, jointData.connectedPivot.z));
                    break;
            }
            this.world.addConstraint(joint, true);
        }

        public removeJoint(impostorJoint: PhysicsImpostorJoint) {
        }      

        private _createShape(impostor: PhysicsImpostor) {
            var object = impostor.object;

            var returnValue;
            var extendSize = impostor.getObjectExtendSize();
            switch (impostor.type) {
                case PhysicsImpostor.SphereImpostor:
                    returnValue = new this.BJSAMMO.btSphereShape(extendSize.x/2);
                    break;
                case PhysicsImpostor.CylinderImpostor:
                    returnValue = new this.BJSAMMO.btCylinderShape(new this.BJSAMMO.btVector3(extendSize.x/2,extendSize.y/2,extendSize.z/2));
                    break;
                case PhysicsImpostor.PlaneImpostor:
                case PhysicsImpostor.BoxImpostor:
                    returnValue = new this.BJSAMMO.btBoxShape(new this.BJSAMMO.btVector3(extendSize.x/2,extendSize.y/2,extendSize.z/2));
                    break;
                case PhysicsImpostor.MeshImpostor:
                    var tetraMesh = new this.BJSAMMO.btTriangleMesh();
                    // Create mesh impostor from triangles which makeup the mesh
                    if(object && object.getIndices && object.getWorldMatrix){
                        var ind = object.getIndices()
                        if(!ind){
                            ind = [];
                        }

                        var p = object.getVerticesData(BABYLON.VertexBuffer.PositionKind)
                        if(!p){
                            p = [];
                        }
                        object.computeWorldMatrix(false);
                        var faceCount = ind.length/3;
                        for(var i =0;i<faceCount;i++){
                            var triPoints = [];
                            for(var point = 0;point<3;point++){
                                
                                triPoints.push(new this.BJSAMMO.btVector3(
                                    object.scaling.x*p[(ind[(i*3)+point]*3)+0],
                                    object.scaling.y*p[(ind[(i*3)+point]*3)+1],
                                    object.scaling.z*p[(ind[(i*3)+point]*3)+2]
                                ));
                            }
                            tetraMesh.addTriangle(triPoints[0], triPoints[1], triPoints[2]);
                        }
                    }else{
                        throw "Unable to create MeshImpostor from object";
                    }
                    returnValue = new this.BJSAMMO.btBvhTriangleMeshShape(tetraMesh);
                    break;
            }

            return returnValue;
        }
        
        public setTransformationFromPhysicsBody(impostor: PhysicsImpostor) {
            
            impostor.physicsBody.getMotionState().getWorldTransform(this._tmpAmmoTransform);
            impostor.object.position.set(this._tmpAmmoTransform.getOrigin().x(), this._tmpAmmoTransform.getOrigin().y(),this._tmpAmmoTransform.getOrigin().z());

            if(!impostor.object.rotationQuaternion){
                if(impostor.object.rotation){
                    this._tmpQuaternion.set(this._tmpAmmoTransform.getRotation().x(),this._tmpAmmoTransform.getRotation().y(),this._tmpAmmoTransform.getRotation().z(),this._tmpAmmoTransform.getRotation().w());
                    this._tmpQuaternion.toEulerAnglesToRef(impostor.object.rotation);  
                }
            }else{
                impostor.object.rotationQuaternion.set(this._tmpAmmoTransform.getRotation().x(),this._tmpAmmoTransform.getRotation().y(),this._tmpAmmoTransform.getRotation().z(),this._tmpAmmoTransform.getRotation().w());
            }
        }

        public setPhysicsBodyTransformation(impostor: PhysicsImpostor, newPosition: Vector3, newRotation: Quaternion) {

            var trans = impostor.physicsBody.getWorldTransform();

            // If rotation/position has changed update and activate riged body
            if( 
                trans.getOrigin().x() != newPosition.x || 
                trans.getOrigin().y() != newPosition.y || 
                trans.getOrigin().z() != newPosition.z || 
                trans.getRotation().x() != newRotation.x || 
                trans.getRotation().y() != newRotation.y || 
                trans.getRotation().z() != newRotation.z || 
                trans.getRotation().w() != newRotation.w
            ){
                trans.getOrigin().setX(newPosition.x);
                trans.getOrigin().setY(newPosition.y);
                trans.getOrigin().setZ(newPosition.z);
                
                this._tmpAmmoQuaternion.setValue(newRotation.x,newRotation.y,newRotation.z,newRotation.w)
                trans.setRotation(this._tmpAmmoQuaternion);
                impostor.physicsBody.setWorldTransform(trans);
                impostor.physicsBody.activate();
            }
        }

        public isSupported(): boolean {
            return this.BJSAMMO !== undefined;
        }

        public setLinearVelocity(impostor: PhysicsImpostor, velocity: Vector3) {
            impostor.physicsBody.setLinearVelocity(new this.BJSAMMO.btVector3(velocity.x, velocity.y, velocity.z));
        }

        public setAngularVelocity(impostor: PhysicsImpostor, velocity: Vector3) {
            impostor.physicsBody.setAngularVelocity(new this.BJSAMMO.btVector3(velocity.x, velocity.y, velocity.z));
        }

        public getLinearVelocity(impostor: PhysicsImpostor): Nullable<Vector3> {
            var v = impostor.physicsBody.getLinearVelocity();
            if (!v) {
                return null;
            }
            return new Vector3(v.x(), v.y(), v.z());
        }
        public getAngularVelocity(impostor: PhysicsImpostor): Nullable<Vector3> {
            var v = impostor.physicsBody.getAngularVelocity();
            if (!v) {
                return null;
            }
            return new Vector3(v.x(), v.y(), v.z());
        }

        public setBodyMass(impostor: PhysicsImpostor, mass: number) {
            impostor.physicsBody.setMassProps(mass);
        }

        public getBodyMass(impostor: PhysicsImpostor): number {
            return impostor.physicsBody.mass;
        }

        public getBodyFriction(impostor: PhysicsImpostor): number {
            return impostor.physicsBody.getFriction();
        }

        public setBodyFriction(impostor: PhysicsImpostor, friction: number) {
            impostor.physicsBody.setFriction(friction);
        }

        public getBodyRestitution(impostor: PhysicsImpostor): number {
            return impostor.physicsBody.getRestitution();
        }

        public setBodyRestitution(impostor: PhysicsImpostor, restitution: number) {
            impostor.physicsBody.setRestitution(restitution);
        }

        public sleepBody(impostor: PhysicsImpostor) {
            Tools.Warn("sleepBody is not currently supported by the Ammo physics plugin")
        }

        public wakeUpBody(impostor: PhysicsImpostor) {
            impostor.physicsBody.activate();
        }

        public updateDistanceJoint(joint: PhysicsJoint, maxDistance: number, minDistance?: number) {
            Tools.Warn("updateDistanceJoint is not currently supported by the Ammo physics plugin")
        }

        public setMotor(joint: IMotorEnabledJoint, speed?: number, maxForce?: number, motorIndex?: number) {
            Tools.Warn("setMotor is not currently supported by the Ammo physics plugin")
        }

        public setLimit(joint: IMotorEnabledJoint, upperLimit: number, lowerLimit?: number) {
            Tools.Warn("setLimit is not currently supported by the Ammo physics plugin")
        }

        public syncMeshWithImpostor(mesh: AbstractMesh, impostor: PhysicsImpostor) {
            var body = impostor.physicsBody;

            body.getMotionState().getWorldTransform(this._tmpAmmoTransform)

            mesh.position.x = this._tmpAmmoTransform.getOrigin().x();
            mesh.position.y = this._tmpAmmoTransform.getOrigin().y();
            mesh.position.z = this._tmpAmmoTransform.getOrigin().z();

            if (mesh.rotationQuaternion) {
                mesh.rotationQuaternion.x = this._tmpAmmoTransform.getRotation().x();
                mesh.rotationQuaternion.y = this._tmpAmmoTransform.getRotation().y();
                mesh.rotationQuaternion.z = this._tmpAmmoTransform.getRotation().z();
                mesh.rotationQuaternion.w = this._tmpAmmoTransform.getRotation().w();
            }
        }

        public getRadius(impostor: PhysicsImpostor): number {
            var exntend = impostor.getObjectExtendSize();
            return exntend.x;
        }

        public getBoxSizeToRef(impostor: PhysicsImpostor, result: Vector3): void {
            var exntend = impostor.getObjectExtendSize();
            result.x = exntend.x;
            result.y = exntend.y;
            result.z = exntend.z;
        }

        public dispose() {

        }
    }
}
