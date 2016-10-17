window.addDigitalRainPP = function(camera) {
    var postProcess = new BABYLON.DigitalRainPostProcess("digitalRain", camera);
    return postProcess;
};