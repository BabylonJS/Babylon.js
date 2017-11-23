window.preparePBRSpecularGlossiness = function() {
	var pbr = new BABYLON.PBRSpecularGlossinessMaterial("pbrspecularglossiness", scene);

	pbr.diffuseTexture = new BABYLON.Texture("/playground/textures/amiga.jpg", scene);
	pbr.diffuseTexture.uScale = 5;
	pbr.diffuseTexture.vScale = 5;
	pbr.specularColor = new BABYLON.Color3(0.3, 0.3, 0.3);
	pbr.glossiness = 0.9;

    // Uncomment for PMREM Generation
    var hdrTexture = new BABYLON.HDRCubeTexture("/playground/textures/environment.hdr", scene, 512);
    // var hdrTexture = new BABYLON.HDRCubeTexture("textures/hdr/environment.hdr", scene, 128, false, true, false, true);

    // Skybox
    var hdrSkybox = scene.createDefaultSkybox(hdrTexture, true);
    hdrSkybox.setEnabled(false);
    
    registerRangeUI("pbrspecularglossiness", "alpha", 0, 1, function(value) {
		pbr.alpha = value;
	}, function() {
		return pbr.alpha;
	});
	
	registerRangeUI("pbrspecularglossiness", "glossiness", 0, 1, function(value) {
		pbr.glossiness = value;
	}, function() {
		return pbr.glossiness;
	});

	registerRangeUI("pbrspecularglossiness", "diffuseColorR", 0, 1, function(value) {
		pbr.diffuseColor.r = value;
	}, function() {
		return pbr.diffuseColor.r;
	});

	registerRangeUI("pbrspecularglossiness", "diffuseColorG", 0, 1, function(value) {
		pbr.diffuseColor.g = value;
	}, function() {
		return pbr.diffuseColor.g;
	});

	registerRangeUI("pbrspecularglossiness", "diffuseColorB", 0, 1, function(value) {
		pbr.diffuseColor.b = value;
	}, function() {
		return pbr.diffuseColor.b;
	});

	registerRangeUI("pbrspecularglossiness", "specularColorR", 0, 1, function(value) {
		pbr.specularColor.r = value;
	}, function() {
		return pbr.specularColor.r;
	});

	registerRangeUI("pbrspecularglossiness", "specularColorG", 0, 1, function(value) {
		pbr.specularColor.g = value;
	}, function() {
		return pbr.specularColor.g;
	});

	registerRangeUI("pbrspecularglossiness", "specularColorB", 0, 1, function(value) {
		pbr.specularColor.b = value;
	}, function() {
		return pbr.specularColor.b;
	});

	registerRangeUI("pbrspecularglossiness", "emissiveColorR", 0, 1, function(value) {
		pbr.emissiveColor.r = value;
	}, function() {
		return pbr.emissiveColor.r;
	});

	registerRangeUI("pbrspecularglossiness", "emissiveColorG", 0, 1, function(value) {
		pbr.emissiveColor.g = value;
	}, function() {
		return pbr.emissiveColor.g;
	});

	registerRangeUI("pbrspecularglossiness", "emissiveColorB", 0, 1, function(value) {
		pbr.emissiveColor.b = value;
	}, function() {
		return pbr.emissiveColor.b;
	});

	registerRangeUI("pbrspecularglossiness", "diffuseTextureLevel", 0, 1, function(value) {
		pbr.diffuseTexture.level = value;
	}, function() {
		return pbr.diffuseTexture.level;
	});
    
    registerButtonUI("pbrspecularglossiness", "Toggle Skybox", function() {
        hdrSkybox.setEnabled(!hdrSkybox.isEnabled());
	});

	return pbr;
}