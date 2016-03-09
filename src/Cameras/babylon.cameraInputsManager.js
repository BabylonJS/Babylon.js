var BABYLON;
(function (BABYLON) {
    BABYLON.CameraInputTypes = {};
    var CameraInputsManager = (function () {
        function CameraInputsManager(camera) {
            this.attached = {};
            this.camera = camera;
            this.checkInputs = function () { };
        }
        CameraInputsManager.prototype.add = function (input) {
            var type = input.getSimpleName();
            if (this.attached[type]) {
                BABYLON.Tools.Warn("camera input of type " + type + " already exists on camera");
                return;
            }
            this.attached[type] = input;
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
            for (var cam in this.attached) {
                var input = this.attached[cam];
                if (input.attachElement)
                    this.attached[cam].attachElement(element, noPreventDefault);
            }
        };
        CameraInputsManager.prototype.detachElement = function (element) {
            for (var cam in this.attached) {
                var input = this.attached[cam];
                if (input.detachElement)
                    this.attached[cam].detachElement(element);
            }
        };
        CameraInputsManager.prototype.rebuildInputCheck = function (element) {
            this.checkInputs = function () { };
            for (var cam in this.attached) {
                var input = this.attached[cam];
                if (input.checkInputs) {
                    this.checkInputs = this._addCheckInputs(input.checkInputs.bind(input));
                }
            }
        };
        CameraInputsManager.prototype.clear = function () {
            for (var cam in this.attached) {
                this.attached[cam].detach();
            }
            this.attached = {};
            this.checkInputs = function () { };
        };
        CameraInputsManager.prototype.serialize = function (serializedCamera) {
            var inputs = {};
            for (var cam in this.attached) {
                var input = this.attached[cam];
                var res = BABYLON.SerializationHelper.Serialize(input, serializedCamera);
                inputs[input.getTypeName()] = res;
            }
            serializedCamera.inputsmgr = inputs;
        };
        CameraInputsManager.prototype.parse = function (parsedCamera) {
            var parsedInputs = parsedCamera.inputsmgr;
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
            else {
                //2016-03-08 this part is for managing backward compatibility
                for (var n in this.attached) {
                    var construct = BABYLON.CameraInputTypes[this.attached[n].getTypeName()];
                    if (construct) {
                        var input = BABYLON.SerializationHelper.Parse(function () { return new construct(); }, parsedCamera, null);
                        this.add(input);
                    }
                }
            }
        };
        return CameraInputsManager;
    })();
    BABYLON.CameraInputsManager = CameraInputsManager;
})(BABYLON || (BABYLON = {}));
