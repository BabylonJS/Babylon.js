var BABYLON = BABYLON || {};

(function () {
    BABYLON.Material = function (name, scene) {
        this.name = name;
        this.id = name;
        
        this._scene = scene;
        scene.materials.push(this);
    };
    
    // Members
    BABYLON.Material.prototype.checkReadyOnEveryCall = true;
    BABYLON.Material.prototype.alpha = 1.0;
    BABYLON.Material.prototype.wireframe = false;
    BABYLON.Material.prototype.backFaceCulling = true;
    BABYLON.Material.prototype._effect = null;

    BABYLON.Material.prototype.onDispose = null;
    
    // Properties
    BABYLON.Material.prototype.isReady = function (mesh) {
        return true;
    };

    BABYLON.Material.prototype.getEffect = function () {
        return this._effect;
    };
    
    BABYLON.Material.prototype.needAlphaBlending = function () {
        return (this.alpha < 1.0);
    };
    
    BABYLON.Material.prototype.needAlphaTesting = function () {
        return false;
    };

    // Methods   
    BABYLON.Material.prototype._preBind = function () {
        var engine = this._scene.getEngine();
        
        engine.enableEffect(this._effect);
        engine.setState(this.backFaceCulling);
    };

    BABYLON.Material.prototype.bind = function (world, mesh) {       
    };
    
    BABYLON.Material.prototype.unbind = function () {
    };
    
    BABYLON.Material.prototype.baseDispose = function () {
        // Remove from scene
        var index = this._scene.materials.indexOf(this);
        this._scene.materials.splice(index, 1);

        // Callback
        if (this.onDispose) {
            this.onDispose();
        }
    };

    BABYLON.Material.prototype.dispose = function () {
        this.baseDispose();
    };
})();