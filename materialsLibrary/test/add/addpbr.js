window.preparePBR = function() {
	var pbr = new BABYLON.PBRMaterial("pbr", scene);
	pbr.diffuseTexture = new BABYLON.Texture("textures/amiga.jpg", scene);
	pbr.diffuseTexture.uScale = 5;
	pbr.diffuseTexture.vScale = 5;
	pbr.reflectionTexture = new BABYLON.CubeTexture("textures/skybox/TropicalSunnyDay", scene);	
	pbr.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
	pbr.glossiness = 0.9;
	
	registerButtonUI("pbr", "Default", function() {
		setRangeValues({
		  "directIntensity": 1,
		  "emissiveIntensity": 1,
		  "environmentIntensity": 1,
		  "ShadowIntensity": 1,
		  "ShadeIntensity": 1,
		  "cameraExposure": 1,
		  "cameraContrast": 1,
		  "glossiness": 0.9,
		  "specularColorR": 0.3,
		  "specularColorG": 0.3,
		  "specularColorB": 0.3,
		  "diffuseColorR": 1,
		  "diffuseColorG": 1,
		  "diffuseColorB": 1,
		  "diffuseColorLevel": 0
		});
	});
	registerButtonUI("pbr", "Rough Gold", function() {
		setRangeValues({
		  "directIntensity": 1.3439461727881254,
		  "emissiveIntensity": 1,
		  "environmentIntensity": 0.3685013699580344,
		  "ShadowIntensity": 1,
		  "ShadeIntensity": 1,
		  "cameraExposure": 0.7153261887420668,
		  "cameraContrast": 1.6474178892241538,
		  "glossiness": 0.42269274789303946,
		  "specularColorR": 1,
		  "specularColorG": 0.8453854957860789,
		  "specularColorB": 0.5093989525890475,
		  "diffuseColorR": 0,
		  "diffuseColorG": 0,
		  "diffuseColorB": 0,
		  "diffuseColorLevel": 1
		});
	});
	registerButtonUI("pbr", "Plastic", function() {
		setRangeValues({
		  "directIntensity": 0.9971213540040931,
		  "emissiveIntensity": 1,
		  "environmentIntensity": 0.3685013699580344,
		  "ShadowIntensity": 0.975444802830091,
		  "ShadeIntensity": 0.8020323934380749,
		  "cameraExposure": 0.7586792910900708,
		  "cameraContrast": 1.5823882357021477,
		  "glossiness": 0.8562237713730799,
		  "specularColorR": 0.05,
		  "specularColorG": 0.05,
		  "specularColorB": 0.05,
		  "diffuseColorR": 0.20592723615301922,
		  "diffuseColorG": 0.942929976069088,
		  "diffuseColorB": 1,
		  "diffuseColorLevel": 1
		});
	});
	registerButtonUI("pbr", "Shiny Copper", function() {
		setRangeValues({
		  "directIntensity": 1.2355634169181153,
		  "emissiveIntensity": 0.910415149308085,
		  "environmentIntensity": 0.21676551174002023,
		  "ShadowIntensity": 1.018797905178095,
		  "ShadeIntensity": 0.975444802830091,
		  "cameraExposure": 1.0621510075260991,
		  "cameraContrast": 1.0404744563520971,
		  "glossiness": 0.888738598134083,
		  "specularColorR": 0.98,
		  "specularColorG": 0.78,
		  "specularColorB": 0.706,
		  "diffuseColorR": 0.1,
		  "diffuseColorG": 0.1,
		  "diffuseColorB": 0.1,
		  "diffuseColorLevel": 1
		});
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
	
	registerRangeUI("pbr", "ShadowIntensity", 0, 2, function(value) {
		pbr.overloadedShadowIntensity = value;
	}, function() {
		return pbr.overloadedShadowIntensity;
	});
	
	registerRangeUI("pbr", "ShadeIntensity", 0, 2, function(value) {
		pbr.overloadedShadeIntensity = value;
	}, function() {
		return pbr.overloadedShadeIntensity;
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
	
	registerRangeUI("pbr", "glossiness", 0, 1, function(value) {
		pbr.glossiness = value;
	}, function() {
		return pbr.glossiness;
	});

	registerRangeUI("pbr", "specularColorR", 0, 1, function(value) {
		pbr.specularColor.r = value;
	}, function() {
		return pbr.specularColor.r;
	});

	registerRangeUI("pbr", "specularColorG", 0, 1, function(value) {
		pbr.specularColor.g = value;
	}, function() {
		return pbr.specularColor.g;
	});

	registerRangeUI("pbr", "specularColorB", 0, 1, function(value) {
		pbr.specularColor.b = value;
	}, function() {
		return pbr.specularColor.b;
	});

	registerRangeUI("pbr", "diffuseColorR", 0, 1, function(value) {
		pbr.overloadedDiffuse.r = value;
	}, function() {
		return pbr.overloadedDiffuse.r;
	});

	registerRangeUI("pbr", "diffuseColorG", 0, 1, function(value) {
		pbr.overloadedDiffuse.g = value;
	}, function() {
		return pbr.overloadedDiffuse.g;
	});

	registerRangeUI("pbr", "diffuseColorB", 0, 1, function(value) {
		pbr.overloadedDiffuse.b = value;
	}, function() {
		return pbr.overloadedDiffuse.b;
	});

	registerRangeUI("pbr", "diffuseColorLevel", 0, 1, function(value) {
		pbr.overloadedDiffuseIntensity = value;
	}, function() {
		return pbr.overloadedDiffuseIntensity;
	});

	return pbr;
}