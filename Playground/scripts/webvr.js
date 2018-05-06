var createScene = function() {
    // Create scene
	var scene = new BABYLON.Scene(engine);

    // Create simple sphere
    var sphere = BABYLON.Mesh.CreateIcoSphere("sphere", {radius:0.2, flat:true, subdivisions: 1}, this.scene);
    sphere.position.y = 3;
    sphere.material = new BABYLON.StandardMaterial("sphere material",scene)

    // Lights and camera
    var light = new BABYLON.DirectionalLight("light", new BABYLON.Vector3(0, -0.5, 1.0), scene);
    light.position = new BABYLON.Vector3(0, 5, -2);
    var camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 4, 3, new BABYLON.Vector3(0, 3, 0), scene);
    camera.attachControl(canvas, true);
    scene.activeCamera.beta += 0.8;

    // Default Environment
    var environment = scene.createDefaultEnvironment({ enableGroundShadow: true, groundYBias: 1 });
    environment.setMainColor(BABYLON.Color3.FromHexString("#74b9ff"))
    
    // Shadows
    var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;
    shadowGenerator.addShadowCaster(sphere, true);

    // Enable VR
    var vrHelper = scene.createDefaultVRExperience({createDeviceOrientationCamera:false});
    vrHelper.enableTeleportation({floorMeshes: [environment.ground]});

    // Runs every frame to rotate the sphere
    scene.onBeforeRenderObservable.add(()=>{
        sphere.rotation.y += 0.0001*scene.getEngine().getDeltaTime();
        sphere.rotation.x += 0.0001*scene.getEngine().getDeltaTime();
    })

    // GUI
    var plane = BABYLON.Mesh.CreatePlane("plane", 1);
    plane.position = new BABYLON.Vector3(0.4, 4, 0.4)
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateForMesh(plane);
    var panel = new BABYLON.GUI.StackPanel();    
    advancedTexture.addControl(panel);  
    var header = new BABYLON.GUI.TextBlock();
    header.text = "Color GUI";
    header.height = "100px";
    header.color = "white";
    header.textHorizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    header.fontSize = "120"
    panel.addControl(header); 
    var picker = new BABYLON.GUI.ColorPicker();
    picker.value = sphere.material.diffuseColor;
    picker.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_CENTER;
    picker.height = "350px";
    picker.width = "350px";
    picker.onValueChangedObservable.add(function(value) {
        sphere.material.diffuseColor.copyFrom(value);
    });
    panel.addControl(picker);
    
	return scene;
};

var colors = {
        seaFoam: BABYLON.Color3.FromHexString("#16a085"),
        green: BABYLON.Color3.FromHexString("#27ae60"),
        blue: BABYLON.Color3.FromHexString("#2980b9"),
        purple: BABYLON.Color3.FromHexString("#8e44ad"),
        navy: BABYLON.Color3.FromHexString("#2c3e50"),
        yellow: BABYLON.Color3.FromHexString("#f39c12"),
        orange: BABYLON.Color3.FromHexString("#d35400"),
        red: BABYLON.Color3.FromHexString("#c0392b"),
        white: BABYLON.Color3.FromHexString("#bdc3c7"),
        gray: BABYLON.Color3.FromHexString("#7f8c8d")
    }