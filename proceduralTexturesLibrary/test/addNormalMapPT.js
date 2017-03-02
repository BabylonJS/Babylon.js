window.addNormalMapPT = function() {
    // 128 = the size of the base texture which is "amiga" here
    var nm = new BABYLON.NormalMapProceduralTexture("normalMapPT", 128, scene);

    return nm;
};