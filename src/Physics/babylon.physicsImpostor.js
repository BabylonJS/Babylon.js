var BABYLON;
(function (BABYLON) {
    var PhysicsImpostor = (function () {
        function PhysicsImpostor(_mesh, type, _options) {
            var _this = this;
            if (_options === void 0) { _options = { mass: 0 }; }
            this._mesh = _mesh;
            this.type = type;
            this._options = _options;
            this._bodyUpdateRequired = false;
            this._onBeforePhysicsStepCallbacks = new Array();
            this._onAfterPhysicsStepCallbacks = new Array();
            this._onPhysicsCollideCallbacks = [];
            this._deltaPosition = BABYLON.Vector3.Zero();
            this._deltaRotation = new BABYLON.Quaternion();
            this._tmpPositionWithDelta = BABYLON.Vector3.Zero();
            this._tmpRotationWithDelta = new BABYLON.Quaternion();
            /**
             * this function is executed by the physics engine.
             */
            this.beforeStep = function () {
                _this.mesh.position.subtractToRef(_this._deltaPosition, _this._tmpPositionWithDelta);
                //conjugate deltaRotation
                _this._tmpRotationWithDelta.copyFrom(_this._deltaRotation);
                _this._tmpRotationWithDelta.multiplyInPlace(_this.mesh.rotationQuaternion);
                _this._physicsEngine.getPhysicsPlugin().setPhysicsBodyTransformation(_this, _this._tmpPositionWithDelta, _this._tmpRotationWithDelta);
                _this._onBeforePhysicsStepCallbacks.forEach(function (func) {
                    func(_this);
                });
            };
            /**
             * this function is executed by the physics engine.
             */
            this.afterStep = function () {
                _this._onAfterPhysicsStepCallbacks.forEach(function (func) {
                    func(_this);
                });
                _this._physicsEngine.getPhysicsPlugin().setTransformationFromPhysicsBody(_this);
                _this.mesh.position.addInPlace(_this._deltaPosition);
                _this.mesh.rotationQuaternion.multiplyInPlace(_this._deltaRotation);
            };
            //event and body object due to cannon's event-based architecture.
            this.onCollide = function (e) {
                var otherImpostor = _this._physicsEngine.getImpostorWithPhysicsBody(e.body);
                if (otherImpostor) {
                    _this._onPhysicsCollideCallbacks.filter(function (obj) {
                        return obj.otherImpostors.indexOf(otherImpostor) !== -1;
                    }).forEach(function (obj) {
                        obj.callback(_this, otherImpostor);
                    });
                }
            };
            //default options params
            this._options.mass = (_options.mass === void 0) ? 0 : _options.mass;
            this._options.friction = (_options.friction === void 0) ? 0.2 : _options.friction;
            this._options.restitution = (_options.restitution === void 0) ? 0.2 : _options.restitution;
            this._physicsEngine = this._mesh.getScene().getPhysicsEngine();
            this._joints = [];
            //If the mesh has a parent, don't initialize the physicsBody. Instead wait for the parent to do that.
            if (!this._mesh.parent) {
                this._init();
            }
        }
        /**
         * This function will completly initialize this impostor.
         * It will create a new body - but only if this mesh has no parent.
         * If it has, this impostor will not be used other than to define the impostor
         * of the child mesh.
         */
        PhysicsImpostor.prototype._init = function () {
            this._physicsEngine.removeImpostor(this);
            this.physicsBody = null;
            this._parent = this._parent || this._getPhysicsParent();
            if (!this.parent) {
                this._physicsEngine.addImpostor(this);
            }
        };
        PhysicsImpostor.prototype._getPhysicsParent = function () {
            if (this.mesh.parent instanceof BABYLON.AbstractMesh) {
                var parentMesh = this.mesh.parent;
                return parentMesh.getPhysicsImpostor();
            }
            return;
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
            if (this.parent) {
                this.parent.forceUpdate();
            }
        };
        Object.defineProperty(PhysicsImpostor.prototype, "mesh", {
            get: function () {
                return this._mesh;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PhysicsImpostor.prototype, "physicsBody", {
            /**
             * Gets the body that holds this impostor. Either its own, or its parent.
             */
            get: function () {
                return this._parent ? this._parent.physicsBody : this._physicsBody;
            },
            /**
             * Set the physics body. Used mainly by the physics engine/plugin
             */
            set: function (physicsBody) {
                if (this._physicsBody) {
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
                return this._parent;
            },
            enumerable: true,
            configurable: true
        });
        PhysicsImpostor.prototype.resetUpdateFlags = function () {
            this._bodyUpdateRequired = false;
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
         * Set the body's velocity.
         */
        PhysicsImpostor.prototype.setVelocity = function (velocity) {
            this._physicsEngine.getPhysicsPlugin().setVelocity(this, velocity);
        };
        /**
         * Execute a function with the physics plugin native code.
         * Provide a function the will have two variables - the world object and the physics body object.
         */
        PhysicsImpostor.prototype.executeNativeFunction = function (func) {
            func(this._physicsEngine.getPhysicsPlugin().world, this.physicsBody);
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
        /**
         * Apply a force
         */
        PhysicsImpostor.prototype.applyForce = function (force, contactPoint) {
            this._physicsEngine.getPhysicsPlugin().applyForce(this, force, contactPoint);
        };
        /**
         * Apply an impulse
         */
        PhysicsImpostor.prototype.applyImpulse = function (force, contactPoint) {
            this._physicsEngine.getPhysicsPlugin().applyImpulse(this, force, contactPoint);
        };
        /**
         * A help function to create a joint.
         */
        PhysicsImpostor.prototype.createJoint = function (otherImpostor, jointType, jointData) {
            var joint = new BABYLON.PhysicsJoint(jointType, jointData);
            this.addJoint(otherImpostor, joint);
        };
        /**
         * Add a joint to this impostor with a different impostor.
         */
        PhysicsImpostor.prototype.addJoint = function (otherImpostor, joint) {
            this._joints.push({
                otherImpostor: otherImpostor,
                joint: joint
            });
            this._physicsEngine.addJoint(this, otherImpostor, joint);
        };
        /**
         * Will keep this body still, in a sleep mode.
         */
        PhysicsImpostor.prototype.sleep = function () {
            this._physicsEngine.getPhysicsPlugin().sleepBody(this);
        };
        /**
         * Wake the body up.
         */
        PhysicsImpostor.prototype.wakeUp = function () {
            this._physicsEngine.getPhysicsPlugin().wakeUpBody(this);
        };
        PhysicsImpostor.prototype.dispose = function (disposeChildren) {
            if (disposeChildren === void 0) { disposeChildren = true; }
            this.physicsBody = null;
            if (this.parent) {
                this.parent.forceUpdate();
            }
            else {
                this.mesh.getChildMeshes().forEach(function (mesh) {
                    if (mesh.physicsImpostor) {
                        if (disposeChildren) {
                            mesh.physicsImpostor.dispose();
                            mesh.physicsImpostor = null;
                        }
                    }
                });
            }
        };
        PhysicsImpostor.prototype.setDeltaPosition = function (position) {
            this._deltaPosition.copyFrom(position);
        };
        PhysicsImpostor.prototype.setDeltaRotation = function (rotation) {
            this._deltaRotation.copyFrom(rotation);
        };
        //Impostor types
        PhysicsImpostor.NoImpostor = 0;
        PhysicsImpostor.SphereImpostor = 1;
        PhysicsImpostor.BoxImpostor = 2;
        PhysicsImpostor.PlaneImpostor = 3;
        PhysicsImpostor.MeshImpostor = 4;
        PhysicsImpostor.CapsuleImpostor = 5;
        PhysicsImpostor.ConeImpostor = 6;
        PhysicsImpostor.CylinderImpostor = 7;
        PhysicsImpostor.ConvexHullImpostor = 8;
        PhysicsImpostor.HeightmapImpostor = 9;
        return PhysicsImpostor;
    })();
    BABYLON.PhysicsImpostor = PhysicsImpostor;
})(BABYLON || (BABYLON = {}));
