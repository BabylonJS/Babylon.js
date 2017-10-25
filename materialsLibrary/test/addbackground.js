window.prepareBackgroundMaterial = function() {
	var back = new BABYLON.BackgroundMaterial("back", scene);
	var backSky = new BABYLON.BackgroundMaterial("backSky", scene);
	backSky.backFaceCulling = false;

    var hdrTexture = new BABYLON.HDRCubeTexture("../assets/textures/hdr/environment.hdr", scene, 512);
	back.environmentTexture = hdrTexture;
	back.opacityTexture = new BABYLON.Texture("../assets/textures/amiga.jpg", scene);
	back.opacityTexture.getAlphaFromRGB = true;
	back.opacityTexture.uScale = 5;
	back.opacityTexture.vScale = 5;
	backSky.environmentTexture = hdrTexture;

    // Skybox
    backgroundSkybox = BABYLON.Mesh.CreateBox("hdrSkyBox", 1000.0, scene);
	backgroundSkybox.material = backSky;
	backgroundSkybox.setEnabled(false);
	
	registerRangeUI("background", "primaryColorR", 0, 1, function(value) {
		back.primaryColor.r = value;
		backSky.primaryColor.r = value;
	}, function() {
		return back.primaryColor.r;
	});

	registerRangeUI("background", "primaryColorG", 0, 1, function(value) {
		back.primaryColor.g = value;
		backSky.primaryColor.g = value;
	}, function() {
		return back.primaryColor.g;
	});

	registerRangeUI("background", "primaryColorB", 0, 1, function(value) {
		back.primaryColor.b = value;
		backSky.primaryColor.b = value;
	}, function() {
		return back.primaryColor.b;
	});

	registerRangeUI("background", "primaryLevel", 0, 30, function(value) {
		back.primaryLevel = value;
		backSky.primaryLevel = value;
	}, function() {
		return back.primaryLevel;
	});

	registerRangeUI("background", "secondaryColorR", 0, 1, function(value) {
		back.secondaryColor.r = value;
		backSky.secondaryColor.r = value;
	}, function() {
		return back.secondaryColor.r;
	});

	registerRangeUI("background", "secondaryColorG", 0, 1, function(value) {
		back.secondaryColor.g = value;
		backSky.secondaryColor.g = value;
	}, function() {
		return back.secondaryColor.g;
	});

	registerRangeUI("background", "secondaryColorB", 0, 1, function(value) {
		back.secondaryColor.b = value;
		backSky.secondaryColor.b = value;
	}, function() {
		return back.secondaryColor.b;
	});

	registerRangeUI("background", "secondaryLevel", 0, 30, function(value) {
		back.secondaryLevel = value;
		backSky.secondaryLevel = value;
	}, function() {
		return back.secondaryLevel;
	});

	registerRangeUI("background", "thirdColorR", 0, 1, function(value) {
		back.thirdColor.r = value;
		backSky.thirdColor.r = value;
	}, function() {
		return back.thirdColor.r;
	});

	registerRangeUI("background", "thirdColorG", 0, 1, function(value) {
		back.thirdColor.g = value;
		backSky.thirdColor.g = value;
	}, function() {
		return back.thirdColor.g;
	});

	registerRangeUI("background", "thirdColorB", 0, 1, function(value) {
		back.thirdColor.b = value;
		backSky.thirdColor.b = value;
	}, function() {
		return back.thirdColor.b;
	});

	registerRangeUI("background", "thirdLevel", 0, 30, function(value) {
		back.thirdLevel = value;		
		backSky.thirdLevel = value;
	}, function() {
		return back.thirdLevel;
	});

	registerRangeUI("background", "environmentBlur", 0, 1, function(value) {
		back.environmentBlur = value;
		backSky.environmentBlur = value;
	}, function() {
		return back.environmentBlur;
	});

	registerRangeUI("background", "shadowLevel", 0, 1, function(value) {
		back.shadowLevel = value;
		backSky.shadowLevel = value;
	}, function() {
		return back.shadowLevel;
	});

	return back;
}