/**
 * OimoPhysics DEV 1.1.0a
 * @author Saharan / http://el-ement.com/
 * 
 * Oimo.js 2014
 * @author LoTh / http://3dflashlo.wordpress.com/
 */
 
var OIMO = { REVISION: 'DEV.1.1.2a' };

OIMO.SHAPE_SPHERE = 0x1;
OIMO.SHAPE_BOX = 0x2;

OIMO.WORLD_SCALE = 1;
OIMO.INV_SCALE = 1;

OIMO.TO_RAD = Math.PI / 180;
OIMO.TwoPI = 2.0 * Math.PI;

// Global identification of next shape.
// This will be incremented every time a shape is created.
OIMO.nextID = 0;

var OIMO_ARRAY_TYPE;
if(!OIMO_ARRAY_TYPE) { OIMO_ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array; }
/**
* The class of physical computing world. 
* You must be added to the world physical all computing objects
* @author saharan
*/
OIMO.World = function(TimeStep, BroadPhaseType, Iterations, NoStat){

    // The time between each step
    this.timeStep= TimeStep || 1/60;
    // The number of iterations for constraint solvers.
    this.numIterations = Iterations || 8;
     // It is a wide-area collision judgment that is used in order to reduce as much as possible a detailed collision judgment.
    var broadPhaseType = BroadPhaseType || 2;
    switch(broadPhaseType){
        case 1: this.broadPhase=new OIMO.BruteForceBroadPhase(); break;
        case 2: default: this.broadPhase=new OIMO.SAPBroadPhase(); break;
        case 3: this.broadPhase=new OIMO.DBVTBroadPhase(); break;
    }
    // Whether the constraints randomizer is enabled or not.
    this.enableRandomizer = true;

    this.isNoStat = NoStat || false;


    // The rigid body list
    this.rigidBodies=null;
    // number of rigid body
    this.numRigidBodies=0;
    // The contact list
    this.contacts=null;
    this.unusedContacts=null;
    // The number of contact
    this.numContacts=0;
    // The number of contact points
    this.numContactPoints=0;
    //  The joint list
    this.joints=null;
    // The number of joints.
    this.numJoints=0;
    // The number of simulation islands.
    this.numIslands=0;
    
   
    // The gravity in the world.
    this.gravity=new OIMO.Vec3(0,-9.80665,0);

    // This is the detailed information of the performance. 
    this.performance = null;
    if(!this.isNoStat) this.performance = new OIMO.Performance(this);

    var numShapeTypes=3;
    this.detectors=[];
    this.detectors.length = numShapeTypes;
    var i=numShapeTypes;
    while(i--){
        this.detectors[i]=[];
        this.detectors[i].length = numShapeTypes;
    }
    this.detectors[OIMO.SHAPE_SPHERE][OIMO.SHAPE_SPHERE]=new OIMO.SphereSphereCollisionDetector();
    this.detectors[OIMO.SHAPE_SPHERE][OIMO.SHAPE_BOX]=new OIMO.SphereBoxCollisionDetector(false);
    this.detectors[OIMO.SHAPE_BOX][OIMO.SHAPE_SPHERE]=new OIMO.SphereBoxCollisionDetector(true);
    this.detectors[OIMO.SHAPE_BOX][OIMO.SHAPE_BOX]=new OIMO.BoxBoxCollisionDetector();
 
    this.randX=65535;
    this.randA=98765;
    this.randB=123456789;
    this.maxIslandRigidBodies=64;
    this.islandRigidBodies=[];
    this.islandRigidBodies.length = this.maxIslandRigidBodies;
    this.islandStack=[];
    this.islandStack.length = this.maxIslandRigidBodies;
    this.maxIslandConstraints=128;
    this.islandConstraints=[];
    this.islandConstraints.length = this.maxIslandConstraints;

};

OIMO.World.prototype = {
    constructor: OIMO.World,
    /**
    * Reset the randomizer and remove all rigid bodies, shapes, joints and any object from the world.
	*/
    clear:function(){
        this.randX=65535;
        while(this.joints!==null){
            this.removeJoint(this.joints);
        }
        while(this.contacts!==null){
            this.removeContact(this.contacts);
        }
        while(this.rigidBodies!==null){
            this.removeRigidBody(this.rigidBodies);
        }
        OIMO.nextID=0;
    },
    /**
    * I'll add a rigid body to the world. 
    * Rigid body that has been added will be the operands of each step.
    * @param  rigidBody  Rigid body that you want to add
    */
    addRigidBody:function(rigidBody){
        if(rigidBody.parent){
            throw new Error("It is not possible to be added to more than one world one of the rigid body");
        }
        rigidBody.parent=this;
        rigidBody.awake();
        for(var shape=rigidBody.shapes; shape!==null; shape=shape.next){
            this.addShape(shape);
        }
        if(this.rigidBodies!==null)(this.rigidBodies.prev=rigidBody).next=this.rigidBodies;
        this.rigidBodies = rigidBody;
        this.numRigidBodies++;
    },
    /**
    * I will remove the rigid body from the world. 
    * Rigid body that has been deleted is excluded from the calculation on a step-by-step basis.
    * @param  rigidBody  Rigid body to be removed
    */
    removeRigidBody:function(rigidBody){
        var remove=rigidBody;
        if(remove.parent!==this)return;
        remove.awake();
        var js=remove.jointLink;
        while(js!=null){
	        var joint=js.joint;
	        js=js.next;
	        this.removeJoint(joint);
        }
        for(var shape=rigidBody.shapes; shape!==null; shape=shape.next){
            this.removeShape(shape);
        }
        var prev=remove.prev;
        var next=remove.next;
        if(prev!==null) prev.next=next;
        if(next!==null) next.prev=prev;
        if(this.rigidBodies==remove) this.rigidBodies=next;
        remove.prev=null;
        remove.next=null;
        remove.parent=null;
        this.numRigidBodies--;
    },
    getByName:function(name){
        var result = null;
        var body=this.rigidBodies;
        while(body!==null){
            if(body.name!== " " && body.name === name) result = body;
            body=body.next;
        }
        var joint=this.joints;
        while(joint!==null){
            if(joint.name!== "" && joint.name === name) result = joint;
            joint=joint.next;
        }
        return result;
    },

    /**
    * I'll add a shape to the world..
    * Add to the rigid world, and if you add a shape to a rigid body that has been added to the world, 
    * Shape will be added to the world automatically, please do not call from outside this method.
    * @param  shape  Shape you want to add
    */
    addShape:function(shape){
        if(!shape.parent || !shape.parent.parent){
            throw new Error("It is not possible to be added alone to shape world");
        }
        shape.proxy = this.broadPhase.createProxy(shape);
        shape.updateProxy();
        this.broadPhase.addProxy(shape.proxy);
    },

    /**
    * I will remove the shape from the world.
    * Add to the rigid world, and if you add a shape to a rigid body that has been added to the world, 
    * Shape will be added to the world automatically, please do not call from outside this method.
    * @param  shape  Shape you want to delete
    */
    removeShape:function(shape){
        this.broadPhase.removeProxy(shape.proxy);
        shape.proxy=null;
    },

    /**
    * I'll add a joint to the world. 
    * Joint that has been added will be the operands of each step.
    * @param  shape Joint to be added
    */
    addJoint:function(joint){
        if(joint.parent){
            throw new Error("It is not possible to be added to more than one world one of the joint");
        }
        if(this.joints!=null)(this.joints.prev=joint).next=this.joints;
        this.joints=joint;
        joint.parent=this;
        this.numJoints++;
        joint.awake();
        joint.attach();
    },

    /**
    * I will remove the joint from the world. 
    * Joint that has been added will be the operands of each step.
    * @param  shape Joint to be deleted
    */
    removeJoint:function(joint){
        var remove=joint;
        var prev=remove.prev;
        var next=remove.next;
        if(prev!==null)prev.next=next;
        if(next!==null)next.prev=prev;
        if(this.joints==remove)this.joints=next;
        remove.prev=null;
        remove.next=null;
        this.numJoints--;
        remove.awake();
        remove.detach();
        remove.parent=null;
    },

    worldscale:function(scale){
        OIMO.WORLD_SCALE = scale || 100;
        OIMO.INV_SCALE = 1/OIMO.WORLD_SCALE;
    },

    /**
    * I will proceed only time step seconds time of World.
    */
    step:function(){
        var time0, time1, time2, time3;

        if(!this.isNoStat) time0=Date.now();

        var body=this.rigidBodies;

        while(body!==null){
            body.addedToIsland=false;
            if(body.sleeping){
                if( body.linearVelocity.testZero() || body.position.testDiff(body.sleepPosition) || body.orientation.testDiff(body.sleepOrientation)){ body.awake(); } // awake the body
                /*var lv=body.linearVelocity;
                var av=body.linearVelocity;
                var p=body.position;
                var sp=body.sleepPosition;
                var o=body.orientation;
                var so=body.sleepOrientation;
               
                if( lv.x!==0 || lv.y!==0 || lv.z!==0 || av.x!==0 || av.y!==0 || av.z!==0 ||
                p.x!==sp.x || p.y!==sp.y || p.z!==sp.z ||
                o.s!==so.s || o.x!==so.x || o.y!==so.y || o.z!==so.z
                ){ body.awake(); }*/
            }
            body=body.next;
        }

        

        //------------------------------------------------------
        //   UPDATE CONTACT
        //------------------------------------------------------

        // broad phase
        if(!this.isNoStat) time1=Date.now();

        this.broadPhase.detectPairs();
        var pairs=this.broadPhase.pairs;
        var numPairs=this.broadPhase.numPairs;
        var i = numPairs;
        //do{
        while(i--){
        //for(var i=0, l=numPairs; i<l; i++){
            var pair=pairs[i];
            var s1;
            var s2;
            if(pair.shape1.id<pair.shape2.id){
                s1=pair.shape1;
                s2=pair.shape2;
            }else{
                s1=pair.shape2;
                s2=pair.shape1;
            }
            var link;
            if(s1.numContacts<s2.numContacts){
                link=s1.contactLink;
            }else{
                link=s2.contactLink;
            }
            var exists=false;
            while(link){
                var contact=link.contact;
                if(contact.shape1==s1&&contact.shape2==s2){
                    contact.persisting=true;
                    exists=true;// contact already exists
                    break;
                }
                link=link.next;
            }
            if(!exists){
                this.addContact(s1,s2);
            }
        }// while(i-- >0);

        if(!this.isNoStat){
            time2=Date.now();
            this.performance.broadPhaseTime=time2-time1;
        }

        // update & narrow phase
        this.numContactPoints=0;
        contact=this.contacts;
        while(contact!==null){
            if(!contact.persisting){
                var aabb1=contact.shape1.aabb;
                var aabb2=contact.shape2.aabb;
                if(
	                aabb1.minX>aabb2.maxX || aabb1.maxX<aabb2.minX ||
	                aabb1.minY>aabb2.maxY || aabb1.maxY<aabb2.minY ||
	                aabb1.minZ>aabb2.maxZ || aabb1.maxZ<aabb2.minZ
                ){
                    var next=contact.next;
                    this.removeContact(contact);
                    contact=next;
                    continue;
                }
            }
            var b1=contact.body1;
            var b2=contact.body2;
            if(b1.isDynamic && !b1.sleeping || b2.isDynamic && !b2.sleeping){
                contact.updateManifold();
            }
            this.numContactPoints+=contact.manifold.numPoints;
            contact.persisting=false;
            contact.constraint.addedToIsland=false;
            contact=contact.next;
        }

        if(!this.isNoStat){
            time3=Date.now();
            this.performance.narrowPhaseTime=time3-time2;
        }

        //------------------------------------------------------
        //   SOLVE ISLANDS
        //------------------------------------------------------

        var invTimeStep=1/this.timeStep;
        //var body;
        var joint;
        var constraint;
        var num;
        for(joint=this.joints; joint!==null; joint=joint.next){
            joint.addedToIsland=false;
        }
        // expand island buffers
        if(this.maxIslandRigidBodies<this.numRigidBodies){
            this.maxIslandRigidBodies=this.numRigidBodies<<1;
            //this.maxIslandRigidBodies=this.numRigidBodies*2;

            this.islandRigidBodies=[];
            this.islandStack=[];
            this.islandRigidBodies.length = this.maxIslandRigidBodies;
            this.islandStack.length = this.maxIslandRigidBodies;
        }
        var numConstraints=this.numJoints+this.numContacts;
        if(this.maxIslandConstraints<numConstraints){
            this.maxIslandConstraints=numConstraints<<1;
            //this.maxIslandConstraints=numConstraints*2;
            this.islandConstraints=[];
            this.islandConstraints.length = this.maxIslandConstraints;
        }
        time1=Date.now();
        this.numIslands=0;
        // build and solve simulation islands
        for(var base=this.rigidBodies; base!==null; base=base.next){
            if(base.addedToIsland || base.isStatic || base.sleeping){
                continue;// ignore
            }
            if(base.isLonely()){// update single body
                if(base.isDynamic){
                    base.linearVelocity.addTime(this.gravity, this.timeStep);
                    /*base.linearVelocity.x+=this.gravity.x*this.timeStep;
                    base.linearVelocity.y+=this.gravity.y*this.timeStep;
                    base.linearVelocity.z+=this.gravity.z*this.timeStep;*/
                }
                if(this.calSleep(base)){
                    base.sleepTime+=this.timeStep;
                if(base.sleepTime>0.5){
                    base.sleep();
                }else{
                    base.updatePosition(this.timeStep);
                }
                }else{
                    base.sleepTime=0;
                    base.updatePosition(this.timeStep);
                }
                this.numIslands++;
                continue;
            }
            var islandNumRigidBodies=0;
            var islandNumConstraints=0;
            var stackCount=1;
            // add rigid body to stack
            this.islandStack[0]=base;
            base.addedToIsland=true;
            // build an island
            do{
                // get rigid body from stack
                body=this.islandStack[--stackCount];
                this.islandStack[stackCount]=null;
                body.sleeping=false;
                // add rigid body to the island
                this.islandRigidBodies[islandNumRigidBodies++]=body;
                if(body.isStatic){
                continue;
                }
                // search connections
                for(var cs=body.contactLink; cs!==null; cs=cs.next){
                    var contact=cs.contact;
                    constraint=contact.constraint;
                    if(constraint.addedToIsland||!contact.touching){
                        continue;// ignore
                    }
                    // add constraint to the island
                    this.islandConstraints[islandNumConstraints++]=constraint;
                    constraint.addedToIsland=true;
                    var next=cs.body;
                    if(next.addedToIsland){
                    continue;
                    }
                    // add rigid body to stack
                    this.islandStack[stackCount++]=next;
                    next.addedToIsland=true;
                }
                for(var js=body.jointLink; js!==null; js=js.next){
                    constraint=js.joint;
                    if(constraint.addedToIsland){
                        continue;// ignore
                    }
                    // add constraint to the island
                    this.islandConstraints[islandNumConstraints++]=constraint;
                    constraint.addedToIsland=true;
                    next=js.body;
                    if(next.addedToIsland || !next.isDynamic){
                    continue;
                    }
                    // add rigid body to stack
                    this.islandStack[stackCount++]=next;
                    next.addedToIsland=true;
                }
            }while(stackCount!=0);

            // update velocities
            var gVel = new OIMO.Vec3().addTime(this.gravity, this.timeStep);
            /*var gx=this.gravity.x*this.timeStep;
            var gy=this.gravity.y*this.timeStep;
            var gz=this.gravity.z*this.timeStep;*/
            var j = islandNumRigidBodies;
            while (j--){
            //or(var j=0, l=islandNumRigidBodies; j<l; j++){
                body=this.islandRigidBodies[j];
                if(body.isDynamic){
                    body.linearVelocity.addEqual(gVel);
                    /*body.linearVelocity.x+=gx;
                    body.linearVelocity.y+=gy;
                    body.linearVelocity.z+=gz;*/
                }
            }

            // randomizing order
            if(this.enableRandomizer){
                //for(var j=1, l=islandNumConstraints; j<l; j++){
                j = islandNumConstraints;
                while(j--){ if(j!==0){     
                        var swap=(this.randX=(this.randX*this.randA+this.randB&0x7fffffff))/2147483648.0*j|0;
                        constraint=this.islandConstraints[j];
                        this.islandConstraints[j]=this.islandConstraints[swap];
                        this.islandConstraints[swap]=constraint;
                    }
                }
            }

            // solve contraints
            j = islandNumConstraints;
            while(j--){
            //for(j=0, l=islandNumConstraints; j<l; j++){
                this.islandConstraints[j].preSolve(this.timeStep,invTimeStep);// pre-solve
            }
            var k = this.numIterations;
            while(k--){
            //for(var k=0, l=this.numIterations; k<l; k++){
                j = islandNumConstraints;
                while(j--){
                //for(j=0, m=islandNumConstraints; j<m; j++){
                    this.islandConstraints[j].solve();// main-solve
                }
            }
            j = islandNumConstraints;
            while(j--){
            //for(j=0, l=islandNumConstraints; j<l; j++){
                this.islandConstraints[j].postSolve();// post-solve
                this.islandConstraints[j]=null;// gc
            }

            // sleeping check
            var sleepTime=10;
            j = islandNumRigidBodies;
            while(j--){
            //for(j=0, l=islandNumRigidBodies;j<l;j++){
                body=this.islandRigidBodies[j];
                if(this.calSleep(body)){
                    body.sleepTime+=this.timeStep;
                    if(body.sleepTime<sleepTime)sleepTime=body.sleepTime;
                }else{
                    body.sleepTime=0;
                    sleepTime=0;
                    continue;
                }
            }
            if(sleepTime>0.5){
                // sleep the island
                j = islandNumRigidBodies;
                while(j--){
                //for(j=0, l=islandNumRigidBodies;j<l;j++){
                    this.islandRigidBodies[j].sleep();
                    this.islandRigidBodies[j]=null;// gc
                }
            }else{
                // update positions
                j = islandNumRigidBodies;
                while(j--){
                //for(j=0, l=islandNumRigidBodies;j<l;j++){
                    this.islandRigidBodies[j].updatePosition(this.timeStep);
                    this.islandRigidBodies[j]=null;// gc
                }
            }
            this.numIslands++;
        }

        if(!this.isNoStat){
            time2=Date.now();
            this.performance.solvingTime=time2-time1;

            //------------------------------------------------------
            //   END SIMULATION
            //------------------------------------------------------

            time2=Date.now();
            // fps update
            this.performance.upfps();

            this.performance.totalTime=time2-time0;
            this.performance.updatingTime=this.performance.totalTime-(this.performance.broadPhaseTime+this.performance.narrowPhaseTime+this.performance.solvingTime);
        }
    },
    addContact:function(s1,s2){
        var newContact;
        if(this.unusedContacts!==null){
            newContact=this.unusedContacts;
            this.unusedContacts=this.unusedContacts.next;
        }else{
            newContact = new OIMO.Contact();
        }
        newContact.attach(s1,s2);
        newContact.detector=this.detectors[s1.type][s2.type];
        if(this.contacts)(this.contacts.prev=newContact).next=this.contacts;
        this.contacts=newContact;
        this.numContacts++;
    },
    removeContact:function(contact){
        var prev=contact.prev;
        var next=contact.next;
        if(next)next.prev=prev;
        if(prev)prev.next=next;
        if(this.contacts==contact)this.contacts=next;
        contact.prev=null;
        contact.next=null;
        contact.detach();
        contact.next=this.unusedContacts;
        this.unusedContacts=contact;
        this.numContacts--;
    },
    checkContact:function(name1, name2){
        var n1, n2;
        var contact = this.contacts;
        while(contact!==null){
            n1 = contact.body1.name || ' ';
            n2 = contact.body2.name || ' ';
            if((n1==name1 && n2==name2) || (n2==name1 && n1==name2)){ if(contact.touching) return true; else return false;}
            else contact = contact.next;
        }
        return false;
    },
    calSleep:function(body){
        if(!body.allowSleep)return false;
        if(body.linearVelocity.len()>0.04)return false;
        if(body.angularVelocity.len()>0.25)return false;
        /*var v=body.linearVelocity;
        if(v.x*v.x+v.y*v.y+v.z*v.z>0.04){return false;}
        v=body.angularVelocity;
        if(v.x*v.x+v.y*v.y+v.z*v.z>0.25){return false;}*/
        return true;
    }
}
/**
* The class of rigid body. 
* Rigid body has the shape of a single or multiple collision processing, 
* I can set the parameters individually.
* @author saharan
*/
OIMO.RigidBody = function(X,Y,Z,Rad,Ax,Ay,Az){
    var rad = Rad || 0;
    var ax = Ax || 0;
    var ay = Ay || 0;
    var az = Az || 0; 
    var x = X || 0;
    var y = Y || 0;
    var z = Z || 0;
    
    this.name = " ";
    // It is a kind of rigid body that represents the dynamic rigid body.
    this.BODY_DYNAMIC=0x1;
    // It is a kind of rigid body that represents the static rigid body.
    this.BODY_STATIC=0x2;
    // The maximum number of shapes that can be added to a one rigid.
    this.MAX_SHAPES=64;

    this.prev=null;
    this.next=null;

    // I represent the kind of rigid body.
    // Please do not change from the outside this variable. 
    // If you want to change the type of rigid body, always 
    // Please specify the type you want to set the arguments of setupMass method.
    this.type=0;

    this.massInfo= new OIMO.MassInfo();

    // It is the world coordinate of the center of gravity.
    this.position=new OIMO.Vec3(x,y,z); 


    this.newPosition = new OIMO.Vec3(0,0,0);
    this.controlPos = false;
    this.newOrientation = new OIMO.Quat();
    this.newRotation = new OIMO.Vec3(0,0,0);
    this.currentRotation = new OIMO.Vec3(0,0,0);
    this.controlRot = false;
    this.controlRotInTime = false;

    this.orientation = this.rotationAxisToQuad(rad,ax,ay,az);
    /*var len=ax*ax+ay*ay+az*az; 
    if(len>0){
        len=1/Math.sqrt(len);
        ax*=len;
        ay*=len;
        az*=len;
    }
    var sin=Math.sin(rad*0.5);
    var cos=Math.cos(rad*0.5);*/
    // It is a quaternion that represents the attitude.
    //this.orientation = new OIMO.Quat(cos,sin*ax,sin*ay,sin*az);
    // Is the translational velocity.
    this.linearVelocity = new OIMO.Vec3();
    // Is the angular velocity.
    this.angularVelocity = new OIMO.Vec3();

    // return matrix for three.js
    this.matrix = new OIMO.Mat44();

    //--------------------------------------------
    //  Please do not change from the outside this variables.
    //--------------------------------------------

    // It is a world that rigid body has been added.
    this.parent=null;
    this.contactLink=null;
    this.numContacts=0;

    // An array of shapes that are included in the rigid body.
    this.shapes=null;
    // The number of shapes that are included in the rigid body.
    this.numShapes=0;

    // It is the link array of joint that is connected to the rigid body.
    this.jointLink=null;
    // The number of joints that are connected to the rigid body.
    this.numJoints=0;

    // It is the world coordinate of the center of gravity in the sleep just before.
    this.sleepPosition=new OIMO.Vec3();
    // It is a quaternion that represents the attitude of sleep just before.
    this.sleepOrientation=new OIMO.Quat();
    // I will show this rigid body to determine whether it is a rigid body static.
    this.isStatic=false;
    // I indicates that this rigid body to determine whether it is a rigid body dynamic. 
    this.isDynamic=false;
    // It is a rotation matrix representing the orientation.
    this.rotation=new OIMO.Mat33();

    //--------------------------------------------
    // It will be recalculated automatically from the shape, which is included.
    //--------------------------------------------
    
    // This is the weight. 
    this.mass=NaN;
    // It is the reciprocal of the mass.
    this.inverseMass=NaN;
    // It is the inverse of the inertia tensor in the world system.
    this.inverseInertia=new OIMO.Mat33();
    // It is the inertia tensor in the initial state.
    this.localInertia=new OIMO.Mat33();
    // It is the inverse of the inertia tensor in the initial state.
    this.inverseLocalInertia=new OIMO.Mat33();


    // I indicates rigid body whether it has been added to the simulation Island.
    this.addedToIsland=false;
    // It shows how to sleep rigid body.
    this.allowSleep=true;
    // This is the time from when the rigid body at rest.
    this.sleepTime=0;
    // I shows rigid body to determine whether it is a sleep state.
    this.sleeping=false;
}

OIMO.RigidBody.prototype = {

    constructor: OIMO.RigidBody,
    /**
    * I'll add a shape to rigid body.  
    * If you add a shape, please call the setupMass method to step up to the start of the next.
    * @param   shape shape to Add 
    */
    addShape:function(shape){
        if(shape.parent){
            throw new Error("It is not possible that you add to the multi-rigid body the shape of one");
        }
        if(this.shapes!=null)(this.shapes.prev=shape).next=this.shapes;
        this.shapes=shape;
        shape.parent=this;
        if(this.parent)this.parent.addShape(shape);
        this.numShapes++;
    },
    /**
    * I will delete the shape from the rigid body. 
    * If you delete a shape, please call the setupMass method to step up to the start of the next. 
    * @param   shape shape to Delete 
    */
    removeShape:function(shape){
        var remove=shape;
        if(remove.parent!=this)return;
        var prev=remove.prev;
        var next=remove.next;
        if(prev!=null)prev.next=next;
        if(next!=null)next.prev=prev;
        if(this.shapes==remove)this.shapes=next;
        remove.prev=null;
        remove.next=null;
        remove.parent=null;
        if(this.parent)this.parent.removeShape(remove);
        this.numShapes--;
    },
    /**
    * Calulates mass datas(center of gravity, mass, moment inertia, etc...).
    * If the parameter type is set to BODY_STATIC, the rigid body will be fixed to the space.
    * If the parameter adjustPosition is set to true, the shapes' relative positions and
    * the rigid body's position will be adjusted to the center of gravity.
    * @param   type
    * @param   adjustPosition
    */
    setupMass:function(Type,AdjustPosition){
        var adjustPosition = ( AdjustPosition !== undefined ) ? AdjustPosition : true;
        var type = Type || this.BODY_DYNAMIC;
        //var te = this.localInertia.elements;
        this.type=type;
        this.isDynamic=type==this.BODY_DYNAMIC;
        this.isStatic=type==this.BODY_STATIC;
        this.mass=0;
        this.localInertia.init(0,0,0,0,0,0,0,0,0);
        var te = this.localInertia.elements;
        //
        var tmpM=new OIMO.Mat33();
        var tmpV=new OIMO.Vec3();
        for(var shape=this.shapes;shape!=null;shape=shape.next){
            shape.calculateMassInfo(this.massInfo);
            var shapeMass=this.massInfo.mass;
            var relX=shape.relativePosition.x;
            var relY=shape.relativePosition.y;
            var relZ=shape.relativePosition.z;
            /*tmpV.x+=relX*shapeMass;
            tmpV.y+=relY*shapeMass;
            tmpV.z+=relZ*shapeMass;*/
            tmpV.addScale(shape.relativePosition, shapeMass);
            this.mass+=shapeMass;
            this.rotateInertia(shape.relativeRotation,this.massInfo.inertia,tmpM);
            this.localInertia.addEqual(tmpM);

            // add offset inertia
            te[0]+=shapeMass*(relY*relY+relZ*relZ);
            te[4]+=shapeMass*(relX*relX+relZ*relZ);
            te[8]+=shapeMass*(relX*relX+relY*relY);
            var xy=shapeMass*relX*relY;
            var yz=shapeMass*relY*relZ;
            var zx=shapeMass*relZ*relX;
            te[1]-=xy;
            te[3]-=xy;
            te[2]-=yz;
            te[6]-=yz;
            te[5]-=zx;
            te[7]-=zx;
        }
        this.inverseMass=1/this.mass;
        tmpV.scaleEqual(this.inverseMass);
        if(adjustPosition){
            this.position.addEqual(tmpV);
            for(shape=this.shapes;shape!=null;shape=shape.next){
                shape.relativePosition.subEqual(tmpV);
            }
            // subtract offset inertia
            relX=tmpV.x;
            relY=tmpV.y;
            relZ=tmpV.z;
            //var te = this.localInertia.elements;
            te[0]-=this.mass*(relY*relY+relZ*relZ);
            te[4]-=this.mass*(relX*relX+relZ*relZ);
            te[8]-=this.mass*(relX*relX+relY*relY);
            xy=this.mass*relX*relY;
            yz=this.mass*relY*relZ;
            zx=this.mass*relZ*relX;
            te[1]+=xy;
            te[3]+=xy;
            te[2]+=yz;
            te[6]+=yz;
            te[5]+=zx;
            te[7]+=zx;
        }
        this.inverseLocalInertia.invert(this.localInertia);
        if(type==this.BODY_STATIC){
            this.inverseMass=0;
            this.inverseLocalInertia.init(0,0,0,0,0,0,0,0,0);
        }
        this.syncShapes();
        this.awake();
    },
    /**
    * Awake the rigid body.
    */
    awake:function(){
        if(!this.allowSleep||!this.sleeping)return;
        this.sleeping=false;
        this.sleepTime=0;
        // awake connected constraints
        var cs=this.contactLink;
        while(cs!=null){
            cs.body.sleepTime=0;
            cs.body.sleeping=false;
            cs=cs.next;
        }
        var js=this.jointLink;
        while(js!=null){
            js.body.sleepTime=0;
            js.body.sleeping=false;
            js=js.next;
        }
        for(var shape=this.shapes;shape!=null;shape=shape.next){
            shape.updateProxy();
        }
    },
    /**
    * Sleep the rigid body.
    */
    sleep:function(){
        if(!this.allowSleep||this.sleeping)return;
        this.linearVelocity.init();
        this.angularVelocity.init();
        this.sleepPosition.copy(this.position);
        this.sleepOrientation.copy(this.orientation);
        /*this.linearVelocity.x=0;
        this.linearVelocity.y=0;
        this.linearVelocity.z=0;
        this.angularVelocity.x=0;
        this.angularVelocity.y=0;
        this.angularVelocity.z=0;
        this.sleepPosition.x=this.position.x;
        this.sleepPosition.y=this.position.y;
        this.sleepPosition.z=this.position.z;*/
        /*this.sleepOrientation.s=this.orientation.s;
        this.sleepOrientation.x=this.orientation.x;
        this.sleepOrientation.y=this.orientation.y;
        this.sleepOrientation.z=this.orientation.z;*/
        
        this.sleepTime=0;
        this.sleeping=true;
        for(var shape=this.shapes;shape!=null;shape=shape.next){
            shape.updateProxy();
        }
    },
    /**
    * Get whether the rigid body has not any connection with others.
    * @return
    */
    isLonely:function(){
        return this.numJoints==0&&this.numContacts==0;
    },

    /** 
    * The time integration of the motion of a rigid body, you can update the information such as the shape. 
    * This method is invoked automatically when calling the step of the World, 
    * There is no need to call from outside usually. 
    * @param  timeStep time 
    */

    updatePosition:function(timeStep){
        switch(this.type){
            case this.BODY_STATIC:
                this.linearVelocity.init();
                this.angularVelocity.init();
                // ONLY FOR TEST
                if(this.controlPos){
                    this.position.copy(this.newPosition);
                    this.controlPos = false;
                }
                if(this.controlRot){
                    this.orientation.copy(this.newOrientation);
                    this.controlRot = false;
                }
                /*this.linearVelocity.x=0;
                this.linearVelocity.y=0;
                this.linearVelocity.z=0;
                this.angularVelocity.x=0;
                this.angularVelocity.y=0;
                this.angularVelocity.z=0;*/
            break;
            case this.BODY_DYNAMIC:

                if(this.controlPos){
                    this.angularVelocity.init();
                    this.linearVelocity.init();
                    this.linearVelocity.x = (this.newPosition.x - this.position.x)/timeStep;
                    this.linearVelocity.y = (this.newPosition.y - this.position.y)/timeStep;
                    this.linearVelocity.z = (this.newPosition.z - this.position.z)/timeStep;
                    this.controlPos = false;
                }
                if(this.controlRot){
                    this.angularVelocity.init();
                    this.orientation.copy(this.newOrientation);

                    //var t=timeStep//*0.5;
                    //var q = new OIMO.Quat();
                    //q.sub(this.newOrientation, this.orientation);
                    //q.normalize(q);
                    /*q.s = (this.newOrientation.s - this.orientation.s)/t;
                    q.x = (this.newOrientation.x - this.orientation.x)/t;
                    q.y = (this.newOrientation.y - this.orientation.y)/t;
                    q.z = (this.newOrientation.z - this.orientation.z)/t;*/

                    //this.angularVelocity.applyQuaternion(q);
                    //this.angularVelocity.x = this.angularVelocity.x/t;
                    //this.angularVelocity.y = this.angularVelocity.y/t;
                    //this.angularVelocity.z = this.angularVelocity.z/t;
                    
                    this.controlRot = false;
                }

                this.position.addTime(this.linearVelocity, timeStep);
                this.orientation.addTime(this.angularVelocity, timeStep);

            break;
            default:
                throw new Error("Invalid type.");
        }
        this.syncShapes();
    },
    rotateInertia:function(rot,inertia,out){
        var tm1 = rot.elements;
        var tm2 = inertia.elements;

        var a0 = tm1[0], a3 = tm1[3], a6 = tm1[6];
        var a1 = tm1[1], a4 = tm1[4], a7 = tm1[7];
        var a2 = tm1[2], a5 = tm1[5], a8 = tm1[8];

        var b0 = tm2[0], b3 = tm2[3], b6 = tm2[6];
        var b1 = tm2[1], b4 = tm2[4], b7 = tm2[7];
        var b2 = tm2[2], b5 = tm2[5], b8 = tm2[8];
        
        var e00 = a0*b0 + a1*b3 + a2*b6;
        var e01 = a0*b1 + a1*b4 + a2*b7;
        var e02 = a0*b2 + a1*b5 + a2*b8;
        var e10 = a3*b0 + a4*b3 + a5*b6;
        var e11 = a3*b1 + a4*b4 + a5*b7;
        var e12 = a3*b2 + a4*b5 + a5*b8;
        var e20 = a6*b0 + a7*b3 + a8*b6;
        var e21 = a6*b1 + a7*b4 + a8*b7;
        var e22 = a6*b2 + a7*b5 + a8*b8;

        var oe = out.elements;
        oe[0] = e00*a0 + e01*a1 + e02*a2;
        oe[1] = e00*a3 + e01*a4 + e02*a5;
        oe[2] = e00*a6 + e01*a7 + e02*a8;
        oe[3] = e10*a0 + e11*a1 + e12*a2;
        oe[4] = e10*a3 + e11*a4 + e12*a5;
        oe[5] = e10*a6 + e11*a7 + e12*a8;
        oe[6] = e20*a0 + e21*a1 + e22*a2;
        oe[7] = e20*a3 + e21*a4 + e22*a5;
        oe[8] = e20*a6 + e21*a7 + e22*a8;
    },
    syncShapes:function(){
        var s=this.orientation.s;
        var x=this.orientation.x;
        var y=this.orientation.y;
        var z=this.orientation.z;
        var x2=2*x;
        var y2=2*y;
        var z2=2*z;
        var xx=x*x2;
        var yy=y*y2;
        var zz=z*z2;
        var xy=x*y2;
        var yz=y*z2;
        var xz=x*z2;
        var sx=s*x2;
        var sy=s*y2;
        var sz=s*z2;

        var tr = this.rotation.elements;
        tr[0]=1-yy-zz;
        tr[1]=xy-sz;
        tr[2]=xz+sy;
        tr[3]=xy+sz;
        tr[4]=1-xx-zz;
        tr[5]=yz-sx;
        tr[6]=xz-sy;
        tr[7]=yz+sx;
        tr[8]=1-xx-yy;

        this.rotateInertia(this.rotation,this.inverseLocalInertia,this.inverseInertia);
        for(var shape=this.shapes;shape!=null;shape=shape.next){
            //var relPos=shape.relativePosition;
            //var relRot=shape.relativeRotation;
            //var rot=shape.rotation;
            /*var lx=relPos.x;
            var ly=relPos.y;
            var lz=relPos.z;
            shape.position.x=this.position.x+lx*tr[0]+ly*tr[1]+lz*tr[2];
            shape.position.y=this.position.y+lx*tr[3]+ly*tr[4]+lz*tr[5];
            shape.position.z=this.position.z+lx*tr[6]+ly*tr[7]+lz*tr[8];*/

            shape.position.mul(this.position,shape.relativePosition,this.rotation);
            shape.rotation.mul(shape.relativeRotation,this.rotation);
            shape.updateProxy();
        }
    },
    applyImpulse:function(position,force){
        this.linearVelocity.addScale(force, this.inverseMass);
        /*this.linearVelocity.x+=force.x*this.inverseMass;
        this.linearVelocity.y+=force.y*this.inverseMass;
        this.linearVelocity.z+=force.z*this.inverseMass;*/
        var rel=new OIMO.Vec3();
        rel.sub(position,this.position).cross(rel,force).mulMat(this.inverseInertia,rel);
        this.angularVelocity.addEqual(rel);
        /*this.angularVelocity.x+=rel.x;
        this.angularVelocity.y+=rel.y;
        this.angularVelocity.z+=rel.z;*/
    },

    //---------------------------------------------
    //
    // FOR THREE JS
    //
    //---------------------------------------------

    rotationVectToQuad: function(rot){
        var r = OIMO.EulerToAxis( rot.x * OIMO.TO_RAD, rot.y * OIMO.TO_RAD, rot.z * OIMO.TO_RAD );
        return this.rotationAxisToQuad(r[0], r[1], r[2], r[3]);
    },

    rotationAxisToQuad: function(rad, ax, ay, az){ // in radian
        var len=ax*ax+ay*ay+az*az; 
        if(len>0){
            len=1/Math.sqrt(len);
            ax*=len;
            ay*=len;
            az*=len;
        }
        var sin=Math.sin(rad*0.5);
        var cos=Math.cos(rad*0.5);
        return new OIMO.Quat(cos,sin*ax,sin*ay,sin*az);
    },

    //---------------------------------------------
    // SET DYNAMIQUE POSITION AND ROTATION
    //---------------------------------------------

    setPosition:function(pos){
        this.newPosition.init(pos.x*OIMO.INV_SCALE,pos.y*OIMO.INV_SCALE,pos.z*OIMO.INV_SCALE);
        this.controlPos = true;
    },

    setQuaternion:function(q){ 
        //if(this.type == this.BODY_STATIC)this.orientation.init(q.w,q.x,q.y,q.z);

        this.newOrientation.init(q.w,q.x,q.y,q.z);
        this.controlRot = true;
    },

    setRotation:function(rot){ 
        this.newOrientation = this.rotationVectToQuad(rot);
        this.controlRot = true;
    },

    //---------------------------------------------
    // RESET DYNAMIQUE POSITION AND ROTATION
    //---------------------------------------------

    resetPosition:function(x,y,z){
        this.linearVelocity.init();
        this.angularVelocity.init();
        this.position.init(x*OIMO.INV_SCALE,y*OIMO.INV_SCALE,z*OIMO.INV_SCALE);
        this.awake();
    },
    resetQuaternion:function(q){
        this.angularVelocity.init();
        this.orientation = new OIMO.Quat(q.w,q.x,q.y,q.z);
        this.awake();
    },
    resetRotation:function(x,y,z){
        this.angularVelocity.init();
        this.orientation = this.rotationVectToQuad(new OIMO.Vec3(x,y,z));
        this.awake();
    },

    //---------------------------------------------
    // GET POSITION AND ROTATION
    //---------------------------------------------

    getPosition:function(){
        return new OIMO.Vec3().scale(this.position, OIMO.WORLD_SCALE);
    },
    getRotation:function(){
        return new OIMO.Euler().setFromRotationMatrix(this.rotation);
    },
    getQuaternion:function(){
        return new OIMO.Quaternion().setFromRotationMatrix(this.rotation);
    },
    getMatrix:function(){
        var m = this.matrix.elements;
        var r,p;
        if(!this.sleeping){
            // rotation matrix
            r = this.rotation.elements;
            m[0] = r[0]; m[1] = r[3]; m[2] = r[6];  m[3] = 0;
            m[4] = r[1]; m[5] = r[4]; m[6] = r[7];  m[7] = 0;
            m[8] = r[2]; m[9] = r[5]; m[10] = r[8]; m[11] = 0;

            // position matrix
            p = this.position;
            m[12] = p.x*OIMO.WORLD_SCALE;
            m[13] = p.y*OIMO.WORLD_SCALE;
            m[14] = p.z*OIMO.WORLD_SCALE;

            // sleep or not ?
            m[15] = 0;
        } else {
            m[15] = 1;
        }

        return m;
    }
}
/**
* The main class of body.
* is for simplify creation process and data access of rigidRody
* Rigid body has the shape of a single or multiple collision processing, 
* all setting in object
* 
* @author loth
*/
OIMO.Body = function(Obj){
    var obj = Obj || {};
    if(!obj.world) return;

    // the world where i am
    this.parent = obj.world;

    // Yep my name 
    this.name = obj.name || '';

    // I'm dynamique or not
    var move = obj.move || false;

    // I can sleep or not
    var noSleep  = obj.noSleep || false;
    
    // My start position
    var p = obj.pos || [0,0,0];
    p = p.map(function(x) { return x * OIMO.INV_SCALE; });

    // My size 
    var s = obj.size || [1,1,1];
    s = s.map(function(x) { return x * OIMO.INV_SCALE; });

    // My rotation in degre
    var rot = obj.rot || [0,0,0];
    rot = rot.map(function(x) { return x * OIMO.TO_RAD; });
    var r = [];
    for (var i=0; i<rot.length/3; i++){
        var tmp = OIMO.EulerToAxis(rot[i+0], rot[i+1], rot[i+2]);
        r.push(tmp[0]);  r.push(tmp[1]); r.push(tmp[2]); r.push(tmp[3]);
    }

    // My physics setting
    var sc = obj.sc || new OIMO.ShapeConfig();
    if(obj.config){
        // The density of the shape.
        sc.density = obj.config[0] || 1;
        // The coefficient of friction of the shape.
        sc.friction = obj.config[1] || 0.4;
        // The coefficient of restitution of the shape.
        sc.restitution = obj.config[2] || 0.2;
        // The bits of the collision groups to which the shape belongs.
        sc.belongsTo = obj.config[3] || 1;
        // The bits of the collision groups with which the shape collides.
        sc.collidesWith = obj.config[4] || 0xffffffff;
    }

    if(obj.massPos){
        obj.massPos = obj.massPos.map(function(x) { return x * OIMO.INV_SCALE; });
        sc.relativePosition.init(obj.massPos[0], obj.massPos[1], obj.massPos[2]);
    }
    if(obj.massRot){
        obj.massRot = obj.massRot.map(function(x) { return x * OIMO.TO_RAD; });
        sc.relativeRotation = OIMO.EulerToMatrix(obj.massRot[0], obj.massRot[1], obj.massRot[2]);
    }
    
    // My rigidbody
    this.body = new OIMO.RigidBody(p[0], p[1], p[2], r[0], r[1], r[2], r[3]);

    // My shapes
    var shapes = [];
    var type = obj.type || "box";
    if( typeof type === 'string' ) type = [type];// single shape

    var n, n2;
    for(var i=0; i<type.length; i++){
        n = i*3;
        n2 = i*4;
        switch(type[i]){
            case "sphere": shapes[i] = new OIMO.SphereShape(sc, s[n+0]); break;
            case "cylinder": shapes[i] = new OIMO.BoxShape(sc, s[n+0], s[n+1], s[n+2]); break; // fake cylinder
            case "box": shapes[i] = new OIMO.BoxShape(sc, s[n+0], s[n+1], s[n+2]); break;
        }
        this.body.addShape(shapes[i]);
        if(i>0){
            //shapes[i].position.init(p[0]+p[n+0], p[1]+p[n+1], p[2]+p[n+2] );
            shapes[i].relativePosition = new OIMO.Vec3( p[n+0], p[n+1], p[n+2] );
            if(r[n2+0]) shapes[i].relativeRotation = [ r[n2+0], r[n2+1], r[n2+2], r[n2+3] ];
        }
    } 
    
    // I'm static or i move
    if(move){
        if(obj.massPos || obj.massRot)this.body.setupMass(0x1, false);
        else this.body.setupMass(0x1, true);
        if(noSleep) this.body.allowSleep = false;
        else this.body.allowSleep = true;
    } else {
        this.body.setupMass(0x2);
    }
    
    this.body.name = this.name;
    this.sleeping = this.body.sleeping;

    // finaly add to physics world
    this.parent.addRigidBody(this.body);
}

OIMO.Body.prototype = {
    constructor: OIMO.Body,
    // SET
    setPosition:function(pos){
        this.body.setPosition(pos);
    },
    setQuaternion:function(q){
        this.body.setQuaternion(q);
    },
    setRotation:function(rot){
        this.body.setRotation(rot);
    },
    // GET
    getPosition:function(){
        return this.body.getPosition();
    },
    getRotation:function(){
        return this.body.getRotation();
    },
    getQuaternion:function(){
        return this.body.getQuaternion();
    },
    getMatrix:function(){
        return this.body.getMatrix();
    },
    getSleep:function(){
        return this.body.sleeping;
    },
    // RESET
    resetPosition:function(x,y,z){
        this.body.resetPosition(x,y,z);
    },
    resetRotation:function(x,y,z){
        this.body.resetRotation(x,y,z);
    },
    // force wakeup
    awake:function(){
        this.body.awake();
    },
    // remove rigidbody
    remove:function(){
        this.parent.removeRigidBody(this.body);
    },
    // test if this object hit another
    checkContact:function(name){
        this.parent.checkContact(this.name, name);
    }
}
/**
* The main class of link.
* is for simplify creation process and data access of Joint
* all setting in object
* 
* @author loth
*/
OIMO.Link = function(Obj){
    var obj = Obj || {};
    if(!obj.world) return;

    // the world where i am
    this.parent = obj.world;

    this.name = obj.name || '';
    var type = obj.type || "jointHinge";
    var axe1 = obj.axe1 || [1,0,0];
    var axe2 = obj.axe2 || [1,0,0];
    var pos1 = obj.pos1 || [0,0,0];
    var pos2 = obj.pos2 || [0,0,0];

    pos1 = pos1.map(function(x){ return x * OIMO.INV_SCALE; });
    pos2 = pos2.map(function(x){ return x * OIMO.INV_SCALE; });

    var min, max;
    if(type==="jointDistance"){
        min = obj.min || 0;
        max = obj.max || 10;
        min = min*OIMO.INV_SCALE;
        max = max*OIMO.INV_SCALE;
    }else{
        min = obj.min || 57.29578;
        max = obj.max || 0;
        min = min*OIMO.TO_RAD;
        max = max*OIMO.TO_RAD;
    }

    var limit = obj.limit || null;
    var spring = obj.spring || null;
    var motor = obj.motor || null;

    // joint setting
    var jc = new OIMO.JointConfig();
    jc.allowCollision = obj.collision || false;;
    jc.localAxis1.init(axe1[0], axe1[1], axe1[2]);
    jc.localAxis2.init(axe2[0], axe2[1], axe2[2]);
    jc.localAnchorPoint1.init(pos1[0], pos1[1], pos1[2]);
    jc.localAnchorPoint2.init(pos2[0], pos2[1], pos2[2]);
    if (typeof obj.body1 == 'string' || obj.body1 instanceof String) obj.body1 = obj.world.getByName(obj.body1);
    if (typeof obj.body2 == 'string' || obj.body2 instanceof String) obj.body2 = obj.world.getByName(obj.body2);
    jc.body1 = obj.body1;
    jc.body2 = obj.body2;

    
    switch(type){
        case "jointDistance": this.joint = new OIMO.DistanceJoint(jc, min, max); 
            if(spring !== null) this.joint.limitMotor.setSpring(spring[0], spring[1]);
            if(motor !== null) this.joint.limitMotor.setSpring(motor[0], motor[1]);
        break;
        case "jointHinge": this.joint = new OIMO.HingeJoint(jc, min, max);
            if(spring !== null) this.joint.limitMotor.setSpring(spring[0], spring[1]);// soften the joint ex: 100, 0.2
            if(motor !== null) this.joint.limitMotor.setSpring(motor[0], motor[1]);
        break;
        case "jointPrisme": this.joint = new OIMO.PrismaticJoint(jc, min, max); break;
        case "jointSlide": this.joint = new OIMO.SliderJoint(jc, min, max); break;
        case "jointBall": this.joint = new OIMO.BallAndSocketJoint(jc); break;
        case "jointWheel": this.joint = new OIMO.WheelJoint(jc);  
            if(limit !== null) this.joint.rotationalLimitMotor1.setLimit(limit[0], limit[1]);
            if(spring !== null) this.joint.rotationalLimitMotor1.setSpring(spring[0], spring[1]);
            if(motor !== null) this.joint.rotationalLimitMotor1.setSpring(motor[0], motor[1]);
        break;
    }

    this.joint.name = this.name;
    
    // finaly add to physics world
    this.parent.addJoint(this.joint);
}

OIMO.Link.prototype = {
    constructor: OIMO.Link,
    getPosition:function(){
        // array of two vect3 [point1, point2]
        return this.joint.getPosition();
    },
    getMatrix:function(){
        return this.joint.getMatrix();
    },
    // remove joint
    remove:function(){
        this.parent.removeJoint(this.joint);
    },
    // force wakeup linked body
    awake:function(){
        this.joint.awake();
    }
}
OIMO.Performance = function(world){
	this.parent = world;
	this.infos = new OIMO_ARRAY_TYPE(13);
	this.f = [0,0,0];

    this.fps=0;
    this.broadPhaseTime=0;
    this.narrowPhaseTime=0;
    this.solvingTime=0;
    this.updatingTime=0;
    this.totalTime=0;
}
OIMO.Performance.prototype = {
	upfps : function(){
		this.f[1] = Date.now();
        if (this.f[1]-1000>this.f[0]){ this.f[0]=this.f[1]; this.fps=this.f[2]; this.f[2]=0; } this.f[2]++;
	},
	show : function(){
		var info =[
            "Oimo.js DEV.1.1.2a<br><br>",
            "FPS: " + this.fps +" fps<br><br>",
            "rigidbody "+this.parent.numRigidBodies+"<br>",
            "contact &nbsp;&nbsp;"+this.parent.numContacts+"<br>",
            "paircheck "+this.parent.broadPhase.numPairChecks+"<br>",
            "contact &nbsp;&nbsp;"+this.parent.numContactPoints+"<br>",
            "island &nbsp;&nbsp;&nbsp;"+this.parent.numIslands +"<br><br>",
            "Time in ms <br>",
            "broad-phase &nbsp;"+this.broadPhaseTime + "<br>",
            "narrow-phase "+this.narrowPhaseTime + "<br>",
            "solving &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"+this.solvingTime + "<br>",
            "updating &nbsp;&nbsp;&nbsp;&nbsp;"+this.updatingTime + "<br>",
            "total &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"+this.totalTime
        ].join("\n");
        return info;
	},
	toArray : function(){
		this.infos[0] = this.parent.broadPhase.types;
	    this.infos[1] = this.parent.numRigidBodies;
	    this.infos[2] = this.parent.numContacts;
	    this.infos[3] = this.parent.broadPhase.numPairChecks;
	    this.infos[4] = this.parent.numContactPoints;
	    this.infos[5] = this.parent.numIslands;
	    this.infos[6] = this.broadPhaseTime;
	    this.infos[7] = this.narrowPhaseTime;
	    this.infos[8] = this.solvingTime;
	    this.infos[9] = this.updatingTime;
	    this.infos[10] = this.totalTime;
	    this.infos[11] = this.fps;
		return this.infos;
	}
}
OIMO.Mat44 = function(n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44){
    this.elements = new OIMO_ARRAY_TYPE(16);
    var te = this.elements;
    te[0] = ( n11 !== undefined ) ? n11 : 1; te[4] = n12 || 0; te[8] = n13 || 0; te[12] = n14 || 0;
    te[1] = n21 || 0; te[5] = ( n22 !== undefined ) ? n22 : 1; te[9] = n23 || 0; te[13] = n24 || 0;
    te[2] = n31 || 0; te[6] = n32 || 0; te[10] = ( n33 !== undefined ) ? n33 : 1; te[14] = n34 || 0;
    te[3] = n41 || 0; te[7] = n42 || 0; te[11] = n43 || 0; te[15] = ( n44 !== undefined ) ? n44 : 1;
};

OIMO.Mat44.prototype = {
    constructor: OIMO.Mat44,

    set: function ( n11, n12, n13, n14, n21, n22, n23, n24, n31, n32, n33, n34, n41, n42, n43, n44 ) {

        var te = this.elements;

        te[0] = n11; te[4] = n12; te[8] = n13; te[12] = n14;
        te[1] = n21; te[5] = n22; te[9] = n23; te[13] = n24;
        te[2] = n31; te[6] = n32; te[10] = n33; te[14] = n34;
        te[3] = n41; te[7] = n42; te[11] = n43; te[15] = n44;

        return this;
    }/*,
    extractRotation: function () {

        var v1 = new THREE.Vector3();

        return function ( m ) {

            var te = this.elements;
            var me = m.elements;

            var scaleX = 1 / v1.set( me[ 0 ], me[ 1 ], me[ 2 ] ).length();
            var scaleY = 1 / v1.set( me[ 4 ], me[ 5 ], me[ 6 ] ).length();
            var scaleZ = 1 / v1.set( me[ 8 ], me[ 9 ], me[ 10 ] ).length();

            te[ 0 ] = me[ 0 ] * scaleX;
            te[ 1 ] = me[ 1 ] * scaleX;
            te[ 2 ] = me[ 2 ] * scaleX;

            te[ 4 ] = me[ 4 ] * scaleY;
            te[ 5 ] = me[ 5 ] * scaleY;
            te[ 6 ] = me[ 6 ] * scaleY;

            te[ 8 ] = me[ 8 ] * scaleZ;
            te[ 9 ] = me[ 9 ] * scaleZ;
            te[ 10 ] = me[ 10 ] * scaleZ;

            return this;

        };

    }() */
}
OIMO.Mat33 = function(e00,e01,e02,e10,e11,e12,e20,e21,e22){
    this.elements = new OIMO_ARRAY_TYPE(9);
    var te = this.elements;

    this.init(
        ( e00 !== undefined ) ? e00 : 1, e01 || 0, e02 || 0,
        e10 || 0, ( e11 !== undefined ) ? e11 : 1, e12 || 0,
        e20 || 0, e21 || 0, ( e22 !== undefined ) ? e22 : 1
    );
};

OIMO.Mat33.prototype = {
    constructor: OIMO.Mat33,

    init: function(e00,e01,e02,e10,e11,e12,e20,e21,e22){
        var te = this.elements;
        te[0] = e00; te[1] = e01; te[2] = e02;
        te[3] = e10; te[4] = e11; te[5] = e12;
        te[6] = e20; te[7] = e21; te[8] = e22;
        return this;
    },
    add: function(m1,m2){
        var te = this.elements, tem1 = m1.elements, tem2 = m2.elements;
        te[0] = tem1[0] + tem2[0]; te[1] = tem1[1] + tem2[1]; te[2] = tem1[2] + tem2[2];
        te[3] = tem1[3] + tem2[3]; te[4] = tem1[4] + tem2[4]; te[5] = tem1[5] + tem2[5];
        te[6] = tem1[6] + tem2[6]; te[7] = tem1[7] + tem2[7]; te[8] = tem1[8] + tem2[8];
        return this;
    },
    addEqual: function(m){
        var te = this.elements, tem = m.elements;
        te[0] += tem[0]; te[1] += tem[1]; te[2] += tem[2];
        te[3] += tem[3]; te[4] += tem[4]; te[5] += tem[5];
        te[6] += tem[6]; te[7] += tem[7]; te[8] += tem[8];
        return this;
    },
    sub: function(m1,m2){
        var te = this.elements, tem1 = m1.elements, tem2 = m2.elements;
        te[0] = tem1[0] - tem2[0]; te[1] = tem1[1] - tem2[1]; te[2] = tem1[2] - tem2[2];
        te[3] = tem1[3] - tem2[3]; te[4] = tem1[4] - tem2[4]; te[5] = tem1[5] - tem2[5];
        te[6] = tem1[6] - tem2[6]; te[7] = tem1[7] - tem2[7]; te[8] = tem1[8] - tem2[8];
        return this;
    },
    subEqual:function(m){
        var te = this.elements, tem = m.elements;
        te[0] -= tem[0]; te[1] -= tem[1]; te[2] -= tem[2];
        te[3] -= tem[3]; te[4] -= tem[4]; te[5] -= tem[5];
        te[6] -= tem[6]; te[7] -= tem[7]; te[8] -= tem[8];
        return this;
    },
    scale: function(m,s){
        var te = this.elements, tm = m.elements;
        te[0] = tm[0] * s; te[1] = tm[1] * s; te[2] = tm[2] * s;
        te[3] = tm[3] * s; te[4] = tm[4] * s; te[5] = tm[5] * s;
        te[6] = tm[6] * s; te[7] = tm[7] * s; te[8] = tm[8] * s;
        return this;
    },
    scaleEqual: function(s){
        var te = this.elements;
        te[0] *= s; te[1] *= s; te[2] *= s;
        te[3] *= s; te[4] *= s; te[5] *= s;
        te[6] *= s; te[7] *= s; te[8] *= s;
        return this;
    },
    mul: function(m1,m2){
        var te = this.elements, tm1 = m1.elements, tm2 = m2.elements,
        a0 = tm1[0], a3 = tm1[3], a6 = tm1[6],
        a1 = tm1[1], a4 = tm1[4], a7 = tm1[7],
        a2 = tm1[2], a5 = tm1[5], a8 = tm1[8],
        b0 = tm2[0], b3 = tm2[3], b6 = tm2[6],
        b1 = tm2[1], b4 = tm2[4], b7 = tm2[7],
        b2 = tm2[2], b5 = tm2[5], b8 = tm2[8];
        te[0] = a0*b0 + a1*b3 + a2*b6;
        te[1] = a0*b1 + a1*b4 + a2*b7;
        te[2] = a0*b2 + a1*b5 + a2*b8;
        te[3] = a3*b0 + a4*b3 + a5*b6;
        te[4] = a3*b1 + a4*b4 + a5*b7;
        te[5] = a3*b2 + a4*b5 + a5*b8;
        te[6] = a6*b0 + a7*b3 + a8*b6;
        te[7] = a6*b1 + a7*b4 + a8*b7;
        te[8] = a6*b2 + a7*b5 + a8*b8;
        return this;
    },
    mulScale: function(m,sx,sy,sz,Prepend){
        var prepend = Prepend || false;
        var te = this.elements, tm = m.elements;
        if(prepend){
            te[0] = sx*tm[0]; te[1] = sx*tm[1]; te[2] = sx*tm[2];
            te[3] = sy*tm[3]; te[4] = sy*tm[4]; te[5] = sy*tm[5];
            te[6] = sz*tm[6]; te[7] = sz*tm[7]; te[8] = sz*tm[8];
        }else{
            te[0] = tm[0]*sx; te[1] = tm[1]*sy; te[2] = tm[2]*sz;
            te[3] = tm[3]*sx; te[4] = tm[4]*sy; te[5] = tm[5]*sz;
            te[6] = tm[6]*sx; te[7] = tm[7]*sy; te[8] = tm[8]*sz;
        }
        return this;
    },
    mulRotate: function(m,rad,ax,ay,az,Prepend){
        var prepend = Prepend || false;
        var s=Math.sin(rad);
        var c=Math.cos(rad);
        var c1=1-c;
        var r00=ax*ax*c1+c;
        var r01=ax*ay*c1-az*s;
        var r02=ax*az*c1+ay*s;
        var r10=ay*ax*c1+az*s;
        var r11=ay*ay*c1+c;
        var r12=ay*az*c1-ax*s;
        var r20=az*ax*c1-ay*s;
        var r21=az*ay*c1+ax*s;
        var r22=az*az*c1+c;

        var tm = m.elements;

        var a0 = tm[0], a3 = tm[3], a6 = tm[6];
        var a1 = tm[1], a4 = tm[4], a7 = tm[7];
        var a2 = tm[2], a5 = tm[5], a8 = tm[8];

        var te = this.elements;
        
        if(prepend){
            te[0]=r00*a0+r01*a3+r02*a6;
            te[1]=r00*a1+r01*a4+r02*a7;
            te[2]=r00*a2+r01*a5+r02*a8;
            te[3]=r10*a0+r11*a3+r12*a6;
            te[4]=r10*a1+r11*a4+r12*a7;
            te[5]=r10*a2+r11*a5+r12*a8;
            te[6]=r20*a0+r21*a3+r22*a6;
            te[7]=r20*a1+r21*a4+r22*a7;
            te[8]=r20*a2+r21*a5+r22*a8;
        }else{
            te[0]=a0*r00+a1*r10+a2*r20;
            te[1]=a0*r01+a1*r11+a2*r21;
            te[2]=a0*r02+a1*r12+a2*r22;
            te[3]=a3*r00+a4*r10+a5*r20;
            te[4]=a3*r01+a4*r11+a5*r21;
            te[5]=a3*r02+a4*r12+a5*r22;
            te[6]=a6*r00+a7*r10+a8*r20;
            te[7]=a6*r01+a7*r11+a8*r21;
            te[8]=a6*r02+a7*r12+a8*r22;
        }
        return this;
    },
    transpose: function(m){
        var te = this.elements, tm = m.elements;
        te[0] = tm[0]; te[1] = tm[3]; te[2] = tm[6];
        te[3] = tm[1]; te[4] = tm[4]; te[5] = tm[7];
        te[6] = tm[2]; te[7] = tm[5]; te[8] = tm[8];
        return this;
    },
    setQuat: function(q){
        var te = this.elements,
        x2=2*q.x,  y2=2*q.y,  z2=2*q.z,
        xx=q.x*x2, yy=q.y*y2, zz=q.z*z2,
        xy=q.x*y2, yz=q.y*z2, xz=q.x*z2,
        sx=q.s*x2, sy=q.s*y2, sz=q.s*z2;
        
        te[0]=1-yy-zz;
        te[1]=xy-sz;
        te[2]=xz+sy;
        te[3]=xy+sz;
        te[4]=1-xx-zz;
        te[5]=yz-sx;
        te[6]=xz-sy;
        te[7]=yz+sx;
        te[8]=1-xx-yy;
        return this;
    },
    invert: function(m){
        var te = this.elements, tm = m.elements,
        a0 = tm[0], a3 = tm[3], a6 = tm[6],
        a1 = tm[1], a4 = tm[4], a7 = tm[7],
        a2 = tm[2], a5 = tm[5], a8 = tm[8],
        b01 = a4*a8-a7*a5,
        b11 = a7*a2-a1*a8,
        b21 = a1*a5-a4*a2,
        dt= a0 * (b01) + a3 * (b11) + a6 * (b21);

        if(dt!=0){dt=1.0/dt;}
        te[0] = dt*b01;//(a4*a8 - a5*a7);
        te[1] = dt*b11;//(a2*a7 - a1*a8);
        te[2] = dt*b21;//(a1*a5 - a2*a4);
        te[3] = dt*(a5*a6 - a3*a8);
        te[4] = dt*(a0*a8 - a2*a6);
        te[5] = dt*(a2*a3 - a0*a5);
        te[6] = dt*(a3*a7 - a4*a6);
        te[7] = dt*(a1*a6 - a0*a7);
        te[8] = dt*(a0*a4 - a1*a3);
        return this;
    },
    copy: function(m){
        var te = this.elements, tem = m.elements;
        te[0] = tem[0]; te[1] = tem[1]; te[2] = tem[2];
        te[3] = tem[3]; te[4] = tem[4]; te[5] = tem[5];
        te[6] = tem[6]; te[7] = tem[7]; te[8] = tem[8];
        return this;
    },
    toEuler: function(){ // not work !!
        function clamp( x ) {
            return Math.min( Math.max( x, -1 ), 1 );
        }
        var te = this.elements;
        var m11 = te[0], m12 = te[3], m13 = te[6];
        var m21 = te[1], m22 = te[4], m23 = te[7];
        var m31 = te[2], m32 = te[5], m33 = te[8];

        var p = new OIMO.Vec3();
        var d = new OIMO.Quat();
        var s;

        p.y = Math.asin( clamp( m13 ) );

        if ( Math.abs( m13 ) < 0.99999 ) {
            p.x = Math.atan2( - m23, m33 );
            p.z = Math.atan2( - m12, m11 );
        } else {
            p.x = Math.atan2( m32, m22 );
            p.z = 0;
        }
        
        return p;
    },
    clone: function(){
        var te = this.elements;

        return new OIMO.Mat33(
            te[0], te[1], te[2],
            te[3], te[4], te[5],
            te[6], te[7], te[8]
        );
    },
    toString: function(){
        var te = this.elements;
        var text=
        "Mat33|"+te[0].toFixed(4)+", "+te[1].toFixed(4)+", "+te[2].toFixed(4)+"|\n"+
        "     |"+te[3].toFixed(4)+", "+te[4].toFixed(4)+", "+te[5].toFixed(4)+"|\n"+
        "     |"+te[6].toFixed(4)+", "+te[7].toFixed(4)+", "+te[8].toFixed(4)+"|" ;
        return text;
    }
};
OIMO.Quat = function( s, x, y, z){
    this.s=( s !== undefined ) ? s : 1;
    this.x=x || 0;
    this.y=y || 0;
    this.z=z || 0;
};

OIMO.Quat.prototype = {

    constructor: OIMO.Quat,

    init: function(s,x,y,z){
        this.s=( s !== undefined ) ? s : 1;
        this.x=x || 0;
        this.y=y || 0;
        this.z=z || 0;
        return this;
    },
    add: function(q1,q2){
        this.s=q1.s+q2.s;
        this.x=q1.x+q2.x;
        this.y=q1.y+q2.y;
        this.z=q1.z+q2.z;
        return this;
    },
    addTime: function(v,t){
        var x = v.x;
        var y = v.y;
        var z = v.z;
        var qs=this.s;
        var qx=this.x;
        var qy=this.y;
        var qz=this.z;
        t*=0.5;
        var ns=(-x*qx - y*qy - z*qz)*t;
        var nx=( x*qs + y*qz - z*qy)*t;
        var ny=(-x*qz + y*qs + z*qx)*t;
        var nz=( x*qy - y*qx + z*qs)*t;
        qs += ns;
        qx += nx;
        qy += ny;
        qz += nz;
        var s=1/Math.sqrt(qs*qs+qx*qx+qy*qy+qz*qz);
        this.s=qs*s;
        this.x=qx*s;
        this.y=qy*s;
        this.z=qz*s;
        return this;
    },
    sub: function(q1,q2){
        this.s=q1.s-q2.s;
        this.x=q1.x-q2.x;
        this.y=q1.y-q2.y;
        this.z=q1.z-q2.z;
        return this;
    },
    scale: function(q,s){
        this.s=q.s*s;
        this.x=q.x*s;
        this.y=q.y*s;
        this.z=q.z*s;
        return this;
    },
    mul: function(q1,q2){
        var ax = q1.x, ay = q1.y, az = q1.z, as = q1.s,
        bx = q2.x, by = q2.y, bz = q2.z, bs = q2.s;
        this.x = ax * bs + as * bx + ay * bz - az * by;
        this.y = ay * bs + as * by + az * bx - ax * bz;
        this.z = az * bs + as * bz + ax * by - ay * bx;
        this.s = as * bs - ax * bx - ay * by - az * bz;
        return this;
    },
    arc: function(v1,v2){
        var x1=v1.x;
        var y1=v1.y;
        var z1=v1.z;
        var x2=v2.x;
        var y2=v2.y;
        var z2=v2.z;
        var d=x1*x2+y1*y2+z1*z2;
        if(d==-1){
        x2=y1*x1-z1*z1;
        y2=-z1*y1-x1*x1;
        z2=x1*z1+y1*y1;
        d=1/Math.sqrt(x2*x2+y2*y2+z2*z2);
        this.s=0;
        this.x=x2*d;
        this.y=y2*d;
        this.z=z2*d;
        return this;
        }
        var cx=y1*z2-z1*y2;
        var cy=z1*x2-x1*z2;
        var cz=x1*y2-y1*x2;
        this.s=Math.sqrt((1+d)*0.5);
        d=0.5/this.s;
        this.x=cx*d;
        this.y=cy*d;
        this.z=cz*d;
        return this;
    },
    normalize: function(q){
        var len=Math.sqrt(q.s*q.s+q.x*q.x+q.y*q.y+q.z*q.z);
        if(len>0){len=1/len;}
        this.s=q.s*len;
        this.x=q.x*len;
        this.y=q.y*len;
        this.z=q.z*len;
        return this;
    },
    invert: function(q){
        this.s=q.s;
        this.x=-q.x;
        this.y=-q.y;
        this.z=-q.z;
        return this;
    },
    length: function(){
        return Math.sqrt(this.s*this.s+this.x*this.x+this.y*this.y+this.z*this.z);
    },
    
    copy: function(q){
        this.s=q.s;
        this.x=q.x;
        this.y=q.y;
        this.z=q.z;
        return this;
    },
    testDiff: function(q){
        if(this.s!==q.s || this.x!==q.x || this.y!==q.y || this.z!==q.z) return true;
        else return false;
    },
    clone: function(q){
        return new OIMO.Quat(this.s,this.x,this.y,this.z);
    },
    toString: function(){
        return"Quat["+this.s.toFixed(4)+", ("+this.x.toFixed(4)+", "+this.y.toFixed(4)+", "+this.z.toFixed(4)+")]";
    }
}


// for three easy export
OIMO.Quaternion = function ( x, y, z, w ) {
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this.w = ( w !== undefined ) ? w : 1;
};

OIMO.Quaternion.prototype = {

    constructor: OIMO.Quaternion,
    setFromRotationMatrix: function ( m ) {

        // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm

        // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

        var te = m.elements,

            m11 = te[ 0 ], m12 = te[ 1 ], m13 = te[ 2 ],
            m21 = te[ 3 ], m22 = te[ 4 ], m23 = te[ 5 ],
            m31 = te[ 6 ], m32 = te[ 7 ], m33 = te[ 8 ],

            trace = m11 + m22 + m33,
            s;

        if ( trace > 0 ) {

            s = 0.5 / Math.sqrt( trace + 1.0 );

            this.w = 0.25 / s;
            this.x = ( m32 - m23 ) * s;
            this.y = ( m13 - m31 ) * s;
            this.z = ( m21 - m12 ) * s;

        } else if ( m11 > m22 && m11 > m33 ) {

            s = 2.0 * Math.sqrt( 1.0 + m11 - m22 - m33 );

            this.w = ( m32 - m23 ) / s;
            this.x = 0.25 * s;
            this.y = ( m12 + m21 ) / s;
            this.z = ( m13 + m31 ) / s;

        } else if ( m22 > m33 ) {

            s = 2.0 * Math.sqrt( 1.0 + m22 - m11 - m33 );

            this.w = ( m13 - m31 ) / s;
            this.x = ( m12 + m21 ) / s;
            this.y = 0.25 * s;
            this.z = ( m23 + m32 ) / s;

        } else {

            s = 2.0 * Math.sqrt( 1.0 + m33 - m11 - m22 );

            this.w = ( m21 - m12 ) / s;
            this.x = ( m13 + m31 ) / s;
            this.y = ( m23 + m32 ) / s;
            this.z = 0.25 * s;

        }

        //this.onChangeCallback();

        return this;

    }
}
OIMO.Vec3 = function(x,y,z){
    this.x=x || 0;
    this.y=y || 0;
    this.z=z || 0;
};

OIMO.Vec3.prototype = {

    constructor: OIMO.Vec3,

    init: function(x,y,z){
        this.x=x || 0;
        this.y=y || 0;
        this.z=z || 0;
        return this;
    },
    set: function(x,y,z){
        this.x=x;
        this.y=y;
        this.z=z;
        return this;
    },
    add: function(v1,v2){
        this.x=v1.x+v2.x;
        this.y=v1.y+v2.y;
        this.z=v1.z+v2.z;
        return this;
    },
    addEqual: function(v){
        this.x+=v.x;
        this.y+=v.y;
        this.z+=v.z;
        return this;
    },
    addTime: function(v, t){
        this.x+=v.x*t;
        this.y+=v.y*t;
        this.z+=v.z*t;
        return this;
    },
    sub: function(v1,v2){
        this.x=v1.x-v2.x;
        this.y=v1.y-v2.y;
        this.z=v1.z-v2.z;
        return this;
    },
    subEqual: function(v){
        this.x-=v.x;
        this.y-=v.y;
        this.z-=v.z;
        return this;
    },
    addScale: function(v,s){
        this.x+=v.x*s;
        this.y+=v.y*s;
        this.z+=v.z*s;
        return this;
    },
    scale: function(v,s){
        this.x=v.x*s;
        this.y=v.y*s;
        this.z=v.z*s;
        return this;
    },
    scaleEqual: function(s){
        this.x*=s;
        this.y*=s;
        this.z*=s;
        return this;
    },
    dot: function(v){
        return this.x*v.x+this.y*v.y+this.z*v.z;
    },
    cross: function(v1,v2){
        var ax = v1.x, ay = v1.y, az = v1.z, 
        bx = v2.x, by = v2.y, bz = v2.z;
        this.x = ay * bz - az * by;
        this.y = az * bx - ax * bz;
        this.z = ax * by - ay * bx;
        return this;
    },
    mul: function(o, v, m){
        var te = m.elements;
        this.x=o.x+v.x*te[0]+v.y*te[1]+v.z*te[2];
        this.y=o.y+v.x*te[3]+v.y*te[4]+v.z*te[5];
        this.z=o.z+v.x*te[6]+v.y*te[7]+v.z*te[8];
        return this;
    },
    mulMat: function(m,v){
        var te = m.elements;
        var x=te[0]*v.x+te[1]*v.y+te[2]*v.z;
        var y=te[3]*v.x+te[4]*v.y+te[5]*v.z;
        var z=te[6]*v.x+te[7]*v.y+te[8]*v.z;
        this.x=x;
        this.y=y;
        this.z=z;
        return this;
    },
    normalize: function(v){
        var x = v.x, y = v.y, z = v.z;
        var l = x*x + y*y + z*z;
        if (l > 0) {
            l = 1 / Math.sqrt(l);
            this.x = x*l;
            this.y = y*l;
            this.z = z*l;
        }
        return this;
    },
    invert: function(v){
        this.x=-v.x;
        this.y=-v.y;
        this.z=-v.z;
        return this;
    },
    length: function(){
        var x = this.x, y = this.y, z = this.z;
        return Math.sqrt(x*x + y*y + z*z);
    },
    len: function(){
        var x = this.x, y = this.y, z = this.z;
        return x*x + y*y + z*z;
    },
    copy: function(v){
        this.x=v.x;
        this.y=v.y;
        this.z=v.z;
        return this;
    },
    applyQuaternion: function ( q ) {

        var x = this.x;
        var y = this.y;
        var z = this.z;

        var qx = q.x;
        var qy = q.y;
        var qz = q.z;
        var qs = q.s;

        // calculate quat * vector

        var ix =  qs * x + qy * z - qz * y;
        var iy =  qs * y + qz * x - qx * z;
        var iz =  qs * z + qx * y - qy * x;
        var iw = - qx * x - qy * y - qz * z;

        // calculate result * inverse quat

        this.x = ix * qs + iw * - qx + iy * - qz - iz * - qy;
        this.y = iy * qs + iw * - qy + iz * - qx - ix * - qz;
        this.z = iz * qs + iw * - qz + ix * - qy - iy * - qx;

        return this;

    },
    testZero: function(){
        if(this.x!==0 || this.y!==0 || this.z!==0) return true;
        else return false;
    },
    testDiff: function(v){
        if(this.x!==v.x || this.y!==v.y || this.z!==v.z) return true;
        else return false;
    },
    clone: function(){
        return new OIMO.Vec3(this.x,this.y,this.z);
    },
    toString: function(){
        return"Vec3["+this.x.toFixed(4)+", "+this.y.toFixed(4)+", "+this.z.toFixed(4)+"]";
    }
}
OIMO.Euler = function ( x, y, z, order ) {

	this._x = x || 0;
	this._y = y || 0;
	this._z = z || 0;
	this._order = order || OIMO.Euler.DefaultOrder;

};

OIMO.Euler.RotationOrders = [ 'XYZ', 'YZX', 'ZXY', 'XZY', 'YXZ', 'ZYX' ];

OIMO.Euler.DefaultOrder = 'XYZ';

OIMO.clamp =  function ( x, a, b ) {
	return ( x < a ) ? a : ( ( x > b ) ? b : x );
}

OIMO.Euler.prototype = {

	constructor: OIMO.Euler,

	_x: 0, _y: 0, _z: 0, _order: OIMO.Euler.DefaultOrder,

	get x () {

		return this._x;

	},

	set x ( value ) {

		this._x = value;
		this.onChangeCallback();

	},

	get y () {

		return this._y;

	},

	set y ( value ) {

		this._y = value;
		this.onChangeCallback();

	},

	get z () {

		return this._z;

	},

	set z ( value ) {

		this._z = value;
		this.onChangeCallback();

	},

	get order () {

		return this._order;

	},

	set order ( value ) {

		this._order = value;
		this.onChangeCallback();

	},

	set: function ( x, y, z, order ) {

		this._x = x;
		this._y = y;
		this._z = z;
		this._order = order || this._order;

		this.onChangeCallback();

		return this;

	},

	copy: function ( euler ) {

		this._x = euler._x;
		this._y = euler._y;
		this._z = euler._z;
		this._order = euler._order;

		this.onChangeCallback();

		return this;

	},

	setFromRotationMatrix: function ( m, order ) {

		var clamp = OIMO.clamp;

		// assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)

		var te = m.elements;
		/*var m11 = te[ 0 ], m12 = te[ 4 ], m13 = te[ 8 ];
		var m21 = te[ 1 ], m22 = te[ 5 ], m23 = te[ 9 ];
		var m31 = te[ 2 ], m32 = te[ 6 ], m33 = te[ 10 ];*/

		var m11 = te[ 0 ], m12 = te[ 1 ], m13 = te[ 2 ],
            m21 = te[ 3 ], m22 = te[ 4 ], m23 = te[ 5 ],
            m31 = te[ 6 ], m32 = te[ 7 ], m33 = te[ 8 ];

		order = order || this._order;

		if ( order === 'XYZ' ) {

			this._y = Math.asin( clamp( m13, - 1, 1 ) );

			if ( Math.abs( m13 ) < 0.99999 ) {

				this._x = Math.atan2( - m23, m33 );
				this._z = Math.atan2( - m12, m11 );

			} else {

				this._x = Math.atan2( m32, m22 );
				this._z = 0;

			}

		} else if ( order === 'YXZ' ) {

			this._x = Math.asin( - clamp( m23, - 1, 1 ) );

			if ( Math.abs( m23 ) < 0.99999 ) {

				this._y = Math.atan2( m13, m33 );
				this._z = Math.atan2( m21, m22 );

			} else {

				this._y = Math.atan2( - m31, m11 );
				this._z = 0;

			}

		} else if ( order === 'ZXY' ) {

			this._x = Math.asin( clamp( m32, - 1, 1 ) );

			if ( Math.abs( m32 ) < 0.99999 ) {

				this._y = Math.atan2( - m31, m33 );
				this._z = Math.atan2( - m12, m22 );

			} else {

				this._y = 0;
				this._z = Math.atan2( m21, m11 );

			}

		} else if ( order === 'ZYX' ) {

			this._y = Math.asin( - clamp( m31, - 1, 1 ) );

			if ( Math.abs( m31 ) < 0.99999 ) {

				this._x = Math.atan2( m32, m33 );
				this._z = Math.atan2( m21, m11 );

			} else {

				this._x = 0;
				this._z = Math.atan2( - m12, m22 );

			}

		} else if ( order === 'YZX' ) {

			this._z = Math.asin( clamp( m21, - 1, 1 ) );

			if ( Math.abs( m21 ) < 0.99999 ) {

				this._x = Math.atan2( - m23, m22 );
				this._y = Math.atan2( - m31, m11 );

			} else {

				this._x = 0;
				this._y = Math.atan2( m13, m33 );

			}

		} else if ( order === 'XZY' ) {

			this._z = Math.asin( - clamp( m12, - 1, 1 ) );

			if ( Math.abs( m12 ) < 0.99999 ) {

				this._x = Math.atan2( m32, m22 );
				this._y = Math.atan2( m13, m11 );

			} else {

				this._x = Math.atan2( - m23, m33 );
				this._y = 0;

			}

		} else {

			console.warn( 'THREE.Euler: .setFromRotationMatrix() given unsupported order: ' + order )

		}

		this._order = order;

		this.onChangeCallback();

		return this;

	},

	setFromQuaternion: function ( q, order, update ) {

		var clamp = OIMO.clamp;

		// q is assumed to be normalized

		// http://www.mathworks.com/matlabcentral/fileexchange/20696-function-to-convert-between-dcm-euler-angles-quaternions-and-euler-vectors/content/SpinCalc.m

		var sqx = q.x * q.x;
		var sqy = q.y * q.y;
		var sqz = q.z * q.z;
		var sqw = q.s * q.s;

		order = order || this._order;

		if ( order === 'XYZ' ) {

			this._x = Math.atan2( 2 * ( q.x * q.s - q.y * q.z ), ( sqw - sqx - sqy + sqz ) );
			this._y = Math.asin(  clamp( 2 * ( q.x * q.z + q.y * q.s ), - 1, 1 ) );
			this._z = Math.atan2( 2 * ( q.z * q.s - q.x * q.y ), ( sqw + sqx - sqy - sqz ) );

		} else if ( order ===  'YXZ' ) {

			this._x = Math.asin(  clamp( 2 * ( q.x * q.s - q.y * q.z ), - 1, 1 ) );
			this._y = Math.atan2( 2 * ( q.x * q.z + q.y * q.s ), ( sqw - sqx - sqy + sqz ) );
			this._z = Math.atan2( 2 * ( q.x * q.y + q.z * q.s ), ( sqw - sqx + sqy - sqz ) );

		} else if ( order === 'ZXY' ) {

			this._x = Math.asin(  clamp( 2 * ( q.x * q.s + q.y * q.z ), - 1, 1 ) );
			this._y = Math.atan2( 2 * ( q.y * q.s - q.z * q.x ), ( sqw - sqx - sqy + sqz ) );
			this._z = Math.atan2( 2 * ( q.z * q.s - q.x * q.y ), ( sqw - sqx + sqy - sqz ) );

		} else if ( order === 'ZYX' ) {

			this._x = Math.atan2( 2 * ( q.x * q.s + q.z * q.y ), ( sqw - sqx - sqy + sqz ) );
			this._y = Math.asin(  clamp( 2 * ( q.y * q.s - q.x * q.z ), - 1, 1 ) );
			this._z = Math.atan2( 2 * ( q.x * q.y + q.z * q.s ), ( sqw + sqx - sqy - sqz ) );

		} else if ( order === 'YZX' ) {

			this._x = Math.atan2( 2 * ( q.x * q.s - q.z * q.y ), ( sqw - sqx + sqy - sqz ) );
			this._y = Math.atan2( 2 * ( q.y * q.s - q.x * q.z ), ( sqw + sqx - sqy - sqz ) );
			this._z = Math.asin(  clamp( 2 * ( q.x * q.y + q.z * q.s ), - 1, 1 ) );

		} else if ( order === 'XZY' ) {

			this._x = Math.atan2( 2 * ( q.x * q.s + q.y * q.z ), ( sqw - sqx + sqy - sqz ) );
			this._y = Math.atan2( 2 * ( q.x * q.z + q.y * q.s ), ( sqw + sqx - sqy - sqz ) );
			this._z = Math.asin(  clamp( 2 * ( q.z * q.s - q.x * q.y ), - 1, 1 ) );

		} else {

			console.warn( 'OIMO.Euler: .setFromQuaternion() given unsupported order: ' + order )

		}

		this._order = order;

		if ( update !== false ) this.onChangeCallback();

		return this;

	},

	reorder: function () {

		// WARNING: this discards revolution information -bhouston

		var q = new OIMO.Quat();

		return function ( newOrder ) {

			q.setFromEuler( this );
			this.setFromQuaternion( q, newOrder );

		};


	}(),

	equals: function ( euler ) {

		return ( euler._x === this._x ) && ( euler._y === this._y ) && ( euler._z === this._z ) && ( euler._order === this._order );

	},

	fromArray: function ( array ) {

		this._x = array[ 0 ];
		this._y = array[ 1 ];
		this._z = array[ 2 ];
		if ( array[ 3 ] !== undefined ) this._order = array[ 3 ];

		this.onChangeCallback();

		return this;

	},

	toArray: function () {

		return [ this._x, this._y, this._z, this._order ];

	},

	onChange: function ( callback ) {

		this.onChangeCallback = callback;

		return this;

	},

	onChangeCallback: function () {},

	clone: function () {

		return new OIMO.Euler( this._x, this._y, this._z, this._order );

	}

};

OIMO.EulerToAxis = function( ox, oy, oz ){// angles in radians
    var c1 = Math.cos(oy*0.5);//heading
    var s1 = Math.sin(oy*0.5);
    var c2 = Math.cos(oz*0.5);//altitude
    var s2 = Math.sin(oz*0.5);
    var c3 = Math.cos(ox*0.5);//bank
    var s3 = Math.sin(ox*0.5);
    var c1c2 = c1*c2;
    var s1s2 = s1*s2;
    var w =c1c2*c3 - s1s2*s3;
    var x =c1c2*s3 + s1s2*c3;
    var y =s1*c2*c3 + c1*s2*s3;
    var z =c1*s2*c3 - s1*c2*s3;
    var angle = 2 * Math.acos(w);
    var norm = x*x+y*y+z*z;
    if (norm < 0.001) {
        x=1;
        y=z=0;
    } else {
        norm = Math.sqrt(norm);
        x /= norm;
        y /= norm;
        z /= norm;
    }
    return [angle, x, y, z];
}

OIMO.EulerToMatrix = function( ox, oy, oz ) {// angles in radians
    var ch = Math.cos(oy);//heading
    var sh = Math.sin(oy);
    var ca = Math.cos(oz);//altitude
    var sa = Math.sin(oz);
    var cb = Math.cos(ox);//bank
    var sb = Math.sin(ox);
    var mtx = new OIMO.Mat33();

    var te = mtx.elements;
    te[0] = ch * ca;
    te[1] = sh*sb - ch*sa*cb;
    te[2] = ch*sa*sb + sh*cb;
    te[3] = sa;
    te[4] = ca*cb;
    te[5] = -ca*sb;
    te[6] = -sh*ca;
    te[7] = sh*sa*cb + ch*sb;
    te[8] = -sh*sa*sb + ch*cb;
    return mtx;
}

OIMO.MatrixToEuler = function(mtx){// angles in radians
    var te = mtx.elements;
    var x, y, z;
    if (te[3] > 0.998) { // singularity at north pole
        y = Math.atan2(te[2],te[8]);
        z = Math.PI/2;
        x = 0;
    } else if (te[3] < -0.998) { // singularity at south pole
        y = Math.atan2(te[2],te[8]);
        z = -Math.PI/2;
        x = 0;
    } else {
        y = Math.atan2(-te[6],te[0]);
        x = Math.atan2(-te[5],te[4]);
        z = Math.asin(te[3]);
    }
    return [x, y, z];
}

OIMO.unwrapDegrees = function (r) {
    r = r % 360;
    if (r > 180) r -= 360;
    if (r < -180) r += 360;
    return r;
}

OIMO.unwrapRadian = function(r){
    r = r % OIMO.TwoPI;
    if (r > Math.PI) r -= OIMO.TwoPI;
    if (r < -Math.PI) r += OIMO.TwoPI;
    return r;
}
OIMO.Distance3d = function(p1, p2){
    var xd = p2[0]-p1[0];
    var yd = p2[1]-p1[1];
    var zd = p2[2]-p1[2];
    return Math.sqrt(xd*xd + yd*yd + zd*zd);
}
/**
* The base class of all type of the constraints.
* @author saharan
*/
OIMO.Constraint = function(){
    // The parent world of the constraint.
    this.parent=null;
    // The first body of the constraint.
    this.body1=null;
    // The second body of the constraint.
    this.body2=null;
    // Internal
    this.addedToIsland=false;
}

OIMO.Constraint.prototype = {
    constructor: OIMO.Constraint,
    /**
    * Prepare for solving the constraint.
    * @param   timeStep
    * @param   invTimeStep
    */
    preSolve:function(timeStep,invTimeStep){
        throw new Error("Inheritance error.");
    },
    /**
    * Solve the constraint.
    * This is usually called iteratively.
    */
    solve:function(){
        throw new Error("Inheritance error.");
    },
    /**
    * Do the post-processing.
    */
    postSolve:function(){
        throw new Error("Inheritance error.");
    }
}
/**
* Joints are used to constrain the motion between two rigid bodies.
* @author saharan
*/
OIMO.Joint = function(config){
    OIMO.Constraint.call( this );

    this.name = "";
    // Distance joint
    this.JOINT_DISTANCE=0x1;
    // Ball-and-socket joint
    this.JOINT_BALL_AND_SOCKET=0x2;
    //  Hinge joint
    this.JOINT_HINGE=0x3;
    //  Wheel joint
    this.JOINT_WHEEL=0x4;
    //  Slider joint
    this.JOINT_SLIDER=0x5;
    //  Prismatic joint
    this.JOINT_PRISMATIC=0x6;

    // The type of the joint.
    this.type=0;
    //  The previous joint in the world.
    this.prev=null;
    // The next joint in the world.
    this.next=null;

    this.body1=config.body1;
    this.body2=config.body2;

    // The anchor point on the first rigid body in local coordinate system.
    this.localAnchorPoint1=new OIMO.Vec3().copy(config.localAnchorPoint1);
    // The anchor point on the second rigid body in local coordinate system.
    this.localAnchorPoint2=new OIMO.Vec3().copy(config.localAnchorPoint2);
    // The anchor point on the first rigid body in world coordinate system relative to the body's origin.
    this.relativeAnchorPoint1=new OIMO.Vec3();
    // The anchor point on the second rigid body in world coordinate system relative to the body's origin.
    this.relativeAnchorPoint2=new OIMO.Vec3();
    //  The anchor point on the first rigid body in world coordinate system.
    this.anchorPoint1=new OIMO.Vec3();
    // The anchor point on the second rigid body in world coordinate system.
    this.anchorPoint2=new OIMO.Vec3();
    //  Whether allow collision between connected rigid bodies or not.
    this.allowCollision=config.allowCollision;

    this.b1Link=new OIMO.JointLink(this);
    this.b2Link=new OIMO.JointLink(this);

    this.matrix = new OIMO.Mat44();
}
OIMO.Joint.prototype = Object.create( OIMO.Constraint.prototype );
/**
* Update all the anchor points.
*/
OIMO.Joint.prototype.updateAnchorPoints = function () {
    var p1=this.body1.position;
    var p2=this.body2.position;

    var tr1 = this.body1.rotation.elements;
    var tr2 = this.body2.rotation.elements;

    var l1x=this.localAnchorPoint1.x;
    var l1y=this.localAnchorPoint1.y;
    var l1z=this.localAnchorPoint1.z;
    var l2x=this.localAnchorPoint2.x;
    var l2y=this.localAnchorPoint2.y;
    var l2z=this.localAnchorPoint2.z;

    var r1x=l1x*tr1[0]+l1y*tr1[1]+l1z*tr1[2];
    var r1y=l1x*tr1[3]+l1y*tr1[4]+l1z*tr1[5];
    var r1z=l1x*tr1[6]+l1y*tr1[7]+l1z*tr1[8];
    var r2x=l2x*tr2[0]+l2y*tr2[1]+l2z*tr2[2];
    var r2y=l2x*tr2[3]+l2y*tr2[4]+l2z*tr2[5];
    var r2z=l2x*tr2[6]+l2y*tr2[7]+l2z*tr2[8];
    this.relativeAnchorPoint1.x=r1x;
    this.relativeAnchorPoint1.y=r1y;
    this.relativeAnchorPoint1.z=r1z;
    this.relativeAnchorPoint2.x=r2x;
    this.relativeAnchorPoint2.y=r2y;
    this.relativeAnchorPoint2.z=r2z;
    var p1x=r1x+p1.x;
    var p1y=r1y+p1.y;
    var p1z=r1z+p1.z;
    var p2x=r2x+p2.x;
    var p2y=r2y+p2.y;
    var p2z=r2z+p2.z;
    this.anchorPoint1.x=p1x;
    this.anchorPoint1.y=p1y;
    this.anchorPoint1.z=p1z;
    this.anchorPoint2.x=p2x;
    this.anchorPoint2.y=p2y;
    this.anchorPoint2.z=p2z;
}
/**
* Attach the joint from the bodies.
*/
OIMO.Joint.prototype.attach = function () {
    this.b1Link.body=this.body2;
    this.b2Link.body=this.body1;
    if(this.body1.jointLink!=null)(this.b1Link.next=this.body1.jointLink).prev=this.b1Link;
    else this.b1Link.next=null;
    this.body1.jointLink=this.b1Link;
    this.body1.numJoints++;
    if(this.body2.jointLink!=null)(this.b2Link.next=this.body2.jointLink).prev=this.b2Link;
    else this.b2Link.next=null;
    this.body2.jointLink=this.b2Link;
    this.body2.numJoints++;
}
OIMO.Joint.prototype.detach = function () {
    var prev=this.b1Link.prev;
    var next=this.b1Link.next;
    if(prev!=null)prev.next=next;
    if(next!=null)next.prev=prev;
    if(this.body1.jointLink==this.b1Link)this.body1.jointLink=next;
    this.b1Link.prev=null;
    this.b1Link.next=null;
    this.b1Link.body=null;
    this.body1.numJoints--;

    prev=this.b2Link.prev;
    next=this.b2Link.next;
    if(prev!=null)prev.next=next;
    if(next!=null)next.prev=prev;
    if(this.body2.jointLink==this.b2Link)this.body2.jointLink=next;
    this.b2Link.prev=null;
    this.b2Link.next=null;
    this.b2Link.body=null;
    this.body2.numJoints--;

    this.b1Link.body=null;
    this.b2Link.body=null;
}
/**
* Awake the bodies.
*/
OIMO.Joint.prototype.awake = function () {
    this.body1.awake();
    this.body2.awake();
}
OIMO.Joint.prototype.preSolve = function (timeStep,invTimeStep) {
}
OIMO.Joint.prototype.solve = function () {
}
OIMO.Joint.prototype.postSolve = function () {
}


/**
* Three js add
*/
OIMO.Joint.prototype.getPosition = function () {
    var p1 = new OIMO.Vec3().scale(this.anchorPoint1, OIMO.WORLD_SCALE);
    var p2 = new OIMO.Vec3().scale(this.anchorPoint2, OIMO.WORLD_SCALE);
    return [p1, p2];
}

OIMO.Joint.prototype.getMatrix = function () {
    var m = this.matrix.elements;
    var p1 = this.anchorPoint1;
    var p2 = this.anchorPoint2;
    m[0] = p1.x * OIMO.WORLD_SCALE;
    m[1] = p1.y * OIMO.WORLD_SCALE;
    m[2] = p1.z * OIMO.WORLD_SCALE;
    m[3] = 0;

    m[4] = p2.x * OIMO.WORLD_SCALE;
    m[5] = p2.y * OIMO.WORLD_SCALE;
    m[6] = p2.z * OIMO.WORLD_SCALE;
    m[7] = 0;

    return m;
}
/**
* A joint configuration holds all configuration data for constructing a joint.
* Joint configurations can be reused safely.
* @author saharan
*/
OIMO.JointConfig = function(){
	// The first rigid body of the joint.
    this.body1 = null;
    // The second rigid body of the joint.
    this.body2 = null;
    // The anchor point on the first rigid body in local coordinate system.
    this.localAnchorPoint1=new OIMO.Vec3();
    //  The anchor point on the second rigid body in local coordinate system.
    this.localAnchorPoint2=new OIMO.Vec3();
    // The axis in the first body's coordinate system.
	// his property is available in some joints.
    this.localAxis1=new OIMO.Vec3();
    // The axis in the second body's coordinate system.
	// This property is available in some joints.
    this.localAxis2=new OIMO.Vec3();
    //  Whether allow collision between connected rigid bodies or not.
    this.allowCollision=false;
}
/**
* A link list of joints.
* @author saharan
*/
OIMO.JointLink = function(joint){
	// The previous joint link.
    this.prev = null;
    // The next joint link.
    this.next = null;
    // The other rigid body connected to the joint.
    this.body = null;
    // The joint of the link.
    this.joint = joint;
}
/**
* An information of limit and motor.
* @author saharan
*/
OIMO.LimitMotor = function(axis,fixed){
    // The axis of the constraint.
    this.axis=axis;
    // The current angle for rotational constraints.
    this.angle=0;
    // The lower limit. Set lower > upper to disable.
    if(fixed)this.lowerLimit=0;
    else this.lowerLimit=1;
    //  The upper limit. Set lower > upper to disable.
    this.upperLimit=0;
    // The target motor speed.
    this.motorSpeed=0;
    // The maximum motor force or torque. Set 0 to disable.
    this.maxMotorForce=0;
    // The frequency of the spring. Set 0 to disable.
    this.frequency=0;
    // The damping ratio of the spring. Set 0 for no damping, 1 for critical damping.
    this.dampingRatio=0;
}

OIMO.LimitMotor.prototype = {
    constructor: OIMO.LimitMotor,
    /**
    * Set limit data into this constraint.
    * @param   lowerLimit
    * @param   upperLimit
    */
    setLimit:function(lowerLimit,upperLimit){
        this.lowerLimit=lowerLimit;
        this.upperLimit=upperLimit;
    },
    /**
    * Set motor data into this constraint.
    * @param   motorSpeed
    * @param   maxMotorForce
    */
    setMotor:function(motorSpeed,maxMotorForce){
        this.motorSpeed=motorSpeed;
        this.maxMotorForce=maxMotorForce;
    },
    /**
    * Set spring data into this constraint.
    * @param   frequency
    * @param   dampingRatio
    */
    setSpring:function(frequency,dampingRatio){
        this.frequency=frequency;
        this.dampingRatio=dampingRatio;
    }
}
/**
* A ball-and-socket joint limits relative translation on two anchor points on rigid bodies.
* @author saharan
*/
OIMO.BallAndSocketJoint = function(config){
    OIMO.Joint.call( this, config);
    this.type=this.JOINT_BALL_AND_SOCKET;
    
    this.lc=new OIMO.LinearConstraint(this);
}
OIMO.BallAndSocketJoint.prototype = Object.create( OIMO.Joint.prototype );
OIMO.BallAndSocketJoint.prototype.preSolve = function (timeStep,invTimeStep) {
    this.updateAnchorPoints();
    this.lc.preSolve(timeStep,invTimeStep);
}
OIMO.BallAndSocketJoint.prototype.solve = function () {
    this.lc.solve();
}
OIMO.BallAndSocketJoint.prototype.postSolve = function () {
}
/**
* A distance joint limits the distance between two anchor points on rigid bodies.
* @author saharan
*/
OIMO.DistanceJoint = function(config,minDistance,maxDistance){
    OIMO.Joint.call( this, config);
    this.type=this.JOINT_DISTANCE;
    
    this.normal=new OIMO.Vec3();
    // The limit and motor information of the joint.
    this.limitMotor=new OIMO.LimitMotor(this.normal,true);
    this.limitMotor.lowerLimit=minDistance;
    this.limitMotor.upperLimit=maxDistance;
    this.t=new OIMO.TranslationalConstraint(this,this.limitMotor);
}
OIMO.DistanceJoint.prototype = Object.create( OIMO.Joint.prototype );
OIMO.DistanceJoint.prototype.preSolve = function (timeStep,invTimeStep) {
    this.updateAnchorPoints();
    var nx=this.anchorPoint2.x-this.anchorPoint1.x;
    var ny=this.anchorPoint2.y-this.anchorPoint1.y;
    var nz=this.anchorPoint2.z-this.anchorPoint1.z;
    var len=Math.sqrt(nx*nx+ny*ny+nz*nz);
    if(len>0)len=1/len;
    this.normal.init(nx*len,ny*len,nz*len);
    this.t.preSolve(timeStep,invTimeStep);
}
OIMO.DistanceJoint.prototype.solve = function () {
    this.t.solve();
}
OIMO.DistanceJoint.prototype.postSolve = function () {
}
/**
* A hinge joint allows only for relative rotation of rigid bodies along the axis.
* @author saharan
*/
OIMO.HingeJoint = function(config,lowerAngleLimit,upperAngleLimit){
    OIMO.Joint.call( this, config);
    this.type=this.JOINT_HINGE;

    // The axis in the first body's coordinate system.
    this.localAxis1=new OIMO.Vec3().normalize(config.localAxis1);
    // The axis in the second body's coordinate system.
    this.localAxis2=new OIMO.Vec3().normalize(config.localAxis2);
    var len;
    this.localAxis1X=this.localAxis1.x;
    this.localAxis1Y=this.localAxis1.y;
    this.localAxis1Z=this.localAxis1.z;

    this.localAngAxis1X=this.localAxis1Y*this.localAxis1X-this.localAxis1Z*this.localAxis1Z;
    this.localAngAxis1Y=-this.localAxis1Z*this.localAxis1Y-this.localAxis1X*this.localAxis1X;
    this.localAngAxis1Z=this.localAxis1X*this.localAxis1Z+this.localAxis1Y*this.localAxis1Y;

    len=1/Math.sqrt(this.localAngAxis1X*this.localAngAxis1X+this.localAngAxis1Y*this.localAngAxis1Y+this.localAngAxis1Z*this.localAngAxis1Z);
    this.localAngAxis1X*=len;
    this.localAngAxis1Y*=len;
    this.localAngAxis1Z*=len;

    this.localAxis2X=this.localAxis2.x;
    this.localAxis2Y=this.localAxis2.y;
    this.localAxis2Z=this.localAxis2.z;

    // make angle axis 2
    var arc=new OIMO.Mat33().setQuat(new OIMO.Quat().arc(this.localAxis1,this.localAxis2));
    var tarc = arc.elements;
    this.localAngAxis2X=this.localAngAxis1X*tarc[0]+this.localAngAxis1Y*tarc[1]+this.localAngAxis1Z*tarc[2];
    this.localAngAxis2Y=this.localAngAxis1X*tarc[3]+this.localAngAxis1Y*tarc[4]+this.localAngAxis1Z*tarc[5];
    this.localAngAxis2Z=this.localAngAxis1X*tarc[6]+this.localAngAxis1Y*tarc[7]+this.localAngAxis1Z*tarc[8];

    this.nor=new OIMO.Vec3();
    this.tan=new OIMO.Vec3();
    this.bin=new OIMO.Vec3();
    // The rotational limit and motor information of the joint.
    this.limitMotor=new OIMO.LimitMotor(this.nor,false);
    this.limitMotor.lowerLimit=lowerAngleLimit;
    this.limitMotor.upperLimit=upperAngleLimit;

    this.lc=new OIMO.LinearConstraint(this);
    this.r3=new OIMO.Rotational3Constraint(this,this.limitMotor,new OIMO.LimitMotor(this.tan,true),new OIMO.LimitMotor(this.bin,true));
}
OIMO.HingeJoint.prototype = Object.create( OIMO.Joint.prototype );
OIMO.HingeJoint.prototype.preSolve = function (timeStep,invTimeStep) {
    var tmpM;
    var tmp1X;
    var tmp1Y;
    var tmp1Z;

    this.updateAnchorPoints();

    tmpM=this.body1.rotation.elements;
    var axis1X=this.localAxis1X*tmpM[0]+this.localAxis1Y*tmpM[1]+this.localAxis1Z*tmpM[2];
    var axis1Y=this.localAxis1X*tmpM[3]+this.localAxis1Y*tmpM[4]+this.localAxis1Z*tmpM[5];
    var axis1Z=this.localAxis1X*tmpM[6]+this.localAxis1Y*tmpM[7]+this.localAxis1Z*tmpM[8];
    var angAxis1X=this.localAngAxis1X*tmpM[0]+this.localAngAxis1Y*tmpM[1]+this.localAngAxis1Z*tmpM[2];
    var angAxis1Y=this.localAngAxis1X*tmpM[3]+this.localAngAxis1Y*tmpM[4]+this.localAngAxis1Z*tmpM[5];
    var angAxis1Z=this.localAngAxis1X*tmpM[6]+this.localAngAxis1Y*tmpM[7]+this.localAngAxis1Z*tmpM[8];
    tmpM=this.body2.rotation.elements;
    var axis2X=this.localAxis2X*tmpM[0]+this.localAxis2Y*tmpM[1]+this.localAxis2Z*tmpM[2];
    var axis2Y=this.localAxis2X*tmpM[3]+this.localAxis2Y*tmpM[4]+this.localAxis2Z*tmpM[5];
    var axis2Z=this.localAxis2X*tmpM[6]+this.localAxis2Y*tmpM[7]+this.localAxis2Z*tmpM[8];
    var angAxis2X=this.localAngAxis2X*tmpM[0]+this.localAngAxis2Y*tmpM[1]+this.localAngAxis2Z*tmpM[2];
    var angAxis2Y=this.localAngAxis2X*tmpM[3]+this.localAngAxis2Y*tmpM[4]+this.localAngAxis2Z*tmpM[5];
    var angAxis2Z=this.localAngAxis2X*tmpM[6]+this.localAngAxis2Y*tmpM[7]+this.localAngAxis2Z*tmpM[8];
    var nx=axis1X*this.body2.inverseMass+axis2X*this.body1.inverseMass;
    var ny=axis1Y*this.body2.inverseMass+axis2Y*this.body1.inverseMass;
    var nz=axis1Z*this.body2.inverseMass+axis2Z*this.body1.inverseMass;
    tmp1X=Math.sqrt(nx*nx+ny*ny+nz*nz);
    if(tmp1X>0)tmp1X=1/tmp1X;
    nx*=tmp1X;
    ny*=tmp1X;
    nz*=tmp1X;
    var tx=ny*nx-nz*nz;
    var ty=-nz*ny-nx*nx;
    var tz=nx*nz+ny*ny;
    tmp1X=1/Math.sqrt(tx*tx+ty*ty+tz*tz);
    tx*=tmp1X;
    ty*=tmp1X;
    tz*=tmp1X;
    var bx=ny*tz-nz*ty;
    var by=nz*tx-nx*tz;
    var bz=nx*ty-ny*tx;

    this.nor.init(nx,ny,nz);
    this.tan.init(tx,ty,tz);
    this.bin.init(bx,by,bz);

    // ----------------------------------------------
    //            calculate hinge angle
    // ----------------------------------------------
            
    if(
        nx*(angAxis1Y*angAxis2Z-angAxis1Z*angAxis2Y)+
        ny*(angAxis1Z*angAxis2X-angAxis1X*angAxis2Z)+
        nz*(angAxis1X*angAxis2Y-angAxis1Y*angAxis2X)<0
    ){
        this.limitMotor.angle=-this.acosClamp(angAxis1X*angAxis2X+angAxis1Y*angAxis2Y+angAxis1Z*angAxis2Z);
    }else{
        this.limitMotor.angle=this.acosClamp(angAxis1X*angAxis2X+angAxis1Y*angAxis2Y+angAxis1Z*angAxis2Z);
    }

    // angular error
    tmp1X=axis1Y*axis2Z-axis1Z*axis2Y;
    tmp1Y=axis1Z*axis2X-axis1X*axis2Z;
    tmp1Z=axis1X*axis2Y-axis1Y*axis2X;

    this.r3.limitMotor2.angle=tx*tmp1X+ty*tmp1Y+tz*tmp1Z;
    this.r3.limitMotor3.angle=bx*tmp1X+by*tmp1Y+bz*tmp1Z;
    
    this.r3.preSolve(timeStep,invTimeStep);
    this.lc.preSolve(timeStep,invTimeStep);
}
OIMO.HingeJoint.prototype.solve = function () {
    this.r3.solve();
    this.lc.solve();
}
OIMO.HingeJoint.prototype.postSolve = function () {
}
OIMO.HingeJoint.prototype.acosClamp = function(cos){
    if(cos>1)return 0;
    else if(cos<-1)return Math.PI;
    else return Math.acos(cos);
}
/**
* A prismatic joint allows only for relative translation of rigid bodies along the axis.
* @author saharan
*/
OIMO.PrismaticJoint = function(config,lowerTranslation,upperTranslation){
    OIMO.Joint.call( this, config);
    this.type=this.JOINT_PRISMATIC;

    // The axis in the first body's coordinate system.
    this.localAxis1=new OIMO.Vec3().normalize(config.localAxis1);
    // The axis in the second body's coordinate system.
    this.localAxis2=new OIMO.Vec3().normalize(config.localAxis2);
    this.localAxis1X=this.localAxis1.x;
    this.localAxis1Y=this.localAxis1.y;
    this.localAxis1Z=this.localAxis1.z;
    this.localAxis2X=this.localAxis2.x;
    this.localAxis2Y=this.localAxis2.y;
    this.localAxis2Z=this.localAxis2.z;
    
    this.nor=new OIMO.Vec3();
    this.tan=new OIMO.Vec3();
    this.bin=new OIMO.Vec3();
    this.ac=new OIMO.AngularConstraint(this,new OIMO.Quat().arc(this.localAxis1,this.localAxis2));
    // The translational limit and motor information of the joint.
    this.limitMotor=new OIMO.LimitMotor(this.nor,true);
    this.limitMotor.lowerLimit=lowerTranslation;
    this.limitMotor.upperLimit=upperTranslation;
    this.t3=new OIMO.Translational3Constraint(this,this.limitMotor,new OIMO.LimitMotor(this.tan,true),new OIMO.LimitMotor(this.bin,true));
}
OIMO.PrismaticJoint.prototype = Object.create( OIMO.Joint.prototype );
OIMO.PrismaticJoint.prototype.preSolve = function (timeStep,invTimeStep) {
    var tmpM;
    var tmp1X;
    var tmp1Y;
    var tmp1Z;
    this.updateAnchorPoints();

    tmpM=this.body1.rotation.elements;
    var axis1X=this.localAxis1X*tmpM[0]+this.localAxis1Y*tmpM[1]+this.localAxis1Z*tmpM[2];
    var axis1Y=this.localAxis1X*tmpM[3]+this.localAxis1Y*tmpM[4]+this.localAxis1Z*tmpM[5];
    var axis1Z=this.localAxis1X*tmpM[6]+this.localAxis1Y*tmpM[7]+this.localAxis1Z*tmpM[8];
    tmpM=this.body2.rotation.elements;
    var axis2X=this.localAxis2X*tmpM[0]+this.localAxis2Y*tmpM[1]+this.localAxis2Z*tmpM[2];
    var axis2Y=this.localAxis2X*tmpM[3]+this.localAxis2Y*tmpM[4]+this.localAxis2Z*tmpM[5];
    var axis2Z=this.localAxis2X*tmpM[6]+this.localAxis2Y*tmpM[7]+this.localAxis2Z*tmpM[8];

    var nx=axis1X*this.body2.inverseMass+axis2X*this.body1.inverseMass;
    var ny=axis1Y*this.body2.inverseMass+axis2Y*this.body1.inverseMass;
    var nz=axis1Z*this.body2.inverseMass+axis2Z*this.body1.inverseMass;
    tmp1X=Math.sqrt(nx*nx+ny*ny+nz*nz);
    if(tmp1X>0)tmp1X=1/tmp1X;
    nx*=tmp1X;
    ny*=tmp1X;
    nz*=tmp1X;
    var tx=ny*nx-nz*nz;
    var ty=-nz*ny-nx*nx;
    var tz=nx*nz+ny*ny;
    tmp1X=1/Math.sqrt(tx*tx+ty*ty+tz*tz);
    tx*=tmp1X;
    ty*=tmp1X;
    tz*=tmp1X;
    var bx=ny*tz-nz*ty;
    var by=nz*tx-nx*tz;
    var bz=nx*ty-ny*tx;

    this.nor.init(nx,ny,nz);
    this.tan.init(tx,ty,tz);
    this.bin.init(bx,by,bz);
    
    this.ac.preSolve(timeStep,invTimeStep);
    this.t3.preSolve(timeStep,invTimeStep);
}
OIMO.PrismaticJoint.prototype.solve = function () {
    this.ac.solve();
    this.t3.solve();
}
OIMO.PrismaticJoint.prototype.postSolve = function () {
}
/**
* A slider joint allows for relative translation and relative rotation between two rigid bodies along the axis.
* @author saharan
*/
OIMO.SliderJoint = function(config,lowerTranslation,upperTranslation){
    OIMO.Joint.call( this, config);
    this.type=this.JOINT_SLIDER;

    // The first axis in local coordinate system.
    this.localAxis1=new OIMO.Vec3().normalize(config.localAxis1);
    // The second axis in local coordinate system.
    this.localAxis2=new OIMO.Vec3().normalize(config.localAxis2);

    var len;
    this.localAxis1X=this.localAxis1.x;
    this.localAxis1Y=this.localAxis1.y;
    this.localAxis1Z=this.localAxis1.z;

    this.localAngAxis1X=this.localAxis1Y*this.localAxis1X-this.localAxis1Z*this.localAxis1Z;
    this.localAngAxis1Y=-this.localAxis1Z*this.localAxis1Y-this.localAxis1X*this.localAxis1X;
    this.localAngAxis1Z=this.localAxis1X*this.localAxis1Z+this.localAxis1Y*this.localAxis1Y;

    len=1/Math.sqrt(this.localAngAxis1X*this.localAngAxis1X+this.localAngAxis1Y*this.localAngAxis1Y+this.localAngAxis1Z*this.localAngAxis1Z);
    this.localAngAxis1X*=len;
    this.localAngAxis1Y*=len;
    this.localAngAxis1Z*=len;

    this.localAxis2X=this.localAxis2.x;
    this.localAxis2Y=this.localAxis2.y;
    this.localAxis2Z=this.localAxis2.z;

    // make angle axis 2
    var arc=new OIMO.Mat33().setQuat(new OIMO.Quat().arc(this.localAxis1,this.localAxis2));
    var tarc = arc.elements;
    this.localAngAxis2X=this.localAngAxis1X*tarc[0]+this.localAngAxis1Y*tarc[1]+this.localAngAxis1Z*tarc[2];
    this.localAngAxis2Y=this.localAngAxis1X*tarc[3]+this.localAngAxis1Y*tarc[4]+this.localAngAxis1Z*tarc[5];
    this.localAngAxis2Z=this.localAngAxis1X*tarc[6]+this.localAngAxis1Y*tarc[7]+this.localAngAxis1Z*tarc[8];
    
    this.nor=new OIMO.Vec3();
    this.tan=new OIMO.Vec3();
    this.bin=new OIMO.Vec3();
    // The limit and motor for the rotation
    this.rotationalLimitMotor=new OIMO.LimitMotor(this.nor,false);
    this.r3=new OIMO.Rotational3Constraint(this,this.rotationalLimitMotor,new OIMO.LimitMotor(this.tan,true),new OIMO.LimitMotor(this.bin,true));
    // The limit and motor for the translation.
    this.translationalLimitMotor=new OIMO.LimitMotor(this.nor,true);
    this.translationalLimitMotor.lowerLimit=lowerTranslation;
    this.translationalLimitMotor.upperLimit=upperTranslation;
    this.t3=new OIMO.Translational3Constraint(this,this.translationalLimitMotor,new OIMO.LimitMotor(this.tan,true),new OIMO.LimitMotor(this.bin,true));
}
OIMO.SliderJoint.prototype = Object.create( OIMO.Joint.prototype );
OIMO.SliderJoint.prototype.preSolve = function (timeStep,invTimeStep) {
    var tmpM;
    var tmp1X;
    var tmp1Y;
    var tmp1Z;
    this.updateAnchorPoints();

    tmpM=this.body1.rotation.elements;
    var axis1X=this.localAxis1X*tmpM[0]+this.localAxis1Y*tmpM[1]+this.localAxis1Z*tmpM[2];
    var axis1Y=this.localAxis1X*tmpM[3]+this.localAxis1Y*tmpM[4]+this.localAxis1Z*tmpM[5];
    var axis1Z=this.localAxis1X*tmpM[6]+this.localAxis1Y*tmpM[7]+this.localAxis1Z*tmpM[8];
    var angAxis1X=this.localAngAxis1X*tmpM[0]+this.localAngAxis1Y*tmpM[1]+this.localAngAxis1Z*tmpM[2];
    var angAxis1Y=this.localAngAxis1X*tmpM[3]+this.localAngAxis1Y*tmpM[4]+this.localAngAxis1Z*tmpM[5];
    var angAxis1Z=this.localAngAxis1X*tmpM[6]+this.localAngAxis1Y*tmpM[7]+this.localAngAxis1Z*tmpM[8];
    tmpM=this.body2.rotation.elements;
    var axis2X=this.localAxis2X*tmpM[0]+this.localAxis2Y*tmpM[1]+this.localAxis2Z*tmpM[2];
    var axis2Y=this.localAxis2X*tmpM[3]+this.localAxis2Y*tmpM[4]+this.localAxis2Z*tmpM[5];
    var axis2Z=this.localAxis2X*tmpM[6]+this.localAxis2Y*tmpM[7]+this.localAxis2Z*tmpM[8];
    var angAxis2X=this.localAngAxis2X*tmpM[0]+this.localAngAxis2Y*tmpM[1]+this.localAngAxis2Z*tmpM[2];
    var angAxis2Y=this.localAngAxis2X*tmpM[3]+this.localAngAxis2Y*tmpM[4]+this.localAngAxis2Z*tmpM[5];
    var angAxis2Z=this.localAngAxis2X*tmpM[6]+this.localAngAxis2Y*tmpM[7]+this.localAngAxis2Z*tmpM[8];

    var nx=axis1X*this.body2.inverseMass+axis2X*this.body1.inverseMass;
    var ny=axis1Y*this.body2.inverseMass+axis2Y*this.body1.inverseMass;
    var nz=axis1Z*this.body2.inverseMass+axis2Z*this.body1.inverseMass;
    tmp1X=Math.sqrt(nx*nx+ny*ny+nz*nz);
    if(tmp1X>0)tmp1X=1/tmp1X;
    nx*=tmp1X;
    ny*=tmp1X;
    nz*=tmp1X;
    var tx=ny*nx-nz*nz;
    var ty=-nz*ny-nx*nx;
    var tz=nx*nz+ny*ny;
    tmp1X=1/Math.sqrt(tx*tx+ty*ty+tz*tz);
    tx*=tmp1X;
    ty*=tmp1X;
    tz*=tmp1X;
    var bx=ny*tz-nz*ty;
    var by=nz*tx-nx*tz;
    var bz=nx*ty-ny*tx;
    this.nor.init(nx,ny,nz);
    this.tan.init(tx,ty,tz);
    this.bin.init(bx,by,bz);

    // ----------------------------------------------
    //            calculate hinge angle
    // ----------------------------------------------

            
    if(
        nx*(angAxis1Y*angAxis2Z-angAxis1Z*angAxis2Y)+
        ny*(angAxis1Z*angAxis2X-angAxis1X*angAxis2Z)+
        nz*(angAxis1X*angAxis2Y-angAxis1Y*angAxis2X)<0
        ){
        this.rotationalLimitMotor.angle=-this.acosClamp(angAxis1X*angAxis2X+angAxis1Y*angAxis2Y+angAxis1Z*angAxis2Z);
    }else{
        this.rotationalLimitMotor.angle=this.acosClamp(angAxis1X*angAxis2X+angAxis1Y*angAxis2Y+angAxis1Z*angAxis2Z);
    }

    // angular error
    tmp1X=axis1Y*axis2Z-axis1Z*axis2Y;
    tmp1Y=axis1Z*axis2X-axis1X*axis2Z;
    tmp1Z=axis1X*axis2Y-axis1Y*axis2X;

    this.r3.limitMotor2.angle=tx*tmp1X+ty*tmp1Y+tz*tmp1Z;
    this.r3.limitMotor3.angle=bx*tmp1X+by*tmp1Y+bz*tmp1Z;
    
    this.r3.preSolve(timeStep,invTimeStep);
    this.t3.preSolve(timeStep,invTimeStep);
}
OIMO.SliderJoint.prototype.solve = function () {
    this.r3.solve();
    this.t3.solve();
}
OIMO.SliderJoint.prototype.postSolve = function () {
}
OIMO.SliderJoint.prototype.acosClamp = function(cos){
    if(cos>1)return 0;
    else if(cos<-1)return Math.PI;
    else return Math.acos(cos);
}
/**
* A wheel joint allows for relative rotation between two rigid bodies along two axes.
* The wheel joint also allows for relative translation for the suspension.
*/
OIMO.WheelJoint = function(config){
    OIMO.Joint.call( this, config);
    this.type=this.JOINT_WHEEL;

    // The first axis in local coordinate system.
    this.localAxis1=new OIMO.Vec3().normalize(config.localAxis1);
    // The second axis in local coordinate system.
    this.localAxis2=new OIMO.Vec3().normalize(config.localAxis2);

    var len;
    this.localAxis1X=this.localAxis1.x;
    this.localAxis1Y=this.localAxis1.y;
    this.localAxis1Z=this.localAxis1.z;
    this.localAxis2X=this.localAxis2.x;
    this.localAxis2Y=this.localAxis2.y;
    this.localAxis2Z=this.localAxis2.z;
    var dot=this.localAxis1X*this.localAxis2X+this.localAxis1Y*this.localAxis2Y+this.localAxis1Z*this.localAxis2Z;
    if(dot>-1&&dot<1){
        this.localAngAxis1X=this.localAxis2X-dot*this.localAxis1X;
        this.localAngAxis1Y=this.localAxis2Y-dot*this.localAxis1Y;
        this.localAngAxis1Z=this.localAxis2Z-dot*this.localAxis1Z;
        this.localAngAxis2X=this.localAxis1X-dot*this.localAxis2X;
        this.localAngAxis2Y=this.localAxis1Y-dot*this.localAxis2Y;
        this.localAngAxis2Z=this.localAxis1Z-dot*this.localAxis2Z;
        len=1/Math.sqrt(this.localAngAxis1X*this.localAngAxis1X+this.localAngAxis1Y*this.localAngAxis1Y+this.localAngAxis1Z*this.localAngAxis1Z);
        this.localAngAxis1X*=len;
        this.localAngAxis1Y*=len;
        this.localAngAxis1Z*=len;
        len=1/Math.sqrt(this.localAngAxis2X*this.localAngAxis2X+this.localAngAxis2Y*this.localAngAxis2Y+this.localAngAxis2Z*this.localAngAxis2Z);
        this.localAngAxis2X*=len;
        this.localAngAxis2Y*=len;
        this.localAngAxis2Z*=len;
    }else{
        this.localAngAxis1X=this.localAxis1Y*this.localAxis1X-this.localAxis1Z*this.localAxis1Z;
        this.localAngAxis1Y=-this.localAxis1Z*this.localAxis1Y-this.localAxis1X*this.localAxis1X;
        this.localAngAxis1Z=this.localAxis1X*this.localAxis1Z+this.localAxis1Y*this.localAxis1Y;
        len=1/Math.sqrt(this.localAngAxis1X*this.localAngAxis1X+this.localAngAxis1Y*this.localAngAxis1Y+this.localAngAxis1Z*this.localAngAxis1Z);
        this.localAngAxis1X*=len;
        this.localAngAxis1Y*=len;
        this.localAngAxis1Z*=len;
        var arc=new OIMO.Mat33().setQuat(new OIMO.Quat().arc(this.localAxis1,this.localAxis2));
        var tarc = arc.elements;
        this.localAngAxis2X=this.localAngAxis1X*tarc[0]+this.localAngAxis1Y*tarc[1]+this.localAngAxis1Z*tarc[2];
        this.localAngAxis2Y=this.localAngAxis1X*tarc[3]+this.localAngAxis1Y*tarc[4]+this.localAngAxis1Z*tarc[5];
        this.localAngAxis2Z=this.localAngAxis1X*tarc[6]+this.localAngAxis1Y*tarc[7]+this.localAngAxis1Z*tarc[8];
    }

    this.nor=new OIMO.Vec3();
    this.tan=new OIMO.Vec3();
    this.bin=new OIMO.Vec3();

    // The translational limit and motor information of the joint.
    this.translationalLimitMotor=new OIMO.LimitMotor(this.tan,true);
    this.translationalLimitMotor.frequency=8;
    this.translationalLimitMotor.dampingRatio=1;
    // The first rotational limit and motor information of the joint.
    this.rotationalLimitMotor1=new OIMO.LimitMotor(this.tan,false);
    // The second rotational limit and motor information of the joint.
    this.rotationalLimitMotor2=new OIMO.LimitMotor(this.bin,false);

    this.t3=new OIMO.Translational3Constraint(this,new OIMO.LimitMotor(this.nor,true),this.translationalLimitMotor,new OIMO.LimitMotor(this.bin,true));
    this.t3.weight=1;
    this.r3=new OIMO.Rotational3Constraint(this,new OIMO.LimitMotor(this.nor,true),this.rotationalLimitMotor1,this.rotationalLimitMotor2);
}
OIMO.WheelJoint.prototype = Object.create( OIMO.Joint.prototype );
OIMO.WheelJoint.prototype.preSolve = function (timeStep,invTimeStep) {
    var tmpM;
    var tmp1X;
    var tmp1Y;
    var tmp1Z;
    this.updateAnchorPoints();
    tmpM=this.body1.rotation.elements;
    var x1=this.localAxis1X*tmpM[0]+this.localAxis1Y*tmpM[1]+this.localAxis1Z*tmpM[2];
    var y1=this.localAxis1X*tmpM[3]+this.localAxis1Y*tmpM[4]+this.localAxis1Z*tmpM[5];
    var z1=this.localAxis1X*tmpM[6]+this.localAxis1Y*tmpM[7]+this.localAxis1Z*tmpM[8];
    var angAxis1X=this.localAngAxis1X*tmpM[0]+this.localAngAxis1Y*tmpM[1]+this.localAngAxis1Z*tmpM[2];
    var angAxis1Y=this.localAngAxis1X*tmpM[3]+this.localAngAxis1Y*tmpM[4]+this.localAngAxis1Z*tmpM[5];
    var angAxis1Z=this.localAngAxis1X*tmpM[6]+this.localAngAxis1Y*tmpM[7]+this.localAngAxis1Z*tmpM[8];
    tmpM=this.body2.rotation.elements;
    var x2=this.localAxis2X*tmpM[0]+this.localAxis2Y*tmpM[1]+this.localAxis2Z*tmpM[2];
    var y2=this.localAxis2X*tmpM[3]+this.localAxis2Y*tmpM[4]+this.localAxis2Z*tmpM[5];
    var z2=this.localAxis2X*tmpM[6]+this.localAxis2Y*tmpM[7]+this.localAxis2Z*tmpM[8];
    var angAxis2X=this.localAngAxis2X*tmpM[0]+this.localAngAxis2Y*tmpM[1]+this.localAngAxis2Z*tmpM[2];
    var angAxis2Y=this.localAngAxis2X*tmpM[3]+this.localAngAxis2Y*tmpM[4]+this.localAngAxis2Z*tmpM[5];
    var angAxis2Z=this.localAngAxis2X*tmpM[6]+this.localAngAxis2Y*tmpM[7]+this.localAngAxis2Z*tmpM[8];
    
    this.r3.limitMotor1.angle=x1*x2+y1*y2+z1*z2;
    if( x1*(angAxis1Y*z2-angAxis1Z*y2)+ y1*(angAxis1Z*x2-angAxis1X*z2)+ z1*(angAxis1X*y2-angAxis1Y*x2)<0 ){
        this.rotationalLimitMotor1.angle=-this.acosClamp(angAxis1X*x2+angAxis1Y*y2+angAxis1Z*z2);
    }else{
        this.rotationalLimitMotor1.angle=this.acosClamp(angAxis1X*x2+angAxis1Y*y2+angAxis1Z*z2);
    }
    if( x2*(angAxis2Y*z1-angAxis2Z*y1)+ y2*(angAxis2Z*x1-angAxis2X*z1)+ z2*(angAxis2X*y1-angAxis2Y*x1)<0 ){
        this.rotationalLimitMotor2.angle=this.acosClamp(angAxis2X*x1+angAxis2Y*y1+angAxis2Z*z1);
    }else{
        this.rotationalLimitMotor2.angle=-this.acosClamp(angAxis2X*x1+angAxis2Y*y1+angAxis2Z*z1);
    }

    var nx=y2*z1-z2*y1;
    var ny=z2*x1-x2*z1;
    var nz=x2*y1-y2*x1;

    tmp1X=Math.sqrt(nx*nx+ny*ny+nz*nz);
    if(tmp1X>0)tmp1X=1/tmp1X;
    nx*=tmp1X;
    ny*=tmp1X;
    nz*=tmp1X;

    var tx=ny*z2-nz*y2;
    var ty=nz*x2-nx*z2;
    var tz=nx*y2-ny*x2;

    tmp1X=Math.sqrt(tx*tx+ty*ty+tz*tz);
    if(tmp1X>0)tmp1X=1/tmp1X;
    tx*=tmp1X;
    ty*=tmp1X;
    tz*=tmp1X;

    var bx=y1*nz-z1*ny;
    var by=z1*nx-x1*nz;
    var bz=x1*ny-y1*nx;

    tmp1X=Math.sqrt(bx*bx+by*by+bz*bz);
    if(tmp1X>0)tmp1X=1/tmp1X;
    bx*=tmp1X;
    by*=tmp1X;
    bz*=tmp1X;

    this.nor.init(nx,ny,nz);
    this.tan.init(tx,ty,tz);
    this.bin.init(bx,by,bz);
    
    this.r3.preSolve(timeStep,invTimeStep);
    this.t3.preSolve(timeStep,invTimeStep);
}
OIMO.WheelJoint.prototype.solve = function () {
    this.r3.solve();
    this.t3.solve();
}
OIMO.WheelJoint.prototype.postSolve = function () {
}
OIMO.WheelJoint.prototype.acosClamp = function(cos){
    if(cos>1)return 0;
    else if(cos<-1)return Math.PI;
    else return Math.acos(cos);
}
/**
* An angular constraint for all axes for various joints.
* @author saharan
*/
OIMO.AngularConstraint = function(joint,targetOrientation){
    this.i1e00=NaN;
    this.i1e01=NaN;
    this.i1e02=NaN;
    this.i1e10=NaN;
    this.i1e11=NaN;
    this.i1e12=NaN;
    this.i1e20=NaN;
    this.i1e21=NaN;
    this.i1e22=NaN;
    this.i2e00=NaN;
    this.i2e01=NaN;
    this.i2e02=NaN;
    this.i2e10=NaN;
    this.i2e11=NaN;
    this.i2e12=NaN;
    this.i2e20=NaN;
    this.i2e21=NaN;
    this.i2e22=NaN;
    this.d00=NaN;
    this.d01=NaN;
    this.d02=NaN;
    this.d10=NaN;
    this.d11=NaN;
    this.d12=NaN;
    this.d20=NaN;
    this.d21=NaN;
    this.d22=NaN;
    this.ax=NaN;
    this.ay=NaN;
    this.az=NaN;
    this.velx=NaN;
    this.vely=NaN;
    this.velz=NaN;

    this.joint=joint;
    this.targetOrientation=new OIMO.Quat().invert(targetOrientation);
    this.relativeOrientation=new OIMO.Quat();
    this.b1=joint.body1;
    this.b2=joint.body2;
    this.a1=this.b1.angularVelocity;
    this.a2=this.b2.angularVelocity;
    this.i1=this.b1.inverseInertia;
    this.i2=this.b2.inverseInertia;
    this.impx=0;
    this.impy=0;
    this.impz=0;
}
OIMO.AngularConstraint.prototype = {
    constructor: OIMO.AngularConstraint,

    preSolve:function(timeStep,invTimeStep){
        var ti1 = this.i1.elements;
        var ti2 = this.i2.elements;
        this.i1e00=ti1[0];
        this.i1e01=ti1[1];
        this.i1e02=ti1[2];
        this.i1e10=ti1[3];
        this.i1e11=ti1[4];
        this.i1e12=ti1[5];
        this.i1e20=ti1[6];
        this.i1e21=ti1[7];
        this.i1e22=ti1[8];

        this.i2e00=ti2[0];
        this.i2e01=ti2[1];
        this.i2e02=ti2[2];
        this.i2e10=ti2[3];
        this.i2e11=ti2[4];
        this.i2e12=ti2[5];
        this.i2e20=ti2[6];
        this.i2e21=ti2[7];
        this.i2e22=ti2[8];

        var v00=this.i1e00+this.i2e00;
        var v01=this.i1e01+this.i2e01;
        var v02=this.i1e02+this.i2e02;
        var v10=this.i1e10+this.i2e10;
        var v11=this.i1e11+this.i2e11;
        var v12=this.i1e12+this.i2e12;
        var v20=this.i1e20+this.i2e20;
        var v21=this.i1e21+this.i2e21;
        var v22=this.i1e22+this.i2e22;
        var inv=1/(
        v00*(v11*v22-v21*v12)+
        v10*(v21*v02-v01*v22)+
        v20*(v01*v12-v11*v02)
        );
        this.d00=(v11*v22-v12*v21)*inv;
        this.d01=(v02*v21-v01*v22)*inv;
        this.d02=(v01*v12-v02*v11)*inv;
        this.d10=(v12*v20-v10*v22)*inv;
        this.d11=(v00*v22-v02*v20)*inv;
        this.d12=(v02*v10-v00*v12)*inv;
        this.d20=(v10*v21-v11*v20)*inv;
        this.d21=(v01*v20-v00*v21)*inv;
        this.d22=(v00*v11-v01*v10)*inv;
        
        this.relativeOrientation.invert(this.b1.orientation);// error = b2 - b1 - target
        this.relativeOrientation.mul(this.targetOrientation,this.relativeOrientation);
        this.relativeOrientation.mul(this.b2.orientation,this.relativeOrientation);
        inv=this.relativeOrientation.s*2;
        this.velx=this.relativeOrientation.x*inv;
        this.vely=this.relativeOrientation.y*inv;
        this.velz=this.relativeOrientation.z*inv;
        var len=Math.sqrt(this.velx*this.velx+this.vely*this.vely+this.velz*this.velz);
        if(len>0.02){
            len=(0.02-len)/len*invTimeStep*0.05;
            this.velx*=len;
            this.vely*=len;
            this.velz*=len;
        }else{
            this.velx=0;
            this.vely=0;
            this.velz=0;
        }
        this.a1.x+=this.impx*this.i1e00+this.impy*this.i1e01+this.impz*this.i1e02;
        this.a1.y+=this.impx*this.i1e10+this.impy*this.i1e11+this.impz*this.i1e12;
        this.a1.z+=this.impx*this.i1e20+this.impy*this.i1e21+this.impz*this.i1e22;
        this.a2.x-=this.impx*this.i2e00+this.impy*this.i2e01+this.impz*this.i2e02;
        this.a2.y-=this.impx*this.i2e10+this.impy*this.i2e11+this.impz*this.i2e12;
        this.a2.z-=this.impx*this.i2e20+this.impy*this.i2e21+this.impz*this.i2e22;
    },
    solve:function(){
        var rvx=this.a2.x-this.a1.x-this.velx;
        var rvy=this.a2.y-this.a1.y-this.vely;
        var rvz=this.a2.z-this.a1.z-this.velz;
        var nimpx=rvx*this.d00+rvy*this.d01+rvz*this.d02;
        var nimpy=rvx*this.d10+rvy*this.d11+rvz*this.d12;
        var nimpz=rvx*this.d20+rvy*this.d21+rvz*this.d22;
        this.impx+=nimpx;
        this.impy+=nimpy;
        this.impz+=nimpz;
        this.a1.x+=nimpx*this.i1e00+nimpy*this.i1e01+nimpz*this.i1e02;
        this.a1.y+=nimpx*this.i1e10+nimpy*this.i1e11+nimpz*this.i1e12;
        this.a1.z+=nimpx*this.i1e20+nimpy*this.i1e21+nimpz*this.i1e22;
        this.a2.x-=nimpx*this.i2e00+nimpy*this.i2e01+nimpz*this.i2e02;
        this.a2.y-=nimpx*this.i2e10+nimpy*this.i2e11+nimpz*this.i2e12;
        this.a2.z-=nimpx*this.i2e20+nimpy*this.i2e21+nimpz*this.i2e22;
    }
}
/**
* A linear constraint for all axes for various joints.
* @author saharan
*/
OIMO.LinearConstraint = function(joint){
    this.m1=NaN;
    this.m2=NaN;
    this.i1e00=NaN;
    this.i1e01=NaN;
    this.i1e02=NaN;
    this.i1e10=NaN;
    this.i1e11=NaN;
    this.i1e12=NaN;
    this.i1e20=NaN;
    this.i1e21=NaN;
    this.i1e22=NaN;
    this.i2e00=NaN;
    this.i2e01=NaN;
    this.i2e02=NaN;
    this.i2e10=NaN;
    this.i2e11=NaN;
    this.i2e12=NaN;
    this.i2e20=NaN;
    this.i2e21=NaN;
    this.i2e22=NaN;
    this.d00=NaN;
    this.d01=NaN;
    this.d02=NaN;
    this.d10=NaN;
    this.d11=NaN;
    this.d12=NaN;
    this.d20=NaN;
    this.d21=NaN;
    this.d22=NaN;
    this.r1x=NaN;
    this.r1y=NaN;
    this.r1z=NaN;
    this.r2x=NaN;
    this.r2y=NaN;
    this.r2z=NaN;
    this.ax1x=NaN;
    this.ax1y=NaN;
    this.ax1z=NaN;
    this.ay1x=NaN;
    this.ay1y=NaN;
    this.ay1z=NaN;
    this.az1x=NaN;
    this.az1y=NaN;
    this.az1z=NaN;
    this.ax2x=NaN;
    this.ax2y=NaN;
    this.ax2z=NaN;
    this.ay2x=NaN;
    this.ay2y=NaN;
    this.ay2z=NaN;
    this.az2x=NaN;
    this.az2y=NaN;
    this.az2z=NaN;
    this.vel=NaN;
    this.velx=NaN;
    this.vely=NaN;
    this.velz=NaN;


    this.joint=joint;
    this.r1=joint.relativeAnchorPoint1;
    this.r2=joint.relativeAnchorPoint2;
    this.p1=joint.anchorPoint1;
    this.p2=joint.anchorPoint2;
    this.b1=joint.body1;
    this.b2=joint.body2;
    this.l1=this.b1.linearVelocity;
    this.l2=this.b2.linearVelocity;
    this.a1=this.b1.angularVelocity;
    this.a2=this.b2.angularVelocity;
    this.i1=this.b1.inverseInertia;
    this.i2=this.b2.inverseInertia;
    this.impx=0;
    this.impy=0;
    this.impz=0;
}

OIMO.LinearConstraint.prototype = {
    constructor: OIMO.LinearConstraint,

    preSolve:function(timeStep,invTimeStep){
        this.r1x=this.r1.x;
        this.r1y=this.r1.y;
        this.r1z=this.r1.z;
        this.r2x=this.r2.x;
        this.r2y=this.r2.y;
        this.r2z=this.r2.z;
        this.m1=this.b1.inverseMass;
        this.m2=this.b2.inverseMass;

        var ti1 = this.i1.elements;
        var ti2 = this.i2.elements;
        this.i1e00=ti1[0];
        this.i1e01=ti1[1];
        this.i1e02=ti1[2];
        this.i1e10=ti1[3];
        this.i1e11=ti1[4];
        this.i1e12=ti1[5];
        this.i1e20=ti1[6];
        this.i1e21=ti1[7];
        this.i1e22=ti1[8];

        this.i2e00=ti2[0];
        this.i2e01=ti2[1];
        this.i2e02=ti2[2];
        this.i2e10=ti2[3];
        this.i2e11=ti2[4];
        this.i2e12=ti2[5];
        this.i2e20=ti2[6];
        this.i2e21=ti2[7];
        this.i2e22=ti2[8];

        this.ax1x=this.r1z*this.i1e01+-this.r1y*this.i1e02;
        this.ax1y=this.r1z*this.i1e11+-this.r1y*this.i1e12;
        this.ax1z=this.r1z*this.i1e21+-this.r1y*this.i1e22;
        this.ay1x=-this.r1z*this.i1e00+this.r1x*this.i1e02;
        this.ay1y=-this.r1z*this.i1e10+this.r1x*this.i1e12;
        this.ay1z=-this.r1z*this.i1e20+this.r1x*this.i1e22;
        this.az1x=this.r1y*this.i1e00+-this.r1x*this.i1e01;
        this.az1y=this.r1y*this.i1e10+-this.r1x*this.i1e11;
        this.az1z=this.r1y*this.i1e20+-this.r1x*this.i1e21;
        this.ax2x=this.r2z*this.i2e01+-this.r2y*this.i2e02;
        this.ax2y=this.r2z*this.i2e11+-this.r2y*this.i2e12;
        this.ax2z=this.r2z*this.i2e21+-this.r2y*this.i2e22;
        this.ay2x=-this.r2z*this.i2e00+this.r2x*this.i2e02;
        this.ay2y=-this.r2z*this.i2e10+this.r2x*this.i2e12;
        this.ay2z=-this.r2z*this.i2e20+this.r2x*this.i2e22;
        this.az2x=this.r2y*this.i2e00+-this.r2x*this.i2e01;
        this.az2y=this.r2y*this.i2e10+-this.r2x*this.i2e11;
        this.az2z=this.r2y*this.i2e20+-this.r2x*this.i2e21;

        // calculate point-to-point mass matrix
        // from impulse equation
        // 
        // M = ([/m] - [r^][/I][r^]) ^ -1
        // 
        // where
        // 
        // [/m] = |1/m, 0, 0|
        //        |0, 1/m, 0|
        //        |0, 0, 1/m|
        // 
        // [r^] = |0, -rz, ry|
        //        |rz, 0, -rx|
        //        |-ry, rx, 0|
        // 
        // [/I] = Inverted moment inertia

        var k00=this.m1+this.m2;
        var k01=0;
        var k02=0;
        var k10=0;
        var k11=k00;
        var k12=0;
        var k20=0;
        var k21=0;
        var k22=k00;

        k00+=this.i1e11*this.r1z*this.r1z-(this.i1e21+this.i1e12)*this.r1y*this.r1z+this.i1e22*this.r1y*this.r1y;
        k01+=(this.i1e20*this.r1y+this.i1e12*this.r1x)*this.r1z-this.i1e10*this.r1z*this.r1z-this.i1e22*this.r1x*this.r1y;
        k02+=(this.i1e10*this.r1y-this.i1e11*this.r1x)*this.r1z-this.i1e20*this.r1y*this.r1y+this.i1e21*this.r1x*this.r1y;
        k10+=(this.i1e02*this.r1y+this.i1e21*this.r1x)*this.r1z-this.i1e01*this.r1z*this.r1z-this.i1e22*this.r1x*this.r1y;
        k11+=this.i1e00*this.r1z*this.r1z-(this.i1e20+this.i1e02)*this.r1x*this.r1z+this.i1e22*this.r1x*this.r1x;
        k12+=(this.i1e01*this.r1x-this.i1e00*this.r1y)*this.r1z-this.i1e21*this.r1x*this.r1x+this.i1e20*this.r1x*this.r1y;
        k20+=(this.i1e01*this.r1y-this.i1e11*this.r1x)*this.r1z-this.i1e02*this.r1y*this.r1y+this.i1e12*this.r1x*this.r1y;
        k21+=(this.i1e10*this.r1x-this.i1e00*this.r1y)*this.r1z-this.i1e12*this.r1x*this.r1x+this.i1e02*this.r1x*this.r1y;
        k22+=this.i1e00*this.r1y*this.r1y-(this.i1e10+this.i1e01)*this.r1x*this.r1y+this.i1e11*this.r1x*this.r1x;

        k00+=this.i2e11*this.r2z*this.r2z-(this.i2e21+this.i2e12)*this.r2y*this.r2z+this.i2e22*this.r2y*this.r2y;
        k01+=(this.i2e20*this.r2y+this.i2e12*this.r2x)*this.r2z-this.i2e10*this.r2z*this.r2z-this.i2e22*this.r2x*this.r2y;
        k02+=(this.i2e10*this.r2y-this.i2e11*this.r2x)*this.r2z-this.i2e20*this.r2y*this.r2y+this.i2e21*this.r2x*this.r2y;
        k10+=(this.i2e02*this.r2y+this.i2e21*this.r2x)*this.r2z-this.i2e01*this.r2z*this.r2z-this.i2e22*this.r2x*this.r2y;
        k11+=this.i2e00*this.r2z*this.r2z-(this.i2e20+this.i2e02)*this.r2x*this.r2z+this.i2e22*this.r2x*this.r2x;
        k12+=(this.i2e01*this.r2x-this.i2e00*this.r2y)*this.r2z-this.i2e21*this.r2x*this.r2x+this.i2e20*this.r2x*this.r2y;
        k20+=(this.i2e01*this.r2y-this.i2e11*this.r2x)*this.r2z-this.i2e02*this.r2y*this.r2y+this.i2e12*this.r2x*this.r2y;
        k21+=(this.i2e10*this.r2x-this.i2e00*this.r2y)*this.r2z-this.i2e12*this.r2x*this.r2x+this.i2e02*this.r2x*this.r2y;
        k22+=this.i2e00*this.r2y*this.r2y-(this.i2e10+this.i2e01)*this.r2x*this.r2y+this.i2e11*this.r2x*this.r2x;

        var inv=1/(
        k00*(k11*k22-k21*k12)+
        k10*(k21*k02-k01*k22)+
        k20*(k01*k12-k11*k02)
        );
        this.d00=(k11*k22-k12*k21)*inv;
        this.d01=(k02*k21-k01*k22)*inv;
        this.d02=(k01*k12-k02*k11)*inv;
        this.d10=(k12*k20-k10*k22)*inv;
        this.d11=(k00*k22-k02*k20)*inv;
        this.d12=(k02*k10-k00*k12)*inv;
        this.d20=(k10*k21-k11*k20)*inv;
        this.d21=(k01*k20-k00*k21)*inv;
        this.d22=(k00*k11-k01*k10)*inv;

        this.velx=this.p2.x-this.p1.x;
        this.vely=this.p2.y-this.p1.y;
        this.velz=this.p2.z-this.p1.z;
        var len=Math.sqrt(this.velx*this.velx+this.vely*this.vely+this.velz*this.velz);
        if(len>0.005){
            len=(0.005-len)/len*invTimeStep*0.05;
            this.velx*=len;
            this.vely*=len;
            this.velz*=len;
        }else{
            this.velx=0;
            this.vely=0;
            this.velz=0;
        }

        this.impx*=0.95;
        this.impy*=0.95;
        this.impz*=0.95;
        
        this.l1.x+=this.impx*this.m1;
        this.l1.y+=this.impy*this.m1;
        this.l1.z+=this.impz*this.m1;
        this.a1.x+=this.impx*this.ax1x+this.impy*this.ay1x+this.impz*this.az1x;
        this.a1.y+=this.impx*this.ax1y+this.impy*this.ay1y+this.impz*this.az1y;
        this.a1.z+=this.impx*this.ax1z+this.impy*this.ay1z+this.impz*this.az1z;
        this.l2.x-=this.impx*this.m2;
        this.l2.y-=this.impy*this.m2;
        this.l2.z-=this.impz*this.m2;
        this.a2.x-=this.impx*this.ax2x+this.impy*this.ay2x+this.impz*this.az2x;
        this.a2.y-=this.impx*this.ax2y+this.impy*this.ay2y+this.impz*this.az2y;
        this.a2.z-=this.impx*this.ax2z+this.impy*this.ay2z+this.impz*this.az2z;
    },
    solve:function(){
        var rvx=this.l2.x-this.l1.x+this.a2.y*this.r2z-this.a2.z*this.r2y-this.a1.y*this.r1z+this.a1.z*this.r1y-this.velx;
        var rvy=this.l2.y-this.l1.y+this.a2.z*this.r2x-this.a2.x*this.r2z-this.a1.z*this.r1x+this.a1.x*this.r1z-this.vely;
        var rvz=this.l2.z-this.l1.z+this.a2.x*this.r2y-this.a2.y*this.r2x-this.a1.x*this.r1y+this.a1.y*this.r1x-this.velz;
        var nimpx=rvx*this.d00+rvy*this.d01+rvz*this.d02;
        var nimpy=rvx*this.d10+rvy*this.d11+rvz*this.d12;
        var nimpz=rvx*this.d20+rvy*this.d21+rvz*this.d22;
        this.impx+=nimpx;
        this.impy+=nimpy;
        this.impz+=nimpz;
        this.l1.x+=nimpx*this.m1;
        this.l1.y+=nimpy*this.m1;
        this.l1.z+=nimpz*this.m1;
        this.a1.x+=nimpx*this.ax1x+nimpy*this.ay1x+nimpz*this.az1x;
        this.a1.y+=nimpx*this.ax1y+nimpy*this.ay1y+nimpz*this.az1y;
        this.a1.z+=nimpx*this.ax1z+nimpy*this.ay1z+nimpz*this.az1z;
        this.l2.x-=nimpx*this.m2;
        this.l2.y-=nimpy*this.m2;
        this.l2.z-=nimpz*this.m2;
        this.a2.x-=nimpx*this.ax2x+nimpy*this.ay2x+nimpz*this.az2x;
        this.a2.y-=nimpx*this.ax2y+nimpy*this.ay2y+nimpz*this.az2y;
        this.a2.z-=nimpx*this.ax2z+nimpy*this.ay2z+nimpz*this.az2z;
    }
}
/**
* A three-axis rotational constraint for various joints.
* @author saharan
*/
OIMO.Rotational3Constraint = function(joint,limitMotor1,limitMotor2,limitMotor3){
    this.cfm1=NaN;
    this.cfm2=NaN;
    this.cfm3=NaN;
    this.i1e00=NaN;
    this.i1e01=NaN;
    this.i1e02=NaN;
    this.i1e10=NaN;
    this.i1e11=NaN;
    this.i1e12=NaN;
    this.i1e20=NaN;
    this.i1e21=NaN;
    this.i1e22=NaN;
    this.i2e00=NaN;
    this.i2e01=NaN;
    this.i2e02=NaN;
    this.i2e10=NaN;
    this.i2e11=NaN;
    this.i2e12=NaN;
    this.i2e20=NaN;
    this.i2e21=NaN;
    this.i2e22=NaN;
    this.ax1=NaN;
    this.ay1=NaN;
    this.az1=NaN;
    this.ax2=NaN;
    this.ay2=NaN;
    this.az2=NaN;
    this.ax3=NaN;
    this.ay3=NaN;
    this.az3=NaN;

    this.a1x1=NaN; // jacoians
    this.a1y1=NaN;
    this.a1z1=NaN;
    this.a2x1=NaN;
    this.a2y1=NaN;
    this.a2z1=NaN;
    this.a1x2=NaN;
    this.a1y2=NaN;
    this.a1z2=NaN;
    this.a2x2=NaN;
    this.a2y2=NaN;
    this.a2z2=NaN;
    this.a1x3=NaN;
    this.a1y3=NaN;
    this.a1z3=NaN;
    this.a2x3=NaN;
    this.a2y3=NaN;
    this.a2z3=NaN;

    this.lowerLimit1=NaN;
    this.upperLimit1=NaN;
    this.limitVelocity1=NaN;
    this.limitState1=0; // -1: at lower, 0: locked, 1: at upper, 2: free
    this.enableMotor1=false;
    this.motorSpeed1=NaN;
    this.maxMotorForce1=NaN;
    this.maxMotorImpulse1=NaN;
    this.lowerLimit2=NaN;
    this.upperLimit2=NaN;
    this.limitVelocity2=NaN;
    this.limitState2=0; // -1: at lower, 0: locked, 1: at upper, 2: free
    this.enableMotor2=false;
    this.motorSpeed2=NaN;
    this.maxMotorForce2=NaN;
    this.maxMotorImpulse2=NaN;
    this.lowerLimit3=NaN;
    this.upperLimit3=NaN;
    this.limitVelocity3=NaN;
    this.limitState3=0; // -1: at lower, 0: locked, 1: at upper, 2: free
    this.enableMotor3=false;
    this.motorSpeed3=NaN;
    this.maxMotorForce3=NaN;
    this.maxMotorImpulse3=NaN;

    this.k00=NaN; // K = J*M*JT
    this.k01=NaN;
    this.k02=NaN;
    this.k10=NaN;
    this.k11=NaN;
    this.k12=NaN;
    this.k20=NaN;
    this.k21=NaN;
    this.k22=NaN;

    this.kv00=NaN; // diagonals without CFMs
    this.kv11=NaN;
    this.kv22=NaN;

    this.dv00=NaN; // ...inverted
    this.dv11=NaN;
    this.dv22=NaN;

    this.d00=NaN;  // K^-1
    this.d01=NaN;
    this.d02=NaN;
    this.d10=NaN;
    this.d11=NaN;
    this.d12=NaN;
    this.d20=NaN;
    this.d21=NaN;
    this.d22=NaN;

    this.limitMotor1=limitMotor1;
    this.limitMotor2=limitMotor2;
    this.limitMotor3=limitMotor3;
    this.b1=joint.body1;
    this.b2=joint.body2;
    this.a1=this.b1.angularVelocity;
    this.a2=this.b2.angularVelocity;
    this.i1=this.b1.inverseInertia;
    this.i2=this.b2.inverseInertia;
    this.limitImpulse1=0;
    this.motorImpulse1=0;
    this.limitImpulse2=0;
    this.motorImpulse2=0;
    this.limitImpulse3=0;
    this.motorImpulse3=0;
}
OIMO.Rotational3Constraint.prototype = {
    constructor: OIMO.Rotational3Constraint,

    preSolve:function(timeStep,invTimeStep){
        this.ax1=this.limitMotor1.axis.x;
        this.ay1=this.limitMotor1.axis.y;
        this.az1=this.limitMotor1.axis.z;
        this.ax2=this.limitMotor2.axis.x;
        this.ay2=this.limitMotor2.axis.y;
        this.az2=this.limitMotor2.axis.z;
        this.ax3=this.limitMotor3.axis.x;
        this.ay3=this.limitMotor3.axis.y;
        this.az3=this.limitMotor3.axis.z;
        this.lowerLimit1=this.limitMotor1.lowerLimit;
        this.upperLimit1=this.limitMotor1.upperLimit;
        this.motorSpeed1=this.limitMotor1.motorSpeed;
        this.maxMotorForce1=this.limitMotor1.maxMotorForce;
        this.enableMotor1=this.maxMotorForce1>0;
        this.lowerLimit2=this.limitMotor2.lowerLimit;
        this.upperLimit2=this.limitMotor2.upperLimit;
        this.motorSpeed2=this.limitMotor2.motorSpeed;
        this.maxMotorForce2=this.limitMotor2.maxMotorForce;
        this.enableMotor2=this.maxMotorForce2>0;
        this.lowerLimit3=this.limitMotor3.lowerLimit;
        this.upperLimit3=this.limitMotor3.upperLimit;
        this.motorSpeed3=this.limitMotor3.motorSpeed;
        this.maxMotorForce3=this.limitMotor3.maxMotorForce;
        this.enableMotor3=this.maxMotorForce3>0;

        var ti1 = this.i1.elements;
        var ti2 = this.i2.elements;
        this.i1e00=ti1[0];
        this.i1e01=ti1[1];
        this.i1e02=ti1[2];
        this.i1e10=ti1[3];
        this.i1e11=ti1[4];
        this.i1e12=ti1[5];
        this.i1e20=ti1[6];
        this.i1e21=ti1[7];
        this.i1e22=ti1[8];

        this.i2e00=ti2[0];
        this.i2e01=ti2[1];
        this.i2e02=ti2[2];
        this.i2e10=ti2[3];
        this.i2e11=ti2[4];
        this.i2e12=ti2[5];
        this.i2e20=ti2[6];
        this.i2e21=ti2[7];
        this.i2e22=ti2[8];

        var frequency1=this.limitMotor1.frequency;
        var frequency2=this.limitMotor2.frequency;
        var frequency3=this.limitMotor3.frequency;
        var enableSpring1=frequency1>0;
        var enableSpring2=frequency2>0;
        var enableSpring3=frequency3>0;
        var enableLimit1=this.lowerLimit1<=this.upperLimit1;
        var enableLimit2=this.lowerLimit2<=this.upperLimit2;
        var enableLimit3=this.lowerLimit3<=this.upperLimit3;
        var angle1=this.limitMotor1.angle;
        if(enableLimit1){
            if(this.lowerLimit1==this.upperLimit1){
                if(this.limitState1!=0){
                    this.limitState1=0;
                    this.limitImpulse1=0;
                }
                this.limitVelocity1=this.lowerLimit1-angle1;
            }else if(angle1<this.lowerLimit1){
                if(this.limitState1!=-1){
                    this.limitState1=-1;
                    this.limitImpulse1=0;
                }
                this.limitVelocity1=this.lowerLimit1-angle1;
            }else if(angle1>this.upperLimit1){
                if(this.limitState1!=1){
                    this.limitState1=1;
                    this.limitImpulse1=0;
                }
                this.limitVelocity1=this.upperLimit1-angle1;
            }else{
                this.limitState1=2;
                this.limitImpulse1=0;
                this.limitVelocity1=0;
            }
            if(!enableSpring1){
                if(this.limitVelocity1>0.02)this.limitVelocity1-=0.02;
                else if(this.limitVelocity1<-0.02)this.limitVelocity1+=0.02;
                else this.limitVelocity1=0;
            }
        }else{
            this.limitState1=2;
            this.limitImpulse1=0;
        }

        var angle2=this.limitMotor2.angle;
        if(enableLimit2){
            if(this.lowerLimit2==this.upperLimit2){
                if(this.limitState2!=0){
                    this.limitState2=0;
                    this.limitImpulse2=0;
                }
                this.limitVelocity2=this.lowerLimit2-angle2;
            }else if(angle2<this.lowerLimit2){
                if(this.limitState2!=-1){
                    this.limitState2=-1;
                    this.limitImpulse2=0;
                }
                this.limitVelocity2=this.lowerLimit2-angle2;
            }else if(angle2>this.upperLimit2){
                if(this.limitState2!=1){
                    this.limitState2=1;
                    this.limitImpulse2=0;
                }
                this.limitVelocity2=this.upperLimit2-angle2;
            }else{
                this.limitState2=2;
                this.limitImpulse2=0;
                this.limitVelocity2=0;
            }
            if(!enableSpring2){
                if(this.limitVelocity2>0.02)this.limitVelocity2-=0.02;
                else if(this.limitVelocity2<-0.02)this.limitVelocity2+=0.02;
                else this.limitVelocity2=0;
            }
        }else{
            this.limitState2=2;
            this.limitImpulse2=0;
        }

        var angle3=this.limitMotor3.angle;
        if(enableLimit3){
            if(this.lowerLimit3==this.upperLimit3){
                if(this.limitState3!=0){
                    this.limitState3=0;
                    this.limitImpulse3=0;
                }
                this.limitVelocity3=this.lowerLimit3-angle3;
            }else if(angle3<this.lowerLimit3){
                if(this.limitState3!=-1){
                    this.limitState3=-1;
                    this.limitImpulse3=0;
                }
                this.limitVelocity3=this.lowerLimit3-angle3;
            }else if(angle3>this.upperLimit3){
                if(this.limitState3!=1){
                    this.limitState3=1;
                    this.limitImpulse3=0;
                }
                this.limitVelocity3=this.upperLimit3-angle3;
            }else{
                this.limitState3=2;
                this.limitImpulse3=0;
                this.limitVelocity3=0;
                }
            if(!enableSpring3){
                if(this.limitVelocity3>0.02)this.limitVelocity3-=0.02;
                else if(this.limitVelocity3<-0.02)this.limitVelocity3+=0.02;
                else this.limitVelocity3=0;
            }
        }else{
            this.limitState3=2;
            this.limitImpulse3=0;
        }

        if(this.enableMotor1&&(this.limitState1!=0||enableSpring1)){
            this.maxMotorImpulse1=this.maxMotorForce1*timeStep;
        }else{
            this.motorImpulse1=0;
            this.maxMotorImpulse1=0;
        }
        if(this.enableMotor2&&(this.limitState2!=0||enableSpring2)){
            this.maxMotorImpulse2=this.maxMotorForce2*timeStep;
        }else{
            this.motorImpulse2=0;
            this.maxMotorImpulse2=0;
        }
        if(this.enableMotor3&&(this.limitState3!=0||enableSpring3)){
            this.maxMotorImpulse3=this.maxMotorForce3*timeStep;
        }else{
            this.motorImpulse3=0;
            this.maxMotorImpulse3=0;
        }

        // build jacobians
        this.a1x1=this.ax1*this.i1e00+this.ay1*this.i1e01+this.az1*this.i1e02;
        this.a1y1=this.ax1*this.i1e10+this.ay1*this.i1e11+this.az1*this.i1e12;
        this.a1z1=this.ax1*this.i1e20+this.ay1*this.i1e21+this.az1*this.i1e22;
        this.a2x1=this.ax1*this.i2e00+this.ay1*this.i2e01+this.az1*this.i2e02;
        this.a2y1=this.ax1*this.i2e10+this.ay1*this.i2e11+this.az1*this.i2e12;
        this.a2z1=this.ax1*this.i2e20+this.ay1*this.i2e21+this.az1*this.i2e22;

        this.a1x2=this.ax2*this.i1e00+this.ay2*this.i1e01+this.az2*this.i1e02;
        this.a1y2=this.ax2*this.i1e10+this.ay2*this.i1e11+this.az2*this.i1e12;
        this.a1z2=this.ax2*this.i1e20+this.ay2*this.i1e21+this.az2*this.i1e22;
        this.a2x2=this.ax2*this.i2e00+this.ay2*this.i2e01+this.az2*this.i2e02;
        this.a2y2=this.ax2*this.i2e10+this.ay2*this.i2e11+this.az2*this.i2e12;
        this.a2z2=this.ax2*this.i2e20+this.ay2*this.i2e21+this.az2*this.i2e22;

        this.a1x3=this.ax3*this.i1e00+this.ay3*this.i1e01+this.az3*this.i1e02;
        this.a1y3=this.ax3*this.i1e10+this.ay3*this.i1e11+this.az3*this.i1e12;
        this.a1z3=this.ax3*this.i1e20+this.ay3*this.i1e21+this.az3*this.i1e22;
        this.a2x3=this.ax3*this.i2e00+this.ay3*this.i2e01+this.az3*this.i2e02;
        this.a2y3=this.ax3*this.i2e10+this.ay3*this.i2e11+this.az3*this.i2e12;
        this.a2z3=this.ax3*this.i2e20+this.ay3*this.i2e21+this.az3*this.i2e22;

        // build an impulse matrix
        this.k00=this.ax1*(this.a1x1+this.a2x1)+this.ay1*(this.a1y1+this.a2y1)+this.az1*(this.a1z1+this.a2z1);
        this.k01=this.ax1*(this.a1x2+this.a2x2)+this.ay1*(this.a1y2+this.a2y2)+this.az1*(this.a1z2+this.a2z2);
        this.k02=this.ax1*(this.a1x3+this.a2x3)+this.ay1*(this.a1y3+this.a2y3)+this.az1*(this.a1z3+this.a2z3);
        this.k10=this.ax2*(this.a1x1+this.a2x1)+this.ay2*(this.a1y1+this.a2y1)+this.az2*(this.a1z1+this.a2z1);
        this.k11=this.ax2*(this.a1x2+this.a2x2)+this.ay2*(this.a1y2+this.a2y2)+this.az2*(this.a1z2+this.a2z2);
        this.k12=this.ax2*(this.a1x3+this.a2x3)+this.ay2*(this.a1y3+this.a2y3)+this.az2*(this.a1z3+this.a2z3);
        this.k20=this.ax3*(this.a1x1+this.a2x1)+this.ay3*(this.a1y1+this.a2y1)+this.az3*(this.a1z1+this.a2z1);
        this.k21=this.ax3*(this.a1x2+this.a2x2)+this.ay3*(this.a1y2+this.a2y2)+this.az3*(this.a1z2+this.a2z2);
        this.k22=this.ax3*(this.a1x3+this.a2x3)+this.ay3*(this.a1y3+this.a2y3)+this.az3*(this.a1z3+this.a2z3);

        this.kv00=this.k00;
        this.kv11=this.k11;
        this.kv22=this.k22;
        this.dv00=1/this.kv00;
        this.dv11=1/this.kv11;
        this.dv22=1/this.kv22;

        if(enableSpring1&&this.limitState1!=2){
            var omega=6.2831853*frequency1;
            var k=omega*omega*timeStep;
            var dmp=invTimeStep/(k+2*this.limitMotor1.dampingRatio*omega);
            this.cfm1=this.kv00*dmp;
            this.limitVelocity1*=k*dmp;
        }else{
            this.cfm1=0;
            this.limitVelocity1*=invTimeStep*0.05;
        }

        if(enableSpring2&&this.limitState2!=2){
            omega=6.2831853*frequency2;
            k=omega*omega*timeStep;
            dmp=invTimeStep/(k+2*this.limitMotor2.dampingRatio*omega);
            this.cfm2=this.kv11*dmp;
            this.limitVelocity2*=k*dmp;
        }else{
            this.cfm2=0;
            this.limitVelocity2*=invTimeStep*0.05;
        }

        if(enableSpring3&&this.limitState3!=2){
            omega=6.2831853*frequency3;
            k=omega*omega*timeStep;
            dmp=invTimeStep/(k+2*this.limitMotor3.dampingRatio*omega);
            this.cfm3=this.kv22*dmp;
            this.limitVelocity3*=k*dmp;
        }else{
            this.cfm3=0;
            this.limitVelocity3*=invTimeStep*0.05;
        }

        this.k00+=this.cfm1;
        this.k11+=this.cfm2;
        this.k22+=this.cfm3;

        var inv=1/(
        this.k00*(this.k11*this.k22-this.k21*this.k12)+
        this.k10*(this.k21*this.k02-this.k01*this.k22)+
        this.k20*(this.k01*this.k12-this.k11*this.k02)
        );
        this.d00=(this.k11*this.k22-this.k12*this.k21)*inv;
        this.d01=(this.k02*this.k21-this.k01*this.k22)*inv;
        this.d02=(this.k01*this.k12-this.k02*this.k11)*inv;
        this.d10=(this.k12*this.k20-this.k10*this.k22)*inv;
        this.d11=(this.k00*this.k22-this.k02*this.k20)*inv;
        this.d12=(this.k02*this.k10-this.k00*this.k12)*inv;
        this.d20=(this.k10*this.k21-this.k11*this.k20)*inv;
        this.d21=(this.k01*this.k20-this.k00*this.k21)*inv;
        this.d22=(this.k00*this.k11-this.k01*this.k10)*inv;
        
        this.limitImpulse1*=0.95;
        this.motorImpulse1*=0.95;
        this.limitImpulse2*=0.95;
        this.motorImpulse2*=0.95;
        this.limitImpulse3*=0.95;
        this.motorImpulse3*=0.95;
        var totalImpulse1=this.limitImpulse1+this.motorImpulse1;
        var totalImpulse2=this.limitImpulse2+this.motorImpulse2;
        var totalImpulse3=this.limitImpulse3+this.motorImpulse3;
        this.a1.x+=totalImpulse1*this.a1x1+totalImpulse2*this.a1x2+totalImpulse3*this.a1x3;
        this.a1.y+=totalImpulse1*this.a1y1+totalImpulse2*this.a1y2+totalImpulse3*this.a1y3;
        this.a1.z+=totalImpulse1*this.a1z1+totalImpulse2*this.a1z2+totalImpulse3*this.a1z3;
        this.a2.x-=totalImpulse1*this.a2x1+totalImpulse2*this.a2x2+totalImpulse3*this.a2x3;
        this.a2.y-=totalImpulse1*this.a2y1+totalImpulse2*this.a2y2+totalImpulse3*this.a2y3;
        this.a2.z-=totalImpulse1*this.a2z1+totalImpulse2*this.a2z2+totalImpulse3*this.a2z3;
    },
    solve_:function(){
        var rvx=this.a2.x-this.a1.x;
        var rvy=this.a2.y-this.a1.y;
        var rvz=this.a2.z-this.a1.z;

        this.limitVelocity3=30;
        var rvn1=rvx*this.ax1+rvy*this.ay1+rvz*this.az1-this.limitVelocity1;
        var rvn2=rvx*this.ax2+rvy*this.ay2+rvz*this.az2-this.limitVelocity2;
        var rvn3=rvx*this.ax3+rvy*this.ay3+rvz*this.az3-this.limitVelocity3;

        var dLimitImpulse1=rvn1*this.d00+rvn2*this.d01+rvn3*this.d02;
        var dLimitImpulse2=rvn1*this.d10+rvn2*this.d11+rvn3*this.d12;
        var dLimitImpulse3=rvn1*this.d20+rvn2*this.d21+rvn3*this.d22;

        this.limitImpulse1+=dLimitImpulse1;
        this.limitImpulse2+=dLimitImpulse2;
        this.limitImpulse3+=dLimitImpulse3;

        this.a1.x+=dLimitImpulse1*this.a1x1+dLimitImpulse2*this.a1x2+dLimitImpulse3*this.a1x3;
        this.a1.y+=dLimitImpulse1*this.a1y1+dLimitImpulse2*this.a1y2+dLimitImpulse3*this.a1y3;
        this.a1.z+=dLimitImpulse1*this.a1z1+dLimitImpulse2*this.a1z2+dLimitImpulse3*this.a1z3;
        this.a2.x-=dLimitImpulse1*this.a2x1+dLimitImpulse2*this.a2x2+dLimitImpulse3*this.a2x3;
        this.a2.y-=dLimitImpulse1*this.a2y1+dLimitImpulse2*this.a2y2+dLimitImpulse3*this.a2y3;
        this.a2.z-=dLimitImpulse1*this.a2z1+dLimitImpulse2*this.a2z2+dLimitImpulse3*this.a2z3;
    },
    solve:function(){
        var rvx=this.a2.x-this.a1.x;
        var rvy=this.a2.y-this.a1.y;
        var rvz=this.a2.z-this.a1.z;

        var rvn1=rvx*this.ax1+rvy*this.ay1+rvz*this.az1;
        var rvn2=rvx*this.ax2+rvy*this.ay2+rvz*this.az2;
        var rvn3=rvx*this.ax3+rvy*this.ay3+rvz*this.az3;

        var oldMotorImpulse1=this.motorImpulse1;
        var oldMotorImpulse2=this.motorImpulse2;
        var oldMotorImpulse3=this.motorImpulse3;

        var dMotorImpulse1=0;
        var dMotorImpulse2=0;
        var dMotorImpulse3=0;

        if(this.enableMotor1){
            dMotorImpulse1=(rvn1-this.motorSpeed1)*this.dv00;
            this.motorImpulse1+=dMotorImpulse1;
            if(this.motorImpulse1>this.maxMotorImpulse1){ // clamp motor impulse
            this.motorImpulse1=this.maxMotorImpulse1;
            }else if(this.motorImpulse1<-this.maxMotorImpulse1){
            this.motorImpulse1=-this.maxMotorImpulse1;
            }
            dMotorImpulse1=this.motorImpulse1-oldMotorImpulse1;
        }
        if(this.enableMotor2){
            dMotorImpulse2=(rvn2-this.motorSpeed2)*this.dv11;
            this.motorImpulse2+=dMotorImpulse2;
            if(this.motorImpulse2>this.maxMotorImpulse2){ // clamp motor impulse
                this.motorImpulse2=this.maxMotorImpulse2;
            }else if(this.motorImpulse2<-this.maxMotorImpulse2){
                this.motorImpulse2=-this.maxMotorImpulse2;
            }
            dMotorImpulse2=this.motorImpulse2-oldMotorImpulse2;
        }
        if(this.enableMotor3){
            dMotorImpulse3=(rvn3-this.motorSpeed3)*this.dv22;
            this.motorImpulse3+=dMotorImpulse3;
            if(this.motorImpulse3>this.maxMotorImpulse3){ // clamp motor impulse
                this.motorImpulse3=this.maxMotorImpulse3;
            }else if(this.motorImpulse3<-this.maxMotorImpulse3){
                this.motorImpulse3=-this.maxMotorImpulse3;
            }
            dMotorImpulse3=this.motorImpulse3-oldMotorImpulse3;
        }

        // apply motor impulse to relative velocity
        rvn1+=dMotorImpulse1*this.kv00+dMotorImpulse2*this.k01+dMotorImpulse3*this.k02;
        rvn2+=dMotorImpulse1*this.k10+dMotorImpulse2*this.kv11+dMotorImpulse3*this.k12;
        rvn3+=dMotorImpulse1*this.k20+dMotorImpulse2*this.k21+dMotorImpulse3*this.kv22;

        // subtract target velocity and applied impulse
        rvn1-=this.limitVelocity1+this.limitImpulse1*this.cfm1;
        rvn2-=this.limitVelocity2+this.limitImpulse2*this.cfm2;
        rvn3-=this.limitVelocity3+this.limitImpulse3*this.cfm3;

        var oldLimitImpulse1=this.limitImpulse1;
        var oldLimitImpulse2=this.limitImpulse2;
        var oldLimitImpulse3=this.limitImpulse3;

        var dLimitImpulse1=rvn1*this.d00+rvn2*this.d01+rvn3*this.d02;
        var dLimitImpulse2=rvn1*this.d10+rvn2*this.d11+rvn3*this.d12;
        var dLimitImpulse3=rvn1*this.d20+rvn2*this.d21+rvn3*this.d22;

        this.limitImpulse1+=dLimitImpulse1;
        this.limitImpulse2+=dLimitImpulse2;
        this.limitImpulse3+=dLimitImpulse3;

        // clamp
        var clampState=0;
        if(this.limitState1==2||this.limitImpulse1*this.limitState1<0){
            dLimitImpulse1=-oldLimitImpulse1;
            rvn2+=dLimitImpulse1*this.k10;
            rvn3+=dLimitImpulse1*this.k20;
            clampState|=1;
        }
        if(this.limitState2==2||this.limitImpulse2*this.limitState2<0){
            dLimitImpulse2=-oldLimitImpulse2;
            rvn1+=dLimitImpulse2*this.k01;
            rvn3+=dLimitImpulse2*this.k21;
            clampState|=2;
        }
        if(this.limitState3==2||this.limitImpulse3*this.limitState3<0){
            dLimitImpulse3=-oldLimitImpulse3;
            rvn1+=dLimitImpulse3*this.k02;
            rvn2+=dLimitImpulse3*this.k12;
            clampState|=4;
        }

        // update un-clamped impulse
        // TODO: isolate division
        var det;
        switch(clampState){
            case 1: // update 2 3
            det=1/(this.k11*this.k22-this.k12*this.k21);
            dLimitImpulse2=(this.k22*rvn2+-this.k12*rvn3)*det;
            dLimitImpulse3=(-this.k21*rvn2+this.k11*rvn3)*det;
            break;
            case 2: // update 1 3
            det=1/(this.k00*this.k22-this.k02*this.k20);
            dLimitImpulse1=(this.k22*rvn1+-this.k02*rvn3)*det;
            dLimitImpulse3=(-this.k20*rvn1+this.k00*rvn3)*det;
            break;
            case 3: // update 3
            dLimitImpulse3=rvn3/this.k22;
            break;
            case 4: // update 1 2
            det=1/(this.k00*this.k11-this.k01*this.k10);
            dLimitImpulse1=(this.k11*rvn1+-this.k01*rvn2)*det;
            dLimitImpulse2=(-this.k10*rvn1+this.k00*rvn2)*det;
            break;
            case 5: // update 2
            dLimitImpulse2=rvn2/this.k11;
            break;
            case 6: // update 1
            dLimitImpulse1=rvn1/this.k00;
            break;
        }

        this.limitImpulse1=dLimitImpulse1+oldLimitImpulse1;
        this.limitImpulse2=dLimitImpulse2+oldLimitImpulse2;
        this.limitImpulse3=dLimitImpulse3+oldLimitImpulse3;

        var dImpulse1=dMotorImpulse1+dLimitImpulse1;
        var dImpulse2=dMotorImpulse2+dLimitImpulse2;
        var dImpulse3=dMotorImpulse3+dLimitImpulse3;

        // apply impulse
        this.a1.x+=dImpulse1*this.a1x1+dImpulse2*this.a1x2+dImpulse3*this.a1x3;
        this.a1.y+=dImpulse1*this.a1y1+dImpulse2*this.a1y2+dImpulse3*this.a1y3;
        this.a1.z+=dImpulse1*this.a1z1+dImpulse2*this.a1z2+dImpulse3*this.a1z3;
        this.a2.x-=dImpulse1*this.a2x1+dImpulse2*this.a2x2+dImpulse3*this.a2x3;
        this.a2.y-=dImpulse1*this.a2y1+dImpulse2*this.a2y2+dImpulse3*this.a2y3;
        this.a2.z-=dImpulse1*this.a2z1+dImpulse2*this.a2z2+dImpulse3*this.a2z3;
        rvx=this.a2.x-this.a1.x;
        rvy=this.a2.y-this.a1.y;
        rvz=this.a2.z-this.a1.z;

        rvn2=rvx*this.ax2+rvy*this.ay2+rvz*this.az2;
    }
}
/**
* A rotational constraint for various joints.
* @author saharan
*/
OIMO.RotationalConstraint = function(joint,limitMotor){
    this.cfm=NaN;
    this.i1e00=NaN;
    this.i1e01=NaN;
    this.i1e02=NaN;
    this.i1e10=NaN;
    this.i1e11=NaN;
    this.i1e12=NaN;
    this.i1e20=NaN;
    this.i1e21=NaN;
    this.i1e22=NaN;
    this.i2e00=NaN;
    this.i2e01=NaN;
    this.i2e02=NaN;
    this.i2e10=NaN;
    this.i2e11=NaN;
    this.i2e12=NaN;
    this.i2e20=NaN;
    this.i2e21=NaN;
    this.i2e22=NaN;
    this.motorDenom=NaN;
    this.invMotorDenom=NaN;
    this.invDenom=NaN;
    this.ax=NaN;
    this.ay=NaN;
    this.az=NaN;
    this.a1x=NaN;
    this.a1y=NaN;
    this.a1z=NaN;
    this.a2x=NaN;
    this.a2y=NaN;
    this.a2z=NaN;
    this.enableLimit=false;
    this.lowerLimit=NaN;
    this.upperLimit=NaN;
    this.limitVelocity=NaN;
    this.limitState=0; // -1: at lower, 0: locked, 1: at upper, 2: free
    this.enableMotor=false;
    this.motorSpeed=NaN;
    this.maxMotorForce=NaN;
    this.maxMotorImpulse=NaN;

    this.limitMotor=limitMotor;
    this.b1=joint.body1;
    this.b2=joint.body2;
    this.a1=this.b1.angularVelocity;
    this.a2=this.b2.angularVelocity;
    this.i1=this.b1.inverseInertia;
    this.i2=this.b2.inverseInertia;
    this.limitImpulse=0;
    this.motorImpulse=0;
}
OIMO.RotationalConstraint.prototype = {
    constructor: OIMO.RotationalConstraint,

    preSolve:function(timeStep,invTimeStep){
        this.ax=this.limitMotor.axis.x;
        this.ay=this.limitMotor.axis.y;
        this.az=this.limitMotor.axis.z;
        this.lowerLimit=this.limitMotor.lowerLimit;
        this.upperLimit=this.limitMotor.upperLimit;
        this.motorSpeed=this.limitMotor.motorSpeed;
        this.maxMotorForce=this.limitMotor.maxMotorForce;
        this.enableMotor=this.maxMotorForce>0;

        var ti1 = this.i1.elements;
        var ti2 = this.i2.elements;
        this.i1e00=ti1[0];
        this.i1e01=ti1[1];
        this.i1e02=ti1[2];
        this.i1e10=ti1[3];
        this.i1e11=ti1[4];
        this.i1e12=ti1[5];
        this.i1e20=ti1[6];
        this.i1e21=ti1[7];
        this.i1e22=ti1[8];

        this.i2e00=ti2[0];
        this.i2e01=ti2[1];
        this.i2e02=ti2[2];
        this.i2e10=ti2[3];
        this.i2e11=ti2[4];
        this.i2e12=ti2[5];
        this.i2e20=ti2[6];
        this.i2e21=ti2[7];
        this.i2e22=ti2[8];

        var frequency=this.limitMotor.frequency;
        var enableSpring=frequency>0;
        var enableLimit=this.lowerLimit<=this.upperLimit;
        var angle=this.limitMotor.angle;
        if(enableLimit){
            if(this.lowerLimit==this.upperLimit){
                if(this.limitState!=0){
                    this.limitState=0;
                    this.limitImpulse=0;
                }
                this.limitVelocity=this.lowerLimit-angle;
            }else if(angle<this.lowerLimit){
                if(this.limitState!=-1){
                    this.limitState=-1;
                    this.limitImpulse=0;
                }
                this.limitVelocity=this.lowerLimit-angle;
            }else if(angle>this.upperLimit){
                if(this.limitState!=1){
                    this.limitState=1;
                    this.limitImpulse=0;
                }
                this.limitVelocity=this.upperLimit-angle;
            }else{
                this.limitState=2;
                this.limitImpulse=0;
                this.limitVelocity=0;
            }
            if(!enableSpring){
                if(this.limitVelocity>0.02)this.limitVelocity-=0.02;
                else if(this.limitVelocity<-0.02)this.limitVelocity+=0.02;
                else this.limitVelocity=0;
            }
        }else{
            this.limitState=2;
            this.limitImpulse=0;
        }
        if(this.enableMotor&&(this.limitState!=0||enableSpring)){
            this.maxMotorImpulse=this.maxMotorForce*timeStep;
        }else{
            this.motorImpulse=0;
            this.maxMotorImpulse=0;
        }

        this.a1x=this.ax*this.i1e00+this.ay*this.i1e01+this.az*this.i1e02;
        this.a1y=this.ax*this.i1e10+this.ay*this.i1e11+this.az*this.i1e12;
        this.a1z=this.ax*this.i1e20+this.ay*this.i1e21+this.az*this.i1e22;
        this.a2x=this.ax*this.i2e00+this.ay*this.i2e01+this.az*this.i2e02;
        this.a2y=this.ax*this.i2e10+this.ay*this.i2e11+this.az*this.i2e12;
        this.a2z=this.ax*this.i2e20+this.ay*this.i2e21+this.az*this.i2e22;
        this.motorDenom=this.ax*(this.a1x+this.a2x)+this.ay*(this.a1y+this.a2y)+this.az*(this.a1z+this.a2z);
        this.invMotorDenom=1/this.motorDenom;

        if(enableSpring&&this.limitState!=2){
            var omega=6.2831853*frequency;
            var k=omega*omega*timeStep;
            var dmp=invTimeStep/(k+2*this.limitMotor.dampingRatio*omega);
            this.cfm=this.motorDenom*dmp;
            this.limitVelocity*=k*dmp;
        }else{
            this.cfm=0;
            this.limitVelocity*=invTimeStep*0.05;
        }

        this.invDenom=1/(this.motorDenom+this.cfm);
        
        this.limitImpulse*=0.95;
        this.motorImpulse*=0.95;
        var totalImpulse=this.limitImpulse+this.motorImpulse;
        this.a1.x+=totalImpulse*this.a1x;
        this.a1.y+=totalImpulse*this.a1y;
        this.a1.z+=totalImpulse*this.a1z;
        this.a2.x-=totalImpulse*this.a2x;
        this.a2.y-=totalImpulse*this.a2y;
        this.a2.z-=totalImpulse*this.a2z;
    },
    solve:function(){
        var rvn=this.ax*(this.a2.x-this.a1.x)+this.ay*(this.a2.y-this.a1.y)+this.az*(this.a2.z-this.a1.z);

        // motor part
        var newMotorImpulse;
        if(this.enableMotor){
            newMotorImpulse=(rvn-this.motorSpeed)*this.invMotorDenom;
            var oldMotorImpulse=this.motorImpulse;
            this.motorImpulse+=newMotorImpulse;
            if(this.motorImpulse>this.maxMotorImpulse)this.motorImpulse=this.maxMotorImpulse;
            else if(this.motorImpulse<-this.maxMotorImpulse)this.motorImpulse=-this.maxMotorImpulse;
            newMotorImpulse=this.motorImpulse-oldMotorImpulse;
            rvn-=newMotorImpulse*this.motorDenom;
        }else newMotorImpulse=0;

        // limit part
        var newLimitImpulse;
        if(this.limitState!=2){
            newLimitImpulse=(rvn-this.limitVelocity-this.limitImpulse*this.cfm)*this.invDenom;
            var oldLimitImpulse=this.limitImpulse;
            this.limitImpulse+=newLimitImpulse;
            if(this.limitImpulse*this.limitState<0)this.limitImpulse=0;
            newLimitImpulse=this.limitImpulse-oldLimitImpulse;
        }else newLimitImpulse=0;

        var totalImpulse=newLimitImpulse+newMotorImpulse;
        this.a1.x+=totalImpulse*this.a1x;
        this.a1.y+=totalImpulse*this.a1y;
        this.a1.z+=totalImpulse*this.a1z;
        this.a2.x-=totalImpulse*this.a2x;
        this.a2.y-=totalImpulse*this.a2y;
        this.a2.z-=totalImpulse*this.a2z;
    }
}
/**
* A three-axis translational constraint for various joints.
* @author saharan
*/
OIMO.Translational3Constraint = function(joint,limitMotor1,limitMotor2,limitMotor3){
    this.m1=NaN;
    this.m2=NaN;
    this.i1e00=NaN;
    this.i1e01=NaN;
    this.i1e02=NaN;
    this.i1e10=NaN;
    this.i1e11=NaN;
    this.i1e12=NaN;
    this.i1e20=NaN;
    this.i1e21=NaN;
    this.i1e22=NaN;
    this.i2e00=NaN;
    this.i2e01=NaN;
    this.i2e02=NaN;
    this.i2e10=NaN;
    this.i2e11=NaN;
    this.i2e12=NaN;
    this.i2e20=NaN;
    this.i2e21=NaN;
    this.i2e22=NaN;
    this.ax1=NaN;
    this.ay1=NaN;
    this.az1=NaN;
    this.ax2=NaN;
    this.ay2=NaN;
    this.az2=NaN;
    this.ax3=NaN;
    this.ay3=NaN;
    this.az3=NaN;
    this.r1x=NaN;
    this.r1y=NaN;
    this.r1z=NaN;
    this.r2x=NaN;
    this.r2y=NaN;
    this.r2z=NaN;
    this.t1x1=NaN;// jacobians
    this.t1y1=NaN;
    this.t1z1=NaN;
    this.t2x1=NaN;
    this.t2y1=NaN;
    this.t2z1=NaN;
    this.l1x1=NaN;
    this.l1y1=NaN;
    this.l1z1=NaN;
    this.l2x1=NaN;
    this.l2y1=NaN;
    this.l2z1=NaN;
    this.a1x1=NaN;
    this.a1y1=NaN;
    this.a1z1=NaN;
    this.a2x1=NaN;
    this.a2y1=NaN;
    this.a2z1=NaN;
    this.t1x2=NaN;
    this.t1y2=NaN;
    this.t1z2=NaN;
    this.t2x2=NaN;
    this.t2y2=NaN;
    this.t2z2=NaN;
    this.l1x2=NaN;
    this.l1y2=NaN;
    this.l1z2=NaN;
    this.l2x2=NaN;
    this.l2y2=NaN;
    this.l2z2=NaN;
    this.a1x2=NaN;
    this.a1y2=NaN;
    this.a1z2=NaN;
    this.a2x2=NaN;
    this.a2y2=NaN;
    this.a2z2=NaN;
    this.t1x3=NaN;
    this.t1y3=NaN;
    this.t1z3=NaN;
    this.t2x3=NaN;
    this.t2y3=NaN;
    this.t2z3=NaN;
    this.l1x3=NaN;
    this.l1y3=NaN;
    this.l1z3=NaN;
    this.l2x3=NaN;
    this.l2y3=NaN;
    this.l2z3=NaN;
    this.a1x3=NaN;
    this.a1y3=NaN;
    this.a1z3=NaN;
    this.a2x3=NaN;
    this.a2y3=NaN;
    this.a2z3=NaN;
    this.lowerLimit1=NaN;
    this.upperLimit1=NaN;
    this.limitVelocity1=NaN;
    this.limitState1=0; // -1: at lower, 0: locked, 1: at upper, 2: unlimited
    this.enableMotor1=false;
    this.motorSpeed1=NaN;
    this.maxMotorForce1=NaN;
    this.maxMotorImpulse1=NaN;
    this.lowerLimit2=NaN;
    this.upperLimit2=NaN;
    this.limitVelocity2=NaN;
    this.limitState2=0; // -1: at lower, 0: locked, 1: at upper, 2: unlimited
    this.enableMotor2=false;
    this.motorSpeed2=NaN;
    this.maxMotorForce2=NaN;
    this.maxMotorImpulse2=NaN;
    this.lowerLimit3=NaN;
    this.upperLimit3=NaN;
    this.limitVelocity3=NaN;
    this.limitState3=0; // -1: at lower, 0: locked, 1: at upper, 2: unlimited
    this.enableMotor3=false;
    this.motorSpeed3=NaN;
    this.maxMotorForce3=NaN;
    this.maxMotorImpulse3=NaN;
    this.k00=NaN; // K = J*M*JT
    this.k01=NaN;
    this.k02=NaN;
    this.k10=NaN;
    this.k11=NaN;
    this.k12=NaN;
    this.k20=NaN;
    this.k21=NaN;
    this.k22=NaN;
    this.kv00=NaN; // diagonals without CFMs
    this.kv11=NaN;
    this.kv22=NaN;
    this.dv00=NaN; // ...inverted
    this.dv11=NaN;
    this.dv22=NaN;
    this.d00=NaN; // K^-1
    this.d01=NaN;
    this.d02=NaN;
    this.d10=NaN;
    this.d11=NaN;
    this.d12=NaN;
    this.d20=NaN;
    this.d21=NaN;
    this.d22=NaN;

    this.limitMotor1=limitMotor1;
    this.limitMotor2=limitMotor2;
    this.limitMotor3=limitMotor3;
    this.b1=joint.body1;
    this.b2=joint.body2;
    this.p1=joint.anchorPoint1;
    this.p2=joint.anchorPoint2;
    this.r1=joint.relativeAnchorPoint1;
    this.r2=joint.relativeAnchorPoint2;
    this.l1=this.b1.linearVelocity;
    this.l2=this.b2.linearVelocity;
    this.a1=this.b1.angularVelocity;
    this.a2=this.b2.angularVelocity;
    this.i1=this.b1.inverseInertia;
    this.i2=this.b2.inverseInertia;
    this.limitImpulse1=0;
    this.motorImpulse1=0;
    this.limitImpulse2=0;
    this.motorImpulse2=0;
    this.limitImpulse3=0;
    this.motorImpulse3=0;
    this.cfm1=0;// Constraint Force Mixing
    this.cfm2=0;
    this.cfm3=0;
    this.weight=-1;
}
OIMO.Translational3Constraint.prototype = {
    constructor: OIMO.Translational3Constraint,

    preSolve:function(timeStep,invTimeStep){
        this.ax1=this.limitMotor1.axis.x;
        this.ay1=this.limitMotor1.axis.y;
        this.az1=this.limitMotor1.axis.z;
        this.ax2=this.limitMotor2.axis.x;
        this.ay2=this.limitMotor2.axis.y;
        this.az2=this.limitMotor2.axis.z;
        this.ax3=this.limitMotor3.axis.x;
        this.ay3=this.limitMotor3.axis.y;
        this.az3=this.limitMotor3.axis.z;
        this.lowerLimit1=this.limitMotor1.lowerLimit;
        this.upperLimit1=this.limitMotor1.upperLimit;
        this.motorSpeed1=this.limitMotor1.motorSpeed;
        this.maxMotorForce1=this.limitMotor1.maxMotorForce;
        this.enableMotor1=this.maxMotorForce1>0;
        this.lowerLimit2=this.limitMotor2.lowerLimit;
        this.upperLimit2=this.limitMotor2.upperLimit;
        this.motorSpeed2=this.limitMotor2.motorSpeed;
        this.maxMotorForce2=this.limitMotor2.maxMotorForce;
        this.enableMotor2=this.maxMotorForce2>0;
        this.lowerLimit3=this.limitMotor3.lowerLimit;
        this.upperLimit3=this.limitMotor3.upperLimit;
        this.motorSpeed3=this.limitMotor3.motorSpeed;
        this.maxMotorForce3=this.limitMotor3.maxMotorForce;
        this.enableMotor3=this.maxMotorForce3>0;
        this.m1=this.b1.inverseMass;
        this.m2=this.b2.inverseMass;

        var ti1 = this.i1.elements;
        var ti2 = this.i2.elements;
        this.i1e00=ti1[0];
        this.i1e01=ti1[1];
        this.i1e02=ti1[2];
        this.i1e10=ti1[3];
        this.i1e11=ti1[4];
        this.i1e12=ti1[5];
        this.i1e20=ti1[6];
        this.i1e21=ti1[7];
        this.i1e22=ti1[8];

        this.i2e00=ti2[0];
        this.i2e01=ti2[1];
        this.i2e02=ti2[2];
        this.i2e10=ti2[3];
        this.i2e11=ti2[4];
        this.i2e12=ti2[5];
        this.i2e20=ti2[6];
        this.i2e21=ti2[7];
        this.i2e22=ti2[8];

        var dx=this.p2.x-this.p1.x;
        var dy=this.p2.y-this.p1.y;
        var dz=this.p2.z-this.p1.z;
        var d1=dx*this.ax1+dy*this.ay1+dz*this.az1;
        var d2=dx*this.ax2+dy*this.ay2+dz*this.az2;
        var d3=dx*this.ax3+dy*this.ay3+dz*this.az3;
        var frequency1=this.limitMotor1.frequency;
        var frequency2=this.limitMotor2.frequency;
        var frequency3=this.limitMotor3.frequency;
        var enableSpring1=frequency1>0;
        var enableSpring2=frequency2>0;
        var enableSpring3=frequency3>0;
        var enableLimit1=this.lowerLimit1<=this.upperLimit1;
        var enableLimit2=this.lowerLimit2<=this.upperLimit2;
        var enableLimit3=this.lowerLimit3<=this.upperLimit3;

        // for stability
        if(enableSpring1&&d1>20||d1<-20){
            enableSpring1=false;
        }
        if(enableSpring2&&d2>20||d2<-20){
            enableSpring2=false;
        }
        if(enableSpring3&&d3>20||d3<-20){
            enableSpring3=false;
        }

        if(enableLimit1){
            if(this.lowerLimit1==this.upperLimit1){
                if(this.limitState1!=0){
                    this.limitState1=0;
                    this.limitImpulse1=0;
                }
                this.limitVelocity1=this.lowerLimit1-d1;
                if(!enableSpring1)d1=this.lowerLimit1;
            }else if(d1<this.lowerLimit1){
                if(this.limitState1!=-1){
                    this.limitState1=-1;
                    this.limitImpulse1=0;
                }
                this.limitVelocity1=this.lowerLimit1-d1;
                if(!enableSpring1)d1=this.lowerLimit1;
            }else if(d1>this.upperLimit1){
                if(this.limitState1!=1){
                    this.limitState1=1;
                    this.limitImpulse1=0;
                }
                this.limitVelocity1=this.upperLimit1-d1;
                if(!enableSpring1)d1=this.upperLimit1;
            }else{
                this.limitState1=2;
                this.limitImpulse1=0;
                this.limitVelocity1=0;
            }
            if(!enableSpring1){
                if(this.limitVelocity1>0.005)this.limitVelocity1-=0.005;
                else if(this.limitVelocity1<-0.005)this.limitVelocity1+=0.005;
                else this.limitVelocity1=0;
            }
        }else{
            this.limitState1=2;
            this.limitImpulse1=0;
        }

        if(enableLimit2){
            if(this.lowerLimit2==this.upperLimit2){
                if(this.limitState2!=0){
                    this.limitState2=0;
                    this.limitImpulse2=0;
                }
                this.limitVelocity2=this.lowerLimit2-d2;
                if(!enableSpring2)d2=this.lowerLimit2;
            }else if(d2<this.lowerLimit2){
                if(this.limitState2!=-1){
                    this.limitState2=-1;
                    this.limitImpulse2=0;
                }
                this.limitVelocity2=this.lowerLimit2-d2;
                if(!enableSpring2)d2=this.lowerLimit2;
            }else if(d2>this.upperLimit2){
                if(this.limitState2!=1){
                    this.limitState2=1;
                    this.limitImpulse2=0;
                }
                this.limitVelocity2=this.upperLimit2-d2;
                if(!enableSpring2)d2=this.upperLimit2;
            }else{
                this.limitState2=2;
                this.limitImpulse2=0;
                this.limitVelocity2=0;
            }
            if(!enableSpring2){
                if(this.limitVelocity2>0.005)this.limitVelocity2-=0.005;
                else if(this.limitVelocity2<-0.005)this.limitVelocity2+=0.005;
                else this.limitVelocity2=0;
            }
        }else{
            this.limitState2=2;
            this.limitImpulse2=0;
        }

        if(enableLimit3){
            if(this.lowerLimit3==this.upperLimit3){
                if(this.limitState3!=0){
                    this.limitState3=0;
                    this.limitImpulse3=0;
                }
                this.limitVelocity3=this.lowerLimit3-d3;
                if(!enableSpring3)d3=this.lowerLimit3;
                }else if(d3<this.lowerLimit3){
                if(this.limitState3!=-1){
                    this.limitState3=-1;
                    this.limitImpulse3=0;
                }
                this.limitVelocity3=this.lowerLimit3-d3;
                if(!enableSpring3)d3=this.lowerLimit3;
            }else if(d3>this.upperLimit3){
                if(this.limitState3!=1){
                    this.limitState3=1;
                    this.limitImpulse3=0;
                }
                this.limitVelocity3=this.upperLimit3-d3;
                if(!enableSpring3)d3=this.upperLimit3;
            }else{
                this.limitState3=2;
                this.limitImpulse3=0;
                this.limitVelocity3=0;
            }
            if(!enableSpring3){
                if(this.limitVelocity3>0.005)this.limitVelocity3-=0.005;
                else if(this.limitVelocity3<-0.005)this.limitVelocity3+=0.005;
                else this.limitVelocity3=0;
            }
        }else{
            this.limitState3=2;
            this.limitImpulse3=0;
        }

        if(this.enableMotor1&&(this.limitState1!=0||enableSpring1)){
            this.maxMotorImpulse1=this.maxMotorForce1*timeStep;
        }else{
            this.motorImpulse1=0;
            this.maxMotorImpulse1=0;
        }

        if(this.enableMotor2&&(this.limitState2!=0||enableSpring2)){
            this.maxMotorImpulse2=this.maxMotorForce2*timeStep;
        }else{
            this.motorImpulse2=0;
            this.maxMotorImpulse2=0;
        }

        if(this.enableMotor3&&(this.limitState3!=0||enableSpring3)){
            this.maxMotorImpulse3=this.maxMotorForce3*timeStep;
        }else{
            this.motorImpulse3=0;
            this.maxMotorImpulse3=0;
        }
        
        var rdx=d1*this.ax1+d2*this.ax2+d3*this.ax2;
        var rdy=d1*this.ay1+d2*this.ay2+d3*this.ay2;
        var rdz=d1*this.az1+d2*this.az2+d3*this.az2;
        var w1=this.m2/(this.m1+this.m2);
        if(this.weight>=0)w1=this.weight; // use given weight
        var w2=1-w1;
        this.r1x=this.r1.x+rdx*w1;
        this.r1y=this.r1.y+rdy*w1;
        this.r1z=this.r1.z+rdz*w1;
        this.r2x=this.r2.x-rdx*w2;
        this.r2y=this.r2.y-rdy*w2;
        this.r2z=this.r2.z-rdz*w2;

        // build jacobians
        this.t1x1=this.r1y*this.az1-this.r1z*this.ay1;
        this.t1y1=this.r1z*this.ax1-this.r1x*this.az1;
        this.t1z1=this.r1x*this.ay1-this.r1y*this.ax1;
        this.t2x1=this.r2y*this.az1-this.r2z*this.ay1;
        this.t2y1=this.r2z*this.ax1-this.r2x*this.az1;
        this.t2z1=this.r2x*this.ay1-this.r2y*this.ax1;
        this.l1x1=this.ax1*this.m1;
        this.l1y1=this.ay1*this.m1;
        this.l1z1=this.az1*this.m1;
        this.l2x1=this.ax1*this.m2;
        this.l2y1=this.ay1*this.m2;
        this.l2z1=this.az1*this.m2;
        this.a1x1=this.t1x1*this.i1e00+this.t1y1*this.i1e01+this.t1z1*this.i1e02;
        this.a1y1=this.t1x1*this.i1e10+this.t1y1*this.i1e11+this.t1z1*this.i1e12;
        this.a1z1=this.t1x1*this.i1e20+this.t1y1*this.i1e21+this.t1z1*this.i1e22;
        this.a2x1=this.t2x1*this.i2e00+this.t2y1*this.i2e01+this.t2z1*this.i2e02;
        this.a2y1=this.t2x1*this.i2e10+this.t2y1*this.i2e11+this.t2z1*this.i2e12;
        this.a2z1=this.t2x1*this.i2e20+this.t2y1*this.i2e21+this.t2z1*this.i2e22;

        this.t1x2=this.r1y*this.az2-this.r1z*this.ay2;
        this.t1y2=this.r1z*this.ax2-this.r1x*this.az2;
        this.t1z2=this.r1x*this.ay2-this.r1y*this.ax2;
        this.t2x2=this.r2y*this.az2-this.r2z*this.ay2;
        this.t2y2=this.r2z*this.ax2-this.r2x*this.az2;
        this.t2z2=this.r2x*this.ay2-this.r2y*this.ax2;
        this.l1x2=this.ax2*this.m1;
        this.l1y2=this.ay2*this.m1;
        this.l1z2=this.az2*this.m1;
        this.l2x2=this.ax2*this.m2;
        this.l2y2=this.ay2*this.m2;
        this.l2z2=this.az2*this.m2;
        this.a1x2=this.t1x2*this.i1e00+this.t1y2*this.i1e01+this.t1z2*this.i1e02;
        this.a1y2=this.t1x2*this.i1e10+this.t1y2*this.i1e11+this.t1z2*this.i1e12;
        this.a1z2=this.t1x2*this.i1e20+this.t1y2*this.i1e21+this.t1z2*this.i1e22;
        this.a2x2=this.t2x2*this.i2e00+this.t2y2*this.i2e01+this.t2z2*this.i2e02;
        this.a2y2=this.t2x2*this.i2e10+this.t2y2*this.i2e11+this.t2z2*this.i2e12;
        this.a2z2=this.t2x2*this.i2e20+this.t2y2*this.i2e21+this.t2z2*this.i2e22;

        this.t1x3=this.r1y*this.az3-this.r1z*this.ay3;
        this.t1y3=this.r1z*this.ax3-this.r1x*this.az3;
        this.t1z3=this.r1x*this.ay3-this.r1y*this.ax3;
        this.t2x3=this.r2y*this.az3-this.r2z*this.ay3;
        this.t2y3=this.r2z*this.ax3-this.r2x*this.az3;
        this.t2z3=this.r2x*this.ay3-this.r2y*this.ax3;
        this.l1x3=this.ax3*this.m1;
        this.l1y3=this.ay3*this.m1;
        this.l1z3=this.az3*this.m1;
        this.l2x3=this.ax3*this.m2;
        this.l2y3=this.ay3*this.m2;
        this.l2z3=this.az3*this.m2;
        this.a1x3=this.t1x3*this.i1e00+this.t1y3*this.i1e01+this.t1z3*this.i1e02;
        this.a1y3=this.t1x3*this.i1e10+this.t1y3*this.i1e11+this.t1z3*this.i1e12;
        this.a1z3=this.t1x3*this.i1e20+this.t1y3*this.i1e21+this.t1z3*this.i1e22;
        this.a2x3=this.t2x3*this.i2e00+this.t2y3*this.i2e01+this.t2z3*this.i2e02;
        this.a2y3=this.t2x3*this.i2e10+this.t2y3*this.i2e11+this.t2z3*this.i2e12;
        this.a2z3=this.t2x3*this.i2e20+this.t2y3*this.i2e21+this.t2z3*this.i2e22;

        // build an impulse matrix
        var m12=this.m1+this.m2;
        this.k00=(this.ax1*this.ax1+this.ay1*this.ay1+this.az1*this.az1)*m12;
        this.k01=(this.ax1*this.ax2+this.ay1*this.ay2+this.az1*this.az2)*m12;
        this.k02=(this.ax1*this.ax3+this.ay1*this.ay3+this.az1*this.az3)*m12;
        this.k10=(this.ax2*this.ax1+this.ay2*this.ay1+this.az2*this.az1)*m12;
        this.k11=(this.ax2*this.ax2+this.ay2*this.ay2+this.az2*this.az2)*m12;
        this.k12=(this.ax2*this.ax3+this.ay2*this.ay3+this.az2*this.az3)*m12;
        this.k20=(this.ax3*this.ax1+this.ay3*this.ay1+this.az3*this.az1)*m12;
        this.k21=(this.ax3*this.ax2+this.ay3*this.ay2+this.az3*this.az2)*m12;
        this.k22=(this.ax3*this.ax3+this.ay3*this.ay3+this.az3*this.az3)*m12;

        this.k00+=this.t1x1*this.a1x1+this.t1y1*this.a1y1+this.t1z1*this.a1z1;
        this.k01+=this.t1x1*this.a1x2+this.t1y1*this.a1y2+this.t1z1*this.a1z2;
        this.k02+=this.t1x1*this.a1x3+this.t1y1*this.a1y3+this.t1z1*this.a1z3;
        this.k10+=this.t1x2*this.a1x1+this.t1y2*this.a1y1+this.t1z2*this.a1z1;
        this.k11+=this.t1x2*this.a1x2+this.t1y2*this.a1y2+this.t1z2*this.a1z2;
        this.k12+=this.t1x2*this.a1x3+this.t1y2*this.a1y3+this.t1z2*this.a1z3;
        this.k20+=this.t1x3*this.a1x1+this.t1y3*this.a1y1+this.t1z3*this.a1z1;
        this.k21+=this.t1x3*this.a1x2+this.t1y3*this.a1y2+this.t1z3*this.a1z2;
        this.k22+=this.t1x3*this.a1x3+this.t1y3*this.a1y3+this.t1z3*this.a1z3;

        this.k00+=this.t2x1*this.a2x1+this.t2y1*this.a2y1+this.t2z1*this.a2z1;
        this.k01+=this.t2x1*this.a2x2+this.t2y1*this.a2y2+this.t2z1*this.a2z2;
        this.k02+=this.t2x1*this.a2x3+this.t2y1*this.a2y3+this.t2z1*this.a2z3;
        this.k10+=this.t2x2*this.a2x1+this.t2y2*this.a2y1+this.t2z2*this.a2z1;
        this.k11+=this.t2x2*this.a2x2+this.t2y2*this.a2y2+this.t2z2*this.a2z2;
        this.k12+=this.t2x2*this.a2x3+this.t2y2*this.a2y3+this.t2z2*this.a2z3;
        this.k20+=this.t2x3*this.a2x1+this.t2y3*this.a2y1+this.t2z3*this.a2z1;
        this.k21+=this.t2x3*this.a2x2+this.t2y3*this.a2y2+this.t2z3*this.a2z2;
        this.k22+=this.t2x3*this.a2x3+this.t2y3*this.a2y3+this.t2z3*this.a2z3;

        this.kv00=this.k00;
        this.kv11=this.k11;
        this.kv22=this.k22;

        this.dv00=1/this.kv00;
        this.dv11=1/this.kv11;
        this.dv22=1/this.kv22;

        if(enableSpring1&&this.limitState1!=2){
            var omega=6.2831853*frequency1;
            var k=omega*omega*timeStep;
            var dmp=invTimeStep/(k+2*this.limitMotor1.dampingRatio*omega);
            this.cfm1=this.kv00*dmp;
            this.limitVelocity1*=k*dmp;
        }else{
            this.cfm1=0;
            this.limitVelocity1*=invTimeStep*0.05;
        }
        if(enableSpring2&&this.limitState2!=2){
            omega=6.2831853*frequency2;
            k=omega*omega*timeStep;
            dmp=invTimeStep/(k+2*this.limitMotor2.dampingRatio*omega);
            this.cfm2=this.kv11*dmp;
            this.limitVelocity2*=k*dmp;
        }else{
            this.cfm2=0;
            this.limitVelocity2*=invTimeStep*0.05;
        }
        if(enableSpring3&&this.limitState3!=2){
            omega=6.2831853*frequency3;
            k=omega*omega*timeStep;
            dmp=invTimeStep/(k+2*this.limitMotor3.dampingRatio*omega);
            this.cfm3=this.kv22*dmp;
            this.limitVelocity3*=k*dmp;
        }else{
            this.cfm3=0;
            this.limitVelocity3*=invTimeStep*0.05;
        }
        this.k00+=this.cfm1;
        this.k11+=this.cfm2;
        this.k22+=this.cfm3;

        var inv=1/(
        this.k00*(this.k11*this.k22-this.k21*this.k12)+
        this.k10*(this.k21*this.k02-this.k01*this.k22)+
        this.k20*(this.k01*this.k12-this.k11*this.k02)
        );
        this.d00=(this.k11*this.k22-this.k12*this.k21)*inv;
        this.d01=(this.k02*this.k21-this.k01*this.k22)*inv;
        this.d02=(this.k01*this.k12-this.k02*this.k11)*inv;
        this.d10=(this.k12*this.k20-this.k10*this.k22)*inv;
        this.d11=(this.k00*this.k22-this.k02*this.k20)*inv;
        this.d12=(this.k02*this.k10-this.k00*this.k12)*inv;
        this.d20=(this.k10*this.k21-this.k11*this.k20)*inv;
        this.d21=(this.k01*this.k20-this.k00*this.k21)*inv;
        this.d22=(this.k00*this.k11-this.k01*this.k10)*inv;

        // warm starting
        var totalImpulse1=this.limitImpulse1+this.motorImpulse1;
        var totalImpulse2=this.limitImpulse2+this.motorImpulse2;
        var totalImpulse3=this.limitImpulse3+this.motorImpulse3;
        this.l1.x+=totalImpulse1*this.l1x1+totalImpulse2*this.l1x2+totalImpulse3*this.l1x3;
        this.l1.y+=totalImpulse1*this.l1y1+totalImpulse2*this.l1y2+totalImpulse3*this.l1y3;
        this.l1.z+=totalImpulse1*this.l1z1+totalImpulse2*this.l1z2+totalImpulse3*this.l1z3;
        this.a1.x+=totalImpulse1*this.a1x1+totalImpulse2*this.a1x2+totalImpulse3*this.a1x3;
        this.a1.y+=totalImpulse1*this.a1y1+totalImpulse2*this.a1y2+totalImpulse3*this.a1y3;
        this.a1.z+=totalImpulse1*this.a1z1+totalImpulse2*this.a1z2+totalImpulse3*this.a1z3;
        this.l2.x-=totalImpulse1*this.l2x1+totalImpulse2*this.l2x2+totalImpulse3*this.l2x3;
        this.l2.y-=totalImpulse1*this.l2y1+totalImpulse2*this.l2y2+totalImpulse3*this.l2y3;
        this.l2.z-=totalImpulse1*this.l2z1+totalImpulse2*this.l2z2+totalImpulse3*this.l2z3;
        this.a2.x-=totalImpulse1*this.a2x1+totalImpulse2*this.a2x2+totalImpulse3*this.a2x3;
        this.a2.y-=totalImpulse1*this.a2y1+totalImpulse2*this.a2y2+totalImpulse3*this.a2y3;
        this.a2.z-=totalImpulse1*this.a2z1+totalImpulse2*this.a2z2+totalImpulse3*this.a2z3;
    },

    solve:function(){
        var rvx=this.l2.x-this.l1.x+this.a2.y*this.r2z-this.a2.z*this.r2y-this.a1.y*this.r1z+this.a1.z*this.r1y;
        var rvy=this.l2.y-this.l1.y+this.a2.z*this.r2x-this.a2.x*this.r2z-this.a1.z*this.r1x+this.a1.x*this.r1z;
        var rvz=this.l2.z-this.l1.z+this.a2.x*this.r2y-this.a2.y*this.r2x-this.a1.x*this.r1y+this.a1.y*this.r1x;
        var rvn1=rvx*this.ax1+rvy*this.ay1+rvz*this.az1;
        var rvn2=rvx*this.ax2+rvy*this.ay2+rvz*this.az2;
        var rvn3=rvx*this.ax3+rvy*this.ay3+rvz*this.az3;
        var oldMotorImpulse1=this.motorImpulse1;
        var oldMotorImpulse2=this.motorImpulse2;
        var oldMotorImpulse3=this.motorImpulse3;
        var dMotorImpulse1=0;
        var dMotorImpulse2=0;
        var dMotorImpulse3=0;
        if(this.enableMotor1){
            dMotorImpulse1=(rvn1-this.motorSpeed1)*this.dv00;
            this.motorImpulse1+=dMotorImpulse1;
            if(this.motorImpulse1>this.maxMotorImpulse1){ // clamp motor impulse
                this.motorImpulse1=this.maxMotorImpulse1;
            }else if(this.motorImpulse1<-this.maxMotorImpulse1){
                this.motorImpulse1=-this.maxMotorImpulse1;
            }
            dMotorImpulse1=this.motorImpulse1-oldMotorImpulse1;
        }
        if(this.enableMotor2){
            dMotorImpulse2=(rvn2-this.motorSpeed2)*this.dv11;
            this.motorImpulse2+=dMotorImpulse2;
            if(this.motorImpulse2>this.maxMotorImpulse2){ // clamp motor impulse
                this.motorImpulse2=this.maxMotorImpulse2;
            }else if(this.motorImpulse2<-this.maxMotorImpulse2){
                this.motorImpulse2=-this.maxMotorImpulse2;
            }
            dMotorImpulse2=this.motorImpulse2-oldMotorImpulse2;
        }
        if(this.enableMotor3){
            dMotorImpulse3=(rvn3-this.motorSpeed3)*this.dv22;
            this.motorImpulse3+=dMotorImpulse3;
            if(this.motorImpulse3>this.maxMotorImpulse3){ // clamp motor impulse
                this.motorImpulse3=this.maxMotorImpulse3;
            }else if(this.motorImpulse3<-this.maxMotorImpulse3){
                this.motorImpulse3=-this.maxMotorImpulse3;
            }
            dMotorImpulse3=this.motorImpulse3-oldMotorImpulse3;
        }

        // apply motor impulse to relative velocity
        rvn1+=dMotorImpulse1*this.kv00+dMotorImpulse2*this.k01+dMotorImpulse3*this.k02;
        rvn2+=dMotorImpulse1*this.k10+dMotorImpulse2*this.kv11+dMotorImpulse3*this.k12;
        rvn3+=dMotorImpulse1*this.k20+dMotorImpulse2*this.k21+dMotorImpulse3*this.kv22;

        // subtract target velocity and applied impulse
        rvn1-=this.limitVelocity1+this.limitImpulse1*this.cfm1;
        rvn2-=this.limitVelocity2+this.limitImpulse2*this.cfm2;
        rvn3-=this.limitVelocity3+this.limitImpulse3*this.cfm3;

        var oldLimitImpulse1=this.limitImpulse1;
        var oldLimitImpulse2=this.limitImpulse2;
        var oldLimitImpulse3=this.limitImpulse3;

        var dLimitImpulse1=rvn1*this.d00+rvn2*this.d01+rvn3*this.d02;
        var dLimitImpulse2=rvn1*this.d10+rvn2*this.d11+rvn3*this.d12;
        var dLimitImpulse3=rvn1*this.d20+rvn2*this.d21+rvn3*this.d22;

        this.limitImpulse1+=dLimitImpulse1;
        this.limitImpulse2+=dLimitImpulse2;
        this.limitImpulse3+=dLimitImpulse3;

        // clamp
        var clampState=0;
        if(this.limitState1==2||this.limitImpulse1*this.limitState1<0){
            dLimitImpulse1=-oldLimitImpulse1;
            rvn2+=dLimitImpulse1*this.k10;
            rvn3+=dLimitImpulse1*this.k20;
            clampState|=1;
        }
        if(this.limitState2==2||this.limitImpulse2*this.limitState2<0){
            dLimitImpulse2=-oldLimitImpulse2;
            rvn1+=dLimitImpulse2*this.k01;
            rvn3+=dLimitImpulse2*this.k21;
            clampState|=2;
        }
        if(this.limitState3==2||this.limitImpulse3*this.limitState3<0){
            dLimitImpulse3=-oldLimitImpulse3;
            rvn1+=dLimitImpulse3*this.k02;
            rvn2+=dLimitImpulse3*this.k12;
            clampState|=4;
        }

        // update un-clamped impulse
        // TODO: isolate division
        var det;
        switch(clampState){
            case 1:// update 2 3
            det=1/(this.k11*this.k22-this.k12*this.k21);
            dLimitImpulse2=(this.k22*rvn2+-this.k12*rvn3)*det;
            dLimitImpulse3=(-this.k21*rvn2+this.k11*rvn3)*det;
            break;
            case 2:// update 1 3
            det=1/(this.k00*this.k22-this.k02*this.k20);
            dLimitImpulse1=(this.k22*rvn1+-this.k02*rvn3)*det;
            dLimitImpulse3=(-this.k20*rvn1+this.k00*rvn3)*det;
            break;
            case 3:// update 3
            dLimitImpulse3=rvn3/this.k22;
            break;
            case 4:// update 1 2
            det=1/(this.k00*this.k11-this.k01*this.k10);
            dLimitImpulse1=(this.k11*rvn1+-this.k01*rvn2)*det;
            dLimitImpulse2=(-this.k10*rvn1+this.k00*rvn2)*det;
            break;
            case 5:// update 2
            dLimitImpulse2=rvn2/this.k11;
            break;
            case 6:// update 1
            dLimitImpulse1=rvn1/this.k00;
            break;
        }

        this.limitImpulse1=oldLimitImpulse1+dLimitImpulse1;
        this.limitImpulse2=oldLimitImpulse2+dLimitImpulse2;
        this.limitImpulse3=oldLimitImpulse3+dLimitImpulse3;

        var dImpulse1=dMotorImpulse1+dLimitImpulse1;
        var dImpulse2=dMotorImpulse2+dLimitImpulse2;
        var dImpulse3=dMotorImpulse3+dLimitImpulse3;

        // apply impulse
        this.l1.x+=dImpulse1*this.l1x1+dImpulse2*this.l1x2+dImpulse3*this.l1x3;
        this.l1.y+=dImpulse1*this.l1y1+dImpulse2*this.l1y2+dImpulse3*this.l1y3;
        this.l1.z+=dImpulse1*this.l1z1+dImpulse2*this.l1z2+dImpulse3*this.l1z3;
        this.a1.x+=dImpulse1*this.a1x1+dImpulse2*this.a1x2+dImpulse3*this.a1x3;
        this.a1.y+=dImpulse1*this.a1y1+dImpulse2*this.a1y2+dImpulse3*this.a1y3;
        this.a1.z+=dImpulse1*this.a1z1+dImpulse2*this.a1z2+dImpulse3*this.a1z3;
        this.l2.x-=dImpulse1*this.l2x1+dImpulse2*this.l2x2+dImpulse3*this.l2x3;
        this.l2.y-=dImpulse1*this.l2y1+dImpulse2*this.l2y2+dImpulse3*this.l2y3;
        this.l2.z-=dImpulse1*this.l2z1+dImpulse2*this.l2z2+dImpulse3*this.l2z3;
        this.a2.x-=dImpulse1*this.a2x1+dImpulse2*this.a2x2+dImpulse3*this.a2x3;
        this.a2.y-=dImpulse1*this.a2y1+dImpulse2*this.a2y2+dImpulse3*this.a2y3;
        this.a2.z-=dImpulse1*this.a2z1+dImpulse2*this.a2z2+dImpulse3*this.a2z3;
    }
}
/**
* A translational constraint for various joints.
* @author saharan
*/
OIMO.TranslationalConstraint = function(joint,limitMotor){
    this.cfm=NaN;
    this.m1=NaN;
    this.m2=NaN;
    this.i1e00=NaN;
    this.i1e01=NaN;
    this.i1e02=NaN;
    this.i1e10=NaN;
    this.i1e11=NaN;
    this.i1e12=NaN;
    this.i1e20=NaN;
    this.i1e21=NaN;
    this.i1e22=NaN;
    this.i2e00=NaN;
    this.i2e01=NaN;
    this.i2e02=NaN;
    this.i2e10=NaN;
    this.i2e11=NaN;
    this.i2e12=NaN;
    this.i2e20=NaN;
    this.i2e21=NaN;
    this.i2e22=NaN;
    this.motorDenom=NaN;
    this.invMotorDenom=NaN;
    this.invDenom=NaN;
    this.ax=NaN;
    this.ay=NaN;
    this.az=NaN;
    this.r1x=NaN;
    this.r1y=NaN;
    this.r1z=NaN;
    this.r2x=NaN;
    this.r2y=NaN;
    this.r2z=NaN;
    this.t1x=NaN;
    this.t1y=NaN;
    this.t1z=NaN;
    this.t2x=NaN;
    this.t2y=NaN;
    this.t2z=NaN;
    this.l1x=NaN;
    this.l1y=NaN;
    this.l1z=NaN;
    this.l2x=NaN;
    this.l2y=NaN;
    this.l2z=NaN;
    this.a1x=NaN;
    this.a1y=NaN;
    this.a1z=NaN;
    this.a2x=NaN;
    this.a2y=NaN;
    this.a2z=NaN;
    this.lowerLimit=NaN;
    this.upperLimit=NaN;
    this.limitVelocity=NaN;
    this.limitState=0; // -1: at lower, 0: locked, 1: at upper, 2: free
    this.enableMotor=false;
    this.motorSpeed=NaN;
    this.maxMotorForce=NaN;
    this.maxMotorImpulse=NaN;

    this.limitMotor=limitMotor;
    this.b1=joint.body1;
    this.b2=joint.body2;
    this.p1=joint.anchorPoint1;
    this.p2=joint.anchorPoint2;
    this.r1=joint.relativeAnchorPoint1;
    this.r2=joint.relativeAnchorPoint2;
    this.l1=this.b1.linearVelocity;
    this.l2=this.b2.linearVelocity;
    this.a1=this.b1.angularVelocity;
    this.a2=this.b2.angularVelocity;
    this.i1=this.b1.inverseInertia;
    this.i2=this.b2.inverseInertia;
    this.limitImpulse=0;
    this.motorImpulse=0;
}
OIMO.TranslationalConstraint.prototype = {
    constructor: OIMO.TranslationalConstraint,

    preSolve:function(timeStep,invTimeStep){
        this.ax=this.limitMotor.axis.x;
        this.ay=this.limitMotor.axis.y;
        this.az=this.limitMotor.axis.z;
        this.lowerLimit=this.limitMotor.lowerLimit;
        this.upperLimit=this.limitMotor.upperLimit;
        this.motorSpeed=this.limitMotor.motorSpeed;
        this.maxMotorForce=this.limitMotor.maxMotorForce;
        this.enableMotor=this.maxMotorForce>0;
        this.m1=this.b1.inverseMass;
        this.m2=this.b2.inverseMass;

        var ti1 = this.i1.elements;
        var ti2 = this.i2.elements;
        this.i1e00=ti1[0];
        this.i1e01=ti1[1];
        this.i1e02=ti1[2];
        this.i1e10=ti1[3];
        this.i1e11=ti1[4];
        this.i1e12=ti1[5];
        this.i1e20=ti1[6];
        this.i1e21=ti1[7];
        this.i1e22=ti1[8];

        this.i2e00=ti2[0];
        this.i2e01=ti2[1];
        this.i2e02=ti2[2];
        this.i2e10=ti2[3];
        this.i2e11=ti2[4];
        this.i2e12=ti2[5];
        this.i2e20=ti2[6];
        this.i2e21=ti2[7];
        this.i2e22=ti2[8];

        var dx=this.p2.x-this.p1.x;
        var dy=this.p2.y-this.p1.y;
        var dz=this.p2.z-this.p1.z;
        var d=dx*this.ax+dy*this.ay+dz*this.az;
        var frequency=this.limitMotor.frequency;
        var enableSpring=frequency>0;
        var enableLimit=this.lowerLimit<=this.upperLimit;
        if(enableSpring&&d>20||d<-20){
            enableSpring=false;
        }

        if(enableLimit){
            if(this.lowerLimit==this.upperLimit){
                if(this.limitState!=0){
                    this.limitState=0;
                    this.limitImpulse=0;
                }
                this.limitVelocity=this.lowerLimit-d;
                if(!enableSpring)d=this.lowerLimit;
            }else if(d<this.lowerLimit){
                if(this.limitState!=-1){
                    this.limitState=-1;
                    this.limitImpulse=0;
                }
                this.limitVelocity=this.lowerLimit-d;
                if(!enableSpring)d=this.lowerLimit;
            }else if(d>this.upperLimit){
                if(this.limitState!=1){
                    this.limitState=1;
                    this.limitImpulse=0;
                }
                this.limitVelocity=this.upperLimit-d;
                if(!enableSpring)d=this.upperLimit;
            }else{
                this.limitState=2;
                this.limitImpulse=0;
                this.limitVelocity=0;
            }
            if(!enableSpring){
                if(this.limitVelocity>0.005)this.limitVelocity-=0.005;
                else if(this.limitVelocity<-0.005)this.limitVelocity+=0.005;
                else this.limitVelocity=0;
            }
        }else{
            this.limitState=2;
            this.limitImpulse=0;
        }

        if(this.enableMotor&&(this.limitState!=0||enableSpring)){
            this.maxMotorImpulse=this.maxMotorForce*timeStep;
        }else{
            this.motorImpulse=0;
            this.maxMotorImpulse=0;
        }

        var rdx=d*this.ax;
        var rdy=d*this.ay;
        var rdz=d*this.az;
        var w1=this.m1/(this.m1+this.m2);
        var w2=1-w1;
        this.r1x=this.r1.x+rdx*w1;
        this.r1y=this.r1.y+rdy*w1;
        this.r1z=this.r1.z+rdz*w1;
        this.r2x=this.r2.x-rdx*w2;
        this.r2y=this.r2.y-rdy*w2;
        this.r2z=this.r2.z-rdz*w2;

        this.t1x=this.r1y*this.az-this.r1z*this.ay;
        this.t1y=this.r1z*this.ax-this.r1x*this.az;
        this.t1z=this.r1x*this.ay-this.r1y*this.ax;
        this.t2x=this.r2y*this.az-this.r2z*this.ay;
        this.t2y=this.r2z*this.ax-this.r2x*this.az;
        this.t2z=this.r2x*this.ay-this.r2y*this.ax;
        this.l1x=this.ax*this.m1;
        this.l1y=this.ay*this.m1;
        this.l1z=this.az*this.m1;
        this.l2x=this.ax*this.m2;
        this.l2y=this.ay*this.m2;
        this.l2z=this.az*this.m2;
        this.a1x=this.t1x*this.i1e00+this.t1y*this.i1e01+this.t1z*this.i1e02;
        this.a1y=this.t1x*this.i1e10+this.t1y*this.i1e11+this.t1z*this.i1e12;
        this.a1z=this.t1x*this.i1e20+this.t1y*this.i1e21+this.t1z*this.i1e22;
        this.a2x=this.t2x*this.i2e00+this.t2y*this.i2e01+this.t2z*this.i2e02;
        this.a2y=this.t2x*this.i2e10+this.t2y*this.i2e11+this.t2z*this.i2e12;
        this.a2z=this.t2x*this.i2e20+this.t2y*this.i2e21+this.t2z*this.i2e22;
        this.motorDenom=
        this.m1+this.m2+
            this.ax*(this.a1y*this.r1z-this.a1z*this.r1y+this.a2y*this.r2z-this.a2z*this.r2y)+
            this.ay*(this.a1z*this.r1x-this.a1x*this.r1z+this.a2z*this.r2x-this.a2x*this.r2z)+
            this.az*(this.a1x*this.r1y-this.a1y*this.r1x+this.a2x*this.r2y-this.a2y*this.r2x);

        this.invMotorDenom=1/this.motorDenom;

        if(enableSpring&&this.limitState!=2){
            var omega=6.2831853*frequency;
            var k=omega*omega*timeStep;
            var dmp=invTimeStep/(k+2*this.limitMotor.dampingRatio*omega);
            this.cfm=this.motorDenom*dmp;
            this.limitVelocity*=k*dmp;
        }else{
            this.cfm=0;
            this.limitVelocity*=invTimeStep*0.05;
        }

        this.invDenom=1/(this.motorDenom+this.cfm);

        var totalImpulse=this.limitImpulse+this.motorImpulse;
        this.l1.x+=totalImpulse*this.l1x;
        this.l1.y+=totalImpulse*this.l1y;
        this.l1.z+=totalImpulse*this.l1z;
        this.a1.x+=totalImpulse*this.a1x;
        this.a1.y+=totalImpulse*this.a1y;
        this.a1.z+=totalImpulse*this.a1z;
        this.l2.x-=totalImpulse*this.l2x;
        this.l2.y-=totalImpulse*this.l2y;
        this.l2.z-=totalImpulse*this.l2z;
        this.a2.x-=totalImpulse*this.a2x;
        this.a2.y-=totalImpulse*this.a2y;
        this.a2.z-=totalImpulse*this.a2z;
    },
    solve:function(){
        var rvn=
            this.ax*(this.l2.x-this.l1.x)+this.ay*(this.l2.y-this.l1.y)+this.az*(this.l2.z-this.l1.z)+
            this.t2x*this.a2.x-this.t1x*this.a1.x+this.t2y*this.a2.y-this.t1y*this.a1.y+this.t2z*this.a2.z-this.t1z*this.a1.z;

        // motor part
        var newMotorImpulse;
        if(this.enableMotor){
            newMotorImpulse=(rvn-this.motorSpeed)*this.invMotorDenom;
            var oldMotorImpulse=this.motorImpulse;
            this.motorImpulse+=newMotorImpulse;
            if(this.motorImpulse>this.maxMotorImpulse)this.motorImpulse=this.maxMotorImpulse;
            else if(this.motorImpulse<-this.maxMotorImpulse)this.motorImpulse=-this.maxMotorImpulse;
            newMotorImpulse=this.motorImpulse-oldMotorImpulse;
            rvn-=newMotorImpulse*this.motorDenom;
        }else newMotorImpulse=0;

        // limit part
        var newLimitImpulse;
        if(this.limitState!=2){
            newLimitImpulse=(rvn-this.limitVelocity-this.limitImpulse*this.cfm)*this.invDenom;
            var oldLimitImpulse=this.limitImpulse;
            this.limitImpulse+=newLimitImpulse;
            if(this.limitImpulse*this.limitState<0)this.limitImpulse=0;
            newLimitImpulse=this.limitImpulse-oldLimitImpulse;
        }else newLimitImpulse=0;
        
        var totalImpulse=newLimitImpulse+newMotorImpulse;
        this.l1.x+=totalImpulse*this.l1x;
        this.l1.y+=totalImpulse*this.l1y;
        this.l1.z+=totalImpulse*this.l1z;
        this.a1.x+=totalImpulse*this.a1x;
        this.a1.y+=totalImpulse*this.a1y;
        this.a1.z+=totalImpulse*this.a1z;
        this.l2.x-=totalImpulse*this.l2x;
        this.l2.y-=totalImpulse*this.l2y;
        this.l2.z-=totalImpulse*this.l2z;
        this.a2.x-=totalImpulse*this.a2x;
        this.a2.y-=totalImpulse*this.a2y;
        this.a2.z-=totalImpulse*this.a2z;
    }
}
/**
* A contact is a pair of shapes whose axis-aligned bounding boxes are overlapping.
* @author saharan
*/
OIMO.Contact = function(){
    // The first shape.
    this.shape1=null;
    // The second shape.
    this.shape2=null;
    // The first rigid body.
    this.body1=null;
    // The second rigid body.
    this.body2=null;
    // The previous contact in the world.
    this.prev=null;
    // The next contact in the world.
    this.next=null;
    // Internal
    this.persisting=false;
    // Whether both the rigid bodies are sleeping or not.
    this.sleeping=false;
    // The collision detector between two shapes.
    this.detector=null;
    // The contact constraint of the contact.
    this.constraint=null;
    // Whether the shapes are touching or not.
    this.touching=false;

    this.b1Link=new OIMO.ContactLink(this);
    this.b2Link=new OIMO.ContactLink(this);
    this.s1Link=new OIMO.ContactLink(this);
    this.s2Link=new OIMO.ContactLink(this);
    // The contact manifold of the contact.
    this.manifold=new OIMO.ContactManifold();
    this.buffer=[];// vector 4
    this.buffer.length = 4;
    this.buffer[0]=new OIMO.ImpulseDataBuffer();
    this.buffer[1]=new OIMO.ImpulseDataBuffer();
    this.buffer[2]=new OIMO.ImpulseDataBuffer();
    this.buffer[3]=new OIMO.ImpulseDataBuffer();
    this.points=this.manifold.points;
    this.constraint=new OIMO.ContactConstraint(this.manifold);
}
OIMO.Contact.prototype = {
    constructor: OIMO.Contact,

    mixRestitution:function(restitution1,restitution2){
        return Math.sqrt(restitution1*restitution2);
    },
    mixFriction:function(friction1,friction2){
        return Math.sqrt(friction1*friction2);
    },
    /**
    * Update the contact manifold.
    */
    updateManifold:function(){
        this.constraint.restitution=this.mixRestitution(this.shape1.restitution,this.shape2.restitution);
        this.constraint.friction=this.mixFriction(this.shape1.friction,this.shape2.friction);
        var numBuffers=this.manifold.numPoints;
        var i = numBuffers;
        while(i--){
        //for(var i=0;i<numBuffers;i++){
            var b=this.buffer[i];
            var p=this.points[i];
            b.lp1X=p.localPoint1.x;
            b.lp1Y=p.localPoint1.y;
            b.lp1Z=p.localPoint1.z;
            b.lp2X=p.localPoint2.x;
            b.lp2Y=p.localPoint2.y;
            b.lp2Z=p.localPoint2.z;
            b.impulse=p.normalImpulse;
        }
        this.manifold.numPoints=0;
        this.detector.detectCollision(this.shape1,this.shape2,this.manifold);
        var num=this.manifold.numPoints;
        if(num==0){
            this.touching=false;
            return;
        }
        this.touching=true;
        i = num;
        while(i--){
        //for(i=0; i<num; i++){
            p=this.points[i];
            var lp1x=p.localPoint1.x;
            var lp1y=p.localPoint1.y;
            var lp1z=p.localPoint1.z;
            var lp2x=p.localPoint2.x;
            var lp2y=p.localPoint2.y;
            var lp2z=p.localPoint2.z;
            var index=-1;
            var minDistance=0.0004;
            var j = numBuffers;
            while(j--){
            //for(var j=0;j<numBuffers;j++){
                b=this.buffer[j];
                var dx=b.lp1X-lp1x;
                var dy=b.lp1Y-lp1y;
                var dz=b.lp1Z-lp1z;
                var distance1=dx*dx+dy*dy+dz*dz;
                dx=b.lp2X-lp2x;
                dy=b.lp2Y-lp2y;
                dz=b.lp2Z-lp2z;
                var distance2=dx*dx+dy*dy+dz*dz;
                if(distance1<distance2){
                    if(distance1<minDistance){
                        minDistance=distance1;
                        index=j;
                    }
                }else{
                    if(distance2<minDistance){
                        minDistance=distance2;
                        index=j;
                    }
                }
            }
            if(index!=-1){
                var tmp=this.buffer[index];
                this.buffer[index]=this.buffer[--numBuffers];
                this.buffer[numBuffers]=tmp;
                p.normalImpulse=tmp.impulse;
                p.warmStarted=true;
            }else{
                p.normalImpulse=0;
                p.warmStarted=false;
            }
        }
    },
    /**
    * Attach the contact to the shapes.
    * @param   shape1
    * @param   shape2
    */
    attach:function(shape1,shape2){
        this.shape1=shape1;
        this.shape2=shape2;
        this.body1=shape1.parent;
        this.body2=shape2.parent;

        this.manifold.body1=this.body1;
        this.manifold.body2=this.body2;
        this.constraint.body1=this.body1;
        this.constraint.body2=this.body2;
        this.constraint.attach();

        this.s1Link.shape=shape2;
        this.s1Link.body=this.body2;
        this.s2Link.shape=shape1;
        this.s2Link.body=this.body1;

        if(shape1.contactLink!=null)(this.s1Link.next=shape1.contactLink).prev=this.s1Link;
        else this.s1Link.next=null;
        shape1.contactLink=this.s1Link;
        shape1.numContacts++;

        if(shape2.contactLink!=null)(this.s2Link.next=shape2.contactLink).prev=this.s2Link;
        else this.s2Link.next=null;
        shape2.contactLink=this.s2Link;
        shape2.numContacts++;

        this.b1Link.shape=shape2;
        this.b1Link.body=this.body2;
        this.b2Link.shape=shape1;
        this.b2Link.body=this.body1;

        if(this.body1.contactLink!=null)(this.b1Link.next=this.body1.contactLink).prev=this.b1Link;
        else this.b1Link.next=null;
        this.body1.contactLink=this.b1Link;
        this.body1.numContacts++;

        if(this.body2.contactLink!=null)(this.b2Link.next=this.body2.contactLink).prev=this.b2Link;
        else this.b2Link.next=null;
        this.body2.contactLink=this.b2Link;
        this.body2.numContacts++;

        this.prev=null;
        this.next=null;

        this.persisting=true;
        this.sleeping=this.body1.sleeping&&this.body2.sleeping;
        this.manifold.numPoints=0;
    },
    /**
    * Detach the contact from the shapes.
    */
    detach:function(){
        var prev=this.s1Link.prev;
        var next=this.s1Link.next;
        if(prev!==null)prev.next=next;
        if(next!==null)next.prev=prev;
        if(this.shape1.contactLink==this.s1Link)this.shape1.contactLink=next;
        this.s1Link.prev=null;
        this.s1Link.next=null;
        this.s1Link.shape=null;
        this.s1Link.body=null;
        this.shape1.numContacts--;

        prev=this.s2Link.prev;
        next=this.s2Link.next;
        if(prev!==null)prev.next=next;
        if(next!==null)next.prev=prev;
        if(this.shape2.contactLink==this.s2Link)this.shape2.contactLink=next;
        this.s2Link.prev=null;
        this.s2Link.next=null;
        this.s2Link.shape=null;
        this.s2Link.body=null;
        this.shape2.numContacts--;

        prev=this.b1Link.prev;
        next=this.b1Link.next;
        if(prev!==null)prev.next=next;
        if(next!==null)next.prev=prev;
        if(this.body1.contactLink==this.b1Link)this.body1.contactLink=next;
        this.b1Link.prev=null;
        this.b1Link.next=null;
        this.b1Link.shape=null;
        this.b1Link.body=null;
        this.body1.numContacts--;

        prev=this.b2Link.prev;
        next=this.b2Link.next;
        if(prev!==null)prev.next=next;
        if(next!==null)next.prev=prev;
        if(this.body2.contactLink==this.b2Link)this.body2.contactLink=next;
        this.b2Link.prev=null;
        this.b2Link.next=null;
        this.b2Link.shape=null;
        this.b2Link.body=null;
        this.body2.numContacts--;

        this.manifold.body1=null;
        this.manifold.body2=null;
        this.constraint.body1=null;
        this.constraint.body2=null;
        this.constraint.detach();

        this.shape1=null;
        this.shape2=null;
        this.body1=null;
        this.body2=null;
    }
}
/**
* ...
* @author saharan
*/
OIMO.ContactConstraint = function(manifold){
    OIMO.Constraint.call( this);
    // The contact manifold of the constraint.
    this.manifold=manifold;
    // The coefficient of restitution of the constraint.
    this.restitution=NaN;
    // The coefficient of friction of the constraint.
    this.friction=NaN;
    this.p1=null;
    this.p2=null;
    this.lv1=null;
    this.lv2=null;
    this.av1=null;
    this.av2=null;
    this.i1=null;
    this.i2=null;
    this.i1e00=NaN;
    this.i1e01=NaN;
    this.i1e02=NaN;
    this.i1e10=NaN;
    this.i1e11=NaN;
    this.i1e12=NaN;
    this.i1e20=NaN;
    this.i1e21=NaN;
    this.i1e22=NaN;
    this.i2e00=NaN;
    this.i2e01=NaN;
    this.i2e02=NaN;
    this.i2e10=NaN;
    this.i2e11=NaN;
    this.i2e12=NaN;
    this.i2e20=NaN;
    this.i2e21=NaN;
    this.i2e22=NaN;
    this.m1=NaN;
    this.m2=NaN;
    this.num=0;
    
    this.ps=manifold.points;
    this.cs=new OIMO.ContactPointDataBuffer();
    this.cs.next=new OIMO.ContactPointDataBuffer();
    this.cs.next.next=new OIMO.ContactPointDataBuffer();
    this.cs.next.next.next=new OIMO.ContactPointDataBuffer();
}
OIMO.ContactConstraint.prototype = Object.create( OIMO.Constraint.prototype );
/**
* Attach the constraint to the bodies.
*/
OIMO.ContactConstraint.prototype.attach = function(){
    this.p1=this.body1.position;
    this.p2=this.body2.position;
    this.lv1=this.body1.linearVelocity;
    this.av1=this.body1.angularVelocity;
    this.lv2=this.body2.linearVelocity;
    this.av2=this.body2.angularVelocity;
    this.i1=this.body1.inverseInertia;
    this.i2=this.body2.inverseInertia;
}
/**
* Detach the constraint from the bodies.
*/
OIMO.ContactConstraint.prototype.detach = function(){
    this.p1=null;
    this.p2=null;
    this.lv1=null;
    this.lv2=null;
    this.av1=null;
    this.av2=null;
    this.i1=null;
    this.i2=null;
}
OIMO.ContactConstraint.prototype.preSolve = function(timeStep,invTimeStep){
    this.m1=this.body1.inverseMass;
    this.m2=this.body2.inverseMass;

    var ti1 = this.i1.elements;
    var ti2 = this.i2.elements;
    this.i1e00=ti1[0];
    this.i1e01=ti1[1];
    this.i1e02=ti1[2];
    this.i1e10=ti1[3];
    this.i1e11=ti1[4];
    this.i1e12=ti1[5];
    this.i1e20=ti1[6];
    this.i1e21=ti1[7];
    this.i1e22=ti1[8];

    this.i2e00=ti2[0];
    this.i2e01=ti2[1];
    this.i2e02=ti2[2];
    this.i2e10=ti2[3];
    this.i2e11=ti2[4];
    this.i2e12=ti2[5];
    this.i2e20=ti2[6];
    this.i2e21=ti2[7];
    this.i2e22=ti2[8];

    var p1x=this.p1.x;
    var p1y=this.p1.y;
    var p1z=this.p1.z;
    var p2x=this.p2.x;
    var p2y=this.p2.y;
    var p2z=this.p2.z;
    var m1m2=this.m1+this.m2;
    this.num=this.manifold.numPoints;
    var c=this.cs;
    for(var i=0;i<this.num;i++){
    var p=this.ps[i];
    var tmp1X;
    var tmp1Y;
    var tmp1Z;
    var tmp2X;
    var tmp2Y;
    var tmp2Z;
    tmp1X=p.position.x;
    tmp1Y=p.position.y;
    tmp1Z=p.position.z;
    var rp1X=tmp1X-p1x;
    var rp1Y=tmp1Y-p1y;
    var rp1Z=tmp1Z-p1z;
    var rp2X=tmp1X-p2x;
    var rp2Y=tmp1Y-p2y;
    var rp2Z=tmp1Z-p2z;
    c.rp1X=rp1X;
    c.rp1Y=rp1Y;
    c.rp1Z=rp1Z;
    c.rp2X=rp2X;
    c.rp2Y=rp2Y;
    c.rp2Z=rp2Z;
    c.norImp=p.normalImpulse;
    c.tanImp=p.tangentImpulse;
    c.binImp=p.binormalImpulse;
    var norX=p.normal.x;
    var norY=p.normal.y;
    var norZ=p.normal.z;
    var rvX=(this.lv2.x+this.av2.y*rp2Z-this.av2.z*rp2Y)-(this.lv1.x+this.av1.y*rp1Z-this.av1.z*rp1Y);
    var rvY=(this.lv2.y+this.av2.z*rp2X-this.av2.x*rp2Z)-(this.lv1.y+this.av1.z*rp1X-this.av1.x*rp1Z);
    var rvZ=(this.lv2.z+this.av2.x*rp2Y-this.av2.y*rp2X)-(this.lv1.z+this.av1.x*rp1Y-this.av1.y*rp1X);
    var rvn=norX*rvX+norY*rvY+norZ*rvZ;
    var tanX=rvX-rvn*norX;
    var tanY=rvY-rvn*norY;
    var tanZ=rvZ-rvn*norZ;
    var len=tanX*tanX+tanY*tanY+tanZ*tanZ;
    if(len>0.04){
    len=1/Math.sqrt(len);
    }else{
    tanX=norY*norX-norZ*norZ;
    tanY=-norZ*norY-norX*norX;
    tanZ=norX*norZ+norY*norY;
    len=1/Math.sqrt(tanX*tanX+tanY*tanY+tanZ*tanZ);
    }
    tanX*=len;
    tanY*=len;
    tanZ*=len;
    var binX=norY*tanZ-norZ*tanY;
    var binY=norZ*tanX-norX*tanZ;
    var binZ=norX*tanY-norY*tanX;
    c.norX=norX;
    c.norY=norY;
    c.norZ=norZ;
    c.tanX=tanX;
    c.tanY=tanY;
    c.tanZ=tanZ;
    c.binX=binX;
    c.binY=binY;
    c.binZ=binZ;
    c.norU1X=norX*this.m1;
    c.norU1Y=norY*this.m1;
    c.norU1Z=norZ*this.m1;
    c.norU2X=norX*this.m2;
    c.norU2Y=norY*this.m2;
    c.norU2Z=norZ*this.m2;
    c.tanU1X=tanX*this.m1;
    c.tanU1Y=tanY*this.m1;
    c.tanU1Z=tanZ*this.m1;
    c.tanU2X=tanX*this.m2;
    c.tanU2Y=tanY*this.m2;
    c.tanU2Z=tanZ*this.m2;
    c.binU1X=binX*this.m1;
    c.binU1Y=binY*this.m1;
    c.binU1Z=binZ*this.m1;
    c.binU2X=binX*this.m2;
    c.binU2Y=binY*this.m2;
    c.binU2Z=binZ*this.m2;
    var norT1X=rp1Y*norZ-rp1Z*norY;
    var norT1Y=rp1Z*norX-rp1X*norZ;
    var norT1Z=rp1X*norY-rp1Y*norX;
    var norT2X=rp2Y*norZ-rp2Z*norY;
    var norT2Y=rp2Z*norX-rp2X*norZ;
    var norT2Z=rp2X*norY-rp2Y*norX;
    var tanT1X=rp1Y*tanZ-rp1Z*tanY;
    var tanT1Y=rp1Z*tanX-rp1X*tanZ;
    var tanT1Z=rp1X*tanY-rp1Y*tanX;
    var tanT2X=rp2Y*tanZ-rp2Z*tanY;
    var tanT2Y=rp2Z*tanX-rp2X*tanZ;
    var tanT2Z=rp2X*tanY-rp2Y*tanX;
    var binT1X=rp1Y*binZ-rp1Z*binY;
    var binT1Y=rp1Z*binX-rp1X*binZ;
    var binT1Z=rp1X*binY-rp1Y*binX;
    var binT2X=rp2Y*binZ-rp2Z*binY;
    var binT2Y=rp2Z*binX-rp2X*binZ;
    var binT2Z=rp2X*binY-rp2Y*binX;
    var norTU1X=norT1X*this.i1e00+norT1Y*this.i1e01+norT1Z*this.i1e02;
    var norTU1Y=norT1X*this.i1e10+norT1Y*this.i1e11+norT1Z*this.i1e12;
    var norTU1Z=norT1X*this.i1e20+norT1Y*this.i1e21+norT1Z*this.i1e22;
    var norTU2X=norT2X*this.i2e00+norT2Y*this.i2e01+norT2Z*this.i2e02;
    var norTU2Y=norT2X*this.i2e10+norT2Y*this.i2e11+norT2Z*this.i2e12;
    var norTU2Z=norT2X*this.i2e20+norT2Y*this.i2e21+norT2Z*this.i2e22;
    var tanTU1X=tanT1X*this.i1e00+tanT1Y*this.i1e01+tanT1Z*this.i1e02;
    var tanTU1Y=tanT1X*this.i1e10+tanT1Y*this.i1e11+tanT1Z*this.i1e12;
    var tanTU1Z=tanT1X*this.i1e20+tanT1Y*this.i1e21+tanT1Z*this.i1e22;
    var tanTU2X=tanT2X*this.i2e00+tanT2Y*this.i2e01+tanT2Z*this.i2e02;
    var tanTU2Y=tanT2X*this.i2e10+tanT2Y*this.i2e11+tanT2Z*this.i2e12;
    var tanTU2Z=tanT2X*this.i2e20+tanT2Y*this.i2e21+tanT2Z*this.i2e22;
    var binTU1X=binT1X*this.i1e00+binT1Y*this.i1e01+binT1Z*this.i1e02;
    var binTU1Y=binT1X*this.i1e10+binT1Y*this.i1e11+binT1Z*this.i1e12;
    var binTU1Z=binT1X*this.i1e20+binT1Y*this.i1e21+binT1Z*this.i1e22;
    var binTU2X=binT2X*this.i2e00+binT2Y*this.i2e01+binT2Z*this.i2e02;
    var binTU2Y=binT2X*this.i2e10+binT2Y*this.i2e11+binT2Z*this.i2e12;
    var binTU2Z=binT2X*this.i2e20+binT2Y*this.i2e21+binT2Z*this.i2e22;
    c.norT1X=norT1X;
    c.norT1Y=norT1Y;
    c.norT1Z=norT1Z;
    c.tanT1X=tanT1X;
    c.tanT1Y=tanT1Y;
    c.tanT1Z=tanT1Z;
    c.binT1X=binT1X;
    c.binT1Y=binT1Y;
    c.binT1Z=binT1Z;
    c.norT2X=norT2X;
    c.norT2Y=norT2Y;
    c.norT2Z=norT2Z;
    c.tanT2X=tanT2X;
    c.tanT2Y=tanT2Y;
    c.tanT2Z=tanT2Z;
    c.binT2X=binT2X;
    c.binT2Y=binT2Y;
    c.binT2Z=binT2Z;
    c.norTU1X=norTU1X;
    c.norTU1Y=norTU1Y;
    c.norTU1Z=norTU1Z;
    c.tanTU1X=tanTU1X;
    c.tanTU1Y=tanTU1Y;
    c.tanTU1Z=tanTU1Z;
    c.binTU1X=binTU1X;
    c.binTU1Y=binTU1Y;
    c.binTU1Z=binTU1Z;
    c.norTU2X=norTU2X;
    c.norTU2Y=norTU2Y;
    c.norTU2Z=norTU2Z;
    c.tanTU2X=tanTU2X;
    c.tanTU2Y=tanTU2Y;
    c.tanTU2Z=tanTU2Z;
    c.binTU2X=binTU2X;
    c.binTU2Y=binTU2Y;
    c.binTU2Z=binTU2Z;
    tmp1X=norT1X*this.i1e00+norT1Y*this.i1e01+norT1Z*this.i1e02;
    tmp1Y=norT1X*this.i1e10+norT1Y*this.i1e11+norT1Z*this.i1e12;
    tmp1Z=norT1X*this.i1e20+norT1Y*this.i1e21+norT1Z*this.i1e22;
    tmp2X=tmp1Y*rp1Z-tmp1Z*rp1Y;
    tmp2Y=tmp1Z*rp1X-tmp1X*rp1Z;
    tmp2Z=tmp1X*rp1Y-tmp1Y*rp1X;
    tmp1X=norT2X*this.i2e00+norT2Y*this.i2e01+norT2Z*this.i2e02;
    tmp1Y=norT2X*this.i2e10+norT2Y*this.i2e11+norT2Z*this.i2e12;
    tmp1Z=norT2X*this.i2e20+norT2Y*this.i2e21+norT2Z*this.i2e22;
    tmp2X+=tmp1Y*rp2Z-tmp1Z*rp2Y;
    tmp2Y+=tmp1Z*rp2X-tmp1X*rp2Z;
    tmp2Z+=tmp1X*rp2Y-tmp1Y*rp2X;
    var norDen=1/(m1m2+norX*tmp2X+norY*tmp2Y+norZ*tmp2Z);
    tmp1X=tanT1X*this.i1e00+tanT1Y*this.i1e01+tanT1Z*this.i1e02;
    tmp1Y=tanT1X*this.i1e10+tanT1Y*this.i1e11+tanT1Z*this.i1e12;
    tmp1Z=tanT1X*this.i1e20+tanT1Y*this.i1e21+tanT1Z*this.i1e22;
    tmp2X=tmp1Y*rp1Z-tmp1Z*rp1Y;
    tmp2Y=tmp1Z*rp1X-tmp1X*rp1Z;
    tmp2Z=tmp1X*rp1Y-tmp1Y*rp1X;
    tmp1X=tanT2X*this.i2e00+tanT2Y*this.i2e01+tanT2Z*this.i2e02;
    tmp1Y=tanT2X*this.i2e10+tanT2Y*this.i2e11+tanT2Z*this.i2e12;
    tmp1Z=tanT2X*this.i2e20+tanT2Y*this.i2e21+tanT2Z*this.i2e22;
    tmp2X+=tmp1Y*rp2Z-tmp1Z*rp2Y;
    tmp2Y+=tmp1Z*rp2X-tmp1X*rp2Z;
    tmp2Z+=tmp1X*rp2Y-tmp1Y*rp2X;
    var tanDen=1/(m1m2+tanX*tmp2X+tanY*tmp2Y+tanZ*tmp2Z);
    tmp1X=binT1X*this.i1e00+binT1Y*this.i1e01+binT1Z*this.i1e02;
    tmp1Y=binT1X*this.i1e10+binT1Y*this.i1e11+binT1Z*this.i1e12;
    tmp1Z=binT1X*this.i1e20+binT1Y*this.i1e21+binT1Z*this.i1e22;
    tmp2X=tmp1Y*rp1Z-tmp1Z*rp1Y;
    tmp2Y=tmp1Z*rp1X-tmp1X*rp1Z;
    tmp2Z=tmp1X*rp1Y-tmp1Y*rp1X;
    tmp1X=binT2X*this.i2e00+binT2Y*this.i2e01+binT2Z*this.i2e02;
    tmp1Y=binT2X*this.i2e10+binT2Y*this.i2e11+binT2Z*this.i2e12;
    tmp1Z=binT2X*this.i2e20+binT2Y*this.i2e21+binT2Z*this.i2e22;
    tmp2X+=tmp1Y*rp2Z-tmp1Z*rp2Y;
    tmp2Y+=tmp1Z*rp2X-tmp1X*rp2Z;
    tmp2Z+=tmp1X*rp2Y-tmp1Y*rp2X;
    var binDen=1/(m1m2+binX*tmp2X+binY*tmp2Y+binZ*tmp2Z);
    c.norDen=norDen;
    c.tanDen=tanDen;
    c.binDen=binDen;
    if(p.warmStarted){
    var norImp=p.normalImpulse;
    this.lv1.x+=c.norU1X*norImp;
    this.lv1.y+=c.norU1Y*norImp;
    this.lv1.z+=c.norU1Z*norImp;
    this.av1.x+=norTU1X*norImp;
    this.av1.y+=norTU1Y*norImp;
    this.av1.z+=norTU1Z*norImp;
    this.lv2.x-=c.norU2X*norImp;
    this.lv2.y-=c.norU2Y*norImp;
    this.lv2.z-=c.norU2Z*norImp;
    this.av2.x-=norTU2X*norImp;
    this.av2.y-=norTU2Y*norImp;
    this.av2.z-=norTU2Z*norImp;
    c.norImp=norImp;
    c.tanImp=0;
    c.binImp=0;
    rvn=0; // disable bouncing
    }else{
    c.norImp=0;
    c.tanImp=0;
    c.binImp=0;
    }
    if(rvn>-1){
    rvn=0; // disable bouncing
    }
    var norTar=this.restitution*-rvn;
    var sepV=-(p.penetration+0.005)*invTimeStep*0.05; // allow 0.5cm error
    if(norTar<sepV)norTar=sepV;
    c.norTar=norTar;
    c.last=i==this.num-1;
    c=c.next;
    }
}
OIMO.ContactConstraint.prototype.solve = function(){
    var lv1x=this.lv1.x;
    var lv1y=this.lv1.y;
    var lv1z=this.lv1.z;
    var lv2x=this.lv2.x;
    var lv2y=this.lv2.y;
    var lv2z=this.lv2.z;
    var av1x=this.av1.x;
    var av1y=this.av1.y;
    var av1z=this.av1.z;
    var av2x=this.av2.x;
    var av2y=this.av2.y;
    var av2z=this.av2.z;
    var c=this.cs;
    while(true){
        var oldImp1;
        var newImp1;
        var oldImp2;
        var newImp2;
        var rvn;
        var norImp=c.norImp;
        var tanImp=c.tanImp;
        var binImp=c.binImp;
        var max=-norImp*this.friction;
        var rvX=lv2x-lv1x;
        var rvY=lv2y-lv1y;
        var rvZ=lv2z-lv1z;
        rvn=
        rvX*c.tanX+rvY*c.tanY+rvZ*c.tanZ+
        av2x*c.tanT2X+av2y*c.tanT2Y+av2z*c.tanT2Z-
        av1x*c.tanT1X-av1y*c.tanT1Y-av1z*c.tanT1Z
        ;
        oldImp1=tanImp;
        newImp1=rvn*c.tanDen;
        tanImp+=newImp1;
        rvn=
        rvX*c.binX+rvY*c.binY+rvZ*c.binZ+
        av2x*c.binT2X+av2y*c.binT2Y+av2z*c.binT2Z-
        av1x*c.binT1X-av1y*c.binT1Y-av1z*c.binT1Z
        ;
        oldImp2=binImp;
        newImp2=rvn*c.binDen;
        binImp+=newImp2;

        // cone friction clamp
        var len=tanImp*tanImp+binImp*binImp;
        if(len>max*max){
            len=max/Math.sqrt(len);
            tanImp*=len;
            binImp*=len;
        }
        newImp1=tanImp-oldImp1;
        newImp2=binImp-oldImp2;

        lv1x+=c.tanU1X*newImp1+c.binU1X*newImp2;
        lv1y+=c.tanU1Y*newImp1+c.binU1Y*newImp2;
        lv1z+=c.tanU1Z*newImp1+c.binU1Z*newImp2;
        av1x+=c.tanTU1X*newImp1+c.binTU1X*newImp2;
        av1y+=c.tanTU1Y*newImp1+c.binTU1Y*newImp2;
        av1z+=c.tanTU1Z*newImp1+c.binTU1Z*newImp2;
        lv2x-=c.tanU2X*newImp1+c.binU2X*newImp2;
        lv2y-=c.tanU2Y*newImp1+c.binU2Y*newImp2;
        lv2z-=c.tanU2Z*newImp1+c.binU2Z*newImp2;
        av2x-=c.tanTU2X*newImp1+c.binTU2X*newImp2;
        av2y-=c.tanTU2Y*newImp1+c.binTU2Y*newImp2;
        av2z-=c.tanTU2Z*newImp1+c.binTU2Z*newImp2;

        // restitution part
        rvn=
        (lv2x-lv1x)*c.norX+(lv2y-lv1y)*c.norY+(lv2z-lv1z)*c.norZ+
        av2x*c.norT2X+av2y*c.norT2Y+av2z*c.norT2Z-
        av1x*c.norT1X-av1y*c.norT1Y-av1z*c.norT1Z;

        oldImp1=norImp;
        newImp1=(rvn-c.norTar)*c.norDen;
        norImp+=newImp1;
        if(norImp>0)norImp=0;
        newImp1=norImp-oldImp1;
        lv1x+=c.norU1X*newImp1;
        lv1y+=c.norU1Y*newImp1;
        lv1z+=c.norU1Z*newImp1;
        av1x+=c.norTU1X*newImp1;
        av1y+=c.norTU1Y*newImp1;
        av1z+=c.norTU1Z*newImp1;
        lv2x-=c.norU2X*newImp1;
        lv2y-=c.norU2Y*newImp1;
        lv2z-=c.norU2Z*newImp1;
        av2x-=c.norTU2X*newImp1;
        av2y-=c.norTU2Y*newImp1;
        av2z-=c.norTU2Z*newImp1;

        c.norImp=norImp;
        c.tanImp=tanImp;
        c.binImp=binImp;

        if(c.last)break;
        c=c.next;
    }
    this.lv1.x=lv1x;
    this.lv1.y=lv1y;
    this.lv1.z=lv1z;
    this.lv2.x=lv2x;
    this.lv2.y=lv2y;
    this.lv2.z=lv2z;
    this.av1.x=av1x;
    this.av1.y=av1y;
    this.av1.z=av1z;
    this.av2.x=av2x;
    this.av2.y=av2y;
    this.av2.z=av2z;
}
OIMO.ContactConstraint.prototype.postSolve = function(){
    var c=this.cs;
    var i = this.num;
    while(i--){
    //for(var i=0;i<this.num;i++){
        var p=this.ps[i];
        p.normal.x=c.norX;
        p.normal.y=c.norY;
        p.normal.z=c.norZ;
        p.tangent.x=c.tanX;
        p.tangent.y=c.tanY;
        p.tangent.z=c.tanZ;
        p.binormal.x=c.binX;
        p.binormal.y=c.binY;
        p.binormal.z=c.binZ;
        p.normalImpulse=c.norImp;
        p.tangentImpulse=c.tanImp;
        p.binormalImpulse=c.binImp;
        p.normalDenominator=c.norDen;
        p.tangentDenominator=c.tanDen;
        p.binormalDenominator=c.binDen;
        c=c.next;
    }
}
/**
* A link list of contacts.
* @author saharan
*/
OIMO.ContactLink = function(contact){
	// The previous contact link.
    this.prev=null;
    // The next contact link.
    this.next=null;
    // The shape of the contact.
    this.shape=null;
    // The other rigid body.
    this.body=null;
    // The contact of the link.
    this.contact = contact;
}
/**
* A contact manifold between two shapes.
* @author saharan
*/
OIMO.ContactManifold = function(){
    // The first rigid body.
    this.body1 = null;
    // The second rigid body.
    this.body2 = null;
    // The number of manifold points.
    this.numPoints = 0;
    // The manifold points.
    this.points = [];
    this.points.length = 4;
    this.points[0] = new OIMO.ManifoldPoint();
    this.points[1] = new OIMO.ManifoldPoint();
    this.points[2] = new OIMO.ManifoldPoint();
    this.points[3] = new OIMO.ManifoldPoint();
}
OIMO.ContactManifold.prototype = {
    constructor: OIMO.ContactManifold,
    /**
    * Reset the manifold.
    * @param   shape1
    * @param   shape2
    */
    reset:function(shape1,shape2){
        this.body1=shape1.parent;
        this.body2=shape2.parent;
        this.numPoints=0;
    },
    /**
    * Add a point into this manifold.
    * @param   x
    * @param   y
    * @param   z
    * @param   normalX
    * @param   normalY
    * @param   normalZ
    * @param   penetration
    * @param   flip
    */
    addPoint:function(x,y,z,normalX,normalY,normalZ,penetration,flip){
        var p=this.points[this.numPoints++];
        p.position.x=x;
        p.position.y=y;
        p.position.z=z;
        var r=this.body1.rotation;
        var rx=x-this.body1.position.x;
        var ry=y-this.body1.position.y;
        var rz=z-this.body1.position.z;

        var tr = r.elements;
        p.localPoint1.x=rx*tr[0]+ry*tr[3]+rz*tr[6];
        p.localPoint1.y=rx*tr[1]+ry*tr[4]+rz*tr[7];
        p.localPoint1.z=rx*tr[2]+ry*tr[5]+rz*tr[8];
        r=this.body2.rotation;
        rx=x-this.body2.position.x;
        ry=y-this.body2.position.y;
        rz=z-this.body2.position.z;
        p.localPoint2.x=rx*tr[0]+ry*tr[3]+rz*tr[6];
        p.localPoint2.y=rx*tr[1]+ry*tr[4]+rz*tr[7];
        p.localPoint2.z=rx*tr[2]+ry*tr[5]+rz*tr[8];

        p.normalImpulse=0;
        if(flip){
            p.normal.x=-normalX;
            p.normal.y=-normalY;
            p.normal.z=-normalZ;
        }else{
            p.normal.x=normalX;
            p.normal.y=normalY;
            p.normal.z=normalZ;
        }
        p.penetration=penetration;
        p.warmStarted=false;
    }
}
OIMO.ContactPointDataBuffer = function(){
    this.norX=NaN;
    this.norY=NaN;
    this.norZ=NaN;
    this.tanX=NaN;
    this.tanY=NaN;
    this.tanZ=NaN;
    this.binX=NaN;
    this.binY=NaN;
    this.binZ=NaN;
    
    this.rp1X=NaN;
    this.rp1Y=NaN;
    this.rp1Z=NaN;
    this.rp2X=NaN;
    this.rp2Y=NaN;
    this.rp2Z=NaN;
    
    this.norU1X=NaN;
    this.norU1Y=NaN;
    this.norU1Z=NaN;
    this.norU2X=NaN;
    this.norU2Y=NaN;
    this.norU2Z=NaN;
    this.tanU1X=NaN;
    this.tanU1Y=NaN;
    this.tanU1Z=NaN;
    this.tanU2X=NaN;
    this.tanU2Y=NaN;
    this.tanU2Z=NaN;
    this.binU1X=NaN;
    this.binU1Y=NaN;
    this.binU1Z=NaN;
    this.binU2X=NaN;
    this.binU2Y=NaN;
    this.binU2Z=NaN;
    
    this.norT1X=NaN;
    this.norT1Y=NaN;
    this.norT1Z=NaN;
    this.norT2X=NaN;
    this.norT2Y=NaN;
    this.norT2Z=NaN;
    this.tanT1X=NaN;
    this.tanT1Y=NaN;
    this.tanT1Z=NaN;
    this.tanT2X=NaN;
    this.tanT2Y=NaN;
    this.tanT2Z=NaN;
    this.binT1X=NaN;
    this.binT1Y=NaN;
    this.binT1Z=NaN;
    this.binT2X=NaN;
    this.binT2Y=NaN;
    this.binT2Z=NaN;
    
    this.norTU1X=NaN;
    this.norTU1Y=NaN;
    this.norTU1Z=NaN;
    this.norTU2X=NaN;
    this.norTU2Y=NaN;
    this.norTU2Z=NaN;
    this.tanTU1X=NaN;
    this.tanTU1Y=NaN;
    this.tanTU1Z=NaN;
    this.tanTU2X=NaN;
    this.tanTU2Y=NaN;
    this.tanTU2Z=NaN;
    this.binTU1X=NaN;
    this.binTU1Y=NaN;
    this.binTU1Z=NaN;
    this.binTU2X=NaN;
    this.binTU2Y=NaN;
    this.binTU2Z=NaN;
    
    this.norImp=NaN;
    this.tanImp=NaN;
    this.binImp=NaN;
    this.norDen=NaN;
    this.tanDen=NaN;
    this.binDen=NaN;
    this.norTar=NaN;
    this.next=null;
    this.last=false;
}
OIMO.ImpulseDataBuffer = function(){
    this.lp1X=NaN;
    this.lp1Y=NaN;
    this.lp1Z=NaN;
    this.lp2X=NaN;
    this.lp2Y=NaN;
    this.lp2Z=NaN;
    this.impulse=NaN;
}
/**
* The class holds details of the contact point.
* @author saharan
*/
OIMO.ManifoldPoint = function(){
    // Whether this manifold point is persisting or not.
    this.warmStarted=false;
    //  The position of this manifold point.
    this.position=new OIMO.Vec3();
    // The position in the first shape's coordinate.
    this.localPoint1=new OIMO.Vec3();
    //  The position in the second shape's coordinate.
    this.localPoint2=new OIMO.Vec3();
    // The normal vector of this manifold point.
    this.normal=new OIMO.Vec3();
    // The tangent vector of this manifold point.
    this.tangent=new OIMO.Vec3();
    // The binormal vector of this manifold point.
    this.binormal=new OIMO.Vec3();
    // The impulse in normal direction.
    this.normalImpulse=0;
    // The impulse in tangent direction.
    this.tangentImpulse=0;
    // The impulse in binormal direction.
    this.binormalImpulse=0;
    // The denominator in normal direction.
    this.normalDenominator=0;
    // The denominator in tangent direction.
    this.tangentDenominator=0;
    // The denominator in binormal direction.
    this.binormalDenominator=0;
    // The depth of penetration.
    this.penetration=0;
}
/**
* This class holds mass information of a shape.
* @author saharan
*/
OIMO.MassInfo = function(){
	// Mass of the shape.
    this.mass = 0;
    // The moment inertia of the shape.
    this.inertia = new OIMO.Mat33();
}
/**
 * A shape is used to detect collisions of rigid bodies.
 * @author saharan
 */
OIMO.Shape = function(config){
    // The global identification of the shape.
    // This value should be unique to the shape.
    this.id = OIMO.nextID++;
    // The previous shape in parent rigid body.
    this.prev = null;
    // The next shape in parent rigid body.
    this.next = null;
    // The type of the shape.
    this.type = 0;

    // The proxy of the shape.
    // This is used for broad-phase collision detection.
    this.proxy = null;
    // The parent rigid body of the shape.
    this.parent = null;
    // The linked list of the contacts with the shape.
    this.contactLink = null;
    // The number of the contacts with the shape.
    this.numContacts=0;

    // The center of gravity of the shape in world coordinate system.
    this.position = new OIMO.Vec3();
    // The rotation matrix of the shape in world coordinate system
    this.rotation = new OIMO.Mat33();

    // The position of the shape in parent's coordinate system.
    this.relativePosition = new OIMO.Vec3().copy(config.relativePosition);
    // The rotation matrix of the shape in parent's coordinate system.
    this.relativeRotation = new OIMO.Mat33().copy(config.relativeRotation);

    // The axis-aligned bounding box of the shape.
    this.aabb = new OIMO.AABB();

    // The density of the shape.
    this.density = config.density;
    // The coefficient of friction of the shape.
    this.friction = config.friction;
    // The coefficient of restitution of the shape.
    this.restitution = config.restitution;
    // The bits of the collision groups to which the shape belongs.
    this.belongsTo = config.belongsTo;
    // The bits of the collision groups with which the shape collides.
    this.collidesWith = config.collidesWith;
}

OIMO.Shape.prototype = {
    constructor: OIMO.Shape,

    /**
    * Calculate the mass information of the shape.
    * @param   out
    */
    calculateMassInfo:function(out){
        throw new Error("Inheritance error.");
    },

    /**
    * Update the proxy of the shape.
    */
    updateProxy:function(){
        throw new Error("Inheritance error.");
    }
}
/**
 * A shape configuration holds common configuration data for constructing a shape.
 * Shape configurations can be reused safely.
 * @author saharan
 */

OIMO.ShapeConfig = function(){
	// The position of the shape in parent's coordinate system.
    this.relativePosition = new OIMO.Vec3();
    // The rotation matrix of the shape in parent's coordinate system.
    this.relativeRotation = new OIMO.Mat33();
    // The coefficient of friction of the shape.
    this.friction = 0.4;
    // The coefficient of restitution of the shape.
    this.restitution = 0.2;
    // The density of the shape.
    this.density = 1;
    // The bits of the collision groups to which the shape belongs.
    this.belongsTo = 1;
    // The bits of the collision groups with which the shape collides.
    this.collidesWith = 0xffffffff;
}
/**
* A box shape.
* @author saharan
* @author loth
*/
OIMO.BoxShape = function(config,Width,Height,Depth){
    OIMO.Shape.call( this, config );
    // The width of the box.
    this.width = Width;
    // The height of the box.
    this.height = Height;
    // The depth of the box.
    this.depth = Depth;
    // The half-width of the box.
    this.halfWidth = Width*0.5;
    // The half-height of the box.
    this.halfHeight = Height*0.5;
    // The half-depth of the box.
    this.halfDepth = Depth*0.5;

    this.dimentions = new OIMO_ARRAY_TYPE(18);
    this.elements = new OIMO_ARRAY_TYPE(24);
    this.type = OIMO.SHAPE_BOX;
}
OIMO.BoxShape.prototype = Object.create( OIMO.Shape.prototype );
OIMO.BoxShape.prototype.calculateMassInfo = function(out){
    var mass=this.width*this.height*this.depth*this.density;
    out.mass=mass;
    out.inertia.init(
        mass*(this.height*this.height+this.depth*this.depth)/12,0,0,
        0,mass*(this.width*this.width+this.depth*this.depth)/12,0,
        0,0,mass*(this.width*this.width+this.height*this.height)/12
    );
}
OIMO.BoxShape.prototype.updateProxy = function(){
    var te = this.rotation.elements;
    var di = this.dimentions;
    // Width
    di[0]=te[0];
    di[1]=te[3];
    di[2]=te[6];
    // Height
    di[3]=te[1];
    di[4]=te[4];
    di[5]=te[7];
    // Depth
    di[6]=te[2];
    di[7]=te[5];
    di[8]=te[8];
    // halp Width
    di[9]=te[0]*this.halfWidth;
    di[10]=te[3]*this.halfWidth;
    di[11]=te[6]*this.halfWidth;
    // halp Height
    di[12]=te[1]*this.halfHeight;
    di[13]=te[4]*this.halfHeight;
    di[14]=te[7]*this.halfHeight;
    // halp Depth
    di[15]=te[2]*this.halfDepth;
    di[16]=te[5]*this.halfDepth;
    di[17]=te[8]*this.halfDepth;

    var wx=di[9];
    var wy=di[10];
    var wz=di[11];
    var hx=di[12];
    var hy=di[13];
    var hz=di[14];
    var dx=di[15];
    var dy=di[16];
    var dz=di[17];

    var x=this.position.x;
    var y=this.position.y;
    var z=this.position.z;

    var v=this.elements;
    //v1
    v[0]=x+wx+hx+dx;
    v[1]=y+wy+hy+dy;
    v[2]=z+wz+hz+dz;
    //v2
    v[3]=x+wx+hx-dx;
    v[4]=y+wy+hy-dy;
    v[5]=z+wz+hz-dz;
    //v3
    v[6]=x+wx-hx+dx;
    v[7]=y+wy-hy+dy;
    v[8]=z+wz-hz+dz;
    //v4
    v[9]=x+wx-hx-dx;
    v[10]=y+wy-hy-dy;
    v[11]=z+wz-hz-dz;
    //v5
    v[12]=x-wx+hx+dx;
    v[13]=y-wy+hy+dy;
    v[14]=z-wz+hz+dz;
    //v6
    v[15]=x-wx+hx-dx;
    v[16]=y-wy+hy-dy;
    v[17]=z-wz+hz-dz;
    //v7
    v[18]=x-wx-hx+dx;
    v[19]=y-wy-hy+dy;
    v[20]=z-wz-hz+dz;
    //v8
    v[21]=x-wx-hx-dx;
    v[22]=y-wy-hy-dy;
    v[23]=z-wz-hz-dz;

    var w = (di[9]<0) ? -di[9] : di[9]; 
    var h = (di[10]<0) ? -di[10] : di[10];
    var d = (di[11]<0) ? -di[11] : di[11];

    w = (di[12]<0) ? w-di[12] : w+di[12]; 
    h = (di[13]<0) ? h-di[13] : h+di[13];
    d = (di[14]<0) ? d-di[14] : d+di[14];

    w = (di[15]<0) ? w-di[15] : w+di[15]; 
    h = (di[16]<0) ? h-di[16] : h+di[16];
    d = (di[17]<0) ? d-di[17] : d+di[17];
    
    this.aabb.init(
        this.position.x-w-0.005,this.position.x+w+0.005,
        this.position.y-h-0.005,this.position.y+h+0.005,
        this.position.z-d-0.005,this.position.z+d+0.005
    );
    if(this.proxy!==null){
        this.proxy.update();
    }
}
/**
 * A sphere shape.
 * @author saharan
 */
OIMO.SphereShape = function(config,radius){
    OIMO.Shape.call( this, config);
    // The radius of the shape.
    this.radius = radius;
    this.type = OIMO.SHAPE_SPHERE;
}
OIMO.SphereShape.prototype = Object.create( OIMO.Shape.prototype );
OIMO.SphereShape.prototype.calculateMassInfo = function(out){
    var mass = 4/3*Math.PI*this.radius*this.radius*this.radius*this.density;
    out.mass = mass;
    var inertia = mass*this.radius*this.radius*2/5;
    out.inertia.init( inertia,0,0,0,inertia,0,0,0,inertia );
}
OIMO.SphereShape.prototype.updateProxy = function(){
    this.aabb.init(
        this.position.x-this.radius-0.005,this.position.x+this.radius+0.005,
        this.position.y-this.radius-0.005,this.position.y+this.radius+0.005,
        this.position.z-this.radius-0.005,this.position.z+this.radius+0.005
    );
    if(this.proxy!==null){ this.proxy.update(); }
}
OIMO.CollisionDetector = function(){
    this.flip = false;
}

OIMO.CollisionDetector.prototype = {
    constructor: OIMO.CollisionDetector,

    detectCollision:function(shape1,shape2,manifold){
        throw new Error("Inheritance error.");
    }
}
/**
 * A collision detector which detects collisions between two boxes.
 * @author saharan
 */
OIMO.BoxBoxCollisionDetector = function(){
    OIMO.CollisionDetector.call( this );
    this.clipVertices1=new OIMO_ARRAY_TYPE(24); // 8 vertices x,y,z
    this.clipVertices2=new OIMO_ARRAY_TYPE(24);
    this.used=new OIMO_ARRAY_TYPE(8);
    
    this.INF = 1/0;
}
OIMO.BoxBoxCollisionDetector.prototype = Object.create( OIMO.CollisionDetector.prototype );
OIMO.BoxBoxCollisionDetector.prototype.detectCollision = function(shape1,shape2,manifold){
    // What you are doing 
    // · I to prepare a separate axis of the fifteen 
    //-Six in each of three normal vectors of the xyz direction of the box both 
    // · Remaining nine 3x3 a vector perpendicular to the side of the box 2 and the side of the box 1 
    // · Calculate the depth to the separation axis 

    // Calculates the distance using the inner product and put the amount of embedment 
    // · However a vertical separation axis and side to weight a little to avoid vibration 
    // And end when there is a separate axis that is remote even one 
    // · I look for separation axis with little to dent most 
    // Men and if separation axis of the first six - end collision 
    // Heng If it separate axis of nine other - side collision 
    // Heng - case of a side collision 
    // · Find points of two sides on which you made ​​the separation axis 

    // Calculates the point of closest approach of a straight line consisting of separate axis points obtained, and the collision point 
    //-Surface - the case of the plane crash 
    //-Box A, box B and the other a box of better made ​​a separate axis 
    // • The surface A and the plane that made the separation axis of the box A, and B to the surface the face of the box B close in the opposite direction to the most isolated axis 

    // When viewed from the front surface A, and the cut part exceeding the area of the surface A is a surface B 
    //-Plane B becomes the 3-8 triangle, I a candidate for the collision point the vertex of surface B 
    // • If more than one candidate 5 exists, scraping up to four 

    // For potential collision points of all, to examine the distance between the surface A 
    // • If you were on the inside surface of A, and the collision point

    var b1;
    var b2;
    if(shape1.id<shape2.id){
        b1=(shape1);
        b2=(shape2);
    }else{
        b1=(shape2);
        b2=(shape1);
    }
    var V1 = b1.elements;
    var V2 = b2.elements;

    var D1 = b1.dimentions;
    var D2 = b2.dimentions;

    var p1=b1.position;
    var p2=b2.position;
    var p1x=p1.x;
    var p1y=p1.y;
    var p1z=p1.z;
    var p2x=p2.x;
    var p2y=p2.y;
    var p2z=p2.z;
    // diff
    var dx=p2x-p1x;
    var dy=p2y-p1y;
    var dz=p2z-p1z;
    // distance
    var w1=b1.halfWidth;
    var h1=b1.halfHeight;
    var d1=b1.halfDepth;
    var w2=b2.halfWidth;
    var h2=b2.halfHeight;
    var d2=b2.halfDepth;
    // direction

    // ----------------------------
    // 15 separating axes
    // 1~6: face
    // 7~f: edge
    // http://marupeke296.com/COL_3D_No13_OBBvsOBB.html
    // ----------------------------
    
    var a1x=D1[0];
    var a1y=D1[1];
    var a1z=D1[2];
    var a2x=D1[3];
    var a2y=D1[4];
    var a2z=D1[5];
    var a3x=D1[6];
    var a3y=D1[7];
    var a3z=D1[8];
    var d1x=D1[9];
    var d1y=D1[10];
    var d1z=D1[11];
    var d2x=D1[12];
    var d2y=D1[13];
    var d2z=D1[14];
    var d3x=D1[15];
    var d3y=D1[16];
    var d3z=D1[17];

    var a4x=D2[0];
    var a4y=D2[1];
    var a4z=D2[2];
    var a5x=D2[3];
    var a5y=D2[4];
    var a5z=D2[5];
    var a6x=D2[6];
    var a6y=D2[7];
    var a6z=D2[8];
    var d4x=D2[9];
    var d4y=D2[10];
    var d4z=D2[11];
    var d5x=D2[12];
    var d5y=D2[13];
    var d5z=D2[14];
    var d6x=D2[15];
    var d6y=D2[16];
    var d6z=D2[17];
    
    var a7x=a1y*a4z-a1z*a4y;
    var a7y=a1z*a4x-a1x*a4z;
    var a7z=a1x*a4y-a1y*a4x;
    var a8x=a1y*a5z-a1z*a5y;
    var a8y=a1z*a5x-a1x*a5z;
    var a8z=a1x*a5y-a1y*a5x;
    var a9x=a1y*a6z-a1z*a6y;
    var a9y=a1z*a6x-a1x*a6z;
    var a9z=a1x*a6y-a1y*a6x;
    var aax=a2y*a4z-a2z*a4y;
    var aay=a2z*a4x-a2x*a4z;
    var aaz=a2x*a4y-a2y*a4x;
    var abx=a2y*a5z-a2z*a5y;
    var aby=a2z*a5x-a2x*a5z;
    var abz=a2x*a5y-a2y*a5x;
    var acx=a2y*a6z-a2z*a6y;
    var acy=a2z*a6x-a2x*a6z;
    var acz=a2x*a6y-a2y*a6x;
    var adx=a3y*a4z-a3z*a4y;
    var ady=a3z*a4x-a3x*a4z;
    var adz=a3x*a4y-a3y*a4x;
    var aex=a3y*a5z-a3z*a5y;
    var aey=a3z*a5x-a3x*a5z;
    var aez=a3x*a5y-a3y*a5x;
    var afx=a3y*a6z-a3z*a6y;
    var afy=a3z*a6x-a3x*a6z;
    var afz=a3x*a6y-a3y*a6x;
    // right or left flags
    var right1;
    var right2;
    var right3;
    var right4;
    var right5;
    var right6;
    var right7;
    var right8;
    var right9;
    var righta;
    var rightb;
    var rightc;
    var rightd;
    var righte;
    var rightf;
    // overlapping distances
    var overlap1;
    var overlap2;
    var overlap3;
    var overlap4;
    var overlap5;
    var overlap6;
    var overlap7;
    var overlap8;
    var overlap9;
    var overlapa;
    var overlapb;
    var overlapc;
    var overlapd;
    var overlape;
    var overlapf;
    // invalid flags
    var invalid7=false;
    var invalid8=false;
    var invalid9=false;
    var invalida=false;
    var invalidb=false;
    var invalidc=false;
    var invalidd=false;
    var invalide=false;
    var invalidf=false;
    // temporary variables
    var len;
    var len1;
    var len2;
    var dot1;
    var dot2;
    var dot3;
    // try axis 1
    len=a1x*dx+a1y*dy+a1z*dz;
    right1=len>0;
    if(!right1)len=-len;
    len1=w1;
    dot1=a1x*a4x+a1y*a4y+a1z*a4z;
    dot2=a1x*a5x+a1y*a5y+a1z*a5z;
    dot3=a1x*a6x+a1y*a6y+a1z*a6z;
    if(dot1<0)dot1=-dot1;
    if(dot2<0)dot2=-dot2;
    if(dot3<0)dot3=-dot3;
    len2=dot1*w2+dot2*h2+dot3*d2;
    overlap1=len-len1-len2;
    if(overlap1>0)return;
    // try axis 2
    len=a2x*dx+a2y*dy+a2z*dz;
    right2=len>0;
    if(!right2)len=-len;
    len1=h1;
    dot1=a2x*a4x+a2y*a4y+a2z*a4z;
    dot2=a2x*a5x+a2y*a5y+a2z*a5z;
    dot3=a2x*a6x+a2y*a6y+a2z*a6z;
    if(dot1<0)dot1=-dot1;
    if(dot2<0)dot2=-dot2;
    if(dot3<0)dot3=-dot3;
    len2=dot1*w2+dot2*h2+dot3*d2;
    overlap2=len-len1-len2;
    if(overlap2>0)return;
    // try axis 3
    len=a3x*dx+a3y*dy+a3z*dz;
    right3=len>0;
    if(!right3)len=-len;
    len1=d1;
    dot1=a3x*a4x+a3y*a4y+a3z*a4z;
    dot2=a3x*a5x+a3y*a5y+a3z*a5z;
    dot3=a3x*a6x+a3y*a6y+a3z*a6z;
    if(dot1<0)dot1=-dot1;
    if(dot2<0)dot2=-dot2;
    if(dot3<0)dot3=-dot3;
    len2=dot1*w2+dot2*h2+dot3*d2;
    overlap3=len-len1-len2;
    if(overlap3>0)return;
    // try axis 4
    len=a4x*dx+a4y*dy+a4z*dz;
    right4=len>0;
    if(!right4)len=-len;
    dot1=a4x*a1x+a4y*a1y+a4z*a1z;
    dot2=a4x*a2x+a4y*a2y+a4z*a2z;
    dot3=a4x*a3x+a4y*a3y+a4z*a3z;
    if(dot1<0)dot1=-dot1;
    if(dot2<0)dot2=-dot2;
    if(dot3<0)dot3=-dot3;
    len1=dot1*w1+dot2*h1+dot3*d1;
    len2=w2;
    overlap4=(len-len1-len2)*1.0;
    if(overlap4>0)return;
    // try axis 5
    len=a5x*dx+a5y*dy+a5z*dz;
    right5=len>0;
    if(!right5)len=-len;
    dot1=a5x*a1x+a5y*a1y+a5z*a1z;
    dot2=a5x*a2x+a5y*a2y+a5z*a2z;
    dot3=a5x*a3x+a5y*a3y+a5z*a3z;
    if(dot1<0)dot1=-dot1;
    if(dot2<0)dot2=-dot2;
    if(dot3<0)dot3=-dot3;
    len1=dot1*w1+dot2*h1+dot3*d1;
    len2=h2;
    overlap5=(len-len1-len2)*1.0;
    if(overlap5>0)return;
    // try axis 6
    len=a6x*dx+a6y*dy+a6z*dz;
    right6=len>0;
    if(!right6)len=-len;
    dot1=a6x*a1x+a6y*a1y+a6z*a1z;
    dot2=a6x*a2x+a6y*a2y+a6z*a2z;
    dot3=a6x*a3x+a6y*a3y+a6z*a3z;
    if(dot1<0)dot1=-dot1;
    if(dot2<0)dot2=-dot2;
    if(dot3<0)dot3=-dot3;
    len1=dot1*w1+dot2*h1+dot3*d1;
    len2=d2;
    overlap6=(len-len1-len2)*1.0;
    if(overlap6>0)return;
    // try axis 7
    len=a7x*a7x+a7y*a7y+a7z*a7z;
    if(len>1e-5){
        len=1/Math.sqrt(len);
        a7x*=len;
        a7y*=len;
        a7z*=len;
        len=a7x*dx+a7y*dy+a7z*dz;
        right7=len>0;
        if(!right7)len=-len;
        dot1=a7x*a2x+a7y*a2y+a7z*a2z;
        dot2=a7x*a3x+a7y*a3y+a7z*a3z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len1=dot1*h1+dot2*d1;
        dot1=a7x*a5x+a7y*a5y+a7z*a5z;
        dot2=a7x*a6x+a7y*a6y+a7z*a6z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len2=dot1*h2+dot2*d2;
        overlap7=len-len1-len2;
        if(overlap7>0)return;
    }else{
        right7=false;
        overlap7=0;
        invalid7=true;
    }
    // try axis 8
    len=a8x*a8x+a8y*a8y+a8z*a8z;
    if(len>1e-5){
        len=1/Math.sqrt(len);
        a8x*=len;
        a8y*=len;
        a8z*=len;
        len=a8x*dx+a8y*dy+a8z*dz;
        right8=len>0;
        if(!right8)len=-len;
        dot1=a8x*a2x+a8y*a2y+a8z*a2z;
        dot2=a8x*a3x+a8y*a3y+a8z*a3z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len1=dot1*h1+dot2*d1;
        dot1=a8x*a4x+a8y*a4y+a8z*a4z;
        dot2=a8x*a6x+a8y*a6y+a8z*a6z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len2=dot1*w2+dot2*d2;
        overlap8=len-len1-len2;
        if(overlap8>0)return;
    }else{
        right8=false;
        overlap8=0;
        invalid8=true;
    }
    // try axis 9
    len=a9x*a9x+a9y*a9y+a9z*a9z;
    if(len>1e-5){
        len=1/Math.sqrt(len);
        a9x*=len;
        a9y*=len;
        a9z*=len;
        len=a9x*dx+a9y*dy+a9z*dz;
        right9=len>0;
        if(!right9)len=-len;
        dot1=a9x*a2x+a9y*a2y+a9z*a2z;
        dot2=a9x*a3x+a9y*a3y+a9z*a3z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len1=dot1*h1+dot2*d1;
        dot1=a9x*a4x+a9y*a4y+a9z*a4z;
        dot2=a9x*a5x+a9y*a5y+a9z*a5z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len2=dot1*w2+dot2*h2;
        overlap9=len-len1-len2;
        if(overlap9>0)return;
    }else{
        right9=false;
        overlap9=0;
        invalid9=true;
    }
    // try axis 10
    len=aax*aax+aay*aay+aaz*aaz;
    if(len>1e-5){
        len=1/Math.sqrt(len);
        aax*=len;
        aay*=len;
        aaz*=len;
        len=aax*dx+aay*dy+aaz*dz;
        righta=len>0;
        if(!righta)len=-len;
        dot1=aax*a1x+aay*a1y+aaz*a1z;
        dot2=aax*a3x+aay*a3y+aaz*a3z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len1=dot1*w1+dot2*d1;
        dot1=aax*a5x+aay*a5y+aaz*a5z;
        dot2=aax*a6x+aay*a6y+aaz*a6z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len2=dot1*h2+dot2*d2;
        overlapa=len-len1-len2;
        if(overlapa>0)return;
    }else{
        righta=false;
        overlapa=0;
        invalida=true;
    }
    // try axis 11
    len=abx*abx+aby*aby+abz*abz;
    if(len>1e-5){
        len=1/Math.sqrt(len);
        abx*=len;
        aby*=len;
        abz*=len;
        len=abx*dx+aby*dy+abz*dz;
        rightb=len>0;
        if(!rightb)len=-len;
        dot1=abx*a1x+aby*a1y+abz*a1z;
        dot2=abx*a3x+aby*a3y+abz*a3z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len1=dot1*w1+dot2*d1;
        dot1=abx*a4x+aby*a4y+abz*a4z;
        dot2=abx*a6x+aby*a6y+abz*a6z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len2=dot1*w2+dot2*d2;
        overlapb=len-len1-len2;
        if(overlapb>0)return;
    }else{
        rightb=false;
        overlapb=0;
        invalidb=true;
    }
    // try axis 12
    len=acx*acx+acy*acy+acz*acz;
    if(len>1e-5){
        len=1/Math.sqrt(len);
        acx*=len;
        acy*=len;
        acz*=len;
        len=acx*dx+acy*dy+acz*dz;
        rightc=len>0;
        if(!rightc)len=-len;
        dot1=acx*a1x+acy*a1y+acz*a1z;
        dot2=acx*a3x+acy*a3y+acz*a3z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len1=dot1*w1+dot2*d1;
        dot1=acx*a4x+acy*a4y+acz*a4z;
        dot2=acx*a5x+acy*a5y+acz*a5z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len2=dot1*w2+dot2*h2;
        overlapc=len-len1-len2;
        if(overlapc>0)return;
    }else{
        rightc=false;
        overlapc=0;
        invalidc=true;
    }
    // try axis 13
    len=adx*adx+ady*ady+adz*adz;
    if(len>1e-5){
        len=1/Math.sqrt(len);
        adx*=len;
        ady*=len;
        adz*=len;
        len=adx*dx+ady*dy+adz*dz;
        rightd=len>0;
        if(!rightd)len=-len;
        dot1=adx*a1x+ady*a1y+adz*a1z;
        dot2=adx*a2x+ady*a2y+adz*a2z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len1=dot1*w1+dot2*h1;
        dot1=adx*a5x+ady*a5y+adz*a5z;
        dot2=adx*a6x+ady*a6y+adz*a6z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len2=dot1*h2+dot2*d2;
        overlapd=len-len1-len2;
        if(overlapd>0)return;
    }else{
        rightd=false;
        overlapd=0;
        invalidd=true;
    }
    // try axis 14
    len=aex*aex+aey*aey+aez*aez;
    if(len>1e-5){
        len=1/Math.sqrt(len);
        aex*=len;
        aey*=len;
        aez*=len;
        len=aex*dx+aey*dy+aez*dz;
        righte=len>0;
        if(!righte)len=-len;
        dot1=aex*a1x+aey*a1y+aez*a1z;
        dot2=aex*a2x+aey*a2y+aez*a2z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len1=dot1*w1+dot2*h1;
        dot1=aex*a4x+aey*a4y+aez*a4z;
        dot2=aex*a6x+aey*a6y+aez*a6z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len2=dot1*w2+dot2*d2;
        overlape=len-len1-len2;
        if(overlape>0)return;
    }else{
        righte=false;
        overlape=0;
        invalide=true;
    }
    // try axis 15
    len=afx*afx+afy*afy+afz*afz;
    if(len>1e-5){
        len=1/Math.sqrt(len);
        afx*=len;
        afy*=len;
        afz*=len;
        len=afx*dx+afy*dy+afz*dz;
        rightf=len>0;
        if(!rightf)len=-len;
        dot1=afx*a1x+afy*a1y+afz*a1z;
        dot2=afx*a2x+afy*a2y+afz*a2z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len1=dot1*w1+dot2*h1;
        dot1=afx*a4x+afy*a4y+afz*a4z;
        dot2=afx*a5x+afy*a5y+afz*a5z;
        if(dot1<0)dot1=-dot1;
        if(dot2<0)dot2=-dot2;
        len2=dot1*w2+dot2*h2;
        overlapf=len-len1-len2;
        if(overlapf>0)return;
    }else{
        rightf=false;
        overlapf=0;
        invalidf=true;
    }
    // boxes are overlapping
    var depth=overlap1;
    var depth2=overlap1;
    var minIndex=0;
    var right=right1;
    if(overlap2>depth2){
        depth=overlap2;
        depth2=overlap2;
        minIndex=1;
        right=right2;
    }
    if(overlap3>depth2){
        depth=overlap3;
        depth2=overlap3;
        minIndex=2;
        right=right3;
    }
    if(overlap4>depth2){
        depth=overlap4;
        depth2=overlap4;
        minIndex=3;
        right=right4;
    }
    if(overlap5>depth2){
        depth=overlap5;
        depth2=overlap5;
        minIndex=4;
        right=right5;
    }
    if(overlap6>depth2){
        depth=overlap6;
        depth2=overlap6;
        minIndex=5;
        right=right6;
    }
    if(overlap7-0.01>depth2&&!invalid7){
        depth=overlap7;
        depth2=overlap7-0.01;
        minIndex=6;
        right=right7;
    }
    if(overlap8-0.01>depth2&&!invalid8){
        depth=overlap8;
        depth2=overlap8-0.01;
        minIndex=7;
        right=right8;
    }
    if(overlap9-0.01>depth2&&!invalid9){
        depth=overlap9;
        depth2=overlap9-0.01;
        minIndex=8;
        right=right9;
    }
    if(overlapa-0.01>depth2&&!invalida){
        depth=overlapa;
        depth2=overlapa-0.01;
        minIndex=9;
        right=righta;
    }
    if(overlapb-0.01>depth2&&!invalidb){
        depth=overlapb;
        depth2=overlapb-0.01;
        minIndex=10;
        right=rightb;
    }
    if(overlapc-0.01>depth2&&!invalidc){
        depth=overlapc;
        depth2=overlapc-0.01;
        minIndex=11;
        right=rightc;
    }
    if(overlapd-0.01>depth2&&!invalidd){
        depth=overlapd;
        depth2=overlapd-0.01;
        minIndex=12;
        right=rightd;
    }
    if(overlape-0.01>depth2&&!invalide){
        depth=overlape;
        depth2=overlape-0.01;
        minIndex=13;
        right=righte;
    }
    if(overlapf-0.01>depth2&&!invalidf){
        depth=overlapf;
        minIndex=14;
        right=rightf;
    }
    // normal
    var nx=0;
    var ny=0;
    var nz=0;
    // edge line or face side normal
    var n1x=0;
    var n1y=0;
    var n1z=0;
    var n2x=0;
    var n2y=0;
    var n2z=0;
    // center of current face
    var cx=0;
    var cy=0;
    var cz=0;
    // face side
    var s1x=0;
    var s1y=0;
    var s1z=0;
    var s2x=0;
    var s2y=0;
    var s2z=0;
    // swap b1 b2
    var swap=false;

    //_______________________________________

    if(minIndex==0){// b1.x * b2
        if(right){
            cx=p1x+d1x; cy=p1y+d1y;  cz=p1z+d1z;
            nx=a1x; ny=a1y; nz=a1z;
        }else{
            cx=p1x-d1x; cy=p1y-d1y; cz=p1z-d1z;
            nx=-a1x; ny=-a1y; nz=-a1z;
        }
        s1x=d2x; s1y=d2y; s1z=d2z;
        n1x=-a2x; n1y=-a2y; n1z=-a2z;
        s2x=d3x; s2y=d3y; s2z=d3z;
        n2x=-a3x; n2y=-a3y; n2z=-a3z;
    }
    else if(minIndex==1){// b1.y * b2
        if(right){
            cx=p1x+d2x; cy=p1y+d2y; cz=p1z+d2z;
            nx=a2x; ny=a2y; nz=a2z;
        }else{
            cx=p1x-d2x; cy=p1y-d2y; cz=p1z-d2z;
            nx=-a2x; ny=-a2y; nz=-a2z;
        }
        s1x=d1x; s1y=d1y; s1z=d1z;
        n1x=-a1x; n1y=-a1y; n1z=-a1z;
        s2x=d3x; s2y=d3y; s2z=d3z;
        n2x=-a3x; n2y=-a3y; n2z=-a3z;
    }
    else if(minIndex==2){// b1.z * b2
        if(right){
            cx=p1x+d3x; cy=p1y+d3y; cz=p1z+d3z;
            nx=a3x; ny=a3y; nz=a3z;
        }else{
            cx=p1x-d3x; cy=p1y-d3y; cz=p1z-d3z;
            nx=-a3x; ny=-a3y; nz=-a3z;
        }
        s1x=d1x; s1y=d1y; s1z=d1z;
        n1x=-a1x; n1y=-a1y; n1z=-a1z;
        s2x=d2x; s2y=d2y; s2z=d2z;
        n2x=-a2x; n2y=-a2y; n2z=-a2z;
    }
    else if(minIndex==3){// b2.x * b1
        swap=true;
        if(!right){
            cx=p2x+d4x; cy=p2y+d4y; cz=p2z+d4z;
            nx=a4x; ny=a4y; nz=a4z;
        }else{
            cx=p2x-d4x; cy=p2y-d4y; cz=p2z-d4z;
            nx=-a4x; ny=-a4y; nz=-a4z;
        }
        s1x=d5x; s1y=d5y; s1z=d5z;
        n1x=-a5x; n1y=-a5y; n1z=-a5z;
        s2x=d6x; s2y=d6y; s2z=d6z;
        n2x=-a6x; n2y=-a6y; n2z=-a6z;
    }
    else if(minIndex==4){// b2.y * b1
        swap=true;
        if(!right){
            cx=p2x+d5x; cy=p2y+d5y; cz=p2z+d5z;
            nx=a5x; ny=a5y; nz=a5z;
        }else{
            cx=p2x-d5x; cy=p2y-d5y; cz=p2z-d5z;
            nx=-a5x; ny=-a5y; nz=-a5z;
        }
        s1x=d4x; s1y=d4y; s1z=d4z;
        n1x=-a4x; n1y=-a4y; n1z=-a4z;
        s2x=d6x; s2y=d6y; s2z=d6z;
        n2x=-a6x; n2y=-a6y; n2z=-a6z;
    }
    else if(minIndex==5){// b2.z * b1
        swap=true;
        if(!right){
            cx=p2x+d6x; cy=p2y+d6y; cz=p2z+d6z;
            nx=a6x; ny=a6y; nz=a6z;
        }else{
            cx=p2x-d6x; cy=p2y-d6y; cz=p2z-d6z;
            nx=-a6x; ny=-a6y; nz=-a6z;
        }
        s1x=d4x; s1y=d4y; s1z=d4z;
        n1x=-a4x; n1y=-a4y; n1z=-a4z;
        s2x=d5x; s2y=d5y; s2z=d5z;
        n2x=-a5x; n2y=-a5y; n2z=-a5z;
    }
    else if(minIndex==6){// b1.x * b2.x
        nx=a7x; ny=a7y; nz=a7z;
        n1x=a1x; n1y=a1y; n1z=a1z;
        n2x=a4x; n2y=a4y; n2z=a4z;
    }
    else if(minIndex==7){// b1.x * b2.y
        nx=a8x; ny=a8y; nz=a8z;
        n1x=a1x; n1y=a1y; n1z=a1z;
        n2x=a5x; n2y=a5y; n2z=a5z;
    }
    else if(minIndex==8){// b1.x * b2.z
        nx=a9x; ny=a9y; nz=a9z;
        n1x=a1x; n1y=a1y; n1z=a1z;
        n2x=a6x; n2y=a6y; n2z=a6z;
    }
    else if(minIndex==9){// b1.y * b2.x
        nx=aax; ny=aay; nz=aaz;
        n1x=a2x; n1y=a2y; n1z=a2z;
        n2x=a4x; n2y=a4y; n2z=a4z
    }
    else if(minIndex==10){// b1.y * b2.y
        nx=abx; ny=aby; nz=abz;
        n1x=a2x; n1y=a2y; n1z=a2z;
        n2x=a5x; n2y=a5y; n2z=a5z;
    }
    else if(minIndex==11){// b1.y * b2.z
        nx=acx; ny=acy; nz=acz;
        n1x=a2x; n1y=a2y; n1z=a2z;
        n2x=a6x; n2y=a6y; n2z=a6z;
    }
    else if(minIndex==12){// b1.z * b2.x
        nx=adx;  ny=ady; nz=adz;
        n1x=a3x; n1y=a3y; n1z=a3z;
        n2x=a4x; n2y=a4y; n2z=a4z;
    }
    else if(minIndex==13){// b1.z * b2.y
        nx=aex; ny=aey; nz=aez;
        n1x=a3x; n1y=a3y; n1z=a3z;
        n2x=a5x; n2y=a5y; n2z=a5z;
    }
    else if(minIndex==14){// b1.z * b2.z
        nx=afx; ny=afy; nz=afz;
        n1x=a3x; n1y=a3y; n1z=a3z;
        n2x=a6x; n2y=a6y; n2z=a6z;
    }

    //__________________________________________

    var v;
    if(minIndex>5){
        if(!right){
            nx=-nx; ny=-ny; nz=-nz;
        }
        var distance;
        var maxDistance;
        var vx;
        var vy;
        var vz;
        var v1x;
        var v1y;
        var v1z;
        var v2x;
        var v2y;
        var v2z;
        //vertex1;
        v1x=V1[0]; v1y=V1[1]; v1z=V1[2];
        maxDistance=nx*v1x+ny*v1y+nz*v1z;
        //vertex2;
        vx=V1[3]; vy=V1[4]; vz=V1[5];
        distance=nx*vx+ny*vy+nz*vz;
        if(distance>maxDistance){
            maxDistance=distance;
            v1x=vx; v1y=vy; v1z=vz;
        }
        //vertex3;
        vx=V1[6]; vy=V1[7]; vz=V1[8];
        distance=nx*vx+ny*vy+nz*vz;
        if(distance>maxDistance){
            maxDistance=distance;
            v1x=vx; v1y=vy; v1z=vz;
        }
        //vertex4;
        vx=V1[9]; vy=V1[10]; vz=V1[11];
        distance=nx*vx+ny*vy+nz*vz;
        if(distance>maxDistance){
            maxDistance=distance;
            v1x=vx; v1y=vy; v1z=vz;
        }
        //vertex5;
        vx=V1[12]; vy=V1[13]; vz=V1[14];
        distance=nx*vx+ny*vy+nz*vz;
        if(distance>maxDistance){
            maxDistance=distance;
            v1x=vx; v1y=vy; v1z=vz;
        }
        //vertex6;
        vx=V1[15]; vy=V1[16]; vz=V1[17];
        distance=nx*vx+ny*vy+nz*vz;
        if(distance>maxDistance){
            maxDistance=distance;
            v1x=vx; v1y=vy; v1z=vz;
        }
        //vertex7;
        vx=V1[18]; vy=V1[19]; vz=V1[20];
        distance=nx*vx+ny*vy+nz*vz;
        if(distance>maxDistance){
            maxDistance=distance;
            v1x=vx; v1y=vy; v1z=vz;
        }
        //vertex8;
        vx=V1[21]; vy=V1[22]; vz=V1[23];
        distance=nx*vx+ny*vy+nz*vz;
        if(distance>maxDistance){
            maxDistance=distance;
            v1x=vx; v1y=vy; v1z=vz;
        }
        //vertex1;
        v2x=V2[0]; v2y=V2[1]; v2z=V2[2];
        maxDistance=nx*v2x+ny*v2y+nz*v2z;
        //vertex2;
        vx=V2[3]; vy=V2[4]; vz=V2[5];
        distance=nx*vx+ny*vy+nz*vz;
        if(distance<maxDistance){
            maxDistance=distance;
            v2x=vx; v2y=vy; v2z=vz;
        }
        //vertex3;
        vx=V2[6]; vy=V2[7]; vz=V2[8];
        distance=nx*vx+ny*vy+nz*vz;
        if(distance<maxDistance){
            maxDistance=distance;
            v2x=vx; v2y=vy; v2z=vz;
        }
        //vertex4;
        vx=V2[9]; vy=V2[10]; vz=V2[11];
        distance=nx*vx+ny*vy+nz*vz;
        if(distance<maxDistance){
            maxDistance=distance;
            v2x=vx; v2y=vy; v2z=vz;
        }
        //vertex5;
        vx=V2[12]; vy=V2[13]; vz=V2[14];
        distance=nx*vx+ny*vy+nz*vz;
        if(distance<maxDistance){
            maxDistance=distance;
            v2x=vx; v2y=vy; v2z=vz;
        }
        //vertex6;
        vx=V2[15]; vy=V2[16]; vz=V2[17];
        distance=nx*vx+ny*vy+nz*vz;
        if(distance<maxDistance){
            maxDistance=distance;
            v2x=vx; v2y=vy; v2z=vz;
        }
        //vertex7;
        vx=V2[18]; vy=V2[19]; vz=V2[20];
        distance=nx*vx+ny*vy+nz*vz;
        if(distance<maxDistance){
            maxDistance=distance;
            v2x=vx; v2y=vy; v2z=vz;
        }
        //vertex8;
        vx=V2[21]; vy=V2[22]; vz=V2[23];
        distance=nx*vx+ny*vy+nz*vz;
        if(distance<maxDistance){
            maxDistance=distance;
            v2x=vx; v2y=vy; v2z=vz;
        }
        vx=v2x-v1x; vy=v2y-v1y; vz=v2z-v1z;
        dot1=n1x*n2x+n1y*n2y+n1z*n2z;
        var t=(vx*(n1x-n2x*dot1)+vy*(n1y-n2y*dot1)+vz*(n1z-n2z*dot1))/(1-dot1*dot1);
        manifold.addPoint(v1x+n1x*t+nx*depth*0.5,v1y+n1y*t+ny*depth*0.5,v1z+n1z*t+nz*depth*0.5,nx,ny,nz,depth,false);
        return;
    }
    // now detect face-face collision...
    // target quad
    var q1x;
    var q1y;
    var q1z;
    var q2x;
    var q2y;
    var q2z;
    var q3x;
    var q3y;
    var q3z;
    var q4x;
    var q4y;
    var q4z;
    // search support face and vertex
    var minDot=1;
    var dot=0;
    var minDotIndex=0;
    if(swap){
        dot=a1x*nx+a1y*ny+a1z*nz;
        if(dot<minDot){
            minDot=dot;
            minDotIndex=0;
        }
        if(-dot<minDot){
            minDot=-dot;
            minDotIndex=1;
        }
        dot=a2x*nx+a2y*ny+a2z*nz;
        if(dot<minDot){
            minDot=dot;
            minDotIndex=2;
        }
        if(-dot<minDot){
            minDot=-dot;
            minDotIndex=3;
        }
        dot=a3x*nx+a3y*ny+a3z*nz;
        if(dot<minDot){
            minDot=dot;
            minDotIndex=4;
        }
        if(-dot<minDot){
            minDot=-dot;
            minDotIndex=5;
        }

        if(minDotIndex==0){// x+ face
            q1x=V1[0]; q1y=V1[1]; q1z=V1[2];//vertex1
            q2x=V1[6]; q2y=V1[7]; q2z=V1[8];//vertex3
            q3x=V1[9]; q3y=V1[10]; q3z=V1[11];//vertex4
            q4x=V1[3]; q4y=V1[4]; q4z=V1[5];//vertex2
        }
        else if(minDotIndex==1){// x- face
            q1x=V1[15]; q1y=V1[16]; q1z=V1[17];//vertex6
            q2x=V1[21]; q2y=V1[22]; q2z=V1[23];//vertex8
            q3x=V1[18]; q3y=V1[19]; q3z=V1[20];//vertex7
            q4x=V1[12]; q4y=V1[13]; q4z=V1[14];//vertex5
        }
        else if(minDotIndex==2){// y+ face
            q1x=V1[12]; q1y=V1[13]; q1z=V1[14];//vertex5
            q2x=V1[0]; q2y=V1[1]; q2z=V1[2];//vertex1
            q3x=V1[3]; q3y=V1[4]; q3z=V1[5];//vertex2
            q4x=V1[15]; q4y=V1[16]; q4z=V1[17];//vertex6
        }
        else if(minDotIndex==3){// y- face
            q1x=V1[21]; q1y=V1[22]; q1z=V1[23];//vertex8
            q2x=V1[9]; q2y=V1[10]; q2z=V1[11];//vertex4
            q3x=V1[6]; q3y=V1[7]; q3z=V1[8];//vertex3
            q4x=V1[18]; q4y=V1[19]; q4z=V1[20];//vertex7
        }
        else if(minDotIndex==4){// z+ face
            q1x=V1[12]; q1y=V1[13]; q1z=V1[14];//vertex5
            q2x=V1[18]; q2y=V1[19]; q2z=V1[20];//vertex7
            q3x=V1[6]; q3y=V1[7]; q3z=V1[8];//vertex3
            q4x=V1[0]; q4y=V1[1]; q4z=V1[2];//vertex1
        }
        else if(minDotIndex==5){// z- face
            q1x=V1[3]; q1y=V1[4]; q1z=V1[5];//vertex2
            q2x=V1[6]; q2y=V1[7]; q2z=V1[8];//vertex4
            q3x=V1[21]; q3y=V1[22]; q3z=V1[23];//vertex8
            q4x=V1[15]; q4y=V1[16]; q4z=V1[17];//vertex6
        }

    }else{
        dot=a4x*nx+a4y*ny+a4z*nz;
        if(dot<minDot){
            minDot=dot;
            minDotIndex=0;
        }
        if(-dot<minDot){
            minDot=-dot;
            minDotIndex=1;
        }
        dot=a5x*nx+a5y*ny+a5z*nz;
        if(dot<minDot){
            minDot=dot;
            minDotIndex=2;
        }
        if(-dot<minDot){
            minDot=-dot;
            minDotIndex=3;
        }
        dot=a6x*nx+a6y*ny+a6z*nz;
        if(dot<minDot){
            minDot=dot;
            minDotIndex=4;
        }
        if(-dot<minDot){
            minDot=-dot;
            minDotIndex=5;
        }

        //______________________________________________________

        if(minDotIndex==0){// x+ face
            q1x=V2[0]; q1y=V2[1]; q1z=V2[2];//vertex1
            q2x=V2[6]; q2y=V2[7]; q2z=V2[8];//vertex3
            q3x=V2[9]; q3y=V2[10]; q3z=V2[11];//vertex4
            q4x=V2[3]; q4y=V2[4]; q4z=V2[5];//vertex2
        }
        else if(minDotIndex==1){// x- face
            q1x=V2[15]; q1y=V2[16]; q1z=V2[17];//vertex6
            q2x=V2[21]; q2y=V2[22]; q2z=V2[23]; //vertex8
            q3x=V2[18]; q3y=V2[19]; q3z=V2[20];//vertex7
            q4x=V2[12]; q4y=V2[13]; q4z=V2[14];//vertex5
        }
        else if(minDotIndex==2){// y+ face
            q1x=V2[12]; q1y=V2[13]; q1z=V2[14];//vertex5
            q2x=V2[0]; q2y=V2[1]; q2z=V2[2];//vertex1
            q3x=V2[3]; q3y=V2[4]; q3z=V2[5];//vertex2
            q4x=V2[15]; q4y=V2[16]; q4z=V2[17];//vertex6
        }
        else if(minDotIndex==3){// y- face
            q1x=V2[21]; q1y=V2[22]; q1z=V2[23];//vertex8
            q2x=V2[9]; q2y=V2[10]; q2z=V2[11];//vertex4
            q3x=V2[6]; q3y=V2[7]; q3z=V2[8];//vertex3
            q4x=V2[18]; q4y=V2[19]; q4z=V2[20];//vertex7
        }
        else if(minDotIndex==4){// z+ face
            q1x=V2[12]; q1y=V2[13]; q1z=V2[14];//vertex5
            q2x=V2[18]; q2y=V2[19]; q2z=V2[20];//vertex7
            q3x=V2[6]; q3y=V2[7]; q3z=V2[8];//vertex3
            q4x=V2[0]; q4y=V2[1]; q4z=V2[2];//vertex1
        }
        else if(minDotIndex==5){// z- face
            q1x=V2[3]; q1y=V2[4]; q1z=V2[5];//vertex2
            q2x=V2[9]; q2y=V2[10]; q2z=V2[11];//vertex4
            q3x=V2[21]; q3y=V2[22]; q3z=V2[23];//vertex8
            q4x=V2[15]; q4y=V2[16]; q4z=V2[17];//vertex6
        }
  
    }
    // clip vertices
    var numClipVertices;
    var numAddedClipVertices;
    var index;
    var x1;
    var y1;
    var z1;
    var x2;
    var y2;
    var z2;
    this.clipVertices1[0]=q1x;
    this.clipVertices1[1]=q1y;
    this.clipVertices1[2]=q1z;
    this.clipVertices1[3]=q2x;
    this.clipVertices1[4]=q2y;
    this.clipVertices1[5]=q2z;
    this.clipVertices1[6]=q3x;
    this.clipVertices1[7]=q3y;
    this.clipVertices1[8]=q3z;
    this.clipVertices1[9]=q4x;
    this.clipVertices1[10]=q4y;
    this.clipVertices1[11]=q4z;
    numAddedClipVertices=0;
    x1=this.clipVertices1[9];
    y1=this.clipVertices1[10];
    z1=this.clipVertices1[11];
    dot1=(x1-cx-s1x)*n1x+(y1-cy-s1y)*n1y+(z1-cz-s1z)*n1z;

    //var i = 4;
    //while(i--){
    for(var i=0;i<4;i++){
        index=i*3;
        x2=this.clipVertices1[index];
        y2=this.clipVertices1[index+1];
        z2=this.clipVertices1[index+2];
        dot2=(x2-cx-s1x)*n1x+(y2-cy-s1y)*n1y+(z2-cz-s1z)*n1z;
        if(dot1>0){
            if(dot2>0){
                index=numAddedClipVertices*3;
                numAddedClipVertices++;
                this.clipVertices2[index]=x2;
                this.clipVertices2[index+1]=y2;
                this.clipVertices2[index+2]=z2;
            }else{
                index=numAddedClipVertices*3;
                numAddedClipVertices++;
                t=dot1/(dot1-dot2);
                this.clipVertices2[index]=x1+(x2-x1)*t;
                this.clipVertices2[index+1]=y1+(y2-y1)*t;
                this.clipVertices2[index+2]=z1+(z2-z1)*t;
            }
        }else{
            if(dot2>0){
                index=numAddedClipVertices*3;
                numAddedClipVertices++;
                t=dot1/(dot1-dot2);
                this.clipVertices2[index]=x1+(x2-x1)*t;
                this.clipVertices2[index+1]=y1+(y2-y1)*t;
                this.clipVertices2[index+2]=z1+(z2-z1)*t;
                index=numAddedClipVertices*3;
                numAddedClipVertices++;
                this.clipVertices2[index]=x2;
                this.clipVertices2[index+1]=y2;
                this.clipVertices2[index+2]=z2;
            }
        }
        x1=x2;
        y1=y2;
        z1=z2;
        dot1=dot2;
    }

    numClipVertices=numAddedClipVertices;
    if(numClipVertices==0)return;
    numAddedClipVertices=0;
    index=(numClipVertices-1)*3;
    x1=this.clipVertices2[index];
    y1=this.clipVertices2[index+1];
    z1=this.clipVertices2[index+2];
    dot1=(x1-cx-s2x)*n2x+(y1-cy-s2y)*n2y+(z1-cz-s2z)*n2z;

    //i = numClipVertices;
    //while(i--){
    for(i=0;i<numClipVertices;i++){
        index=i*3;
        x2=this.clipVertices2[index];
        y2=this.clipVertices2[index+1];
        z2=this.clipVertices2[index+2];
        dot2=(x2-cx-s2x)*n2x+(y2-cy-s2y)*n2y+(z2-cz-s2z)*n2z;
        if(dot1>0){
            if(dot2>0){
                index=numAddedClipVertices*3;
                numAddedClipVertices++;
                this.clipVertices1[index]=x2;
                this.clipVertices1[index+1]=y2;
                this.clipVertices1[index+2]=z2;
            }else{
                index=numAddedClipVertices*3;
                numAddedClipVertices++;
                t=dot1/(dot1-dot2);
                this.clipVertices1[index]=x1+(x2-x1)*t;
                this.clipVertices1[index+1]=y1+(y2-y1)*t;
                this.clipVertices1[index+2]=z1+(z2-z1)*t;
            }
        }else{
            if(dot2>0){
                index=numAddedClipVertices*3;
                numAddedClipVertices++;
                t=dot1/(dot1-dot2);
                this.clipVertices1[index]=x1+(x2-x1)*t;
                this.clipVertices1[index+1]=y1+(y2-y1)*t;
                this.clipVertices1[index+2]=z1+(z2-z1)*t;
                index=numAddedClipVertices*3;
                numAddedClipVertices++;
                this.clipVertices1[index]=x2;
                this.clipVertices1[index+1]=y2;
                this.clipVertices1[index+2]=z2;
            }
        }
        x1=x2;
        y1=y2;
        z1=z2;
        dot1=dot2;
    }

    numClipVertices=numAddedClipVertices;
    if(numClipVertices==0)return;
    numAddedClipVertices=0;
    index=(numClipVertices-1)*3;
    x1=this.clipVertices1[index];
    y1=this.clipVertices1[index+1];
    z1=this.clipVertices1[index+2];
    dot1=(x1-cx+s1x)*-n1x+(y1-cy+s1y)*-n1y+(z1-cz+s1z)*-n1z;

    //i = numClipVertices;
    //while(i--){
    for(i=0;i<numClipVertices;i++){
        index=i*3;
        x2=this.clipVertices1[index];
        y2=this.clipVertices1[index+1];
        z2=this.clipVertices1[index+2];
        dot2=(x2-cx+s1x)*-n1x+(y2-cy+s1y)*-n1y+(z2-cz+s1z)*-n1z;
        if(dot1>0){
            if(dot2>0){
                index=numAddedClipVertices*3;
                numAddedClipVertices++;
                this.clipVertices2[index]=x2;
                this.clipVertices2[index+1]=y2;
                this.clipVertices2[index+2]=z2;
            }else{
                index=numAddedClipVertices*3;
                numAddedClipVertices++;
                t=dot1/(dot1-dot2);
                this.clipVertices2[index]=x1+(x2-x1)*t;
                this.clipVertices2[index+1]=y1+(y2-y1)*t;
                this.clipVertices2[index+2]=z1+(z2-z1)*t;
            }
        }else{
            if(dot2>0){
                index=numAddedClipVertices*3;
                numAddedClipVertices++;
                t=dot1/(dot1-dot2);
                this.clipVertices2[index]=x1+(x2-x1)*t;
                this.clipVertices2[index+1]=y1+(y2-y1)*t;
                this.clipVertices2[index+2]=z1+(z2-z1)*t;
                index=numAddedClipVertices*3;
                numAddedClipVertices++;
                this.clipVertices2[index]=x2;
                this.clipVertices2[index+1]=y2;
                this.clipVertices2[index+2]=z2;
            }
        }
        x1=x2;
        y1=y2;
        z1=z2;
        dot1=dot2;
    }

    numClipVertices=numAddedClipVertices;
    if(numClipVertices==0)return;
    numAddedClipVertices=0;
    index=(numClipVertices-1)*3;
    x1=this.clipVertices2[index];
    y1=this.clipVertices2[index+1];
    z1=this.clipVertices2[index+2];
    dot1=(x1-cx+s2x)*-n2x+(y1-cy+s2y)*-n2y+(z1-cz+s2z)*-n2z;

    //i = numClipVertices;
    //while(i--){
    for(i=0;i<numClipVertices;i++){
        index=i*3;
        x2=this.clipVertices2[index];
        y2=this.clipVertices2[index+1];
        z2=this.clipVertices2[index+2];
        dot2=(x2-cx+s2x)*-n2x+(y2-cy+s2y)*-n2y+(z2-cz+s2z)*-n2z;
        if(dot1>0){
            if(dot2>0){
                index=numAddedClipVertices*3;
                numAddedClipVertices++;
                this.clipVertices1[index]=x2;
                this.clipVertices1[index+1]=y2;
                this.clipVertices1[index+2]=z2;
            }else{
                index=numAddedClipVertices*3;
                numAddedClipVertices++;
                t=dot1/(dot1-dot2);
                this.clipVertices1[index]=x1+(x2-x1)*t;
                this.clipVertices1[index+1]=y1+(y2-y1)*t;
                this.clipVertices1[index+2]=z1+(z2-z1)*t;
            }
        }else{
            if(dot2>0){
                index=numAddedClipVertices*3;
                numAddedClipVertices++;
                t=dot1/(dot1-dot2);
                this.clipVertices1[index]=x1+(x2-x1)*t;
                this.clipVertices1[index+1]=y1+(y2-y1)*t;
                this.clipVertices1[index+2]=z1+(z2-z1)*t;
                index=numAddedClipVertices*3;
                numAddedClipVertices++;
                this.clipVertices1[index]=x2;
                this.clipVertices1[index+1]=y2;
                this.clipVertices1[index+2]=z2;
            }
        }
        x1=x2;
        y1=y2;
        z1=z2;
        dot1=dot2;
    }

    numClipVertices=numAddedClipVertices;
    if(swap){
        var tb=b1;
        b1=b2;
        b2=tb;
    }
    if(numClipVertices==0)return;
    var flipped=b1!=shape1;
    if(numClipVertices>4){
        x1=(q1x+q2x+q3x+q4x)*0.25;
        y1=(q1y+q2y+q3y+q4y)*0.25;
        z1=(q1z+q2z+q3z+q4z)*0.25;
        n1x=q1x-x1;
        n1y=q1y-y1;
        n1z=q1z-z1;
        n2x=q2x-x1;
        n2y=q2y-y1;
        n2z=q2z-z1;
        var index1=0;
        var index2=0;
        var index3=0;
        var index4=0;
        var maxDot=-this.INF;
        minDot=this.INF;

        //i = numClipVertices;
        //while(i--){
        for(i=0;i<numClipVertices;i++){
            this.used[i]=false;
            index=i*3;
            x1=this.clipVertices1[index];
            y1=this.clipVertices1[index+1];
            z1=this.clipVertices1[index+2];
            dot=x1*n1x+y1*n1y+z1*n1z;
            if(dot<minDot){
                minDot=dot;
                index1=i;
            }
            if(dot>maxDot){
                maxDot=dot;
                index3=i;
            }
        }

        this.used[index1]=true;
        this.used[index3]=true;
        maxDot=-this.INF;
        minDot=this.INF;

        //i = numClipVertices;
        //while(i--){
        for(i=0;i<numClipVertices;i++){
            if(this.used[i])continue;
            index=i*3;
            x1=this.clipVertices1[index];
            y1=this.clipVertices1[index+1];
            z1=this.clipVertices1[index+2];
            dot=x1*n2x+y1*n2y+z1*n2z;
            if(dot<minDot){
                minDot=dot;
                index2=i;
            }
            if(dot>maxDot){
                maxDot=dot;
                index4=i;
            }
        }

        index=index1*3;
        x1=this.clipVertices1[index];
        y1=this.clipVertices1[index+1];
        z1=this.clipVertices1[index+2];
        dot=(x1-cx)*nx+(y1-cy)*ny+(z1-cz)*nz;
        if(dot<0) manifold.addPoint(x1,y1,z1,nx,ny,nz,dot,flipped);
        
        index=index2*3;
        x1=this.clipVertices1[index];
        y1=this.clipVertices1[index+1];
        z1=this.clipVertices1[index+2];
        dot=(x1-cx)*nx+(y1-cy)*ny+(z1-cz)*nz;
        if(dot<0) manifold.addPoint(x1,y1,z1,nx,ny,nz,dot,flipped);
        
        index=index3*3;
        x1=this.clipVertices1[index];
        y1=this.clipVertices1[index+1];
        z1=this.clipVertices1[index+2];
        dot=(x1-cx)*nx+(y1-cy)*ny+(z1-cz)*nz;
        if(dot<0) manifold.addPoint(x1,y1,z1,nx,ny,nz,dot,flipped);
        
        index=index4*3;
        x1=this.clipVertices1[index];
        y1=this.clipVertices1[index+1];
        z1=this.clipVertices1[index+2];
        dot=(x1-cx)*nx+(y1-cy)*ny+(z1-cz)*nz;
        if(dot<0) manifold.addPoint(x1,y1,z1,nx,ny,nz,dot,flipped);
        
    }else{
        //i = numClipVertices;
        //while(i--){
        for(i=0;i<numClipVertices;i++){
            index=i*3;
            x1=this.clipVertices1[index];
            y1=this.clipVertices1[index+1];
            z1=this.clipVertices1[index+2];
            dot=(x1-cx)*nx+(y1-cy)*ny+(z1-cz)*nz;
            if(dot<0)manifold.addPoint(x1,y1,z1,nx,ny,nz,dot,flipped);
        }
    }

}
/**
 * A collision detector which detects collisions between sphere and box.
 * @author saharan
 */
OIMO.SphereBoxCollisionDetector = function(flip){
    OIMO.CollisionDetector.call( this );
    this.flip=flip;
}
OIMO.SphereBoxCollisionDetector.prototype = Object.create( OIMO.CollisionDetector.prototype );
OIMO.SphereBoxCollisionDetector.prototype.detectCollision = function(shape1,shape2,manifold){
    var s;
    var b;
    if(this.flip){
        s=(shape2);
        b=(shape1);
    }else{
        s=(shape1);
        b=(shape2);
    }

    var D = b.dimentions;

    var ps=s.position;
    var psx=ps.x;
    var psy=ps.y;
    var psz=ps.z;
    var pb=b.position;
    var pbx=pb.x;
    var pby=pb.y;
    var pbz=pb.z;
    var rad=s.radius;

    var hw=b.halfWidth;
    var hh=b.halfHeight;
    var hd=b.halfDepth;

    var dx=psx-pbx;
    var dy=psy-pby;
    var dz=psz-pbz;
    var sx=D[0]*dx+D[1]*dy+D[2]*dz;
    var sy=D[3]*dx+D[4]*dy+D[5]*dz;
    var sz=D[6]*dx+D[7]*dy+D[8]*dz;
    var cx;
    var cy;
    var cz;
    var len;
    var invLen;
    var overlap=0;
    if(sx>hw){
        sx=hw;
    }else if(sx<-hw){
        sx=-hw;
    }else{
        overlap=1;
    }
    if(sy>hh){
        sy=hh;
    }else if(sy<-hh){
        sy=-hh;
    }else{
        overlap|=2;
    }
    if(sz>hd){
        sz=hd;
    }else if(sz<-hd){
        sz=-hd;
    }else{
        overlap|=4;
    }
    if(overlap==7){
        // center of sphere is in the box
        if(sx<0){
            dx=hw+sx;
        }else{
            dx=hw-sx;
        }
        if(sy<0){
            dy=hh+sy;
        }else{
            dy=hh-sy;
        }
        if(sz<0){
            dz=hd+sz;
        }else{
            dz=hd-sz;
        }
        if(dx<dy){
            if(dx<dz){
                len=dx-hw;
            if(sx<0){
                sx=-hw;
                dx=D[0];
                dy=D[1];
                dz=D[2];
            }else{
                sx=hw;
                dx=-D[0];
                dy=-D[1];
                dz=-D[2];
            }
        }else{
            len=dz-hd;
            if(sz<0){
                sz=-hd;
                dx=D[6];
                dy=D[7];
                dz=D[8];
            }else{
                sz=hd;
                dx=-D[6];
                dy=-D[7];
                dz=-D[8];
            }
        }
        }else{
            if(dy<dz){
                len=dy-hh;
                if(sy<0){
                    sy=-hh;
                    dx=D[3];
                    dy=D[4];
                    dz=D[5];
                }else{
                    sy=hh;
                    dx=-D[3];
                    dy=-D[4];
                    dz=-D[5];
                }
            }else{
                len=dz-hd;
                if(sz<0){
                    sz=-hd;
                    dx=D[6];
                    dy=D[7];
                    dz=D[8];
                }else{
                    sz=hd;
                    dx=-D[6];
                    dy=-D[7];
                    dz=-D[8];
            }
        }
    }
    cx=pbx+sx*D[0]+sy*D[3]+sz*D[6];
    cy=pby+sx*D[1]+sy*D[4]+sz*D[7];
    cz=pbz+sx*D[2]+sy*D[5]+sz*D[8];
    manifold.addPoint(psx+rad*dx,psy+rad*dy,psz+rad*dz,dx,dy,dz,len-rad,this.flip);
    }else{
        cx=pbx+sx*D[0]+sy*D[3]+sz*D[6];
        cy=pby+sx*D[1]+sy*D[4]+sz*D[7];
        cz=pbz+sx*D[2]+sy*D[5]+sz*D[8];
        dx=cx-ps.x;
        dy=cy-ps.y;
        dz=cz-ps.z;
        len=dx*dx+dy*dy+dz*dz;
        if(len>0&&len<rad*rad){
            len=Math.sqrt(len);
            invLen=1/len;
            dx*=invLen;
            dy*=invLen;
            dz*=invLen;
            manifold.addPoint(psx+rad*dx,psy+rad*dy,psz+rad*dz,dx,dy,dz,len-rad,this.flip);
        }
    }

}
/**
 * A collision detector which detects collisions between two spheres.
 * @author saharan
 */
OIMO.SphereSphereCollisionDetector = function(){
    OIMO.CollisionDetector.call( this );
}
OIMO.SphereSphereCollisionDetector.prototype = Object.create( OIMO.CollisionDetector.prototype );
OIMO.SphereSphereCollisionDetector.prototype.detectCollision = function(shape1,shape2,manifold){
    var s1=(shape1);
    var s2=(shape2);
    var p1=s1.position;
    var p2=s2.position;
    var dx=p2.x-p1.x;
    var dy=p2.y-p1.y;
    var dz=p2.z-p1.z;
    var len=dx*dx+dy*dy+dz*dz;
    var r1=s1.radius;
    var r2=s2.radius;
    var rad=r1+r2;
    if(len>0&&len<rad*rad){
        len=Math.sqrt(len);
        var invLen=1/len;
        dx*=invLen;
        dy*=invLen;
        dz*=invLen;
        manifold.addPoint(p1.x+dx*r1,p1.y+dy*r1,p1.z+dz*r1,dx,dy,dz,len-rad,false);
    }
}
/**
* An axis-aligned bounding box.
* @author saharan
*/
OIMO.AABB = function(minX,maxX,minY,maxY,minZ,maxZ){
    this.minX=minX || 0;
    this.maxX=maxX || 0;
    this.minY=minY || 0;
    this.maxY=maxY || 0;
    this.minZ=minZ || 0;
    this.maxZ=maxZ || 0;
}

OIMO.AABB.prototype = {

    constructor: OIMO.AABB,

    init:function(minX,maxX,minY,maxY,minZ,maxZ){
        this.minX=minX;
        this.maxX=maxX;
        this.minY=minY;
        this.maxY=maxY;
        this.minZ=minZ;
        this.maxZ=maxZ;
    },
    /**
    * Set this AABB to the combined AABB of aabb1 and aabb2.
    * @param   aabb1
    * @param   aabb2
    */
    combine:function(aabb1,aabb2){
        this.minX = (aabb1.minX<aabb2.minX) ? aabb1.minX : aabb2.minX;
        this.maxX = (aabb1.maxX>aabb2.maxX) ? aabb1.maxX : aabb2.maxX;
        this.minY = (aabb1.minY<aabb2.minY) ? aabb1.minY : aabb2.minY;
        this.maxY = (aabb1.maxY>aabb2.maxY) ? aabb1.maxY : aabb2.maxY;
        this.minZ = (aabb1.minZ<aabb2.minZ) ? aabb1.minZ : aabb2.minZ;
        this.maxZ = (aabb1.maxZ>aabb2.maxZ) ? aabb1.maxZ : aabb2.maxZ;
        /*
        var margin=0;
        this.minX-=margin;
        this.minY-=margin;
        this.minZ-=margin;
        this.maxX+=margin;
        this.maxY+=margin;
        this.maxZ+=margin;
        */
    },
    /**
    * Get the surface area.
    * @return
    */
    surfaceArea:function(){
        var h=this.maxY-this.minY;
        var d=this.maxZ-this.minZ;
        return 2*((this.maxX-this.minX)*(h+d)+h*d);
    },
    /**
    * Get whether the AABB intersects with the point or not.
    * @param   x
    * @param   y
    * @param   z
    * @return
    */
    intersectsWithPoint:function(x,y,z){
        return x>=this.minX&&x<=this.maxX&&y>=this.minY&&y<=this.maxY&&z>=this.minZ&&z<=this.maxZ;
    }
}
/**
* A proxy is used for broad-phase collecting pairs that can be colliding.
*/
OIMO.Proxy = function(shape){
	// The parent shape.
    this.shape=shape;
    // The axis-aligned bounding box.
    this.aabb=shape.aabb;
};

OIMO.Proxy.prototype = {

    constructor: OIMO.Proxy,
    
    /**
	* Update the proxy.
	*/
    update:function(){
        throw new Error("Inheritance error.");
    }
}
/**
* A basic implementation of proxies.
* @author saharan
*/
OIMO.BasicProxy = function(shape){
    OIMO.Proxy.call( this, shape );
}
OIMO.BasicProxy.prototype = Object.create( OIMO.Proxy.prototype );
OIMO.BasicProxy.prototype.update = function () {
}
/**
* The broad-phase is used for collecting all possible pairs for collision.
*/

OIMO.BroadPhase = function(){
    this.types = 0x0;
    this.numPairChecks=0;
    this.numPairs=0;
    
    this.bufferSize=256;
    this.pairs=[];// vector
    this.pairs.length = this.bufferSize;
    var i = this.bufferSize;
    while(i--){
        this.pairs[i] = new OIMO.Pair();
    }
}

OIMO.BroadPhase.prototype = {

    constructor: OIMO.BroadPhase,
    /**
    * Create a new proxy.
    * @param   shape
    * @return
    */
    createProxy:function(shape){
        throw new Error("Inheritance error.");
    },
    /**
    * Add the proxy into the broad-phase.
    * @param   proxy
    */
    addProxy:function(proxy){
        throw new Error("Inheritance error.");
    },
    /**
    * Remove the proxy from the broad-phase.
    * @param   proxy
    */
    removeProxy:function(proxy){
        throw new Error("Inheritance error.");
    },
    /**
    * Returns whether the pair is available or not.
    * @param   s1
    * @param   s2
    * @return
    */
    isAvailablePair:function(s1,s2){
        var b1=s1.parent;
        var b2=s2.parent;
        if( b1==b2 || // same parents 
            (!b1.isDynamic&&!b2.isDynamic) || // static or kinematic object
            (s1.belongsTo&s2.collidesWith)==0 ||
             (s2.belongsTo&s1.collidesWith)==0 // collision filtering
        ){ return false; }
        var js;
        if(b1.numJoints<b2.numJoints) js=b1.jointLink;
        else js=b2.jointLink;
        while(js!=null){
           var joint=js.joint;
           if( !joint.allowCollision && (joint.body1==b1&&joint.body2==b2 || joint.body1==b2&&joint.body2==b1) ){ return false; }
           js=js.next;
        }
        return true;
    },
    // Detect overlapping pairs.
    detectPairs:function(){
        while(this.numPairs>0){
            var pair=this.pairs[--this.numPairs];
            pair.shape1=null;
            pair.shape2=null;
        }
        this.numPairChecks=0;
        this.collectPairs();
    },
    collectPairs:function(){
        throw new Error("Inheritance error.");
    },
    addPair:function(s1,s2){
        if(this.numPairs==this.bufferSize){ // expand pair buffer
            var newBufferSize=this.bufferSize<<1;
            //var newBufferSize=this.bufferSize*2;
            var newPairs=[];// vector
            newPairs.length = this.bufferSize;
            //var i = this.bufferSize;
            //var j;
            //while(i--){
            for(var i=0, j=this.bufferSize;i<j;i++){
                newPairs[i]=this.pairs[i];
            }
            i = this.newBufferSize;
            //j = this.bufferSize;
            //while(i-- >= j){
            for(i=this.bufferSize, j=newBufferSize;i<j;i++){
                newPairs[i]=new OIMO.Pair();
            }
            this.pairs=newPairs;
            this.bufferSize=newBufferSize;
        }
        var pair=this.pairs[this.numPairs++];
        pair.shape1=s1;
        pair.shape2=s2;
    }
}
/**
* A broad-phase algorithm with brute-force search.
* This always checks for all possible pairs.
*/
OIMO.BruteForceBroadPhase = function(){
    OIMO.BroadPhase.call( this);
    this.types = 0x1;
    this.numProxies=0;
    this.maxProxies = 256;
    this.proxies = [];// Vector !
    this.proxies.length = 256;
}

OIMO.BruteForceBroadPhase.prototype = Object.create( OIMO.BroadPhase.prototype );

OIMO.BruteForceBroadPhase.prototype.createProxy = function (shape) {
    return new OIMO.BasicProxy(shape);
}
OIMO.BruteForceBroadPhase.prototype.addProxy = function (proxy) {
    if(this.numProxies==this.maxProxies){
        //this.maxProxies<<=1;
        this.maxProxies*=2;
        var newProxies=[];
        newProxies.length = this.maxProxies;
        var i = this.numProxies;
        while(i--){
        //for(var i=0, l=this.numProxies;i<l;i++){
            newProxies[i]=this.proxies[i];
        }
        this.proxies=newProxies;
    }
    this.proxies[this.numProxies++]=proxy;
}
OIMO.BruteForceBroadPhase.prototype.removeProxy = function (proxy) {
    var i = this.numProxies;
    while(i--){
    //for(var i=0, l=this.numProxies;i<l;i++){
        if(this.proxies[i]==proxy){
            this.proxies[i]=this.proxies[--this.numProxies];
            this.proxies[this.numProxies]=null;
            return;
        }
    }
}
OIMO.BruteForceBroadPhase.prototype.collectPairs = function () {
    this.numPairChecks=this.numProxies*(this.numProxies-1)>>1;
    //this.numPairChecks=this.numProxies*(this.numProxies-1)*0.5;
        var i = this.numProxies;
        while(i--){
        //for(var i=0, l=this.numProxies;i<l;i++){
            var p1=this.proxies[i];
            var b1=p1.aabb;
            var s1=p1.shape;
            var j = this.numProxies;
            while(j--){ if(j!==i){
            //for(var j=i+1, m=this.numProxies;j<m;j++){
                var p2=this.proxies[j];
                var b2=p2.aabb;
                var s2=p2.shape;
                if(b1.maxX<b2.minX||b1.minX>b2.maxX|| b1.maxY<b2.minY||b1.minY>b2.maxY|| b1.maxZ<b2.minZ||b1.minZ>b2.maxZ|| !this.isAvailablePair(s1,s2) ){
                    continue;
                }
                    this.addPair(s1,s2);
                }}
        }
}
/**
* A pair of shapes that may collide.
* @author saharan
*/
OIMO.Pair = function(){
	// The first shape.
    this.shape1=null;
    // The second shape.
    this.shape2=null;
};
/**
* A projection axis for sweep and prune broad-phase.
* @author saharan
*/
OIMO.SAPAxis = function(){
    this.numElements=0;
    this.bufferSize=256;
    this.elements=[];
    this.elements.length = this.bufferSize;
    this.stack=new OIMO_ARRAY_TYPE(64);
};

OIMO.SAPAxis.prototype = {

    constructor: OIMO.SAPAxis,

    addElements:function(min,max){
        if(this.numElements+2>=this.bufferSize){
            //this.bufferSize<<=1;
            this.bufferSize*=2;
            var newElements=[];
            var i = this.numElements;
            while(i--){
            //for(var i=0, l=this.numElements; i<l; i++){
                newElements[i]=this.elements[i];
            }
        }
        this.elements[this.numElements++]=min;
        this.elements[this.numElements++]=max;
    },
    removeElements:function(min,max){
        var minIndex=-1;
        var maxIndex=-1;
        for(var i=0, l=this.numElements; i<l; i++){
            var e=this.elements[i];
            if(e==min||e==max){
                if(minIndex==-1){
                    minIndex=i;
                }else{
                    maxIndex=i;
                break;
                }
            }
        }
        for(i=minIndex+1, l=maxIndex; i<l; i++){
            this.elements[i-1]=this.elements[i];
        }
        for(i=maxIndex+1, l=this.numElements; i<l; i++){
            this.elements[i-2]=this.elements[i];
        }

        this.elements[--this.numElements]=null;
        this.elements[--this.numElements]=null;
    },
    sort:function(){
        var count=0;
        var threshold=1;
        while((this.numElements>>threshold)!=0)threshold++;
        threshold=threshold*this.numElements>>2;
        count=0;
        var giveup=false;
        var elements=this.elements;
        for(var i=1, l=this.numElements; i<l; i++){ // try insertion sort
            var tmp=elements[i];
            var pivot=tmp.value;
            var tmp2=elements[i-1];
            if(tmp2.value>pivot){
                var j=i;
                do{
                    elements[j]=tmp2;
                    if(--j==0)break;
                    tmp2=elements[j-1];
                }while(tmp2.value>pivot);
                elements[j]=tmp;
                count+=i-j;
                if(count>threshold){
                    giveup=true; // stop and use quick sort
                    break;
                }
            }
        }
        if(!giveup)return;
        count=2;var stack=this.stack;
        stack[0]=0;
        stack[1]=this.numElements-1;
        while(count>0){
            var right=stack[--count];
            var left=stack[--count];
            var diff=right-left;
            if(diff>16){  // quick sort
                //var mid=left+(diff>>1);
                var mid=left+(Math.floor(diff*0.5));
                tmp=elements[mid];
                elements[mid]=elements[right];
                elements[right]=tmp;
                pivot=tmp.value;
                i=left-1;
                j=right;
                while(true){
                    var ei;
                    var ej;
                    do{ ei=elements[++i]; }while(ei.value<pivot);
                    do{ ej=elements[--j]; }while(pivot<ej.value&&j!=left);
                    if(i>=j)break;
                    elements[i]=ej;
                    elements[j]=ei;
                }

                elements[right]=elements[i];
                elements[i]=tmp;
                if(i-left>right-i){
                    stack[count++]=left;
                    stack[count++]=i-1;
                    stack[count++]=i+1;
                    stack[count++]=right;
                }else{
                    stack[count++]=i+1;
                    stack[count++]=right;
                    stack[count++]=left;
                    stack[count++]=i-1;
                }
            }else{
                for(i=left+1;i<=right;i++){
                    tmp=elements[i];
                    pivot=tmp.value;
                    tmp2=elements[i-1];
                    if(tmp2.value>pivot){
                        j=i;
                        do{
                            elements[j]=tmp2;
                            if(--j==0)break;
                            tmp2=elements[j-1];
                        }while(tmp2.value>pivot);
                        elements[j]=tmp;
                    }
                }
            }
        }
    },
    calculateTestCount:function(){
        var num=1;
        var sum=0;
        for(var i=1, l=this.numElements; i<l; i++){
            if(this.elements[i].max){
                num--;
            }else{
                sum+=num;
                num++;
            }
        }
        return sum;
    }
}
/**
* A broad-phase collision detection algorithm using sweep and prune.
* @author saharan
*/
OIMO.SAPBroadPhase = function(){
    OIMO.BroadPhase.call( this);
    this.types = 0x2;

    this.numElementsD = 0;
    this.numElementsS = 0;
    // dynamic proxies
    this.axesD = [];// vector !
    // static or sleeping proxies
    this.axesS = [];// vector !
    this.axesD.length = 3;
    this.axesS.length = 3;

    this.axesD[0]=new OIMO.SAPAxis();
    this.axesD[1]=new OIMO.SAPAxis();
    this.axesD[2]=new OIMO.SAPAxis();
    this.axesS[0]=new OIMO.SAPAxis();
    this.axesS[1]=new OIMO.SAPAxis();
    this.axesS[2]=new OIMO.SAPAxis();
    this.index1=0;
    this.index2=1;
}

OIMO.SAPBroadPhase.prototype = Object.create( OIMO.BroadPhase.prototype );

OIMO.SAPBroadPhase.prototype.createProxy = function (shape) {
    return new OIMO.SAPProxy(this,shape);
}

OIMO.SAPBroadPhase.prototype.addProxy = function (proxy) {
    var p=(proxy);
    if(p.isDynamic()){
        this.axesD[0].addElements(p.min[0],p.max[0]);
        this.axesD[1].addElements(p.min[1],p.max[1]);
        this.axesD[2].addElements(p.min[2],p.max[2]);
        p.belongsTo=1;
        this.numElementsD+=2;
        }else{
        this.axesS[0].addElements(p.min[0],p.max[0]);
        this.axesS[1].addElements(p.min[1],p.max[1]);
        this.axesS[2].addElements(p.min[2],p.max[2]);
        p.belongsTo=2;
        this.numElementsS+=2;
    }
}

OIMO.SAPBroadPhase.prototype.removeProxy = function (proxy) {
    var p=(proxy);
    if(p.belongsTo==0)return;
    switch(p.belongsTo){
        case 1:
        this.axesD[0].removeElements(p.min[0],p.max[0]);
        this.axesD[1].removeElements(p.min[1],p.max[1]);
        this.axesD[2].removeElements(p.min[2],p.max[2]);
        this.numElementsD-=2;
        break;
        case 2:
        this.axesS[0].removeElements(p.min[0],p.max[0]);
        this.axesS[1].removeElements(p.min[1],p.max[1]);
        this.axesS[2].removeElements(p.min[2],p.max[2]);
        this.numElementsS-=2;
        break;
    }
    p.belongsTo=0;
}

OIMO.SAPBroadPhase.prototype.collectPairs = function () {
    if(this.numElementsD==0)return;
    var axis1=this.axesD[this.index1];
    var axis2=this.axesD[this.index2];
    axis1.sort();
    axis2.sort();
    var count1=axis1.calculateTestCount();
    var count2=axis2.calculateTestCount();
    var elementsD;
    var elementsS;
    if(count1<=count2){// select the best axis
        axis2=this.axesS[this.index1];
        axis2.sort();
        elementsD=axis1.elements;
        elementsS=axis2.elements;
    }else{
        axis1=this.axesS[this.index2];
        axis1.sort();
        elementsD=axis2.elements;
        elementsS=axis1.elements;
        this.index1^=this.index2;
        this.index2^=this.index1;
        this.index1^=this.index2;
    }
    var activeD;
    var activeS;
    var p=0;
    var q=0;
    while(p<this.numElementsD){
        var e1;
        var dyn;
        if(q==this.numElementsS){
            e1=elementsD[p];
            dyn=true;
            p++;
        }else{
            var d=elementsD[p];
            var s=elementsS[q];
            if(d.value<s.value){
                e1=d;
                dyn=true;
                p++;
            }else{
                e1=s;
                dyn=false;
                q++;
            }
        }
        if(!e1.max){
            var s1=e1.proxy.shape;var min1=e1.min1.value;var max1=e1.max1.value;var min2=e1.min2.value;var max2=e1.max2.value;
            for(var e2=activeD;e2!=null;e2=e2.pair){// test for dynamic
                var s2=e2.proxy.shape;
                this.numPairChecks++;
                if( min1>e2.max1.value||max1<e2.min1.value|| min2>e2.max2.value||max2<e2.min2.value|| !this.isAvailablePair(s1,s2) ){ continue; }
                this.addPair(s1,s2);
            }
            if(dyn){
                for(e2=activeS;e2!=null;e2=e2.pair){// test for static
                    s2=e2.proxy.shape;
                    this.numPairChecks++;
                    if( min1>e2.max1.value||max1<e2.min1.value|| min2>e2.max2.value||max2<e2.min2.value|| !this.isAvailablePair(s1,s2) ){ continue; }
                    this.addPair(s1,s2);
                }
                e1.pair=activeD;
                activeD=e1;
            }else{
                e1.pair=activeS;
                activeS=e1;
            }
        }else{
            var min=e1.pair;
            if(dyn){
                if(min==activeD){
                    activeD=activeD.pair;
                    continue;
                }else{
                    e1=activeD;
                }
            }else{
                if(min==activeS){
                    activeS=activeS.pair;
                    continue;
                }else{
                    e1=activeS;
                }
            }
            do{
                e2=e1.pair;
                if(e2===min){
                    e1.pair=e2.pair;
                    break;
                }
                e1=e2;
            }while(e1!==null);
        }
    }
    this.index2=(this.index1|this.index2)^3;
}
/**
* An element of proxies.
* @author saharan
*/
OIMO.SAPElement = function(proxy,max){
    // The parent proxy
    this.proxy=proxy;
	// The pair element.
    this.pair = null;
    // The minimum element on other axis.
    this.min1 = null;
    // The maximum element on other axis.
    this.max1 = null;
    // The minimum element on other axis.
    this.min2 = null;
    // The maximum element on other axis.
    this.max2 = null;
    // Whether the element has maximum value or not.
    this.max = max;
    // The value of the element.
    this.value = 0;
};
/**
* A proxy for sweep and prune broad-phase.
* @author saharan
*/
OIMO.SAPProxy = function(sap,shape){
    OIMO.Proxy.call( this, shape);
    // Type of the axis to which the proxy belongs to. [0:none, 1:dynamic, 2:static]
    this.belongsTo = 0;
    // The maximum elements on each axis.
    this.max = [];
    // The minimum elements on each axis.
    this.min = [];
    
    this.sap=sap;
    this.min[0]=new OIMO.SAPElement(this,false);
    this.max[0]=new OIMO.SAPElement(this,true);
    this.min[1]=new OIMO.SAPElement(this,false);
    this.max[1]=new OIMO.SAPElement(this,true);
    this.min[2]=new OIMO.SAPElement(this,false);
    this.max[2]=new OIMO.SAPElement(this,true);
    this.max[0].pair=this.min[0];
    this.max[1].pair=this.min[1];
    this.max[2].pair=this.min[2];
    this.min[0].min1=this.min[1];
    this.min[0].max1=this.max[1];
    this.min[0].min2=this.min[2];
    this.min[0].max2=this.max[2];
    this.min[1].min1=this.min[0];
    this.min[1].max1=this.max[0];
    this.min[1].min2=this.min[2];
    this.min[1].max2=this.max[2];
    this.min[2].min1=this.min[0];
    this.min[2].max1=this.max[0];
    this.min[2].min2=this.min[1];
    this.min[2].max2=this.max[1];
};
OIMO.SAPProxy.prototype = Object.create( OIMO.Proxy.prototype );
/**
* Returns whether the proxy is dynamic or not.
* @return
*/
OIMO.SAPProxy.prototype.isDynamic = function () {
    var body=this.shape.parent;
    return body.isDynamic&&!body.sleeping;
}
OIMO.SAPProxy.prototype.update = function () {
    this.min[0].value=this.aabb.minX;
    this.max[0].value=this.aabb.maxX;
    this.min[1].value=this.aabb.minY;
    this.max[1].value=this.aabb.maxY;
    this.min[2].value=this.aabb.minZ;
    this.max[2].value=this.aabb.maxZ;
    if(this.belongsTo==1&&!this.isDynamic()||this.belongsTo==2&&this.isDynamic()){
        this.sap.removeProxy(this);
        this.sap.addProxy(this);
    }
}
/**
* A dynamic bounding volume tree for the broad-phase algorithm.
* @author saharan
*/
OIMO.DBVT = function(){
    // The root of the tree.
    this.root=null;
    this.freeNodes=[];// vector
    this.freeNodes.length = 16384;
    this.numFreeNodes=0;
    this.aabb=new OIMO.AABB();
}

OIMO.DBVT.prototype = {
    constructor: OIMO.DBVT,
    /**
    * Move a leaf.
    * @param   leaf
    */
    moveLeaf:function(leaf){
        this.deleteLeaf(leaf);
        this.insertLeaf(leaf);
    },
    /**
    * Insert a leaf to the tree.
    * @param   node
    */
    insertLeaf:function(leaf){
        if(this.root==null){
            this.root=leaf;
            return;
        }
        var lb=leaf.aabb;
        var sibling=this.root;
        var oldArea;
        var newArea;
        while(sibling.proxy==null){ // descend the node to search the best pair
            var c1=sibling.child1;
            var c2=sibling.child2;
            var b=sibling.aabb;
            var c1b=c1.aabb;
            var c2b=c2.aabb;
            oldArea=b.surfaceArea();
            this.aabb.combine(lb,b);
            newArea=this.aabb.surfaceArea();
            var creatingCost=newArea*2;
            var incrementalCost=(newArea-oldArea)*2; // cost of creating a new pair with the node
            var discendingCost1=incrementalCost;
            this.aabb.combine(lb,c1b);
            if(c1.proxy!=null){
                // leaf cost = area(combined aabb)
                discendingCost1+=this.aabb.surfaceArea();
            }else{
                // node cost = area(combined aabb) - area(old aabb)
                discendingCost1+=this.aabb.surfaceArea()-c1b.surfaceArea();
            }
            var discendingCost2=incrementalCost;
            this.aabb.combine(lb,c2b);
            if(c2.proxy!=null){
                // leaf cost = area(combined aabb)
                discendingCost2+=this.aabb.surfaceArea();
            }else{
                // node cost = area(combined aabb) - area(old aabb)
                discendingCost2+=this.aabb.surfaceArea()-c2b.surfaceArea();
            }
            if(discendingCost1<discendingCost2){
                if(creatingCost<discendingCost1){
                    break;// stop descending
                }else{
                    sibling=c1;// descend into first child
                }
            }else{
                if(creatingCost<discendingCost2){
                    break;// stop descending
                }else{
                    sibling=c2;// descend into second child
                }
            }
        }
        var oldParent=sibling.parent;
        var newParent;
        if(this.numFreeNodes>0){
            newParent=this.freeNodes[--this.numFreeNodes];
        }else{
            newParent=new OIMO.DBVTNode();
        }
        newParent.parent=oldParent;
        newParent.child1=leaf;
        newParent.child2=sibling;
        newParent.aabb.combine(leaf.aabb,sibling.aabb);
        newParent.height=sibling.height+1;
        sibling.parent=newParent;
        leaf.parent=newParent;
        if(sibling==this.root){
            // replace root
            this.root=newParent;
        }else{
            // replace child
            if(oldParent.child1==sibling){
                oldParent.child1=newParent;
            }else{
                oldParent.child2=newParent;
            }
        }
        // update whole tree
        do{
            newParent=this.balance(newParent);
            this.fix(newParent);
            newParent=newParent.parent;
        }while(newParent!=null);
    },
    getBalance:function(node){
        if(node.proxy!=null)return 0;
        return node.child1.height-node.child2.height;
    },
    print:function(node,indent,text){
        var hasChild=node.proxy==null;
        if(hasChild)text=this.print(node.child1,indent+1,text);
        for(var i=indent*2;i>=0;i--){
            text+=" ";
        }
        text+=(hasChild?this.getBalance(node):"["+node.proxy.aabb.minX+"]")+"\n";
        if(hasChild)text=this.print(node.child2,indent+1,text);
        return text;
    },
    /**
    * Delete a leaf from the tree.
    * @param   node
    */
    deleteLeaf:function(leaf){
        if(leaf==this.root){
            this.root=null;
            return;
        }
        var parent=leaf.parent;
        var sibling;
        if(parent.child1==leaf){
            sibling=parent.child2;
        }else{
            sibling=parent.child1;
        }
        if(parent==this.root){
            this.root=sibling;
            sibling.parent=null;
            return;
        }
        var grandParent=parent.parent;
        sibling.parent=grandParent;
        if(grandParent.child1==parent){
            grandParent.child1=sibling;
        }else{
            grandParent.child2=sibling;
        }
        if(this.numFreeNodes<16384){
            this.freeNodes[this.numFreeNodes++]=parent;
        }
        do{
            grandParent=this.balance(grandParent);
            this.fix(grandParent);
            grandParent=grandParent.parent;
        }while(grandParent!=null);
    },
    balance:function(node){
        var nh=node.height;
        if(nh<2){
            return node;
        }
        var p=node.parent;
        var l=node.child1;
        var r=node.child2;
        var lh=l.height;
        var rh=r.height;
        var balance=lh-rh;
        var t;// for bit operation

        //          [ N ]
        //         /     \
        //    [ L ]       [ R ]
        //     / \         / \
        // [L-L] [L-R] [R-L] [R-R]

        // Is the tree balanced?
        if(balance>1){
            var ll=l.child1;
            var lr=l.child2;
            var llh=ll.height;
            var lrh=lr.height;

            // Is L-L higher than L-R?
            if(llh>lrh){
                // set N to L-R
                l.child2=node;
                node.parent=l;

                //          [ L ]
                //         /     \
                //    [L-L]       [ N ]
                //     / \         / \
                // [...] [...] [ L ] [ R ]
                
                // set L-R
                node.child1=lr;
                lr.parent=node;

                //          [ L ]
                //         /     \
                //    [L-L]       [ N ]
                //     / \         / \
                // [...] [...] [L-R] [ R ]
                
                // fix bounds and heights
                node.aabb.combine(lr.aabb,r.aabb);
                t=lrh-rh;
                node.height=lrh-(t&t>>31)+1;
                l.aabb.combine(ll.aabb,node.aabb);
                t=llh-nh;
                l.height=llh-(t&t>>31)+1;
            }else{
                // set N to L-L
                l.child1=node;
                node.parent=l;

                //          [ L ]
                //         /     \
                //    [ N ]       [L-R]
                //     / \         / \
                // [ L ] [ R ] [...] [...]
                
                // set L-L
                node.child1=ll;
                ll.parent=node;

                //          [ L ]
                //         /     \
                //    [ N ]       [L-R]
                //     / \         / \
                // [L-L] [ R ] [...] [...]
                
                // fix bounds and heights
                node.aabb.combine(ll.aabb,r.aabb);
                t=llh-rh;
                node.height=llh-(t&t>>31)+1;

                l.aabb.combine(node.aabb,lr.aabb);
                t=nh-lrh;
                l.height=nh-(t&t>>31)+1;
            }
            // set new parent of L
            if(p!=null){
                if(p.child1==node){
                    p.child1=l;
                }else{
                    p.child2=l;
                }
            }else{
                this.root=l;
            }
            l.parent=p;
            return l;
        }else if(balance<-1){
            var rl=r.child1;
            var rr=r.child2;
            var rlh=rl.height;
            var rrh=rr.height;

            // Is R-L higher than R-R?
            if(rlh>rrh){
                // set N to R-R
                r.child2=node;
                node.parent=r;

                //          [ R ]
                //         /     \
                //    [R-L]       [ N ]
                //     / \         / \
                // [...] [...] [ L ] [ R ]
                
                // set R-R
                node.child2=rr;
                rr.parent=node;

                //          [ R ]
                //         /     \
                //    [R-L]       [ N ]
                //     / \         / \
                // [...] [...] [ L ] [R-R]
                
                // fix bounds and heights
                node.aabb.combine(l.aabb,rr.aabb);
                t=lh-rrh;
                node.height=lh-(t&t>>31)+1;
                r.aabb.combine(rl.aabb,node.aabb);
                t=rlh-nh;
                r.height=rlh-(t&t>>31)+1;
            }else{
                // set N to R-L
                r.child1=node;
                node.parent=r;
                //          [ R ]
                //         /     \
                //    [ N ]       [R-R]
                //     / \         / \
                // [ L ] [ R ] [...] [...]
                
                // set R-L
                node.child2=rl;
                rl.parent=node;

                //          [ R ]
                //         /     \
                //    [ N ]       [R-R]
                //     / \         / \
                // [ L ] [R-L] [...] [...]
                
                // fix bounds and heights
                node.aabb.combine(l.aabb,rl.aabb);
                t=lh-rlh;
                node.height=lh-(t&t>>31)+1;
                r.aabb.combine(node.aabb,rr.aabb);
                t=nh-rrh;
                r.height=nh-(t&t>>31)+1;
            }
            // set new parent of R
            if(p!=null){
                if(p.child1==node){
                    p.child1=r;
                }else{
                    p.child2=r;
                }
            }else{
                this.root=r;
            }
            r.parent=p;
            return r;
        }
        return node;
    },
    fix:function(node){
        var c1=node.child1;
        var c2=node.child2;
        node.aabb.combine(c1.aabb,c2.aabb);
        var h1=c1.height;
        var h2=c2.height;
        if(h1<h2){
            node.height=h2+1;
        }else{
            node.height=h1+1;
        }
    }
}
/**
* A broad-phase algorithm using dynamic bounding volume tree.
* @author saharan
*/
OIMO.DBVTBroadPhase = function(){
    OIMO.BroadPhase.call( this);
    this.types = 0x3;

    this.numLeaves = 0;
    this.maxLeaves = 0;
    this.tree=new OIMO.DBVT();
    this.maxStack=256;

    this.stack=[];// vector
    this.stack.length = this.maxStack;
    this.maxLeaves=256;
    this.leaves=[];// vector
    this.leaves.length = this.maxLeaves;
}
OIMO.DBVTBroadPhase.prototype = Object.create( OIMO.BroadPhase.prototype );
OIMO.DBVTBroadPhase.prototype.createProxy = function (shape) {
    return new OIMO.DBVTProxy(shape);
}
OIMO.DBVTBroadPhase.prototype.addProxy = function (proxy) {
    var p=(proxy);
    this.tree.insertLeaf(p.leaf);
    if(this.numLeaves==this.maxLeaves){
    //this.maxLeaves<<=1;
    this.maxLeaves*=2;
    var newLeaves=[];// vector
    newLeaves.length = this.maxLeaves;
    for(var i=0;i<this.numLeaves;i++){
    newLeaves[i]=this.leaves[i];
    }
    this.leaves=newLeaves;
    }
    this.leaves[this.numLeaves++]=p.leaf;
}
OIMO.DBVTBroadPhase.prototype.removeProxy = function (proxy) {
    var p=(proxy);
    this.tree.deleteLeaf(p.leaf);
    for(var i=0;i<this.numLeaves;i++){
    if(this.leaves[i]==p.leaf){
    this.leaves[i]=this.leaves[--this.numLeaves];
    this.leaves[this.numLeaves]=null;
    return;
    }
    }
}
OIMO.DBVTBroadPhase.prototype.collectPairs = function () {
    if(this.numLeaves<2)return;
    for(var i=0;i<this.numLeaves;i++){
    var leaf=this.leaves[i];
    var trueB=leaf.proxy.aabb;
    var leafB=leaf.aabb;
    if(
    trueB.minX<leafB.minX||trueB.maxX>leafB.maxX||
    trueB.minY<leafB.minY||trueB.maxY>leafB.maxY||
    trueB.minZ<leafB.minZ||trueB.maxZ>leafB.maxZ
    ){// the leaf needs correcting
    var margin=0.1;
    this.tree.deleteLeaf(leaf);
    leafB.minX=trueB.minX-margin;
    leafB.maxX=trueB.maxX+margin;
    leafB.minY=trueB.minY-margin;
    leafB.maxY=trueB.maxY+margin;
    leafB.minZ=trueB.minZ-margin;
    leafB.maxZ=trueB.maxZ+margin;
    this.tree.insertLeaf(leaf);
    this.collide(leaf,this.tree.root);
    }
    }
}
OIMO.DBVTBroadPhase.prototype.collide = function (node1,node2) {
    var stackCount=2;
    this.stack[0]=node1;
    this.stack[1]=node2;
    while(stackCount>0){
    var n1=this.stack[--stackCount];
    var n2=this.stack[--stackCount];
    var l1=n1.proxy!=null;
    var l2=n2.proxy!=null;
    this.numPairChecks++;
    if(l1&&l2){
    var s1=n1.proxy.shape;
    var s2=n2.proxy.shape;
    var b1=s1.aabb;
    var b2=s2.aabb;
    if(
    s1==s2||
    b1.maxX<b2.minX||b1.minX>b2.maxX||
    b1.maxY<b2.minY||b1.minY>b2.maxY||
    b1.maxZ<b2.minZ||b1.minZ>b2.maxZ||
    !this.isAvailablePair(s1,s2)
    ){
    continue;
    }
    this.addPair(s1,s2);
    }else{
    b1=n1.aabb;
    b2=n2.aabb;
    if(
    b1.maxX<b2.minX||b1.minX>b2.maxX||
    b1.maxY<b2.minY||b1.minY>b2.maxY||
    b1.maxZ<b2.minZ||b1.minZ>b2.maxZ
    ){
    continue;
    }
    if(stackCount+4>=this.maxStack){// expand the stack
    //this.maxStack<<=1;
    this.maxStack*=2;
    var newStack=[];// vector
    newStack.length = this.maxStack;
    for(var i=0;i<stackCount;i++){
    newStack[i]=this.stack[i];
    }
    this.stack=newStack;
    }
    if(l2||!l1&&(n1.aabb.surfaceArea()>n2.aabb.surfaceArea())){
    this.stack[stackCount++]=n1.child1;
    this.stack[stackCount++]=n2;
    this.stack[stackCount++]=n1.child2;
    this.stack[stackCount++]=n2;
    }else{
    this.stack[stackCount++]=n1;
    this.stack[stackCount++]=n2.child1;
    this.stack[stackCount++]=n1;
    this.stack[stackCount++]=n2.child2;
    }
    }
    }
}
/**
* A node of the dynamic bounding volume tree.
* @author saharan
*/
OIMO.DBVTNode = function(){
	// The first child node of this node.
    this.child1=null;
    // The second child node of this node.
    this.child2=null;
    //  The parent node of this tree.
    this.parent=null;
    // The proxy of this node. This has no value if this node is not leaf.
    this.proxy=null;
    // The maximum distance from leaf nodes.
    this.height=0;
    // The AABB of this node.
    this.aabb=new OIMO.AABB();
}
/**
* A proxy for dynamic bounding volume tree broad-phase.
* @author saharan
*/
OIMO.DBVTProxy = function(shape){
    OIMO.Proxy.call( this, shape);
    // The leaf of the proxy.
    this.leaf = new OIMO.DBVTNode();
    this.leaf.proxy = this;
}
OIMO.DBVTProxy.prototype = Object.create( OIMO.Proxy.prototype );
OIMO.DBVTProxy.prototype.update = function () {
}
