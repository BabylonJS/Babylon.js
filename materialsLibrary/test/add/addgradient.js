window.prepareGradient = function() {
    var grad = new BABYLON.GradientMaterial("gradient", scene);

    // Top color
    registerColorPicker("gradient", "topColor", "#ff0000", function(value) {
        grad.topColor = BABYLON.Color3.FromHexString(value);
    }, function() {
        return grad.topColor.toHexString();
    });

    // Bottom color
    registerColorPicker("gradient", "bottomColor", "#0000ff", function(value) {
        grad.bottomColor = BABYLON.Color3.FromHexString(value);
    }, function() {
        return grad.bottomColor.toHexString();
    });

    // offset
    registerRangeUI("gradient", "offset", -1, 1, function(value) {
        grad.offset = value;
    }, function() {
        return grad.offset;
    });

    return grad;
};