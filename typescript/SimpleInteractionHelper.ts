module Sandbox {
    import Scene = BABYLON.Scene;
    import Observer = BABYLON.Observer;
    import PointerInfo = BABYLON.PointerInfo;
    import EventState = BABYLON.EventState;
    import PointerEventTypes = BABYLON.PointerEventTypes;
    import AbstractMesh = BABYLON.AbstractMesh;
    import Node = BABYLON.Node;

    export const enum SIHCurrentAction {
        None, Selector, Camerator
    }

    /**
     * The purpose of this class is to allow the camera manipulation, single node selection and manipulation.
     * You can use it as an example to create your more complexe/different interaction helper
     */
    export class SimpleInteractionHelper {
        constructor(scene: Scene) {
            this._actionStack = new Array<SIHCurrentAction>();

            this._scene = scene;
            this._pointerObserver = this._scene.onPointerObservable.add((p, s) => this.pointerCallback(p, s), -1, true);
        }

        get currentAction(): SIHCurrentAction {
            if (this._actionStack.length === 0) {
                return SIHCurrentAction.Selector;
            }

            return this._actionStack[this._actionStack.length - 1];
        }

        get manipulator(): ManipulatorInteractionHelper {
            if (!this._manipulator) {
                this._manipulator = new ManipulatorInteractionHelper(this._scene);
            }

            return this._manipulator;
        }

        private pointerCallback(p: PointerInfo, s: EventState) {
            this.detectActionChanged(p, s);

            switch (this.currentAction) {
                case SIHCurrentAction.Selector:
                    this.doSelectorInteraction(p, s);
                    break;
                case SIHCurrentAction.Camerator:
                    if (p.type & (PointerEventTypes.POINTERUP | PointerEventTypes.POINTERWHEEL)) {
                        this._actionStack.pop();
                    }
                    break;
            }
        }

        private doSelectorInteraction(p: PointerInfo, s: EventState) {
            s.skipNextObservers = true;

            // We want left button up.
            if (p.type !== PointerEventTypes.POINTERUP || p.event.button!==0) {
                return;
            }

            var selectedMesh: AbstractMesh;

            if (p.pickInfo.hit) {
                selectedMesh = p.pickInfo.pickedMesh;
            }

            // We selected the same mesh? nothing to do
            if (this._pickedNode === selectedMesh) {
                selectedMesh.showBoundingBox = !selectedMesh.showBoundingBox;

                if (selectedMesh.showBoundingBox===false) {
                    this.manipulator.detachManipulatedNode(this._pickedNode);
                    this._pickedNode = null;
                }
                return;
            }

            // Detach the manipulator to the current selected mesh
            if (this._pickedNode) {
                if (this._pickedNode instanceof AbstractMesh) {
                    var mesh = <AbstractMesh>this._pickedNode;
                    mesh.showBoundingBox = false;
                }
                this.manipulator.detachManipulatedNode(this._pickedNode);
                this._pickedNode = null;
            }

            // Nothing selected, our job's done
            if (!selectedMesh) {
                return;
            }

            this._pickedNode = selectedMesh;
            selectedMesh.showBoundingBox = true;

            this.manipulator.attachManipulatedNode(this._pickedNode);
        }

        private detectActionChanged(p: PointerInfo, s: EventState) {
            // Detect switch from selection to camerator
            if (this.currentAction === SIHCurrentAction.Selector) {

                if (p.type === PointerEventTypes.POINTERDOWN) {
                    if (!p.pickInfo.hit) {
                        this._actionStack.push(SIHCurrentAction.Camerator);
                        return;
                    }
                }

                if (p.type === PointerEventTypes.POINTERWHEEL) {
                    this._actionStack.push(SIHCurrentAction.Camerator);
                    return;
                }
            }
        }

        private static CameratorSwitchThreshold = 4.0;

        private _pickedNode: Node;
        private _actionStack: Array<SIHCurrentAction>;
        private _scene: Scene;
        private _pointerObserver: Observer<PointerInfo>;

        private _manipulator: ManipulatorInteractionHelper;


    }
}