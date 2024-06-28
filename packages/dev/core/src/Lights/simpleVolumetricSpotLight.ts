import { SpotLight } from "./spotLight";
import { Scene } from "core/scene";
import { Axis } from "core/Maths/math.axis";
import { CreateCylinder } from "core/Meshes/Builders/cylinderBuilder";
import { Mesh } from "core/Meshes/mesh";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import "../Shaders/simpleVolumetricSpot.fragment";
import "../Shaders/simpleVolumetricSpot.vertex";
import { Observer, RenderTargetTexture, TmpVectors } from "..";


export class SimpleVolumetricSpotLight {
    private _diameterTop: number;
    private _diameterBottom: number;
    private _rayLength: number;
    private _softRadius: number;
    private _scene: Scene;
    private spotLight: SpotLight;
    private _volumetricMaterial: ShaderMaterial;
    private _lightCone: Mesh;
    private _observer: Observer<any>;
    private _depthTexture: RenderTargetTexture;

    constructor(spotLight: SpotLight, diameterTop: number, diameterBottom: number, rayLength: number, scene: Scene) {
        this.spotLight = spotLight;
        this._diameterTop = diameterTop;
        this._diameterBottom = diameterBottom;
        this._rayLength = rayLength;
        this._scene = scene;
        this.createSimpleVolumetricSpotLight();

        this._observer = this._scene.onBeforeRenderObservable.add(() => {
            this._update();
        });
    }

    public get lightCone(): Mesh {
        return this._lightCone;
    }

    public get lightMaterial(): ShaderMaterial {
        return this._volumetricMaterial;
    }

    public set softRadius(value: number){
        this._softRadius = value;
    }

    public set depthTexture(value: RenderTargetTexture){
        this._depthTexture = value;
    }

    private createSimpleVolumetricSpotLight(){
        const spotLightCone = CreateCylinder("spotLightCone", {diameterTop: this._diameterTop, diameterBottom: this._diameterBottom, height: this._rayLength, cap: Mesh.CAP_END}, this._scene);
        spotLightCone.rotate(Axis.X, -Math.PI / 2);
        spotLightCone.translate(Axis.Y, -this._rayLength / 2); //pivot at the bottom
        spotLightCone.bakeCurrentTransformIntoVertices();
        
        this._volumetricMaterial = new ShaderMaterial('volumetricSpotLightMaterial', this._scene, 'simpleVolumetricSpot', {
            attributes: ["position", "normal"],
            uniforms: ["world", "worldViewProjection", "view"],
            needAlphaBlending: true,
        });

        const renderer = this._scene.enableDepthRenderer();

        this._depthTexture = renderer.getDepthMap();
       
        this._updateUniforms();

        spotLightCone.material = this._volumetricMaterial;
        this._lightCone = spotLightCone;
    }
    
    private _updateUniforms(){
        this._volumetricMaterial.setFloat("exponent", this.spotLight.exponent);
        this._volumetricMaterial.setFloat("angle", this.spotLight.angle / 100)
        this._volumetricMaterial.setColor3("diffuse", this.spotLight.diffuse);
        this._volumetricMaterial.setVector3("lightPos", this.spotLight.position);
        this._volumetricMaterial.setFloat("intensity", this.spotLight.intensity);
        this._volumetricMaterial.setFloat("cameraNear", this._scene.activeCamera!.minZ);
        this._volumetricMaterial.setFloat("cameraFar", this._scene.activeCamera!.maxZ);
        this._volumetricMaterial.setFloat("softRadius", this._softRadius || 0.5);
        this._volumetricMaterial.setTexture("depthTexture", this._depthTexture);
        const resolution = TmpVectors.Vector2[0].set(this._scene.getEngine().getRenderWidth(), this._scene.getEngine().getRenderHeight());
        this._volumetricMaterial.setVector2("resolution", resolution);
    }

    private _update(){
        const lightPos = TmpVectors.Vector3[0].copyFrom(this.spotLight.position);
        const dir = TmpVectors.Vector3[1];
        lightPos.subtractToRef(this.spotLight.direction, dir);

        const len = dir.length();
        this._lightCone.lookAt(lightPos.subtract(this.spotLight.direction.normalize().scale(-len)));
        this._lightCone.position.copyFrom(lightPos.add(this.spotLight.direction.normalize().scale(-1/(len * this._rayLength))));

        this._updateUniforms();
    }

    public dispose(){
        this._scene.onBeforeRenderObservable.remove(this._observer);
        this._lightCone.dispose();
        this._volumetricMaterial.dispose();
    }
}