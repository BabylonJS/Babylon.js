var BABYLON;
(function (BABYLON) {
    var Internals;
    (function (Internals) {
        var checkColors4 = function (colors, count) {
            // Check if color3 was used
            if (colors.length === count * 3) {
                var colors4 = [];
                for (var index = 0; index < colors.length; index += 3) {
                    var newIndex = (index / 3) * 4;
                    colors4[newIndex] = colors[index];
                    colors4[newIndex + 1] = colors[index + 1];
                    colors4[newIndex + 2] = colors[index + 2];
                    colors4[newIndex + 3] = 1.0;
                }
                return colors4;
            }
            return colors;
        };
        var parseMaterialById = function (id, parsedData, scene, rootUrl) {
            for (var index = 0; index < parsedData.materials.length; index++) {
                var parsedMaterial = parsedData.materials[index];
                if (parsedMaterial.id === id) {
                    return BABYLON.Material.ParseMaterial(parsedMaterial, scene, rootUrl);
                }
            }
            return null;
        };
        var parseGeometry = function (parsedGeometry, scene) {
            var id = parsedGeometry.id;
            return scene.getGeometryByID(id);
        };
        var parseBox = function (parsedBox, scene) {
            if (parseGeometry(parsedBox, scene)) {
                return null; // null since geometry could be something else than a box...
            }
            var box = new BABYLON.Geometry.Primitives.Box(parsedBox.id, scene, parsedBox.size, parsedBox.canBeRegenerated, null);
            BABYLON.Tags.AddTagsTo(box, parsedBox.tags);
            scene.pushGeometry(box, true);
            return box;
        };
        var parseSphere = function (parsedSphere, scene) {
            if (parseGeometry(parsedSphere, scene)) {
                return null; // null since geometry could be something else than a sphere...
            }
            var sphere = new BABYLON.Geometry.Primitives.Sphere(parsedSphere.id, scene, parsedSphere.segments, parsedSphere.diameter, parsedSphere.canBeRegenerated, null);
            BABYLON.Tags.AddTagsTo(sphere, parsedSphere.tags);
            scene.pushGeometry(sphere, true);
            return sphere;
        };
        var parseCylinder = function (parsedCylinder, scene) {
            if (parseGeometry(parsedCylinder, scene)) {
                return null; // null since geometry could be something else than a cylinder...
            }
            var cylinder = new BABYLON.Geometry.Primitives.Cylinder(parsedCylinder.id, scene, parsedCylinder.height, parsedCylinder.diameterTop, parsedCylinder.diameterBottom, parsedCylinder.tessellation, parsedCylinder.subdivisions, parsedCylinder.canBeRegenerated, null);
            BABYLON.Tags.AddTagsTo(cylinder, parsedCylinder.tags);
            scene.pushGeometry(cylinder, true);
            return cylinder;
        };
        var parseTorus = function (parsedTorus, scene) {
            if (parseGeometry(parsedTorus, scene)) {
                return null; // null since geometry could be something else than a torus...
            }
            var torus = new BABYLON.Geometry.Primitives.Torus(parsedTorus.id, scene, parsedTorus.diameter, parsedTorus.thickness, parsedTorus.tessellation, parsedTorus.canBeRegenerated, null);
            BABYLON.Tags.AddTagsTo(torus, parsedTorus.tags);
            scene.pushGeometry(torus, true);
            return torus;
        };
        var parseGround = function (parsedGround, scene) {
            if (parseGeometry(parsedGround, scene)) {
                return null; // null since geometry could be something else than a ground...
            }
            var ground = new BABYLON.Geometry.Primitives.Ground(parsedGround.id, scene, parsedGround.width, parsedGround.height, parsedGround.subdivisions, parsedGround.canBeRegenerated, null);
            BABYLON.Tags.AddTagsTo(ground, parsedGround.tags);
            scene.pushGeometry(ground, true);
            return ground;
        };
        var parsePlane = function (parsedPlane, scene) {
            if (parseGeometry(parsedPlane, scene)) {
                return null; // null since geometry could be something else than a plane...
            }
            var plane = new BABYLON.Geometry.Primitives.Plane(parsedPlane.id, scene, parsedPlane.size, parsedPlane.canBeRegenerated, null);
            BABYLON.Tags.AddTagsTo(plane, parsedPlane.tags);
            scene.pushGeometry(plane, true);
            return plane;
        };
        var parseTorusKnot = function (parsedTorusKnot, scene) {
            if (parseGeometry(parsedTorusKnot, scene)) {
                return null; // null since geometry could be something else than a torusKnot...
            }
            var torusKnot = new BABYLON.Geometry.Primitives.TorusKnot(parsedTorusKnot.id, scene, parsedTorusKnot.radius, parsedTorusKnot.tube, parsedTorusKnot.radialSegments, parsedTorusKnot.tubularSegments, parsedTorusKnot.p, parsedTorusKnot.q, parsedTorusKnot.canBeRegenerated, null);
            BABYLON.Tags.AddTagsTo(torusKnot, parsedTorusKnot.tags);
            scene.pushGeometry(torusKnot, true);
            return torusKnot;
        };
        var parseVertexData = function (parsedVertexData, scene, rootUrl) {
            if (parseGeometry(parsedVertexData, scene)) {
                return null; // null since geometry could be a primitive
            }
            var geometry = new BABYLON.Geometry(parsedVertexData.id, scene);
            BABYLON.Tags.AddTagsTo(geometry, parsedVertexData.tags);
            if (parsedVertexData.delayLoadingFile) {
                geometry.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NOTLOADED;
                geometry.delayLoadingFile = rootUrl + parsedVertexData.delayLoadingFile;
                geometry._boundingInfo = new BABYLON.BoundingInfo(BABYLON.Vector3.FromArray(parsedVertexData.boundingBoxMinimum), BABYLON.Vector3.FromArray(parsedVertexData.boundingBoxMaximum));
                geometry._delayInfo = [];
                if (parsedVertexData.hasUVs) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.UVKind);
                }
                if (parsedVertexData.hasUVs2) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.UV2Kind);
                }
                if (parsedVertexData.hasUVs3) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.UV3Kind);
                }
                if (parsedVertexData.hasUVs4) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.UV4Kind);
                }
                if (parsedVertexData.hasUVs5) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.UV5Kind);
                }
                if (parsedVertexData.hasUVs6) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.UV6Kind);
                }
                if (parsedVertexData.hasColors) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.ColorKind);
                }
                if (parsedVertexData.hasMatricesIndices) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.MatricesIndicesKind);
                }
                if (parsedVertexData.hasMatricesWeights) {
                    geometry._delayInfo.push(BABYLON.VertexBuffer.MatricesWeightsKind);
                }
                geometry._delayLoadingFunction = importVertexData;
            }
            else {
                importVertexData(parsedVertexData, geometry);
            }
            scene.pushGeometry(geometry, true);
            return geometry;
        };
        var parseMesh = function (parsedMesh, scene, rootUrl) {
            var mesh = new BABYLON.Mesh(parsedMesh.name, scene);
            mesh.id = parsedMesh.id;
            BABYLON.Tags.AddTagsTo(mesh, parsedMesh.tags);
            mesh.position = BABYLON.Vector3.FromArray(parsedMesh.position);
            if (parsedMesh.rotationQuaternion) {
                mesh.rotationQuaternion = BABYLON.Quaternion.FromArray(parsedMesh.rotationQuaternion);
            }
            else if (parsedMesh.rotation) {
                mesh.rotation = BABYLON.Vector3.FromArray(parsedMesh.rotation);
            }
            mesh.scaling = BABYLON.Vector3.FromArray(parsedMesh.scaling);
            if (parsedMesh.localMatrix) {
                mesh.setPivotMatrix(BABYLON.Matrix.FromArray(parsedMesh.localMatrix));
            }
            else if (parsedMesh.pivotMatrix) {
                mesh.setPivotMatrix(BABYLON.Matrix.FromArray(parsedMesh.pivotMatrix));
            }
            mesh.setEnabled(parsedMesh.isEnabled);
            mesh.isVisible = parsedMesh.isVisible;
            mesh.infiniteDistance = parsedMesh.infiniteDistance;
            mesh.showBoundingBox = parsedMesh.showBoundingBox;
            mesh.showSubMeshesBoundingBox = parsedMesh.showSubMeshesBoundingBox;
            if (parsedMesh.applyFog !== undefined) {
                mesh.applyFog = parsedMesh.applyFog;
            }
            if (parsedMesh.pickable !== undefined) {
                mesh.isPickable = parsedMesh.pickable;
            }
            if (parsedMesh.alphaIndex !== undefined) {
                mesh.alphaIndex = parsedMesh.alphaIndex;
            }
            mesh.receiveShadows = parsedMesh.receiveShadows;
            mesh.billboardMode = parsedMesh.billboardMode;
            if (parsedMesh.visibility !== undefined) {
                mesh.visibility = parsedMesh.visibility;
            }
            mesh.checkCollisions = parsedMesh.checkCollisions;
            mesh._shouldGenerateFlatShading = parsedMesh.useFlatShading;
            // freezeWorldMatrix
            if (parsedMesh.freezeWorldMatrix) {
                mesh._waitingFreezeWorldMatrix = parsedMesh.freezeWorldMatrix;
            }
            // Parent
            if (parsedMesh.parentId) {
                mesh._waitingParentId = parsedMesh.parentId;
            }
            // Actions
            if (parsedMesh.actions !== undefined) {
                mesh._waitingActions = parsedMesh.actions;
            }
            // Geometry
            mesh.hasVertexAlpha = parsedMesh.hasVertexAlpha;
            if (parsedMesh.delayLoadingFile) {
                mesh.delayLoadState = BABYLON.Engine.DELAYLOADSTATE_NOTLOADED;
                mesh.delayLoadingFile = rootUrl + parsedMesh.delayLoadingFile;
                mesh._boundingInfo = new BABYLON.BoundingInfo(BABYLON.Vector3.FromArray(parsedMesh.boundingBoxMinimum), BABYLON.Vector3.FromArray(parsedMesh.boundingBoxMaximum));
                if (parsedMesh._binaryInfo) {
                    mesh._binaryInfo = parsedMesh._binaryInfo;
                }
                mesh._delayInfo = [];
                if (parsedMesh.hasUVs) {
                    mesh._delayInfo.push(BABYLON.VertexBuffer.UVKind);
                }
                if (parsedMesh.hasUVs2) {
                    mesh._delayInfo.push(BABYLON.VertexBuffer.UV2Kind);
                }
                if (parsedMesh.hasUVs3) {
                    mesh._delayInfo.push(BABYLON.VertexBuffer.UV3Kind);
                }
                if (parsedMesh.hasUVs4) {
                    mesh._delayInfo.push(BABYLON.VertexBuffer.UV4Kind);
                }
                if (parsedMesh.hasUVs5) {
                    mesh._delayInfo.push(BABYLON.VertexBuffer.UV5Kind);
                }
                if (parsedMesh.hasUVs6) {
                    mesh._delayInfo.push(BABYLON.VertexBuffer.UV6Kind);
                }
                if (parsedMesh.hasColors) {
                    mesh._delayInfo.push(BABYLON.VertexBuffer.ColorKind);
                }
                if (parsedMesh.hasMatricesIndices) {
                    mesh._delayInfo.push(BABYLON.VertexBuffer.MatricesIndicesKind);
                }
                if (parsedMesh.hasMatricesWeights) {
                    mesh._delayInfo.push(BABYLON.VertexBuffer.MatricesWeightsKind);
                }
                mesh._delayLoadingFunction = importGeometry;
                if (BABYLON.SceneLoader.ForceFullSceneLoadingForIncremental) {
                    mesh._checkDelayState();
                }
            }
            else {
                importGeometry(parsedMesh, mesh);
            }
            // Material
            if (parsedMesh.materialId) {
                mesh.setMaterialByID(parsedMesh.materialId);
            }
            else {
                mesh.material = null;
            }
            // Skeleton
            if (parsedMesh.skeletonId > -1) {
                mesh.skeleton = scene.getLastSkeletonByID(parsedMesh.skeletonId);
                if (parsedMesh.numBoneInfluencers) {
                    mesh.numBoneInfluencers = parsedMesh.numBoneInfluencers;
                }
            }
            // Physics
            if (parsedMesh.physicsImpostor) {
                if (!scene.isPhysicsEnabled()) {
                    scene.enablePhysics();
                }
                mesh.setPhysicsState({ impostor: parsedMesh.physicsImpostor, mass: parsedMesh.physicsMass, friction: parsedMesh.physicsFriction, restitution: parsedMesh.physicsRestitution });
            }
            // Animations
            if (parsedMesh.animations) {
                for (var animationIndex = 0; animationIndex < parsedMesh.animations.length; animationIndex++) {
                    var parsedAnimation = parsedMesh.animations[animationIndex];
                    mesh.animations.push(BABYLON.Animation.ParseAnimation(parsedAnimation));
                }
            }
            if (parsedMesh.autoAnimate) {
                scene.beginAnimation(mesh, parsedMesh.autoAnimateFrom, parsedMesh.autoAnimateTo, parsedMesh.autoAnimateLoop, 1.0);
            }
            // Layer Mask
            if (parsedMesh.layerMask && (!isNaN(parsedMesh.layerMask))) {
                mesh.layerMask = Math.abs(parseInt(parsedMesh.layerMask));
            }
            else {
                mesh.layerMask = 0x0FFFFFFF;
            }
            // Instances
            if (parsedMesh.instances) {
                for (var index = 0; index < parsedMesh.instances.length; index++) {
                    var parsedInstance = parsedMesh.instances[index];
                    var instance = mesh.createInstance(parsedInstance.name);
                    BABYLON.Tags.AddTagsTo(instance, parsedInstance.tags);
                    instance.position = BABYLON.Vector3.FromArray(parsedInstance.position);
                    if (parsedInstance.rotationQuaternion) {
                        instance.rotationQuaternion = BABYLON.Quaternion.FromArray(parsedInstance.rotationQuaternion);
                    }
                    else if (parsedInstance.rotation) {
                        instance.rotation = BABYLON.Vector3.FromArray(parsedInstance.rotation);
                    }
                    instance.scaling = BABYLON.Vector3.FromArray(parsedInstance.scaling);
                    instance.checkCollisions = mesh.checkCollisions;
                    if (parsedMesh.animations) {
                        for (animationIndex = 0; animationIndex < parsedMesh.animations.length; animationIndex++) {
                            parsedAnimation = parsedMesh.animations[animationIndex];
                            instance.animations.push(BABYLON.Animation.ParseAnimation(parsedAnimation));
                        }
                    }
                }
            }
            return mesh;
        };
        var parseActions = function (parsedActions, object, scene) {
            var actionManager = new BABYLON.ActionManager(scene);
            if (object === null)
                scene.actionManager = actionManager;
            else
                object.actionManager = actionManager;
            // instanciate a new object
            var instanciate = function (name, params) {
                var newInstance = Object.create(BABYLON[name].prototype);
                newInstance.constructor.apply(newInstance, params);
                return newInstance;
            };
            var parseParameter = function (name, value, target, propertyPath) {
                if (propertyPath === null) {
                    // String, boolean or float
                    var floatValue = parseFloat(value);
                    if (value === "true" || value === "false")
                        return value === "true";
                    else
                        return isNaN(floatValue) ? value : floatValue;
                }
                var effectiveTarget = propertyPath.split(".");
                var values = value.split(",");
                // Get effective Target
                for (var i = 0; i < effectiveTarget.length; i++) {
                    target = target[effectiveTarget[i]];
                }
                // Return appropriate value with its type
                if (typeof (target) === "boolean")
                    return values[0] === "true";
                if (typeof (target) === "string")
                    return values[0];
                // Parameters with multiple values such as Vector3 etc.
                var split = new Array();
                for (var i = 0; i < values.length; i++)
                    split.push(parseFloat(values[i]));
                if (target instanceof BABYLON.Vector3)
                    return BABYLON.Vector3.FromArray(split);
                if (target instanceof BABYLON.Vector4)
                    return BABYLON.Vector4.FromArray(split);
                if (target instanceof BABYLON.Color3)
                    return BABYLON.Color3.FromArray(split);
                if (target instanceof BABYLON.Color4)
                    return BABYLON.Color4.FromArray(split);
                return parseFloat(values[0]);
            };
            // traverse graph per trigger
            var traverse = function (parsedAction, trigger, condition, action, combineArray) {
                if (combineArray === void 0) { combineArray = null; }
                if (parsedAction.detached)
                    return;
                var parameters = new Array();
                var target = null;
                var propertyPath = null;
                var combine = parsedAction.combine && parsedAction.combine.length > 0;
                // Parameters
                if (parsedAction.type === 2)
                    parameters.push(actionManager);
                else
                    parameters.push(trigger);
                if (combine) {
                    var actions = new Array();
                    for (var j = 0; j < parsedAction.combine.length; j++) {
                        traverse(parsedAction.combine[j], BABYLON.ActionManager.NothingTrigger, condition, action, actions);
                    }
                    parameters.push(actions);
                }
                else {
                    for (var i = 0; i < parsedAction.properties.length; i++) {
                        var value = parsedAction.properties[i].value;
                        var name = parsedAction.properties[i].name;
                        var targetType = parsedAction.properties[i].targetType;
                        if (name === "target")
                            if (targetType !== null && targetType === "SceneProperties")
                                value = target = scene;
                            else
                                value = target = scene.getNodeByName(value);
                        else if (name === "parent")
                            value = scene.getNodeByName(value);
                        else if (name === "sound")
                            value = scene.getSoundByName(value);
                        else if (name !== "propertyPath") {
                            if (parsedAction.type === 2 && name === "operator")
                                value = BABYLON.ValueCondition[value];
                            else
                                value = parseParameter(name, value, target, name === "value" ? propertyPath : null);
                        }
                        else {
                            propertyPath = value;
                        }
                        parameters.push(value);
                    }
                }
                if (combineArray === null) {
                    parameters.push(condition);
                }
                else {
                    parameters.push(null);
                }
                // If interpolate value action
                if (parsedAction.name === "InterpolateValueAction") {
                    var param = parameters[parameters.length - 2];
                    parameters[parameters.length - 1] = param;
                    parameters[parameters.length - 2] = condition;
                }
                // Action or condition(s) and not CombineAction
                var newAction = instanciate(parsedAction.name, parameters);
                if (newAction instanceof BABYLON.Condition && condition !== null) {
                    var nothing = new BABYLON.DoNothingAction(trigger, condition);
                    if (action)
                        action.then(nothing);
                    else
                        actionManager.registerAction(nothing);
                    action = nothing;
                }
                if (combineArray === null) {
                    if (newAction instanceof BABYLON.Condition) {
                        condition = newAction;
                        newAction = action;
                    }
                    else {
                        condition = null;
                        if (action)
                            action.then(newAction);
                        else
                            actionManager.registerAction(newAction);
                    }
                }
                else {
                    combineArray.push(newAction);
                }
                for (var i = 0; i < parsedAction.children.length; i++)
                    traverse(parsedAction.children[i], trigger, condition, newAction, null);
            };
            // triggers
            for (var i = 0; i < parsedActions.children.length; i++) {
                var triggerParams;
                var trigger = parsedActions.children[i];
                if (trigger.properties.length > 0) {
                    var param = trigger.properties[0].value;
                    var value = trigger.properties[0].targetType === null ? param : scene.getMeshByName(param);
                    triggerParams = { trigger: BABYLON.ActionManager[trigger.name], parameter: value };
                }
                else
                    triggerParams = BABYLON.ActionManager[trigger.name];
                for (var j = 0; j < trigger.children.length; j++) {
                    if (!trigger.detached)
                        traverse(trigger.children[j], triggerParams, null, null);
                }
            }
        };
        var parseSound = function (parsedSound, scene, rootUrl) {
            var soundName = parsedSound.name;
            var soundUrl = rootUrl + soundName;
            var options = {
                autoplay: parsedSound.autoplay, loop: parsedSound.loop, volume: parsedSound.volume,
                spatialSound: parsedSound.spatialSound, maxDistance: parsedSound.maxDistance,
                rolloffFactor: parsedSound.rolloffFactor,
                refDistance: parsedSound.refDistance,
                distanceModel: parsedSound.distanceModel,
                playbackRate: parsedSound.playbackRate
            };
            var newSound = new BABYLON.Sound(soundName, soundUrl, scene, function () { scene._removePendingData(newSound); }, options);
            scene._addPendingData(newSound);
            if (parsedSound.position) {
                var soundPosition = BABYLON.Vector3.FromArray(parsedSound.position);
                newSound.setPosition(soundPosition);
            }
            if (parsedSound.isDirectional) {
                newSound.setDirectionalCone(parsedSound.coneInnerAngle || 360, parsedSound.coneOuterAngle || 360, parsedSound.coneOuterGain || 0);
                if (parsedSound.localDirectionToMesh) {
                    var localDirectionToMesh = BABYLON.Vector3.FromArray(parsedSound.localDirectionToMesh);
                    newSound.setLocalDirectionToMesh(localDirectionToMesh);
                }
            }
            if (parsedSound.connectedMeshId) {
                var connectedMesh = scene.getMeshByID(parsedSound.connectedMeshId);
                if (connectedMesh) {
                    newSound.attachToMesh(connectedMesh);
                }
            }
        };
        var isDescendantOf = function (mesh, names, hierarchyIds) {
            names = (names instanceof Array) ? names : [names];
            for (var i in names) {
                if (mesh.name === names[i]) {
                    hierarchyIds.push(mesh.id);
                    return true;
                }
            }
            if (mesh.parentId && hierarchyIds.indexOf(mesh.parentId) !== -1) {
                hierarchyIds.push(mesh.id);
                return true;
            }
            return false;
        };
        var importVertexData = function (parsedVertexData, geometry) {
            var vertexData = new BABYLON.VertexData();
            // positions
            var positions = parsedVertexData.positions;
            if (positions) {
                vertexData.set(positions, BABYLON.VertexBuffer.PositionKind);
            }
            // normals
            var normals = parsedVertexData.normals;
            if (normals) {
                vertexData.set(normals, BABYLON.VertexBuffer.NormalKind);
            }
            // uvs
            var uvs = parsedVertexData.uvs;
            if (uvs) {
                vertexData.set(uvs, BABYLON.VertexBuffer.UVKind);
            }
            // uv2s
            var uv2s = parsedVertexData.uv2s;
            if (uv2s) {
                vertexData.set(uv2s, BABYLON.VertexBuffer.UV2Kind);
            }
            // uv3s
            var uv3s = parsedVertexData.uv3s;
            if (uv3s) {
                vertexData.set(uv3s, BABYLON.VertexBuffer.UV3Kind);
            }
            // uv4s
            var uv4s = parsedVertexData.uv4s;
            if (uv4s) {
                vertexData.set(uv4s, BABYLON.VertexBuffer.UV4Kind);
            }
            // uv5s
            var uv5s = parsedVertexData.uv5s;
            if (uv5s) {
                vertexData.set(uv5s, BABYLON.VertexBuffer.UV5Kind);
            }
            // uv6s
            var uv6s = parsedVertexData.uv6s;
            if (uv6s) {
                vertexData.set(uv6s, BABYLON.VertexBuffer.UV6Kind);
            }
            // colors
            var colors = parsedVertexData.colors;
            if (colors) {
                vertexData.set(checkColors4(colors, positions.length / 3), BABYLON.VertexBuffer.ColorKind);
            }
            // matricesIndices
            var matricesIndices = parsedVertexData.matricesIndices;
            if (matricesIndices) {
                vertexData.set(matricesIndices, BABYLON.VertexBuffer.MatricesIndicesKind);
            }
            // matricesWeights
            var matricesWeights = parsedVertexData.matricesWeights;
            if (matricesWeights) {
                vertexData.set(matricesWeights, BABYLON.VertexBuffer.MatricesWeightsKind);
            }
            // indices
            var indices = parsedVertexData.indices;
            if (indices) {
                vertexData.indices = indices;
            }
            geometry.setAllVerticesData(vertexData, parsedVertexData.updatable);
        };
        var importGeometry = function (parsedGeometry, mesh) {
            var scene = mesh.getScene();
            // Geometry
            var geometryId = parsedGeometry.geometryId;
            if (geometryId) {
                var geometry = scene.getGeometryByID(geometryId);
                if (geometry) {
                    geometry.applyToMesh(mesh);
                }
            }
            else if (parsedGeometry instanceof ArrayBuffer) {
                var binaryInfo = mesh._binaryInfo;
                if (binaryInfo.positionsAttrDesc && binaryInfo.positionsAttrDesc.count > 0) {
                    var positionsData = new Float32Array(parsedGeometry, binaryInfo.positionsAttrDesc.offset, binaryInfo.positionsAttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, positionsData, false);
                }
                if (binaryInfo.normalsAttrDesc && binaryInfo.normalsAttrDesc.count > 0) {
                    var normalsData = new Float32Array(parsedGeometry, binaryInfo.normalsAttrDesc.offset, binaryInfo.normalsAttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, normalsData, false);
                }
                if (binaryInfo.uvsAttrDesc && binaryInfo.uvsAttrDesc.count > 0) {
                    var uvsData = new Float32Array(parsedGeometry, binaryInfo.uvsAttrDesc.offset, binaryInfo.uvsAttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, uvsData, false);
                }
                if (binaryInfo.uvs2AttrDesc && binaryInfo.uvs2AttrDesc.count > 0) {
                    var uvs2Data = new Float32Array(parsedGeometry, binaryInfo.uvs2AttrDesc.offset, binaryInfo.uvs2AttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV2Kind, uvs2Data, false);
                }
                if (binaryInfo.uvs3AttrDesc && binaryInfo.uvs3AttrDesc.count > 0) {
                    var uvs3Data = new Float32Array(parsedGeometry, binaryInfo.uvs3AttrDesc.offset, binaryInfo.uvs3AttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV3Kind, uvs3Data, false);
                }
                if (binaryInfo.uvs4AttrDesc && binaryInfo.uvs4AttrDesc.count > 0) {
                    var uvs4Data = new Float32Array(parsedGeometry, binaryInfo.uvs4AttrDesc.offset, binaryInfo.uvs4AttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV4Kind, uvs4Data, false);
                }
                if (binaryInfo.uvs5AttrDesc && binaryInfo.uvs5AttrDesc.count > 0) {
                    var uvs5Data = new Float32Array(parsedGeometry, binaryInfo.uvs5AttrDesc.offset, binaryInfo.uvs5AttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV5Kind, uvs5Data, false);
                }
                if (binaryInfo.uvs6AttrDesc && binaryInfo.uvs6AttrDesc.count > 0) {
                    var uvs6Data = new Float32Array(parsedGeometry, binaryInfo.uvs6AttrDesc.offset, binaryInfo.uvs6AttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV6Kind, uvs6Data, false);
                }
                if (binaryInfo.colorsAttrDesc && binaryInfo.colorsAttrDesc.count > 0) {
                    var colorsData = new Float32Array(parsedGeometry, binaryInfo.colorsAttrDesc.offset, binaryInfo.colorsAttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, colorsData, false, binaryInfo.colorsAttrDesc.stride);
                }
                if (binaryInfo.matricesIndicesAttrDesc && binaryInfo.matricesIndicesAttrDesc.count > 0) {
                    var matricesIndicesData = new Int32Array(parsedGeometry, binaryInfo.matricesIndicesAttrDesc.offset, binaryInfo.matricesIndicesAttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind, matricesIndicesData, false);
                }
                if (binaryInfo.matricesWeightsAttrDesc && binaryInfo.matricesWeightsAttrDesc.count > 0) {
                    var matricesWeightsData = new Float32Array(parsedGeometry, binaryInfo.matricesWeightsAttrDesc.offset, binaryInfo.matricesWeightsAttrDesc.count);
                    mesh.setVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind, matricesWeightsData, false);
                }
                if (binaryInfo.indicesAttrDesc && binaryInfo.indicesAttrDesc.count > 0) {
                    var indicesData = new Int32Array(parsedGeometry, binaryInfo.indicesAttrDesc.offset, binaryInfo.indicesAttrDesc.count);
                    mesh.setIndices(indicesData);
                }
                if (binaryInfo.subMeshesAttrDesc && binaryInfo.subMeshesAttrDesc.count > 0) {
                    var subMeshesData = new Int32Array(parsedGeometry, binaryInfo.subMeshesAttrDesc.offset, binaryInfo.subMeshesAttrDesc.count * 5);
                    mesh.subMeshes = [];
                    for (var i = 0; i < binaryInfo.subMeshesAttrDesc.count; i++) {
                        var materialIndex = subMeshesData[(i * 5) + 0];
                        var verticesStart = subMeshesData[(i * 5) + 1];
                        var verticesCount = subMeshesData[(i * 5) + 2];
                        var indexStart = subMeshesData[(i * 5) + 3];
                        var indexCount = subMeshesData[(i * 5) + 4];
                        var subMesh = new BABYLON.SubMesh(materialIndex, verticesStart, verticesCount, indexStart, indexCount, mesh);
                    }
                }
            }
            else if (parsedGeometry.positions && parsedGeometry.normals && parsedGeometry.indices) {
                mesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, parsedGeometry.positions, false);
                mesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, parsedGeometry.normals, false);
                if (parsedGeometry.uvs) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.UVKind, parsedGeometry.uvs, false);
                }
                if (parsedGeometry.uvs2) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV2Kind, parsedGeometry.uvs2, false);
                }
                if (parsedGeometry.uvs3) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV3Kind, parsedGeometry.uvs3, false);
                }
                if (parsedGeometry.uvs4) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV4Kind, parsedGeometry.uvs4, false);
                }
                if (parsedGeometry.uvs5) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV5Kind, parsedGeometry.uvs5, false);
                }
                if (parsedGeometry.uvs6) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.UV6Kind, parsedGeometry.uvs6, false);
                }
                if (parsedGeometry.colors) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, checkColors4(parsedGeometry.colors, parsedGeometry.positions.length / 3), false);
                }
                if (parsedGeometry.matricesIndices) {
                    if (!parsedGeometry.matricesIndices._isExpanded) {
                        var floatIndices = [];
                        for (var i = 0; i < parsedGeometry.matricesIndices.length; i++) {
                            var matricesIndex = parsedGeometry.matricesIndices[i];
                            floatIndices.push(matricesIndex & 0x000000FF);
                            floatIndices.push((matricesIndex & 0x0000FF00) >> 8);
                            floatIndices.push((matricesIndex & 0x00FF0000) >> 16);
                            floatIndices.push(matricesIndex >> 24);
                        }
                        mesh.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind, floatIndices, false);
                    }
                    else {
                        delete parsedGeometry.matricesIndices._isExpanded;
                        mesh.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind, parsedGeometry.matricesIndices, false);
                    }
                }
                if (parsedGeometry.matricesIndicesExtra) {
                    if (!parsedGeometry.matricesIndicesExtra._isExpanded) {
                        var floatIndices = [];
                        for (var i = 0; i < parsedGeometry.matricesIndicesExtra.length; i++) {
                            var matricesIndex = parsedGeometry.matricesIndicesExtra[i];
                            floatIndices.push(matricesIndex & 0x000000FF);
                            floatIndices.push((matricesIndex & 0x0000FF00) >> 8);
                            floatIndices.push((matricesIndex & 0x00FF0000) >> 16);
                            floatIndices.push(matricesIndex >> 24);
                        }
                        mesh.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesExtraKind, floatIndices, false);
                    }
                    else {
                        delete parsedGeometry.matricesIndices._isExpanded;
                        mesh.setVerticesData(BABYLON.VertexBuffer.MatricesIndicesExtraKind, parsedGeometry.matricesIndicesExtra, false);
                    }
                }
                if (parsedGeometry.matricesWeights) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind, parsedGeometry.matricesWeights, false);
                }
                if (parsedGeometry.matricesWeightsExtra) {
                    mesh.setVerticesData(BABYLON.VertexBuffer.MatricesWeightsExtraKind, parsedGeometry.matricesWeightsExtra, false);
                }
                mesh.setIndices(parsedGeometry.indices);
            }
            // SubMeshes
            if (parsedGeometry.subMeshes) {
                mesh.subMeshes = [];
                for (var subIndex = 0; subIndex < parsedGeometry.subMeshes.length; subIndex++) {
                    var parsedSubMesh = parsedGeometry.subMeshes[subIndex];
                    var subMesh = new BABYLON.SubMesh(parsedSubMesh.materialIndex, parsedSubMesh.verticesStart, parsedSubMesh.verticesCount, parsedSubMesh.indexStart, parsedSubMesh.indexCount, mesh);
                }
            }
            // Flat shading
            if (mesh._shouldGenerateFlatShading) {
                mesh.convertToFlatShadedMesh();
                delete mesh._shouldGenerateFlatShading;
            }
            // Update
            mesh.computeWorldMatrix(true);
            // Octree
            if (scene._selectionOctree) {
                scene._selectionOctree.addMesh(mesh);
            }
        };
        BABYLON.SceneLoader.RegisterPlugin({
            extensions: ".babylon",
            importMesh: function (meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons) {
                var parsedData = JSON.parse(data);
                var loadedSkeletonsIds = [];
                var loadedMaterialsIds = [];
                var hierarchyIds = [];
                var index;
                for (index = 0; index < parsedData.meshes.length; index++) {
                    var parsedMesh = parsedData.meshes[index];
                    if (!meshesNames || isDescendantOf(parsedMesh, meshesNames, hierarchyIds)) {
                        if (meshesNames instanceof Array) {
                            // Remove found mesh name from list.
                            delete meshesNames[meshesNames.indexOf(parsedMesh.name)];
                        }
                        //Geometry?
                        if (parsedMesh.geometryId) {
                            //does the file contain geometries?
                            if (parsedData.geometries) {
                                //find the correct geometry and add it to the scene
                                var found = false;
                                ["boxes", "spheres", "cylinders", "toruses", "grounds", "planes", "torusKnots", "vertexData"].forEach(function (geometryType) {
                                    if (found || !parsedData.geometries[geometryType] || !(parsedData.geometries[geometryType] instanceof Array)) {
                                        return;
                                    }
                                    else {
                                        parsedData.geometries[geometryType].forEach(function (parsedGeometryData) {
                                            if (parsedGeometryData.id == parsedMesh.geometryId) {
                                                switch (geometryType) {
                                                    case "boxes":
                                                        parseBox(parsedGeometryData, scene);
                                                        break;
                                                    case "spheres":
                                                        parseSphere(parsedGeometryData, scene);
                                                        break;
                                                    case "cylinders":
                                                        parseCylinder(parsedGeometryData, scene);
                                                        break;
                                                    case "toruses":
                                                        parseTorus(parsedGeometryData, scene);
                                                        break;
                                                    case "grounds":
                                                        parseGround(parsedGeometryData, scene);
                                                        break;
                                                    case "planes":
                                                        parsePlane(parsedGeometryData, scene);
                                                        break;
                                                    case "torusKnots":
                                                        parseTorusKnot(parsedGeometryData, scene);
                                                        break;
                                                    case "vertexData":
                                                        parseVertexData(parsedGeometryData, scene, rootUrl);
                                                        break;
                                                }
                                                found = true;
                                            }
                                        });
                                    }
                                });
                                if (!found) {
                                    BABYLON.Tools.Warn("Geometry not found for mesh " + parsedMesh.id);
                                }
                            }
                        }
                        // Material ?
                        if (parsedMesh.materialId) {
                            var materialFound = (loadedMaterialsIds.indexOf(parsedMesh.materialId) !== -1);
                            if (!materialFound && parsedData.multiMaterials) {
                                for (var multimatIndex = 0; multimatIndex < parsedData.multiMaterials.length; multimatIndex++) {
                                    var parsedMultiMaterial = parsedData.multiMaterials[multimatIndex];
                                    if (parsedMultiMaterial.id == parsedMesh.materialId) {
                                        for (var matIndex = 0; matIndex < parsedMultiMaterial.materials.length; matIndex++) {
                                            var subMatId = parsedMultiMaterial.materials[matIndex];
                                            loadedMaterialsIds.push(subMatId);
                                            parseMaterialById(subMatId, parsedData, scene, rootUrl);
                                        }
                                        loadedMaterialsIds.push(parsedMultiMaterial.id);
                                        parsedMultiMaterial.ParseMultiMaterial(parsedMultiMaterial, scene);
                                        materialFound = true;
                                        break;
                                    }
                                }
                            }
                            if (!materialFound) {
                                loadedMaterialsIds.push(parsedMesh.materialId);
                                if (!parseMaterialById(parsedMesh.materialId, parsedData, scene, rootUrl)) {
                                    BABYLON.Tools.Warn("Material not found for mesh " + parsedMesh.id);
                                }
                            }
                        }
                        // Skeleton ?
                        if (parsedMesh.skeletonId > -1 && scene.skeletons) {
                            var skeletonAlreadyLoaded = (loadedSkeletonsIds.indexOf(parsedMesh.skeletonId) > -1);
                            if (!skeletonAlreadyLoaded) {
                                for (var skeletonIndex = 0; skeletonIndex < parsedData.skeletons.length; skeletonIndex++) {
                                    var parsedSkeleton = parsedData.skeletons[skeletonIndex];
                                    if (parsedSkeleton.id === parsedMesh.skeletonId) {
                                        skeletons.push(BABYLON.Skeleton.ParseSkeleton(parsedSkeleton, scene));
                                        loadedSkeletonsIds.push(parsedSkeleton.id);
                                    }
                                }
                            }
                        }
                        var mesh = parseMesh(parsedMesh, scene, rootUrl);
                        meshes.push(mesh);
                    }
                }
                // Connecting parents
                var currentMesh;
                for (index = 0; index < scene.meshes.length; index++) {
                    currentMesh = scene.meshes[index];
                    if (currentMesh._waitingParentId) {
                        currentMesh.parent = scene.getLastEntryByID(currentMesh._waitingParentId);
                        currentMesh._waitingParentId = undefined;
                    }
                }
                // freeze world matrix application
                for (index = 0; index < scene.meshes.length; index++) {
                    currentMesh = scene.meshes[index];
                    if (currentMesh._waitingFreezeWorldMatrix) {
                        currentMesh.freezeWorldMatrix();
                        currentMesh._waitingFreezeWorldMatrix = undefined;
                    }
                }
                // Particles
                if (parsedData.particleSystems) {
                    for (index = 0; index < parsedData.particleSystems.length; index++) {
                        var parsedParticleSystem = parsedData.particleSystems[index];
                        if (hierarchyIds.indexOf(parsedParticleSystem.emitterId) !== -1) {
                            particleSystems.push(BABYLON.ParticleSystem.ParseParticleSystem(parsedParticleSystem, scene, rootUrl));
                        }
                    }
                }
                return true;
            },
            load: function (scene, data, rootUrl) {
                var parsedData = JSON.parse(data);
                // Scene
                scene.useDelayedTextureLoading = parsedData.useDelayedTextureLoading && !BABYLON.SceneLoader.ForceFullSceneLoadingForIncremental;
                scene.autoClear = parsedData.autoClear;
                scene.clearColor = BABYLON.Color3.FromArray(parsedData.clearColor);
                scene.ambientColor = BABYLON.Color3.FromArray(parsedData.ambientColor);
                if (parsedData.gravity) {
                    scene.gravity = BABYLON.Vector3.FromArray(parsedData.gravity);
                }
                // Fog
                if (parsedData.fogMode && parsedData.fogMode !== 0) {
                    scene.fogMode = parsedData.fogMode;
                    scene.fogColor = BABYLON.Color3.FromArray(parsedData.fogColor);
                    scene.fogStart = parsedData.fogStart;
                    scene.fogEnd = parsedData.fogEnd;
                    scene.fogDensity = parsedData.fogDensity;
                }
                //Physics
                if (parsedData.physicsEnabled) {
                    var physicsPlugin;
                    if (parsedData.physicsEngine === "cannon") {
                        physicsPlugin = new BABYLON.CannonJSPlugin();
                    }
                    else if (parsedData.physicsEngine === "oimo") {
                        physicsPlugin = new BABYLON.OimoJSPlugin();
                    }
                    //else - default engine, which is currently oimo
                    var physicsGravity = parsedData.physicsGravity ? BABYLON.Vector3.FromArray(parsedData.physicsGravity) : null;
                    scene.enablePhysics(physicsGravity, physicsPlugin);
                }
                //collisions, if defined. otherwise, default is true
                if (parsedData.collisionsEnabled != undefined) {
                    scene.collisionsEnabled = parsedData.collisionsEnabled;
                }
                scene.workerCollisions = !!parsedData.workerCollisions;
                // Lights
                var index;
                for (index = 0; index < parsedData.lights.length; index++) {
                    var parsedLight = parsedData.lights[index];
                    BABYLON.Light.ParseLight(parsedLight, scene);
                }
                // Materials
                if (parsedData.materials) {
                    for (index = 0; index < parsedData.materials.length; index++) {
                        var parsedMaterial = parsedData.materials[index];
                        BABYLON.Material.ParseMaterial(parsedMaterial, scene, rootUrl);
                    }
                }
                if (parsedData.multiMaterials) {
                    for (index = 0; index < parsedData.multiMaterials.length; index++) {
                        var parsedMultiMaterial = parsedData.multiMaterials[index];
                        BABYLON.MultiMaterial.ParseMultiMaterial(parsedMultiMaterial, scene);
                    }
                }
                // Skeletons
                if (parsedData.skeletons) {
                    for (index = 0; index < parsedData.skeletons.length; index++) {
                        var parsedSkeleton = parsedData.skeletons[index];
                        BABYLON.Skeleton.ParseSkeleton(parsedSkeleton, scene);
                    }
                }
                // Geometries
                var geometries = parsedData.geometries;
                if (geometries) {
                    // Boxes
                    var boxes = geometries.boxes;
                    if (boxes) {
                        for (index = 0; index < boxes.length; index++) {
                            var parsedBox = boxes[index];
                            parseBox(parsedBox, scene);
                        }
                    }
                    // Spheres
                    var spheres = geometries.spheres;
                    if (spheres) {
                        for (index = 0; index < spheres.length; index++) {
                            var parsedSphere = spheres[index];
                            parseSphere(parsedSphere, scene);
                        }
                    }
                    // Cylinders
                    var cylinders = geometries.cylinders;
                    if (cylinders) {
                        for (index = 0; index < cylinders.length; index++) {
                            var parsedCylinder = cylinders[index];
                            parseCylinder(parsedCylinder, scene);
                        }
                    }
                    // Toruses
                    var toruses = geometries.toruses;
                    if (toruses) {
                        for (index = 0; index < toruses.length; index++) {
                            var parsedTorus = toruses[index];
                            parseTorus(parsedTorus, scene);
                        }
                    }
                    // Grounds
                    var grounds = geometries.grounds;
                    if (grounds) {
                        for (index = 0; index < grounds.length; index++) {
                            var parsedGround = grounds[index];
                            parseGround(parsedGround, scene);
                        }
                    }
                    // Planes
                    var planes = geometries.planes;
                    if (planes) {
                        for (index = 0; index < planes.length; index++) {
                            var parsedPlane = planes[index];
                            parsePlane(parsedPlane, scene);
                        }
                    }
                    // TorusKnots
                    var torusKnots = geometries.torusKnots;
                    if (torusKnots) {
                        for (index = 0; index < torusKnots.length; index++) {
                            var parsedTorusKnot = torusKnots[index];
                            parseTorusKnot(parsedTorusKnot, scene);
                        }
                    }
                    // VertexData
                    var vertexData = geometries.vertexData;
                    if (vertexData) {
                        for (index = 0; index < vertexData.length; index++) {
                            var parsedVertexData = vertexData[index];
                            parseVertexData(parsedVertexData, scene, rootUrl);
                        }
                    }
                }
                // Meshes
                for (index = 0; index < parsedData.meshes.length; index++) {
                    var parsedMesh = parsedData.meshes[index];
                    parseMesh(parsedMesh, scene, rootUrl);
                }
                // Cameras
                for (index = 0; index < parsedData.cameras.length; index++) {
                    var parsedCamera = parsedData.cameras[index];
                    BABYLON.Camera.ParseCamera(parsedCamera, scene);
                }
                if (parsedData.activeCameraID) {
                    scene.setActiveCameraByID(parsedData.activeCameraID);
                }
                // Browsing all the graph to connect the dots
                for (index = 0; index < scene.cameras.length; index++) {
                    var camera = scene.cameras[index];
                    if (camera._waitingParentId) {
                        camera.parent = scene.getLastEntryByID(camera._waitingParentId);
                        camera._waitingParentId = undefined;
                    }
                }
                for (index = 0; index < scene.lights.length; index++) {
                    var light = scene.lights[index];
                    if (light._waitingParentId) {
                        light.parent = scene.getLastEntryByID(light._waitingParentId);
                        light._waitingParentId = undefined;
                    }
                }
                // Sounds
                if (BABYLON.AudioEngine && parsedData.sounds) {
                    for (index = 0; index < parsedData.sounds.length; index++) {
                        var parsedSound = parsedData.sounds[index];
                        if (BABYLON.Engine.audioEngine.canUseWebAudio) {
                            parseSound(parsedSound, scene, rootUrl);
                        }
                        else {
                            var emptySound = new BABYLON.Sound(parsedSound.name, null, scene);
                        }
                    }
                }
                // Connect parents & children and parse actions
                for (index = 0; index < scene.meshes.length; index++) {
                    var mesh = scene.meshes[index];
                    if (mesh._waitingParentId) {
                        mesh.parent = scene.getLastEntryByID(mesh._waitingParentId);
                        mesh._waitingParentId = undefined;
                    }
                    if (mesh._waitingActions) {
                        parseActions(mesh._waitingActions, mesh, scene);
                        mesh._waitingActions = undefined;
                    }
                }
                // freeze world matrix application
                for (index = 0; index < scene.meshes.length; index++) {
                    var currentMesh = scene.meshes[index];
                    if (currentMesh._waitingFreezeWorldMatrix) {
                        currentMesh.freezeWorldMatrix();
                        currentMesh._waitingFreezeWorldMatrix = undefined;
                    }
                }
                // Particles Systems
                if (parsedData.particleSystems) {
                    for (index = 0; index < parsedData.particleSystems.length; index++) {
                        var parsedParticleSystem = parsedData.particleSystems[index];
                        BABYLON.ParticleSystem.ParseParticleSystem(parsedParticleSystem, scene, rootUrl);
                    }
                }
                // Lens flares
                if (parsedData.lensFlareSystems) {
                    for (index = 0; index < parsedData.lensFlareSystems.length; index++) {
                        var parsedLensFlareSystem = parsedData.lensFlareSystems[index];
                        BABYLON.LensFlareSystem.ParseLensFlareSystem(parsedLensFlareSystem, scene, rootUrl);
                    }
                }
                // Shadows
                if (parsedData.shadowGenerators) {
                    for (index = 0; index < parsedData.shadowGenerators.length; index++) {
                        var parsedShadowGenerator = parsedData.shadowGenerators[index];
                        BABYLON.ShadowGenerator.ParseShadowGenerator(parsedShadowGenerator, scene);
                    }
                }
                // Actions (scene)
                if (parsedData.actions) {
                    parseActions(parsedData.actions, null, scene);
                }
                // Finish
                return true;
            }
        });
    })(Internals = BABYLON.Internals || (BABYLON.Internals = {}));
})(BABYLON || (BABYLON = {}));
