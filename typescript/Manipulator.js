var Vector4 = BABYLON.Vector2;
var Sandbox;
(function (Sandbox) {
    var Vector3 = BABYLON.Vector3;
    var Matrix = BABYLON.Matrix;
    var Plane = BABYLON.Plane;
    var ManipulatorInteractionHelper = (function () {
        function ManipulatorInteractionHelper(scene) {
            this._scene = scene;
        }
        ManipulatorInteractionHelper.prototype.hasManipulatedMode = function (value) {
            return (this._manipulatedMode & value) !== 0;
        };
        ManipulatorInteractionHelper.prototype.hasManFlags = function (value) {
            return (this._flags & value) !== 0;
        };
        ManipulatorInteractionHelper.ComputeRayHit = function (ray, distance) {
            return ray.origin.add(ray.direction.multiplyByFloats(distance, distance, distance));
        };
        ManipulatorInteractionHelper.prototype.doPos = function (mouse) {
            var v = Vector3.Zero();
            var ray = this._scene.createPickingRay(mouse.x, mouse.y, Matrix.Identity(), this._scene.activeCamera);
            if (this.hasManipulatedMode(16 /* PlaneSelectionXY */ | 32 /* PlaneSelectionXZ */ | 64 /* PlaneSelectionYZ */)) {
                var pl0;
                var hit;
                if (this.hasManipulatedMode(16 /* PlaneSelectionXY */)) {
                    pl0 = Plane.FromPoints(this._pos, this._pos.add(this._right), this._pos.add(this._up));
                }
                else if (this.hasManipulatedMode(32 /* PlaneSelectionXZ */)) {
                    pl0 = Plane.FromPoints(this._pos, this._pos.add(this._right), this._pos.add(this._view));
                }
                else if (this.hasManipulatedMode(64 /* PlaneSelectionYZ */)) {
                    pl0 = Plane.FromPoints(this._pos, this._pos.add(this._up), this._pos.add(this._view));
                }
                else {
                }
                var clip = 0.06;
                //Check if the plane is too parallel to the ray
                if (Math.abs(Vector3.Dot(pl0.normal, ray.direction)) < clip) {
                    return;
                }
                //Make the intersection
                var distance = ray.intersectsPlane(pl0);
                hit = ManipulatorInteractionHelper.ComputeRayHit(ray, distance);
                //Check if it's the first call
                if (this.hasManFlags(2 /* FirstHit */)) {
                    this._flags &= ~2 /* FirstHit */;
                    this._prevHit = hit;
                    return;
                }
                //Compute the vector
                v = hit.subtract(this._prevHit);
            }
            else if ((this._manipulatedMode & (1 /* ArrowX */ | 2 /* ArrowY */ | 4 /* ArrowZ */)) != 0) {
                var pl0, pl1;
                var hit;
                var s;
                if (this.hasManFlags(2 /* FirstHit */)) {
                    var res = this.setupIntersectionPlanes(this._manipulatedMode);
                    pl0 = res.p0;
                    pl1 = res.p1;
                    if (Math.abs(Vector3.Dot(pl0.normal, ray.direction)) > Math.abs(Vector3.Dot(pl1.normal, ray.direction))) {
                        var distance = ray.intersectsPlane(pl0);
                        hit = ManipulatorInteractionHelper.ComputeRayHit(ray, distance);
                        this._flags &= ~3 /* Plane2 */;
                    }
                    else {
                        var distance = ray.intersectsPlane(pl1);
                        hit = ManipulatorInteractionHelper.ComputeRayHit(ray, distance);
                        this._flags |= 3 /* Plane2 */;
                    }
                    this._flags &= ~2 /* FirstHit */;
                    this._prevHit = hit;
                    return;
                }
                else {
                    var axis;
                    var res = this.setupIntersectionPlane(this._manipulatedMode, this.hasManFlags(3 /* Plane2 */));
                    pl0 = res.plane;
                    axis = res.axis;
                    var distance = ray.intersectsPlane(pl0);
                    hit = ManipulatorInteractionHelper.ComputeRayHit(ray, distance);
                    v = hit.subtract(this._prevHit);
                    s = Vector3.Dot(axis, v);
                    v = axis.multiplyByFloats(s, s, s);
                }
            }
            if (this.translationStep !== 0.0) {
                v.x -= v.x % this.translationStep;
                v.y -= v.y % this.translationStep;
                v.z -= v.z % this.translationStep;
            }
            var mtx = this._firstTransform;
            mtx.setTranslation(mtx.getTranslation().add(v));
            this._pos = mtx.getTranslation();
            //TODO
            //this._manipulatedObject.SetSmartPropertyValue(this._manipulatedTransform, mtx);
        };
        ManipulatorInteractionHelper.prototype.setupIntersectionPlane = function (mode, plane2) {
            var res = this.setupIntersectionPlanes(mode);
            var pl = plane2 ? res.p1 : res.p0;
            var axis;
            switch (mode) {
                case 1 /* ArrowX */:
                    axis = this._right;
                    break;
                case 2 /* ArrowY */:
                    axis = this._up;
                    break;
                case 4 /* ArrowZ */:
                    axis = this._view;
                    break;
                default:
                    axis = Vector3.Zero();
                    break;
            }
            return { plane: pl, axis: axis };
        };
        ManipulatorInteractionHelper.prototype.setupIntersectionPlanes = function (mode) {
            var p0, p1;
            switch (mode) {
                case 1 /* ArrowX */:
                    p0 = Plane.FromPoints(this._pos, this._pos.add(this._view), this._pos.add(this._right));
                    p1 = Plane.FromPoints(this._pos, this._pos.add(this._right), this._pos.add(this._up));
                    break;
                case 2 /* ArrowY */:
                    p0 = Plane.FromPoints(this._pos, this._pos.add(this._up), this._pos.add(this._right));
                    p1 = Plane.FromPoints(this._pos, this._pos.add(this._up), this._pos.add(this._view));
                    break;
                case 4 /* ArrowZ */:
                    p0 = Plane.FromPoints(this._pos, this._pos.add(this._view), this._pos.add(this._right));
                    p1 = Plane.FromPoints(this._pos, this._pos.add(this._view), this._pos.add(this._up));
                    break;
            }
            return { p0: p0, p1: p1 };
        };
        ManipulatorInteractionHelper.prototype.attachManipulatedNode = function (node) {
        };
        ManipulatorInteractionHelper.prototype.detachManipulatedNode = function (node) {
        };
        return ManipulatorInteractionHelper;
    }());
    Sandbox.ManipulatorInteractionHelper = ManipulatorInteractionHelper;
})(Sandbox || (Sandbox = {}));
//# sourceMappingURL=Manipulator.js.map