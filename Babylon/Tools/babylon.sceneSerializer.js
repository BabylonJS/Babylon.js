"use strict";

var BABYLON = BABYLON || {};

(function () {

    var serializeLight = function (light, serializationObject) {
        serializationObject.name = light.name;

        if (light instanceof BABYLON.PointLight) {
            serializationObject.type = 0;
            serializationObject.position = light.position.asArray();
        }
        //switch (light.type) {
        //    case 1:
        //        light = new BABYLON.DirectionalLight(parsedLight.name, BABYLON.Vector3.FromArray(parsedLight.direction), scene);
        //        light.position = BABYLON.Vector3.FromArray(parsedLight.position);
        //        break;
        //    case 2:
        //        light = new BABYLON.SpotLight(parsedLight.name, BABYLON.Vector3.FromArray(parsedLight.position), BABYLON.Vector3.FromArray(parsedLight.direction), parsedLight.angle, parsedLight.exponent, scene);
        //        break;
        //    case 3:
        //        light = new BABYLON.HemisphericLight(parsedLight.name, BABYLON.Vector3.FromArray(parsedLight.direction), scene);
        //        light.groundColor = BABYLON.Color3.FromArray(parsedLight.groundColor);
        //        break;
        //}

        serializationObject.id = light.id;

        if (light.intensity) {
            serializationObject.intensity = light.intensity;
        }
        serializationObject.diffuse = light.diffuse.asArray();
        serializationObject.specular = light.specular.asArray();
    };

    BABYLON.SceneSerializer = {
        Serialize: function (scene) {
            var serializationObject = {};

            // Scene
            serializationObject.useDelayedTextureLoading = scene.useDelayedTextureLoading;
            serializationObject.autoClear = scene.autoClear;
            serializationObject.clearColor = scene.clearColor.asArray();
            serializationObject.ambientColor = scene.ambientColor.asArray();
            serializationObject.gravity = scene.gravity.asArray();

            // Fog
            if (scene.fogMode && scene.fogMode !== 0) {
                serializationObject.fogMode = scene.fogMode;
                serializationObject.fogColor = scene.fogColor.asArray();
                serializationObject.fogStart = scene.fogStart;
                serializationObject.fogEnd = scene.fogEnd;
                serializationObject.fogDensity = scene.fogDensity;
            }

            // Lights
            serializationObject.lights = [];
            for (var index = 0; index < scene.lights.length; index++) {
                var light = scene.lights[index];
                
                var serializedLight = {};
                serializationObject.lights.push(serializedLight);

                serializeLight(light, serializedLight);
            }

            return JSON.stringify(serializationObject);
        }
    };
})();