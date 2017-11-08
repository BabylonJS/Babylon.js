window.prepareBackgroundMaterial = function() {
	var backSky = new BABYLON.BackgroundMaterial("backSky", scene);
	var hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("/playground/textures/environment.dds", scene);
	hdrTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE
	backSky.reflectionTexture = hdrTexture;
	backSky.backFaceCulling = false;
	
	var back = new BABYLON.BackgroundMaterial("back", scene);
	back.diffuseTexture = new BABYLON.Texture("/playground/textures/WhiteTransarentRamp.png", scene);
	back.diffuseTexture.hasAlpha = true;

    // Skybox
    backgroundSkybox = BABYLON.Mesh.CreateBox("hdrSkyBox", 1000.0, scene);
	backgroundSkybox.material = backSky;
	backgroundSkybox.setEnabled(false);

	var mirrorMesh = BABYLON.Mesh.CreateTorus("torus", 4, 2, 30, scene, false);
	mirrorMesh.setEnabled(false);
	mirrorMesh.position = new BABYLON.Vector3(0, 3, 0);
	mirrorMesh.material = new BABYLON.StandardMaterial("", scene);
	mirrorMesh.material.emissiveColor = BABYLON.Color3.Red();

	var mirror = new BABYLON.MirrorTexture("mirror", {ratio: 0.3}, scene, true);
	mirror.renderList = [mirrorMesh];
	mirror.clearColor = new BABYLON.Color4(1, 1, 1, 0.0);
	mirror.mirrorPlane = new BABYLON.Plane(0, -1.0, 0, 0.0);
	mirror.adaptiveBlurKernel = 64;
	
	registerRangeUI("background", "primaryColorR", 0, 1, function(value) {
		mirror.clearColor.r = value;
		back.primaryColor.r = value;
		backSky.primaryColor.r = value;
	}, function() {
		return back.primaryColor.r;
	});

	registerRangeUI("background", "primaryColorG", 0, 1, function(value) {
		mirror.clearColor.g = value;
		back.primaryColor.g = value;
		backSky.primaryColor.g = value;
	}, function() {
		return back.primaryColor.g;
	});

	registerRangeUI("background", "primaryColorB", 0, 1, function(value) {
		mirror.clearColor.b = value;
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

	registerRangeUI("background", "tertiaryColorR", 0, 1, function(value) {
		back.tertiaryColor.r = value;
		backSky.tertiaryColor.r = value;
	}, function() {
		return back.tertiaryColor.r;
	});

	registerRangeUI("background", "tertiaryColorG", 0, 1, function(value) {
		back.tertiaryColor.g = value;
		backSky.tertiaryColor.g = value;
	}, function() {
		return back.tertiaryColor.g;
	});

	registerRangeUI("background", "tertiaryColorB", 0, 1, function(value) {
		back.tertiaryColor.b = value;
		backSky.tertiaryColor.b = value;
	}, function() {
		return back.tertiaryColor.b;
	});

	registerRangeUI("background", "tertiaryLevel", 0, 30, function(value) {
		back.tertiaryLevel = value;		
		backSky.tertiaryLevel = value;
	}, function() {
		return back.tertiaryLevel;
	});

	registerRangeUI("background", "reflectionBlur", 0, 1, function(value) {
		backSky.reflectionBlur = value;
	}, function() {
		return backSky.reflectionBlur;
	});

	registerRangeUI("background", "shadowLevel", 0, 1, function(value) {
		back.shadowLevel = value;
		backSky.shadowLevel = value;
	}, function() {
		return back.shadowLevel;
	});

	registerRangeUI("background", "alpha", 0, 1, function(value) {
		back.alpha = value;
	}, function() {
		return back.alpha;
	});

	registerRangeUI("background", "mirrorAmount", 0, 10, function(value) {
		back.reflectionAmount = value;
	}, function() {
		return back.reflectionAmount;
	});

	registerRangeUI("background", "mirrorFalloff", 0, 5, function(value) {
		back.reflectionFalloffDistance = value;
	}, function() {
		return back.reflectionFalloffDistance;
	});

	registerButtonUI("background", "ToggleBackRGB", function() {
		back.useRGBColor = !back.useRGBColor;
	});

	registerButtonUI("background", "ToggleSkyRGB", function() {
		backSky.useRGBColor = !backSky.useRGBColor;
	});

	registerButtonUI("background", "ToggleMirror", function() {
		if (back.reflectionFresnel) {
			back.reflectionFresnel = false;
			back.reflectionTexture = null;
			mirrorMesh.setEnabled(false);
		}
		else {
			back.reflectionFresnel = true;
			back.reflectionTexture = mirror;
			mirrorMesh.setEnabled(true);
		}
	});


	return back;
}