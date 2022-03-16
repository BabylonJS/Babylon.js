window.prepareFire = function() {
    var fire = new BABYLON.FireMaterial("fire", scene);
    fire.diffuseTexture = new BABYLON.Texture("/Playground/textures/fire/diffuse.png", scene);
    fire.distortionTexture = new BABYLON.Texture("/Playground/textures/fire/distortion.png", scene);
    fire.opacityTexture = new BABYLON.Texture("/Playground/textures/fire/opacity.png", scene);
    
    registerRangeUI("fire", "speed", 0, 20, function(value) {
		fire.speed = value;
	}, function() {
		return fire.speed;
	});
    
    return fire;
};