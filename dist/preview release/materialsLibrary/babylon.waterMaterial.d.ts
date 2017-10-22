
declare module BABYLON {
    class WaterMaterial extends PushMaterial {
        renderTargetSize: Vector2;
        private _bumpTexture;
        bumpTexture: BaseTexture;
        diffuseColor: Color3;
        specularColor: Color3;
        specularPower: number;
        private _disableLighting;
        disableLighting: boolean;
        private _maxSimultaneousLights;
        maxSimultaneousLights: number;
        /**
        * @param {number}: Represents the wind force
        */
        windForce: number;
        /**
        * @param {Vector2}: The direction of the wind in the plane (X, Z)
        */
        windDirection: Vector2;
        /**
        * @param {number}: Wave height, represents the height of the waves
        */
        waveHeight: number;
        /**
        * @param {number}: Bump height, represents the bump height related to the bump map
        */
        bumpHeight: number;
        /**
         * @param {boolean}: Add a smaller moving bump to less steady waves.
         */
        private _bumpSuperimpose;
        bumpSuperimpose: boolean;
        /**
         * @param {boolean}: Color refraction and reflection differently with .waterColor2 and .colorBlendFactor2. Non-linear (physically correct) fresnel.
         */
        private _fresnelSeparate;
        fresnelSeparate: boolean;
        /**
         * @param {boolean}: bump Waves modify the reflection.
         */
        private _bumpAffectsReflection;
        bumpAffectsReflection: boolean;
        /**
        * @param {number}: The water color blended with the refraction (near)
        */
        waterColor: Color3;
        /**
        * @param {number}: The blend factor related to the water color
        */
        colorBlendFactor: number;
        /**
         * @param {number}: The water color blended with the reflection (far)
         */
        waterColor2: Color3;
        /**
         * @param {number}: The blend factor related to the water color (reflection, far)
         */
        colorBlendFactor2: number;
        /**
        * @param {number}: Represents the maximum length of a wave
        */
        waveLength: number;
        /**
        * @param {number}: Defines the waves speed
        */
        waveSpeed: number;
        protected _renderTargets: SmartArray<RenderTargetTexture>;
        private _mesh;
        private _refractionRTT;
        private _reflectionRTT;
        private _reflectionTransform;
        private _lastTime;
        private _lastDeltaTime;
        private _renderId;
        private _useLogarithmicDepth;
        /**
        * Constructor
        */
        constructor(name: string, scene: Scene, renderTargetSize?: Vector2);
        useLogarithmicDepth: boolean;
        readonly refractionTexture: RenderTargetTexture;
        readonly reflectionTexture: RenderTargetTexture;
        addToRenderList(node: any): void;
        enableRenderTargets(enable: boolean): void;
        getRenderList(): AbstractMesh[];
        readonly renderTargetsEnabled: boolean;
        needAlphaBlending(): boolean;
        needAlphaTesting(): boolean;
        getAlphaTestTexture(): BaseTexture;
        isReadyForSubMesh(mesh: AbstractMesh, subMesh: SubMesh, useInstances?: boolean): boolean;
        bindForSubMesh(world: Matrix, mesh: Mesh, subMesh: SubMesh): void;
        private _createRenderTargets(scene, renderTargetSize);
        getAnimatables(): IAnimatable[];
        getActiveTextures(): BaseTexture[];
        hasTexture(texture: BaseTexture): boolean;
        dispose(forceDisposeEffect?: boolean): void;
        clone(name: string): WaterMaterial;
        serialize(): any;
        getClassName(): string;
        static Parse(source: any, scene: Scene, rootUrl: string): WaterMaterial;
        static CreateDefaultMesh(name: string, scene: Scene): Mesh;
    }
}
