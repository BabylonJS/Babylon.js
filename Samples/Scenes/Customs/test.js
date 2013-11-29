var CreateTestScene = function (engine) {
    var scene = new BABYLON.Scene(engine);
    //var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0.8, 10, BABYLON.Vector3.Zero(), scene);
    var camera = new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0, 0, -10), scene);
    var camera2 = new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0, 0, -10), scene);
    var light = new BABYLON.PointLight("Omni", new BABYLON.Vector3(20, 100, 50), scene);
    var material = new BABYLON.StandardMaterial("leaves", scene);
    var material2 = new BABYLON.StandardMaterial("kosh transparent", scene);
    var material3 = new BABYLON.StandardMaterial("kosh", scene);
    var planeMaterial = new BABYLON.StandardMaterial("plane material", scene);
    var box = BABYLON.Mesh.CreateBox("Box", 1.0, scene);
    var cylinder = BABYLON.Mesh.CreateCylinder("Cylinder", 2, 0.8, 0, 32, scene);
    var torus = BABYLON.Mesh.CreateTorus("Torus", 1.0, 0.5, 16, scene);
    var sphere = BABYLON.Mesh.CreateSphere("Sphere", 16, 3, scene);
    var plane = BABYLON.Mesh.CreatePlane("plane", 3, scene);

    camera.viewport = new BABYLON.Viewport(0.5, 0, 0.5, 1.0);
    camera2.viewport = new BABYLON.Viewport(0, 0, 0.5, 1.0);

    scene.activeCameras.push(camera);
    scene.activeCameras.push(camera2);

    //material.diffuseColor = new BABYLON.Color3(0, 0, 1);
    material.diffuseTexture = new BABYLON.Texture("Assets/Tree.png", scene);
    material.diffuseTexture.hasAlpha = true;
    material.backFaceCulling = false;
    material2.diffuseTexture = new BABYLON.Texture("Assets/kosh.jpg", scene);
    material2.alpha = 0.5;
    material2.backFaceCulling = false;
    material3.diffuseTexture = new BABYLON.Texture("Assets/kosh.jpg", scene);
    planeMaterial.backFaceCulling = false;
    var planeTexture = new BABYLON.DynamicTexture("dynamic texture", 512, scene, true);
    planeTexture.hasAlpha = true;
    planeMaterial.diffuseTexture = planeTexture;
    plane.billboardMode = BABYLON.Mesh.BILLBOARDMODE_ALL;

    box.material = material;
    cylinder.material = material3;
    torus.material = material2;
    sphere.material = material;
    plane.material = planeMaterial;
    cylinder.position.z += 13;
    cylinder.renderingGroupId = 1;
    torus.position.x -= 3;
    torus.parent = sphere;
    sphere.position.z = 3;
    plane.position = new BABYLON.Vector3(0, 7, 0);

    cylinder.parent = camera2;

    // Particles
    var particleSystem = new BABYLON.ParticleSystem("particles", 4000, scene);
    particleSystem.particleTexture = new BABYLON.Texture("Assets/Flare.png", scene);
    particleSystem.minAngularSpeed = -0.5;
    particleSystem.maxAngularSpeed = 0.5;
    particleSystem.minSize = 0.5;
    particleSystem.maxSize = 1.0;
    particleSystem.minLifeTime = 0.5;
    particleSystem.maxLifeTime = 1.0;
    particleSystem.emitter = torus;
    particleSystem.emitRate = 300;
    particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
    particleSystem.minEmitBox = new BABYLON.Vector3(0, 0.1, 0);
    particleSystem.maxEmitBox = new BABYLON.Vector3(0, -0.1, 0);
    particleSystem.gravity = new BABYLON.Vector3(0, -0.5, 0);
    particleSystem.start();

    // Mirror
    var mirror = BABYLON.Mesh.CreateBox("Mirror", 1.0, scene);
    mirror.scaling = new BABYLON.Vector3(100.0, 0.01, 100.0);
    mirror.material = new BABYLON.StandardMaterial("mirror", scene);
    mirror.material.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
    mirror.material.reflectionTexture = new BABYLON.MirrorTexture("mirror", 512, scene, true);
    mirror.material.reflectionTexture.mirrorPlane = new BABYLON.Plane(0, -1.0, 0, -5.0);
    mirror.material.reflectionTexture.renderList = [box, cylinder, torus, sphere];
    mirror.material.reflectionTexture.level = 0.5;
    mirror.position = new BABYLON.Vector3(0, -5.0, 0);
    
    // Sprites
    var spriteManager = new BABYLON.SpriteManager("MonsterA", "Assets/Player.png", 500, 64, scene);
    for (var index = 0; index < 500; index++) {
        var sprite = new BABYLON.Sprite("toto", spriteManager);
        sprite.position.y = -4.5;
        sprite.position.z = Math.random() * 20 - 10;
        sprite.position.x = Math.random() * 20 - 10;
        sprite.dir = Math.round(Math.random()) * 2 - 1;
        sprite.invertU = (sprite.dir < 0);

        sprite.playAnimation(0, 9, true, 100);

        sprite.color = new BABYLON.Color4(1, 0, 0, 1);
    }
    
    // Backgrounds
    var background0 = new BABYLON.Layer("back0", "Assets/Layer0_0.png", scene);
    var background1 = new BABYLON.Layer("back1", "Assets/Layer1_0.png", scene);
    var foreground = new BABYLON.Layer("back0", "Assets/Layer2_0.png", scene, true, new BABYLON.Color4(1, 0, 0, 1));
    
    // Import
    var spaceDek;
    BABYLON.SceneLoader.ImportMesh("Vaisseau", "Scenes/SpaceDek/", "SpaceDek.babylon", scene, function (newMeshes, particleSystems) {
        spaceDek = newMeshes[0];
        for (var index = 0; index < newMeshes.length; index++) {
            mirror.material.reflectionTexture.renderList.push(newMeshes[index]);
        }

        spaceDek.position = new BABYLON.Vector3(0, 20, 0);
        spaceDek.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
    });

    var spaceDek2;
    var spaceDek3;
    BABYLON.SceneLoader.ImportMesh("Vaisseau", "Scenes/SpaceDek/", "SpaceDek.babylon", scene, function (newMeshes) {
        spaceDek2 = newMeshes[0];
        spaceDek2.name = "Vaisseau 2";
        for (var index = 0; index < newMeshes.length; index++) {
            mirror.material.reflectionTexture.renderList.push(newMeshes[index]);
        }

        spaceDek2.position = new BABYLON.Vector3(40, 20, 0);
        spaceDek2.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);

        // Clone
        spaceDek3 = spaceDek2.clone("Vaisseau 3");
        spaceDek3.position = new BABYLON.Vector3(-50, 20, 0);
        spaceDek3.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
        mirror.material.reflectionTexture.renderList.push(spaceDek3);
        var children = spaceDek3.getDescendants();
        for (var index = 0; index < children.length; index++) {
            mirror.material.reflectionTexture.renderList.push(children[index]);
        }

        spaceDek3.material = spaceDek2.material.clone("Vaisseau 3 mat");
        
        spaceDek3.material.emissiveColor = new BABYLON.Color3(1.0, 0, 0);

        spaceDek3.infiniteDistance = true;

        scene.beginAnimation(spaceDek3, 0, 100, true, 1.0);
    });

    // Animations
    var alpha = 0;
    var frameCount = 0;
    var reloop = 0;
    var startDate = new Date();
    var count = 0;
    scene.registerBeforeRender(function () {
        box.rotation.y += 0.01;
       // cylinder.rotation.x += 0.01;
        sphere.rotation.y += 0.02;
        //  box3.scaling.y = 1 + Math.cos(alpha);
        torus.rotation.z += 0.01;
        alpha += 0.01;

        if (spaceDek) {
            spaceDek.rotation.y += 0.01;
        }

        if (spaceDek2) {
            spaceDek2.rotation.y -= 0.01;
        }

        if (spaceDek3) {
            spaceDek3.rotation.y -= 0.01;
        }
        
        if (torus.intersectsMesh(box, true)) {
            material2.alpha = 1;
            torus.scaling = new BABYLON.Vector3(2, 2, 2);
        } else {
            material2.alpha = 0.5;
            torus.scaling = new BABYLON.Vector3(1, 1, 1);
        }

        // Sprites
        frameCount++;
        if (frameCount > 3) {
            frameCount = 0;
            reloop++;
            for (var index = 0; index < spriteManager.sprites.length; index++) {
                var sprite = spriteManager.sprites[index];
                sprite.position.x -= 0.1 * sprite.dir;

                if (reloop > 20) {
                    sprite.dir *= -1;
                    sprite.invertU = !sprite.invertU;
                }
            }

            if (reloop > 20) {
                reloop = 0;
            }
        }
        
        // Update dynamic texture
        var diff = (new Date() - startDate);
        
        if (diff > 200) {
            startDate = new Date();

            var textureContext = planeTexture.getContext();
            var size = planeTexture.getSize();
            var text = count.toString();

            textureContext.clearRect(0, 0, size.width, size.height);

            textureContext.font = "bold 120px Calibri";
            var textSize = textureContext.measureText(text);
            textureContext.fillStyle = "white";
            textureContext.fillText(text, (size.width - textSize.width) / 2, (size.height - 120) / 2);

            planeTexture.update();

            count++;
        }
        
        // Background
        background0.texture.uOffset += 0.001;
    });

    return scene;
};