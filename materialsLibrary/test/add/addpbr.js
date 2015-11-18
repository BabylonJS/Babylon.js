window.preparePBR = function() {
	var pbr = new BABYLON.PBRMaterial("pbr", scene);
	pbr.diffuseTexture = new BABYLON.Texture("textures/amiga.jpg", scene);
	pbr.diffuseTexture.uScale = 5;
	pbr.diffuseTexture.vScale = 5;
	pbr.specularColor = BABYLON.Color3.Gray();
	pbr.specularPower = 0.8;
	pbr.roughness = 6.0;
	
	pbr.reflectionFresnelParameters = new BABYLON.FresnelParameters();
	pbr.useReflectionFresnelFromSpecular = true;
	pbr.reflectionFresnelParameters.power = 1.0;
	pbr.reflectionFresnelParameters.bias = 0.0;
	
	pbr.reflectionTexture = new BABYLON.CubeTexture("textures/skybox/TropicalSunnyDay", scene);
					
	registerRangeUI("pbr", "specularPower", 0, 1, function(value) {
		pbr.specularPower = value;
	}, function() {
		return pbr.specularPower;
	});
	
	registerRangeUI("pbr", "roughness", 0, 10, function(value) {
		pbr.roughness = value;
	}, function() {
		return pbr.roughness;
	});
		
	return pbr;
}