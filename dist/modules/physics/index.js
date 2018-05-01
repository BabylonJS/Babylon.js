var __extends = (this && this.__extends) || (function () {
var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
return function (d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
})();


if(typeof require !== 'undefined'){
    var globalObject = (typeof global !== 'undefined') ? global : ((typeof window !== 'undefined') ? window : this);
    var BABYLON = globalObject["BABYLON"] || {}; 
var BABYLON0 = require('babylonjs/core');
if(BABYLON !== BABYLON0) __extends(BABYLON, BABYLON0);
var BABYLON1 = require('babylonjs/picking');
if(BABYLON !== BABYLON1) __extends(BABYLON, BABYLON1);

var BABYLON;
(function (BABYLON) {
    /**
     * This is a holder class for the physics joint created by the physics plugin.
     * It holds a set of functions to control the underlying joint.
     */
    var PhysicsJoint = /** @class */ (function () {
        function PhysicsJoint(type, jointData) {
            this.type = type;
            this.jointData = jointData;
            jointData.nativeParams = jointData.nativeParams || {};
        }
        Object.defineProperty(PhysicsJoint.prototype, "physicsJoint", {
            get: function () {
                return this._physicsJoint;
            },
            set: function (newJoint) {
                if (this._physicsJoint) {
                    //remove from the wolrd
                }
                this._physicsJoint = newJoint;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PhysicsJoint.prototype, "physicsPlugin", {
            set: function (physicsPlugin) {
                this._physicsPlugin = physicsPlugin;
            },
            enumerable: true,
            configurable: true
        });
        /**
         * Execute a function that is physics-plugin specific.
         * @param {Function} func the function that will be executed.
         *                        It accepts two parameters: the physics world and the physics joint.
         */
        PhysicsJoint.prototype.executeNativeFunction = function (func) {
            func(this._physicsPlugin.world, this._physicsJoint);
        };
        //TODO check if the native joints are the same
        //Joint Types
        PhysicsJoint.DistanceJoint = 0;
        PhysicsJoint.HingeJoint = 1;
        PhysicsJoint.BallAndSocketJoint = 2;
        PhysicsJoint.WheelJoint = 3;
        PhysicsJoint.SliderJoint = 4;
        //OIMO
        PhysicsJoint.PrismaticJoint = 5;
        //ENERGY FTW! (compare with this - http://ode-wiki.org/wiki/index.php?title=Manual:_Joint_Types_and_Functions)
        PhysicsJoint.UniversalJoint = 6;
        PhysicsJoint.Hinge2Joint = PhysicsJoint.WheelJoint;
        //Cannon
        //Similar to a Ball-Joint. Different in params
        PhysicsJoint.PointToPointJoint = 8;
        //Cannon only at the moment
        PhysicsJoint.SpringJoint = 9;
        PhysicsJoint.LockJoint = 10;
        return PhysicsJoint;
    }());
    BABYLON.PhysicsJoint = PhysicsJoint;
    /**
     * A class representing a physics distance joint.
     */
    var DistanceJoint = /** @class */ (function (_super) {
        __extends(DistanceJoint, _super);
        function DistanceJoint(jointData) {
            return _super.call(this, PhysicsJoint.DistanceJoint, jointData) || this;
        }
        /**
         * Update the predefined distance.
         */
        DistanceJoint.prototype.updateDistance = function (maxDistance, minDistance) {
            this._physicsPlugin.updateDistanceJoint(this, maxDistance, minDistance);
        };
        return DistanceJoint;
    }(PhysicsJoint));
    BABYLON.DistanceJoint = DistanceJoint;
    var MotorEnabledJoint = /** @class */ (function (_super) {
        __extends(MotorEnabledJoint, _super);
        function MotorEnabledJoint(type, jointData) {
            return _super.call(this, type, jointData) || this;
        }
        /**
         * Set the motor values.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         * @param {number} force the force to apply
         * @param {number} maxForce max force for this motor.
         */
        MotorEnabledJoint.prototype.setMotor = function (force, maxForce) {
            this._physicsPlugin.setMotor(this, force || 0, maxForce);
        };
        /**
         * Set the motor's limits.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         */
        MotorEnabledJoint.prototype.setLimit = function (upperLimit, lowerLimit) {
            this._physicsPlugin.setLimit(this, upperLimit, lowerLimit);
        };
        return MotorEnabledJoint;
    }(PhysicsJoint));
    BABYLON.MotorEnabledJoint = MotorEnabledJoint;
    /**
     * This class represents a single hinge physics joint
     */
    var HingeJoint = /** @class */ (function (_super) {
        __extends(HingeJoint, _super);
        function HingeJoint(jointData) {
            return _super.call(this, PhysicsJoint.HingeJoint, jointData) || this;
        }
        /**
         * Set the motor values.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         * @param {number} force the force to apply
         * @param {number} maxForce max force for this motor.
         */
        HingeJoint.prototype.setMotor = function (force, maxForce) {
            this._physicsPlugin.setMotor(this, force || 0, maxForce);
        };
        /**
         * Set the motor's limits.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         */
        HingeJoint.prototype.setLimit = function (upperLimit, lowerLimit) {
            this._physicsPlugin.setLimit(this, upperLimit, lowerLimit);
        };
        return HingeJoint;
    }(MotorEnabledJoint));
    BABYLON.HingeJoint = HingeJoint;
    /**
     * This class represents a dual hinge physics joint (same as wheel joint)
     */
    var Hinge2Joint = /** @class */ (function (_super) {
        __extends(Hinge2Joint, _super);
        function Hinge2Joint(jointData) {
            return _super.call(this, PhysicsJoint.Hinge2Joint, jointData) || this;
        }
        /**
         * Set the motor values.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         * @param {number} force the force to apply
         * @param {number} maxForce max force for this motor.
         * @param {motorIndex} the motor's index, 0 or 1.
         */
        Hinge2Joint.prototype.setMotor = function (force, maxForce, motorIndex) {
            if (motorIndex === void 0) { motorIndex = 0; }
            this._physicsPlugin.setMotor(this, force || 0, maxForce, motorIndex);
        };
        /**
         * Set the motor limits.
         * Attention, this function is plugin specific. Engines won't react 100% the same.
         * @param {number} upperLimit the upper limit
         * @param {number} lowerLimit lower limit
         * @param {motorIndex} the motor's index, 0 or 1.
         */
        Hinge2Joint.prototype.setLimit = function (upperLimit, lowerLimit, motorIndex) {
            if (motorIndex === void 0) { motorIndex = 0; }
            this._physicsPlugin.setLimit(this, upperLimit, lowerLimit, motorIndex);
        };
        return Hinge2Joint;
    }(MotorEnabledJoint));
    BABYLON.Hinge2Joint = Hinge2Joint;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.physicsJoint.js.map

var BABYLON;
(function (BABYLON) {
    var PhysicsImpostor = /** @class */ (function () {
        function PhysicsImpostor(object, type, _options, _scene) {
            if (_options === void 0) { _options = { mass: 0 }; }
            var _this = this;
            this.object = object;
            this.type = type;
            this._options = _options;
            this._scene = _scene;
            this._bodyUpdateRequired = false;
            this._onBeforePhysicsStepCallbacks = new Array();
            this._onAfterPhysicsStepCallbacks = new Array();
            this._onPhysicsCollideCallbacks = [];
            this._deltaPosition = BABYLON.Vector3.Zero();
            this._isDisposed = false;
            //temp variables for parent rotation calculations
            //private _mats: Array<Matrix> = [new Matrix(), new Matrix()];
            this._tmpQuat = new BABYLON.Quaternion();
            this._tmpQuat2 = new BABYLON.Quaternion();
            /**
             * this function is executed by the physics engine.
             */
            this.beforeStep = function () {
                if (!_this._physicsEngine) {
                    return;
                }
                _this.object.translate(_this._deltaPosition, -1);
                _this._deltaRotationConjugated && _this.object.rotationQuaternion && _this.object.rotationQuaternion.multiplyToRef(_this._deltaRotationConjugated, _this.object.rotationQuaternion);
                _this.object.computeWorldMatrix(false);
                if (_this.object.parent && _this.object.rotationQuaternion) {
                    _this.getParentsRotation();
                    _this._tmpQuat.multiplyToRef(_this.object.rotationQuaternion, _this._tmpQuat);
                }
                else {
                    _this._tmpQuat.copyFrom(_this.object.rotationQuaternion || new BABYLON.Quaternion());
                }
                if (!_this._options.disableBidirectionalTransformation) {
                    _this.object.rotationQuaternion && _this._physicsEngine.getPhysicsPlugin().setPhysicsBodyTransformation(_this, /*bInfo.boundingBox.centerWorld*/ _this.object.getAbsolutePivotPoint(), _this._tmpQuat);
                }
                _this._onBeforePhysicsStepCallbacks.forEach(function (func) {
                    func(_this);
                });
            };
            /**
             * this function is executed by the physics engine.
             */
            this.afterStep = function () {
                if (!_this._physicsEngine) {
                    return;
                }
                _this._onAfterPhysicsStepCallbacks.forEach(function (func) {
                    func(_this);
                });
                _this._physicsEngine.getPhysicsPlugin().setTransformationFromPhysicsBody(_this);
                // object has now its world rotation. needs to be converted to local.
                if (_this.object.parent && _this.object.rotationQuaternion) {
                    _this.getParentsRotation();
                    _this._tmpQuat.conjugateInPlace();
                    _this._tmpQuat.multiplyToRef(_this.object.rotationQuaternion, _this.object.rotationQuaternion);
                }
                // take the position set and make it the absolute position of this object.
                _this.object.setAbsolutePosition(_this.object.position);
                _this._deltaRotation && _this.object.rotationQuaternion && _this.object.rotationQuaternion.multiplyToRef(_this._deltaRotation, _this.object.rotationQuaternion);
                _this.object.translate(_this._deltaPosition, 1);
            };
            /**
             * Legacy collision detection event support
             */
            this.onCollideEvent = null;
            //event and body object due to cannon's event-based architecture.
            this.onCollide = function (e) {
                if (!_this._onPhysicsCollideCallbacks.length && !_this.onCollideEvent) {
                    return;
                }
                if (!_this._physicsEngine) {
                    return;
                }
                var otherImpostor = _this._physicsEngine.getImpostorWithPhysicsBody(e.body);
                if (otherImpostor) {
                    // Legacy collision detection event support
                    if (_this.onCollideEvent) {
                        _this.onCollideEvent(_this, otherImpostor);
                    }
                    _this._onPhysicsCollideCallbacks.filter(function (obj) {
                        return obj.otherImpostors.indexOf(otherImpostor) !== -1;
                    }).forEach(function (obj) {
                        obj.callback(_this, otherImpostor);
                    });
                }
            };
            //sanity check!
            if (!this.object) {
                BABYLON.Tools.Error("No object was provided. A physics object is obligatory");
                return;
            }
            //legacy support for old syntax.
            if (!this._scene && object.getScene) {
                this._scene = object.getScene();
            }
            if (!this._scene) {
                return;
            }
            this._physicsEngine = this._scene.getPhysicsEngine();
            if (!this._physicsEngine) {
                BABYLON.Tools.Error("Physics not enabled. Please use scene.enablePhysics(...) before creating impostors.");
            }
            else {
                //set the object's quaternion, if not set
                if (!this.object.rotationQuaternion) {
                    if (this.object.rotation) {
                        this.object.rotationQuaternion = BABYLON.Quaternion.RotationYawPitchRoll(this.object.rotation.y, this.object.rotation.x, this.object.rotation.z);
                    }
                    else {
                        this.object.rotationQuaternion = new BABYLON.Quaternion();
                    }
                }
                //default options params
                this._options.mass = (_options.mass === void 0) ? 0 : _options.mass;
                this._options.friction = (_options.friction === void 0) ? 0.2 : _options.friction;
                this._options.restitution = (_options.restitution === void 0) ? 0.2 : _options.restitution;
                this._joints = [];
                //If the mesh has a parent, don't initialize the physicsBody. Instead wait for the parent to do that.
                if (!this.object.parent || this._options.ignoreParent) {
                    this._init();
                }
                else if (this.object.parent.physicsImpostor) {
                    BABYLON.Tools.Warn("You must affect impostors to children before affecting impostor to parent.");
                }
            }
        }
        Object.defineProperty(PhysicsImpostor.prototype, "isDisposed", {
            get: function () {
                return this._isDisposed;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PhysicsImpostor.prototype, "mass", {
            get: function () {
                return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getBodyMass(this) : 0;
            },
            set: function (value) {
                this.setMass(value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PhysicsImpostor.prototype, "friction", {
            get: function () {
                return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getBodyFriction(this) : 0;
            },
            set: function (value) {
                if (!this._physicsEngine) {
                    return;
                }
                this._physicsEngine.getPhysicsPlugin().setBodyFriction(this, value);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PhysicsImpostor.prototype, "restitution", {
            get: function () {
                return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getBodyRestitution(this) : 0;
            },
            set: function (value) {
                if (!this._physicsEngine) {
                    return;
                }
                this._physicsEngine.getPhysicsPlugin().setBodyRestitution(this, value);
            },
            enumerable: true,
            configurable: true
        });
        /**
         * This function will completly initialize this impostor.
         * It will create a new body - but only if this mesh has no parent.
         * If it has, this impostor will not be used other than to define the impostor
         * of the child mesh.
         */
        PhysicsImpostor.prototype._init = function () {
            if (!this._physicsEngine) {
                return;
            }
            this._physicsEngine.removeImpostor(this);
            this.physicsBody = null;
            this._parent = this._parent || this._getPhysicsParent();
            if (!this._isDisposed && (!this.parent || this._options.ignoreParent)) {
                this._physicsEngine.addImpostor(this);
            }
        };
        PhysicsImpostor.prototype._getPhysicsParent = function () {
            if (this.object.parent instanceof BABYLON.AbstractMesh) {
                var parentMesh = this.object.parent;
                return parentMesh.physicsImpostor;
            }
            return null;
        };
        /**
         * Should a new body be generated.
         */
        PhysicsImpostor.prototype.isBodyInitRequired = function () {
            return this._bodyUpdateRequired || (!this._physicsBody && !this._parent);
        };
        PhysicsImpostor.prototype.setScalingUpdated = function (updated) {
            this.forceUpdate();
        };
        /**
         * Force a regeneration of this or the parent's impostor's body.
         * Use under cautious - This will remove all joints already implemented.
         */
        PhysicsImpostor.prototype.forceUpdate = function () {
            this._init();
            if (this.parent && !this._options.ignoreParent) {
                this.parent.forceUpdate();
            }
        };
        Object.defineProperty(PhysicsImpostor.prototype, "physicsBody", {
            /*public get mesh(): AbstractMesh {
                return this._mesh;
            }*/
            /**
             * Gets the body that holds this impostor. Either its own, or its parent.
             */
            get: function () {
                return (this._parent && !this._options.ignoreParent) ? this._parent.physicsBody : this._physicsBody;
            },
            /**
             * Set the physics body. Used mainly by the physics engine/plugin
             */
            set: function (physicsBody) {
                if (this._physicsBody && this._physicsEngine) {
                    this._physicsEngine.getPhysicsPlugin().removePhysicsBody(this);
                }
                this._physicsBody = physicsBody;
                this.resetUpdateFlags();
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PhysicsImpostor.prototype, "parent", {
            get: function () {
                return !this._options.ignoreParent && this._parent ? this._parent : null;
            },
            set: function (value) {
                this._parent = value;
            },
            enumerable: true,
            configurable: true
        });
        PhysicsImpostor.prototype.resetUpdateFlags = function () {
            this._bodyUpdateRequired = false;
        };
        PhysicsImpostor.prototype.getObjectExtendSize = function () {
            if (this.object.getBoundingInfo) {
                var q = this.object.rotationQuaternion;
                //reset rotation
                this.object.rotationQuaternion = PhysicsImpostor.IDENTITY_QUATERNION;
                //calculate the world matrix with no rotation
                this.object.computeWorldMatrix && this.object.computeWorldMatrix(true);
                var boundingInfo = this.object.getBoundingInfo();
                var size = boundingInfo.boundingBox.extendSizeWorld.scale(2);
                //bring back the rotation
                this.object.rotationQuaternion = q;
                //calculate the world matrix with the new rotation
                this.object.computeWorldMatrix && this.object.computeWorldMatrix(true);
                return size;
            }
            else {
                return PhysicsImpostor.DEFAULT_OBJECT_SIZE;
            }
        };
        PhysicsImpostor.prototype.getObjectCenter = function () {
            if (this.object.getBoundingInfo) {
                var boundingInfo = this.object.getBoundingInfo();
                return boundingInfo.boundingBox.centerWorld;
            }
            else {
                return this.object.position;
            }
        };
        /**
         * Get a specific parametes from the options parameter.
         */
        PhysicsImpostor.prototype.getParam = function (paramName) {
            return this._options[paramName];
        };
        /**
         * Sets a specific parameter in the options given to the physics plugin
         */
        PhysicsImpostor.prototype.setParam = function (paramName, value) {
            this._options[paramName] = value;
            this._bodyUpdateRequired = true;
        };
        /**
         * Specifically change the body's mass option. Won't recreate the physics body object
         */
        PhysicsImpostor.prototype.setMass = function (mass) {
            if (this.getParam("mass") !== mass) {
                this.setParam("mass", mass);
            }
            if (this._physicsEngine) {
                this._physicsEngine.getPhysicsPlugin().setBodyMass(this, mass);
            }
        };
        PhysicsImpostor.prototype.getLinearVelocity = function () {
            return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getLinearVelocity(this) : BABYLON.Vector3.Zero();
        };
        PhysicsImpostor.prototype.setLinearVelocity = function (velocity) {
            if (this._physicsEngine) {
                this._physicsEngine.getPhysicsPlugin().setLinearVelocity(this, velocity);
            }
        };
        PhysicsImpostor.prototype.getAngularVelocity = function () {
            return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getAngularVelocity(this) : BABYLON.Vector3.Zero();
        };
        PhysicsImpostor.prototype.setAngularVelocity = function (velocity) {
            if (this._physicsEngine) {
                this._physicsEngine.getPhysicsPlugin().setAngularVelocity(this, velocity);
            }
        };
        /**
         * Execute a function with the physics plugin native code.
         * Provide a function the will have two variables - the world object and the physics body object.
         */
        PhysicsImpostor.prototype.executeNativeFunction = function (func) {
            if (this._physicsEngine) {
                func(this._physicsEngine.getPhysicsPlugin().world, this.physicsBody);
            }
        };
        /**
         * Register a function that will be executed before the physics world is stepping forward.
         */
        PhysicsImpostor.prototype.registerBeforePhysicsStep = function (func) {
            this._onBeforePhysicsStepCallbacks.push(func);
        };
        PhysicsImpostor.prototype.unregisterBeforePhysicsStep = function (func) {
            var index = this._onBeforePhysicsStepCallbacks.indexOf(func);
            if (index > -1) {
                this._onBeforePhysicsStepCallbacks.splice(index, 1);
            }
            else {
                BABYLON.Tools.Warn("Function to remove was not found");
            }
        };
        /**
         * Register a function that will be executed after the physics step
         */
        PhysicsImpostor.prototype.registerAfterPhysicsStep = function (func) {
            this._onAfterPhysicsStepCallbacks.push(func);
        };
        PhysicsImpostor.prototype.unregisterAfterPhysicsStep = function (func) {
            var index = this._onAfterPhysicsStepCallbacks.indexOf(func);
            if (index > -1) {
                this._onAfterPhysicsStepCallbacks.splice(index, 1);
            }
            else {
                BABYLON.Tools.Warn("Function to remove was not found");
            }
        };
        /**
         * register a function that will be executed when this impostor collides against a different body.
         */
        PhysicsImpostor.prototype.registerOnPhysicsCollide = function (collideAgainst, func) {
            var collidedAgainstList = collideAgainst instanceof Array ? collideAgainst : [collideAgainst];
            this._onPhysicsCollideCallbacks.push({ callback: func, otherImpostors: collidedAgainstList });
        };
        PhysicsImpostor.prototype.unregisterOnPhysicsCollide = function (collideAgainst, func) {
            var collidedAgainstList = collideAgainst instanceof Array ? collideAgainst : [collideAgainst];
            var index = this._onPhysicsCollideCallbacks.indexOf({ callback: func, otherImpostors: collidedAgainstList });
            if (index > -1) {
                this._onPhysicsCollideCallbacks.splice(index, 1);
            }
            else {
                BABYLON.Tools.Warn("Function to remove was not found");
            }
        };
        PhysicsImpostor.prototype.getParentsRotation = function () {
            var parent = this.object.parent;
            this._tmpQuat.copyFromFloats(0, 0, 0, 1);
            while (parent) {
                if (parent.rotationQuaternion) {
                    this._tmpQuat2.copyFrom(parent.rotationQuaternion);
                }
                else {
                    BABYLON.Quaternion.RotationYawPitchRollToRef(parent.rotation.y, parent.rotation.x, parent.rotation.z, this._tmpQuat2);
                }
                this._tmpQuat.multiplyToRef(this._tmpQuat2, this._tmpQuat);
                parent = parent.parent;
            }
            return this._tmpQuat;
        };
        /**
         * Apply a force
         */
        PhysicsImpostor.prototype.applyForce = function (force, contactPoint) {
            if (this._physicsEngine) {
                this._physicsEngine.getPhysicsPlugin().applyForce(this, force, contactPoint);
            }
            return this;
        };
        /**
         * Apply an impulse
         */
        PhysicsImpostor.prototype.applyImpulse = function (force, contactPoint) {
            if (this._physicsEngine) {
                this._physicsEngine.getPhysicsPlugin().applyImpulse(this, force, contactPoint);
            }
            return this;
        };
        /**
         * A help function to create a joint.
         */
        PhysicsImpostor.prototype.createJoint = function (otherImpostor, jointType, jointData) {
            var joint = new BABYLON.PhysicsJoint(jointType, jointData);
            this.addJoint(otherImpostor, joint);
            return this;
        };
        /**
         * Add a joint to this impostor with a different impostor.
         */
        PhysicsImpostor.prototype.addJoint = function (otherImpostor, joint) {
            this._joints.push({
                otherImpostor: otherImpostor,
                joint: joint
            });
            if (this._physicsEngine) {
                this._physicsEngine.addJoint(this, otherImpostor, joint);
            }
            return this;
        };
        /**
         * Will keep this body still, in a sleep mode.
         */
        PhysicsImpostor.prototype.sleep = function () {
            if (this._physicsEngine) {
                this._physicsEngine.getPhysicsPlugin().sleepBody(this);
            }
            return this;
        };
        /**
         * Wake the body up.
         */
        PhysicsImpostor.prototype.wakeUp = function () {
            if (this._physicsEngine) {
                this._physicsEngine.getPhysicsPlugin().wakeUpBody(this);
            }
            return this;
        };
        PhysicsImpostor.prototype.clone = function (newObject) {
            if (!newObject)
                return null;
            return new PhysicsImpostor(newObject, this.type, this._options, this._scene);
        };
        PhysicsImpostor.prototype.dispose = function () {
            var _this = this;
            //no dispose if no physics engine is available.
            if (!this._physicsEngine) {
                return;
            }
            this._joints.forEach(function (j) {
                if (_this._physicsEngine) {
                    _this._physicsEngine.removeJoint(_this, j.otherImpostor, j.joint);
                }
            });
            //dispose the physics body
            this._physicsEngine.removeImpostor(this);
            if (this.parent) {
                this.parent.forceUpdate();
            }
            else {
                /*this._object.getChildMeshes().forEach(function(mesh) {
                    if (mesh.physicsImpostor) {
                        if (disposeChildren) {
                            mesh.physicsImpostor.dispose();
                            mesh.physicsImpostor = null;
                        }
                    }
                })*/
            }
            this._isDisposed = true;
        };
        PhysicsImpostor.prototype.setDeltaPosition = function (position) {
            this._deltaPosition.copyFrom(position);
        };
        PhysicsImpostor.prototype.setDeltaRotation = function (rotation) {
            if (!this._deltaRotation) {
                this._deltaRotation = new BABYLON.Quaternion();
            }
            this._deltaRotation.copyFrom(rotation);
            this._deltaRotationConjugated = this._deltaRotation.conjugate();
        };
        PhysicsImpostor.prototype.getBoxSizeToRef = function (result) {
            if (this._physicsEngine) {
                this._physicsEngine.getPhysicsPlugin().getBoxSizeToRef(this, result);
            }
            return this;
        };
        PhysicsImpostor.prototype.getRadius = function () {
            return this._physicsEngine ? this._physicsEngine.getPhysicsPlugin().getRadius(this) : 0;
        };
        /**
         * Sync a bone with this impostor
         * @param bone The bone to sync to the impostor.
         * @param boneMesh The mesh that the bone is influencing.
         * @param jointPivot The pivot of the joint / bone in local space.
         * @param distToJoint Optional distance from the impostor to the joint.
         * @param adjustRotation Optional quaternion for adjusting the local rotation of the bone.
         */
        PhysicsImpostor.prototype.syncBoneWithImpostor = function (bone, boneMesh, jointPivot, distToJoint, adjustRotation) {
            var tempVec = PhysicsImpostor._tmpVecs[0];
            var mesh = this.object;
            if (mesh.rotationQuaternion) {
                if (adjustRotation) {
                    var tempQuat = PhysicsImpostor._tmpQuat;
                    mesh.rotationQuaternion.multiplyToRef(adjustRotation, tempQuat);
                    bone.setRotationQuaternion(tempQuat, BABYLON.Space.WORLD, boneMesh);
                }
                else {
                    bone.setRotationQuaternion(mesh.rotationQuaternion, BABYLON.Space.WORLD, boneMesh);
                }
            }
            tempVec.x = 0;
            tempVec.y = 0;
            tempVec.z = 0;
            if (jointPivot) {
                tempVec.x = jointPivot.x;
                tempVec.y = jointPivot.y;
                tempVec.z = jointPivot.z;
                bone.getDirectionToRef(tempVec, boneMesh, tempVec);
                if (distToJoint === undefined || distToJoint === null) {
                    distToJoint = jointPivot.length();
                }
                tempVec.x *= distToJoint;
                tempVec.y *= distToJoint;
                tempVec.z *= distToJoint;
            }
            if (bone.getParent()) {
                tempVec.addInPlace(mesh.getAbsolutePosition());
                bone.setAbsolutePosition(tempVec, boneMesh);
            }
            else {
                boneMesh.setAbsolutePosition(mesh.getAbsolutePosition());
                boneMesh.position.x -= tempVec.x;
                boneMesh.position.y -= tempVec.y;
                boneMesh.position.z -= tempVec.z;
            }
        };
        /**
         * Sync impostor to a bone
         * @param bone The bone that the impostor will be synced to.
         * @param boneMesh The mesh that the bone is influencing.
         * @param jointPivot The pivot of the joint / bone in local space.
         * @param distToJoint Optional distance from the impostor to the joint.
         * @param adjustRotation Optional quaternion for adjusting the local rotation of the bone.
         * @param boneAxis Optional vector3 axis the bone is aligned with
         */
        PhysicsImpostor.prototype.syncImpostorWithBone = function (bone, boneMesh, jointPivot, distToJoint, adjustRotation, boneAxis) {
            var mesh = this.object;
            if (mesh.rotationQuaternion) {
                if (adjustRotation) {
                    var tempQuat = PhysicsImpostor._tmpQuat;
                    bone.getRotationQuaternionToRef(BABYLON.Space.WORLD, boneMesh, tempQuat);
                    tempQuat.multiplyToRef(adjustRotation, mesh.rotationQuaternion);
                }
                else {
                    bone.getRotationQuaternionToRef(BABYLON.Space.WORLD, boneMesh, mesh.rotationQuaternion);
                }
            }
            var pos = PhysicsImpostor._tmpVecs[0];
            var boneDir = PhysicsImpostor._tmpVecs[1];
            if (!boneAxis) {
                boneAxis = PhysicsImpostor._tmpVecs[2];
                boneAxis.x = 0;
                boneAxis.y = 1;
                boneAxis.z = 0;
            }
            bone.getDirectionToRef(boneAxis, boneMesh, boneDir);
            bone.getAbsolutePositionToRef(boneMesh, pos);
            if ((distToJoint === undefined || distToJoint === null) && jointPivot) {
                distToJoint = jointPivot.length();
            }
            if (distToJoint !== undefined && distToJoint !== null) {
                pos.x += boneDir.x * distToJoint;
                pos.y += boneDir.y * distToJoint;
                pos.z += boneDir.z * distToJoint;
            }
            mesh.setAbsolutePosition(pos);
        };
        PhysicsImpostor.DEFAULT_OBJECT_SIZE = new BABYLON.Vector3(1, 1, 1);
        PhysicsImpostor.IDENTITY_QUATERNION = BABYLON.Quaternion.Identity();
        PhysicsImpostor._tmpVecs = [BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero()];
        PhysicsImpostor._tmpQuat = BABYLON.Quaternion.Identity();
        //Impostor types
        PhysicsImpostor.NoImpostor = 0;
        PhysicsImpostor.SphereImpostor = 1;
        PhysicsImpostor.BoxImpostor = 2;
        PhysicsImpostor.PlaneImpostor = 3;
        PhysicsImpostor.MeshImpostor = 4;
        PhysicsImpostor.CylinderImpostor = 7;
        PhysicsImpostor.ParticleImpostor = 8;
        PhysicsImpostor.HeightmapImpostor = 9;
        return PhysicsImpostor;
    }());
    BABYLON.PhysicsImpostor = PhysicsImpostor;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.physicsImpostor.js.map

BABYLON.Effect.ShadersStore['defaultVertexShader'] = "#include<__decl__defaultVertex>\n\nattribute vec3 position;\n#ifdef NORMAL\nattribute vec3 normal;\n#endif\n#ifdef TANGENT\nattribute vec4 tangent;\n#endif\n#ifdef UV1\nattribute vec2 uv;\n#endif\n#ifdef UV2\nattribute vec2 uv2;\n#endif\n#ifdef VERTEXCOLOR\nattribute vec4 color;\n#endif\n#include<helperFunctions>\n#include<bonesDeclaration>\n\n#include<instancesDeclaration>\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nvarying vec2 vDiffuseUV;\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nvarying vec2 vAmbientUV;\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nvarying vec2 vOpacityUV;\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nvarying vec2 vEmissiveUV;\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nvarying vec2 vLightmapUV;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nvarying vec2 vSpecularUV;\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nvarying vec2 vBumpUV;\n#endif\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#include<bumpVertexDeclaration>\n#include<clipPlaneVertexDeclaration>\n#include<fogVertexDeclaration>\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<morphTargetsVertexGlobalDeclaration>\n#include<morphTargetsVertexDeclaration>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#include<logDepthDeclaration>\nvoid main(void) {\nvec3 positionUpdated=position;\n#ifdef NORMAL \nvec3 normalUpdated=normal;\n#endif\n#ifdef TANGENT\nvec4 tangentUpdated=tangent;\n#endif\n#include<morphTargetsVertex>[0..maxSimultaneousMorphTargets]\n#ifdef REFLECTIONMAP_SKYBOX\nvPositionUVW=positionUpdated;\n#endif \n#include<instancesVertex>\n#include<bonesVertex>\ngl_Position=viewProjection*finalWorld*vec4(positionUpdated,1.0);\nvec4 worldPos=finalWorld*vec4(positionUpdated,1.0);\nvPositionW=vec3(worldPos);\n#ifdef NORMAL\nmat3 normalWorld=mat3(finalWorld);\n#ifdef NONUNIFORMSCALING\nnormalWorld=transposeMat3(inverseMat3(normalWorld));\n#endif\nvNormalW=normalize(normalWorld*normalUpdated);\n#endif\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvDirectionW=normalize(vec3(finalWorld*vec4(positionUpdated,0.0)));\n#endif\n\n#ifndef UV1\nvec2 uv=vec2(0.,0.);\n#endif\n#ifndef UV2\nvec2 uv2=vec2(0.,0.);\n#endif\n#ifdef MAINUV1\nvMainUV1=uv;\n#endif\n#ifdef MAINUV2\nvMainUV2=uv2;\n#endif\n#if defined(DIFFUSE) && DIFFUSEDIRECTUV == 0\nif (vDiffuseInfos.x == 0.)\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvDiffuseUV=vec2(diffuseMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(AMBIENT) && AMBIENTDIRECTUV == 0\nif (vAmbientInfos.x == 0.)\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvAmbientUV=vec2(ambientMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(OPACITY) && OPACITYDIRECTUV == 0\nif (vOpacityInfos.x == 0.)\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvOpacityUV=vec2(opacityMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(EMISSIVE) && EMISSIVEDIRECTUV == 0\nif (vEmissiveInfos.x == 0.)\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvEmissiveUV=vec2(emissiveMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(LIGHTMAP) && LIGHTMAPDIRECTUV == 0\nif (vLightmapInfos.x == 0.)\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvLightmapUV=vec2(lightmapMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM) && SPECULARDIRECTUV == 0\nif (vSpecularInfos.x == 0.)\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvSpecularUV=vec2(specularMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#if defined(BUMP) && BUMPDIRECTUV == 0\nif (vBumpInfos.x == 0.)\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv,1.0,0.0));\n}\nelse\n{\nvBumpUV=vec2(bumpMatrix*vec4(uv2,1.0,0.0));\n}\n#endif\n#include<bumpVertex>\n#include<clipPlaneVertex>\n#include<fogVertex>\n#include<shadowsVertex>[0..maxSimultaneousLights]\n#ifdef VERTEXCOLOR\n\nvColor=color;\n#endif\n#include<pointCloudVertex>\n#include<logDepthVertex>\n}";
BABYLON.Effect.ShadersStore['defaultPixelShader'] = "#include<__decl__defaultFragment>\n#if defined(BUMP) || !defined(NORMAL)\n#extension GL_OES_standard_derivatives : enable\n#endif\n#ifdef LOGARITHMICDEPTH\n#extension GL_EXT_frag_depth : enable\n#endif\n\n#define RECIPROCAL_PI2 0.15915494\nuniform vec3 vEyePosition;\nuniform vec3 vAmbientColor;\n\nvarying vec3 vPositionW;\n#ifdef NORMAL\nvarying vec3 vNormalW;\n#endif\n#ifdef VERTEXCOLOR\nvarying vec4 vColor;\n#endif\n#ifdef MAINUV1\nvarying vec2 vMainUV1;\n#endif\n#ifdef MAINUV2\nvarying vec2 vMainUV2;\n#endif\n\n#include<helperFunctions>\n\n#include<__decl__lightFragment>[0..maxSimultaneousLights]\n#include<lightsFragmentFunctions>\n#include<shadowsFragmentFunctions>\n\n#ifdef DIFFUSE\n#if DIFFUSEDIRECTUV == 1\n#define vDiffuseUV vMainUV1\n#elif DIFFUSEDIRECTUV == 2\n#define vDiffuseUV vMainUV2\n#else\nvarying vec2 vDiffuseUV;\n#endif\nuniform sampler2D diffuseSampler;\n#endif\n#ifdef AMBIENT\n#if AMBIENTDIRECTUV == 1\n#define vAmbientUV vMainUV1\n#elif AMBIENTDIRECTUV == 2\n#define vAmbientUV vMainUV2\n#else\nvarying vec2 vAmbientUV;\n#endif\nuniform sampler2D ambientSampler;\n#endif\n#ifdef OPACITY \n#if OPACITYDIRECTUV == 1\n#define vOpacityUV vMainUV1\n#elif OPACITYDIRECTUV == 2\n#define vOpacityUV vMainUV2\n#else\nvarying vec2 vOpacityUV;\n#endif\nuniform sampler2D opacitySampler;\n#endif\n#ifdef EMISSIVE\n#if EMISSIVEDIRECTUV == 1\n#define vEmissiveUV vMainUV1\n#elif EMISSIVEDIRECTUV == 2\n#define vEmissiveUV vMainUV2\n#else\nvarying vec2 vEmissiveUV;\n#endif\nuniform sampler2D emissiveSampler;\n#endif\n#ifdef LIGHTMAP\n#if LIGHTMAPDIRECTUV == 1\n#define vLightmapUV vMainUV1\n#elif LIGHTMAPDIRECTUV == 2\n#define vLightmapUV vMainUV2\n#else\nvarying vec2 vLightmapUV;\n#endif\nuniform sampler2D lightmapSampler;\n#endif\n#ifdef REFRACTION\n#ifdef REFRACTIONMAP_3D\nuniform samplerCube refractionCubeSampler;\n#else\nuniform sampler2D refraction2DSampler;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\n#if SPECULARDIRECTUV == 1\n#define vSpecularUV vMainUV1\n#elif SPECULARDIRECTUV == 2\n#define vSpecularUV vMainUV2\n#else\nvarying vec2 vSpecularUV;\n#endif\nuniform sampler2D specularSampler;\n#endif\n\n#include<fresnelFunction>\n\n#ifdef REFLECTION\n#ifdef REFLECTIONMAP_3D\nuniform samplerCube reflectionCubeSampler;\n#else\nuniform sampler2D reflection2DSampler;\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nvarying vec3 vPositionUVW;\n#else\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvarying vec3 vDirectionW;\n#endif\n#endif\n#include<reflectionFunction>\n#endif\n#include<imageProcessingDeclaration>\n#include<imageProcessingFunctions>\n#include<bumpFragmentFunctions>\n#include<clipPlaneFragmentDeclaration>\n#include<logDepthDeclaration>\n#include<fogFragmentDeclaration>\nvoid main(void) {\n#include<clipPlaneFragment>\nvec3 viewDirectionW=normalize(vEyePosition-vPositionW);\n\nvec4 baseColor=vec4(1.,1.,1.,1.);\nvec3 diffuseColor=vDiffuseColor.rgb;\n\nfloat alpha=vDiffuseColor.a;\n\n#ifdef NORMAL\nvec3 normalW=normalize(vNormalW);\n#else\nvec3 normalW=normalize(-cross(dFdx(vPositionW),dFdy(vPositionW)));\n#endif\n#include<bumpFragment>\n#ifdef TWOSIDEDLIGHTING\nnormalW=gl_FrontFacing ? normalW : -normalW;\n#endif\n#ifdef DIFFUSE\nbaseColor=texture2D(diffuseSampler,vDiffuseUV+uvOffset);\n#ifdef ALPHATEST\nif (baseColor.a<0.4)\ndiscard;\n#endif\n#ifdef ALPHAFROMDIFFUSE\nalpha*=baseColor.a;\n#endif\nbaseColor.rgb*=vDiffuseInfos.y;\n#endif\n#include<depthPrePass>\n#ifdef VERTEXCOLOR\nbaseColor.rgb*=vColor.rgb;\n#endif\n\nvec3 baseAmbientColor=vec3(1.,1.,1.);\n#ifdef AMBIENT\nbaseAmbientColor=texture2D(ambientSampler,vAmbientUV+uvOffset).rgb*vAmbientInfos.y;\n#endif\n\n#ifdef SPECULARTERM\nfloat glossiness=vSpecularColor.a;\nvec3 specularColor=vSpecularColor.rgb;\n#ifdef SPECULAR\nvec4 specularMapColor=texture2D(specularSampler,vSpecularUV+uvOffset);\nspecularColor=specularMapColor.rgb;\n#ifdef GLOSSINESS\nglossiness=glossiness*specularMapColor.a;\n#endif\n#endif\n#else\nfloat glossiness=0.;\n#endif\n\nvec3 diffuseBase=vec3(0.,0.,0.);\nlightingInfo info;\n#ifdef SPECULARTERM\nvec3 specularBase=vec3(0.,0.,0.);\n#endif\nfloat shadow=1.;\n#ifdef LIGHTMAP\nvec3 lightmapColor=texture2D(lightmapSampler,vLightmapUV+uvOffset).rgb*vLightmapInfos.y;\n#endif\n#include<lightFragment>[0..maxSimultaneousLights]\n\nvec3 refractionColor=vec3(0.,0.,0.);\n#ifdef REFRACTION\nvec3 refractionVector=normalize(refract(-viewDirectionW,normalW,vRefractionInfos.y));\n#ifdef REFRACTIONMAP_3D\nrefractionVector.y=refractionVector.y*vRefractionInfos.w;\nif (dot(refractionVector,viewDirectionW)<1.0)\n{\nrefractionColor=textureCube(refractionCubeSampler,refractionVector).rgb*vRefractionInfos.x;\n}\n#else\nvec3 vRefractionUVW=vec3(refractionMatrix*(view*vec4(vPositionW+refractionVector*vRefractionInfos.z,1.0)));\nvec2 refractionCoords=vRefractionUVW.xy/vRefractionUVW.z;\nrefractionCoords.y=1.0-refractionCoords.y;\nrefractionColor=texture2D(refraction2DSampler,refractionCoords).rgb*vRefractionInfos.x;\n#endif\n#endif\n\nvec3 reflectionColor=vec3(0.,0.,0.);\n#ifdef REFLECTION\nvec3 vReflectionUVW=computeReflectionCoords(vec4(vPositionW,1.0),normalW);\n#ifdef REFLECTIONMAP_3D\n#ifdef ROUGHNESS\nfloat bias=vReflectionInfos.y;\n#ifdef SPECULARTERM\n#ifdef SPECULAR\n#ifdef GLOSSINESS\nbias*=(1.0-specularMapColor.a);\n#endif\n#endif\n#endif\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW,bias).rgb*vReflectionInfos.x;\n#else\nreflectionColor=textureCube(reflectionCubeSampler,vReflectionUVW).rgb*vReflectionInfos.x;\n#endif\n#else\nvec2 coords=vReflectionUVW.xy;\n#ifdef REFLECTIONMAP_PROJECTION\ncoords/=vReflectionUVW.z;\n#endif\ncoords.y=1.0-coords.y;\nreflectionColor=texture2D(reflection2DSampler,coords).rgb*vReflectionInfos.x;\n#endif\n#ifdef REFLECTIONFRESNEL\nfloat reflectionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,reflectionRightColor.a,reflectionLeftColor.a);\n#ifdef REFLECTIONFRESNELFROMSPECULAR\n#ifdef SPECULARTERM\nreflectionColor*=specularColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#else\nreflectionColor*=reflectionLeftColor.rgb*(1.0-reflectionFresnelTerm)+reflectionFresnelTerm*reflectionRightColor.rgb;\n#endif\n#endif\n#endif\n#ifdef REFRACTIONFRESNEL\nfloat refractionFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,refractionRightColor.a,refractionLeftColor.a);\nrefractionColor*=refractionLeftColor.rgb*(1.0-refractionFresnelTerm)+refractionFresnelTerm*refractionRightColor.rgb;\n#endif\n#ifdef OPACITY\nvec4 opacityMap=texture2D(opacitySampler,vOpacityUV+uvOffset);\n#ifdef OPACITYRGB\nopacityMap.rgb=opacityMap.rgb*vec3(0.3,0.59,0.11);\nalpha*=(opacityMap.x+opacityMap.y+opacityMap.z)* vOpacityInfos.y;\n#else\nalpha*=opacityMap.a*vOpacityInfos.y;\n#endif\n#endif\n#ifdef VERTEXALPHA\nalpha*=vColor.a;\n#endif\n#ifdef OPACITYFRESNEL\nfloat opacityFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,opacityParts.z,opacityParts.w);\nalpha+=opacityParts.x*(1.0-opacityFresnelTerm)+opacityFresnelTerm*opacityParts.y;\n#endif\n\nvec3 emissiveColor=vEmissiveColor;\n#ifdef EMISSIVE\nemissiveColor+=texture2D(emissiveSampler,vEmissiveUV+uvOffset).rgb*vEmissiveInfos.y;\n#endif\n#ifdef EMISSIVEFRESNEL\nfloat emissiveFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,emissiveRightColor.a,emissiveLeftColor.a);\nemissiveColor*=emissiveLeftColor.rgb*(1.0-emissiveFresnelTerm)+emissiveFresnelTerm*emissiveRightColor.rgb;\n#endif\n\n#ifdef DIFFUSEFRESNEL\nfloat diffuseFresnelTerm=computeFresnelTerm(viewDirectionW,normalW,diffuseRightColor.a,diffuseLeftColor.a);\ndiffuseBase*=diffuseLeftColor.rgb*(1.0-diffuseFresnelTerm)+diffuseFresnelTerm*diffuseRightColor.rgb;\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\n#ifdef LINKEMISSIVEWITHDIFFUSE\nvec3 finalDiffuse=clamp((diffuseBase+emissiveColor)*diffuseColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#else\nvec3 finalDiffuse=clamp(diffuseBase*diffuseColor+emissiveColor+vAmbientColor,0.0,1.0)*baseColor.rgb;\n#endif\n#endif\n#ifdef SPECULARTERM\nvec3 finalSpecular=specularBase*specularColor;\n#ifdef SPECULAROVERALPHA\nalpha=clamp(alpha+dot(finalSpecular,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n#else\nvec3 finalSpecular=vec3(0.0);\n#endif\n#ifdef REFLECTIONOVERALPHA\nalpha=clamp(alpha+dot(reflectionColor,vec3(0.3,0.59,0.11)),0.,1.);\n#endif\n\n#ifdef EMISSIVEASILLUMINATION\nvec4 color=vec4(clamp(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+emissiveColor+refractionColor,0.0,1.0),alpha);\n#else\nvec4 color=vec4(finalDiffuse*baseAmbientColor+finalSpecular+reflectionColor+refractionColor,alpha);\n#endif\n\n#ifdef LIGHTMAP\n#ifndef LIGHTMAPEXCLUDED\n#ifdef USELIGHTMAPASSHADOWMAP\ncolor.rgb*=lightmapColor;\n#else\ncolor.rgb+=lightmapColor;\n#endif\n#endif\n#endif\n#include<logDepthFragment>\n#include<fogFragment>\n\n\n#ifdef IMAGEPROCESSINGPOSTPROCESS\ncolor.rgb=toLinearSpace(color.rgb);\n#else\n#ifdef IMAGEPROCESSING\ncolor.rgb=toLinearSpace(color.rgb);\ncolor=applyImageProcessing(color);\n#endif\n#endif\n#ifdef PREMULTIPLYALPHA\n\ncolor.rgb*=color.a;\n#endif\ngl_FragColor=color;\n}";

var BABYLON;
(function (BABYLON) {
    var PhysicsEngine = /** @class */ (function () {
        function PhysicsEngine(gravity, _physicsPlugin) {
            if (_physicsPlugin === void 0) { _physicsPlugin = new BABYLON.CannonJSPlugin(); }
            this._physicsPlugin = _physicsPlugin;
            //new methods and parameters
            this._impostors = [];
            this._joints = [];
            if (!this._physicsPlugin.isSupported()) {
                throw new Error("Physics Engine " + this._physicsPlugin.name + " cannot be found. "
                    + "Please make sure it is included.");
            }
            gravity = gravity || new BABYLON.Vector3(0, -9.807, 0);
            this.setGravity(gravity);
            this.setTimeStep();
        }
        PhysicsEngine.prototype.setGravity = function (gravity) {
            this.gravity = gravity;
            this._physicsPlugin.setGravity(this.gravity);
        };
        /**
         * Set the time step of the physics engine.
         * default is 1/60.
         * To slow it down, enter 1/600 for example.
         * To speed it up, 1/30
         * @param {number} newTimeStep the new timestep to apply to this world.
         */
        PhysicsEngine.prototype.setTimeStep = function (newTimeStep) {
            if (newTimeStep === void 0) { newTimeStep = 1 / 60; }
            this._physicsPlugin.setTimeStep(newTimeStep);
        };
        /**
         * Get the time step of the physics engine.
         */
        PhysicsEngine.prototype.getTimeStep = function () {
            return this._physicsPlugin.getTimeStep();
        };
        PhysicsEngine.prototype.dispose = function () {
            this._impostors.forEach(function (impostor) {
                impostor.dispose();
            });
            this._physicsPlugin.dispose();
        };
        PhysicsEngine.prototype.getPhysicsPluginName = function () {
            return this._physicsPlugin.name;
        };
        /**
         * Adding a new impostor for the impostor tracking.
         * This will be done by the impostor itself.
         * @param {PhysicsImpostor} impostor the impostor to add
         */
        PhysicsEngine.prototype.addImpostor = function (impostor) {
            impostor.uniqueId = this._impostors.push(impostor);
            //if no parent, generate the body
            if (!impostor.parent) {
                this._physicsPlugin.generatePhysicsBody(impostor);
            }
        };
        /**
         * Remove an impostor from the engine.
         * This impostor and its mesh will not longer be updated by the physics engine.
         * @param {PhysicsImpostor} impostor the impostor to remove
         */
        PhysicsEngine.prototype.removeImpostor = function (impostor) {
            var index = this._impostors.indexOf(impostor);
            if (index > -1) {
                var removed = this._impostors.splice(index, 1);
                //Is it needed?
                if (removed.length) {
                    //this will also remove it from the world.
                    removed[0].physicsBody = null;
                }
            }
        };
        /**
         * Add a joint to the physics engine
         * @param {PhysicsImpostor} mainImpostor the main impostor to which the joint is added.
         * @param {PhysicsImpostor} connectedImpostor the impostor that is connected to the main impostor using this joint
         * @param {PhysicsJoint} the joint that will connect both impostors.
         */
        PhysicsEngine.prototype.addJoint = function (mainImpostor, connectedImpostor, joint) {
            var impostorJoint = {
                mainImpostor: mainImpostor,
                connectedImpostor: connectedImpostor,
                joint: joint
            };
            joint.physicsPlugin = this._physicsPlugin;
            this._joints.push(impostorJoint);
            this._physicsPlugin.generateJoint(impostorJoint);
        };
        PhysicsEngine.prototype.removeJoint = function (mainImpostor, connectedImpostor, joint) {
            var matchingJoints = this._joints.filter(function (impostorJoint) {
                return (impostorJoint.connectedImpostor === connectedImpostor
                    && impostorJoint.joint === joint
                    && impostorJoint.mainImpostor === mainImpostor);
            });
            if (matchingJoints.length) {
                this._physicsPlugin.removeJoint(matchingJoints[0]);
                //TODO remove it from the list as well
            }
        };
        /**
         * Called by the scene. no need to call it.
         */
        PhysicsEngine.prototype._step = function (delta) {
            var _this = this;
            //check if any mesh has no body / requires an update
            this._impostors.forEach(function (impostor) {
                if (impostor.isBodyInitRequired()) {
                    _this._physicsPlugin.generatePhysicsBody(impostor);
                }
            });
            if (delta > 0.1) {
                delta = 0.1;
            }
            else if (delta <= 0) {
                delta = 1.0 / 60.0;
            }
            this._physicsPlugin.executeStep(delta, this._impostors);
        };
        PhysicsEngine.prototype.getPhysicsPlugin = function () {
            return this._physicsPlugin;
        };
        PhysicsEngine.prototype.getImpostors = function () {
            return this._impostors;
        };
        PhysicsEngine.prototype.getImpostorForPhysicsObject = function (object) {
            for (var i = 0; i < this._impostors.length; ++i) {
                if (this._impostors[i].object === object) {
                    return this._impostors[i];
                }
            }
            return null;
        };
        PhysicsEngine.prototype.getImpostorWithPhysicsBody = function (body) {
            for (var i = 0; i < this._impostors.length; ++i) {
                if (this._impostors[i].physicsBody === body) {
                    return this._impostors[i];
                }
            }
            return null;
        };
        // Statics
        PhysicsEngine.Epsilon = 0.001;
        return PhysicsEngine;
    }());
    BABYLON.PhysicsEngine = PhysicsEngine;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.physicsEngine.js.map

var BABYLON;
(function (BABYLON) {
    var PhysicsHelper = /** @class */ (function () {
        function PhysicsHelper(scene) {
            this._scene = scene;
            this._physicsEngine = this._scene.getPhysicsEngine();
            if (!this._physicsEngine) {
                BABYLON.Tools.Warn('Physics engine not enabled. Please enable the physics before you can use the methods.');
            }
        }
        /**
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFalloff} falloff possible options: Constant & Linear. Defaults to Constant
         */
        PhysicsHelper.prototype.applyRadialExplosionImpulse = function (origin, radius, strength, falloff) {
            if (falloff === void 0) { falloff = PhysicsRadialImpulseFalloff.Constant; }
            if (!this._physicsEngine) {
                BABYLON.Tools.Warn('Physics engine not enabled. Please enable the physics before you call this method.');
                return null;
            }
            var impostors = this._physicsEngine.getImpostors();
            if (impostors.length === 0) {
                return null;
            }
            var event = new PhysicsRadialExplosionEvent(this._scene);
            impostors.forEach(function (impostor) {
                var impostorForceAndContactPoint = event.getImpostorForceAndContactPoint(impostor, origin, radius, strength, falloff);
                if (!impostorForceAndContactPoint) {
                    return;
                }
                impostor.applyImpulse(impostorForceAndContactPoint.force, impostorForceAndContactPoint.contactPoint);
            });
            event.dispose(false);
            return event;
        };
        /**
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFalloff} falloff possible options: Constant & Linear. Defaults to Constant
         */
        PhysicsHelper.prototype.applyRadialExplosionForce = function (origin, radius, strength, falloff) {
            if (falloff === void 0) { falloff = PhysicsRadialImpulseFalloff.Constant; }
            if (!this._physicsEngine) {
                BABYLON.Tools.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
                return null;
            }
            var impostors = this._physicsEngine.getImpostors();
            if (impostors.length === 0) {
                return null;
            }
            var event = new PhysicsRadialExplosionEvent(this._scene);
            impostors.forEach(function (impostor) {
                var impostorForceAndContactPoint = event.getImpostorForceAndContactPoint(impostor, origin, radius, strength, falloff);
                if (!impostorForceAndContactPoint) {
                    return;
                }
                impostor.applyForce(impostorForceAndContactPoint.force, impostorForceAndContactPoint.contactPoint);
            });
            event.dispose(false);
            return event;
        };
        /**
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFalloff} falloff possible options: Constant & Linear. Defaults to Constant
         */
        PhysicsHelper.prototype.gravitationalField = function (origin, radius, strength, falloff) {
            if (falloff === void 0) { falloff = PhysicsRadialImpulseFalloff.Constant; }
            if (!this._physicsEngine) {
                BABYLON.Tools.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
                return null;
            }
            var impostors = this._physicsEngine.getImpostors();
            if (impostors.length === 0) {
                return null;
            }
            var event = new PhysicsGravitationalFieldEvent(this, this._scene, origin, radius, strength, falloff);
            event.dispose(false);
            return event;
        };
        /**
         * @param {Vector3} origin the origin of the updraft
         * @param {number} radius the radius of the updraft
         * @param {number} strength the strength of the updraft
         * @param {number} height the height of the updraft
         * @param {PhysicsUpdraftMode} updraftMode possible options: Center & Perpendicular. Defaults to Center
         */
        PhysicsHelper.prototype.updraft = function (origin, radius, strength, height, updraftMode) {
            if (updraftMode === void 0) { updraftMode = PhysicsUpdraftMode.Center; }
            if (!this._physicsEngine) {
                BABYLON.Tools.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
                return null;
            }
            if (this._physicsEngine.getImpostors().length === 0) {
                return null;
            }
            var event = new PhysicsUpdraftEvent(this._scene, origin, radius, strength, height, updraftMode);
            event.dispose(false);
            return event;
        };
        /**
         * @param {Vector3} origin the of the vortex
         * @param {number} radius the radius of the vortex
         * @param {number} strength the strength of the vortex
         * @param {number} height   the height of the vortex
         */
        PhysicsHelper.prototype.vortex = function (origin, radius, strength, height) {
            if (!this._physicsEngine) {
                BABYLON.Tools.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
                return null;
            }
            if (this._physicsEngine.getImpostors().length === 0) {
                return null;
            }
            var event = new PhysicsVortexEvent(this._scene, origin, radius, strength, height);
            event.dispose(false);
            return event;
        };
        return PhysicsHelper;
    }());
    BABYLON.PhysicsHelper = PhysicsHelper;
    /***** Radial explosion *****/
    var PhysicsRadialExplosionEvent = /** @class */ (function () {
        function PhysicsRadialExplosionEvent(scene) {
            this._sphereOptions = { segments: 32, diameter: 1 }; // TODO: make configurable
            this._rays = [];
            this._dataFetched = false; // check if the data has been fetched. If not, do cleanup
            this._scene = scene;
        }
        /**
         * Returns the data related to the radial explosion event (sphere & rays).
         * @returns {PhysicsRadialExplosionEventData}
         */
        PhysicsRadialExplosionEvent.prototype.getData = function () {
            this._dataFetched = true;
            return {
                sphere: this._sphere,
                rays: this._rays,
            };
        };
        /**
         * Returns the force and contact point of the impostor or false, if the impostor is not affected by the force/impulse.
         * @param impostor
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFalloff} falloff possible options: Constant & Linear
         * @returns {Nullable<PhysicsForceAndContactPoint>}
         */
        PhysicsRadialExplosionEvent.prototype.getImpostorForceAndContactPoint = function (impostor, origin, radius, strength, falloff) {
            if (impostor.mass === 0) {
                return null;
            }
            if (!this._intersectsWithSphere(impostor, origin, radius)) {
                return null;
            }
            if (impostor.object.getClassName() !== 'Mesh') {
                return null;
            }
            var impostorObject = impostor.object;
            var impostorObjectCenter = impostor.getObjectCenter();
            var direction = impostorObjectCenter.subtract(origin);
            var ray = new BABYLON.Ray(origin, direction, radius);
            this._rays.push(ray);
            var hit = ray.intersectsMesh(impostorObject);
            var contactPoint = hit.pickedPoint;
            if (!contactPoint) {
                return null;
            }
            var distanceFromOrigin = BABYLON.Vector3.Distance(origin, contactPoint);
            if (distanceFromOrigin > radius) {
                return null;
            }
            var multiplier = falloff === PhysicsRadialImpulseFalloff.Constant
                ? strength
                : strength * (1 - (distanceFromOrigin / radius));
            var force = direction.multiplyByFloats(multiplier, multiplier, multiplier);
            return { force: force, contactPoint: contactPoint };
        };
        /**
         * Disposes the sphere.
         * @param {bolean} force
         */
        PhysicsRadialExplosionEvent.prototype.dispose = function (force) {
            var _this = this;
            if (force === void 0) { force = true; }
            if (force) {
                this._sphere.dispose();
            }
            else {
                setTimeout(function () {
                    if (!_this._dataFetched) {
                        _this._sphere.dispose();
                    }
                }, 0);
            }
        };
        /*** Helpers ***/
        PhysicsRadialExplosionEvent.prototype._prepareSphere = function () {
            if (!this._sphere) {
                this._sphere = BABYLON.MeshBuilder.CreateSphere("radialExplosionEventSphere", this._sphereOptions, this._scene);
                this._sphere.isVisible = false;
            }
        };
        PhysicsRadialExplosionEvent.prototype._intersectsWithSphere = function (impostor, origin, radius) {
            var impostorObject = impostor.object;
            this._prepareSphere();
            this._sphere.position = origin;
            this._sphere.scaling = new BABYLON.Vector3(radius * 2, radius * 2, radius * 2);
            this._sphere._updateBoundingInfo();
            this._sphere.computeWorldMatrix(true);
            return this._sphere.intersectsMesh(impostorObject, true);
        };
        return PhysicsRadialExplosionEvent;
    }());
    BABYLON.PhysicsRadialExplosionEvent = PhysicsRadialExplosionEvent;
    /***** Gravitational Field *****/
    var PhysicsGravitationalFieldEvent = /** @class */ (function () {
        function PhysicsGravitationalFieldEvent(physicsHelper, scene, origin, radius, strength, falloff) {
            if (falloff === void 0) { falloff = PhysicsRadialImpulseFalloff.Constant; }
            this._dataFetched = false; // check if the has been fetched the data. If not, do cleanup
            this._physicsHelper = physicsHelper;
            this._scene = scene;
            this._origin = origin;
            this._radius = radius;
            this._strength = strength;
            this._falloff = falloff;
            this._tickCallback = this._tick.bind(this);
        }
        /**
         * Returns the data related to the gravitational field event (sphere).
         * @returns {PhysicsGravitationalFieldEventData}
         */
        PhysicsGravitationalFieldEvent.prototype.getData = function () {
            this._dataFetched = true;
            return {
                sphere: this._sphere,
            };
        };
        /**
         * Enables the gravitational field.
         */
        PhysicsGravitationalFieldEvent.prototype.enable = function () {
            this._tickCallback.call(this);
            this._scene.registerBeforeRender(this._tickCallback);
        };
        /**
         * Disables the gravitational field.
         */
        PhysicsGravitationalFieldEvent.prototype.disable = function () {
            this._scene.unregisterBeforeRender(this._tickCallback);
        };
        /**
         * Disposes the sphere.
         * @param {bolean} force
         */
        PhysicsGravitationalFieldEvent.prototype.dispose = function (force) {
            var _this = this;
            if (force === void 0) { force = true; }
            if (force) {
                this._sphere.dispose();
            }
            else {
                setTimeout(function () {
                    if (!_this._dataFetched) {
                        _this._sphere.dispose();
                    }
                }, 0);
            }
        };
        PhysicsGravitationalFieldEvent.prototype._tick = function () {
            // Since the params won't change, we fetch the event only once
            if (this._sphere) {
                this._physicsHelper.applyRadialExplosionForce(this._origin, this._radius, this._strength * -1, this._falloff);
            }
            else {
                var radialExplosionEvent = this._physicsHelper.applyRadialExplosionForce(this._origin, this._radius, this._strength * -1, this._falloff);
                if (radialExplosionEvent) {
                    this._sphere = radialExplosionEvent.getData().sphere.clone('radialExplosionEventSphereClone');
                }
            }
        };
        return PhysicsGravitationalFieldEvent;
    }());
    BABYLON.PhysicsGravitationalFieldEvent = PhysicsGravitationalFieldEvent;
    /***** Updraft *****/
    var PhysicsUpdraftEvent = /** @class */ (function () {
        function PhysicsUpdraftEvent(_scene, _origin, _radius, _strength, _height, _updraftMode) {
            this._scene = _scene;
            this._origin = _origin;
            this._radius = _radius;
            this._strength = _strength;
            this._height = _height;
            this._updraftMode = _updraftMode;
            this._originTop = BABYLON.Vector3.Zero(); // the most upper part of the cylinder
            this._originDirection = BABYLON.Vector3.Zero(); // used if the updraftMode is perpendicular
            this._cylinderPosition = BABYLON.Vector3.Zero(); // to keep the cylinders position, because normally the origin is in the center and not on the bottom
            this._dataFetched = false; // check if the has been fetched the data. If not, do cleanup
            this._physicsEngine = this._scene.getPhysicsEngine();
            this._origin.addToRef(new BABYLON.Vector3(0, this._height / 2, 0), this._cylinderPosition);
            this._origin.addToRef(new BABYLON.Vector3(0, this._height, 0), this._originTop);
            if (this._updraftMode === PhysicsUpdraftMode.Perpendicular) {
                this._originDirection = this._origin.subtract(this._originTop).normalize();
            }
            this._tickCallback = this._tick.bind(this);
        }
        /**
         * Returns the data related to the updraft event (cylinder).
         * @returns {PhysicsUpdraftEventData}
         */
        PhysicsUpdraftEvent.prototype.getData = function () {
            this._dataFetched = true;
            return {
                cylinder: this._cylinder,
            };
        };
        /**
         * Enables the updraft.
         */
        PhysicsUpdraftEvent.prototype.enable = function () {
            this._tickCallback.call(this);
            this._scene.registerBeforeRender(this._tickCallback);
        };
        /**
         * Disables the cortex.
         */
        PhysicsUpdraftEvent.prototype.disable = function () {
            this._scene.unregisterBeforeRender(this._tickCallback);
        };
        /**
         * Disposes the sphere.
         * @param {bolean} force
         */
        PhysicsUpdraftEvent.prototype.dispose = function (force) {
            var _this = this;
            if (force === void 0) { force = true; }
            if (force) {
                this._cylinder.dispose();
            }
            else {
                setTimeout(function () {
                    if (!_this._dataFetched) {
                        _this._cylinder.dispose();
                    }
                }, 0);
            }
        };
        PhysicsUpdraftEvent.prototype.getImpostorForceAndContactPoint = function (impostor) {
            if (impostor.mass === 0) {
                return null;
            }
            if (!this._intersectsWithCylinder(impostor)) {
                return null;
            }
            var impostorObjectCenter = impostor.getObjectCenter();
            if (this._updraftMode === PhysicsUpdraftMode.Perpendicular) {
                var direction = this._originDirection;
            }
            else {
                var direction = impostorObjectCenter.subtract(this._originTop);
            }
            var multiplier = this._strength * -1;
            var force = direction.multiplyByFloats(multiplier, multiplier, multiplier);
            return { force: force, contactPoint: impostorObjectCenter };
        };
        PhysicsUpdraftEvent.prototype._tick = function () {
            var _this = this;
            this._physicsEngine.getImpostors().forEach(function (impostor) {
                var impostorForceAndContactPoint = _this.getImpostorForceAndContactPoint(impostor);
                if (!impostorForceAndContactPoint) {
                    return;
                }
                impostor.applyForce(impostorForceAndContactPoint.force, impostorForceAndContactPoint.contactPoint);
            });
        };
        /*** Helpers ***/
        PhysicsUpdraftEvent.prototype._prepareCylinder = function () {
            if (!this._cylinder) {
                this._cylinder = BABYLON.MeshBuilder.CreateCylinder("updraftEventCylinder", {
                    height: this._height,
                    diameter: this._radius * 2,
                }, this._scene);
                this._cylinder.isVisible = false;
            }
        };
        PhysicsUpdraftEvent.prototype._intersectsWithCylinder = function (impostor) {
            var impostorObject = impostor.object;
            this._prepareCylinder();
            this._cylinder.position = this._cylinderPosition;
            return this._cylinder.intersectsMesh(impostorObject, true);
        };
        return PhysicsUpdraftEvent;
    }());
    BABYLON.PhysicsUpdraftEvent = PhysicsUpdraftEvent;
    /***** Vortex *****/
    var PhysicsVortexEvent = /** @class */ (function () {
        function PhysicsVortexEvent(_scene, _origin, _radius, _strength, _height) {
            this._scene = _scene;
            this._origin = _origin;
            this._radius = _radius;
            this._strength = _strength;
            this._height = _height;
            this._originTop = BABYLON.Vector3.Zero(); // the most upper part of the cylinder
            this._centripetalForceThreshold = 0.7; // at which distance, relative to the radius the centripetal forces should kick in
            this._updraftMultiplier = 0.02;
            this._cylinderPosition = BABYLON.Vector3.Zero(); // to keep the cylinders position, because normally the origin is in the center and not on the bottom
            this._dataFetched = false; // check if the has been fetched the data. If not, do cleanup
            this._physicsEngine = this._scene.getPhysicsEngine();
            this._origin.addToRef(new BABYLON.Vector3(0, this._height / 2, 0), this._cylinderPosition);
            this._origin.addToRef(new BABYLON.Vector3(0, this._height, 0), this._originTop);
            this._tickCallback = this._tick.bind(this);
        }
        /**
         * Returns the data related to the vortex event (cylinder).
         * @returns {PhysicsVortexEventData}
         */
        PhysicsVortexEvent.prototype.getData = function () {
            this._dataFetched = true;
            return {
                cylinder: this._cylinder,
            };
        };
        /**
         * Enables the vortex.
         */
        PhysicsVortexEvent.prototype.enable = function () {
            this._tickCallback.call(this);
            this._scene.registerBeforeRender(this._tickCallback);
        };
        /**
         * Disables the cortex.
         */
        PhysicsVortexEvent.prototype.disable = function () {
            this._scene.unregisterBeforeRender(this._tickCallback);
        };
        /**
         * Disposes the sphere.
         * @param {bolean} force
         */
        PhysicsVortexEvent.prototype.dispose = function (force) {
            var _this = this;
            if (force === void 0) { force = true; }
            if (force) {
                this._cylinder.dispose();
            }
            else {
                setTimeout(function () {
                    if (!_this._dataFetched) {
                        _this._cylinder.dispose();
                    }
                }, 0);
            }
        };
        PhysicsVortexEvent.prototype.getImpostorForceAndContactPoint = function (impostor) {
            if (impostor.mass === 0) {
                return null;
            }
            if (!this._intersectsWithCylinder(impostor)) {
                return null;
            }
            if (impostor.object.getClassName() !== 'Mesh') {
                return null;
            }
            var impostorObject = impostor.object;
            var impostorObjectCenter = impostor.getObjectCenter();
            var originOnPlane = new BABYLON.Vector3(this._origin.x, impostorObjectCenter.y, this._origin.z); // the distance to the origin as if both objects were on a plane (Y-axis)
            var originToImpostorDirection = impostorObjectCenter.subtract(originOnPlane);
            var ray = new BABYLON.Ray(originOnPlane, originToImpostorDirection, this._radius);
            var hit = ray.intersectsMesh(impostorObject);
            var contactPoint = hit.pickedPoint;
            if (!contactPoint) {
                return null;
            }
            var absoluteDistanceFromOrigin = hit.distance / this._radius;
            var perpendicularDirection = BABYLON.Vector3.Cross(originOnPlane, impostorObjectCenter).normalize();
            var directionToOrigin = contactPoint.normalize();
            if (absoluteDistanceFromOrigin > this._centripetalForceThreshold) {
                directionToOrigin = directionToOrigin.negate();
            }
            // TODO: find a more physically based solution
            if (absoluteDistanceFromOrigin > this._centripetalForceThreshold) {
                var forceX = directionToOrigin.x * this._strength / 8;
                var forceY = directionToOrigin.y * this._updraftMultiplier;
                var forceZ = directionToOrigin.z * this._strength / 8;
            }
            else {
                var forceX = (perpendicularDirection.x + directionToOrigin.x) / 2;
                var forceY = this._originTop.y * this._updraftMultiplier;
                var forceZ = (perpendicularDirection.z + directionToOrigin.z) / 2;
            }
            var force = new BABYLON.Vector3(forceX, forceY, forceZ);
            force = force.multiplyByFloats(this._strength, this._strength, this._strength);
            return { force: force, contactPoint: impostorObjectCenter };
        };
        PhysicsVortexEvent.prototype._tick = function () {
            var _this = this;
            this._physicsEngine.getImpostors().forEach(function (impostor) {
                var impostorForceAndContactPoint = _this.getImpostorForceAndContactPoint(impostor);
                if (!impostorForceAndContactPoint) {
                    return;
                }
                impostor.applyForce(impostorForceAndContactPoint.force, impostorForceAndContactPoint.contactPoint);
            });
        };
        /*** Helpers ***/
        PhysicsVortexEvent.prototype._prepareCylinder = function () {
            if (!this._cylinder) {
                this._cylinder = BABYLON.MeshBuilder.CreateCylinder("vortexEventCylinder", {
                    height: this._height,
                    diameter: this._radius * 2,
                }, this._scene);
                this._cylinder.isVisible = false;
            }
        };
        PhysicsVortexEvent.prototype._intersectsWithCylinder = function (impostor) {
            var impostorObject = impostor.object;
            this._prepareCylinder();
            this._cylinder.position = this._cylinderPosition;
            return this._cylinder.intersectsMesh(impostorObject, true);
        };
        return PhysicsVortexEvent;
    }());
    BABYLON.PhysicsVortexEvent = PhysicsVortexEvent;
    /***** Enums *****/
    /**
    * The strenght of the force in correspondence to the distance of the affected object
    */
    var PhysicsRadialImpulseFalloff;
    (function (PhysicsRadialImpulseFalloff) {
        PhysicsRadialImpulseFalloff[PhysicsRadialImpulseFalloff["Constant"] = 0] = "Constant";
        PhysicsRadialImpulseFalloff[PhysicsRadialImpulseFalloff["Linear"] = 1] = "Linear"; // impulse gets weaker if it's further from the origin
    })(PhysicsRadialImpulseFalloff = BABYLON.PhysicsRadialImpulseFalloff || (BABYLON.PhysicsRadialImpulseFalloff = {}));
    /**
     * The strenght of the force in correspondence to the distance of the affected object
     */
    var PhysicsUpdraftMode;
    (function (PhysicsUpdraftMode) {
        PhysicsUpdraftMode[PhysicsUpdraftMode["Center"] = 0] = "Center";
        PhysicsUpdraftMode[PhysicsUpdraftMode["Perpendicular"] = 1] = "Perpendicular"; // once a impostor is inside the cylinder, it will shoot out perpendicular from the ground of the cylinder
    })(PhysicsUpdraftMode = BABYLON.PhysicsUpdraftMode || (BABYLON.PhysicsUpdraftMode = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.physicsHelper.js.map

var BABYLON;
(function (BABYLON) {
    var CannonJSPlugin = /** @class */ (function () {
        function CannonJSPlugin(_useDeltaForWorldStep, iterations) {
            if (_useDeltaForWorldStep === void 0) { _useDeltaForWorldStep = true; }
            if (iterations === void 0) { iterations = 10; }
            this._useDeltaForWorldStep = _useDeltaForWorldStep;
            this.name = "CannonJSPlugin";
            this._physicsMaterials = new Array();
            this._fixedTimeStep = 1 / 60;
            //See https://github.com/schteppe/CANNON.js/blob/gh-pages/demos/collisionFilter.html
            this.BJSCANNON = typeof CANNON !== 'undefined' ? CANNON : (typeof require !== 'undefined' ? require('cannon') : undefined);
            this._minus90X = new BABYLON.Quaternion(-0.7071067811865475, 0, 0, 0.7071067811865475);
            this._plus90X = new BABYLON.Quaternion(0.7071067811865475, 0, 0, 0.7071067811865475);
            this._tmpPosition = BABYLON.Vector3.Zero();
            this._tmpDeltaPosition = BABYLON.Vector3.Zero();
            this._tmpUnityRotation = new BABYLON.Quaternion();
            if (!this.isSupported()) {
                BABYLON.Tools.Error("CannonJS is not available. Please make sure you included the js file.");
                return;
            }
            this._extendNamespace();
            this.world = new this.BJSCANNON.World();
            this.world.broadphase = new this.BJSCANNON.NaiveBroadphase();
            this.world.solver.iterations = iterations;
        }
        CannonJSPlugin.prototype.setGravity = function (gravity) {
            this.world.gravity.copy(gravity);
        };
        CannonJSPlugin.prototype.setTimeStep = function (timeStep) {
            this._fixedTimeStep = timeStep;
        };
        CannonJSPlugin.prototype.getTimeStep = function () {
            return this._fixedTimeStep;
        };
        CannonJSPlugin.prototype.executeStep = function (delta, impostors) {
            this.world.step(this._fixedTimeStep, this._useDeltaForWorldStep ? delta : 0, 3);
        };
        CannonJSPlugin.prototype.applyImpulse = function (impostor, force, contactPoint) {
            var worldPoint = new this.BJSCANNON.Vec3(contactPoint.x, contactPoint.y, contactPoint.z);
            var impulse = new this.BJSCANNON.Vec3(force.x, force.y, force.z);
            impostor.physicsBody.applyImpulse(impulse, worldPoint);
        };
        CannonJSPlugin.prototype.applyForce = function (impostor, force, contactPoint) {
            var worldPoint = new this.BJSCANNON.Vec3(contactPoint.x, contactPoint.y, contactPoint.z);
            var impulse = new this.BJSCANNON.Vec3(force.x, force.y, force.z);
            impostor.physicsBody.applyForce(impulse, worldPoint);
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
                impostor.physicsBody = new this.BJSCANNON.Body(bodyCreationObject);
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
            var meshChildren = mainImpostor.object.getChildMeshes ? mainImpostor.object.getChildMeshes(true) : [];
            var currentRotation = mainImpostor.object.rotationQuaternion;
            if (meshChildren.length) {
                var processMesh = function (localPosition, mesh) {
                    if (!currentRotation || !mesh.rotationQuaternion) {
                        return;
                    }
                    var childImpostor = mesh.getPhysicsImpostor();
                    if (childImpostor) {
                        var parent = childImpostor.parent;
                        if (parent !== mainImpostor) {
                            var pPosition = mesh.getAbsolutePosition().subtract(mainImpostor.object.getAbsolutePosition());
                            var localRotation = mesh.rotationQuaternion.multiply(BABYLON.Quaternion.Inverse(currentRotation));
                            if (childImpostor.physicsBody) {
                                _this.removePhysicsBody(childImpostor);
                                childImpostor.physicsBody = null;
                            }
                            childImpostor.parent = mainImpostor;
                            childImpostor.resetUpdateFlags();
                            mainImpostor.physicsBody.addShape(_this._createShape(childImpostor), new _this.BJSCANNON.Vec3(pPosition.x, pPosition.y, pPosition.z), new _this.BJSCANNON.Quaternion(localRotation.x, localRotation.y, localRotation.z, localRotation.w));
                            //Add the mass of the children.
                            mainImpostor.physicsBody.mass += childImpostor.getParam("mass");
                        }
                    }
                    currentRotation.multiplyInPlace(mesh.rotationQuaternion);
                    mesh.getChildMeshes(true).filter(function (m) { return !!m.physicsImpostor; }).forEach(processMesh.bind(_this, mesh.getAbsolutePosition()));
                };
                meshChildren.filter(function (m) { return !!m.physicsImpostor; }).forEach(processMesh.bind(this, mainImpostor.object.getAbsolutePosition()));
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
            //TODO - https://github.com/schteppe/this.BJSCANNON.js/blob/gh-pages/demos/collisionFilter.html
            var constraintData = {
                pivotA: jointData.mainPivot ? new this.BJSCANNON.Vec3().copy(jointData.mainPivot) : null,
                pivotB: jointData.connectedPivot ? new this.BJSCANNON.Vec3().copy(jointData.connectedPivot) : null,
                axisA: jointData.mainAxis ? new this.BJSCANNON.Vec3().copy(jointData.mainAxis) : null,
                axisB: jointData.connectedAxis ? new this.BJSCANNON.Vec3().copy(jointData.connectedAxis) : null,
                maxForce: jointData.nativeParams.maxForce,
                collideConnected: !!jointData.collision
            };
            switch (impostorJoint.joint.type) {
                case BABYLON.PhysicsJoint.HingeJoint:
                case BABYLON.PhysicsJoint.Hinge2Joint:
                    constraint = new this.BJSCANNON.HingeConstraint(mainBody, connectedBody, constraintData);
                    break;
                case BABYLON.PhysicsJoint.DistanceJoint:
                    constraint = new this.BJSCANNON.DistanceConstraint(mainBody, connectedBody, jointData.maxDistance || 2);
                    break;
                case BABYLON.PhysicsJoint.SpringJoint:
                    var springData = jointData;
                    constraint = new this.BJSCANNON.Spring(mainBody, connectedBody, {
                        restLength: springData.length,
                        stiffness: springData.stiffness,
                        damping: springData.damping,
                        localAnchorA: constraintData.pivotA,
                        localAnchorB: constraintData.pivotB
                    });
                    break;
                case BABYLON.PhysicsJoint.LockJoint:
                    constraint = new this.BJSCANNON.LockConstraint(mainBody, connectedBody, constraintData);
                    break;
                case BABYLON.PhysicsJoint.PointToPointJoint:
                case BABYLON.PhysicsJoint.BallAndSocketJoint:
                default:
                    constraint = new this.BJSCANNON.PointToPointConstraint(mainBody, constraintData.pivotA, connectedBody, constraintData.pivotA, constraintData.maxForce);
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
        CannonJSPlugin.prototype.removeJoint = function (impostorJoint) {
            this.world.removeConstraint(impostorJoint.joint.physicsJoint);
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
            var currentMat = new this.BJSCANNON.Material(name);
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
                case BABYLON.PhysicsImpostor.SphereImpostor:
                    var radiusX = extendSize.x;
                    var radiusY = extendSize.y;
                    var radiusZ = extendSize.z;
                    returnValue = new this.BJSCANNON.Sphere(Math.max(this._checkWithEpsilon(radiusX), this._checkWithEpsilon(radiusY), this._checkWithEpsilon(radiusZ)) / 2);
                    break;
                //TMP also for cylinder - TODO Cannon supports cylinder natively.
                case BABYLON.PhysicsImpostor.CylinderImpostor:
                    returnValue = new this.BJSCANNON.Cylinder(this._checkWithEpsilon(extendSize.x) / 2, this._checkWithEpsilon(extendSize.x) / 2, this._checkWithEpsilon(extendSize.y), 16);
                    break;
                case BABYLON.PhysicsImpostor.BoxImpostor:
                    var box = extendSize.scale(0.5);
                    returnValue = new this.BJSCANNON.Box(new this.BJSCANNON.Vec3(this._checkWithEpsilon(box.x), this._checkWithEpsilon(box.y), this._checkWithEpsilon(box.z)));
                    break;
                case BABYLON.PhysicsImpostor.PlaneImpostor:
                    BABYLON.Tools.Warn("Attention, PlaneImposter might not behave as you expect. Consider using BoxImposter instead");
                    returnValue = new this.BJSCANNON.Plane();
                    break;
                case BABYLON.PhysicsImpostor.MeshImpostor:
                    // should transform the vertex data to world coordinates!!
                    var rawVerts = object.getVerticesData ? object.getVerticesData(BABYLON.VertexBuffer.PositionKind) : [];
                    var rawFaces = object.getIndices ? object.getIndices() : [];
                    if (!rawVerts)
                        return;
                    // get only scale! so the object could transform correctly.
                    var oldPosition = object.position.clone();
                    var oldRotation = object.rotation && object.rotation.clone();
                    var oldQuaternion = object.rotationQuaternion && object.rotationQuaternion.clone();
                    object.position.copyFromFloats(0, 0, 0);
                    object.rotation && object.rotation.copyFromFloats(0, 0, 0);
                    object.rotationQuaternion && object.rotationQuaternion.copyFrom(impostor.getParentsRotation());
                    object.rotationQuaternion && object.parent && object.rotationQuaternion.conjugateInPlace();
                    var transform = object.computeWorldMatrix(true);
                    // convert rawVerts to object space
                    var temp = new Array();
                    var index;
                    for (index = 0; index < rawVerts.length; index += 3) {
                        BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.FromArray(rawVerts, index), transform).toArray(temp, index);
                    }
                    BABYLON.Tools.Warn("MeshImpostor only collides against spheres.");
                    returnValue = new this.BJSCANNON.Trimesh(temp, rawFaces);
                    //now set back the transformation!
                    object.position.copyFrom(oldPosition);
                    oldRotation && object.rotation && object.rotation.copyFrom(oldRotation);
                    oldQuaternion && object.rotationQuaternion && object.rotationQuaternion.copyFrom(oldQuaternion);
                    break;
                case BABYLON.PhysicsImpostor.HeightmapImpostor:
                    var oldPosition2 = object.position.clone();
                    var oldRotation2 = object.rotation && object.rotation.clone();
                    var oldQuaternion2 = object.rotationQuaternion && object.rotationQuaternion.clone();
                    object.position.copyFromFloats(0, 0, 0);
                    object.rotation && object.rotation.copyFromFloats(0, 0, 0);
                    object.rotationQuaternion && object.rotationQuaternion.copyFrom(impostor.getParentsRotation());
                    object.rotationQuaternion && object.parent && object.rotationQuaternion.conjugateInPlace();
                    object.rotationQuaternion && object.rotationQuaternion.multiplyInPlace(this._minus90X);
                    returnValue = this._createHeightmap(object);
                    object.position.copyFrom(oldPosition2);
                    oldRotation2 && object.rotation && object.rotation.copyFrom(oldRotation2);
                    oldQuaternion2 && object.rotationQuaternion && object.rotationQuaternion.copyFrom(oldQuaternion2);
                    object.computeWorldMatrix(true);
                    break;
                case BABYLON.PhysicsImpostor.ParticleImpostor:
                    returnValue = new this.BJSCANNON.Particle();
                    break;
            }
            return returnValue;
        };
        CannonJSPlugin.prototype._createHeightmap = function (object, pointDepth) {
            var pos = (object.getVerticesData(BABYLON.VertexBuffer.PositionKind));
            var transform = object.computeWorldMatrix(true);
            // convert rawVerts to object space
            var temp = new Array();
            var index;
            for (index = 0; index < pos.length; index += 3) {
                BABYLON.Vector3.TransformCoordinates(BABYLON.Vector3.FromArray(pos, index), transform).toArray(temp, index);
            }
            pos = temp;
            var matrix = new Array();
            //For now pointDepth will not be used and will be automatically calculated.
            //Future reference - try and find the best place to add a reference to the pointDepth variable.
            var arraySize = pointDepth || ~~(Math.sqrt(pos.length / 3) - 1);
            var boundingInfo = object.getBoundingInfo();
            var dim = Math.min(boundingInfo.boundingBox.extendSizeWorld.x, boundingInfo.boundingBox.extendSizeWorld.y);
            var minY = boundingInfo.boundingBox.extendSizeWorld.z;
            var elementSize = dim * 2 / arraySize;
            for (var i = 0; i < pos.length; i = i + 3) {
                var x = Math.round((pos[i + 0]) / elementSize + arraySize / 2);
                var z = Math.round(((pos[i + 1]) / elementSize - arraySize / 2) * -1);
                var y = -pos[i + 2] + minY;
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
                    //console.log("missing x", x);
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
            var shape = new this.BJSCANNON.Heightfield(matrix, {
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
            var bInfo = object.getBoundingInfo();
            if (!bInfo)
                return;
            var center = impostor.getObjectCenter();
            //m.getAbsolutePosition().subtract(m.getBoundingInfo().boundingBox.centerWorld)
            this._tmpDeltaPosition.copyFrom(object.getAbsolutePivotPoint().subtract(center));
            this._tmpDeltaPosition.divideInPlace(impostor.object.scaling);
            this._tmpPosition.copyFrom(center);
            var quaternion = object.rotationQuaternion;
            if (!quaternion) {
                return;
            }
            //is shape is a plane or a heightmap, it must be rotated 90 degs in the X axis.
            if (impostor.type === BABYLON.PhysicsImpostor.PlaneImpostor || impostor.type === BABYLON.PhysicsImpostor.HeightmapImpostor || impostor.type === BABYLON.PhysicsImpostor.CylinderImpostor) {
                //-90 DEG in X, precalculated
                quaternion = quaternion.multiply(this._minus90X);
                //Invert! (Precalculated, 90 deg in X)
                //No need to clone. this will never change.
                impostor.setDeltaRotation(this._plus90X);
            }
            //If it is a heightfield, if should be centered.
            if (impostor.type === BABYLON.PhysicsImpostor.HeightmapImpostor) {
                var mesh = object;
                var boundingInfo = mesh.getBoundingInfo();
                //calculate the correct body position:
                var rotationQuaternion = mesh.rotationQuaternion;
                mesh.rotationQuaternion = this._tmpUnityRotation;
                mesh.computeWorldMatrix(true);
                //get original center with no rotation
                var c = center.clone();
                var oldPivot = mesh.getPivotMatrix() || BABYLON.Matrix.Translation(0, 0, 0);
                //calculate the new center using a pivot (since this.BJSCANNON.js doesn't center height maps)
                var p = BABYLON.Matrix.Translation(boundingInfo.boundingBox.extendSizeWorld.x, 0, -boundingInfo.boundingBox.extendSizeWorld.z);
                mesh.setPivotMatrix(p);
                mesh.computeWorldMatrix(true);
                //calculate the translation
                var translation = boundingInfo.boundingBox.centerWorld.subtract(center).subtract(mesh.position).negate();
                this._tmpPosition.copyFromFloats(translation.x, translation.y - boundingInfo.boundingBox.extendSizeWorld.y, translation.z);
                //add it inverted to the delta
                this._tmpDeltaPosition.copyFrom(boundingInfo.boundingBox.centerWorld.subtract(c));
                this._tmpDeltaPosition.y += boundingInfo.boundingBox.extendSizeWorld.y;
                //rotation is back
                mesh.rotationQuaternion = rotationQuaternion;
                mesh.setPivotMatrix(oldPivot);
                mesh.computeWorldMatrix(true);
            }
            else if (impostor.type === BABYLON.PhysicsImpostor.MeshImpostor) {
                this._tmpDeltaPosition.copyFromFloats(0, 0, 0);
                //this._tmpPosition.copyFrom(object.position);
            }
            impostor.setDeltaPosition(this._tmpDeltaPosition);
            //Now update the impostor object
            impostor.physicsBody.position.copy(this._tmpPosition);
            impostor.physicsBody.quaternion.copy(quaternion);
        };
        CannonJSPlugin.prototype.setTransformationFromPhysicsBody = function (impostor) {
            impostor.object.position.copyFrom(impostor.physicsBody.position);
            if (impostor.object.rotationQuaternion) {
                impostor.object.rotationQuaternion.copyFrom(impostor.physicsBody.quaternion);
            }
        };
        CannonJSPlugin.prototype.setPhysicsBodyTransformation = function (impostor, newPosition, newRotation) {
            impostor.physicsBody.position.copy(newPosition);
            impostor.physicsBody.quaternion.copy(newRotation);
        };
        CannonJSPlugin.prototype.isSupported = function () {
            return this.BJSCANNON !== undefined;
        };
        CannonJSPlugin.prototype.setLinearVelocity = function (impostor, velocity) {
            impostor.physicsBody.velocity.copy(velocity);
        };
        CannonJSPlugin.prototype.setAngularVelocity = function (impostor, velocity) {
            impostor.physicsBody.angularVelocity.copy(velocity);
        };
        CannonJSPlugin.prototype.getLinearVelocity = function (impostor) {
            var v = impostor.physicsBody.velocity;
            if (!v) {
                return null;
            }
            return new BABYLON.Vector3(v.x, v.y, v.z);
        };
        CannonJSPlugin.prototype.getAngularVelocity = function (impostor) {
            var v = impostor.physicsBody.angularVelocity;
            if (!v) {
                return null;
            }
            return new BABYLON.Vector3(v.x, v.y, v.z);
        };
        CannonJSPlugin.prototype.setBodyMass = function (impostor, mass) {
            impostor.physicsBody.mass = mass;
            impostor.physicsBody.updateMassProperties();
        };
        CannonJSPlugin.prototype.getBodyMass = function (impostor) {
            return impostor.physicsBody.mass;
        };
        CannonJSPlugin.prototype.getBodyFriction = function (impostor) {
            return impostor.physicsBody.material.friction;
        };
        CannonJSPlugin.prototype.setBodyFriction = function (impostor, friction) {
            impostor.physicsBody.material.friction = friction;
        };
        CannonJSPlugin.prototype.getBodyRestitution = function (impostor) {
            return impostor.physicsBody.material.restitution;
        };
        CannonJSPlugin.prototype.setBodyRestitution = function (impostor, restitution) {
            impostor.physicsBody.material.restitution = restitution;
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
        // private enableMotor(joint: IMotorEnabledJoint, motorIndex?: number) {
        //     if (!motorIndex) {
        //         joint.physicsJoint.enableMotor();
        //     }
        // }
        // private disableMotor(joint: IMotorEnabledJoint, motorIndex?: number) {
        //     if (!motorIndex) {
        //         joint.physicsJoint.disableMotor();
        //     }
        // }
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
        CannonJSPlugin.prototype.syncMeshWithImpostor = function (mesh, impostor) {
            var body = impostor.physicsBody;
            mesh.position.x = body.position.x;
            mesh.position.y = body.position.y;
            mesh.position.z = body.position.z;
            if (mesh.rotationQuaternion) {
                mesh.rotationQuaternion.x = body.quaternion.x;
                mesh.rotationQuaternion.y = body.quaternion.y;
                mesh.rotationQuaternion.z = body.quaternion.z;
                mesh.rotationQuaternion.w = body.quaternion.w;
            }
        };
        CannonJSPlugin.prototype.getRadius = function (impostor) {
            var shape = impostor.physicsBody.shapes[0];
            return shape.boundingSphereRadius;
        };
        CannonJSPlugin.prototype.getBoxSizeToRef = function (impostor, result) {
            var shape = impostor.physicsBody.shapes[0];
            result.x = shape.halfExtents.x * 2;
            result.y = shape.halfExtents.y * 2;
            result.z = shape.halfExtents.z * 2;
        };
        CannonJSPlugin.prototype.dispose = function () {
        };
        CannonJSPlugin.prototype._extendNamespace = function () {
            //this will force cannon to execute at least one step when using interpolation
            var step_tmp1 = new this.BJSCANNON.Vec3();
            var Engine = this.BJSCANNON;
            this.BJSCANNON.World.prototype.step = function (dt, timeSinceLastCalled, maxSubSteps) {
                maxSubSteps = maxSubSteps || 10;
                timeSinceLastCalled = timeSinceLastCalled || 0;
                if (timeSinceLastCalled === 0) {
                    this.internalStep(dt);
                    this.time += dt;
                }
                else {
                    var internalSteps = Math.floor((this.time + timeSinceLastCalled) / dt) - Math.floor(this.time / dt);
                    internalSteps = Math.min(internalSteps, maxSubSteps) || 1;
                    var t0 = performance.now();
                    for (var i = 0; i !== internalSteps; i++) {
                        this.internalStep(dt);
                        if (performance.now() - t0 > dt * 1000) {
                            break;
                        }
                    }
                    this.time += timeSinceLastCalled;
                    var h = this.time % dt;
                    var h_div_dt = h / dt;
                    var interpvelo = step_tmp1;
                    var bodies = this.bodies;
                    for (var j = 0; j !== bodies.length; j++) {
                        var b = bodies[j];
                        if (b.type !== Engine.Body.STATIC && b.sleepState !== Engine.Body.SLEEPING) {
                            b.position.vsub(b.previousPosition, interpvelo);
                            interpvelo.scale(h_div_dt, interpvelo);
                            b.position.vadd(interpvelo, b.interpolatedPosition);
                        }
                        else {
                            b.interpolatedPosition.copy(b.position);
                            b.interpolatedQuaternion.copy(b.quaternion);
                        }
                    }
                }
            };
        };
        return CannonJSPlugin;
    }());
    BABYLON.CannonJSPlugin = CannonJSPlugin;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.cannonJSPlugin.js.map

var BABYLON;
(function (BABYLON) {
    var OimoJSPlugin = /** @class */ (function () {
        function OimoJSPlugin(iterations) {
            this.name = "OimoJSPlugin";
            this._tmpImpostorsArray = [];
            this._tmpPositionVector = BABYLON.Vector3.Zero();
            this.BJSOIMO = typeof OIMO !== 'undefined' ? OIMO : (typeof require !== 'undefined' ? require('./Oimo') : undefined);
            this.world = new this.BJSOIMO.World(1 / 60, 2, iterations, true);
            this.world.worldscale(1);
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
        OimoJSPlugin.prototype.getTimeStep = function () {
            return this.world.timeStep;
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
            impostor.physicsBody.applyImpulse(contactPoint.scale(this.BJSOIMO.INV_SCALE), force.scale(this.BJSOIMO.INV_SCALE * mass));
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
                var addToArray = function (parent) {
                    if (!parent.getChildMeshes)
                        return;
                    parent.getChildMeshes().forEach(function (m) {
                        if (m.physicsImpostor) {
                            impostors.push(m.physicsImpostor);
                            //m.physicsImpostor._init();
                        }
                    });
                };
                addToArray(impostor.object);
                var checkWithEpsilon_1 = function (value) {
                    return Math.max(value, BABYLON.PhysicsEngine.Epsilon);
                };
                impostors.forEach(function (i) {
                    if (!impostor.object.rotationQuaternion) {
                        return;
                    }
                    //get the correct bounding box
                    var oldQuaternion = i.object.rotationQuaternion;
                    var rot = new _this.BJSOIMO.Euler().setFromQuaternion({
                        x: impostor.object.rotationQuaternion.x,
                        y: impostor.object.rotationQuaternion.y,
                        z: impostor.object.rotationQuaternion.z,
                        s: impostor.object.rotationQuaternion.w
                    });
                    var extendSize = i.getObjectExtendSize();
                    if (i === impostor) {
                        var center = impostor.getObjectCenter();
                        impostor.object.getAbsolutePivotPoint().subtractToRef(center, _this._tmpPositionVector);
                        _this._tmpPositionVector.divideInPlace(impostor.object.scaling);
                        //Can also use Array.prototype.push.apply
                        bodyConfig.pos.push(center.x);
                        bodyConfig.pos.push(center.y);
                        bodyConfig.pos.push(center.z);
                        //tmp solution
                        bodyConfig.rot.push(rot.x / (_this.BJSOIMO.degtorad || _this.BJSOIMO.TO_RAD));
                        bodyConfig.rot.push(rot.y / (_this.BJSOIMO.degtorad || _this.BJSOIMO.TO_RAD));
                        bodyConfig.rot.push(rot.z / (_this.BJSOIMO.degtorad || _this.BJSOIMO.TO_RAD));
                    }
                    else {
                        var localPosition = i.object.getAbsolutePosition().subtract(impostor.object.getAbsolutePosition());
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
                        case BABYLON.PhysicsImpostor.ParticleImpostor:
                            BABYLON.Tools.Warn("No Particle support in this.BJSOIMO.js. using SphereImpostor instead");
                        case BABYLON.PhysicsImpostor.SphereImpostor:
                            var radiusX = extendSize.x;
                            var radiusY = extendSize.y;
                            var radiusZ = extendSize.z;
                            var size = Math.max(checkWithEpsilon_1(radiusX), checkWithEpsilon_1(radiusY), checkWithEpsilon_1(radiusZ)) / 2;
                            bodyConfig.type.push('sphere');
                            //due to the way oimo works with compounds, add 3 times
                            bodyConfig.size.push(size);
                            bodyConfig.size.push(size);
                            bodyConfig.size.push(size);
                            break;
                        case BABYLON.PhysicsImpostor.CylinderImpostor:
                            var sizeX = checkWithEpsilon_1(extendSize.x) / 2;
                            var sizeY = checkWithEpsilon_1(extendSize.y);
                            bodyConfig.type.push('cylinder');
                            bodyConfig.size.push(sizeX);
                            bodyConfig.size.push(sizeY);
                            //due to the way oimo works with compounds, add one more value.
                            bodyConfig.size.push(sizeY);
                            break;
                        case BABYLON.PhysicsImpostor.PlaneImpostor:
                        case BABYLON.PhysicsImpostor.BoxImpostor:
                        default:
                            var sizeX = checkWithEpsilon_1(extendSize.x);
                            var sizeY = checkWithEpsilon_1(extendSize.y);
                            var sizeZ = checkWithEpsilon_1(extendSize.z);
                            bodyConfig.type.push('box');
                            bodyConfig.size.push(sizeX);
                            bodyConfig.size.push(sizeY);
                            bodyConfig.size.push(sizeZ);
                            break;
                    }
                    //actually not needed, but hey...
                    i.object.rotationQuaternion = oldQuaternion;
                });
                impostor.physicsBody = new this.BJSOIMO.Body(bodyConfig).body; //this.world.add(bodyConfig);
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
                    BABYLON.Tools.Warn("this.BJSOIMO.js doesn't support Spring Constraint. Simulating using DistanceJoint instead");
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
            impostorJoint.joint.physicsJoint = new this.BJSOIMO.Link(nativeJointData).joint; //this.world.add(nativeJointData);
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
            return this.BJSOIMO !== undefined;
        };
        OimoJSPlugin.prototype.setTransformationFromPhysicsBody = function (impostor) {
            if (!impostor.physicsBody.sleeping) {
                //TODO check that
                if (impostor.physicsBody.shapes.next) {
                    var parentShape = this._getLastShape(impostor.physicsBody);
                    impostor.object.position.x = parentShape.position.x * this.BJSOIMO.WORLD_SCALE;
                    impostor.object.position.y = parentShape.position.y * this.BJSOIMO.WORLD_SCALE;
                    impostor.object.position.z = parentShape.position.z * this.BJSOIMO.WORLD_SCALE;
                }
                else {
                    impostor.object.position.copyFrom(impostor.physicsBody.getPosition());
                }
                if (impostor.object.rotationQuaternion) {
                    impostor.object.rotationQuaternion.copyFrom(impostor.physicsBody.getQuaternion());
                    impostor.object.rotationQuaternion.normalize();
                }
            }
        };
        OimoJSPlugin.prototype.setPhysicsBodyTransformation = function (impostor, newPosition, newRotation) {
            var body = impostor.physicsBody;
            body.position.init(newPosition.x * this.BJSOIMO.INV_SCALE, newPosition.y * this.BJSOIMO.INV_SCALE, newPosition.z * this.BJSOIMO.INV_SCALE);
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
            if (!v) {
                return null;
            }
            return new BABYLON.Vector3(v.x, v.y, v.z);
        };
        OimoJSPlugin.prototype.getAngularVelocity = function (impostor) {
            var v = impostor.physicsBody.angularVelocity;
            if (!v) {
                return null;
            }
            return new BABYLON.Vector3(v.x, v.y, v.z);
        };
        OimoJSPlugin.prototype.setBodyMass = function (impostor, mass) {
            var staticBody = mass === 0;
            //this will actually set the body's density and not its mass.
            //But this is how oimo treats the mass variable.
            impostor.physicsBody.shapes.density = staticBody ? 1 : mass;
            impostor.physicsBody.setupMass(staticBody ? 0x2 : 0x1);
        };
        OimoJSPlugin.prototype.getBodyMass = function (impostor) {
            return impostor.physicsBody.shapes.density;
        };
        OimoJSPlugin.prototype.getBodyFriction = function (impostor) {
            return impostor.physicsBody.shapes.friction;
        };
        OimoJSPlugin.prototype.setBodyFriction = function (impostor, friction) {
            impostor.physicsBody.shapes.friction = friction;
        };
        OimoJSPlugin.prototype.getBodyRestitution = function (impostor) {
            return impostor.physicsBody.shapes.restitution;
        };
        OimoJSPlugin.prototype.setBodyRestitution = function (impostor, restitution) {
            impostor.physicsBody.shapes.restitution = restitution;
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
        OimoJSPlugin.prototype.syncMeshWithImpostor = function (mesh, impostor) {
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
        };
        OimoJSPlugin.prototype.getRadius = function (impostor) {
            return impostor.physicsBody.shapes.radius;
        };
        OimoJSPlugin.prototype.getBoxSizeToRef = function (impostor, result) {
            var shape = impostor.physicsBody.shapes;
            result.x = shape.halfWidth * 2;
            result.y = shape.halfHeight * 2;
            result.z = shape.halfDepth * 2;
        };
        OimoJSPlugin.prototype.dispose = function () {
            this.world.clear();
        };
        return OimoJSPlugin;
    }());
    BABYLON.OimoJSPlugin = OimoJSPlugin;
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.oimoJSPlugin.js.map

BABYLON.Effect.IncludesShadersStore['depthPrePass'] = "#ifdef DEPTHPREPASS\ngl_FragColor=vec4(0.,0.,0.,1.0);\nreturn;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesDeclaration'] = "#if NUM_BONE_INFLUENCERS>0\nuniform mat4 mBones[BonesPerMesh];\nattribute vec4 matricesIndices;\nattribute vec4 matricesWeights;\n#if NUM_BONE_INFLUENCERS>4\nattribute vec4 matricesIndicesExtra;\nattribute vec4 matricesWeightsExtra;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesDeclaration'] = "#ifdef INSTANCES\nattribute vec4 world0;\nattribute vec4 world1;\nattribute vec4 world2;\nattribute vec4 world3;\n#else\nuniform mat4 world;\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertexDeclaration'] = "#ifdef POINTSIZE\nuniform float pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertexDeclaration'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n#endif\n";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertexDeclaration'] = "#ifdef CLIPPLANE\nuniform vec4 vClipPlane;\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertexDeclaration'] = "#ifdef FOG\nvarying vec3 vFogDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexGlobalDeclaration'] = "#ifdef MORPHTARGETS\nuniform float morphTargetInfluences[NUM_MORPH_INFLUENCERS];\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertexDeclaration'] = "#ifdef MORPHTARGETS\nattribute vec3 position{X};\n#ifdef MORPHTARGETS_NORMAL\nattribute vec3 normal{X};\n#endif\n#ifdef MORPHTARGETS_TANGENT\nattribute vec3 tangent{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthDeclaration'] = "#ifdef LOGARITHMICDEPTH\nuniform float logarithmicDepthConstant;\nvarying float vFragmentDepth;\n#endif";
BABYLON.Effect.IncludesShadersStore['morphTargetsVertex'] = "#ifdef MORPHTARGETS\npositionUpdated+=(position{X}-position)*morphTargetInfluences[{X}];\n#ifdef MORPHTARGETS_NORMAL\nnormalUpdated+=(normal{X}-normal)*morphTargetInfluences[{X}];\n#endif\n#ifdef MORPHTARGETS_TANGENT\ntangentUpdated.xyz+=(tangent{X}-tangent.xyz)*morphTargetInfluences[{X}];\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['instancesVertex'] = "#ifdef INSTANCES\nmat4 finalWorld=mat4(world0,world1,world2,world3);\n#else\nmat4 finalWorld=world;\n#endif";
BABYLON.Effect.IncludesShadersStore['bonesVertex'] = "#if NUM_BONE_INFLUENCERS>0\nmat4 influence;\ninfluence=mBones[int(matricesIndices[0])]*matricesWeights[0];\n#if NUM_BONE_INFLUENCERS>1\ninfluence+=mBones[int(matricesIndices[1])]*matricesWeights[1];\n#endif \n#if NUM_BONE_INFLUENCERS>2\ninfluence+=mBones[int(matricesIndices[2])]*matricesWeights[2];\n#endif \n#if NUM_BONE_INFLUENCERS>3\ninfluence+=mBones[int(matricesIndices[3])]*matricesWeights[3];\n#endif \n#if NUM_BONE_INFLUENCERS>4\ninfluence+=mBones[int(matricesIndicesExtra[0])]*matricesWeightsExtra[0];\n#endif \n#if NUM_BONE_INFLUENCERS>5\ninfluence+=mBones[int(matricesIndicesExtra[1])]*matricesWeightsExtra[1];\n#endif \n#if NUM_BONE_INFLUENCERS>6\ninfluence+=mBones[int(matricesIndicesExtra[2])]*matricesWeightsExtra[2];\n#endif \n#if NUM_BONE_INFLUENCERS>7\ninfluence+=mBones[int(matricesIndicesExtra[3])]*matricesWeightsExtra[3];\n#endif \nfinalWorld=finalWorld*influence;\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpVertex'] = "#if defined(BUMP) || defined(PARALLAX)\n#if defined(TANGENT) && defined(NORMAL)\nvec3 tbnNormal=normalize(normalUpdated);\nvec3 tbnTangent=normalize(tangentUpdated.xyz);\nvec3 tbnBitangent=cross(tbnNormal,tbnTangent)*tangentUpdated.w;\nvTBN=mat3(finalWorld)*mat3(tbnTangent,tbnBitangent,tbnNormal);\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneVertex'] = "#ifdef CLIPPLANE\nfClipDistance=dot(worldPos,vClipPlane);\n#endif";
BABYLON.Effect.IncludesShadersStore['fogVertex'] = "#ifdef FOG\nvFogDistance=(view*worldPos).xyz;\n#endif";
BABYLON.Effect.IncludesShadersStore['shadowsVertex'] = "#ifdef SHADOWS\n#if defined(SHADOW{X}) && !defined(SHADOWCUBE{X})\nvPositionFromLight{X}=lightMatrix{X}*worldPos;\nvDepthMetric{X}=((vPositionFromLight{X}.z+light{X}.depthValues.x)/(light{X}.depthValues.y));\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['pointCloudVertex'] = "#ifdef POINTSIZE\ngl_PointSize=pointSize;\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthVertex'] = "#ifdef LOGARITHMICDEPTH\nvFragmentDepth=1.0+gl_Position.w;\ngl_Position.z=log2(max(0.000001,vFragmentDepth))*logarithmicDepthConstant;\n#endif";
BABYLON.Effect.IncludesShadersStore['helperFunctions'] = "const float PI=3.1415926535897932384626433832795;\nconst float LinearEncodePowerApprox=2.2;\nconst float GammaEncodePowerApprox=1.0/LinearEncodePowerApprox;\nconst vec3 LuminanceEncodeApprox=vec3(0.2126,0.7152,0.0722);\nmat3 transposeMat3(mat3 inMatrix) {\nvec3 i0=inMatrix[0];\nvec3 i1=inMatrix[1];\nvec3 i2=inMatrix[2];\nmat3 outMatrix=mat3(\nvec3(i0.x,i1.x,i2.x),\nvec3(i0.y,i1.y,i2.y),\nvec3(i0.z,i1.z,i2.z)\n);\nreturn outMatrix;\n}\n\nmat3 inverseMat3(mat3 inMatrix) {\nfloat a00=inMatrix[0][0],a01=inMatrix[0][1],a02=inMatrix[0][2];\nfloat a10=inMatrix[1][0],a11=inMatrix[1][1],a12=inMatrix[1][2];\nfloat a20=inMatrix[2][0],a21=inMatrix[2][1],a22=inMatrix[2][2];\nfloat b01=a22*a11-a12*a21;\nfloat b11=-a22*a10+a12*a20;\nfloat b21=a21*a10-a11*a20;\nfloat det=a00*b01+a01*b11+a02*b21;\nreturn mat3(b01,(-a22*a01+a02*a21),(a12*a01-a02*a11),\nb11,(a22*a00-a02*a20),(-a12*a00+a02*a10),\nb21,(-a21*a00+a01*a20),(a11*a00-a01*a10))/det;\n}\nfloat computeFallOff(float value,vec2 clipSpace,float frustumEdgeFalloff)\n{\nfloat mask=smoothstep(1.0-frustumEdgeFalloff,1.0,clamp(dot(clipSpace,clipSpace),0.,1.));\nreturn mix(value,1.0,mask);\n}\nvec3 applyEaseInOut(vec3 x){\nreturn x*x*(3.0-2.0*x);\n}\nvec3 toLinearSpace(vec3 color)\n{\nreturn pow(color,vec3(LinearEncodePowerApprox));\n}\nvec3 toGammaSpace(vec3 color)\n{\nreturn pow(color,vec3(GammaEncodePowerApprox));\n}\nfloat square(float value)\n{\nreturn value*value;\n}\nfloat getLuminance(vec3 color)\n{\nreturn clamp(dot(color,LuminanceEncodeApprox),0.,1.);\n}\n\nfloat getRand(vec2 seed) {\nreturn fract(sin(dot(seed.xy ,vec2(12.9898,78.233)))*43758.5453);\n}\nvec3 dither(vec2 seed,vec3 color) {\nfloat rand=getRand(seed);\ncolor+=mix(-0.5/255.0,0.5/255.0,rand);\ncolor=max(color,0.0);\nreturn color;\n}";
BABYLON.Effect.IncludesShadersStore['lightFragmentDeclaration'] = "#ifdef LIGHT{X}\nuniform vec4 vLightData{X};\nuniform vec4 vLightDiffuse{X};\n#ifdef SPECULARTERM\nuniform vec3 vLightSpecular{X};\n#else\nvec3 vLightSpecular{X}=vec3(0.);\n#endif\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\nuniform vec4 shadowsInfo{X};\nuniform vec2 depthValues{X};\n#endif\n#ifdef SPOTLIGHT{X}\nuniform vec4 vLightDirection{X};\n#endif\n#ifdef HEMILIGHT{X}\nuniform vec3 vLightGround{X};\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['lightsFragmentFunctions'] = "\nstruct lightingInfo\n{\nvec3 diffuse;\n#ifdef SPECULARTERM\nvec3 specular;\n#endif\n#ifdef NDOTL\nfloat ndl;\n#endif\n};\nlightingInfo computeLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 lightVectorW;\nfloat attenuation=1.0;\nif (lightData.w == 0.)\n{\nvec3 direction=lightData.xyz-vPositionW;\nattenuation=max(0.,1.0-length(direction)/range);\nlightVectorW=normalize(direction);\n}\nelse\n{\nlightVectorW=normalize(-lightData.xyz);\n}\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nlightingInfo computeSpotLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec4 lightDirection,vec3 diffuseColor,vec3 specularColor,float range,float glossiness) {\nlightingInfo result;\nvec3 direction=lightData.xyz-vPositionW;\nvec3 lightVectorW=normalize(direction);\nfloat attenuation=max(0.,1.0-length(direction)/range);\n\nfloat cosAngle=max(0.,dot(lightDirection.xyz,-lightVectorW));\nif (cosAngle>=lightDirection.w)\n{\ncosAngle=max(0.,pow(cosAngle,lightData.w));\nattenuation*=cosAngle;\n\nfloat ndl=max(0.,dot(vNormal,lightVectorW));\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=ndl*diffuseColor*attenuation;\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightVectorW);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor*attenuation;\n#endif\nreturn result;\n}\nresult.diffuse=vec3(0.);\n#ifdef SPECULARTERM\nresult.specular=vec3(0.);\n#endif\n#ifdef NDOTL\nresult.ndl=0.;\n#endif\nreturn result;\n}\nlightingInfo computeHemisphericLighting(vec3 viewDirectionW,vec3 vNormal,vec4 lightData,vec3 diffuseColor,vec3 specularColor,vec3 groundColor,float glossiness) {\nlightingInfo result;\n\nfloat ndl=dot(vNormal,lightData.xyz)*0.5+0.5;\n#ifdef NDOTL\nresult.ndl=ndl;\n#endif\nresult.diffuse=mix(groundColor,diffuseColor,ndl);\n#ifdef SPECULARTERM\n\nvec3 angleW=normalize(viewDirectionW+lightData.xyz);\nfloat specComp=max(0.,dot(vNormal,angleW));\nspecComp=pow(specComp,max(1.,glossiness));\nresult.specular=specComp*specularColor;\n#endif\nreturn result;\n}\n";
BABYLON.Effect.IncludesShadersStore['lightUboDeclaration'] = "#ifdef LIGHT{X}\nuniform Light{X}\n{\nvec4 vLightData;\nvec4 vLightDiffuse;\nvec3 vLightSpecular;\n#ifdef SPOTLIGHT{X}\nvec4 vLightDirection;\n#endif\n#ifdef HEMILIGHT{X}\nvec3 vLightGround;\n#endif\nvec4 shadowsInfo;\nvec2 depthValues;\n} light{X};\n#ifdef SHADOW{X}\n#if defined(SHADOWCUBE{X})\nuniform samplerCube shadowSampler{X};\n#else\nvarying vec4 vPositionFromLight{X};\nvarying float vDepthMetric{X};\nuniform sampler2D shadowSampler{X};\nuniform mat4 lightMatrix{X};\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultVertexDeclaration'] = "\nuniform mat4 viewProjection;\nuniform mat4 view;\n#ifdef DIFFUSE\nuniform mat4 diffuseMatrix;\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform mat4 ambientMatrix;\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY\nuniform mat4 opacityMatrix;\nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\nuniform mat4 emissiveMatrix;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\nuniform mat4 lightmapMatrix;\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\nuniform mat4 specularMatrix;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform mat4 bumpMatrix;\n#endif\n#ifdef POINTSIZE\nuniform float pointSize;\n#endif\n";
BABYLON.Effect.IncludesShadersStore['defaultFragmentDeclaration'] = "uniform vec4 vDiffuseColor;\n#ifdef SPECULARTERM\nuniform vec4 vSpecularColor;\n#endif\nuniform vec3 vEmissiveColor;\n\n#ifdef DIFFUSE\nuniform vec2 vDiffuseInfos;\n#endif\n#ifdef AMBIENT\nuniform vec2 vAmbientInfos;\n#endif\n#ifdef OPACITY \nuniform vec2 vOpacityInfos;\n#endif\n#ifdef EMISSIVE\nuniform vec2 vEmissiveInfos;\n#endif\n#ifdef LIGHTMAP\nuniform vec2 vLightmapInfos;\n#endif\n#ifdef BUMP\nuniform vec3 vBumpInfos;\nuniform vec2 vTangentSpaceParams;\n#endif\n#if defined(REFLECTIONMAP_SPHERICAL) || defined(REFLECTIONMAP_PROJECTION) || defined(REFRACTION)\nuniform mat4 view;\n#endif\n#ifdef REFRACTION\nuniform vec4 vRefractionInfos;\n#ifndef REFRACTIONMAP_3D\nuniform mat4 refractionMatrix;\n#endif\n#ifdef REFRACTIONFRESNEL\nuniform vec4 refractionLeftColor;\nuniform vec4 refractionRightColor;\n#endif\n#endif\n#if defined(SPECULAR) && defined(SPECULARTERM)\nuniform vec2 vSpecularInfos;\n#endif\n#ifdef DIFFUSEFRESNEL\nuniform vec4 diffuseLeftColor;\nuniform vec4 diffuseRightColor;\n#endif\n#ifdef OPACITYFRESNEL\nuniform vec4 opacityParts;\n#endif\n#ifdef EMISSIVEFRESNEL\nuniform vec4 emissiveLeftColor;\nuniform vec4 emissiveRightColor;\n#endif\n\n#ifdef REFLECTION\nuniform vec2 vReflectionInfos;\n#ifdef REFLECTIONMAP_SKYBOX\n#else\n#if defined(REFLECTIONMAP_PLANAR) || defined(REFLECTIONMAP_CUBIC) || defined(REFLECTIONMAP_PROJECTION)\nuniform mat4 reflectionMatrix;\n#endif\n#endif\n#ifdef REFLECTIONFRESNEL\nuniform vec4 reflectionLeftColor;\nuniform vec4 reflectionRightColor;\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['defaultUboDeclaration'] = "layout(std140,column_major) uniform;\nuniform Material\n{\nvec4 diffuseLeftColor;\nvec4 diffuseRightColor;\nvec4 opacityParts;\nvec4 reflectionLeftColor;\nvec4 reflectionRightColor;\nvec4 refractionLeftColor;\nvec4 refractionRightColor;\nvec4 emissiveLeftColor; \nvec4 emissiveRightColor;\nvec2 vDiffuseInfos;\nvec2 vAmbientInfos;\nvec2 vOpacityInfos;\nvec2 vReflectionInfos;\nvec2 vEmissiveInfos;\nvec2 vLightmapInfos;\nvec2 vSpecularInfos;\nvec3 vBumpInfos;\nmat4 diffuseMatrix;\nmat4 ambientMatrix;\nmat4 opacityMatrix;\nmat4 reflectionMatrix;\nmat4 emissiveMatrix;\nmat4 lightmapMatrix;\nmat4 specularMatrix;\nmat4 bumpMatrix; \nvec4 vTangentSpaceParams;\nmat4 refractionMatrix;\nvec4 vRefractionInfos;\nvec4 vSpecularColor;\nvec3 vEmissiveColor;\nvec4 vDiffuseColor;\nfloat pointSize; \n};\nuniform Scene {\nmat4 viewProjection;\nmat4 view;\n};";
BABYLON.Effect.IncludesShadersStore['shadowsFragmentFunctions'] = "#ifdef SHADOWS\n#ifndef SHADOWFLOAT\nfloat unpack(vec4 color)\n{\nconst vec4 bit_shift=vec4(1.0/(255.0*255.0*255.0),1.0/(255.0*255.0),1.0/255.0,1.0);\nreturn dot(color,bit_shift);\n}\n#endif\nfloat computeShadowCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadow=textureCube(shadowSampler,directionToLight).x;\n#endif\nif (depth>shadow)\n{\nreturn darkness;\n}\nreturn 1.0;\n}\nfloat computeShadowWithPCFCube(vec3 lightPosition,samplerCube shadowSampler,float mapSize,float darkness,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\ndepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\nfloat visibility=1.;\nvec3 poissonDisk[4];\npoissonDisk[0]=vec3(-1.0,1.0,-1.0);\npoissonDisk[1]=vec3(1.0,-1.0,-1.0);\npoissonDisk[2]=vec3(-1.0,-1.0,-1.0);\npoissonDisk[3]=vec3(1.0,-1.0,1.0);\n\n#ifndef SHADOWFLOAT\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize))<depth) visibility-=0.25;\nif (unpack(textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize))<depth) visibility-=0.25;\n#else\nif (textureCube(shadowSampler,directionToLight+poissonDisk[0]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[1]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[2]*mapSize).x<depth) visibility-=0.25;\nif (textureCube(shadowSampler,directionToLight+poissonDisk[3]*mapSize).x<depth) visibility-=0.25;\n#endif\nreturn min(1.0,visibility+darkness);\n}\nfloat computeShadowWithESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness); \nreturn esm;\n}\nfloat computeShadowWithCloseESMCube(vec3 lightPosition,samplerCube shadowSampler,float darkness,float depthScale,vec2 depthValues)\n{\nvec3 directionToLight=vPositionW-lightPosition;\nfloat depth=length(directionToLight);\ndepth=(depth+depthValues.x)/(depthValues.y);\nfloat shadowPixelDepth=clamp(depth,0.,1.0);\ndirectionToLight=normalize(directionToLight);\ndirectionToLight.y=-directionToLight.y;\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(textureCube(shadowSampler,directionToLight));\n#else\nfloat shadowMapSample=textureCube(shadowSampler,directionToLight).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn esm;\n}\nfloat computeShadow(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadow=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadow=texture2D(shadowSampler,uv).x;\n#endif\nif (shadowPixelDepth>shadow)\n{\nreturn computeFallOff(darkness,clipSpace.xy,frustumEdgeFalloff);\n}\nreturn 1.;\n}\nfloat computeShadowWithPCF(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float mapSize,float darkness,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\nfloat visibility=1.;\nvec2 poissonDisk[4];\npoissonDisk[0]=vec2(-0.94201624,-0.39906216);\npoissonDisk[1]=vec2(0.94558609,-0.76890725);\npoissonDisk[2]=vec2(-0.094184101,-0.92938870);\npoissonDisk[3]=vec2(0.34495938,0.29387760);\n\n#ifndef SHADOWFLOAT\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[0]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[1]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[2]*mapSize))<shadowPixelDepth) visibility-=0.25;\nif (unpack(texture2D(shadowSampler,uv+poissonDisk[3]*mapSize))<shadowPixelDepth) visibility-=0.25;\n#else\nif (texture2D(shadowSampler,uv+poissonDisk[0]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[1]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[2]*mapSize).x<shadowPixelDepth) visibility-=0.25;\nif (texture2D(shadowSampler,uv+poissonDisk[3]*mapSize).x<shadowPixelDepth) visibility-=0.25;\n#endif\nreturn computeFallOff(min(1.0,visibility+darkness),clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0);\n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=1.0-clamp(exp(min(87.,depthScale*shadowPixelDepth))*shadowMapSample,0.,1.-darkness);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\nfloat computeShadowWithCloseESM(vec4 vPositionFromLight,float depthMetric,sampler2D shadowSampler,float darkness,float depthScale,float frustumEdgeFalloff)\n{\nvec3 clipSpace=vPositionFromLight.xyz/vPositionFromLight.w;\nvec2 uv=0.5*clipSpace.xy+vec2(0.5);\nif (uv.x<0. || uv.x>1.0 || uv.y<0. || uv.y>1.0)\n{\nreturn 1.0;\n}\nfloat shadowPixelDepth=clamp(depthMetric,0.,1.0); \n#ifndef SHADOWFLOAT\nfloat shadowMapSample=unpack(texture2D(shadowSampler,uv));\n#else\nfloat shadowMapSample=texture2D(shadowSampler,uv).x;\n#endif\nfloat esm=clamp(exp(min(87.,-depthScale*(shadowPixelDepth-shadowMapSample))),darkness,1.);\nreturn computeFallOff(esm,clipSpace.xy,frustumEdgeFalloff);\n}\n#endif\n";
BABYLON.Effect.IncludesShadersStore['fresnelFunction'] = "#ifdef FRESNEL\nfloat computeFresnelTerm(vec3 viewDirection,vec3 worldNormal,float bias,float power)\n{\nfloat fresnelTerm=pow(bias+abs(dot(viewDirection,worldNormal)),power);\nreturn clamp(fresnelTerm,0.,1.);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['reflectionFunction'] = "vec3 computeReflectionCoords(vec4 worldPos,vec3 worldNormal)\n{\n#if defined(REFLECTIONMAP_EQUIRECTANGULAR_FIXED) || defined(REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED)\nvec3 direction=normalize(vDirectionW);\nfloat t=clamp(direction.y*-0.5+0.5,0.,1.0);\nfloat s=atan(direction.z,direction.x)*RECIPROCAL_PI2+0.5;\n#ifdef REFLECTIONMAP_MIRROREDEQUIRECTANGULAR_FIXED\nreturn vec3(1.0-s,t,0);\n#else\nreturn vec3(s,t,0);\n#endif\n#endif\n#ifdef REFLECTIONMAP_EQUIRECTANGULAR\nvec3 cameraToVertex=normalize(worldPos.xyz-vEyePosition.xyz);\nvec3 r=reflect(cameraToVertex,worldNormal);\nfloat t=clamp(r.y*-0.5+0.5,0.,1.0);\nfloat s=atan(r.z,r.x)*RECIPROCAL_PI2+0.5;\nreturn vec3(s,t,0);\n#endif\n#ifdef REFLECTIONMAP_SPHERICAL\nvec3 viewDir=normalize(vec3(view*worldPos));\nvec3 viewNormal=normalize(vec3(view*vec4(worldNormal,0.0)));\nvec3 r=reflect(viewDir,viewNormal);\nr.z=r.z-1.0;\nfloat m=2.0*length(r);\nreturn vec3(r.x/m+0.5,1.0-r.y/m-0.5,0);\n#endif\n#ifdef REFLECTIONMAP_PLANAR\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=normalize(reflect(viewDir,worldNormal));\nreturn vec3(reflectionMatrix*vec4(coords,1));\n#endif\n#ifdef REFLECTIONMAP_CUBIC\nvec3 viewDir=worldPos.xyz-vEyePosition.xyz;\nvec3 coords=reflect(viewDir,worldNormal);\n#ifdef INVERTCUBICMAP\ncoords.y=1.0-coords.y;\n#endif\nreturn vec3(reflectionMatrix*vec4(coords,0));\n#endif\n#ifdef REFLECTIONMAP_PROJECTION\nreturn vec3(reflectionMatrix*(view*worldPos));\n#endif\n#ifdef REFLECTIONMAP_SKYBOX\nreturn vPositionUVW;\n#endif\n#ifdef REFLECTIONMAP_EXPLICIT\nreturn vec3(0,0,0);\n#endif\n}";
BABYLON.Effect.IncludesShadersStore['imageProcessingDeclaration'] = "#ifdef EXPOSURE\nuniform float exposureLinear;\n#endif\n#ifdef CONTRAST\nuniform float contrast;\n#endif\n#ifdef VIGNETTE\nuniform vec2 vInverseScreenSize;\nuniform vec4 vignetteSettings1;\nuniform vec4 vignetteSettings2;\n#endif\n#ifdef COLORCURVES\nuniform vec4 vCameraColorCurveNegative;\nuniform vec4 vCameraColorCurveNeutral;\nuniform vec4 vCameraColorCurvePositive;\n#endif\n#ifdef COLORGRADING\n#ifdef COLORGRADING3D\nuniform highp sampler3D txColorTransform;\n#else\nuniform sampler2D txColorTransform;\n#endif\nuniform vec4 colorTransformSettings;\n#endif";
BABYLON.Effect.IncludesShadersStore['imageProcessingFunctions'] = "#if defined(COLORGRADING) && !defined(COLORGRADING3D)\n\nvec3 sampleTexture3D(sampler2D colorTransform,vec3 color,vec2 sampler3dSetting)\n{\nfloat sliceSize=2.0*sampler3dSetting.x; \n#ifdef SAMPLER3DGREENDEPTH\nfloat sliceContinuous=(color.g-sampler3dSetting.x)*sampler3dSetting.y;\n#else\nfloat sliceContinuous=(color.b-sampler3dSetting.x)*sampler3dSetting.y;\n#endif\nfloat sliceInteger=floor(sliceContinuous);\n\n\nfloat sliceFraction=sliceContinuous-sliceInteger;\n#ifdef SAMPLER3DGREENDEPTH\nvec2 sliceUV=color.rb;\n#else\nvec2 sliceUV=color.rg;\n#endif\nsliceUV.x*=sliceSize;\nsliceUV.x+=sliceInteger*sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice0Color=texture2D(colorTransform,sliceUV);\nsliceUV.x+=sliceSize;\nsliceUV=clamp(sliceUV,0.,1.);\nvec4 slice1Color=texture2D(colorTransform,sliceUV);\nvec3 result=mix(slice0Color.rgb,slice1Color.rgb,sliceFraction);\n#ifdef SAMPLER3DBGRMAP\ncolor.rgb=result.rgb;\n#else\ncolor.rgb=result.bgr;\n#endif\nreturn color;\n}\n#endif\nvec4 applyImageProcessing(vec4 result) {\n#ifdef EXPOSURE\nresult.rgb*=exposureLinear;\n#endif\n#ifdef VIGNETTE\n\nvec2 viewportXY=gl_FragCoord.xy*vInverseScreenSize;\nviewportXY=viewportXY*2.0-1.0;\nvec3 vignetteXY1=vec3(viewportXY*vignetteSettings1.xy+vignetteSettings1.zw,1.0);\nfloat vignetteTerm=dot(vignetteXY1,vignetteXY1);\nfloat vignette=pow(vignetteTerm,vignetteSettings2.w);\n\nvec3 vignetteColor=vignetteSettings2.rgb;\n#ifdef VIGNETTEBLENDMODEMULTIPLY\nvec3 vignetteColorMultiplier=mix(vignetteColor,vec3(1,1,1),vignette);\nresult.rgb*=vignetteColorMultiplier;\n#endif\n#ifdef VIGNETTEBLENDMODEOPAQUE\nresult.rgb=mix(vignetteColor,result.rgb,vignette);\n#endif\n#endif\n#ifdef TONEMAPPING\nconst float tonemappingCalibration=1.590579;\nresult.rgb=1.0-exp2(-tonemappingCalibration*result.rgb);\n#endif\n\nresult.rgb=toGammaSpace(result.rgb);\nresult.rgb=clamp(result.rgb,0.0,1.0);\n#ifdef CONTRAST\n\nvec3 resultHighContrast=applyEaseInOut(result.rgb);\nif (contrast<1.0) {\n\nresult.rgb=mix(vec3(0.5,0.5,0.5),result.rgb,contrast);\n} else {\n\nresult.rgb=mix(result.rgb,resultHighContrast,contrast-1.0);\n}\n#endif\n\n#ifdef COLORGRADING\nvec3 colorTransformInput=result.rgb*colorTransformSettings.xxx+colorTransformSettings.yyy;\n#ifdef COLORGRADING3D\nvec3 colorTransformOutput=texture(txColorTransform,colorTransformInput).rgb;\n#else\nvec3 colorTransformOutput=sampleTexture3D(txColorTransform,colorTransformInput,colorTransformSettings.yz).rgb;\n#endif\nresult.rgb=mix(result.rgb,colorTransformOutput,colorTransformSettings.www);\n#endif\n#ifdef COLORCURVES\n\nfloat luma=getLuminance(result.rgb);\nvec2 curveMix=clamp(vec2(luma*3.0-1.5,luma*-3.0+1.5),vec2(0.0),vec2(1.0));\nvec4 colorCurve=vCameraColorCurveNeutral+curveMix.x*vCameraColorCurvePositive-curveMix.y*vCameraColorCurveNegative;\nresult.rgb*=colorCurve.rgb;\nresult.rgb=mix(vec3(luma),result.rgb,colorCurve.a);\n#endif\nreturn result;\n}";
BABYLON.Effect.IncludesShadersStore['bumpFragmentFunctions'] = "#ifdef BUMP\n#if BUMPDIRECTUV == 1\n#define vBumpUV vMainUV1\n#elif BUMPDIRECTUV == 2\n#define vBumpUV vMainUV2\n#else\nvarying vec2 vBumpUV;\n#endif\nuniform sampler2D bumpSampler;\n#if defined(TANGENT) && defined(NORMAL) \nvarying mat3 vTBN;\n#endif\n\nmat3 cotangent_frame(vec3 normal,vec3 p,vec2 uv)\n{\n\nuv=gl_FrontFacing ? uv : -uv;\n\nvec3 dp1=dFdx(p);\nvec3 dp2=dFdy(p);\nvec2 duv1=dFdx(uv);\nvec2 duv2=dFdy(uv);\n\nvec3 dp2perp=cross(dp2,normal);\nvec3 dp1perp=cross(normal,dp1);\nvec3 tangent=dp2perp*duv1.x+dp1perp*duv2.x;\nvec3 bitangent=dp2perp*duv1.y+dp1perp*duv2.y;\n\ntangent*=vTangentSpaceParams.x;\nbitangent*=vTangentSpaceParams.y;\n\nfloat invmax=inversesqrt(max(dot(tangent,tangent),dot(bitangent,bitangent)));\nreturn mat3(tangent*invmax,bitangent*invmax,normal);\n}\nvec3 perturbNormal(mat3 cotangentFrame,vec2 uv)\n{\nvec3 map=texture2D(bumpSampler,uv).xyz;\nmap=map*2.0-1.0;\n#ifdef NORMALXYSCALE\nmap=normalize(map*vec3(vBumpInfos.y,vBumpInfos.y,1.0));\n#endif\nreturn normalize(cotangentFrame*map);\n}\n#ifdef PARALLAX\nconst float minSamples=4.;\nconst float maxSamples=15.;\nconst int iMaxSamples=15;\n\nvec2 parallaxOcclusion(vec3 vViewDirCoT,vec3 vNormalCoT,vec2 texCoord,float parallaxScale) {\nfloat parallaxLimit=length(vViewDirCoT.xy)/vViewDirCoT.z;\nparallaxLimit*=parallaxScale;\nvec2 vOffsetDir=normalize(vViewDirCoT.xy);\nvec2 vMaxOffset=vOffsetDir*parallaxLimit;\nfloat numSamples=maxSamples+(dot(vViewDirCoT,vNormalCoT)*(minSamples-maxSamples));\nfloat stepSize=1.0/numSamples;\n\nfloat currRayHeight=1.0;\nvec2 vCurrOffset=vec2(0,0);\nvec2 vLastOffset=vec2(0,0);\nfloat lastSampledHeight=1.0;\nfloat currSampledHeight=1.0;\nfor (int i=0; i<iMaxSamples; i++)\n{\ncurrSampledHeight=texture2D(bumpSampler,vBumpUV+vCurrOffset).w;\n\nif (currSampledHeight>currRayHeight)\n{\nfloat delta1=currSampledHeight-currRayHeight;\nfloat delta2=(currRayHeight+stepSize)-lastSampledHeight;\nfloat ratio=delta1/(delta1+delta2);\nvCurrOffset=(ratio)* vLastOffset+(1.0-ratio)*vCurrOffset;\n\nbreak;\n}\nelse\n{\ncurrRayHeight-=stepSize;\nvLastOffset=vCurrOffset;\nvCurrOffset+=stepSize*vMaxOffset;\nlastSampledHeight=currSampledHeight;\n}\n}\nreturn vCurrOffset;\n}\nvec2 parallaxOffset(vec3 viewDir,float heightScale)\n{\n\nfloat height=texture2D(bumpSampler,vBumpUV).w;\nvec2 texCoordOffset=heightScale*viewDir.xy*height;\nreturn -texCoordOffset;\n}\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragmentDeclaration'] = "#ifdef CLIPPLANE\nvarying float fClipDistance;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragmentDeclaration'] = "#ifdef FOG\n#define FOGMODE_NONE 0.\n#define FOGMODE_EXP 1.\n#define FOGMODE_EXP2 2.\n#define FOGMODE_LINEAR 3.\n#define E 2.71828\nuniform vec4 vFogInfos;\nuniform vec3 vFogColor;\nvarying vec3 vFogDistance;\nfloat CalcFogFactor()\n{\nfloat fogCoeff=1.0;\nfloat fogStart=vFogInfos.y;\nfloat fogEnd=vFogInfos.z;\nfloat fogDensity=vFogInfos.w;\nfloat fogDistance=length(vFogDistance);\nif (FOGMODE_LINEAR == vFogInfos.x)\n{\nfogCoeff=(fogEnd-fogDistance)/(fogEnd-fogStart);\n}\nelse if (FOGMODE_EXP == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDensity);\n}\nelse if (FOGMODE_EXP2 == vFogInfos.x)\n{\nfogCoeff=1.0/pow(E,fogDistance*fogDistance*fogDensity*fogDensity);\n}\nreturn clamp(fogCoeff,0.0,1.0);\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['clipPlaneFragment'] = "#ifdef CLIPPLANE\nif (fClipDistance>0.0)\n{\ndiscard;\n}\n#endif";
BABYLON.Effect.IncludesShadersStore['bumpFragment'] = "vec2 uvOffset=vec2(0.0,0.0);\n#if defined(BUMP) || defined(PARALLAX)\n#ifdef NORMALXYSCALE\nfloat normalScale=1.0;\n#else \nfloat normalScale=vBumpInfos.y;\n#endif\n#if defined(TANGENT) && defined(NORMAL)\nmat3 TBN=vTBN;\n#else\nmat3 TBN=cotangent_frame(normalW*normalScale,vPositionW,vBumpUV);\n#endif\n#endif\n#ifdef PARALLAX\nmat3 invTBN=transposeMat3(TBN);\n#ifdef PARALLAXOCCLUSION\nuvOffset=parallaxOcclusion(invTBN*-viewDirectionW,invTBN*normalW,vBumpUV,vBumpInfos.z);\n#else\nuvOffset=parallaxOffset(invTBN*viewDirectionW,vBumpInfos.z);\n#endif\n#endif\n#ifdef BUMP\nnormalW=perturbNormal(TBN,vBumpUV+uvOffset);\n#endif";
BABYLON.Effect.IncludesShadersStore['lightFragment'] = "#ifdef LIGHT{X}\n#if defined(SHADOWONLY) || (defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X}) && defined(LIGHTMAPNOSPECULAR{X}))\n\n#else\n#ifdef PBR\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,roughness,NdotV,specularEnvironmentR0,specularEnvironmentR90,NdotL);\n#endif\n#else\n#ifdef SPOTLIGHT{X}\ninfo=computeSpotLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDirection,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#ifdef HEMILIGHT{X}\ninfo=computeHemisphericLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightGround,glossiness);\n#endif\n#if defined(POINTLIGHT{X}) || defined(DIRLIGHT{X})\ninfo=computeLighting(viewDirectionW,normalW,light{X}.vLightData,light{X}.vLightDiffuse.rgb,light{X}.vLightSpecular,light{X}.vLightDiffuse.a,glossiness);\n#endif\n#endif\n#endif\n#ifdef SHADOW{X}\n#ifdef SHADOWCLOSEESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithCloseESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithCloseESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else\n#ifdef SHADOWESM{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithESMCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.depthValues);\n#else\nshadow=computeShadowWithESM(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.z,light{X}.shadowsInfo.w);\n#endif\n#else \n#ifdef SHADOWPCF{X}\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowWithPCFCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadowWithPCF(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.y,light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#else\n#if defined(SHADOWCUBE{X})\nshadow=computeShadowCube(light{X}.vLightData.xyz,shadowSampler{X},light{X}.shadowsInfo.x,light{X}.depthValues);\n#else\nshadow=computeShadow(vPositionFromLight{X},vDepthMetric{X},shadowSampler{X},light{X}.shadowsInfo.x,light{X}.shadowsInfo.w);\n#endif\n#endif\n#endif\n#endif\n#ifdef SHADOWONLY\n#ifndef SHADOWINUSE\n#define SHADOWINUSE\n#endif\nglobalShadow+=shadow;\nshadowLightCount+=1.0;\n#endif\n#else\nshadow=1.;\n#endif\n#ifndef SHADOWONLY\n#ifdef CUSTOMUSERLIGHTING\ndiffuseBase+=computeCustomDiffuseLighting(info,diffuseBase,shadow);\n#ifdef SPECULARTERM\nspecularBase+=computeCustomSpecularLighting(info,specularBase,shadow);\n#endif\n#elif defined(LIGHTMAP) && defined(LIGHTMAPEXCLUDED{X})\ndiffuseBase+=lightmapColor*shadow;\n#ifdef SPECULARTERM\n#ifndef LIGHTMAPNOSPECULAR{X}\nspecularBase+=info.specular*shadow*lightmapColor;\n#endif\n#endif\n#else\ndiffuseBase+=info.diffuse*shadow;\n#ifdef SPECULARTERM\nspecularBase+=info.specular*shadow;\n#endif\n#endif\n#endif\n#endif";
BABYLON.Effect.IncludesShadersStore['logDepthFragment'] = "#ifdef LOGARITHMICDEPTH\ngl_FragDepthEXT=log2(vFragmentDepth)*logarithmicDepthConstant*0.5;\n#endif";
BABYLON.Effect.IncludesShadersStore['fogFragment'] = "#ifdef FOG\nfloat fog=CalcFogFactor();\ncolor.rgb=fog*color.rgb+(1.0-fog)*vFogColor;\n#endif";
(function() {
var EXPORTS = {};EXPORTS['PhysicsJoint'] = BABYLON['PhysicsJoint'];EXPORTS['DistanceJoint'] = BABYLON['DistanceJoint'];EXPORTS['MotorEnabledJoint'] = BABYLON['MotorEnabledJoint'];EXPORTS['HingeJoint'] = BABYLON['HingeJoint'];EXPORTS['Hinge2Joint'] = BABYLON['Hinge2Joint'];EXPORTS['PhysicsImpostor'] = BABYLON['PhysicsImpostor'];EXPORTS['PhysicsEngine'] = BABYLON['PhysicsEngine'];EXPORTS['PhysicsHelper'] = BABYLON['PhysicsHelper'];EXPORTS['PhysicsRadialExplosionEvent'] = BABYLON['PhysicsRadialExplosionEvent'];EXPORTS['PhysicsGravitationalFieldEvent'] = BABYLON['PhysicsGravitationalFieldEvent'];EXPORTS['PhysicsUpdraftEvent'] = BABYLON['PhysicsUpdraftEvent'];EXPORTS['PhysicsVortexEvent'] = BABYLON['PhysicsVortexEvent'];EXPORTS['PhysicsRadialImpulseFalloff'] = BABYLON['PhysicsRadialImpulseFalloff'];EXPORTS['PhysicsUpdraftMode'] = BABYLON['PhysicsUpdraftMode'];EXPORTS['CannonJSPlugin'] = BABYLON['CannonJSPlugin'];EXPORTS['OimoJSPlugin'] = BABYLON['OimoJSPlugin'];
    globalObject["BABYLON"] = globalObject["BABYLON"] || BABYLON;
    module.exports = EXPORTS;
    })();
}