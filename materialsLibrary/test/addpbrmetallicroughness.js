window.preparePBRMetallicRoughness = function() {
	var pbr = new BABYLON.PBRMetallicRoughnessMaterial("pbrmetallicroughness", scene);

	pbr.baseTexture = new BABYLON.Texture("../assets/textures/amiga.jpg", scene);
	pbr.baseTexture.uScale = 5;
	pbr.baseTexture.vScale = 5;
    
    var hdrTexture = new BABYLON.HDRCubeTexture("../assets/textures/hdr/environment.hdr", scene, 512);

    // Uncomment for PMREM Generation
    // var hdrTexture = new BABYLON.HDRCubeTexture("textures/hdr/environment.hdr", scene, 128, false, true, false, true);
    pbr.environmentTexture = hdrTexture;

	pbr.metallic = 0.5;
	pbr.roughness = 0.1;
    
    // Skybox
    var hdrSkybox = BABYLON.Mesh.CreateBox("hdrSkyBox", 1000.0, scene);
    var hdrSkyboxMaterial = new BABYLON.PBRMaterial("skyBox", scene);
    hdrSkyboxMaterial.backFaceCulling = false;
    hdrSkyboxMaterial.reflectionTexture = hdrTexture.clone();
    hdrSkyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
    hdrSkyboxMaterial.microSurface = 1;
    hdrSkyboxMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
    hdrSkyboxMaterial.disableLighting = true;
    hdrSkyboxMaterial.cameraExposure = 0.6;
    hdrSkyboxMaterial.cameraContrast = 1.6;
    hdrSkyboxMaterial.directIntensity = 0;
    hdrSkybox.material = hdrSkyboxMaterial;
    hdrSkybox.infiniteDistance = true;
    hdrSkybox.setEnabled(false);
    
    registerRangeUI("pbrmetallicroughness", "alpha", 0, 1, function(value) {
		pbr.alpha = value;
	}, function() {
		return pbr.alpha;
	});

	registerRangeUI("pbrmetallicroughness", "metallic", 0, 1, function(value) {
		pbr.metallic = value;
	}, function() {
		return pbr.metallic;
	});
	
	registerRangeUI("pbrmetallicroughness", "roughness", 0, 1, function(value) {
		pbr.roughness = value;
	}, function() {
		return pbr.roughness;
	});

	registerRangeUI("pbrmetallicroughness", "baseColorR", 0, 1, function(value) {
		pbr.baseColor.r = value;
	}, function() {
		return pbr.baseColor.r;
	});

	registerRangeUI("pbrmetallicroughness", "baseColorG", 0, 1, function(value) {
		pbr.baseColor.g = value;
	}, function() {
		return pbr.baseColor.g;
	});

	registerRangeUI("pbrmetallicroughness", "baseColorB", 0, 1, function(value) {
		pbr.baseColor.b = value;
	}, function() {
		return pbr.baseColor.b;
	});

	registerRangeUI("pbrmetallicroughness", "emissiveColorR", 0, 1, function(value) {
		pbr.emissiveColor.r = value;
	}, function() {
		return pbr.emissiveColor.r;
	});

	registerRangeUI("pbrmetallicroughness", "emissiveColorG", 0, 1, function(value) {
		pbr.emissiveColor.g = value;
	}, function() {
		return pbr.emissiveColor.g;
	});

	registerRangeUI("pbrmetallicroughness", "emissiveColorB", 0, 1, function(value) {
		pbr.emissiveColor.b = value;
	}, function() {
		return pbr.emissiveColor.b;
	});

	registerRangeUI("pbrmetallicroughness", "baseTextureLevel", 0, 1, function(value) {
		pbr.baseTexture.level = value;
	}, function() {
		return pbr.baseTexture.level;
	});
    
    registerButtonUI("pbrmetallicroughness", "Toggle Skybox", function() {
        hdrSkybox.setEnabled(!hdrSkybox.isEnabled());
	});

	return pbr;
}