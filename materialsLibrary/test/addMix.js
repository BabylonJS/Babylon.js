window.prepareMix = function() {
    var mix = new BABYLON.MixMaterial("mix", scene);
    mix.specularColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    mix.specularPower = 64;
    mix.mixTexture1 = new BABYLON.Texture("/Playground/textures/mixMap.png", scene);
    mix.mixTexture2 = new BABYLON.Texture("/Playground/textures/mixMap_2.png", scene);

    mix.diffuseTexture1 = new BABYLON.Texture("/Playground/textures/floor.png", scene);
    mix.diffuseTexture2 = new BABYLON.Texture("/Playground/textures/rock.png", scene);
    mix.diffuseTexture3 = new BABYLON.Texture("/Playground/textures/grass.png", scene);
    mix.diffuseTexture4 = new BABYLON.Texture("/Playground/textures/floor.png", scene);

    mix.diffuseTexture1.uScale = mix.diffuseTexture1.vScale = 10;
    mix.diffuseTexture2.uScale = mix.diffuseTexture2.vScale = 10;
    mix.diffuseTexture3.uScale = mix.diffuseTexture3.vScale = 10;
    mix.diffuseTexture4.uScale = mix.diffuseTexture4.vScale = 10;

    mix.diffuseTexture5 = new BABYLON.Texture("/Playground/textures/leopard_fur.JPG", scene);
    mix.diffuseTexture6 = new BABYLON.Texture("/Playground/textures/fur.jpg", scene);
    mix.diffuseTexture7 = new BABYLON.Texture("/Playground/textures/sand.jpg", scene);
    mix.diffuseTexture8 = new BABYLON.Texture("/Playground/textures/crate.png", scene);

    mix.diffuseTexture5.uScale = mix.diffuseTexture5.vScale = 10;
    mix.diffuseTexture6.uScale = mix.diffuseTexture6.vScale = 10;
    mix.diffuseTexture7.uScale = mix.diffuseTexture7.vScale = 5;
    mix.diffuseTexture8.uScale = mix.diffuseTexture8.vScale = 10;
    
    return mix;
};
