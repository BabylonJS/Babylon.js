var CreatePhysicsScene = function(engine) {
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(0, 0, -20), scene);
    camera.checkCollisions = true;
    camera.applyGravity = true;
    
    var light = new BABYLON.DirectionalLight("dir02", new BABYLON.Vector3(0.2, -1, 0), scene);
    light.position = new BABYLON.Vector3(0, 80, 0);

    // Material
    var materialAmiga = new BABYLON.StandardMaterial("amiga", scene);
    materialAmiga.diffuseTexture = new BABYLON.Texture("assets/amiga.jpg", scene);
    materialAmiga.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    materialAmiga.diffuseTexture.uScale = 5;
    materialAmiga.diffuseTexture.vScale = 5;
    
    var materialAmiga2 = new BABYLON.StandardMaterial("amiga", scene);
    materialAmiga2.diffuseTexture = new BABYLON.Texture("assets/mosaic.jpg", scene);
    materialAmiga2.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    
    // Shadows
    var shadowGenerator = new BABYLON.ShadowGenerator(2048, light);
    shadowGenerator.getShadowMap().renderList.push(box0);

    // Physics
    scene.enablePhysics();
    
    // Spheres
    var y = 0;
    for (var index = 0; index < 32; index++) {
        var sphere = BABYLON.Mesh.CreateSphere("Sphere0", 16, 3, scene);
        sphere.material = materialAmiga;

        sphere.position = new BABYLON.Vector3(Math.random() * 20 - 10, y, Math.random() * 10 - 5);

        shadowGenerator.getShadowMap().renderList.push(sphere);
        
        sphere.setPhysicsState({ impostor: BABYLON.PhysicsEngine.SphereImpostor, mass: 1 });

        y += 2;        
    }
    
    // Link
    var spheres = [];
    for (var index = 0; index < 10; index++) {
        var sphere = BABYLON.Mesh.CreateSphere("Sphere0", 16, 1, scene);
        spheres.push(sphere);
        sphere.material = materialAmiga2;
        sphere.position = new BABYLON.Vector3(Math.random() * 20 - 10, y, Math.random() * 10 - 5);

        shadowGenerator.getShadowMap().renderList.push(sphere);

        sphere.setPhysicsState({ impostor: BABYLON.PhysicsEngine.SphereImpostor, mass: 1 });
    }

    for (var index = 0; index < 10; index++) {
        spheres[index].setPhysicsLinkWith(spheres[index + 1], new BABYLON.Vector3(0, 0.5, 0), new BABYLON.Vector3(0, -0.5, 0));
    }

    // Box
    var box0 = BABYLON.Mesh.CreateBox("Box0", 3, scene);
    box0.position = new BABYLON.Vector3(3, 30, 0);
    var materialWood = new BABYLON.StandardMaterial("wood", scene);
    materialWood.diffuseTexture = new BABYLON.Texture("assets/wood.jpg", scene);
    materialWood.emissiveColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    box0.material = materialWood;

    shadowGenerator.getShadowMap().renderList.push(box0);

    // Playground
    var ground = BABYLON.Mesh.CreateBox("Ground", 1, scene);
    ground.scaling = new BABYLON.Vector3(100, 1, 100);
    ground.position.y = -5.0;
    ground.checkCollisions = true;

    var border0 = BABYLON.Mesh.CreateBox("border0", 1, scene);
    border0.scaling = new BABYLON.Vector3(1, 100, 100);
    border0.position.y = -5.0;
    border0.position.x = -50.0;
    border0.checkCollisions = true;
    
    var border1 = BABYLON.Mesh.CreateBox("border1", 1, scene);
    border1.scaling = new BABYLON.Vector3(1, 100, 100);
    border1.position.y = -5.0;
    border1.position.x = 50.0;
    border1.checkCollisions = true;
    
    var border2 = BABYLON.Mesh.CreateBox("border2", 1, scene);
    border2.scaling = new BABYLON.Vector3(100, 100, 1);
    border2.position.y = -5.0;
    border2.position.z = 50.0;
    border2.checkCollisions = true;
    
    var border3 = BABYLON.Mesh.CreateBox("border3", 1, scene);
    border3.scaling = new BABYLON.Vector3(100, 100, 1);
    border3.position.y = -5.0;
    border3.position.z = -50.0;
    border3.checkCollisions = true;
    
    camera.setTarget(new BABYLON.Vector3(0, 0, 0));

    var groundMat = new BABYLON.StandardMaterial("groundMat", scene);
    groundMat.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    groundMat.emissiveColor = new BABYLON.Color3(0.2, 0.2, 0.2);
    ground.material = groundMat;
    border0.material = groundMat;
    border1.material = groundMat;
    border2.material = groundMat;
    border3.material = groundMat;
    ground.receiveShadows = true;
        
    // Physics
    box0.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, mass: 2, friction: 0.4, restitution: 0.3 });
    ground.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, mass: 0, friction: 0.5, restitution: 0.7 });
    border0.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, mass: 0 });
    border1.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, mass: 0 });
    border2.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, mass: 0 });
    border3.setPhysicsState({ impostor: BABYLON.PhysicsEngine.BoxImpostor, mass: 0 });
    
    return scene;
};