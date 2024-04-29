import { Vector3 } from "core/Maths/math.vector";
import { SpotLight } from "./spotLight";
import { Scene } from "core/scene";
import { Axis } from "core/Maths/math.axis";
import { CreateCylinder } from "core/Meshes/Builders/cylinderBuilder";
import { Mesh } from "core/Meshes/mesh";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import "../Shaders/volumetricSpot.fragment";
import "../Shaders/volumetricSpot.vertex";

export class VolumetricSpotLight extends SpotLight {
    public spotLightCone: Mesh;
    public volumetricMaterial: ShaderMaterial;
    private _diameterTop: number;
    private _diameterBottom: number;
    protected _rayLength: number = 1;

    /**
     * Creates a volumetric spotlight effect, extended from the SpotLight class
     * @params ...SpotLight parameters
     * @param diameterTop the diameter of the top of the cone
     * @param diameterBottom the diameter of the bottom of the cone
     */
    constructor(name: string, position: Vector3, direction: Vector3, angle: number, exponent: number, diameterTop: number, diameterBottom: number, scene?: Scene) {
        super(name, position, direction, angle, exponent, scene);
        this._diameterTop = diameterTop;
        this._diameterBottom = diameterBottom;
        this.createVolumetricSpotLight();

        this._scene.registerBeforeRender(() => {
            this._update();
        });
    }
    /**
     * Creates the VolumetricSpotLight
     */
    private createVolumetricSpotLight() {
        const lightPos = this.getAbsolutePosition();
        this.spotLightCone = CreateCylinder("spotLightCone", {diameterTop: this._diameterTop, diameterBottom: this._diameterBottom}, this._scene);
        this.spotLightCone.rotate(Axis.X, -Math.PI / 2);
        this.spotLightCone.translate(Axis.Y, -1);
        this.spotLightCone.bakeCurrentTransformIntoVertices();
        this.spotLightCone.lookAt(this.direction);
        this.spotLightCone.position.copyFrom(lightPos.add(this.direction.normalize().scale(-0.05)));
        this.spotLightCone.scaling.z = this._rayLength ?? 1.0;

        this.volumetricMaterial = new ShaderMaterial('volumetricSpotLightMaterial', this._scene, 'volumetricSpot', {
              attributes: ["position", "normal", "uv"],
              uniforms: ["world", "worldView", "worldViewProjection", "view", "projection" ],
              needAlphaBlending: true,
              needAlphaTesting: true
        });
        this.volumetricMaterial.setFloat("exponent", this.exponent);
        this.volumetricMaterial.setFloat("angle", this.angle / 100)
        this.volumetricMaterial.setColor3("diffuse", this.diffuse);
        this.volumetricMaterial.setVector3("lightPos", lightPos);
        this.volumetricMaterial.setFloat("intensity", this.intensity);

        this.spotLightCone.material = this.volumetricMaterial
    }
    /**
     * Updates the VolumetricSpotLight properties
     */
    private _update(){
        const lightPos = this.getAbsolutePosition();
        this.spotLightCone.position.copyFrom(lightPos.add(this.direction.normalize().scale(-0.05)));
        this.spotLightCone.lookAt(this.direction);
        this.spotLightCone.scaling.z = this._rayLength ?? 1.0;
        this.volumetricMaterial.setFloat("exponent", this.exponent);
        this.volumetricMaterial.setFloat("angle", this.angle / 100)
        this.volumetricMaterial.setColor3("diffuse", this.diffuse);
        this.volumetricMaterial.setVector3("lightPos", lightPos);
        this.volumetricMaterial.setFloat("intensity", this.intensity);
    }
}