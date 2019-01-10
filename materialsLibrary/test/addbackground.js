window.prepareBackgroundMaterial = function() {
	var backSky = new BABYLON.BackgroundMaterial("backSky", scene);
	var hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("/Playground/textures/environment.dds", scene);
	hdrTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE
	backSky.reflectionTexture = hdrTexture;
	backSky.backFaceCulling = false;
	
	var back = new BABYLON.BackgroundMaterial("back", scene);
	back.diffuseTexture = new BABYLON.Texture("/Playground/textures/WhiteTransarentRamp.png", scene);
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
	
	var perceptualColor = new BABYLON.Color3(1, 1, 1);
	var primaryColor = new BABYLON.Color3(1, 1, 1);

	registerRangeUI("background", "primaryColorR", 0, 1, function(value) {
		mirror.clearColor.r = value;
		back.primaryColor.r = value;
		backSky.primaryColor.r = value;
		if (back.perceptualColor) {
			back.perceptualColor.r = value;
			backSky.perceptualColor.r = value;
		}
		perceptualColor.r = value;
		primaryColor.r = value;
	}, function() {
		return back.primaryColor.r;
	});

	registerRangeUI("background", "primaryColorG", 0, 1, function(value) {
		mirror.clearColor.g = value;
		back.primaryColor.g = value;
		backSky.primaryColor.g = value;
		if (back.perceptualColor) {
			back.perceptualColor.g = value;
			backSky.perceptualColor.g = value;
		}
		perceptualColor.g = value;
		primaryColor.g = value;
	}, function() {
		return back.primaryColor.g;
	});

	registerRangeUI("background", "primaryColorB", 0, 1, function(value) {
		mirror.clearColor.b = value;
		back.primaryColor.b = value;
		backSky.primaryColor.b = value;
		if (back.perceptualColor) {
			back.perceptualColor.b = value;
			backSky.perceptualColor.b = value;
		}
		perceptualColor.b = value;
		primaryColor.b = value;
	}, function() {
		return back.primaryColor.b;
	});

	registerRangeUI("background", "primaryColorShadowLevel", 0, 1, function(value) {
		back.primaryColorShadowLevel = value;
		backSky.primaryColorShadowLevel = value;
	}, function() {
		return back.primaryColorShadowLevel;
	});

	registerRangeUI("background", "primaryColorHighlightLevel", 0, 1, function(value) {
		back.primaryColorHighlightLevel = value;		
		backSky.primaryColorHighlightLevel = value;
	}, function() {
		return back.primaryColorHighlightLevel;
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

	registerButtonUI("background", "TogglePerceptualColor", function() {
		if (back.perceptualColor) {
			back.perceptualColor = null;
			backSky.perceptualColor = null;
			back.primaryColor = primaryColor.clone();
			backSky.primaryColor = primaryColor.clone();
		}
		else {
			back.perceptualColor = perceptualColor.clone();
			backSky.perceptualColor = perceptualColor.clone();
		}
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