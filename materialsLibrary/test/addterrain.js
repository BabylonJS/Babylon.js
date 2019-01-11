window.prepareTerrain = function() {
    var terrain = new BABYLON.TerrainMaterial("terrain", scene);
    terrain.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    terrain.specularPower = 64;
    terrain.mixTexture = new BABYLON.Texture("/Playground/textures/mixMap.png", scene);
    terrain.diffuseTexture1 = new BABYLON.Texture("/Playground/textures/floor.png", scene);
    terrain.diffuseTexture2 = new BABYLON.Texture("/Playground/textures/rock.png", scene);
    terrain.diffuseTexture3 = new BABYLON.Texture("/Playground/textures/grass.png", scene);
    
    terrain.bumpTexture1 = new BABYLON.Texture("/Playground/textures/floor_bump.PNG", scene);
    terrain.bumpTexture2 = new BABYLON.Texture("/Playground/textures/rockn.png", scene);
    terrain.bumpTexture3 = new BABYLON.Texture("/Playground/textures/grassn.png", scene);
    
    terrain.diffuseTexture1.uScale = terrain.diffuseTexture1.vScale = 10;
    terrain.diffuseTexture2.uScale = terrain.diffuseTexture2.vScale = 10;
    terrain.diffuseTexture3.uScale = terrain.diffuseTexture3.vScale = 10;
    
    return terrain;
};