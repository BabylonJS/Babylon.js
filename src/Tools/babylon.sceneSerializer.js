var BABYLON;
(function (BABYLON) {
    var serializeLight = function (light) {
        var serializationObject = {};
        serializationObject.name = light.name;
        serializationObject.id = light.id;
        serializationObject.tags = BABYLON.Tags.GetTags(light);
        if (light instanceof BABYLON.PointLight) {
            serializationObject.type = 0;
            serializationObject.position = (light).position.asArray();
        }
        else if (light instanceof BABYLON.DirectionalLight) {
            serializationObject.type = 1;
            var directionalLight = light;
            serializationObject.position = directionalLight.position.asArray();
            serializationObject.direction = directionalLight.direction.asArray();
        }
        else if (light instanceof BABYLON.SpotLight) {
            serializationObject.type = 2;
            var spotLight = light;
            serializationObject.position = spotLight.position.asArray();
            serializationObject.direction = spotLight.position.asArray();
            serializationObject.angle = spotLight.angle;
            serializationObject.exponent = spotLight.exponent;
        }
        else if (light instanceof BABYLON.HemisphericLight) {
            serializationObject.type = 3;
            var hemisphericLight = light;
            serializationObject.direction = hemisphericLight.direction.asArray();
            serializationObject.groundColor = hemisphericLight.groundColor.asArray();
        }
        if (light.intensity) {
            serializationObject.intensity = light.intensity;
        }
        serializationObject.range = light.range;
        serializationObject.diffuse = light.diffuse.asArray();
        serializationObject.specular = light.specular.asArray();
        return serializationObject;
    };
    var serializeFresnelParameter = function (fresnelParameter) {
        var serializationObject = {};
        serializationObject.isEnabled = fresnelParameter.isEnabled;
        serializationObject.leftColor = fresnelParameter.leftColor;
        serializationObject.rightColor = fresnelParameter.rightColor;
        serializationObject.bias = fresnelParameter.bias;
        serializationObject.power = fresnelParameter.power;
        return serializationObject;
    };
    var serializeAnimation;
    var appendAnimations = function (source, destination) {
        if (source.animations) {
            destination.animations = [];
            for (var animationIndex = 0; animationIndex < source.animations.length; animationIndex++) {
                var animation = source.animations[animationIndex];
                destination.animations.push(serializeAnimation(animation));
            }
        }
    };
    var serializeCamera = function (camera) {
        var serializationObject = {};
        serializationObject.name = camera.name;
        serializationObject.tags = BABYLON.Tags.GetTags(camera);
        serializationObject.id = camera.id;
        serializationObject.position = camera.position.asArray();
        // Parent
        if (camera.parent) {
            serializationObject.parentId = camera.parent.id;
        }
        serializationObject.fov = camera.fov;
        serializationObject.minZ = camera.minZ;
        serializationObject.maxZ = camera.maxZ;
        serializationObject.inertia = camera.inertia;
        //setting the type
        if (camera instanceof BABYLON.FreeCamera) {
            serializationObject.type = "FreeCamera";
        }
        else if (camera instanceof BABYLON.ArcRotateCamera) {
            serializationObject.type = "ArcRotateCamera";
        }
        else if (camera instanceof BABYLON.AnaglyphArcRotateCamera) {
            serializationObject.type = "AnaglyphArcRotateCamera";
        }
        else if (camera instanceof BABYLON.GamepadCamera) {
            serializationObject.type = "GamepadCamera";
        }
        else if (camera instanceof BABYLON.AnaglyphFreeCamera) {
            serializationObject.type = "AnaglyphFreeCamera";
        }
        else if (camera instanceof BABYLON.DeviceOrientationCamera) {
            serializationObject.type = "DeviceOrientationCamera";
        }
        else if (camera instanceof BABYLON.FollowCamera) {
            serializationObject.type = "FollowCamera";
        }
        else if (camera instanceof BABYLON.TouchCamera) {
            serializationObject.type = "TouchCamera";
        }
        else if (camera instanceof BABYLON.VirtualJoysticksCamera) {
            serializationObject.type = "VirtualJoysticksCamera";
        }
        else if (camera instanceof BABYLON.WebVRFreeCamera) {
            serializationObject.type = "WebVRFreeCamera";
        }
        else if (camera instanceof BABYLON.VRDeviceOrientationFreeCamera) {
            serializationObject.type = "VRDeviceOrientationFreeCamera";
        }
        //special properties of specific cameras
        if (camera instanceof BABYLON.ArcRotateCamera || camera instanceof BABYLON.AnaglyphArcRotateCamera) {
            var arcCamera = camera;
            serializationObject.alpha = arcCamera.alpha;
            serializationObject.beta = arcCamera.beta;
            serializationObject.radius = arcCamera.radius;
            if (arcCamera.target && arcCamera.target.id) {
                serializationObject.lockedTargetId = arcCamera.target.id;
            }
        }
        else if (camera instanceof BABYLON.FollowCamera) {
            var followCam = camera;
            serializationObject.radius = followCam.radius;
            serializationObject.heightOffset = followCam.heightOffset;
            serializationObject.rotationOffset = followCam.rotationOffset;
        }
        else if (camera instanceof BABYLON.AnaglyphFreeCamera || camera instanceof BABYLON.AnaglyphArcRotateCamera) {
            //eye space is a private member and can only be access like this. Without changing the implementation this is the best way to get it.
            if (camera['_interaxialDistance'] !== undefined) {
                serializationObject.interaxial_distance = BABYLON.Tools.ToDegrees(camera['_interaxialDistance']);
            }
        }
        //general properties that not all cameras have. The [] is due to typescript's type safety
        if (camera['speed'] !== undefined) {
            serializationObject.speed = camera['speed'];
        }
        if (camera['target'] && camera['target'] instanceof BABYLON.Vector3) {
            serializationObject.target = camera['target'].asArray();
        }
        // Target
        if (camera['rotation'] && camera['rotation'] instanceof BABYLON.Vector3) {
            serializationObject.rotation = camera['rotation'].asArray();
        }
        // Locked target
        if (camera['lockedTarget'] && camera['lockedTarget'].id) {
            serializationObject.lockedTargetId = camera['lockedTarget'].id;
        }
        serializationObject.checkCollisions = camera['checkCollisions'] || false;
        serializationObject.applyGravity = camera['applyGravity'] || false;
        if (camera['ellipsoid']) {
            serializationObject.ellipsoid = camera['ellipsoid'].asArray();
        }
        // Animations
        appendAnimations(camera, serializationObject);
        // Layer mask
        serializationObject.layerMask = camera.layerMask;
        return serializationObject;
    };
    serializeAnimation = function (animation) {
        var serializationObject = {};
        serializationObject.name = animation.name;
        serializationObject.property = animation.targetProperty;
        serializationObject.framePerSecond = animation.framePerSecond;
        serializationObject.dataType = animation.dataType;
        serializationObject.loopBehavior = animation.loopMode;
        var dataType = animation.dataType;
        serializationObject.keys = [];
        var keys = animation.getKeys();
        for (var index = 0; index < keys.length; index++) {
            var animationKey = keys[index];
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
    var serializeMultiMaterial = function (material) {
        var serializationObject = {};
        serializationObject.name = material.name;
        serializationObject.id = material.id;
        serializationObject.tags = BABYLON.Tags.GetTags(material);
        serializationObject.materials = [];
        for (var matIndex = 0; matIndex < material.subMaterials.length; matIndex++) {
            var subMat = material.subMaterials[matIndex];
            if (subMat) {
                serializationObject.materials.push(subMat.id);
            }
            else {
                serializationObject.materials.push(null);
            }
        }
        return serializationObject;
    };
    var serializeTexture;
    var serializeMaterial = function (material) {
        var serializationObject = {};
        serializationObject.name = material.name;
        serializationObject.ambient = material.ambientColor.asArray();
        serializationObject.diffuse = material.diffuseColor.asArray();
        serializationObject.specular = material.specularColor.asArray();
        serializationObject.specularPower = material.specularPower;
        serializationObject.emissive = material.emissiveColor.asArray();
        serializationObject.useReflectionFresnelFromSpecular = serializationObject.useReflectionFresnelFromSpecular;
        serializationObject.useEmissiveAsIllumination = serializationObject.useEmissiveAsIllumination;
        serializationObject.alpha = material.alpha;
        serializationObject.id = material.id;
        serializationObject.tags = BABYLON.Tags.GetTags(material);
        serializationObject.backFaceCulling = material.backFaceCulling;
        if (material.diffuseTexture) {
            serializationObject.diffuseTexture = serializeTexture(material.diffuseTexture);
        }
        if (material.diffuseFresnelParameters) {
            serializationObject.diffuseFresnelParameters = serializeFresnelParameter(material.diffuseFresnelParameters);
        }
        if (material.ambientTexture) {
            serializationObject.ambientTexture = serializeTexture(material.ambientTexture);
        }
        if (material.opacityTexture) {
            serializationObject.opacityTexture = serializeTexture(material.opacityTexture);
        }
        if (material.opacityFresnelParameters) {
            serializationObject.opacityFresnelParameters = serializeFresnelParameter(material.opacityFresnelParameters);
        }
        if (material.reflectionTexture) {
            serializationObject.reflectionTexture = serializeTexture(material.reflectionTexture);
        }
        if (material.reflectionFresnelParameters) {
            serializationObject.reflectionFresnelParameters = serializeFresnelParameter(material.reflectionFresnelParameters);
        }
        if (material.emissiveTexture) {
            serializationObject.emissiveTexture = serializeTexture(material.emissiveTexture);
        }
        if (material.lightmapTexture) {
            serializationObject.lightmapTexture = serializeTexture(material.lightmapTexture);
            serializationObject.useLightmapAsShadowmap = material.useLightmapAsShadowmap;
        }
        if (material.emissiveFresnelParameters) {
            serializationObject.emissiveFresnelParameters = serializeFresnelParameter(material.emissiveFresnelParameters);
        }
        if (material.specularTexture) {
            serializationObject.specularTexture = serializeTexture(material.specularTexture);
        }
        if (material.bumpTexture) {
            serializationObject.bumpTexture = serializeTexture(material.bumpTexture);
        }
        return serializationObject;
    };
    serializeTexture = function (texture) {
        var serializationObject = {};
        if (!texture.name) {
            return null;
        }
        if (texture instanceof BABYLON.CubeTexture) {
            serializationObject.name = texture.name;
            serializationObject.hasAlpha = texture.hasAlpha;
            serializationObject.isCube = true;
            serializationObject.level = texture.level;
            serializationObject.coordinatesMode = texture.coordinatesMode;
            return serializationObject;
        }
        var index;
        if (texture instanceof BABYLON.MirrorTexture) {
            var mirrorTexture = texture;
            serializationObject.renderTargetSize = mirrorTexture.getRenderSize();
            serializationObject.renderList = [];
            for (index = 0; index < mirrorTexture.renderList.length; index++) {
                serializationObject.renderList.push(mirrorTexture.renderList[index].id);
            }
            serializationObject.mirrorPlane = mirrorTexture.mirrorPlane.asArray();
        }
        else if (texture instanceof BABYLON.RenderTargetTexture) {
            var renderTargetTexture = texture;
            serializationObject.renderTargetSize = renderTargetTexture.getRenderSize();
            serializationObject.renderList = [];
            for (index = 0; index < renderTargetTexture.renderList.length; index++) {
                serializationObject.renderList.push(renderTargetTexture.renderList[index].id);
            }
        }
        var regularTexture = texture;
        serializationObject.name = texture.name;
        serializationObject.hasAlpha = texture.hasAlpha;
        serializationObject.level = texture.level;
        serializationObject.coordinatesIndex = texture.coordinatesIndex;
        serializationObject.coordinatesMode = texture.coordinatesMode;
        serializationObject.uOffset = regularTexture.uOffset;
        serializationObject.vOffset = regularTexture.vOffset;
        serializationObject.uScale = regularTexture.uScale;
        serializationObject.vScale = regularTexture.vScale;
        serializationObject.uAng = regularTexture.uAng;
        serializationObject.vAng = regularTexture.vAng;
        serializationObject.wAng = regularTexture.wAng;
        serializationObject.wrapU = texture.wrapU;
        serializationObject.wrapV = texture.wrapV;
        // Animations
        appendAnimations(texture, serializationObject);
        return serializationObject;
    };
    var serializeSkeleton = function (skeleton) {
        var serializationObject = {};
        serializationObject.name = skeleton.name;
        serializationObject.id = skeleton.id;
        serializationObject.bones = [];
        for (var index = 0; index < skeleton.bones.length; index++) {
            var bone = skeleton.bones[index];
            var serializedBone = {
                parentBoneIndex: bone.getParent() ? skeleton.bones.indexOf(bone.getParent()) : -1,
                name: bone.name,
                matrix: bone.getLocalMatrix().toArray()
            };
            serializationObject.bones.push(serializedBone);
            if (bone.animations && bone.animations.length > 0) {
                serializedBone.animation = serializeAnimation(bone.animations[0]);
            }
        }
        return serializationObject;
    };
    var serializeParticleSystem = function (particleSystem) {
        var serializationObject = {};
        serializationObject.emitterId = particleSystem.emitter.id;
        serializationObject.capacity = particleSystem.getCapacity();
        if (particleSystem.particleTexture) {
            serializationObject.textureName = particleSystem.particleTexture.name;
        }
        serializationObject.minAngularSpeed = particleSystem.minAngularSpeed;
        serializationObject.maxAngularSpeed = particleSystem.maxAngularSpeed;
        serializationObject.minSize = particleSystem.minSize;
        serializationObject.maxSize = particleSystem.maxSize;
        serializationObject.minLifeTime = particleSystem.minLifeTime;
        serializationObject.maxLifeTime = particleSystem.maxLifeTime;
        serializationObject.emitRate = particleSystem.emitRate;
        serializationObject.minEmitBox = particleSystem.minEmitBox.asArray();
        serializationObject.maxEmitBox = particleSystem.maxEmitBox.asArray();
        serializationObject.gravity = particleSystem.gravity.asArray();
        serializationObject.direction1 = particleSystem.direction1.asArray();
        serializationObject.direction2 = particleSystem.direction2.asArray();
        serializationObject.color1 = particleSystem.color1.asArray();
        serializationObject.color2 = particleSystem.color2.asArray();
        serializationObject.colorDead = particleSystem.colorDead.asArray();
        serializationObject.updateSpeed = particleSystem.updateSpeed;
        serializationObject.targetStopDuration = particleSystem.targetStopDuration;
        serializationObject.textureMask = particleSystem.textureMask.asArray();
        serializationObject.blendMode = particleSystem.blendMode;
        return serializationObject;
    };
    var serializeLensFlareSystem = function (lensFlareSystem) {
        var serializationObject = {};
        serializationObject.emitterId = lensFlareSystem.getEmitter().id;
        serializationObject.borderLimit = lensFlareSystem.borderLimit;
        serializationObject.flares = [];
        for (var index = 0; index < lensFlareSystem.lensFlares.length; index++) {
            var flare = lensFlareSystem.lensFlares[index];
            serializationObject.flares.push({
                size: flare.size,
                position: flare.position,
                color: flare.color.asArray(),
                textureName: BABYLON.Tools.GetFilename(flare.texture.name)
            });
        }
        return serializationObject;
    };
    var serializeShadowGenerator = function (light) {
        var serializationObject = {};
        var shadowGenerator = light.getShadowGenerator();
        serializationObject.lightId = light.id;
        serializationObject.mapSize = shadowGenerator.getShadowMap().getRenderSize();
        serializationObject.useVarianceShadowMap = shadowGenerator.useVarianceShadowMap;
        serializationObject.usePoissonSampling = shadowGenerator.usePoissonSampling;
        serializationObject.renderList = [];
        for (var meshIndex = 0; meshIndex < shadowGenerator.getShadowMap().renderList.length; meshIndex++) {
            var mesh = shadowGenerator.getShadowMap().renderList[meshIndex];
            serializationObject.renderList.push(mesh.id);
        }
        return serializationObject;
    };
    var serializedGeometries = [];
    var serializeVertexData;
    var serializeTorusKnot;
    var serializePlane;
    var serializeGround;
    var serializeTorus;
    var serializeCylinder;
    var serializeSphere;
    var serializeBox;
    var serializeGeometry = function (geometry, serializationGeometries) {
        if (serializedGeometries[geometry.id]) {
            return;
        }
        if (geometry instanceof BABYLON.Geometry.Primitives.Box) {
            serializationGeometries.boxes.push(serializeBox(geometry));
        }
        else if (geometry instanceof BABYLON.Geometry.Primitives.Sphere) {
            serializationGeometries.spheres.push(serializeSphere(geometry));
        }
        else if (geometry instanceof BABYLON.Geometry.Primitives.Cylinder) {
            serializationGeometries.cylinders.push(serializeCylinder(geometry));
        }
        else if (geometry instanceof BABYLON.Geometry.Primitives.Torus) {
            serializationGeometries.toruses.push(serializeTorus(geometry));
        }
        else if (geometry instanceof BABYLON.Geometry.Primitives.Ground) {
            serializationGeometries.grounds.push(serializeGround(geometry));
        }
        else if (geometry instanceof BABYLON.Geometry.Primitives.Plane) {
            serializationGeometries.planes.push(serializePlane(geometry));
        }
        else if (geometry instanceof BABYLON.Geometry.Primitives.TorusKnot) {
            serializationGeometries.torusKnots.push(serializeTorusKnot(geometry));
        }
        else if (geometry instanceof BABYLON.Geometry.Primitives._Primitive) {
            throw new Error("Unknown primitive type");
        }
        else {
            serializationGeometries.vertexData.push(serializeVertexData(geometry));
        }
        serializedGeometries[geometry.id] = true;
    };
    var serializeGeometryBase = function (geometry) {
        var serializationObject = {};
        serializationObject.id = geometry.id;
        if (BABYLON.Tags.HasTags(geometry)) {
            serializationObject.tags = BABYLON.Tags.GetTags(geometry);
        }
        return serializationObject;
    };
    serializeVertexData = function (vertexData) {
        var serializationObject = serializeGeometryBase(vertexData);
        if (vertexData.isVerticesDataPresent(BABYLON.VertexBuffer.PositionKind)) {
            serializationObject.positions = vertexData.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        }
        if (vertexData.isVerticesDataPresent(BABYLON.VertexBuffer.NormalKind)) {
            serializationObject.normals = vertexData.getVerticesData(BABYLON.VertexBuffer.NormalKind);
        }
        if (vertexData.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
            serializationObject.uvs = vertexData.getVerticesData(BABYLON.VertexBuffer.UVKind);
        }
        if (vertexData.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
            serializationObject.uvs2 = vertexData.getVerticesData(BABYLON.VertexBuffer.UV2Kind);
        }
        if (vertexData.isVerticesDataPresent(BABYLON.VertexBuffer.UV3Kind)) {
            serializationObject.uvs3 = vertexData.getVerticesData(BABYLON.VertexBuffer.UV3Kind);
        }
        if (vertexData.isVerticesDataPresent(BABYLON.VertexBuffer.UV4Kind)) {
            serializationObject.uvs4 = vertexData.getVerticesData(BABYLON.VertexBuffer.UV4Kind);
        }
        if (vertexData.isVerticesDataPresent(BABYLON.VertexBuffer.UV5Kind)) {
            serializationObject.uvs5 = vertexData.getVerticesData(BABYLON.VertexBuffer.UV5Kind);
        }
        if (vertexData.isVerticesDataPresent(BABYLON.VertexBuffer.UV6Kind)) {
            serializationObject.uvs6 = vertexData.getVerticesData(BABYLON.VertexBuffer.UV6Kind);
        }
        if (vertexData.isVerticesDataPresent(BABYLON.VertexBuffer.ColorKind)) {
            serializationObject.colors = vertexData.getVerticesData(BABYLON.VertexBuffer.ColorKind);
        }
        if (vertexData.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesIndicesKind)) {
            serializationObject.matricesIndices = vertexData.getVerticesData(BABYLON.VertexBuffer.MatricesIndicesKind);
            serializationObject.matricesIndices._isExpanded = true;
        }
        if (vertexData.isVerticesDataPresent(BABYLON.VertexBuffer.MatricesWeightsKind)) {
            serializationObject.matricesWeights = vertexData.getVerticesData(BABYLON.VertexBuffer.MatricesWeightsKind);
        }
        serializationObject.indices = vertexData.getIndices();
        return serializationObject;
    };
    var serializePrimitive = function (primitive) {
        var serializationObject = serializeGeometryBase(primitive);
        serializationObject.canBeRegenerated = primitive.canBeRegenerated();
        return serializationObject;
    };
    serializeBox = function (box) {
        var serializationObject = serializePrimitive(box);
        serializationObject.size = box.size;
        return serializationObject;
    };
    serializeSphere = function (sphere) {
        var serializationObject = serializePrimitive(sphere);
        serializationObject.segments = sphere.segments;
        serializationObject.diameter = sphere.diameter;
        return serializationObject;
    };
    serializeCylinder = function (cylinder) {
        var serializationObject = serializePrimitive(cylinder);
        serializationObject.height = cylinder.height;
        serializationObject.diameterTop = cylinder.diameterTop;
        serializationObject.diameterBottom = cylinder.diameterBottom;
        serializationObject.tessellation = cylinder.tessellation;
        return serializationObject;
    };
    serializeTorus = function (torus) {
        var serializationObject = serializePrimitive(torus);
        serializationObject.diameter = torus.diameter;
        serializationObject.thickness = torus.thickness;
        serializationObject.tessellation = torus.tessellation;
        return serializationObject;
    };
    serializeGround = function (ground) {
        var serializationObject = serializePrimitive(ground);
        serializationObject.width = ground.width;
        serializationObject.height = ground.height;
        serializationObject.subdivisions = ground.subdivisions;
        return serializationObject;
    };
    serializePlane = function (plane) {
        var serializationObject = serializePrimitive(plane);
        serializationObject.size = plane.size;
        return serializationObject;
    };
    serializeTorusKnot = function (torusKnot) {
        var serializationObject = serializePrimitive(torusKnot);
        serializationObject.radius = torusKnot.radius;
        serializationObject.tube = torusKnot.tube;
        serializationObject.radialSegments = torusKnot.radialSegments;
        serializationObject.tubularSegments = torusKnot.tubularSegments;
        serializationObject.p = torusKnot.p;
        serializationObject.q = torusKnot.q;
        return serializationObject;
    };
    var serializeMesh = function (mesh, serializationScene) {
        var serializationObject = {};
        serializationObject.name = mesh.name;
        serializationObject.id = mesh.id;
        if (BABYLON.Tags.HasTags(mesh)) {
            serializationObject.tags = BABYLON.Tags.GetTags(mesh);
        }
        serializationObject.position = mesh.position.asArray();
        if (mesh.rotationQuaternion) {
            serializationObject.rotationQuaternion = mesh.rotationQuaternion.asArray();
        }
        else if (mesh.rotation) {
            serializationObject.rotation = mesh.rotation.asArray();
        }
        serializationObject.scaling = mesh.scaling.asArray();
        serializationObject.localMatrix = mesh.getPivotMatrix().asArray();
        serializationObject.isEnabled = mesh.isEnabled();
        serializationObject.isVisible = mesh.isVisible;
        serializationObject.infiniteDistance = mesh.infiniteDistance;
        serializationObject.pickable = mesh.isPickable;
        serializationObject.receiveShadows = mesh.receiveShadows;
        serializationObject.billboardMode = mesh.billboardMode;
        serializationObject.visibility = mesh.visibility;
        serializationObject.checkCollisions = mesh.checkCollisions;
        // Parent
        if (mesh.parent) {
            serializationObject.parentId = mesh.parent.id;
        }
        // Geometry
        var geometry = mesh._geometry;
        if (geometry) {
            var geometryId = geometry.id;
            serializationObject.geometryId = geometryId;
            if (!mesh.getScene().getGeometryByID(geometryId)) {
                // geometry was in the memory but not added to the scene, nevertheless it's better to serialize to be able to reload the mesh with its geometry
                serializeGeometry(geometry, serializationScene.geometries);
            }
            // SubMeshes
            serializationObject.subMeshes = [];
            for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                var subMesh = mesh.subMeshes[subIndex];
                serializationObject.subMeshes.push({
                    materialIndex: subMesh.materialIndex,
                    verticesStart: subMesh.verticesStart,
                    verticesCount: subMesh.verticesCount,
                    indexStart: subMesh.indexStart,
                    indexCount: subMesh.indexCount
                });
            }
        }
        // Material
        if (mesh.material) {
            serializationObject.materialId = mesh.material.id;
        }
        else {
            mesh.material = null;
        }
        // Skeleton
        if (mesh.skeleton) {
            serializationObject.skeletonId = mesh.skeleton.id;
        }
        // Physics
        if (mesh.getPhysicsImpostor() !== BABYLON.PhysicsEngine.NoImpostor) {
            serializationObject.physicsMass = mesh.getPhysicsMass();
            serializationObject.physicsFriction = mesh.getPhysicsFriction();
            serializationObject.physicsRestitution = mesh.getPhysicsRestitution();
            switch (mesh.getPhysicsImpostor()) {
                case BABYLON.PhysicsEngine.BoxImpostor:
                    serializationObject.physicsImpostor = 1;
                    break;
                case BABYLON.PhysicsEngine.SphereImpostor:
                    serializationObject.physicsImpostor = 2;
                    break;
            }
        }
        // Instances
        serializationObject.instances = [];
        for (var index = 0; index < mesh.instances.length; index++) {
            var instance = mesh.instances[index];
            var serializationInstance = {
                name: instance.name,
                position: instance.position.asArray(),
                rotation: instance.rotation.asArray(),
                rotationQuaternion: instance.rotationQuaternion.asArray(),
                scaling: instance.scaling.asArray()
            };
            serializationObject.instances.push(serializationInstance);
            // Animations
            appendAnimations(instance, serializationInstance);
        }
        // Animations
        appendAnimations(mesh, serializationObject);
        // Layer mask
        serializationObject.layerMask = mesh.layerMask;
        return serializationObject;
    };
    var finalizeSingleMesh = function (mesh, serializationObject) {
        //only works if the mesh is already loaded
        if (mesh.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADED || mesh.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_NONE) {
            //serialize material
            if (mesh.material) {
                if (mesh.material instanceof BABYLON.StandardMaterial) {
                    serializationObject.materials = serializationObject.materials || [];
                    if (!serializationObject.materials.some(function (mat) { return (mat.id === mesh.material.id); })) {
                        serializationObject.materials.push(serializeMaterial(mesh.material));
                    }
                }
                else if (mesh.material instanceof BABYLON.MultiMaterial) {
                    serializationObject.multiMaterials = serializationObject.multiMaterials || [];
                    if (!serializationObject.multiMaterials.some(function (mat) { return (mat.id === mesh.material.id); })) {
                        serializationObject.multiMaterials.push(serializeMultiMaterial(mesh.material));
                    }
                }
            }
            //serialize geometry
            var geometry = mesh._geometry;
            if (geometry) {
                if (!serializationObject.geometries) {
                    serializationObject.geometries = {};
                    serializationObject.geometries.boxes = [];
                    serializationObject.geometries.spheres = [];
                    serializationObject.geometries.cylinders = [];
                    serializationObject.geometries.toruses = [];
                    serializationObject.geometries.grounds = [];
                    serializationObject.geometries.planes = [];
                    serializationObject.geometries.torusKnots = [];
                    serializationObject.geometries.vertexData = [];
                }
                serializeGeometry(geometry, serializationObject.geometries);
            }
            // Skeletons
            if (mesh.skeleton) {
                serializationObject.skeletons = serializationObject.skeletons || [];
                serializationObject.skeletons.push(serializeSkeleton(mesh.skeleton));
            }
            //serialize the actual mesh
            serializationObject.meshes = serializationObject.meshes || [];
            serializationObject.meshes.push(serializeMesh(mesh, serializationObject));
        }
    };
    var SceneSerializer = (function () {
        function SceneSerializer() {
        }
        SceneSerializer.Serialize = function (scene) {
            var serializationObject = {};
            // Scene
            serializationObject.useDelayedTextureLoading = scene.useDelayedTextureLoading;
            serializationObject.autoClear = scene.autoClear;
            serializationObject.clearColor = scene.clearColor.asArray();
            serializationObject.ambientColor = scene.ambientColor.asArray();
            serializationObject.gravity = scene.gravity.asArray();
            serializationObject.collisionsEnabled = scene.collisionsEnabled;
            serializationObject.workerCollisions = scene.workerCollisions;
            // Fog
            if (scene.fogMode && scene.fogMode !== 0) {
                serializationObject.fogMode = scene.fogMode;
                serializationObject.fogColor = scene.fogColor.asArray();
                serializationObject.fogStart = scene.fogStart;
                serializationObject.fogEnd = scene.fogEnd;
                serializationObject.fogDensity = scene.fogDensity;
            }
            //Physics
            if (scene.isPhysicsEnabled()) {
                serializationObject.physicsEnabled = true;
                serializationObject.physicsGravity = scene.getPhysicsEngine()._getGravity().asArray();
                serializationObject.physicsEngine = scene.getPhysicsEngine().getPhysicsPluginName();
            }
            // Lights
            serializationObject.lights = [];
            var index;
            var light;
            for (index = 0; index < scene.lights.length; index++) {
                light = scene.lights[index];
                serializationObject.lights.push(serializeLight(light));
            }
            // Cameras
            serializationObject.cameras = [];
            for (index = 0; index < scene.cameras.length; index++) {
                var camera = scene.cameras[index];
                serializationObject.cameras.push(serializeCamera(camera));
            }
            if (scene.activeCamera) {
                serializationObject.activeCameraID = scene.activeCamera.id;
            }
            // Materials
            serializationObject.materials = [];
            serializationObject.multiMaterials = [];
            var material;
            for (index = 0; index < scene.materials.length; index++) {
                material = scene.materials[index];
                serializationObject.materials.push(serializeMaterial(material));
            }
            // MultiMaterials
            serializationObject.multiMaterials = [];
            for (index = 0; index < scene.multiMaterials.length; index++) {
                var multiMaterial = scene.multiMaterials[index];
                serializationObject.multiMaterials.push(serializeMultiMaterial(multiMaterial));
            }
            for (index = 0; index < scene.materials.length; index++) {
                material = scene.materials[index];
                if (material instanceof BABYLON.StandardMaterial) {
                    serializationObject.materials.push(serializeMaterial(material));
                }
                else if (material instanceof BABYLON.MultiMaterial) {
                    serializationObject.multiMaterials.push(serializeMultiMaterial(material));
                }
            }
            // Skeletons
            serializationObject.skeletons = [];
            for (index = 0; index < scene.skeletons.length; index++) {
                serializationObject.skeletons.push(serializeSkeleton(scene.skeletons[index]));
            }
            // Geometries
            serializationObject.geometries = {};
            serializationObject.geometries.boxes = [];
            serializationObject.geometries.spheres = [];
            serializationObject.geometries.cylinders = [];
            serializationObject.geometries.toruses = [];
            serializationObject.geometries.grounds = [];
            serializationObject.geometries.planes = [];
            serializationObject.geometries.torusKnots = [];
            serializationObject.geometries.vertexData = [];
            serializedGeometries = [];
            var geometries = scene.getGeometries();
            for (index = 0; index < geometries.length; index++) {
                var geometry = geometries[index];
                if (geometry.isReady()) {
                    serializeGeometry(geometry, serializationObject.geometries);
                }
            }
            // Meshes
            serializationObject.meshes = [];
            for (index = 0; index < scene.meshes.length; index++) {
                var abstractMesh = scene.meshes[index];
                if (abstractMesh instanceof BABYLON.Mesh) {
                    var mesh = abstractMesh;
                    if (mesh.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADED || mesh.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_NONE) {
                        serializationObject.meshes.push(serializeMesh(mesh, serializationObject));
                    }
                }
            }
            // Particles Systems
            serializationObject.particleSystems = [];
            for (index = 0; index < scene.particleSystems.length; index++) {
                serializationObject.particleSystems.push(serializeParticleSystem(scene.particleSystems[index]));
            }
            // Lens flares
            serializationObject.lensFlareSystems = [];
            for (index = 0; index < scene.lensFlareSystems.length; index++) {
                serializationObject.lensFlareSystems.push(serializeLensFlareSystem(scene.lensFlareSystems[index]));
            }
            // Shadows
            serializationObject.shadowGenerators = [];
            for (index = 0; index < scene.lights.length; index++) {
                light = scene.lights[index];
                if (light.getShadowGenerator()) {
                    serializationObject.shadowGenerators.push(serializeShadowGenerator(light));
                }
            }
            return serializationObject;
        };
        SceneSerializer.SerializeMesh = function (toSerialize /* Mesh || Mesh[] */, withParents, withChildren) {
            if (withParents === void 0) { withParents = false; }
            if (withChildren === void 0) { withChildren = false; }
            var serializationObject = {};
            toSerialize = (toSerialize instanceof Array) ? toSerialize : [toSerialize];
            if (withParents || withChildren) {
                //deliberate for loop! not for each, appended should be processed as well.
                for (var i = 0; i < toSerialize.length; ++i) {
                    if (withChildren) {
                        toSerialize[i].getDescendants().forEach(function (node) {
                            if (node instanceof BABYLON.Mesh && (toSerialize.indexOf(node) < 0)) {
                                toSerialize.push(node);
                            }
                        });
                    }
                    //make sure the array doesn't contain the object already
                    if (withParents && toSerialize[i].parent && (toSerialize.indexOf(toSerialize[i].parent) < 0)) {
                        toSerialize.push(toSerialize[i].parent);
                    }
                }
            }
            toSerialize.forEach(function (mesh) {
                finalizeSingleMesh(mesh, serializationObject);
            });
            return serializationObject;
        };
        return SceneSerializer;
    })();
    BABYLON.SceneSerializer = SceneSerializer;
})(BABYLON || (BABYLON = {}));
