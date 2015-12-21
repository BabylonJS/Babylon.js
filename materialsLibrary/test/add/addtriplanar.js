window.prepareTriPlanar = function() {
    var triPlanar = new BABYLON.TriPlanarMaterial("triplanar", scene);
    triPlanar.diffuseTextureX = new BABYLON.Texture("textures/rock.png", scene);
    triPlanar.diffuseTextureY = new BABYLON.Texture("textures/grass.png", scene);
    triPlanar.diffuseTextureZ = triPlanar.diffuseTextureX;
    triPlanar.normalTextureX = new BABYLON.Texture("textures/rockn.png", scene);
    triPlanar.normalTextureY = new BABYLON.Texture("textures/grassn.png", scene);
    triPlanar.normalTextureZ = triPlanar.normalTextureX;
    triPlanar.specularPower = 64;
    triPlanar.tileSize = 1.5;
    
    registerRangeUI("triPlanar", "tileSize", 0, 20, function(value) {
		triPlanar.tileSize = value;
	}, function() {
		return triPlanar.tileSize;
	});
    
    return triPlanar;
};