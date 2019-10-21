window.preparePBR = function() {
	var pbr = new BABYLON.PBRMaterial("pbr", scene);

	pbr.albedoTexture = new BABYLON.Texture("/Playground/textures/amiga.jpg", scene);
	pbr.albedoTexture.uScale = 5;
	pbr.albedoTexture.vScale = 5;
    
    var hdrTexture = new BABYLON.HDRCubeTexture("/Playground/textures/environment.hdr", scene, 512);

   
    // Uncomment for PMREM Generation
    // var hdrTexture = new BABYLON.HDRCubeTexture("textures/hdr/environment.hdr", scene, 128, false, true, false, true);
    pbr.reflectionTexture = hdrTexture;
    pbr.refractionTexture = hdrTexture;
    pbr.linkRefractionWithTransparency = true;
    pbr.indexOfRefraction = 0.52;

	var colorGrading = new BABYLON.Texture("/Playground/textures/colorGrade.png", scene, true);
	pbr.cameraColorGradingTexture = colorGrading;
	pbr.colorGradingEnabled = true;

	pbr.reflectivityColor = new BABYLON.Color3(0.3, 0.3, 0.3);
	pbr.microSurface = 0.9;
    
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
    
	registerButtonUI("pbr", "Default", function() {
		setRangeValues({
		  "directIntensity": 1,
		  "emissiveIntensity": 1,
		  "environmentIntensity": 1,
		  "specularIntensity": 1,
		  "ShadowIntensity": 1,
		  "ShadeIntensity": 1,
		  "cameraExposure": 1,
		  "cameraContrast": 1,
		  "microSurface": 0.9,
		  "reflectivityColorR": 0.3,
		  "reflectivityColorG": 0.3,
		  "reflectivityColorB": 0.3,
		  "albedoColorR": 1,
		  "albedoColorG": 1,
		  "albedoColorB": 1,
		  "albedoColorLevel": 0
		});
	});
    registerButtonUI("pbr", "Env Irradiance", function() {
		setRangeValues({
		  "directIntensity": 0,
		  "emissiveIntensity": 1,
		  "environmentIntensity": 1,
		  "specularIntensity": 1,
		  "ShadowIntensity": 1,
		  "ShadeIntensity": 1,
		  "cameraExposure": 1,
		  "cameraContrast": 1,
		  "microSurface": 0,
		  "reflectivityColorR": 0,
		  "reflectivityColorG": 0,
		  "reflectivityColorB": 0,
		  "albedoColorR": 1,
		  "albedoColorG": 1,
		  "albedoColorB": 1,
		  "albedoColorLevel": 1
		});
        
        hdrSkybox.setEnabled(true);
	});
	registerButtonUI("pbr", "Rough Gold", function() {
		setRangeValues({
		  "directIntensity": 1.3439461727881254,
		  "emissiveIntensity": 1,
		  "environmentIntensity": 0.3685013699580344,
		  "specularIntensity": 1,
		  "ShadowIntensity": 1,
		  "ShadeIntensity": 1,
		  "cameraExposure": 0.7153261887420668,
		  "cameraContrast": 1.6474178892241538,
		  "microSurface": 0.42269274789303946,
		  "reflectivityColorR": 1,
		  "reflectivityColorG": 0.8453854957860789,
		  "reflectivityColorB": 0.5093989525890475,
		  "albedoColorR": 0,
		  "albedoColorG": 0,
		  "albedoColorB": 0,
		  "albedoColorLevel": 1
		});
	});
	registerButtonUI("pbr", "Plastic", function() {
		setRangeValues({
		  "directIntensity": 0.9971213540040931,
		  "emissiveIntensity": 1,
		  "environmentIntensity": 0.3685013699580344,
		  "specularIntensity": 1,
		  "ShadowIntensity": 0.975444802830091,
		  "ShadeIntensity": 0.8020323934380749,
		  "cameraExposure": 0.7586792910900708,
		  "cameraContrast": 1.5823882357021477,
		  "microSurface": 0.8562237713730799,
		  "reflectivityColorR": 0.05,
		  "reflectivityColorG": 0.05,
		  "reflectivityColorB": 0.05,
		  "albedoColorR": 0.20592723615301922,
		  "albedoColorG": 0.942929976069088,
		  "albedoColorB": 1,
		  "albedoColorLevel": 1
		});
	});

    registerRangeUI("pbr", "alpha", 0, 1, function(value) {
		pbr.alpha = value;
	}, function() {
		return pbr.alpha;
	});
    
    registerRangeUI("pbr", "directIntensity", 0, 2, function(value) {
		pbr.directIntensity = value;
	}, function() {
		return pbr.directIntensity;
	});
    
	registerRangeUI("pbr", "emissiveIntensity", 0, 2, function(value) {
		pbr.emissiveIntensity = value;
	}, function() {
		return pbr.emissiveIntensity;
	});
	
	registerRangeUI("pbr", "environmentIntensity", 0, 2, function(value) {
		pbr.environmentIntensity = value;
	}, function() {
		return pbr.environmentIntensity;
	});

	registerRangeUI("pbr", "specularIntensity", 0, 2, function(value) {
		pbr.specularIntensity = value;
	}, function() {
		return pbr.specularIntensity;
	});
	
	registerRangeUI("pbr", "cameraExposure", 0, 2, function(value) {
		pbr.cameraExposure = value;
	}, function() {
		return pbr.cameraExposure;
	});

	registerRangeUI("pbr", "cameraContrast", 0, 2, function(value) {
		pbr.cameraContrast = value;
	}, function() {
		return pbr.cameraContrast;
	});
	
	registerRangeUI("pbr", "microSurface", 0, 1, function(value) {
		pbr.microSurface = value;
	}, function() {
		return pbr.microSurface;
	});

	registerRangeUI("pbr", "reflectivityColorR", 0, 1, function(value) {
		pbr.reflectivityColor.r = value;
	}, function() {
		return pbr.reflectivityColor.r;
	});

	registerRangeUI("pbr", "reflectivityColorG", 0, 1, function(value) {
		pbr.reflectivityColor.g = value;
	}, function() {
		return pbr.reflectivityColor.g;
	});

	registerRangeUI("pbr", "reflectivityColorB", 0, 1, function(value) {
		pbr.reflectivityColor.b = value;
	}, function() {
		return pbr.reflectivityColor.b;
	});

	registerRangeUI("pbr", "albedoColorR", 0, 1, function(value) {
		pbr.albedoColor.r = value;
	}, function() {
		return pbr.albedoColor.r;
	});

	registerRangeUI("pbr", "albedoColorG", 0, 1, function(value) {
		pbr.albedoColor.g = value;
	}, function() {
		return pbr.albedoColor.g;
	});

	registerRangeUI("pbr", "albedoColorB", 0, 1, function(value) {
		pbr.albedoColor.b = value;
	}, function() {
		return pbr.albedoColor.b;
	});

	registerRangeUI("pbr", "albedoColorLevel", 0, 1, function(value) {
		pbr.albedoTexture.level = value;
	}, function() {
		return pbr.albedoTexture.level;
	});
    
    registerButtonUI("pbr", "Toggle Skybox", function() {
        hdrSkybox.setEnabled(!hdrSkybox.isEnabled());
	});

    registerButtonUI("pbr", "Color Grading", function() {
        pbr.cameraColorGradingTexture = pbr.cameraColorGradingTexture ? null : colorGradingTexture; 
	});

	return pbr;
}