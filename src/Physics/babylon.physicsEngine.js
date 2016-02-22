var BABYLON;
(function (BABYLON) {
    var PhysicsEngine = (function () {
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
        }
        PhysicsEngine.prototype.setGravity = function (gravity) {
            this.gravity = gravity;
            this._physicsPlugin.setGravity(this.gravity);
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
        PhysicsEngine.prototype.addImpostor = function (impostor) {
            this._impostors.push(impostor);
            //if no parent, generate the body
            if (!impostor.parent) {
                this._physicsPlugin.generatePhysicsBody(impostor);
            }
        };
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
        PhysicsEngine.prototype.addJoint = function (mainImpostor, connectedImpostor, joint) {
            var impostorJoint = {
                mainImpostor: mainImpostor,
                connectedImpostor: connectedImpostor,
                joint: joint
            };
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
        PhysicsEngine.prototype.getImpostorWithPhysicsBody = function (body) {
            for (var i = 0; i < this._impostors.length; ++i) {
                if (this._impostors[i].physicsBody === body) {
                    return this._impostors[i];
                }
            }
        };
        // Statics, Legacy support.
        /**
         * @Deprecated
         *
         */
        PhysicsEngine.NoImpostor = BABYLON.PhysicsImpostor.NoImpostor;
        PhysicsEngine.SphereImpostor = BABYLON.PhysicsImpostor.SphereImpostor;
        PhysicsEngine.BoxImpostor = BABYLON.PhysicsImpostor.BoxImpostor;
        PhysicsEngine.PlaneImpostor = BABYLON.PhysicsImpostor.PlaneImpostor;
        PhysicsEngine.MeshImpostor = BABYLON.PhysicsImpostor.MeshImpostor;
        PhysicsEngine.CapsuleImpostor = BABYLON.PhysicsImpostor.CapsuleImpostor;
        PhysicsEngine.ConeImpostor = BABYLON.PhysicsImpostor.ConeImpostor;
        PhysicsEngine.CylinderImpostor = BABYLON.PhysicsImpostor.CylinderImpostor;
        PhysicsEngine.ConvexHullImpostor = BABYLON.PhysicsImpostor.ConvexHullImpostor;
        PhysicsEngine.HeightmapImpostor = BABYLON.PhysicsImpostor.HeightmapImpostor;
        PhysicsEngine.Epsilon = 0.001;
        return PhysicsEngine;
    }());
    BABYLON.PhysicsEngine = PhysicsEngine;
})(BABYLON || (BABYLON = {}));
