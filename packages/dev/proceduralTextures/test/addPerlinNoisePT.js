window.addPerlinNoisePT = function() {
    var pn = new BABYLON.PerlinNoiseProceduralTexture("perlinNoisePT", 512, scene);
    return pn;
};