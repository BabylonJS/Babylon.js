var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var Light = (function (_super) {
        __extends(Light, _super);
        function Light(name, scene) {
            _super.call(this, name, scene);
            this.diffuse = new BABYLON.Color3(1.0, 1.0, 1.0);
            this.specular = new BABYLON.Color3(1.0, 1.0, 1.0);
            this.intensity = 1.0;
            this.range = Number.MAX_VALUE;
            this.includeOnlyWithLayerMask = 0;
            this.includedOnlyMeshes = new Array();
            this.excludedMeshes = new Array();
            this.excludeWithLayerMask = 0;
            this._excludedMeshesIds = new Array();
            this._includedOnlyMeshesIds = new Array();
            scene.addLight(this);
        }
        Light.prototype.getShadowGenerator = function () {
            return this._shadowGenerator;
        };
        Light.prototype.getAbsolutePosition = function () {
            return BABYLON.Vector3.Zero();
        };
        Light.prototype.transferToEffect = function (effect, uniformName0, uniformName1) {
        };
        Light.prototype._getWorldMatrix = function () {
            return BABYLON.Matrix.Identity();
        };
        Light.prototype.canAffectMesh = function (mesh) {
            if (!mesh) {
                return true;
            }
            if (this.includedOnlyMeshes.length > 0 && this.includedOnlyMeshes.indexOf(mesh) === -1) {
                return false;
            }
            if (this.excludedMeshes.length > 0 && this.excludedMeshes.indexOf(mesh) !== -1) {
                return false;
            }
            if (this.includeOnlyWithLayerMask !== 0 && (this.includeOnlyWithLayerMask & mesh.layerMask) === 0) {
                return false;
            }
            if (this.excludeWithLayerMask !== 0 && this.excludeWithLayerMask & mesh.layerMask) {
                return false;
            }
            return true;
        };
        Light.prototype.getWorldMatrix = function () {
            this._currentRenderId = this.getScene().getRenderId();
            var worldMatrix = this._getWorldMatrix();
            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._parentedWorldMatrix) {
                    this._parentedWorldMatrix = BABYLON.Matrix.Identity();
                }
                worldMatrix.multiplyToRef(this.parent.getWorldMatrix(), this._parentedWorldMatrix);
                this._markSyncedWithParent();
                return this._parentedWorldMatrix;
            }
            return worldMatrix;
        };
        Light.prototype.dispose = function () {
            if (this._shadowGenerator) {
                this._shadowGenerator.dispose();
                this._shadowGenerator = null;
            }
            // Animations
            this.getScene().stopAnimation(this);
            // Remove from scene
            this.getScene().removeLight(this);
        };
        Light.prototype.serialize = function () {
            var serializationObject = {};
            serializationObject.name = this.name;
            serializationObject.id = this.id;
            serializationObject.tags = BABYLON.Tags.GetTags(this);
            if (this.intensity) {
                serializationObject.intensity = this.intensity;
            }
            serializationObject.range = this.range;
            serializationObject.diffuse = this.diffuse.asArray();
            serializationObject.specular = this.specular.asArray();
            return serializationObject;
        };
        Light.Parse = function (parsedLight, scene) {
            var light;
            switch (parsedLight.type) {
                case 0:
                    light = new BABYLON.PointLight(parsedLight.name, BABYLON.Vector3.FromArray(parsedLight.position), scene);
                    break;
                case 1:
                    light = new BABYLON.DirectionalLight(parsedLight.name, BABYLON.Vector3.FromArray(parsedLight.direction), scene);
                    light.position = BABYLON.Vector3.FromArray(parsedLight.position);
                    break;
                case 2:
                    light = new BABYLON.SpotLight(parsedLight.name, BABYLON.Vector3.FromArray(parsedLight.position), BABYLON.Vector3.FromArray(parsedLight.direction), parsedLight.angle, parsedLight.exponent, scene);
                    break;
                case 3:
                    light = new BABYLON.HemisphericLight(parsedLight.name, BABYLON.Vector3.FromArray(parsedLight.direction), scene);
                    light.groundColor = BABYLON.Color3.FromArray(parsedLight.groundColor);
                    break;
            }
            light.id = parsedLight.id;
            BABYLON.Tags.AddTagsTo(light, parsedLight.tags);
            if (parsedLight.intensity !== undefined) {
                light.intensity = parsedLight.intensity;
            }
            if (parsedLight.range) {
                light.range = parsedLight.range;
            }
            light.diffuse = BABYLON.Color3.FromArray(parsedLight.diffuse);
            light.specular = BABYLON.Color3.FromArray(parsedLight.specular);
            if (parsedLight.excludedMeshesIds) {
                light._excludedMeshesIds = parsedLight.excludedMeshesIds;
            }
            // Parent
            if (parsedLight.parentId) {
                light._waitingParentId = parsedLight.parentId;
            }
            if (parsedLight.includedOnlyMeshesIds) {
                light._includedOnlyMeshesIds = parsedLight.includedOnlyMeshesIds;
            }
            // Animations
            if (parsedLight.animations) {
                for (var animationIndex = 0; animationIndex < parsedLight.animations.length; animationIndex++) {
                    var parsedAnimation = parsedLight.animations[animationIndex];
                    light.animations.push(BABYLON.Animation.Parse(parsedAnimation));
                }
                BABYLON.Node.ParseAnimationRanges(light, parsedLight, scene);
            }
            if (parsedLight.autoAnimate) {
                scene.beginAnimation(light, parsedLight.autoAnimateFrom, parsedLight.autoAnimateTo, parsedLight.autoAnimateLoop, 1.0);
            }
            return light;
        };
        return Light;
    })(BABYLON.Node);
    BABYLON.Light = Light;
})(BABYLON || (BABYLON = {}));
