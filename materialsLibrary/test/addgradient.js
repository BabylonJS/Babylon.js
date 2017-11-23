window.prepareGradient = function() {
    var grad = new BABYLON.GradientMaterial("gradient", scene);

    // Top color
    registerColorPicker("gradient", "topColor", "#ff0000", function(value) {
        grad.topColor = BABYLON.Color3.FromHexString(value);
    }, function() {
        return grad.topColor.toHexString();
    });

    // topColorAlpha
    registerRangeUI("gradient", "topColorAlpha", 0, 1, function(value) {
        grad.topColorAlpha = value;
    }, function() {
        return grad.topColorAlpha;
    });

    // Bottom color
    registerColorPicker("gradient", "bottomColor", "#0000ff", function(value) {
        grad.bottomColor = BABYLON.Color3.FromHexString(value);
    }, function() {
        return grad.bottomColor.toHexString();
    });

    // topColorAlpha
    registerRangeUI("gradient", "bottomColorAlpha", 0, 1, function(value) {
        grad.bottomColorAlpha = value;
    }, function() {
        return grad.bottomColorAlpha;
    });

    // offset
    registerRangeUI("gradient", "offset", -1, 1, function(value) {
        grad.offset = value;
    }, function() {
        return grad.offset;
    });

    // smoothness
    registerRangeUI("gradient", "smoothness", 0, 5, function(value) {
        grad.smoothness = value;
    }, function() {
        return grad.smoothness;
    });

    return grad;
};