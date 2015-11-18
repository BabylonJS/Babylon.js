module ActionsBuilder {

    /**
    * Defines static types
    */
    export class Type {
        private static _TRIGGER = 0;
        private static _ACTION = 1;
        private static _FLOW_CONTROL = 2;
        private static _OBJECT = 3;
        private static _SCENE = 4;

        public static get TRIGGER(): number {
            return Type._TRIGGER;
        }

        public static get ACTION(): number {
            return Type._ACTION;
        }

        public static get FLOW_CONTROL(): number {
            return Type._FLOW_CONTROL;
        }

        public static get OBJECT(): number {
            return Type._OBJECT;
        }

        public static get SCENE(): number {
            return Type._SCENE;
        }
    }

    /*
    * Defines the BABYLON.JS elements
    */
    export class SceneElements {
        /*
        * BabylonJS objects
        */
        private static _ENGINE: BABYLON.Engine = new BABYLON.Engine(<HTMLCanvasElement>document.getElementById("RenderCanvasID"));
        private static _SCENE: BABYLON.Scene = new BABYLON.Scene(SceneElements.ENGINE);
        private static _MESH: BABYLON.Mesh = new BABYLON.Mesh("mesh", SceneElements._SCENE);
        private static _LIGHT: BABYLON.Light = new BABYLON.Light("light", SceneElements._SCENE);
        private static _CAMERA: BABYLON.Camera = new BABYLON.Camera("camera", BABYLON.Vector3.Zero(), SceneElements._SCENE);

        public static get ENGINE(): BABYLON.Engine {
            return SceneElements._ENGINE;
        }

        public static get SCENE(): BABYLON.Scene {
            return SceneElements._SCENE;
        }

        public static get MESH(): BABYLON.Mesh {
            return SceneElements._MESH;
        }

        public static get LIGHT(): BABYLON.Light {
            return SceneElements._LIGHT;
        }

        public static get CAMERA(): BABYLON.Camera {
            return SceneElements._CAMERA;
        }

        /*
        * Objects names
        */
        private static _MESHES = new Array<string>();
        private static _LIGHTS = new Array<string>();
        private static _CAMERAS = new Array<string>();
        private static _SOUNDS = new Array<string>();

        public static get MESHES(): Array<string> {
            return SceneElements._MESHES;
        }

        public static get LIGHTS(): Array<string> {
            return SceneElements._LIGHTS;
        }

        public static get CAMERAS(): Array<string> {
            return SceneElements._CAMERAS;
        }

        public static get SOUNDS(): Array<string> {
            return SceneElements._SOUNDS;
        }

        /*
        * Properties
        */
        private static _MESH_PROPERTIES = new Array<string>();
        private static _LIGHT_PROPERTIES = new Array<string>();
        private static _CAMERA_PROPERTIES = new Array<string>();
        private static _SCENE_PROPERTIES = new Array<string>();

        public static get MESH_PROPERTIES(): Array<string> {
            return SceneElements._MESH_PROPERTIES;
        }

        public static get LIGHT_PROPERTIES(): Array<string> {
            return SceneElements._LIGHT_PROPERTIES;
        }

        public static get CAMERA_PROPERTIES(): Array<string> {
            return SceneElements._CAMERA_PROPERTIES;
        }

        public static get SCENE_PROPERTIES(): Array<string> {
            return SceneElements._SCENE_PROPERTIES;
        }

        /*
        * Types
        */
        private static _TYPES = new Array<string>();

        public static get TYPES(): Array<string> {
            return SceneElements._TYPES;
        }

        /*
        * Operators
        */
        private static _OPERATORS = new Array<string>();

        public static get OPERATORS(): Array<string> {
            return SceneElements._OPERATORS;
        }

        /*
        * Methods
        */
        public static GetInstanceOf(object: Object): string {
            if (object === null || object === undefined) {
                return "";
            }
            return object.constructor.toString().match(/function (\w*)/)[1];
        }

        public static TestInstanceOf (object: Object, propertyName: string): boolean {
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
        }
    }

    // Functions
    var specialTypes = [
        "StandardMaterial"
    ];
    SceneElements.MESH.material = new BABYLON.StandardMaterial("material", SceneElements.SCENE);

    var addSpecialType = (object: any, properties: Array<string>, thing: string) => {
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
    * Defines an element property
    */
    export interface ElementProperty {
        targetType?: string;
        text: string;
        value: string;
    }

    /**
    * Defines an element property result
    */
    export interface ElementPropertyResult {
        targetType?: string;
        value: string;
    }

    /**
    * Generic element, has a name, a text to draw, a description
    * and a list of properties (ElementProperty)
    */
    export interface Element {
        name: string;
        text: string;
        properties: Array<ElementProperty>;
        description: string;
    }

    /**
    * Actions Builder elements (triggers, actions & flow controls) that are
    * arrays of Element
    */
    export class Elements {
        private static _TRIGGERS = new Array<Element>();
        private static _ACTIONS = new Array<Element>();
        private static _FLOW_CONTROLS = new Array<Element>();

        public static get TRIGGERS(): Array<Element> {
            return Elements._TRIGGERS;
        }

        public static get ACTIONS(): Array<Element> {
            return Elements._ACTIONS;
        }

        public static get FLOW_CONTROLS(): Array<Element> {
            return Elements._FLOW_CONTROLS;
        }

        public static GetElementFromName(name: string): Element {
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
        }
    }

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
}
