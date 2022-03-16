window.prepareSky = function() {
	var sky = new BABYLON.SkyMaterial("sky", scene);
	sky.backFaceCulling = false;
	
	registerRangeUI("sky", "azimuth", 0, 1, function(value) {
		sky.azimuth = value;
	}, function() {
		return sky.azimuth;
	});
	
	registerRangeUI("sky", "inclination", 0, 1, function(value) {
		sky.inclination = value;
	}, function() {
		return sky.inclination;
	});
	
	registerRangeUI("sky", "luminance", 0, 2, function(value) {
		sky.luminance = value;
	}, function() {
		return sky.luminance;
	});
	
	registerRangeUI("sky", "mieDirectionalG", 0, 1, function(value) {
		sky.mieDirectionalG = value;
	}, function() {
		return sky.mieDirectionalG;
	});
	
	registerRangeUI("sky", "mieCoefficient", 0, 0.1, function(value) {
		sky.mieCoefficient = value;
	}, function() {
		return sky.mieCoefficient;
	});
	
	registerRangeUI("sky", "rayleigh", 0, 4, function(value) {
		sky.rayleigh = value;
	}, function() {
		return sky.rayleigh;
	});
	
	registerRangeUI("sky", "turbidity", 0, 20, function(value) {
		sky.turbidity = value;
	}, function() {
		return sky.turbidity;
	});
		
	return sky;
}