window.prepareWater = function() {
	var water = new BABYLON.WaterMaterial("water", scene);
	water.backFaceCulling = false;
	water.enableRenderTargets(false);
	water.bumpTexture = new BABYLON.Texture("/playground/textures/waterbump.png", scene);
	water.windForce = 45;
	water.waveHeight = 1.3;
	water.windDirection = new BABYLON.Vector2(1, 1);
					
	registerRangeUI("water", "windForce", 0, 100, function(value) {
		water.windForce = value;
	}, function() {
		return water.windForce;
	});
	
	registerRangeUI("water", "waveHeight", 0, 20, function(value) {
		water.waveHeight = value;
	}, function() {
		return water.waveHeight;
	});
	
	registerRangeUI("water", "bumpHeight", 0, 10, function(value) {
		water.bumpHeight = value;
	}, function() {
		return water.bumpHeight;
	});
	
	registerRangeUI("water", "colorBlendFactor", 0, 1, function(value) {
		water.colorBlendFactor = value;
	}, function() {
		return water.colorBlendFactor;
	});
	
	registerRangeUI("water", "waveLength", 0, 1, function(value) {
		water.waveLength = value;
	}, function() {
		return water.waveLength;
	});
	
	registerRangeUI("water", "waveSpeed", 0, 100, function(value) {
		water.waveSpeed = value;
	}, function() {
		return water.waveSpeed;
	});
	
	// Specular color
	registerColorPicker("water", "specularColor", "#703605", function(value) {		
		water.specularColor.r = value.r/255;
		water.specularColor.g = value.g/255;
		water.specularColor.b = value.b/255;
	}, function() {
		return water.specularColor;
	});

	registerRangeUI("water", "specularPower", 0, 512, function(value) {
		water.specularPower = value;
	}, function() {
		return water.specularPower;
	});

	// Advanced
	registerRangeUI("water", "bumpSuperimpose", 0, 1, function(value) {
		water.bumpSuperimpose = value;
	}, function() {
		return water.bumpSuperimpose;
	});

	registerRangeUI("water", "fresnelSeparate", 0, 1, function(value) {
		water.fresnelSeparate  = value;
	}, function() {
		return water.fresnelSeparate ;
	});
		
	registerRangeUI("water", "bumpAffectsReflection", 0, 1, function(value) {
		water.bumpAffectsReflection  = value;
	}, function() {
		return water.bumpAffectsReflection ;
	});

	registerRangeUI("water", "colorBlendFactor2", 0, 1, function(value) {
		water.colorBlendFactor2 = value;
	}, function() {
		return water.colorBlendFactor2;
	});

	registerColorPicker("water", "waterColor", "#703605", function(value) {		
		water.waterColor.r = value.r/255;
		water.waterColor.g = value.g/255;
		water.waterColor.b = value.b/255;
	}, function() {
		return water.waterColor;
	});

	registerColorPicker("water", "waterColor2", "#703605", function(value) {		
		water.waterColor2.r = value.r/255;
		water.waterColor2.g = value.g/255;
		water.waterColor2.b = value.b/255;
	}, function() {
		return water.waterColor2;
	});

	return water;
}