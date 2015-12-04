window.prepareFur = function() {
	var fur = new BABYLON.FurMaterial("fur", scene);
	fur.furLength = 1;
	fur.furAngle = 0;
    fur.furColor = new BABYLON.Color3(0.44,0.21,0.02);


// fur length
    registerRangeUI("fur", "Fur length", 0, 15, function(value) {
        fur.furLength = value;
    }, function() {
        return fur.furLength;
    });
	
	// fur angle
    registerRangeUI("fur", "Fur angle", 0, Math.PI/2, function(value) {
        fur.furAngle = value;
    }, function() {
        return fur.furAngle;
    });
    
    // fur color
	registerColorPicker("fur", "Fur color", "#703605", function(value) {		
		fur.furColor.r = value.r/255;
		fur.furColor.g = value.g/255;
		fur.furColor.b = value.b/255;
	}, function() {
		return fur.furColor;
	});
	
	var DTON = false;
	registerButtonUI("fur", "Tgl Diffuse Tex", function() {
		DTON = !DTON;
		if(DTON) {
			fur.diffuseTexture = new BABYLON.Texture("textures/leopard_fur.jpg", scene);
		}
		else {
			fur.diffuseTexture = null;
		}
	})
	
	var HTON = false;
	registerButtonUI("fur", "Tgl Height Tex", function() {
		HTON = !HTON;
		if(HTON) {
			fur.heightTexture = new BABYLON.Texture("textures/speckles.jpg", scene);
		}
		else {
			fur.heightTexture = null;
		}
	})
    
    return fur;
};