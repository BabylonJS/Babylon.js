module BABYLON {

    export interface IShadowLight {
        id: string;
        position: Vector3;
        transformedPosition: Vector3;
        name: string;

        computeTransformedPosition(): boolean;
        getScene(): Scene;

        setShadowProjectionMatrix(matrix: Matrix, viewMatrix: Matrix, renderList: Array<AbstractMesh>): void;

        supportsVSM(): boolean;
        needRefreshPerFrame(): boolean;
        needCube(): boolean;

        getShadowDirection(faceIndex?: number): Vector3;

        _shadowGenerator: ShadowGenerator;
    }

    export class Light extends Node {
        @serializeAsColor3()
        public diffuse = new Color3(1.0, 1.0, 1.0);

        @serializeAsColor3()
        public specular = new Color3(1.0, 1.0, 1.0);

        @serialize()
        public intensity = 1.0;

        @serialize()
        public range = Number.MAX_VALUE;

        @serialize()
        public includeOnlyWithLayerMask = 0;

        public includedOnlyMeshes = new Array<AbstractMesh>();
        public excludedMeshes = new Array<AbstractMesh>();
        public excludeWithLayerMask = 0;

        // PBR Properties.
        @serialize()
        public radius = 0.00001;

        public _shadowGenerator: ShadowGenerator;
        private _parentedWorldMatrix: Matrix;
        public _excludedMeshesIds = new Array<string>();
        public _includedOnlyMeshesIds = new Array<string>();

        constructor(name: string, scene: Scene) {
            super(name, scene);

            scene.addLight(this);
        }

        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        public toString(fullDetails? : boolean) : string {
            var ret = "Name: " + this.name;
            ret += ", type: " + (["Point", "Directional", "Spot", "Hemispheric"])[this.getTypeID()];
            if (this.animations){
                for (var i = 0; i < this.animations.length; i++){
                   ret += ", animation[0]: " + this.animations[i].toString(fullDetails);
                }
            }
            if (fullDetails){
            }
            return ret;
        } 
        
        public getShadowGenerator(): ShadowGenerator {
            return this._shadowGenerator;
        }

        public getAbsolutePosition(): Vector3 {
            return Vector3.Zero();
        }

        public transferToEffect(effect: Effect, uniformName0?: string, uniformName1?: string): void {
        }

        public _getWorldMatrix(): Matrix {
            return Matrix.Identity();
        }

        public canAffectMesh(mesh: AbstractMesh): boolean {
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
        }

        public getWorldMatrix(): Matrix {
            this._currentRenderId = this.getScene().getRenderId();

            var worldMatrix = this._getWorldMatrix();

            if (this.parent && this.parent.getWorldMatrix) {
                if (!this._parentedWorldMatrix) {
                    this._parentedWorldMatrix = Matrix.Identity();
                }

                worldMatrix.multiplyToRef(this.parent.getWorldMatrix(), this._parentedWorldMatrix);

                this._markSyncedWithParent();

                return this._parentedWorldMatrix;
            }

            return worldMatrix;
        }

        public dispose(): void {
            if (this._shadowGenerator) {
                this._shadowGenerator.dispose();
                this._shadowGenerator = null;
            }

            // Animations
            this.getScene().stopAnimation(this);

            // Remove from scene
            this.getScene().removeLight(this);
        }

        public getTypeID(): number {
            return 0;
        }

        public clone(name: string): Light {
            return SerializationHelper.Clone(Light.GetConstructorFromName(this.getTypeID(), name, this.getScene()), this);
        }

        public serialize(): any {
            var serializationObject = SerializationHelper.Serialize(this);

            // Type
            serializationObject.type = this.getTypeID();

            // Parent
            if (this.parent) {
                serializationObject.parentId = this.parent.id;
            }

            // Animations  
            Animation.AppendSerializedAnimations(this, serializationObject);
            serializationObject.ranges = this.serializeAnimationRanges();  

            return serializationObject;
        }

        static GetConstructorFromName(type: number, name: string, scene: Scene): () => Light {
            switch (type) {
                case 0:
                    return () => new PointLight(name, Vector3.Zero(), scene);
                case 1:
                    return () => new DirectionalLight(name, Vector3.Zero(), scene);
                case 2:
                    return () => new SpotLight(name, Vector3.Zero(), Vector3.Zero(), 0, 0, scene);
                case 3:
                    return () => new HemisphericLight(name, Vector3.Zero(), scene);
            }
        }

        public static Parse(parsedLight: any, scene: Scene): Light {            
            var light = SerializationHelper.Parse(Light.GetConstructorFromName(parsedLight.type, parsedLight.name, scene), parsedLight, scene);

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

                    light.animations.push(Animation.Parse(parsedAnimation));
                }
                Node.ParseAnimationRanges(light, parsedLight, scene);
            }

            if (parsedLight.autoAnimate) {
                scene.beginAnimation(light, parsedLight.autoAnimateFrom, parsedLight.autoAnimateTo, parsedLight.autoAnimateLoop, parsedLight.autoAnimateSpeed || 1.0);
            }

            return light;
        }
    }
}
