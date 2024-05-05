import { SpotLight } from "./spotLight";
import { Scene } from "core/scene";
import { Axis } from "core/Maths/math.axis";
import { CreateCylinder } from "core/Meshes/Builders/cylinderBuilder";
import { Mesh } from "core/Meshes/mesh";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import "../Shaders/volumetricSpot.fragment";
import "../Shaders/volumetricSpot.vertex";

export interface IVolumetricSpotLight {
    diameterTop: number;
    diameterBottom: number;
    rayLength?: number;
    scene: Scene;
}

export class VolumetricSpotLight implements IVolumetricSpotLight {
    diameterTop: number;
    diameterBottom: number;
    rayLength?: number;
    scene: Scene;
    public spotLight: SpotLight;
    public volumetricMaterial: ShaderMaterial;
    public spotLightCone: Mesh;

    constructor(spotLight: SpotLight, diameterTop: number, diameterBottom: number, rayLength: number, scene: Scene) {
        this.spotLight = spotLight;
        this.diameterTop = diameterTop;
        this.diameterBottom = diameterBottom;
        this.rayLength = rayLength;
        this.scene = scene;
        this.createVolumetricSpotLight();

        this.scene.registerBeforeRender(() => {
            this._update();
        });
    }

    private createVolumetricSpotLight(){
        const lightPos = this.spotLight.position.clone();
        const spotLightCone = CreateCylinder("spotLightCone", {diameterTop: this.diameterTop, diameterBottom: this.diameterBottom, height: this.rayLength}, this.scene);
        spotLightCone.rotate(Axis.X, -Math.PI / 2);
        spotLightCone.translate(Axis.Y, -this.rayLength! / 2);
        spotLightCone.bakeCurrentTransformIntoVertices();
        
        const dir = lightPos.subtract(this.spotLight.direction)
        const len = dir.length();
        spotLightCone.lookAt(lightPos.subtract(this.spotLight.direction.normalize().scale(-len)));
        spotLightCone.position.copyFrom(lightPos.add(this.spotLight.direction.normalize().scale(-1/(len * this.rayLength!))));
        
        
        this.volumetricMaterial = new ShaderMaterial('volumetricSpotLightMaterial', this.scene, 'volumetricSpot', {
              attributes: ["position", "normal", "uv"],
              uniforms: ["world", "worldView", "worldViewProjection", "view", "projection" ],
              needAlphaBlending: true,
              needAlphaTesting: true
        });
        this.volumetricMaterial.setFloat("exponent", this.spotLight.exponent);
        this.volumetricMaterial.setFloat("angle", this.spotLight.angle / 100)
        this.volumetricMaterial.setColor3("diffuse", this.spotLight.diffuse);
        this.volumetricMaterial.setVector3("lightPos", lightPos);
        this.volumetricMaterial.setFloat("intensity", this.spotLight.intensity);

        spotLightCone.material = this.volumetricMaterial;
        this.spotLightCone = spotLightCone;
    }
    
    private _update(){
        const lightPos = this.spotLight.position.clone();
        const dir = lightPos.subtract(this.spotLight.direction)
        const len = dir.length();
        this.spotLightCone.lookAt(lightPos.subtract(this.spotLight.direction.normalize().scale(-len)));
        this.spotLightCone.position.copyFrom(lightPos.add(this.spotLight.direction.normalize().scale(-1/(len * this.rayLength!))));
        this.volumetricMaterial.setFloat("exponent", this.spotLight.exponent);
        this.volumetricMaterial.setFloat("angle", this.spotLight.angle / 100)
        this.volumetricMaterial.setColor3("diffuse", this.spotLight.diffuse);
        this.volumetricMaterial.setVector3("lightPos", lightPos);
        this.volumetricMaterial.setFloat("intensity", this.spotLight.intensity);
    }
}