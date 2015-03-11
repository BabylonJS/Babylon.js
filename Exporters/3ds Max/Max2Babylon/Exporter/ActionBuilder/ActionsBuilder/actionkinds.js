/// <reference path="raphael.js" />
/// <reference path="viewer.js" />
/// <reference path="action.js" />
/// <reference path="babylon.max.js" />

var AB;
(function (AB) {

    var directActionTemplate = function (parameters, secondArgument) {
        var template = [
            { text: "target", value: "Object name?", targetType: "SceneProperties" }
        ];

        if (secondArgument)
            template.push({text: secondArgument, value: "value..."});

        if (parameters)
            template.push.apply(template, parameters);

        return template;
    }

    var directActionWidthPropertyPath = function (parameters) {
        return directActionTemplate(parameters, "propertyPath");
    }

    var ActionsBuilder = (function () {
        function ActionsBuilder()
        { }

        var engine = new BABYLON.Engine(document.getElementById("renderCanvas"), false);
        var scene = new BABYLON.Scene(engine);
        var camera = new BABYLON.Camera("empty_camera", BABYLON.Vector3.Zero(), scene);
        var light = new BABYLON.PointLight("empty_light", BABYLON.Vector3.Zero(), scene);
        var mesh = new BABYLON.Mesh("empty_mesh", scene);

        ActionsBuilder.Engine = function () {
            return engine;
        }

        ActionsBuilder.Scene = function () {
            return scene;
        }

        ActionsBuilder.Camera = function () {
            return camera;
        }

        ActionsBuilder.Light = function () {
            return light;
        }

        ActionsBuilder.Mesh = function () {
            return mesh;
        }

        //
        // Types
        //
        ActionsBuilder.Type = ActionsBuilder.Type || {};
        ActionsBuilder.Type.TRIGGER = 0;
        ActionsBuilder.Type.ACTION = 1;
        ActionsBuilder.Type.FLOW_CONTROL = 2;
        ActionsBuilder.Type.OBJECT = 3;
        ActionsBuilder.Type.SCENE = 4;

        //
        // Data types names
        //
        ActionsBuilder.DataTypesNames = ActionsBuilder.DataTypesNames || new Array();
        ActionsBuilder.DataTypesNames.push({ name: "Scene", data: "SceneProperties" });
        ActionsBuilder.DataTypesNames.push({ name: "Camera", data: "CameraProperties" });
        ActionsBuilder.DataTypesNames.push({ name: "Light", data: "LightProperties" });
        ActionsBuilder.DataTypesNames.push({ name: "Mesh", data: "MeshProperties" });

        //
        // Autorized data types
        //
        ActionsBuilder.Types = ActionsBuilder.Types || new Array();
        ActionsBuilder.Types.push("Boolean");
        ActionsBuilder.Types.push("Number");
        ActionsBuilder.Types.push("Vector2");
        ActionsBuilder.Types.push("Vector3");
        ActionsBuilder.Types.push("String");

        // Tests if the property type is in ActionsBuilder.Types
        var testInstanceOf = function (object, propertyName) {
            if (object == null || object.constructor == null)
                return false;

            if (propertyName.length > 0 && propertyName[0] == "_")
                return false;

            var name = object.constructor.toString().match(/function (\w*)/)[1];

            for (var i = 0; i < ActionsBuilder.Types.length; i++) {
                if (name == ActionsBuilder.Types[i])
                    return true;
            }

            return false;
        }

        //
        // Scene properties
        //
        ActionsBuilder.SceneProperties = ActionsBuilder.SceneProperties || new Array();
        for (var thing in scene) {
            if (testInstanceOf(scene[thing], thing)) {
                ActionsBuilder.SceneProperties.push({ name: thing, type: typeof (scene[thing]) });
            }
        }

        //
        // Camera properties
        //
        ActionsBuilder.CameraProperties = ActionsBuilder.CameraProperties || new Array();
        for (var thing in camera) {
            if (testInstanceOf(camera[thing], thing)) {
                ActionsBuilder.CameraProperties.push({ name: thing, type: typeof (camera[thing]) });
            }
        }

        //
        // Light properties
        //
        ActionsBuilder.LightProperties = ActionsBuilder.LightProperties || new Array();
        for (var thing in light) {
            if (testInstanceOf(light[thing], thing)) {
                ActionsBuilder.LightProperties.push({ name: thing, type: typeof (light[thing]) });
            }
        }

        //
        // Mesh properties
        //
        ActionsBuilder.MeshProperties = ActionsBuilder.MeshProperties || new Array();
        for (var thing in mesh) {
            if (testInstanceOf(mesh[thing], thing)) {
                ActionsBuilder.MeshProperties.push({ name: thing, type: typeof (mesh[thing]) });
            }
        }

        //
        // Scene properties (meshes, lights, etc)
        //
        ActionsBuilder.MeshesList = ActionsBuilder.MeshesList || new Array();
        ActionsBuilder.LightsList = ActionsBuilder.LightsList || new Array();
        ActionsBuilder.CamerasList = ActionsBuilder.CamerasList || new Array();
        ActionsBuilder.SoundsList = ActionsBuilder.SoundsList || new Array();

        //
        // Triggers
        //
        ActionsBuilder.Trigger = ActionsBuilder.Trigger || {};
        ActionsBuilder.Trigger[0] = { name: "NothingTrigger", properties: [] };
        ActionsBuilder.Trigger[1] = { name: "OnPickTrigger", properties: [], description: "When the user clicks" };
        ActionsBuilder.Trigger[2] = { name: "OnLeftPickTrigger", properties: [], description: "When the user left clicks" };
        ActionsBuilder.Trigger[3] = { name: "OnRightPickTrigger", properties: [], description: "When the user right clicks" };
        ActionsBuilder.Trigger[4] = { name: "OnCenterPickTrigger", properties: [], description: "When the user center clicks (mouse wheel)" };
        ActionsBuilder.Trigger[5] = { name: "OnPointerOverTrigger", properties: [], description: "When the user's mouse is on the object" };
        ActionsBuilder.Trigger[6] = { name: "OnPointerOutTrigger", properties: [], description: "When the user's mouse is out of the object" };
        ActionsBuilder.Trigger[7] = { name: "OnEveryFrameTrigger", properties: [], description: "Called each frame (only on scene)" };
        ActionsBuilder.Trigger[8] = { name: "OnIntersectionEnterTrigger", properties: [{ text: "parameter", value: "Object name?" }], description: "When the object intersects an other object" };
        ActionsBuilder.Trigger[9] = { name: "OnIntersectionExitTrigger", properties: [{ text: "parameter", value: "Object name?" }], descripton: "When the object exists intersection with an other object" };
        ActionsBuilder.Trigger[10] = { name: "OnKeyDownTrigger", properties: [{ text: "parameter:", value: "" }], description: "When the user push a key" };
        ActionsBuilder.Trigger[11] = { name: "OnKeyUpTrigger", properties: [{ text: "parameter:", value: "" }], description: "When the user pushed a key" };
        ActionsBuilder.Trigger.COUNT = 12;

        //
        // Actions (direct & interpolate)
        //
        ActionsBuilder.Action = ActionsBuilder.Action || {};
        ActionsBuilder.Action[0] = { name: "SwitchBooleanAction", properties: directActionWidthPropertyPath(), description: "Switches a boolean value for a given parameter of the target object : true to false, or false to true" };
        ActionsBuilder.Action[1] = { name: "SetStateAction", properties: directActionTemplate(null, "value"), description: "Sets a new state value of the target object (i.e \"off\" or \"on\")" };
        ActionsBuilder.Action[2] = { name: "SetValueAction", properties: directActionWidthPropertyPath([{ text: "value", value: "value?" }]), description: "Sets a new value to the specified parameter of the object" };
        ActionsBuilder.Action[3] = { name: "SetParentAction", properties: directActionTemplate([{ text: "parent", value: "object name?" }]), description: "Sets a new parent for the target object" };
        ActionsBuilder.Action[4] = { name: "IncrementValueAction", properties: directActionWidthPropertyPath([{ text: "value", value: "value?" }]), description: "Increments the value of the given parameter for the target object. The value can be negative" };
        ActionsBuilder.Action[5] = { name: "PlayAnimationAction", properties: directActionTemplate([{ text: "from", value: "0" }, { text: "to", value: "150" }, { text: "loop", value: "false" }]), description: "Plays the animation of the target object" };
        ActionsBuilder.Action[6] = { name: "StopAnimationAction", properties: directActionTemplate(), description: "Stops the animation of the target object" };
        ActionsBuilder.Action[7] = { name: "DoNothingAction", properties: [], description: "Does nothing, can be used to balance the actions graph" };
        ActionsBuilder.Action[8] = {
            name: "InterpolateValueAction", properties: directActionWidthPropertyPath([
                { text: "value", value: "value" },
                { text: "duration", value: "1000" },
                { text: "stopOtherAnimations", value: "false" }]),
            description: "Creates an animation (key frames) that animates the target object by modifying the given parameter to the target value"
        };
        ActionsBuilder.Action[9] = { name: "PlaySoundAction", properties: [{ text: "sound", value: "path to sound..." }], description: "Plays a sound giving it's path (name)" };
        ActionsBuilder.Action[10] = { name: "StopSoundAction", properties: [{ text: "sound", value: "path to sound..." }], description: "Stops a sound giving it's path (name)" };
        ActionsBuilder.Action[11] = { name: "CombineAction", properties: [], description: "Special action that combines multiple actions" };
        ActionsBuilder.Action.COUNT = 12;

        //
        // Flow Control
        //
        ActionsBuilder.FlowActionOperators = ActionsBuilder.FlowActionOperators || new Array();
        ActionsBuilder.FlowActionOperators.push("IsEqual");
        ActionsBuilder.FlowActionOperators.push("IsDifferent");
        ActionsBuilder.FlowActionOperators.push("IsGreater");
        ActionsBuilder.FlowActionOperators.push("IsLesser");

        ActionsBuilder.FlowAction = ActionsBuilder.FlowAction || {};
        ActionsBuilder.FlowAction[0] = { name: "ValueCondition", properties: directActionWidthPropertyPath([{ text: "value", value: "value?" }, { text: "operator", value: ActionsBuilder.FlowActionOperators[0] }]), description: "A condition" };
        ActionsBuilder.FlowAction[1] = { name: "StateCondition", properties: directActionTemplate([{ text: "value", value: "value?" }]), description: "A condition, true if the target object state equals the given state" };
        ActionsBuilder.FlowAction.COUNT = 2;
        ActionsBuilder.FlowAction.Hub = { name: "Hub", properties: [], description: "" };

        //
        // Utils
        //
        ActionsBuilder.GetDescriptionFromActionName = function (name) {
            for (var i = 0; i < ActionsBuilder.Trigger.COUNT; i++) {
                if (ActionsBuilder.Trigger[i].name == name)
                    return ActionsBuilder.Trigger[i].description;
            }

            for (var i = 0; i < ActionsBuilder.Action.COUNT; i++) {
                if (ActionsBuilder.Action[i].name == name)
                    return ActionsBuilder.Action[i].description;
            }

            for (var i = 0; i < ActionsBuilder.FlowAction.COUNT; i++) {
                if (ActionsBuilder.FlowAction[i].name == name)
                    return ActionsBuilder.FlowAction[i].description;
            }

        };

        return ActionsBuilder;
    })();

    AB.ActionsBuilder = ActionsBuilder;
})(AB || (AB = {}));
