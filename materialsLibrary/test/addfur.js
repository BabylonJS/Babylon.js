window.prepareFur = function() {
	var shells = 30;
	var meshes = [];
	
	var diffuseTexture = new BABYLON.Texture("../assets/textures/leopard_fur.jpg", scene);
	var heightTexture = new BABYLON.Texture("../assets/textures/speckles.jpg", scene);
	var furTexture = BABYLON.FurMaterial.GenerateTexture("furTexture", scene);
	
	var fur = new BABYLON.FurMaterial("fur", scene);
	fur.furLength = 4;
	fur.furAngle = 0;
	fur.furColor = new BABYLON.Color3(1.0, 1.0, 1.0);
	fur.diffuseTexture = diffuseTexture;
    fur.furTexture = furTexture;
	
    // Sets the same value to all shells
	var setValue = function(property, value) {
		for (var i=0; i < meshes.length; i++) {
			meshes[i].material[property] = value;
		}
	}
	
	var resetFur = function() {
		for (var i=1; i < meshes.length; i++) {
            meshes[i].material.dispose();
			meshes[i].dispose();
		}
        
		meshes = [];
	};
	
	var setMeshesVisible = function(visible) {
		for (var i=1; i < meshes.length; i++) {
			meshes[i].isVisible = visible;
		}
	}
	
	var configureFur = function(mesh) {
        mesh.material = fur;
        meshes = BABYLON.FurMaterial.FurifyMesh(mesh, shells);
        
        // For animated meshes
		for (var i=0; i < scene.skeletons.length; i++) {
			scene.beginAnimation(scene.skeletons[i], 0, 100, true, 0.8);
		}
	}

	// fur length
    registerRangeUI("fur", "Fur length", 0, 45, function(value) {
		setValue("furLength", value);
    }, function() {
        return fur.furLength;
    });
	
	// fur angle
    registerRangeUI("fur", "Fur angle", 0, Math.PI/2, function(value) {
		setValue("furAngle", value);
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
		setValue("diffuseTexture", DTON ? diffuseTexture : null);
	});
	
	var HTON = false;
	registerButtonUI("fur", "Tgl Height Tex", function() {
		HTON = !HTON;
		setValue("heightTexture", HTON ? heightTexture : null);
	});
	
    // If High level fur
	registerRangeUI("fur", "Hight Level fur", false, true, function(value) {
		setValue("highLevelFur", value);
		setMeshesVisible(value);
    }, function() {
        return fur.highLevelFur;
    });
    
    // Fur density
    registerRangeUI("fur", "Fur Density", 1, 50, function(value) {
       setValue("furDensity", value); 
    }, function() {
        return fur.furDensity;
    });
	
    // Fur Gravity
	registerRangeUI("fur", "Fur Gravity", 0, 1, function(value) {
		setValue("furGravity", new BABYLON.Vector3(value, value, value));
    }, function() {
        return fur.furGravity.x;
    });
	
	// Fur animation speed
    registerRangeUI("fur", "Fur speed", 1, 1000, function(value) {
		setValue("furSpeed", value);
    }, function() {
        return fur.furSpeed;
    });
	
	// Fur spacing
    registerRangeUI("fur", "Fur Spacing", 0, 20, function(value) {
		setValue("furSpacing", value);
    }, function() {
        return fur.furSpacing;
    });
    
    return {
		material: fur,
		resetFur: function() {
			resetFur();
		},
		configureFur: function(mesh) {
			configureFur(mesh);
		}
	};
};