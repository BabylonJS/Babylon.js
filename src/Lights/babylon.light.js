var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
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
            // PBR Properties.
            this.radius = 0.00001;
            this._excludedMeshesIds = new Array();
            this._includedOnlyMeshesIds = new Array();
            scene.addLight(this);
        }
        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        Light.prototype.toString = function (fullDetails) {
            var ret = "Name: " + this.name;
            ret += ", type: " + (["Point", "Directional", "Spot", "Hemispheric"])[this.getTypeID()];
            if (this.animations) {
                for (var i = 0; i < this.animations.length; i++) {
                    ret += ", animation[0]: " + this.animations[i].toString(fullDetails);
                }
            }
            if (fullDetails) {
            }
            return ret;
        };
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
            _super.prototype.dispose.call(this);
        };
        Light.prototype.getTypeID = function () {
            return 0;
        };
        Light.prototype.clone = function (name) {
            return BABYLON.SerializationHelper.Clone(Light.GetConstructorFromName(this.getTypeID(), name, this.getScene()), this);
        };
        Light.prototype.serialize = function () {
            var serializationObject = BABYLON.SerializationHelper.Serialize(this);
            // Type
            serializationObject.type = this.getTypeID();
            // Parent
            if (this.parent) {
                serializationObject.parentId = this.parent.id;
            }
            // Inclusion / exclusions
            if (this.excludedMeshes.length > 0) {
                serializationObject.excludedMeshesIds = [];
                this.excludedMeshes.forEach(function (mesh) {
                    serializationObject.excludedMeshesIds.push(mesh.id);
                });
            }
            if (this.includedOnlyMeshes.length > 0) {
                serializationObject.includedOnlyMeshesIds = [];
                this.includedOnlyMeshes.forEach(function (mesh) {
                    serializationObject.includedOnlyMeshesIds.push(mesh.id);
                });
            }
            // Animations  
            BABYLON.Animation.AppendSerializedAnimations(this, serializationObject);
            serializationObject.ranges = this.serializeAnimationRanges();
            return serializationObject;
        };
        Light.GetConstructorFromName = function (type, name, scene) {
            switch (type) {
                case 0:
                    return function () { return new BABYLON.PointLight(name, BABYLON.Vector3.Zero(), scene); };
                case 1:
                    return function () { return new BABYLON.DirectionalLight(name, BABYLON.Vector3.Zero(), scene); };
                case 2:
                    return function () { return new BABYLON.SpotLight(name, BABYLON.Vector3.Zero(), BABYLON.Vector3.Zero(), 0, 0, scene); };
                case 3:
                    return function () { return new BABYLON.HemisphericLight(name, BABYLON.Vector3.Zero(), scene); };
            }
        };
        Light.Parse = function (parsedLight, scene) {
            var light = BABYLON.SerializationHelper.Parse(Light.GetConstructorFromName(parsedLight.type, parsedLight.name, scene), parsedLight, scene);
            // Inclusion / exclusions
            if (parsedLight.excludedMeshesIds) {
                light._excludedMeshesIds = parsedLight.excludedMeshesIds;
            }
            if (parsedLight.includedOnlyMeshesIds) {
                light._includedOnlyMeshesIds = parsedLight.includedOnlyMeshesIds;
            }
            // Parent
            if (parsedLight.parentId) {
                light._waitingParentId = parsedLight.parentId;
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
                scene.beginAnimation(light, parsedLight.autoAnimateFrom, parsedLight.autoAnimateTo, parsedLight.autoAnimateLoop, parsedLight.autoAnimateSpeed || 1.0);
            }
            return light;
        };
        __decorate([
            BABYLON.serializeAsColor3()
        ], Light.prototype, "diffuse", void 0);
        __decorate([
            BABYLON.serializeAsColor3()
        ], Light.prototype, "specular", void 0);
        __decorate([
            BABYLON.serialize()
        ], Light.prototype, "intensity", void 0);
        __decorate([
            BABYLON.serialize()
        ], Light.prototype, "range", void 0);
        __decorate([
            BABYLON.serialize()
        ], Light.prototype, "includeOnlyWithLayerMask", void 0);
        __decorate([
            BABYLON.serialize()
        ], Light.prototype, "excludeWithLayerMask", void 0);
        __decorate([
            BABYLON.serialize()
        ], Light.prototype, "radius", void 0);
        return Light;
    }(BABYLON.Node));
    BABYLON.Light = Light;
})(BABYLON || (BABYLON = {}));
