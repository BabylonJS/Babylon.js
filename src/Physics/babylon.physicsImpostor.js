var BABYLON;
(function (BABYLON) {
    var PhysicsImpostor = (function () {
        function PhysicsImpostor(_mesh, type, _options) {
            var _this = this;
            this._mesh = _mesh;
            this.type = type;
            this._options = _options;
            this._transformationUpdated = false;
            this._bodyUpdateRequired = false;
            this._onBeforePhysicsStepCallbacks = new Array();
            this._onAfterPhysicsStepCallbacks = new Array();
            this._onPhysicsCollideCallbacks = new Array();
            this._deltaPosition = BABYLON.Vector3.Zero();
            this._deltaRotation = new BABYLON.Quaternion();
            this._tmpPositionWithDelta = BABYLON.Vector3.Zero();
            this._tmpRotationWithDelta = new BABYLON.Quaternion();
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
            this.afterStep = function () {
                _this._onAfterPhysicsStepCallbacks.forEach(function (func) {
                    func(_this);
                });
                _this._physicsEngine.getPhysicsPlugin().setTransformationFromPhysicsBody(_this);
                _this.mesh.position.addInPlace(_this._deltaPosition);
                _this.mesh.rotationQuaternion.multiplyInPlace(_this._deltaRotation);
            };
            //event object due to cannon's architecture.
            this.onCollide = function (e) {
                var otherImpostor = _this._physicsEngine.getImpostorWithPhysicsBody(e.body);
                if (otherImpostor) {
                    _this._onPhysicsCollideCallbacks.forEach(function (func) {
                        func(_this, otherImpostor);
                    });
                }
            };
            //default options params
            _options.mass = (_options.mass === void 0) ? 0 : _options.mass;
            _options.friction = (_options.friction === void 0) ? 0.2 : _options.friction;
            _options.restitution = (_options.restitution === void 0) ? 0.2 : _options.restitution;
            this._physicsEngine = this._mesh.getScene().getPhysicsEngine();
            this._joints = [];
            this._init();
        }
        PhysicsImpostor.prototype._init = function () {
            this._physicsEngine.removeImpostor(this);
            this._parent = this._parent || this._getPhysicsParent();
            if (!this.parent) {
                this._physicsEngine.addImpostor(this);
                this._bodyUpdateRequired = true;
            }
        };
        PhysicsImpostor.prototype._getPhysicsParent = function () {
            if (this.mesh.parent instanceof BABYLON.AbstractMesh) {
                var parentMesh = this.mesh.parent;
                return parentMesh.getPhysicsImpostor();
            }
            return;
        };
        PhysicsImpostor.prototype.isBodyInitRequired = function () {
            return this._bodyUpdateRequired || (!this._physicsBody && !this._parent);
        };
        PhysicsImpostor.prototype.isUpdateRequired = function () {
            return this._transformationUpdated || this.isBodyInitRequired();
        };
        PhysicsImpostor.prototype.transformationUpdated = function () {
            this._transformationUpdated = true;
            if (this._parent) {
                this._parent.transformationUpdated();
            }
        };
        PhysicsImpostor.prototype.setScalingUpdated = function (updated) {
            this.forceUpdate();
        };
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
            get: function () {
                return this._physicsBody;
            },
            set: function (physicsBody) {
                if (this._physicsBody) {
                    this._physicsEngine.getPhysicsPlugin().removePhysicsBody(this._physicsBody);
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
            this._transformationUpdated = false;
            this._bodyUpdateRequired = false;
        };
        PhysicsImpostor.prototype.getOptions = function () {
            return this._options;
        };
        PhysicsImpostor.prototype.getParam = function (paramName) {
            return this._options[paramName];
        };
        PhysicsImpostor.prototype.setParam = function (paramName, value) {
            this._options[paramName] = value;
            this._bodyUpdateRequired = true;
        };
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
        PhysicsImpostor.prototype.registerOnPhysicsCollide = function (func) {
            this._onPhysicsCollideCallbacks.push(func);
        };
        PhysicsImpostor.prototype.unregisterOnPhysicsCollide = function (func) {
            var index = this._onPhysicsCollideCallbacks.indexOf(func);
            if (index > -1) {
                this._onPhysicsCollideCallbacks.splice(index, 1);
            }
            else {
                BABYLON.Tools.Warn("Function to remove was not found");
            }
        };
        PhysicsImpostor.prototype.applyForce = function (force, contactPoint) {
            this._physicsEngine.getPhysicsPlugin().applyForce(this, force, contactPoint);
        };
        PhysicsImpostor.prototype.applyImpulse = function (force, contactPoint) {
            this._physicsEngine.getPhysicsPlugin().applyImpulse(this, force, contactPoint);
        };
        PhysicsImpostor.prototype.createJoint = function (otherImpostor, jointType, jointData) {
            var joint = new BABYLON.PhysicsJoint(jointType, jointData);
            this.addJoint(otherImpostor, joint);
        };
        PhysicsImpostor.prototype.addJoint = function (otherImpostor, joint) {
            this._joints.push({
                otherImpostor: otherImpostor,
                joint: joint
            });
            this._physicsEngine.addJoint(this, otherImpostor, joint);
        };
        //TODO
        PhysicsImpostor.prototype.dispose = function (disposeChildren) {
            if (disposeChildren === void 0) { disposeChildren = true; }
            this.physicsBody = null;
            if (this.parent) {
                this.parent.forceUpdate();
            }
            else {
                this.mesh.getChildMeshes().forEach(function (mesh) {
                    if (mesh.physicImpostor) {
                        if (disposeChildren) {
                            mesh.physicImpostor.dispose();
                            mesh.physicImpostor = null;
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
    }());
    BABYLON.PhysicsImpostor = PhysicsImpostor;
})(BABYLON || (BABYLON = {}));
