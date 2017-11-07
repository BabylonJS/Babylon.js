window.prepareLava = function() {
    var lava = new BABYLON.LavaMaterial("lava", scene);
    lava.diffuseTexture = new BABYLON.Texture("/playground/textures/lava/lavatile.jpg", scene);
    lava.diffuseTexture.uScale = 0.5;
    lava.diffuseTexture.vScale = 0.5;
    lava.noiseTexture = new BABYLON.Texture("/playground/textures/lava/cloud.png", scene);
    lava.fogColor = BABYLON.Color3.Black();
    lava.speed = 2.5;

    // Fog color
    registerColorPicker("lava", "fogColor", "#ff0000", function(value) {
        lava.fogColor = BABYLON.Color3.FromHexString(value);
    }, function() {
        return lava.fogColor.toHexString();
    });

    // fog density
    registerRangeUI("lava", "fogDensity", 0, 1, function(value) {
        lava.fogDensity = value;
    }, function() {
        return lava.fogDensity;
    });

    // Speed
    registerRangeUI("lava", "speed", 0, 10, function(value) {
        lava.speed = value;
    }, function() {
        return lava.speed;
    });

    // low frequency speed
    registerRangeUI("lava", "lowFrequencySpeed", 0, 10, function(value) {
        lava.lowFrequencySpeed = value;
    }, function() {
        return lava.lowFrequencySpeed;
    });

    // moving speed
    registerRangeUI("lava", "movingSpeed", 0, 100, function(value) {
        lava.movingSpeed = value;
    }, function() {
        return lava.movingSpeed;
    });

    return lava;
};