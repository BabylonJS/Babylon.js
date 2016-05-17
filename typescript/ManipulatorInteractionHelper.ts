import Vector4 = BABYLON.Vector2;

module Sandbox {
    import Vector2 = BABYLON.Vector2;
    import Vector3 = BABYLON.Vector3;
    import Matrix = BABYLON.Matrix;
    import Ray = BABYLON.Ray;
    import Plane = BABYLON.Plane;
    import Scene = BABYLON.Scene;
    import Node = BABYLON.Node;
    import AbstractMesh = BABYLON.AbstractMesh;
    import Quaternion = BABYLON.Quaternion;
    import EventState = BABYLON.EventState;
    import PointerInfo = BABYLON.PointerInfo;
    import PointerEventTypes = BABYLON.PointerEventTypes;

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
    export class ManipulatorInteractionHelper {

        /**
         * Rotation Step in Radian to perform rotation with the given step instead of a smooth one.
         * Set back to null/undefined to disable
         */
        rotationStep: number;

        /**
         * Translation Step in World unit to perform translation at the given step instread of a smooth one.
         * Set back to null/undefined to disable
         */
        translationStep: number;

        /**
         * Set to true if you want the context menu to be displayed while manipulating. The manipulation cancel feature (which is triggered by a right click) won't work in this case. Default value is false (context menu is not showed when right clicking during manipulation) and this should fit most of the cases.
         */
        noPreventContextMenu: boolean;

        /**
         * Attach a node to manipulate. Right now, only manipulation on a single node is supported, but this api will allow manipulation on a multiple selection in the future.
         * @param node
         */
        attachManipulatedNode(node: Node) {
            this._manipulatedNode = node;
            this._radix.show();
        }

        /**
         * Detach the node to manipulate. Right now, only manipulation on a single node is supported, but this api will allow manipulation on a multiple selection in the future.
         */
        detachManipulatedNode(node: Node) {
            this._manipulatedNode = null;
            this._radix.hide();
        }

        constructor(scene: Scene) {
            this.noPreventContextMenu = false;
            this._flags = 0;
            this._rotationFactor = 1;
            this._scene = scene;
            this._radix = new Radix(scene);
            this._shiftKeyState = false;

            this._scene.onBeforeRenderObservable.add((e, s) => this.onBeforeRender(e, s));
            this._scene.onPointerObservable.add((e, s) => this.onPointer(e, s), -1, true);

            window.oncontextmenu = ev => {
                if (!this.noPreventContextMenu) {
                    ev.preventDefault();
                }
            };
        }

        private onBeforeRender(scene: Scene, state: EventState) {
            this.renderManipulator();
        }

        private onPointer(e: PointerInfo, state: EventState) {
            if (!this._manipulatedNode) {
                return;
            }

            var rayPos = this.getRayPosition(e.event);
            var shiftKeyState = e.event.shiftKey;

            // Detect Modifier Key changes for shift while manipulating: commit and start a new manipulation
            if (this.hasManFlags(ManFlags.DragMode) && shiftKeyState !== this._shiftKeyState) {
                this.beginDrag(rayPos, <PointerEvent>e.event);
            }

            // Mouse move
            if (e.type === PointerEventTypes.POINTERMOVE) {

                // Right button release while left is down => cancel the manipulation. only processed when the context menu is not showed during manipulation
                if (!this.noPreventContextMenu && e.event.button === 2 && e.event.buttons === 1) {
                    this.setManipulatedNodeWorldMatrix(this._firstTransform);
                    this.setManFlags(ManFlags.Exiting);
                }

                else if (this.hasManFlags(ManFlags.DragMode) && !this.hasManFlags(ManFlags.Exiting)) {
                    state.skipNextObservers = true;

                    if (shiftKeyState || this.hasManipulatedMode(RadixFeatures.Rotations)) {
                        this.doRot(rayPos);
                    } else {
                        this.doPos(rayPos);
                    }
                } else {
                    this._radix.highlighted = this._radix.intersect(rayPos);
                }
            }

            // Left button down
            else if (e.type === PointerEventTypes.POINTERDOWN && e.event.button === 0) {
                this._manipulatedMode = this._radix.intersect(rayPos);

                if (this._manipulatedMode !== RadixFeatures.None) {
                    state.skipNextObservers = true;
                    this.beginDrag(rayPos, <PointerEvent>e.event);

                    if (this.hasManipulatedMode(RadixFeatures.Rotations)) {
                        this.doRot(rayPos);
                    } else {
                        this.doPos(rayPos);
                    }
                }
            }

            else if (e.type === PointerEventTypes.POINTERUP) {
                if (this.hasManFlags(ManFlags.DragMode)) {
                    state.skipNextObservers = true;
                }
                this._radix.highlighted = this._radix.intersect(rayPos);

                // Left up: end manipulation
                if (e.event.button === 0) {
                    this.endDragMode();
                }
            }
        }

