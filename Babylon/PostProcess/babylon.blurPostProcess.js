var BABYLON = BABYLON || {};

(function () {
    BABYLON.BlurPostProcess = function (name, direction, blurWidth, ratio, camera) {
        BABYLON.PostProcess.call(this, name, "blur", ["screenSize", "direction", "blurWidth"], null, ratio, camera);

        this.direction = direction;
        this.blurWidth = blurWidth;
        var that = this;
        this.onApply = function (effect) {
            effect.setFloat2("screenSize", that.width, that.height);
            effect.setVector2("direction", that.direction);
            effect.setFloat("blurWidth", that.blurWidth);
        };
    };
    
    BABYLON.BlurPostProcess.prototype = Object.create(BABYLON.PostProcess.prototype);

})();