var BABYLON;
(function (BABYLON) {
    var PhysicsImpostor = (function () {
        function PhysicsImpostor(object, type, _options, _scene) {
            var _this = this;
            if (_options === void 0) { _options = { mass: 0 }; }
            this.object = object;
            this.type = type;
            this._options = _options;
            this._scene = _scene;
            this._bodyUpdateRequired = false;
            this._onBeforePhysicsStepCallbacks = new Array();
            this._onAfterPhysicsStepCallbacks = new Array();
            this._onPhysicsCollideCallbacks = [];
            this._deltaPosition = BABYLON.Vector3.Zero();
            this._tmpPositionWithDelta = BABYLON.Vector3.Zero();
            this._tmpRotationWithDelta = new BABYLON.Quaternion();
            /**
             * this function is executed by the physics engine.
             */
            this.beforeStep = function () {
                _this.object.position.subtractToRef(_this._deltaPosition, _this._tmpPositionWithDelta);
                //conjugate deltaRotation
                if (_this._deltaRotationConjugated) {
                    _this.object.rotationQuaternion.multiplyToRef(_this._deltaRotationConjugated, _this._tmpRotationWithDelta);
                }
                else {
                    _this._tmpRotationWithDelta.copyFrom(_this.object.rotationQuaternion);
                }
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
                _this.object.position.addInPlace(_this._deltaPosition);
                if (_this._deltaRotation) {
                    _this.object.rotationQuaternion.multiplyInPlace(_this._deltaRotation);
                }
            };
            //event and body object due to cannon's event-based architecture.
            this.onCollide = function (e) {
                if (!_this._onPhysicsCollideCallbacks.length)
                    return;
                var otherImpostor = _this._physicsEngine.getImpostorWithPhysicsBody(e.body);
                if (otherImpostor) {
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
                if (!this.object.parent) {
                    this._init();
                }
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
            if (this.object.parent instanceof BABYLON.AbstractMesh) {
                var parentMesh = this.object.parent;
                return parentMesh.physicsImpostor;
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
        Object.defineProperty(PhysicsImpostor.prototype, "physicsBody", {
            /*public get mesh(): AbstractMesh {
                return this._mesh;
            }*/
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
                this.object.computeWorldMatrix && this.object.computeWorldMatrix(true);
                return this.object.getBoundingInfo().boundingBox.extendSize.scale(2).multiply(this.object.scaling);
            }
            else {
                return PhysicsImpostor.DEFAULT_OBJECT_SIZE;
            }
        };
        PhysicsImpostor.prototype.getObjectCenter = function () {
            if (this.object.getBoundingInfo) {
                return this.object.getBoundingInfo().boundingBox.center;
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
            this._physicsEngine.getPhysicsPlugin().setBodyMass(this, mass);
        };
        PhysicsImpostor.prototype.getLinearVelocity = function () {
            return this._physicsEngine.getPhysicsPlugin().getLinearVelocity(this);
        };
        /**
         * Set the body's linear velocity.
         */
        PhysicsImpostor.prototype.setLinearVelocity = function (velocity) {
            this._physicsEngine.getPhysicsPlugin().setLinearVelocity(this, velocity);
        };
        PhysicsImpostor.prototype.getAngularVelocity = function () {
            return this._physicsEngine.getPhysicsPlugin().getAngularVelocity(this);
        };
        /**
         * Set the body's linear velocity.
         */
        PhysicsImpostor.prototype.setAngularVelocity = function (velocity) {
            this._physicsEngine.getPhysicsPlugin().setAngularVelocity(this, velocity);
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
                _this._physicsEngine.removeJoint(_this, j.otherImpostor, j.joint);
            });
            //dispose the physics body
            this._physicsEngine.removeImpostor(this);
            if (this.parent) {
                this.parent.forceUpdate();
            }
            else {
            }
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
        PhysicsImpostor.DEFAULT_OBJECT_SIZE = new BABYLON.Vector3(1, 1, 1);
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
