var Sandbox;
(function (Sandbox) {
    var PointerEventTypes = BABYLON.PointerEventTypes;
    var AbstractMesh = BABYLON.AbstractMesh;
    /**
     * The purpose of this class is to allow the camera manipulation, single node selection and manipulation.
     * You can use it as an example to create your more complexe/different interaction helper
     */
    var SimpleInteractionHelper = (function () {
        function SimpleInteractionHelper(scene) {
            var _this = this;
            this._actionStack = new Array();
            this._scene = scene;
            this._pointerObserver = this._scene.onPointerObservable.add(function (p, s) { return _this.pointerCallback(p, s); }, -1, true);
        }
        Object.defineProperty(SimpleInteractionHelper.prototype, "currentAction", {
            get: function () {
                if (this._actionStack.length === 0) {
                    return 1 /* Selector */;
                }
                return this._actionStack[this._actionStack.length - 1];
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SimpleInteractionHelper.prototype, "manipulator", {
            get: function () {
                if (!this._manipulator) {
                    this._manipulator = new Sandbox.ManipulatorInteractionHelper(this._scene);
                }
                return this._manipulator;
            },
            enumerable: true,
            configurable: true
        });
        SimpleInteractionHelper.prototype.pointerCallback = function (p, s) {
            this.detectActionChanged(p, s);
            switch (this.currentAction) {
                case 1 /* Selector */:
                    this.doSelectorInteraction(p, s);
                    break;
                case 2 /* Camerator */:
                    if (p.type & (PointerEventTypes.POINTERUP | PointerEventTypes.POINTERWHEEL)) {
                        this._actionStack.pop();
                    }
                    break;
            }
        };
        SimpleInteractionHelper.prototype.doSelectorInteraction = function (p, s) {
            s.skipNextObservers = true;
            // We want left button up.
            if (p.type !== PointerEventTypes.POINTERUP || p.event.button !== 0) {
                return;
            }
            var selectedMesh;
            if (p.pickInfo.hit) {
                selectedMesh = p.pickInfo.pickedMesh;
            }
            // We selected the same mesh? nothing to do
            if (this._pickedNode === selectedMesh) {
                selectedMesh.showBoundingBox = !selectedMesh.showBoundingBox;
                if (selectedMesh.showBoundingBox === false) {
                    this.manipulator.detachManipulatedNode(this._pickedNode);
                    this._pickedNode = null;
                }
                return;
            }
            // Detach the manipulator to the current selected mesh
            if (this._pickedNode) {
                if (this._pickedNode instanceof AbstractMesh) {
                    var mesh = this._pickedNode;
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
        };
        SimpleInteractionHelper.prototype.detectActionChanged = function (p, s) {
            // Detect switch from selection to camerator
            if (this.currentAction === 1 /* Selector */) {
                if (p.type === PointerEventTypes.POINTERDOWN) {
                    if (!p.pickInfo.hit) {
                        this._actionStack.push(2 /* Camerator */);
                        return;
                    }
                }
                if (p.type === PointerEventTypes.POINTERWHEEL) {
                    this._actionStack.push(2 /* Camerator */);
                    return;
                }
            }
        };
        SimpleInteractionHelper.CameratorSwitchThreshold = 4.0;
        return SimpleInteractionHelper;
    }());
    Sandbox.SimpleInteractionHelper = SimpleInteractionHelper;
})(Sandbox || (Sandbox = {}));
//# sourceMappingURL=simpleinteractionhelper.js.map