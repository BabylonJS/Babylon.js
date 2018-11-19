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
        private _tmpAmmoConcreteContactResultCallback:any;
        private _collisionConfiguration:any;
        private _dispatcher:any;
        private _overlappingPairCache:any;
        private _solver:any;
        private _tmpAmmoVectorA:any;
        private _tmpAmmoVectorB:any;
        private _tmpAmmoVectorC:any;

        public constructor(private _useDeltaForWorldStep: boolean = true, iterations: number = 10) {
            if(typeof Ammo === "function"){
                Ammo();
            }
            this.BJSAMMO = Ammo;
            if (!this.isSupported()) {
                Tools.Error("AmmoJS is not available. Please make sure you included the js file.");
                return;
            }

            this._collisionConfiguration  = new this.BJSAMMO.btDefaultCollisionConfiguration();
            this._dispatcher              = new this.BJSAMMO.btCollisionDispatcher(this._collisionConfiguration);
            this._overlappingPairCache    = new this.BJSAMMO.btDbvtBroadphase();
            this._solver                  = new this.BJSAMMO.btSequentialImpulseConstraintSolver();
            this.world           = new this.BJSAMMO.btDiscreteDynamicsWorld(this._dispatcher, this._overlappingPairCache, this._solver, this._collisionConfiguration);
            this._tmpAmmoConcreteContactResultCallback = new this.BJSAMMO.ConcreteContactResultCallback();

            this._tmpAmmoTransform = new this.BJSAMMO.btTransform();
            this._tmpAmmoTransform.setIdentity();
            this._tmpAmmoQuaternion = new this.BJSAMMO.btQuaternion(0,0,0,1);
            this._tmpAmmoVectorA = new this.BJSAMMO.btVector3(0,0,0);
            this._tmpAmmoVectorB = new this.BJSAMMO.btVector3(0,0,0);
            this._tmpAmmoVectorC = new this.BJSAMMO.btVector3(0,0,0);
        }

        public setGravity(gravity: Vector3): void {
            this._tmpAmmoVectorA.setValue(gravity.x, gravity.y, gravity.z)
            this.world.setGravity(this._tmpAmmoVectorA);
        }

        public setTimeStep(timeStep: number) {
            this._fixedTimeStep = timeStep;
        }

        public getTimeStep(): number {
            return this._fixedTimeStep;
        }

        // Ammo's contactTest and contactPairTest take a callback that runs synchronously, wrap them so that they are easier to consume 
        private _contactTest(impostor:PhysicsImpostor){
            var result = false;
            this._tmpAmmoConcreteContactResultCallback.addSingleResult = function(){ result = true }
            this.world.contactTest(impostor.physicsBody,this._tmpAmmoConcreteContactResultCallback);
            return result;
        }
        // Ammo's collision events have some weird quirks
        // contactPairTest fires too many events as it fires events even when objects are close together but contactTest does not
        // so only fire event if both contactTest and contactPairTest have a hit
        private _contactPairTest(impostorA:PhysicsImpostor, impostorB:PhysicsImpostor){
            var result = false;
            this._tmpAmmoConcreteContactResultCallback.addSingleResult = function(){ result = true }
            this.world.contactPairTest(impostorA.physicsBody, impostorB.physicsBody,this._tmpAmmoConcreteContactResultCallback);
            return result;
        }

        public executeStep(delta: number, impostors: Array<PhysicsImpostor>): void {
            impostors.forEach(function(impostor) {
                impostor.beforeStep();
            });
            this.world.stepSimulation(this._fixedTimeStep, this._useDeltaForWorldStep ? delta : 0, 3);

            impostors.forEach((mainImpostor) => {
                mainImpostor.afterStep();

                // Handle collision
                if(mainImpostor._onPhysicsCollideCallbacks.length > 0){
                    if(this._contactTest(mainImpostor)){
                        mainImpostor._onPhysicsCollideCallbacks.forEach((c)=>{
                            c.otherImpostors.forEach((otherImpostor)=>{
                                if(mainImpostor.physicsBody.isActive() || otherImpostor.physicsBody.isActive()){
                                    if(this._contactPairTest(mainImpostor, otherImpostor)){                                    
                                        mainImpostor.onCollide({ body: otherImpostor.physicsBody });
                                        otherImpostor.onCollide({ body: mainImpostor.physicsBody });
                                    }
                                }
                            })
                        })
                    }
                }
            });
        }

        public applyImpulse(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3) {
            var worldPoint = this._tmpAmmoVectorA
            var impulse = this._tmpAmmoVectorB
            worldPoint.setValue(contactPoint.x, contactPoint.y, contactPoint.z)
            impulse.setValue(force.x, force.y, force.z)

            impostor.physicsBody.applyImpulse(impulse, worldPoint);
        }

        public applyForce(impostor: PhysicsImpostor, force: Vector3, contactPoint: Vector3) {
            var worldPoint = this._tmpAmmoVectorA
            var impulse = this._tmpAmmoVectorB
            worldPoint.setValue(contactPoint.x, contactPoint.y, contactPoint.z)
            impulse.setValue(force.x, force.y, force.z)

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
                startTransform.setRotation(new Ammo.btQuaternion(impostor.object.rotationQuaternion!.x, impostor.object.rotationQuaternion!.y, impostor.object.rotationQuaternion!.z, impostor.object.rotationQuaternion!.w));
                var myMotionState = new Ammo.btDefaultMotionState(startTransform)
                var rbInfo        = new Ammo.btRigidBodyConstructionInfo(mass, myMotionState, colShape, localInertia)
                var body          = new Ammo.btRigidBody(rbInfo);
                body.setRestitution(impostor.getParam("restitution"));
                this.world.addRigidBody(body);
                impostor.physicsBody = body;
            }
        }

        public removePhysicsBody(impostor: PhysicsImpostor) {
            if(this.world){
                this.world.removeRigidBody(impostor.physicsBody);
            }
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
                //     break;
                // case PhysicsJoint.DistanceJoint:
                //     break;
                // case PhysicsJoint.PrismaticJoint:
                //     break;
                // case PhysicsJoint.SliderJoint:
                //     break;
                // case PhysicsJoint.WheelJoint:
                //     break;
                // case PhysicsJoint.HingeJoint:
                //     joint = new Ammo.btHingeConstraint(mainBody, connectedBody, new Ammo.btVector3(jointData.mainPivot.x, jointData.mainPivot.y, jointData.mainPivot.z), new Ammo.btVector3(jointData.connectedPivot.x, jointData.connectedPivot.y, jointData.connectedPivot.z));
                //     break;
                default:
                    joint = new Ammo.btPoint2PointConstraint(mainBody, connectedBody, new Ammo.btVector3(jointData.mainPivot.x, jointData.mainPivot.y, jointData.mainPivot.z), new Ammo.btVector3(jointData.connectedPivot.x, jointData.connectedPivot.y, jointData.connectedPivot.z));
                    break;
            }
            this.world.addConstraint(joint, true);
        }

        public removeJoint(impostorJoint: PhysicsImpostorJoint) {
        }      

        private _addMeshVerts(btTriangleMesh:any, topLevelObject:IPhysicsEnabledObject, object:IPhysicsEnabledObject){
            var triangleCount = 0;
            if(object && object.getIndices && object.getWorldMatrix && object.getChildMeshes){
                var indices = object.getIndices()
                if(!indices){
                    indices = [];
                }
                var vertexPositions = object.getVerticesData(BABYLON.VertexBuffer.PositionKind)
                if(!vertexPositions){
                    vertexPositions = [];
                }
                object.computeWorldMatrix(false);
                var faceCount = indices.length/3;
                for(var i =0;i<faceCount;i++){
                    var triPoints = [];
                    for(var point = 0;point<3;point++){
                        var v = new BABYLON.Vector3(vertexPositions[(indices[(i*3)+point]*3)+0],vertexPositions[(indices[(i*3)+point]*3)+1],vertexPositions[(indices[(i*3)+point]*3)+2])
                        v = Vector3.TransformCoordinates(v, object.getWorldMatrix())
                        v.subtractInPlace(topLevelObject.position);
                        var vec:any
                        if(point == 0){
                            vec = this._tmpAmmoVectorA;
                        }else if(point == 1){
                            vec = this._tmpAmmoVectorB;
                        }else{
                            vec = this._tmpAmmoVectorC;
                        }
                        vec.setValue(v.x, v.y, v.z)
                        
                        triPoints.push(vec);
                    }
                    btTriangleMesh.addTriangle(triPoints[0], triPoints[1], triPoints[2]);
                    triangleCount++;
                }

                object.getChildMeshes().forEach((m)=>{
                    triangleCount+=this._addMeshVerts(btTriangleMesh, topLevelObject, m);
                });
            }
            return triangleCount;
        }

        private _createShape(impostor: PhysicsImpostor, ignoreChildren=false) {
            var object = impostor.object;

            var returnValue:any;
            var extendSize = impostor.getObjectExtendSize();
            
            if(!ignoreChildren){
                var meshChildren = impostor.object.getChildMeshes ? impostor.object.getChildMeshes(true) : [];
                if (meshChildren.length > 0) {
                    returnValue = new Ammo.btCompoundShape();
                    
                    // Add shape of all children to the compound shape
                    meshChildren.forEach((childMesh)=>{
                        var childImpostor = childMesh.getPhysicsImpostor();
                        if(childImpostor){
                            var shape = this._createShape(childImpostor);
                            this._tmpAmmoTransform.getOrigin().setValue(childMesh.position.x, childMesh.position.y,childMesh.position.z);
                            this._tmpAmmoQuaternion.setValue(childMesh.rotationQuaternion!.x,childMesh.rotationQuaternion!.y,childMesh.rotationQuaternion!.z,childMesh.rotationQuaternion!.w)
                            this._tmpAmmoTransform.setRotation(this._tmpAmmoQuaternion)
                            returnValue.addChildShape(this._tmpAmmoTransform, shape);
                            childImpostor.dispose();
                        }
                    })

                    // Add parents shape as a child if present
                    var shape = this._createShape(impostor, true);
                    if(shape){
                        this._tmpAmmoTransform.getOrigin().setValue(0,0,0);
                        //this._tmpAmmoQuaternion = new this.BJSAMMO.btQuaternion(0,0,0,1);
                        this._tmpAmmoQuaternion.setValue(0,0,0,1)
                        this._tmpAmmoTransform.setRotation(this._tmpAmmoQuaternion)
                        
                        returnValue.addChildShape(this._tmpAmmoTransform, shape);
                    }
                    
                    return returnValue;
                }
            }
            
            switch (impostor.type) {
                case PhysicsImpostor.SphereImpostor:
                    returnValue = new Ammo.btSphereShape(extendSize.x/2);
                    break;
                case PhysicsImpostor.CylinderImpostor:
                this._tmpAmmoVectorA.setValue(extendSize.x/2,extendSize.y/2,extendSize.z/2)
                    returnValue = new Ammo.btCylinderShape(this._tmpAmmoVectorA);
                    break;
                case PhysicsImpostor.PlaneImpostor:
                case PhysicsImpostor.BoxImpostor:
                    this._tmpAmmoVectorA.setValue(extendSize.x/2,extendSize.y/2,extendSize.z/2)
                    returnValue = new Ammo.btBoxShape(this._tmpAmmoVectorA);
                    break;
                case PhysicsImpostor.MeshImpostor:
                    
                    var tetraMesh = new Ammo.btTriangleMesh();

                    var triangeCount = this._addMeshVerts(tetraMesh, object, object);
                    
                    if(triangeCount == 0){
                        returnValue = new Ammo.btCompoundShape();
                    }else{
                        returnValue = new Ammo.btBvhTriangleMeshShape(tetraMesh);
                    }
                    
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
            this._tmpAmmoVectorA.setValue(velocity.x, velocity.y, velocity.z)
            impostor.physicsBody.setLinearVelocity(this._tmpAmmoVectorA);
        }

        public setAngularVelocity(impostor: PhysicsImpostor, velocity: Vector3) {
            this._tmpAmmoVectorA.setValue(velocity.x, velocity.y, velocity.z)
            impostor.physicsBody.setAngularVelocity(this._tmpAmmoVectorA);
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
            return exntend.x/2;
        }

        public getBoxSizeToRef(impostor: PhysicsImpostor, result: Vector3): void {
            var exntend = impostor.getObjectExtendSize();
            result.x = exntend.x;
            result.y = exntend.y;
            result.z = exntend.z;
        }

        public dispose() {
            // Dispose of world
            Ammo.destroy(this.world);
            Ammo.destroy(this._solver);
            Ammo.destroy(this._overlappingPairCache);
            Ammo.destroy(this._dispatcher);
            Ammo.destroy(this._collisionConfiguration);
            
            // Dispose of tmp variables
            Ammo.destroy(this._tmpAmmoVectorA);
            Ammo.destroy(this._tmpAmmoVectorB);
            Ammo.destroy(this._tmpAmmoVectorC);
            Ammo.destroy(this._tmpAmmoTransform);
            Ammo.destroy(this._tmpAmmoQuaternion);
            Ammo.destroy(this._tmpAmmoConcreteContactResultCallback);
            
            this.world = null;
        }
    }
}
