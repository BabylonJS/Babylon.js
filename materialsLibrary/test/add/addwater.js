window.prepareWater = function() {
	var water = new BABYLON.WaterMaterial("water", scene);
	water.backFaceCulling = false;
	water.enableRenderTargets(false);
	water.bumpTexture = new BABYLON.Texture("textures/waterbump.png", scene);
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
	registerRangeUI("water", "specularColorR", 0, 1, function(value) {
		water.specularColor.r = value;
	}, function() {
		return water.specularColor.r;
	});
	
	registerRangeUI("water", "specularColorG", 0, 1, function(value) {
		water.specularColor.g = value;
	}, function() {
		return water.specularColor.g;
	});
	
	registerRangeUI("water", "specularColorB", 0, 1, function(value) {
		water.specularColor.b = value;
	}, function() {
		return water.specularColor.b;
	});
	
	registerRangeUI("water", "specularPower", 0, 512, function(value) {
		water.specularPower = value;
	}, function() {
		return water.specularPower;
	});
		
	return water;
}