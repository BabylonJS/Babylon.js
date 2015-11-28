window.prepareFur = function() {
	var fur = new BABYLON.FurMaterial("fur", scene);
    fur.diffuseTexture = new BABYLON.Texture("textures/grass.png", scene);
    fur.heightTexture = new BABYLON.Texture("textures/amiga.jpg", scene);
	fur.furLength = 1;
	fur.furAngle = 0;
    fur.diffuseColor = new BABYLON.Color3(1,0,0);


// fur length
    registerRangeUI("fur", "furLength", 1, 5, function(value) {
        fur.furLength = value;
    }, function() {
        return fur.furLength;
    });
	
	// fur angle
    registerRangeUI("fur", "furAngle", 0, Math.PI/2, function(value) {
        fur.furAngle = value;
    }, function() {
        return fur.furAngle;
    });
    
    return fur;
};