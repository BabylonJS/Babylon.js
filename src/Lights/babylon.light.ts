module BABYLON {

    export interface IShadowLight {
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
        public diffuse = new Color3(1.0, 1.0, 1.0);
        public specular = new Color3(1.0, 1.0, 1.0);
        public intensity = 1.0;
        public range = Number.MAX_VALUE;
        public includeOnlyWithLayerMask = 0;
        public includedOnlyMeshes = new Array<AbstractMesh>();
        public excludedMeshes = new Array<AbstractMesh>();
        public excludeWithLayerMask = 0;

        public _shadowGenerator: ShadowGenerator;
        private _parentedWorldMatrix: Matrix;
        public _excludedMeshesIds = new Array<string>();
        public _includedOnlyMeshesIds = new Array<string>();

        constructor(name: string, scene: Scene) {
            super(name, scene);

            scene.addLight(this);
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

        public static ParseLight(parsedLight: any, scene: Scene): Light {
            var light;

            switch (parsedLight.type) {
                case 0:
                    light = new PointLight(parsedLight.name, Vector3.FromArray(parsedLight.position), scene);
                    break;
                case 1:
                    light = new DirectionalLight(parsedLight.name, Vector3.FromArray(parsedLight.direction), scene);
                    light.position = Vector3.FromArray(parsedLight.position);
                    break;
                case 2:
                    light = new SpotLight(parsedLight.name, Vector3.FromArray(parsedLight.position), Vector3.FromArray(parsedLight.direction), parsedLight.angle, parsedLight.exponent, scene);
                    break;
                case 3:
                    light = new HemisphericLight(parsedLight.name, Vector3.FromArray(parsedLight.direction), scene);
                    light.groundColor = Color3.FromArray(parsedLight.groundColor);
                    break;
            }

            light.id = parsedLight.id;

            Tags.AddTagsTo(light, parsedLight.tags);

            if (parsedLight.intensity !== undefined) {
                light.intensity = parsedLight.intensity;
            }

            if (parsedLight.range) {
                light.range = parsedLight.range;
            }

            light.diffuse = Color3.FromArray(parsedLight.diffuse);
            light.specular = Color3.FromArray(parsedLight.specular);

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

                    light.animations.push(Animation.ParseAnimation(parsedAnimation));
                }
            }

            if (parsedLight.autoAnimate) {
                scene.beginAnimation(light, parsedLight.autoAnimateFrom, parsedLight.autoAnimateTo, parsedLight.autoAnimateLoop, 1.0);
            }
            
            return light;
        }
    }
} 
