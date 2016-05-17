var Vector4 = BABYLON.Vector2;
var Sandbox;
(function (Sandbox) {
    var Vector2 = BABYLON.Vector2;
    var Vector3 = BABYLON.Vector3;
    var Matrix = BABYLON.Matrix;
    var Plane = BABYLON.Plane;
    var AbstractMesh = BABYLON.AbstractMesh;
    var Quaternion = BABYLON.Quaternion;
    var PointerEventTypes = BABYLON.PointerEventTypes;
    /**
     * This class is used to manipulated a single node.
     * Right now only node of type AbstractMesh is support.
     * In the future, manipulation on multiple selection could be possible.
     *
     * A manipulation start when left clicking and moving the mouse. It can be cancelled if the right mouse button is clicked before releasing the left one (this feature is only possible if noPreventContextMenu is false).
     * Per default translation is peformed when manipulating the arrow (axis or cone) or the plane anchor. If you press the shift key it will switch to rotation manipulation. The Shift key can be toggle while manipulating, the current manipulation is accept and a new one starts.
     *
     * You can set the rotation/translationStep (in radian) to enable snapping.
     *
     * The current implementation of this class creates a radix with all the features selected.
     */
    var ManipulatorInteractionHelper = (function () {
        function ManipulatorInteractionHelper(scene) {
            var _this = this;
            this.noPreventContextMenu = false;
            this._flags = 0;
            this._rotationFactor = 1;
            this._scene = scene;
            this._radix = new Sandbox.Radix(scene);
            this._shiftKeyState = false;
            this._scene.onBeforeRenderObservable.add(function (e, s) { return _this.onBeforeRender(e, s); });
            this._scene.onPointerObservable.add(function (e, s) { return _this.onPointer(e, s); }, -1, true);
            window.oncontextmenu = function (ev) {
                if (!_this.noPreventContextMenu) {
                    ev.preventDefault();
                }
            };
        }
        /**
         * Attach a node to manipulate. Right now, only manipulation on a single node is supported, but this api will allow manipulation on a multiple selection in the future.
         * @param node
         */
        ManipulatorInteractionHelper.prototype.attachManipulatedNode = function (node) {
            this._manipulatedNode = node;
            this._radix.show();
        };
        /**
         * Detach the node to manipulate. Right now, only manipulation on a single node is supported, but this api will allow manipulation on a multiple selection in the future.
         */
        ManipulatorInteractionHelper.prototype.detachManipulatedNode = function (node) {
            this._manipulatedNode = null;
            this._radix.hide();
        };
        ManipulatorInteractionHelper.prototype.onBeforeRender = function (scene, state) {
            this.renderManipulator();
        };
        ManipulatorInteractionHelper.prototype.onPointer = function (e, state) {
            if (!this._manipulatedNode) {
                return;
            }
            var rayPos = this.getRayPosition(e.event);
            var shiftKeyState = e.event.shiftKey;
            // Detect Modifier Key changes for shift while manipulating: commit and start a new manipulation
            if (this.hasManFlags(1 /* DragMode */) && shiftKeyState !== this._shiftKeyState) {
                this.beginDrag(rayPos, e.event);
            }
            // Mouse move
            if (e.type === PointerEventTypes.POINTERMOVE) {
                // Right button release while left is down => cancel the manipulation. only processed when the context menu is not showed during manipulation
                if (!this.noPreventContextMenu && e.event.button === 2 && e.event.buttons === 1) {
                    this.setManipulatedNodeWorldMatrix(this._firstTransform);
                    this.setManFlags(8 /* Exiting */);
                }
                else if (this.hasManFlags(1 /* DragMode */) && !this.hasManFlags(8 /* Exiting */)) {
                    state.skipNextObservers = true;
                    if (shiftKeyState || this.hasManipulatedMode(1792 /* Rotations */)) {
                        this.doRot(rayPos);
                    }
                    else {
                        this.doPos(rayPos);
                    }
                }
                else {
                    this._radix.highlighted = this._radix.intersect(rayPos);
                }
            }
            else if (e.type === PointerEventTypes.POINTERDOWN && e.event.button === 0) {
                this._manipulatedMode = this._radix.intersect(rayPos);
                if (this._manipulatedMode !== 0 /* None */) {
                    state.skipNextObservers = true;
                    this.beginDrag(rayPos, e.event);
                    if (this.hasManipulatedMode(1792 /* Rotations */)) {
                        this.doRot(rayPos);
                    }
                    else {
                        this.doPos(rayPos);
                    }
                }
            }
            else if (e.type === PointerEventTypes.POINTERUP) {
                if (this.hasManFlags(1 /* DragMode */)) {
                    state.skipNextObservers = true;
                }
                this._radix.highlighted = this._radix.intersect(rayPos);
                // Left up: end manipulation
                if (e.event.button === 0) {
                    this.endDragMode();
                }
            }
        };
        ManipulatorInteractionHelper.prototype.beginDrag = function (rayPos, event) {
            this._firstMousePos = rayPos;
            this._prevMousePos = this._firstMousePos.clone();
            this._shiftKeyState = event.shiftKey;
            var mtx = this.getManipulatedNodeWorldMatrix();
            this._pos = mtx.getTranslation();
            this._right = mtx.getRow(0).toVector3();
            this._up = mtx.getRow(1).toVector3();
            this._view = mtx.getRow(2).toVector3();
            this._oldPos = this._pos.clone();
            this._firstTransform = mtx.clone();
            this._flags |= 2 /* FirstHit */ | 1 /* DragMode */;
        };
        ManipulatorInteractionHelper.prototype.endDragMode = function () {
            this.clearManFlags(1 /* DragMode */ | 8 /* Exiting */);
        };
        ManipulatorInteractionHelper.prototype.doRot = function (rayPos) {
            if (this.hasManFlags(2 /* FirstHit */)) {
                this.clearManFlags(2 /* FirstHit */);
                return;
            }
            var dx = rayPos.x - this._prevMousePos.x;
            var dy = rayPos.y - this._prevMousePos.y;
            var cr = this._scene.getEngine().getRenderingCanvasClientRect();
            var ax = (dx / cr.width) * Math.PI * 2 * this._rotationFactor;
            var ay = (dy / cr.height) * Math.PI * 2 * this._rotationFactor;
            if (this.rotationStep) {
                var rem = ax % this.rotationStep;
                ax -= rem;
                rem = ay % this.rotationStep;
                ay -= rem;
            }
            var mtx = Matrix.Identity();
            if (this.hasManipulatedMode(1 /* ArrowX */ | 256 /* RotationX */)) {
                mtx = Matrix.RotationX(ay);
            }
            else if (this.hasManipulatedMode(2 /* ArrowY */ | 512 /* RotationY */)) {
                mtx = Matrix.RotationY(ay);
            }
            else if (this.hasManipulatedMode(4 /* ArrowZ */ | 1024 /* RotationZ */)) {
                mtx = Matrix.RotationZ(ay);
            }
            else {
                if (this.hasManipulatedMode(/*RadixFeatures.CenterSquare |*/ 16 /* PlaneSelectionXY */ | 32 /* PlaneSelectionXZ */)) {
                    mtx = mtx.multiply(Matrix.RotationX(ay));
                }
                if (this.hasManipulatedMode(16 /* PlaneSelectionXY */ | 64 /* PlaneSelectionYZ */)) {
                    mtx = mtx.multiply(Matrix.RotationY(ax));
                }
                if (this.hasManipulatedMode(32 /* PlaneSelectionXZ */)) {
                    mtx = mtx.multiply(Matrix.RotationZ(ay));
                }
                if (this.hasManipulatedMode(/*RadixFeatures.CenterSquare |*/ 32 /* PlaneSelectionXZ */)) {
                    mtx = mtx.multiply(Matrix.RotationZ(ax));
                }
            }
            var tmtx = mtx.multiply(this._firstTransform);
            this.setManipulatedNodeWorldMatrix(tmtx);
        };
        ManipulatorInteractionHelper.prototype.doPos = function (rayPos) {
            var v = Vector3.Zero();
            var ray = this._scene.createPickingRay(rayPos.x, rayPos.y, Matrix.Identity(), this._scene.activeCamera);
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
            else if ((this._manipulatedMode & (1 /* ArrowX */ | 2 /* ArrowY */ | 4 /* ArrowZ */)) !== 0) {
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
                        var number = ~4 /* Plane2 */;
                        this._flags &= number;
                    }
                    else {
                        var distance = ray.intersectsPlane(pl1);
                        hit = ManipulatorInteractionHelper.ComputeRayHit(ray, distance);
                        this._flags |= 4 /* Plane2 */;
                    }
                    this._flags &= ~2 /* FirstHit */;
                    this._prevHit = hit;
                    return;
                }
                else {
                    var axis;
                    var res = this.setupIntersectionPlane(this._manipulatedMode, this.hasManFlags(4 /* Plane2 */));
                    pl0 = res.plane;
                    axis = res.axis;
                    var distance = ray.intersectsPlane(pl0);
                    hit = ManipulatorInteractionHelper.ComputeRayHit(ray, distance);
                    v = hit.subtract(this._prevHit);
                    s = Vector3.Dot(axis, v);
                    v = axis.multiplyByFloats(s, s, s);
                }
            }
            if (this.translationStep) {
                v.x -= v.x % this.translationStep;
                v.y -= v.y % this.translationStep;
                v.z -= v.z % this.translationStep;
            }
            var mtx = this._firstTransform.clone();
            mtx.setTranslation(mtx.getTranslation().add(v));
            this._pos = mtx.getTranslation();
            this.setManipulatedNodeWorldMatrix(mtx);
        };
        ManipulatorInteractionHelper.prototype.hasManipulatedMode = function (value) {
            return (this._manipulatedMode & value) !== 0;
        };
        ManipulatorInteractionHelper.prototype.hasManFlags = function (value) {
            return (this._flags & value) !== 0;
        };
        ManipulatorInteractionHelper.prototype.clearManFlags = function (values) {
            this._flags &= ~values;
            return this._flags;
        };
        ManipulatorInteractionHelper.prototype.setManFlags = function (values) {
            this._flags |= values;
            return this._flags;
        };
        ManipulatorInteractionHelper.ComputeRayHit = function (ray, distance) {
            return ray.origin.add(ray.direction.multiplyByFloats(distance, distance, distance));
        };
        ManipulatorInteractionHelper.prototype.setManipulatedNodeWorldMatrix = function (mtx) {
            if (!this._manipulatedNode) {
                return null;
            }
            if (this._manipulatedNode instanceof AbstractMesh) {
                var mesh = this._manipulatedNode;
                if (mesh.parent) {
                    mtx = mtx.multiply(mesh.parent.getWorldMatrix().clone().invert());
                }
                var pos = Vector3.Zero();
                var scale = Vector3.Zero();
                var rot = new Quaternion();
                mtx.decompose(scale, rot, pos);
                mesh.position = pos;
                mesh.rotationQuaternion = rot;
                mesh.scaling = scale;
            }
        };
        ManipulatorInteractionHelper.prototype.getManipulatedNodeWorldMatrix = function () {
            if (!this._manipulatedNode) {
                return null;
            }
            if (this._manipulatedNode instanceof AbstractMesh) {
                return this._manipulatedNode.getWorldMatrix();
            }
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
        ManipulatorInteractionHelper.prototype.getRayPosition = function (event) {
            var canvasRect = this._scene.getEngine().getRenderingCanvasClientRect();
            var x = event.clientX - canvasRect.left;
            var y = event.clientY - canvasRect.top;
            return new Vector2(x, y);
        };
        ManipulatorInteractionHelper.prototype.renderManipulator = function () {
            if (!this._manipulatedNode) {
                return;
            }
            if (this._manipulatedNode instanceof AbstractMesh) {
                var mesh = this._manipulatedNode;
                var worldMtx = mesh.getWorldMatrix();
                var l = Vector3.Distance(this._scene.activeCamera.position, worldMtx.getTranslation());
                var vpWidth = this._scene.getEngine().getRenderWidth();
                var s = this.fromScreenToWorld(vpWidth / 100, l) * 20;
                var scale = Vector3.Zero();
                var position = Vector3.Zero();
                var rotation = Quaternion.Identity();
                var res = Matrix.Scaling(s, s, s).multiply(worldMtx);
                res.decompose(scale, rotation, position);
                this._radix.setWorld(position, rotation, scale);
            }
        };
        ManipulatorInteractionHelper.prototype.fromScreenToWorld = function (l, z) {
            var camera = this._scene.activeCamera;
            var r0 = this._scene.createPickingRay(0, 0, Matrix.Identity(), camera, true);
            var r1 = this._scene.createPickingRay(l, 0, Matrix.Identity(), camera, true);
            var p0 = ManipulatorInteractionHelper.evalPosition(r0, z);
            var p1 = ManipulatorInteractionHelper.evalPosition(r1, z);
            return p1.x - p0.x;
        };
        ManipulatorInteractionHelper.evalPosition = function (ray, u) {
            return ray.origin.add(ray.direction.multiplyByFloats(u, u, u));
        };
        return ManipulatorInteractionHelper;
    }());
    Sandbox.ManipulatorInteractionHelper = ManipulatorInteractionHelper;
})(Sandbox || (Sandbox = {}));
//# sourceMappingURL=ManipulatorInteractionHelper.js.map