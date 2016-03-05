var BABYLON;
(function (BABYLON) {
    var ComposableCameraInputsManager = (function () {
        function ComposableCameraInputsManager(camera) {
            this.inputs = {};
            this.camera = camera;
            this.checkInputs = function () { };
        }
        ComposableCameraInputsManager.prototype.add = function (input) {
            var type = input.getTypeName();
            if (this.inputs[type]) {
                BABYLON.Tools.Warn("camera input of type " + type + " already exists on camera");
                return;
            }
            this.inputs[type] = input;
            input.attachCamera(this.camera);
            //for checkInputs, we are dynamically creating a function
            //the goal is to avoid the performance penalty of looping for inputs in the render loop
            if (input.checkInputs) {
                this.checkInputs = this._addCheckInputs(input.checkInputs);
            }
            if (this.camera._attachedElement && input.attachElement) {
                input.attachElement(this.camera._attachedElement, this.camera._noPreventDefault);
            }
        };
        ComposableCameraInputsManager.prototype._addCheckInputs = function (fn) {
            var current = this.checkInputs;
            return function () {
                current();
                fn();
            };
        };
        ComposableCameraInputsManager.prototype.attachElement = function (element, noPreventDefault) {
            for (var cam in this.inputs) {
                var input = this.inputs[cam];
                if (input.attachElement)
                    this.inputs[cam].attachElement(element, noPreventDefault);
            }
        };
        ComposableCameraInputsManager.prototype.detachElement = function (element) {
            for (var cam in this.inputs) {
                var input = this.inputs[cam];
                if (input.detachElement)
                    this.inputs[cam].detachElement(element);
            }
        };
        ComposableCameraInputsManager.prototype.rebuildInputCheck = function (element) {
            this.checkInputs = function () { };
            for (var cam in this.inputs) {
                var input = this.inputs[cam];
                if (input.checkInputs) {
                    this.checkInputs = function () {
                        input.checkInputs();
                    };
                }
            }
        };
        ComposableCameraInputsManager.prototype.clear = function () {
            for (var cam in this.inputs) {
                this.inputs[cam].detach();
            }
            this.inputs = {};
            this.checkInputs = function () { };
        };
        return ComposableCameraInputsManager;
    }());
    BABYLON.ComposableCameraInputsManager = ComposableCameraInputsManager;
})(BABYLON || (BABYLON = {}));
