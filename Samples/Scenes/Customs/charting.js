var CreateChartingTestScene = function (engine) {
    var scene = new BABYLON.Scene(engine);
    var light = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -0.5, 1.0), scene);
    var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 10, BABYLON.Vector3.Zero(), scene);
    camera.setPosition(new BABYLON.Vector3(20, 70, -100));
    light.position = new BABYLON.Vector3(0, 25, -50);
    
    // Data
    var scale = 0.6;
    var operatingSystem_Series = [
        { label: "Macintosh", value: 12, color: new BABYLON.Color3(0, 1, 0) },
        { label: "Windows", value: 77, color: new BABYLON.Color3(1, 0, 0) },
        { label: "Linux", value: 4, color: new BABYLON.Color3(1, 0, 1) },
        { label: "iOS", value: 3, color: new BABYLON.Color3(1, 1, 0) },
        { label: "Android", value: 2, color: new BABYLON.Color3(0, 0, 1) },
        { label: "Win Phone", value: 1, color: new BABYLON.Color3(1, 1, 1) }
    ];
    
    var browsers_Series = [
        { label: "IE", value: 32, color: new BABYLON.Color3(0, 0, 1) },
        { label: "Chrome", value: 28, color: new BABYLON.Color3(1, 0, 0) },
        { label: "Firefox", value: 16, color: new BABYLON.Color3(1, 0, 1) },
        { label: "Opera", value: 14, color: new BABYLON.Color3(1, 1, 0) },
        { label: "Safari", value: 10, color: new BABYLON.Color3(0, 1, 1) }        
    ];
    
    var playgroundSize = 100;
    // Background
    var background = BABYLON.Mesh.CreatePlane("background", playgroundSize, scene, false);
    background.material = new BABYLON.StandardMaterial("background", scene);
    background.scaling.y = 0.5;
    background.position.z = playgroundSize / 2 - 0.5;
    background.position.y = playgroundSize / 4;
    background.receiveShadows = true;
    var backgroundTexture = new BABYLON.DynamicTexture("dynamic texture", 512, scene, true);
    background.material.diffuseTexture = backgroundTexture;
    background.material.specularColor = new BABYLON.Color3(0, 0, 0);
    background.material.backFaceCulling = false;

    backgroundTexture.drawText("Eternalcoding", null, 80, "bold 70px Segoe UI", "white", "#555555");
    backgroundTexture.drawText("- browsers statistics -", null, 250, "35px Segoe UI", "white", null);
    //background.material.reflectionTexture = new BABYLON.MirrorTexture("mirror", 1024, scene, true);
    //background.material.reflectionTexture.mirrorPlane = new BABYLON.Plane(0, 0, 1.0, -playgroundSize / 2 + 0.5);
    //background.material.reflectionTexture.level = 0.5;

    // Ground    
    var ground = BABYLON.Mesh.CreateGround("ground", playgroundSize, playgroundSize, 1, scene, false);
    var groundMaterial = new BABYLON.StandardMaterial("ground", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
    ground.material = groundMaterial;
    ground.receiveShadows = true;
    ground.position.y = -0.1;
    //background.material.reflectionTexture.renderList.push(ground);
    
    var shadowGenerator = new BABYLON.ShadowGenerator(1024, light);
    
    var createSeries = function (series) {
        var margin = 2;
        var offset = playgroundSize / (series.length) - margin;
        var x = -playgroundSize / 2 + offset / 2;

        for (var index = 0; index < series.length; index++) {
            var data = series[index];

            var bar = BABYLON.Mesh.CreateBox(data.label, 1.0, scene, false);
            bar.scaling = new BABYLON.Vector3(offset / 2.0, 0, offset / 2.0);
            bar.position.x = x;
            bar.position.y = 0;
            
            // Animate a bit
            var animation = new BABYLON.Animation("anim", "scaling", 30, BABYLON.Animation.ANIMATIONTYPE_VECTOR3);
            animation.setKeys([
                { frame: 0, value: new BABYLON.Vector3(offset / 2.0, 0, offset / 2.0) },
                { frame: 100, value: new BABYLON.Vector3(offset / 2.0, data.value * scale, offset / 2.0) }]);
            bar.animations.push(animation);
            
            animation = new BABYLON.Animation("anim2", "position.y", 30, BABYLON.Animation.ANIMATIONTYPE_FLOAT);
            animation.setKeys([
                { frame: 0, value: 0 },
                { frame: 100, value: (data.value * scale) / 2 }]);
            bar.animations.push(animation);            
            scene.beginAnimation(bar, 0, 100, false, 2.0);

            // Material
            bar.material = new BABYLON.StandardMaterial(data.label + "mat", scene);
            bar.material.diffuseColor = data.color;
            bar.material.emissiveColor = data.color.scale(0.3);
            bar.material.specularColor = new BABYLON.Color3(0, 0, 0);

            // Shadows
            shadowGenerator.getShadowMap().renderList.push(bar);
            
            // Mirror
          //  background.material.reflectionTexture.renderList.push(bar);
            
            // Legend
            var barLegend = BABYLON.Mesh.CreateGround(data.label + "Legend", playgroundSize / 2, offset * 2, 1, scene, false);
            barLegend.position.x = x;
            barLegend.position.z = -playgroundSize / 4;
            barLegend.rotation.y = Math.PI / 2;
            
            barLegend.material = new BABYLON.StandardMaterial(data.label + "LegendMat", scene);
            var barLegendTexture = new BABYLON.DynamicTexture("dynamic texture", 512, scene, true);
            barLegendTexture.hasAlpha = true;
            barLegend.material.diffuseTexture = barLegendTexture;
            barLegend.material.emissiveColor = new BABYLON.Color3(0.4, 0.4, 0.4);
            
            var size = barLegendTexture.getSize();
            barLegendTexture.drawText(data.label + " (" + data.value + "%)", 80, size.height / 2 + 30, "bold 50px Segoe UI", "white", "transparent");
         //   background.material.reflectionTexture.renderList.push(barLegend);
            
            // Going next
            x += offset + margin;
        }
    };

    createSeries(browsers_Series);

    // Limit camera
    camera.lowerAlphaLimit = Math.PI;
    camera.upperAlphaLimit = 2 * Math.PI;
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = (Math.PI / 2) * 0.99;
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 150;

    return scene;
};