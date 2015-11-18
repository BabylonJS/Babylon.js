var ActionsBuilder;
(function (ActionsBuilder) {
    /**
    * Defines static types
    */
    var Type = (function () {
        function Type() {
        }
        Object.defineProperty(Type, "TRIGGER", {
            get: function () {
                return Type._TRIGGER;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Type, "ACTION", {
            get: function () {
                return Type._ACTION;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Type, "FLOW_CONTROL", {
            get: function () {
                return Type._FLOW_CONTROL;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Type, "OBJECT", {
            get: function () {
                return Type._OBJECT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Type, "SCENE", {
            get: function () {
                return Type._SCENE;
            },
            enumerable: true,
            configurable: true
        });
        Type._TRIGGER = 0;
        Type._ACTION = 1;
        Type._FLOW_CONTROL = 2;
        Type._OBJECT = 3;
        Type._SCENE = 4;
        return Type;
    })();
    ActionsBuilder.Type = Type;
    /*
    * Defines the BABYLON.JS elements
    */
    var SceneElements = (function () {
        function SceneElements() {
        }
        Object.defineProperty(SceneElements, "ENGINE", {
            get: function () {
                return SceneElements._ENGINE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "SCENE", {
            get: function () {
                return SceneElements._SCENE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "MESH", {
            get: function () {
                return SceneElements._MESH;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "LIGHT", {
            get: function () {
                return SceneElements._LIGHT;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "CAMERA", {
            get: function () {
                return SceneElements._CAMERA;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "MESHES", {
            get: function () {
                return SceneElements._MESHES;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "LIGHTS", {
            get: function () {
                return SceneElements._LIGHTS;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "CAMERAS", {
            get: function () {
                return SceneElements._CAMERAS;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "SOUNDS", {
            get: function () {
                return SceneElements._SOUNDS;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "MESH_PROPERTIES", {
            get: function () {
                return SceneElements._MESH_PROPERTIES;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "LIGHT_PROPERTIES", {
            get: function () {
                return SceneElements._LIGHT_PROPERTIES;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "CAMERA_PROPERTIES", {
            get: function () {
                return SceneElements._CAMERA_PROPERTIES;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "SCENE_PROPERTIES", {
            get: function () {
                return SceneElements._SCENE_PROPERTIES;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "TYPES", {
            get: function () {
                return SceneElements._TYPES;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(SceneElements, "OPERATORS", {
            get: function () {
                return SceneElements._OPERATORS;
            },
            enumerable: true,
            configurable: true
        });
        /*
        * Methods
        */
        SceneElements.GetInstanceOf = function (object) {
            if (object === null || object === undefined) {
                return "";
            }
            return object.constructor.toString().match(/function (\w*)/)[1];
        };
        SceneElements.TestInstanceOf = function (object, propertyName) {
            if (object === null || object.constructor === null) {
                return false;
            }
            if (propertyName.length > 0 && propertyName[0] === "_")
                return false;
            var name = SceneElements.GetInstanceOf(object);
            for (var i = 0; i < SceneElements.TYPES.length; i++) {
                if (name === SceneElements.TYPES[i]) {
                    return true;
                }
            }
            return false;
        };
        /*
        * BabylonJS objects
        */
        SceneElements._ENGINE = new BABYLON.Engine(document.getElementById("RenderCanvasID"));
        SceneElements._SCENE = new BABYLON.Scene(SceneElements.ENGINE);
        SceneElements._MESH = new BABYLON.Mesh("mesh", SceneElements._SCENE);
        SceneElements._LIGHT = new BABYLON.Light("light", SceneElements._SCENE);
        SceneElements._CAMERA = new BABYLON.Camera("camera", BABYLON.Vector3.Zero(), SceneElements._SCENE);
        /*
        * Objects names
        */
        SceneElements._MESHES = new Array();
        SceneElements._LIGHTS = new Array();
        SceneElements._CAMERAS = new Array();
        SceneElements._SOUNDS = new Array();
        /*
        * Properties
        */
        SceneElements._MESH_PROPERTIES = new Array();
        SceneElements._LIGHT_PROPERTIES = new Array();
        SceneElements._CAMERA_PROPERTIES = new Array();
        SceneElements._SCENE_PROPERTIES = new Array();
        /*
        * Types
        */
        SceneElements._TYPES = new Array();
        /*
        * Operators
        */
        SceneElements._OPERATORS = new Array();
        return SceneElements;
    })();
    ActionsBuilder.SceneElements = SceneElements;
    // Functions
    var specialTypes = [
        "StandardMaterial"
    ];
    SceneElements.MESH.material = new BABYLON.StandardMaterial("material", SceneElements.SCENE);
    var addSpecialType = function (object, properties, thing) {
        for (var specialThing in object[thing]) {
            if (object[thing].hasOwnProperty(specialThing) && SceneElements.TestInstanceOf(object[thing][specialThing], specialThing)) {
                properties.push(thing + "." + specialThing);
            }
        }
    };
    // Configure types
    SceneElements.TYPES.push("Color3");
    SceneElements.TYPES.push("Boolean");
    SceneElements.TYPES.push("Number");
    SceneElements.TYPES.push("Vector2");
    SceneElements.TYPES.push("Vector3");
    SceneElements.TYPES.push("String");
    // Configure operators
    SceneElements.OPERATORS.push("IsEqual");
    SceneElements.OPERATORS.push("IsDifferent");
    SceneElements.OPERATORS.push("IsGreater");
    SceneElements.OPERATORS.push("IsLesser");
    // Configure properties
    for (var thing in SceneElements.MESH) {
        var instance = SceneElements.GetInstanceOf(SceneElements.MESH[thing]);
        if (SceneElements.MESH.hasOwnProperty(thing)) {
            if (specialTypes.indexOf(instance) !== -1) {
                addSpecialType(SceneElements.MESH, SceneElements.MESH_PROPERTIES, thing);
            }
            else if (SceneElements.TestInstanceOf(SceneElements.MESH[thing], thing)) {
                SceneElements.MESH_PROPERTIES.push(thing);
            }
        }
    }
    for (var thing in SceneElements.LIGHT) {
        if (SceneElements.LIGHT.hasOwnProperty(thing) && SceneElements.TestInstanceOf(SceneElements.LIGHT[thing], thing)) {
            SceneElements.LIGHT_PROPERTIES.push(thing);
        }
    }
    for (var thing in SceneElements.CAMERA) {
        if (SceneElements.CAMERA.hasOwnProperty(thing) && SceneElements.TestInstanceOf(SceneElements.CAMERA[thing], thing)) {
            SceneElements.CAMERA_PROPERTIES.push(thing);
        }
    }
    for (var thing in SceneElements.SCENE) {
        if (SceneElements.SCENE.hasOwnProperty(thing) && SceneElements.TestInstanceOf(SceneElements.SCENE[thing], thing)) {
            SceneElements.SCENE_PROPERTIES.push(thing);
        }
    }
    /**
    * Actions Builder elements (triggers, actions & flow controls) that are
    * arrays of Element
    */
    var Elements = (function () {
        function Elements() {
        }
        Object.defineProperty(Elements, "TRIGGERS", {
            get: function () {
                return Elements._TRIGGERS;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Elements, "ACTIONS", {
            get: function () {
                return Elements._ACTIONS;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Elements, "FLOW_CONTROLS", {
            get: function () {
                return Elements._FLOW_CONTROLS;
            },
            enumerable: true,
            configurable: true
        });
        Elements.GetElementFromName = function (name) {
            for (var i = 0; i < Elements.TRIGGERS.length; i++) {
                if (Elements.TRIGGERS[i].name === name) {
                    return Elements._TRIGGERS[i];
                }
            }
            for (var i = 0; i < Elements.ACTIONS.length; i++) {
                if (Elements.ACTIONS[i].name === name) {
                    return Elements._ACTIONS[i];
                }
            }
            for (var i = 0; i < Elements.FLOW_CONTROLS.length; i++) {
                if (Elements.FLOW_CONTROLS[i].name === name) {
                    return Elements._FLOW_CONTROLS[i];
                }
            }
            return null;
        };
        Elements._TRIGGERS = new Array();
        Elements._ACTIONS = new Array();
        Elements._FLOW_CONTROLS = new Array();
        return Elements;
    })();
    ActionsBuilder.Elements = Elements;
    // Configure triggers
    Elements.TRIGGERS.push({ name: "OnPickTrigger", text: "pick", properties: [], description: "When the user picks the edited mesh" });
    Elements.TRIGGERS.push({ name: "OnLeftPickTrigger", text: "left pick", properties: [], description: "When the user picks the edited mesh using the left click" });
    Elements.TRIGGERS.push({ name: "OnRightPickTrigger", text: "right pick", properties: [], description: "When the user picks the edited mesh using the right click" });
    Elements.TRIGGERS.push({ name: "OnCenterPickTrigger", text: "center pick", properties: [], description: "When the user picks the edited mesh using the click of the mouse wheel" });
    Elements.TRIGGERS.push({ name: "OnPointerOverTrigger", text: "pointer over", properties: [], description: "When the user's mouse is over the edited mesh" });
    Elements.TRIGGERS.push({ name: "OnPointerOutTrigger", text: "pointer out", properties: [], description: "When the user's mouse is out of the edited mesh" });
    Elements.TRIGGERS.push({ name: "OnEveryFrameTrigger", text: "every frame", properties: [], description: "This trigger is called each frame (only on scene)" });
    Elements.TRIGGERS.push({ name: "OnIntersectionEnterTrigger", text: "intersection enter", properties: [{ targetType: "MeshProperties", text: "parameter", value: "Object name?" }], description: "When the edited mesh intersects the another mesh predefined in the options" });
    Elements.TRIGGERS.push({ name: "OnIntersectionExitTrigger", text: "intersection exit", properties: [{ targetType: "MeshProperties", text: "parameter", value: "Object name?" }], description: "When the edited mesh exits intersection with the another mesh predefined in the options" });
    Elements.TRIGGERS.push({ name: "OnKeyDownTrigger", text: "key down", properties: [{ targetType: null, text: "parameter:", value: "a" }], description: "When the user pressed a key (enter the key character, example: \"r\")" });
    Elements.TRIGGERS.push({ name: "OnKeyUpTrigger", text: "key up", properties: [{ targetType: null, text: "parameter:", value: "a" }], description: "When the user unpressed a key (enter the key character, example: \"p\")" });
    // Configure actions
    Elements.ACTIONS.push({ name: "SwitchBooleanAction", text: "switch boolean", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "propertyPath", value: "" }], description: "Switches the boolean value of a given parameter of the target object: true to false, or false to true" });
    Elements.ACTIONS.push({ name: "SetStateAction", text: "set state", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "value", value: "" }], description: "Sets a new state value for the target object (example: \"off\" or \"on\")" });
    Elements.ACTIONS.push({ name: "SetValueAction", text: "set value", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "propertyPath", value: "" }, { text: "value", value: "" }], description: "Sets a new value to the specified parameter of the target object (example: position.x to 0.0)" });
    Elements.ACTIONS.push({ name: "SetParentAction", text: "set parent", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "parent", value: "" }], description: "Sets the new parent of the target object (example: a mesh or a light)" });
    Elements.ACTIONS.push({ name: "IncrementValueAction", text: "increment value", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "propertyPath", value: "" }, { text: "value", value: "" }], description: "Increments the value of the given parameter of the target object. The value can be negative. (example: increment position.x of 5.0)" });
    Elements.ACTIONS.push({ name: "PlayAnimationAction", text: "play animation", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "from", value: "0" }, { text: "to", value: "150" }, { text: "loop", value: "false" }], description: "Plays an animation of the target object. Specify the start frame, the end frame and if the animation should loop." });
    Elements.ACTIONS.push({ name: "StopAnimationAction", text: "stop animation", properties: [{ targetType: "MeshProperties", text: "target", value: "" }], description: "Stops the animations of the target object." });
    Elements.ACTIONS.push({ name: "DoNothingAction", text: "do nothing", properties: [], description: "Does nothing, can be used to balance/equilibrate the actions graph." });
    Elements.ACTIONS.push({ name: "InterpolateValueAction", text: "interpolate value", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "propertyPath", value: "" }, { text: "value", value: "0" }, { text: "duration", value: "1000" }, { text: "stopOtherAnimations", value: "false" }], description: "Creates an animation (key frames) that animates the target object by interpolating the given parameter of the target value." });
    Elements.ACTIONS.push({ name: "PlaySoundAction", text: "play sound", properties: [{ text: "sound", value: "" }], description: "Plays the specified sound." });
    Elements.ACTIONS.push({ name: "StopSoundAction", text: "stop sound", properties: [{ text: "sound", value: "" }], description: "Stops the specified sound." });
    Elements.ACTIONS.push({ name: "CombineAction", text: "combine", properties: [], description: "Special action that combines multiple actions. The combined actions are executed at the same time. Drag'n'drop the new actions inside to combine actions." });
    // Configure flow control
    Elements.FLOW_CONTROLS.push({ name: "ValueCondition", text: "value condition", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "propertyPath", value: "" }, { text: "value", value: "" }, { text: "operator", value: SceneElements.OPERATORS[0] }], description: "A condition checking if a given value is equal, different, lesser or greater than the given parameter of the target object" });
    Elements.FLOW_CONTROLS.push({ name: "StateCondition", text: "state condition", properties: [{ targetType: "MeshProperties", text: "target", value: "" }, { text: "value", value: "" }], description: "A condition checking if the target object's state is equal to the given state. See \"set state\" action to set a state to an object." });
    Elements.FLOW_CONTROLS.push({ name: "Hub", text: "hub", properties: [], description: "The hub is internally used by the Combine Action. It allows to add children to the Combine Action" });
})(ActionsBuilder || (ActionsBuilder = {}));
//# sourceMappingURL=actionsbuilder.js.map