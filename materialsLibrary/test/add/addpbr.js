window.preparePBR = function() {
	var pbr = new BABYLON.PBRMaterial("pbr", scene);
	pbr.diffuseTexture = new BABYLON.Texture("textures/amiga.jpg", scene);
	pbr.diffuseTexture.uScale = 5;
	pbr.diffuseTexture.vScale = 5;
	pbr.specularColor = BABYLON.Color3.Gray();
	pbr.glossiness = 0.5;
	
	pbr.reflectionFresnelParameters = new BABYLON.FresnelParameters();
	pbr.useReflectionFresnelFromSpecular = true;
	pbr.reflectionFresnelParameters.power = 1.0;
	pbr.reflectionFresnelParameters.bias = 0.0;
	
	pbr.reflectionTexture = new BABYLON.CubeTexture("textures/skybox/TropicalSunnyDay", scene);
					
	registerRangeUI("pbr", "directIntensity", 0, 1, function(value) {
		pbr.directIntensity = value;
	}, function() {
		return pbr.directIntensity;
	});
	
	registerRangeUI("pbr", "emissiveIntensity", 0, 1, function(value) {
		pbr.emissiveIntensity = value;
	}, function() {
		return pbr.emissiveIntensity;
	});
	
	registerRangeUI("pbr", "environmentIntensity", 0, 1, function(value) {
		pbr.environmentIntensity = value;
	}, function() {
		return pbr.environmentIntensity;
	});
	
	registerRangeUI("pbr", "shadowIntensity", 0, 1, function(value) {
		pbr.shadowIntensity = value;
	}, function() {
		return pbr.shadowIntensity;
	});
	
	registerRangeUI("pbr", "shadeIntensity", 0, 1, function(value) {
		pbr.shadeIntensity = value;
	}, function() {
		return pbr.shadeIntensity;
	});
	
	registerRangeUI("pbr", "cameraExposure", 0, 1, function(value) {
		pbr.cameraExposure = value;
	}, function() {
		return pbr.cameraExposure;
	});
	
	registerRangeUI("pbr", "glossiness", 0, 1, function(value) {
		pbr.glossiness = value;
	}, function() {
		return pbr.glossiness;
	});
		
	return pbr;
}