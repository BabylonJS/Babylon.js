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
        const lightPos = this.spotLight.getAbsolutePosition();
        const spotLightCone = CreateCylinder("spotLightCone", {diameterTop: this.diameterTop, diameterBottom: this.diameterBottom}, this.scene);
        spotLightCone.rotate(Axis.X, -Math.PI / 2);
        spotLightCone.translate(Axis.Y, -1);
        spotLightCone.bakeCurrentTransformIntoVertices();
        spotLightCone.lookAt(this.spotLight.direction);
        spotLightCone.position.copyFrom(lightPos.add(this.spotLight.direction.normalize().scale(-0.05)));
        spotLightCone.scaling.z = this.rayLength!;

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
        const lightPos = this.spotLight.getAbsolutePosition();
        this.spotLightCone.position.copyFrom(lightPos.add(this.spotLight.direction.normalize().scale(-0.05)));
        this.spotLightCone.lookAt(this.spotLight.direction);
        this.spotLightCone.scaling.z = this.rayLength ?? 1.0;
        this.volumetricMaterial.setFloat("exponent", this.spotLight.exponent);
        this.volumetricMaterial.setFloat("angle", this.spotLight.angle / 100)
        this.volumetricMaterial.setColor3("diffuse", this.spotLight.diffuse);
        this.volumetricMaterial.setVector3("lightPos", lightPos);
        this.volumetricMaterial.setFloat("intensity", this.spotLight.intensity);
    }
}