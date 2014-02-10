"use strict";

var BABYLON = BABYLON || {};

(function () {

    var serializeLight = function (light) {
        var serializationObject = {};
        serializationObject.name = light.name;
        serializationObject.id = light.id;

        if (light instanceof BABYLON.PointLight) {
            serializationObject.type = 0;
            serializationObject.position = light.position.asArray();
        } else if (light instanceof BABYLON.DirectionalLight) {
            serializationObject.type = 1;
            serializationObject.position = light.position.asArray();
            serializationObject.direction = light.position.asArray();
        } else if (light instanceof BABYLON.SpotLight) {
            serializationObject.type = 2;
            serializationObject.position = light.position.asArray();
            serializationObject.direction = light.position.asArray();
            serializationObject.angle = light.angle;
            serializationObject.exponent = light.exponent;
        } else if (light instanceof BABYLON.HemisphericLight) {
            serializationObject.type = 2;
            serializationObject.groundColor = light.groundColor.asArray();
        }

        if (light.intensity) {
            serializationObject.intensity = light.intensity;
        }
        serializationObject.diffuse = light.diffuse.asArray();
        serializationObject.specular = light.specular.asArray();

        return serializationObject;
    };

    var serializeCamera = function (camera) {
        var serializationObject = {};
        serializationObject.name = camera.name;
        serializationObject.id = camera.id;
        serializationObject.position = camera.position.asArray();

        // Parent
        if (camera.parent) {
            serializationObject.parentId = camera.parent.id;
        }

        // Target
        serializationObject.rotation = camera.rotation.asArray();

        // Locked target
        if (camera.lockedTarget && camera.lockedTarget.id) {
            serializationObject.lockedTargetId = camera.lockedTarget.id;
        }

        serializationObject.fov = camera.fov;
        serializationObject.minZ = camera.minZ;
        serializationObject.maxZ = camera.maxZ;

        serializationObject.speed = camera.speed;
        serializationObject.inertia = camera.inertia;

        serializationObject.checkCollisions = camera.checkCollisions;
        serializationObject.applyGravity = camera.applyGravity;

        if (camera.ellipsoid) {
            serializationObject.ellipsoid = camera.ellipsoid.asArray();
        }

        // Animations
        appendAnimations(camera, serializationObject);

        return serializationObject;
    };

    var appendAnimations = function(source, destination) {
        if (source.animations) {
            destination.animations = [];
            for (var animationIndex = 0; animationIndex < source.animations.length; animationIndex++) {
                var animation = source.animations[animationIndex];

                destination.animations.push(serializeAnimation(animation));
            }
        }
    };

    var serializeAnimation = function (animation) {
        var serializationObject = {};

        serializationObject.name = animation.name;
        serializationObject.property = animation.targetProperty;
        serializationObject.framePerSecond = animation.framePerSecond;
        serializationObject.dataType = animation.dataType;
        serializationObject.loopBehavior = animation.loopBehavior;

        var dataType = animation.dataType;
        serializationObject.keys = [];
        for (var index = 0; index < animation.keys.length; index++) {
            var animationKey = animation.keys[index];

            var key = {};
            key.frame = animationKey.frame;

            switch (dataType) {
                case BABYLON.Animation.ANIMATIONTYPE_FLOAT:
                    key.values = [animationKey.value];
                    break;
                case BABYLON.Animation.ANIMATIONTYPE_QUATERNION:
                case BABYLON.Animation.ANIMATIONTYPE_MATRIX:
                case BABYLON.Animation.ANIMATIONTYPE_VECTOR3:
                    key.values = animationKey.value.asArray();
                    break;
            }

            serializationObject.keys.push(key);
        }

        return serializationObject;
    };

    var serializeMaterial = function (material) {
        var serializationObject = {};

        serializationObject.name = material.name;

        serializationObject.ambient = material.ambientColor.asArray();
        serializationObject.diffuse = material.diffuseColor.asArray();
        serializationObject.specular = material.specularColor.asArray();
        serializationObject.specularPower = material.specularPower;
        serializationObject.emissive = material.emissiveColor.asArray();

        serializationObject.alpha = material.alpha;

        serializationObject.id = material.id;
        serializationObject.backFaceCulling = material.backFaceCulling;

        if (material.diffuseTexture) {
            serializationObject.diffuseTexture = serializeTexture(material.diffuseTexture);
        }

        if (material.ambientTexture) {
            serializationObject.ambientTexture = serializeTexture(material.ambientTexture);
        }

        if (material.opacityTexture) {
            serializationObject.opacityTexture = serializeTexture(material.opacityTexture);
        }

        if (material.reflectionTexture) {
            serializationObject.reflectionTexture = serializeTexture(material.reflectionTexture);
        }

        if (material.emissiveTexture) {
            serializationObject.emissiveTexture = serializeTexture(material.emissiveTexture);
        }

        if (material.specularTexture) {
            serializationObject.specularTexture = serializeTexture(material.specularTexture);
        }

        if (material.bumpTexture) {
            serializationObject.bumpTexture = serializeTexture(material.bumpTexture);
        }

        return serializationObject;
    };

    var serializeTexture = function (texture) {
        var serializationObject = {};

        if (!texture.name) {
            return null;
        }

        if (texture instanceof BABYLON.CubeTexture) {
            serializationObject.name = texture.name;
            serializationObject.hasAlpha = texture.hasAlpha;
            serializationObject.level = texture.level;
            serializationObject.coordinatesMode = texture.coordinatesMode;

            return serializationObject;
        }

        if (texture instanceof BABYLON.MirrorTexture) {
            serializationObject.renderTargetSize = texture.renderTargetSize;
            serializationObject.renderList = [];

            for (var index = 0; index < texture.renderList.length; index++) {
                serializationObject.renderList.push(texture.renderList[index].id);
            }

            serializationObject.mirrorPlane = texture.mirrorPlane.asArray();
        } else if (texture instanceof BABYLON.RenderTargetTexture) {
            serializationObject.renderTargetSize = texture.renderTargetSize;
            serializationObject.renderList = [];

            for (var index = 0; index < texture.renderList.length; index++) {
                serializationObject.renderList.push(texture.renderList[index].id);
            }
        }

        serializationObject.name = texture.name;
        serializationObject.hasAlpha = texture.hasAlpha;
        serializationObject.level = texture.level;

        serializationObject.coordinatesIndex = texture.coordinatesIndex;
        serializationObject.coordinatesMode = texture.coordinatesMode;
        serializationObject.uOffset = texture.uOffset;
        serializationObject.vOffset = texture.vOffset;
        serializationObject.uScale = texture.uScale;
        serializationObject.vScale = texture.vScale;
        serializationObject.uAng = texture.uAng;
        serializationObject.vAng = texture.vAng;
        serializationObject.wAng = texture.wAng;

        serializationObject.wrapU = texture.wrapU;
        serializationObject.wrapV = texture.wrapV;

        // Animations
        appendAnimations(texture, serializationObject);

        return serializationObject;
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
                
                serializationObject.lights.push(serializeLight(light));
            }

            // Cameras
            serializationObject.cameras = [];
            for (var index = 0; index < scene.cameras.length; index++) {
                var camera = scene.cameras[index];

                serializationObject.cameras.push(serializeCamera(camera));
            }
            if (scene.activecamera) {
                serializationObject.activeCameraID = scene.activeCamera.id;
            }

            // Materials
            serializationObject.materials = [];
            for (var index = 0; index < scene.materials.length; index++) {
                var material = scene.materials[index];

                serializationObject.materials.push(serializeMaterial(material));
            }

            return serializationObject;
        }
    };
})();