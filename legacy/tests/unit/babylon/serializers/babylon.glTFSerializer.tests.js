/**
 * Describes the test suite
 */
describe('Babylon glTF Serializer', function () {
    var subject;
    /**
     * Loads the dependencies
     */
    before(function (done) {
        this.timeout(180000);
        (BABYLONDEVTOOLS).Loader
            .useDist()
            .testMode()
            .load(function () {
            // Force apply promise polyfill for consistent behavior between chrome headless, IE11, and other browsers.
            BABYLON.PromisePolyfill.Apply(true);
            done();
        });
    });
    /**
     * Create a null engine subject before each test.
     */
    beforeEach(function () {
        subject = new BABYLON.NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1
        });
    });
    /**
     * This tests the glTF serializer help functions
     */
    describe('#GLTF', function () {
        it('should convert Babylon standard material to metallic roughness', function () {
            var scene = new BABYLON.Scene(subject);
            var babylonStandardMaterial = new BABYLON.StandardMaterial("specGloss", scene);
            babylonStandardMaterial.diffuseColor = BABYLON.Color3.White();
            babylonStandardMaterial.specularColor = BABYLON.Color3.Black();
            babylonStandardMaterial.specularPower = 64;
            babylonStandardMaterial.alpha = 1;
            var materialExporter = new BABYLON.GLTF2.Exporter._GLTFMaterialExporter(new BABYLON.GLTF2.Exporter._Exporter(scene));
            var metalRough = materialExporter._convertToGLTFPBRMetallicRoughness(babylonStandardMaterial);
            metalRough.baseColorFactor.should.deep.equal([0.5, 0.5, 0.5, 1]);
            metalRough.metallicFactor.should.be.equal(0);
            metalRough.roughnessFactor.should.be.approximately(0.328809, 1e-6);
        });
        it('should solve for metallic', function () {
            BABYLON.GLTF2.Exporter._GLTFMaterialExporter._SolveMetallic(1.0, 0.0, 1.0).should.be.equal(0);
            BABYLON.GLTF2.Exporter._GLTFMaterialExporter._SolveMetallic(0.0, 1.0, 1.0).should.be.approximately(1, 1e-6);
        });
        it('should serialize empty Babylon scene to glTF with only asset property', function () {
            var scene = new BABYLON.Scene(subject);
            return BABYLON.GLTF2Export.GLTFAsync(scene, 'test').then(function (glTFData) {
                var jsonString = glTFData.glTFFiles['test.gltf'];
                var jsonData = JSON.parse(jsonString);
                console.error(jsonData);
                Object.keys(jsonData).length.should.be.equal(1);
                jsonData.asset.version.should.be.equal("2.0");
                jsonData.asset.generator.should.be.equal("BabylonJS");
            });
        });
        it('should serialize sphere geometry in scene to glTF', function () {
            var scene = new BABYLON.Scene(subject);
            BABYLON.MeshBuilder.CreateSphere("sphere", { segments: 16, diameter: 2 }, scene);
            return BABYLON.GLTF2Export.GLTFAsync(scene, 'test')
                .then(function (glTFData) {
                var jsonString = glTFData.glTFFiles['test.gltf'];
                var jsonData = JSON.parse(jsonString);
                // accessors, asset, buffers, bufferViews, meshes, nodes, scene, scenes
                Object.keys(jsonData).length.should.be.equal(8);
                // positions, normals, indices
                jsonData.accessors.length.should.be.equal(3);
                // generator, version
                Object.keys(jsonData.asset).length.should.be.equal(2);
                jsonData.buffers.length.should.be.equal(1);
                // positions, normals, texture coords, indices
                jsonData.bufferViews.length.should.be.equal(4);
                jsonData.meshes.length.should.be.equal(1);
                jsonData.nodes.length.should.be.equal(1);
                jsonData.scenes.length.should.be.equal(1);
                jsonData.scene.should.be.equal(0);
            });
        });
        it('should serialize single component translation animation to glTF', function () {
            var scene = new BABYLON.Scene(subject);
            var box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
            var keys = [];
            keys.push({
                frame: 0,
                value: 1
            });
            keys.push({
                frame: 20,
                value: 0.2
            });
            keys.push({
                frame: 40,
                value: 1
            });
            var animationBoxT = new BABYLON.Animation('boxAnimation_translation', 'position.y', 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            animationBoxT.setKeys(keys);
            box.animations.push(animationBoxT);
            return BABYLON.GLTF2Export.GLTFAsync(scene, 'test').then(function (glTFData) {
                var jsonString = glTFData.glTFFiles['test.gltf'];
                var jsonData = JSON.parse(jsonString);
                jsonData.animations.length.should.be.equal(1);
                var animation = jsonData.animations[0];
                animation.channels.length.should.be.equal(1);
                animation.channels[0].sampler.should.be.equal(0);
                animation.channels[0].target.node.should.be.equal(0);
                animation.channels[0].target.path.should.be.equal('translation');
                jsonData.animations[0].samplers.length.should.be.equal(1);
                // accessors, asset, buffers, bufferViews, meshes, nodes, scene, scenes, animations
                Object.keys(jsonData).length.should.be.equal(9);
                // positions, normals, indices, animation keyframe data, animation data
                jsonData.accessors.length.should.be.equal(5);
                // generator, version
                Object.keys(jsonData.asset).length.should.be.equal(2);
                jsonData.buffers.length.should.be.equal(1);
                // positions, normals, texture coords, indices, animation keyframe data, animation data
                jsonData.bufferViews.length.should.be.equal(6);
                jsonData.meshes.length.should.be.equal(1);
                jsonData.nodes.length.should.be.equal(1);
                jsonData.scenes.length.should.be.equal(1);
                jsonData.scene.should.be.equal(0);
            });
        });
        it('should serialize translation animation to glTF', function () {
            var scene = new BABYLON.Scene(subject);
            var box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
            var keys = [];
            keys.push({
                frame: 0,
                value: new BABYLON.Vector3(0.1, 0.1, 0.1)
            });
            keys.push({
                frame: 20,
                value: BABYLON.Vector3.One()
            });
            keys.push({
                frame: 40,
                value: new BABYLON.Vector3(0.1, 0.1, 0.1)
            });
            var animationBoxT = new BABYLON.Animation('boxAnimation_translation', 'position', 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            animationBoxT.setKeys(keys);
            box.animations.push(animationBoxT);
            return BABYLON.GLTF2Export.GLTFAsync(scene, 'test').then(function (glTFData) {
                var jsonString = glTFData.glTFFiles['test.gltf'];
                var jsonData = JSON.parse(jsonString);
                jsonData.animations.length.should.be.equal(1);
                var animation = jsonData.animations[0];
                animation.channels.length.should.be.equal(1);
                animation.channels[0].sampler.should.be.equal(0);
                animation.channels[0].target.node.should.be.equal(0);
                animation.channels[0].target.path.should.be.equal('translation');
                animation.samplers.length.should.be.equal(1);
                animation.samplers[0].interpolation.should.be.equal('LINEAR');
                animation.samplers[0].input.should.be.equal(3);
                animation.samplers[0].output.should.be.equal(4);
                jsonData.animations[0].samplers.length.should.be.equal(1);
                // accessors, asset, buffers, bufferViews, meshes, nodes, scene, scenes, animations
                Object.keys(jsonData).length.should.be.equal(9);
                // positions, normals, indices, animation keyframe data, animation data
                jsonData.accessors.length.should.be.equal(5);
                // generator, version
                Object.keys(jsonData.asset).length.should.be.equal(2);
                jsonData.buffers.length.should.be.equal(1);
                // positions, normals, texture coords, indices, animation keyframe data, animation data
                jsonData.bufferViews.length.should.be.equal(6);
                jsonData.meshes.length.should.be.equal(1);
                jsonData.nodes.length.should.be.equal(1);
                jsonData.scenes.length.should.be.equal(1);
                jsonData.scene.should.be.equal(0);
            });
        });
        it('should serialize scale animation to glTF', function () {
            var scene = new BABYLON.Scene(subject);
            var box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
            var keys = [];
            keys.push({
                frame: 0,
                value: new BABYLON.Vector3(0.1, 0.1, 0.1)
            });
            keys.push({
                frame: 20,
                value: BABYLON.Vector3.One()
            });
            keys.push({
                frame: 40,
                value: new BABYLON.Vector3(0.1, 0.1, 0.1)
            });
            var animationBoxT = new BABYLON.Animation('boxAnimation_translation', 'scaling', 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            animationBoxT.setKeys(keys);
            box.animations.push(animationBoxT);
            return BABYLON.GLTF2Export.GLTFAsync(scene, 'test').then(function (glTFData) {
                var jsonString = glTFData.glTFFiles['test.gltf'];
                var jsonData = JSON.parse(jsonString);
                jsonData.animations.length.should.be.equal(1);
                var animation = jsonData.animations[0];
                animation.channels.length.should.be.equal(1);
                animation.channels[0].sampler.should.be.equal(0);
                animation.channels[0].target.node.should.be.equal(0);
                animation.channels[0].target.path.should.be.equal('scale');
                animation.samplers.length.should.be.equal(1);
                animation.samplers[0].interpolation.should.be.equal('LINEAR');
                animation.samplers[0].input.should.be.equal(3);
                animation.samplers[0].output.should.be.equal(4);
                jsonData.animations[0].samplers.length.should.be.equal(1);
                // accessors, asset, buffers, bufferViews, meshes, nodes, scene, scenes, animations
                Object.keys(jsonData).length.should.be.equal(9);
                // positions, normals, indices, animation keyframe data, animation data
                jsonData.accessors.length.should.be.equal(5);
                // generator, version
                Object.keys(jsonData.asset).length.should.be.equal(2);
                jsonData.buffers.length.should.be.equal(1);
                // positions, normals, texture coords, indices, animation keyframe data, animation data
                jsonData.bufferViews.length.should.be.equal(6);
                jsonData.meshes.length.should.be.equal(1);
                jsonData.nodes.length.should.be.equal(1);
                jsonData.scenes.length.should.be.equal(1);
                jsonData.scene.should.be.equal(0);
            });
        });
        it('should serialize rotation quaternion animation to glTF', function () {
            var scene = new BABYLON.Scene(subject);
            var box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
            var keys = [];
            keys.push({
                frame: 0,
                value: new BABYLON.Quaternion(0.707, 0.0, 0.0, 0.707)
            });
            keys.push({
                frame: 20,
                value: BABYLON.Quaternion.Identity()
            });
            keys.push({
                frame: 40,
                value: new BABYLON.Quaternion(0.707, 0.0, 0.0, 0.707)
            });
            var animationBoxT = new BABYLON.Animation('boxAnimation_translation', 'rotationQuaternion', 30, BABYLON.Animation.ANIMATIONTYPE_QUATERNION, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            animationBoxT.setKeys(keys);
            box.animations.push(animationBoxT);
            return BABYLON.GLTF2Export.GLTFAsync(scene, 'test').then(function (glTFData) {
                var jsonString = glTFData.glTFFiles['test.gltf'];
                var jsonData = JSON.parse(jsonString);
                jsonData.animations.length.should.be.equal(1);
                var animation = jsonData.animations[0];
                animation.channels.length.should.be.equal(1);
                animation.channels[0].sampler.should.be.equal(0);
                animation.channels[0].target.node.should.be.equal(0);
                animation.channels[0].target.path.should.be.equal('rotation');
                animation.samplers.length.should.be.equal(1);
                animation.samplers[0].interpolation.should.be.equal('LINEAR');
                animation.samplers[0].input.should.be.equal(3);
                animation.samplers[0].output.should.be.equal(4);
                jsonData.animations[0].samplers.length.should.be.equal(1);
                // accessors, asset, buffers, bufferViews, meshes, nodes, scene, scenes, animations
                Object.keys(jsonData).length.should.be.equal(9);
                // positions, normals, indices, animation keyframe data, animation data
                jsonData.accessors.length.should.be.equal(5);
                // generator, version
                Object.keys(jsonData.asset).length.should.be.equal(2);
                jsonData.buffers.length.should.be.equal(1);
                // positions, normals, texture coords, indices, animation keyframe data, animation data
                jsonData.bufferViews.length.should.be.equal(6);
                jsonData.meshes.length.should.be.equal(1);
                jsonData.nodes.length.should.be.equal(1);
                jsonData.scenes.length.should.be.equal(1);
                jsonData.scene.should.be.equal(0);
            });
        });
        it('should serialize combined animations to glTF', function () {
            var scene = new BABYLON.Scene(subject);
            var box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
            var rotationKeyFrames = [];
            rotationKeyFrames.push({
                frame: 0,
                value: new BABYLON.Quaternion(0.707, 0.0, 0.0, 0.707)
            });
            rotationKeyFrames.push({
                frame: 20,
                value: BABYLON.Quaternion.Identity()
            });
            rotationKeyFrames.push({
                frame: 40,
                value: new BABYLON.Quaternion(0.707, 0.0, 0.0, 0.707)
            });
            var scaleKeyFrames = [];
            scaleKeyFrames.push({
                frame: 0,
                value: new BABYLON.Vector3(0.1, 0.1, 0.1)
            });
            scaleKeyFrames.push({
                frame: 20,
                value: BABYLON.Vector3.One()
            });
            scaleKeyFrames.push({
                frame: 40,
                value: new BABYLON.Vector3(0.1, 0.1, 0.1)
            });
            var rotationAnimationBox = new BABYLON.Animation('boxAnimation_rotation', 'rotationQuaternion', 30, BABYLON.Animation.ANIMATIONTYPE_QUATERNION, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            rotationAnimationBox.setKeys(rotationKeyFrames);
            box.animations.push(rotationAnimationBox);
            var scaleAnimationBox = new BABYLON.Animation('boxAnimation_scale', 'scaling', 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3, BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE);
            scaleAnimationBox.setKeys(scaleKeyFrames);
            box.animations.push(scaleAnimationBox);
            return BABYLON.GLTF2Export.GLTFAsync(scene, 'test').then(function (glTFData) {
                var jsonString = glTFData.glTFFiles['test.gltf'];
                var jsonData = JSON.parse(jsonString);
                jsonData.animations.length.should.be.equal(2);
                var animation = jsonData.animations[0];
                animation.channels.length.should.be.equal(1);
                animation.channels[0].sampler.should.be.equal(0);
                animation.channels[0].target.node.should.be.equal(0);
                animation.channels[0].target.path.should.be.equal('rotation');
                animation.samplers.length.should.be.equal(1);
                animation.samplers[0].interpolation.should.be.equal('LINEAR');
                animation.samplers[0].input.should.be.equal(3);
                animation.samplers[0].output.should.be.equal(4);
                animation = jsonData.animations[1];
                animation.channels[0].sampler.should.be.equal(0);
                animation.channels[0].target.node.should.be.equal(0);
                animation.channels[0].target.path.should.be.equal('scale');
                animation.samplers.length.should.be.equal(1);
                animation.samplers[0].interpolation.should.be.equal('LINEAR');
                animation.samplers[0].input.should.be.equal(5);
                animation.samplers[0].output.should.be.equal(6);
                // accessors, asset, buffers, bufferViews, meshes, nodes, scene, scenes, animations
                Object.keys(jsonData).length.should.be.equal(9);
                // positions, normals, indices, rotation animation keyframe data, rotation animation data, scale animation keyframe data, scale animation data
                jsonData.accessors.length.should.be.equal(7);
                // generator, version
                Object.keys(jsonData.asset).length.should.be.equal(2);
                jsonData.buffers.length.should.be.equal(1);
                // positions, normals, texture coords, indices, rotation animation keyframe data, rotation animation data, scale animation keyframe data, scale animation data 
                jsonData.bufferViews.length.should.be.equal(8);
                jsonData.meshes.length.should.be.equal(1);
                jsonData.nodes.length.should.be.equal(1);
                jsonData.scenes.length.should.be.equal(1);
                jsonData.scene.should.be.equal(0);
            });
        });
        it('should serialize point light to glTF', function () {
            var scene = new BABYLON.Scene(subject);
            var pointLight = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(4, 4, 0), scene);
            var intensity = 0.2;
            pointLight.intensity = intensity;
            var diffuseColor = BABYLON.Color3.Red();
            pointLight.diffuse = diffuseColor;
            return BABYLON.GLTF2Export.GLTFAsync(scene, 'test').then(function (glTFData) {
                var jsonString = glTFData.glTFFiles['test.gltf'];
                var jsonData = JSON.parse(jsonString);
                // assets, extensionsUsed, extensions, nodes, scenes, scene
                Object.keys(jsonData).length.should.be.equal(6);
                jsonData.extensions['KHR_lights_punctual'].lights.length.should.be.equal(1);
                jsonData.extensions['KHR_lights_punctual'].lights[0].intensity.should.be.equal(intensity);
                expect(jsonData.extensions['KHR_lights_punctual'].lights[0].color).to.deep.equal(diffuseColor.asArray());
                jsonData.nodes.length.should.be.equal(1);
                jsonData.nodes[0].extensions['KHR_lights_punctual']['light'].should.be.equal(0);
            });
        });
        it('should serialize spot light to glTF', function () {
            var scene = new BABYLON.Scene(subject);
            var spotLight = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(-4, 4, 0), new BABYLON.Vector3(0, Math.PI / 4, 0), Math.PI / 4, 2, scene);
            var intensity = 0.2;
            spotLight.intensity = intensity;
            spotLight.innerAngle = Math.PI / 8;
            var diffuseColor = BABYLON.Color3.Red();
            spotLight.diffuse = diffuseColor;
            return BABYLON.GLTF2Export.GLTFAsync(scene, 'test').then(function (glTFData) {
                var jsonString = glTFData.glTFFiles['test.gltf'];
                var jsonData = JSON.parse(jsonString);
                // assets, extensionsUsed, extensions, nodes, scenes, scene
                Object.keys(jsonData).length.should.be.equal(6);
                jsonData.extensions['KHR_lights_punctual'].lights.length.should.be.equal(1);
                jsonData.extensions['KHR_lights_punctual'].lights[0].intensity.should.be.equal(intensity);
                jsonData.extensions['KHR_lights_punctual'].lights[0].spot.outerConeAngle.should.be.equal(spotLight.angle / 2);
                jsonData.extensions['KHR_lights_punctual'].lights[0].spot.innerConeAngle.should.be.equal(spotLight.innerAngle / 2);
                expect(jsonData.extensions['KHR_lights_punctual'].lights[0].color).to.deep.equal(diffuseColor.asArray());
                jsonData.nodes.length.should.be.equal(1);
                jsonData.nodes[0].extensions['KHR_lights_punctual']['light'].should.be.equal(0);
            });
        });
        it('should serialize directional light to glTF', function () {
            var scene = new BABYLON.Scene(subject);
            var directionalLight = new BABYLON.DirectionalLight("directionalLight", BABYLON.Vector3.Forward(), scene);
            var diffuseColor = BABYLON.Color3.Red();
            directionalLight.diffuse = diffuseColor;
            var intensity = 0.2;
            directionalLight.intensity = intensity;
            return BABYLON.GLTF2Export.GLTFAsync(scene, 'test').then(function (glTFData) {
                var jsonString = glTFData.glTFFiles['test.gltf'];
                var jsonData = JSON.parse(jsonString);
                // assets, extensionsUsed, extensions, nodes, scenes, scene
                Object.keys(jsonData).length.should.be.equal(6);
                jsonData.extensions['KHR_lights_punctual'].lights.length.should.be.equal(1);
                jsonData.extensions['KHR_lights_punctual'].lights[0].intensity.should.be.equal(intensity);
                expect(jsonData.extensions['KHR_lights_punctual'].lights[0].color).to.deep.equal(diffuseColor.asArray());
                jsonData.nodes.length.should.be.equal(1);
                jsonData.nodes[0].extensions['KHR_lights_punctual']['light'].should.be.equal(0);
            });
        });
        it('should serialize multiple lights to glTF', function () {
            var scene = new BABYLON.Scene(subject);
            var pointLight = new BABYLON.PointLight("pointLight", new BABYLON.Vector3(4, 4, 0), scene);
            var spotLight = new BABYLON.SpotLight("spotLight", new BABYLON.Vector3(-4, 4, 0), new BABYLON.Vector3(0, Math.PI / 4, 0), Math.PI / 4, 2, scene);
            var directionalLight = new BABYLON.DirectionalLight("directionalLight", BABYLON.Vector3.Forward(), scene);
            return BABYLON.GLTF2Export.GLTFAsync(scene, 'test').then(function (glTFData) {
                var jsonString = glTFData.glTFFiles['test.gltf'];
                var jsonData = JSON.parse(jsonString);
                // assets, extensionsUsed, extensions, nodes, scenes, scene
                Object.keys(jsonData).length.should.be.equal(6);
                jsonData.extensions['KHR_lights_punctual'].lights.length.should.be.equal(3);
                jsonData.nodes.length.should.be.equal(3);
            });
        });
    });
});
