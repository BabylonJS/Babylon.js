var createScene = function () {
    var CreateBosquet = function (name, x, y, z, scene, shadowGenerator, woodMaterial, grassMaterial) {
        var bosquet = BABYLON.Mesh.CreateBox(name, 2, scene);
        bosquet.position = new BABYLON.Vector3(x, y, z);
        bosquet.material = grassMaterial;

        var bosquetbawl = BABYLON.Mesh.CreateBox(name + "bawl", 1, scene);
        bosquetbawl.position = new BABYLON.Vector3(x, y + 1, z);
        bosquetbawl.material = grassMaterial;

        shadowGenerator.getShadowMap().renderList.push(bosquet);
        shadowGenerator.getShadowMap().renderList.push(bosquetbawl);
    }

    var CreateTree = function (name, x, y, z, scene, shadowGenerator, woodMaterial, grassMaterial) {
        var trunk = BABYLON.Mesh.CreateCylinder(name + "trunk", 7, 2, 2, 12, 1, scene);
        trunk.position = new BABYLON.Vector3(x, y, z);
        trunk.material = woodMaterial;

        var leafs = BABYLON.Mesh.CreateSphere(name + "leafs", 20, 7, scene);
        leafs.position = new BABYLON.Vector3(x, y + 5.0, z);
        leafs.material = grassMaterial;

        shadowGenerator.getShadowMap().renderList.push(trunk);
        shadowGenerator.getShadowMap().renderList.push(leafs);
    }

    var createFontain = function (name, x, y, z, scene, shadowGenerator, marbleMaterial, fireMaterial) {
        var torus = BABYLON.Mesh.CreateTorus("torus", 5, 1, 20, scene);
        torus.position = new BABYLON.Vector3(x, y, z);
        torus.material = marbleMaterial;

        var fontainGround = BABYLON.Mesh.CreateBox("fontainGround", 4, scene);
        fontainGround.position = new BABYLON.Vector3(x, y - 2, z);
        fontainGround.material = marbleMaterial;

        var fontainSculptur1 = BABYLON.Mesh.CreateCylinder("fontainSculptur1", 2, 2, 1, 10, 1, scene);
        fontainSculptur1.position = new BABYLON.Vector3(x, y, z);
        fontainSculptur1.material = marbleMaterial;

        var fontainSculptur2 = BABYLON.Mesh.CreateSphere("fontainSculptur2", 7, 1.7, scene);
        fontainSculptur2.position = new BABYLON.Vector3(x, y + 0.9, z);
        fontainSculptur2.material = fireMaterial;
        fontainSculptur2.rotate(new BABYLON.Vector3(1.0, 0.0, 0.0), Math.PI / 2.0, BABYLON.Space.Local);

        shadowGenerator.getShadowMap().renderList.push(torus);
        shadowGenerator.getShadowMap().renderList.push(fontainSculptur1);
        shadowGenerator.getShadowMap().renderList.push(fontainSculptur2);
    }

    var createTorch = function (name, x, y, z, scene, shadowGenerator, brickMaterial, woodMaterial, grassMaterial) {
        //createBrickBlock
        var brickblock = BABYLON.Mesh.CreateBox(name + "brickblock", 1, scene);
        brickblock.position = new BABYLON.Vector3(x, y, z);
        brickblock.material = brickMaterial;

        //createWood
        var torchwood = BABYLON.Mesh.CreateCylinder(name + "torchwood", 2, 0.25, 0.1, 12, 1, scene);
        torchwood.position = new BABYLON.Vector3(x, y + 1, z);
        torchwood.material = woodMaterial;

        //leafs
        var leafs2 = BABYLON.Mesh.CreateSphere(name + "leafs2", 10, 1.2, scene);
        leafs2.position = new BABYLON.Vector3(x, y + 2, z);
        leafs2.material = grassMaterial;

        shadowGenerator.getShadowMap().renderList.push(torchwood);
        shadowGenerator.getShadowMap().renderList.push(leafs2);
        shadowGenerator.getShadowMap().renderList.push(brickblock);
    }

    //Ok, enough helpers, let the building start 
    var scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.ArcRotateCamera("Camera", 1, 1.2, 25, new BABYLON.Vector3(10, 0, 0), scene);
    camera.upperBetaLimit = 1.2;
    camera.attachControl(canvas, true);

    //Material declaration
    var woodMaterial = new BABYLON.StandardMaterial(name, scene);
    var woodTexture = new BABYLON.WoodProceduralTexture(name + "text", 1024, scene);
    woodTexture.ampScale = 50.0;
    woodMaterial.diffuseTexture = woodTexture;

    var grassMaterial = new BABYLON.StandardMaterial(name + "bawl", scene);
    var grassTexture = new BABYLON.GrassProceduralTexture(name + "textbawl", 256, scene);
    grassMaterial.ambientTexture = grassTexture;

    var marbleMaterial = new BABYLON.StandardMaterial("torus", scene);
    var marbleTexture = new BABYLON.MarbleProceduralTexture("marble", 512, scene);
    marbleTexture.numberOfBricksHeight = 5;
    marbleTexture.numberOfBricksWidth = 5;
    marbleMaterial.ambientTexture = marbleTexture;

    var fireMaterial = new BABYLON.StandardMaterial("fontainSculptur2", scene);
    var fireTexture = new BABYLON.FireProceduralTexture("fire", 256, scene);
    fireMaterial.diffuseTexture = fireTexture;
    fireMaterial.opacityTexture = fireTexture;

    var brickMaterial = new BABYLON.StandardMaterial(name, scene);
    var brickTexture = new BABYLON.BrickProceduralTexture(name + "text", 512, scene);
    brickTexture.numberOfBricksHeight = 2;
    brickTexture.numberOfBricksWidth = 3;
    brickMaterial.diffuseTexture = brickTexture;

    //light
    var light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(-0.5, -1, -0.5), scene);
    light.diffuse = new BABYLON.Color3(1, 1, 1);
    light.specular = new BABYLON.Color3(1, 1, 1);
    light.groundColor = new BABYLON.Color3(0, 0, 0);
    light.position = new BABYLON.Vector3(20, 40, 20);

    //Create a square of grass using a custom procedural texture
    var square = BABYLON.Mesh.CreateGround("square", 20, 20, 2, scene);
    square.position = new BABYLON.Vector3(0, 0, 0);
    var customMaterial = new BABYLON.StandardMaterial("custommat", scene);
    var customProcText = new BABYLON.CustomProceduralTexture("customtext", "./textures/customProceduralTextures/land", 1024, scene);
    customMaterial.ambientTexture = customProcText;
    square.material = customMaterial;

    //Applying some shadows
    var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    square.receiveShadows = true;

    //Creating 4 bosquets
    CreateBosquet("b1", -9, 1, 9, scene, shadowGenerator, woodMaterial, grassMaterial);
    CreateBosquet("b2", -9, 1, -9, scene, shadowGenerator, woodMaterial, grassMaterial);
    CreateBosquet("b3", 9, 1, 9, scene, shadowGenerator, woodMaterial, grassMaterial);
    CreateBosquet("b4", 9, 1, -9, scene, shadowGenerator, woodMaterial, grassMaterial);

    CreateTree("a1", 0, 3.5, 0, scene, shadowGenerator, woodMaterial, grassMaterial);

    //Creating macadam
    var macadam = BABYLON.Mesh.CreateGround("square", 20, 20, 2, scene);
    macadam.position = new BABYLON.Vector3(20, 0, 0);
    var customMaterialmacadam = new BABYLON.StandardMaterial("macadam", scene);
    var customProcTextmacadam = new BABYLON.RoadProceduralTexture("customtext", 512, scene);
    customMaterialmacadam.diffuseTexture = customProcTextmacadam;
    macadam.material = customMaterialmacadam;
    macadam.receiveShadows = true;

    //Creating a fontain
    createFontain("fontain", 20, 0.25, 0, scene, shadowGenerator, marbleMaterial, fireMaterial);
    createTorch("torch1", 15, 0.5, 5, scene, shadowGenerator, brickMaterial, woodMaterial, grassMaterial);
    createTorch("torch2", 15, 0.5, -5, scene, shadowGenerator, brickMaterial, woodMaterial, grassMaterial);
    createTorch("torch3", 25, 0.5, 5, scene, shadowGenerator, brickMaterial, woodMaterial, grassMaterial);
    createTorch("torch4", 25, 0.5, -5, scene, shadowGenerator, brickMaterial, woodMaterial, grassMaterial);

    //Using a procedural texture to create the sky
    var boxCloud = BABYLON.Mesh.CreateSphere("boxCloud", 100, 1000, scene);
    boxCloud.position = new BABYLON.Vector3(0, 0, 12);
    var cloudMaterial = new BABYLON.StandardMaterial("cloudMat", scene);
    var cloudProcText = new BABYLON.CloudProceduralTexture("cloud", 1024, scene);
    cloudMaterial.emissiveTexture = cloudProcText;
    cloudMaterial.backFaceCulling = false;
    cloudMaterial.emissiveTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    boxCloud.material = cloudMaterial;

    scene.registerBeforeRender(function () {
        camera.alpha += 0.001 * scene.getAnimationRatio();
    });

    return scene;

};

