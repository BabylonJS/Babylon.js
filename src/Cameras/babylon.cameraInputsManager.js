var BABYLON;
(function (BABYLON) {
    BABYLON.CameraInputTypes = {};
    var CameraInputsManager = (function () {
        function CameraInputsManager(camera) {
            this.inputs = {};
            this.camera = camera;
            this.checkInputs = function () { };
        }
        CameraInputsManager.prototype.add = function (input) {
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
                this.checkInputs = this._addCheckInputs(input.checkInputs.bind(input));
            }
        };
        CameraInputsManager.prototype._addCheckInputs = function (fn) {
            var current = this.checkInputs;
            return function () {
                current();
                fn();
            };
        };
        CameraInputsManager.prototype.attachElement = function (element, noPreventDefault) {
            for (var cam in this.inputs) {
                var input = this.inputs[cam];
                if (input.attachElement)
                    this.inputs[cam].attachElement(element, noPreventDefault);
            }
        };
        CameraInputsManager.prototype.detachElement = function (element) {
            for (var cam in this.inputs) {
                var input = this.inputs[cam];
                if (input.detachElement)
                    this.inputs[cam].detachElement(element);
            }
        };
        CameraInputsManager.prototype.rebuildInputCheck = function (element) {
            this.checkInputs = function () { };
            for (var cam in this.inputs) {
                var input = this.inputs[cam];
                if (input.checkInputs) {
                    this.checkInputs = this._addCheckInputs(input.checkInputs.bind(input));
                }
            }
        };
        CameraInputsManager.prototype.clear = function () {
            for (var cam in this.inputs) {
                this.inputs[cam].detach();
            }
            this.inputs = {};
            this.checkInputs = function () { };
        };
        CameraInputsManager.prototype.serialize = function () {
            var inputs = {};
            for (var cam in this.inputs) {
                var input = this.inputs[cam];
                var res = BABYLON.SerializationHelper.Serialize(input);
                inputs[input.getTypeName()] = res;
            }
            return inputs;
        };
        CameraInputsManager.prototype.parse = function (parsedInputs) {
            if (parsedInputs) {
                this.clear();
                for (var n in parsedInputs) {
                    var construct = BABYLON.CameraInputTypes[n];
                    if (construct) {
                        var parsedinput = parsedInputs[n];
                        var input = BABYLON.SerializationHelper.Parse(function () { return new construct(); }, parsedinput, null);
                        this.add(input);
                    }
                }
            }
        };
        return CameraInputsManager;
    }());
    BABYLON.CameraInputsManager = CameraInputsManager;
})(BABYLON || (BABYLON = {}));
