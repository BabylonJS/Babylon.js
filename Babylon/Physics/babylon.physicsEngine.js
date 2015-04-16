var BABYLON;
(function (BABYLON) {
    var PhysicsEngine = (function () {
        function PhysicsEngine(plugin) {
            this._currentPlugin = plugin || new BABYLON.OimoJSPlugin();
        }
        PhysicsEngine.prototype._initialize = function (gravity) {
            this._currentPlugin.initialize();
            this._setGravity(gravity);
        };
        PhysicsEngine.prototype._runOneStep = function (delta) {
            if (delta > 0.1) {
                delta = 0.1;
            }
            else if (delta <= 0) {
                delta = 1.0 / 60.0;
            }
            this._currentPlugin.runOneStep(delta);
        };
        PhysicsEngine.prototype._setGravity = function (gravity) {
            this.gravity = gravity || new BABYLON.Vector3(0, -9.82, 0);
            this._currentPlugin.setGravity(this.gravity);
        };
        PhysicsEngine.prototype._registerMesh = function (mesh, impostor, options) {
            return this._currentPlugin.registerMesh(mesh, impostor, options);
        };
        PhysicsEngine.prototype._registerMeshesAsCompound = function (parts, options) {
            return this._currentPlugin.registerMeshesAsCompound(parts, options);
        };
        PhysicsEngine.prototype._unregisterMesh = function (mesh) {
            this._currentPlugin.unregisterMesh(mesh);
        };
        PhysicsEngine.prototype._applyImpulse = function (mesh, force, contactPoint) {
            this._currentPlugin.applyImpulse(mesh, force, contactPoint);
        };
        PhysicsEngine.prototype._createLink = function (mesh1, mesh2, pivot1, pivot2, options) {
            return this._currentPlugin.createLink(mesh1, mesh2, pivot1, pivot2, options);
        };
        PhysicsEngine.prototype._updateBodyPosition = function (mesh) {
            this._currentPlugin.updateBodyPosition(mesh);
        };
        PhysicsEngine.prototype.dispose = function () {
            this._currentPlugin.dispose();
        };
        PhysicsEngine.prototype.isSupported = function () {
            return this._currentPlugin.isSupported();
        };
        // Statics
        PhysicsEngine.NoImpostor = 0;
        PhysicsEngine.SphereImpostor = 1;
        PhysicsEngine.BoxImpostor = 2;
        PhysicsEngine.PlaneImpostor = 3;
        PhysicsEngine.MeshImpostor = 4;
        PhysicsEngine.CapsuleImpostor = 5;
        PhysicsEngine.ConeImpostor = 6;
        PhysicsEngine.CylinderImpostor = 7;
        PhysicsEngine.ConvexHullImpostor = 8;
        PhysicsEngine.Epsilon = 0.001;
        return PhysicsEngine;
    })();
    BABYLON.PhysicsEngine = PhysicsEngine;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.physicsEngine.js.map