        private beginDrag(rayPos: Vector2, event: PointerEvent) {
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
            this._flags |= ManFlags.FirstHit | ManFlags.DragMode;
        }

        private endDragMode() {
            this.clearManFlags(ManFlags.DragMode | ManFlags.Exiting);
        }

        private doRot(rayPos: Vector2) {
            if (this.hasManFlags(ManFlags.FirstHit)) {
                this.clearManFlags(ManFlags.FirstHit);
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

            if (this.hasManipulatedMode(RadixFeatures.ArrowX | RadixFeatures.RotationX)) {
                mtx = Matrix.RotationX(ay);
            }

            else if (this.hasManipulatedMode(RadixFeatures.ArrowY | RadixFeatures.RotationY)) {
                mtx = Matrix.RotationY(ay);
            }

            else if (this.hasManipulatedMode(RadixFeatures.ArrowZ | RadixFeatures.RotationZ)) {
                mtx = Matrix.RotationZ(ay);
            }

            else {
                if (this.hasManipulatedMode(/*RadixFeatures.CenterSquare |*/ RadixFeatures.PlaneSelectionXY | RadixFeatures.PlaneSelectionXZ)) {
                    mtx = mtx.multiply(Matrix.RotationX(ay));
                }

                if (this.hasManipulatedMode(RadixFeatures.PlaneSelectionXY | RadixFeatures.PlaneSelectionYZ)) {
                    mtx = mtx.multiply(Matrix.RotationY(ax));
                }

                if (this.hasManipulatedMode(RadixFeatures.PlaneSelectionXZ)) {
                    mtx = mtx.multiply(Matrix.RotationZ(ay));
                }

                if (this.hasManipulatedMode(/*RadixFeatures.CenterSquare |*/ RadixFeatures.PlaneSelectionXZ)) {
                    mtx = mtx.multiply(Matrix.RotationZ(ax));
                }

            }

            var tmtx = mtx.multiply(this._firstTransform);
            this.setManipulatedNodeWorldMatrix(tmtx);
        }

        private doPos(rayPos: Vector2) {
            var v = Vector3.Zero();
            var ray = this._scene.createPickingRay(rayPos.x, rayPos.y, Matrix.Identity(), this._scene.activeCamera);

            if (this.hasManipulatedMode(RadixFeatures.PlaneSelectionXY | RadixFeatures.PlaneSelectionXZ | RadixFeatures.PlaneSelectionYZ)) {
                var pl0: Plane;
                var hit: Vector3;

                if (this.hasManipulatedMode(RadixFeatures.PlaneSelectionXY)) {
                    pl0 = Plane.FromPoints(this._pos, this._pos.add(this._right), this._pos.add(this._up));
                }
                else if (this.hasManipulatedMode(RadixFeatures.PlaneSelectionXZ)) {
                    pl0 = Plane.FromPoints(this._pos, this._pos.add(this._right), this._pos.add(this._view));
                }
                else if (this.hasManipulatedMode(RadixFeatures.PlaneSelectionYZ)) {
                    pl0 = Plane.FromPoints(this._pos, this._pos.add(this._up), this._pos.add(this._view));
                }
                else {
                    // TODO Exception
                }

                var clip = 0.06;

                //Check if the plane is too parallel to the ray
                if (Math.abs(Vector3.Dot(pl0.normal, ray.direction)) < clip) {
                    return;
                }

                //Make the intersection
                let distance = ray.intersectsPlane(pl0);
                hit = ManipulatorInteractionHelper.ComputeRayHit(ray, distance);

                //Check if it's the first call
                if (this.hasManFlags(ManFlags.FirstHit)) {
                    this._flags &= ~ManFlags.FirstHit;
                    this._prevHit = hit;
                    return;
                }

                //Compute the vector
                v = hit.subtract(this._prevHit);
            }

            else if ((this._manipulatedMode & (RadixFeatures.ArrowX | RadixFeatures.ArrowY | RadixFeatures.ArrowZ)) !== 0) {
                var pl0: Plane, pl1: Plane;
                var hit: Vector3;
                var s: number;

                if (this.hasManFlags(ManFlags.FirstHit)) {
                    let res = this.setupIntersectionPlanes(this._manipulatedMode);
                    pl0 = res.p0;
                    pl1 = res.p1;

                    if (Math.abs(Vector3.Dot(pl0.normal, ray.direction)) > Math.abs(Vector3.Dot(pl1.normal, ray.direction))) {
                        let distance = ray.intersectsPlane(pl0);
                        hit = ManipulatorInteractionHelper.ComputeRayHit(ray, distance);
                        let number = ~ManFlags.Plane2;
                        this._flags &= number;
                    }
                    else {
                        let distance = ray.intersectsPlane(pl1);
                        hit = ManipulatorInteractionHelper.ComputeRayHit(ray, distance);
                        this._flags |= ManFlags.Plane2;
                    }

                    this._flags &= ~ManFlags.FirstHit;
                    this._prevHit = hit;
                    return;
                }
                else {
                    var axis: Vector3;
                    let res = this.setupIntersectionPlane(this._manipulatedMode, this.hasManFlags(ManFlags.Plane2));
                    pl0 = res.plane;
                    axis = res.axis;

                    let distance = ray.intersectsPlane(pl0);
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
        }

        private hasManipulatedMode(value: RadixFeatures): boolean {
            return (this._manipulatedMode & value) !== 0;
        }

        private hasManFlags(value: ManFlags): boolean {
            return (this._flags & value) !== 0;
        }

        private clearManFlags(values: ManFlags): ManFlags {
            this._flags &= ~values;
            return this._flags;
        }

        private setManFlags(values: ManFlags): ManFlags {
            this._flags |= values;
            return this._flags;
        }

        private static ComputeRayHit(ray: Ray, distance: number): Vector3 {
            return ray.origin.add(ray.direction.multiplyByFloats(distance, distance, distance));
        }

        private setManipulatedNodeWorldMatrix(mtx: Matrix) {
            if (!this._manipulatedNode) {
                return null;
            }

            if (this._manipulatedNode instanceof AbstractMesh) {
                var mesh = <AbstractMesh>this._manipulatedNode;

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
        }        

        private getManipulatedNodeWorldMatrix(): Matrix {
            if (!this._manipulatedNode) {
                return null;
            }

            if (this._manipulatedNode instanceof AbstractMesh) {
                return this._manipulatedNode.getWorldMatrix();
            }
        }

        private setupIntersectionPlane(mode: RadixFeatures, plane2: boolean): any {
            var res = this.setupIntersectionPlanes(mode);

            var pl = plane2 ? res.p1 : res.p0;
            var axis: Vector3;

            switch (mode) {
                case RadixFeatures.ArrowX:
                    axis = this._right;
                    break;
                case RadixFeatures.ArrowY:
                    axis = this._up;
                    break;
                case RadixFeatures.ArrowZ:
                    axis = this._view;
                    break;
                default:
                    axis = Vector3.Zero();
                    break;
            }

            return { plane: pl, axis: axis };
        }

        private setupIntersectionPlanes(mode: RadixFeatures): any {
            var p0: Plane, p1: Plane;

            switch (mode) {
                case RadixFeatures.ArrowX:
                    p0 = Plane.FromPoints(this._pos, this._pos.add(this._view), this._pos.add(this._right));
                    p1 = Plane.FromPoints(this._pos, this._pos.add(this._right), this._pos.add(this._up));
                    break;

                case RadixFeatures.ArrowY:
                    p0 = Plane.FromPoints(this._pos, this._pos.add(this._up), this._pos.add(this._right));
                    p1 = Plane.FromPoints(this._pos, this._pos.add(this._up), this._pos.add(this._view));
                    break;

                case RadixFeatures.ArrowZ:
                    p0 = Plane.FromPoints(this._pos, this._pos.add(this._view), this._pos.add(this._right));
                    p1 = Plane.FromPoints(this._pos, this._pos.add(this._view), this._pos.add(this._up));
                    break;
            }

            return { p0: p0, p1: p1 };
        }

        private getRayPosition(event: MouseEvent): Vector2 {
            var canvasRect = this._scene.getEngine().getRenderingCanvasClientRect();

            var x = event.clientX - canvasRect.left;
            var y = event.clientY - canvasRect.top;

            return new Vector2(x, y);
        }

        private renderManipulator() {
            if (!this._manipulatedNode) {
                return;
            }

            if (this._manipulatedNode instanceof AbstractMesh) {
                var mesh = <AbstractMesh>this._manipulatedNode;
                var worldMtx = mesh.getWorldMatrix();
                var l = Vector3.Distance(this._scene.activeCamera.position, worldMtx.getTranslation());
                let vpWidth = this._scene.getEngine().getRenderWidth();
                var s = this.fromScreenToWorld(vpWidth / 100, l) * 20;
                var scale = Vector3.Zero();
                var position = Vector3.Zero();
                var rotation = Quaternion.Identity();

                var res = Matrix.Scaling(s, s, s).multiply(worldMtx);

                res.decompose(scale, rotation, position);

                this._radix.setWorld(position, rotation, scale);
            }
        }

        private fromScreenToWorld(l: number, z: number): number {
            let camera = this._scene.activeCamera;
            let r0 = this._scene.createPickingRay(0, 0, Matrix.Identity(), camera, true);
            let r1 = this._scene.createPickingRay(l, 0, Matrix.Identity(), camera, true);

            var p0 = ManipulatorInteractionHelper.evalPosition(r0, z);
            var p1 = ManipulatorInteractionHelper.evalPosition(r1, z);

            return p1.x - p0.x;
        }

        private static evalPosition(ray: Ray, u: number): Vector3 {
            return ray.origin.add(ray.direction.multiplyByFloats(u, u, u));
        }

        private _flags: ManFlags;
        private _firstMousePos: Vector2;
        private _prevMousePos: Vector2;
        private _shiftKeyState: boolean;
        private _pos: Vector3;
        private _right: Vector3;
        private _up: Vector3;
        private _view: Vector3;
        private _oldPos: Vector3;
        private _prevHit: Vector3;
        private _firstTransform: Matrix;
        private _scene: Scene;
        private _manipulatedMode: RadixFeatures;
        private _rotationFactor: number;
        private _manipulatedNode: Node;
        private _radix: Radix;
    }

    const enum ManFlags {
        DragMode = 0x01,
        FirstHit = 0x02,
        Plane2 = 0x04,
        Exiting = 0x08
    }
}