import { HDRCubeTexture, Mesh, PBRMaterial, Texture } from "babylonjs";
import { CubeTextureElement } from "./CubeTextureElement";

/**
* Display a very small div. A new canvas is created, with a new js scene, containing only the
* cube texture in a cube
*/
export class HDRCubeTextureElement extends CubeTextureElement {

    /** The texture given as a parameter should be cube. */
    constructor(tex: Texture) {
        super(tex);
    }

    /** Creates the box  */
    protected _populateScene() {
        // Create the hdr texture
        let hdrTexture = new HDRCubeTexture(this._textureUrl, this._scene, 512);
        hdrTexture.coordinatesMode = Texture.SKYBOX_MODE;

        this._cube = Mesh.CreateBox("hdrSkyBox", 10.0, this._scene);
        let hdrSkyboxMaterial = new PBRMaterial("skyBox", this._scene);
        hdrSkyboxMaterial.backFaceCulling = false;
        hdrSkyboxMaterial.reflectionTexture = hdrTexture;
        hdrSkyboxMaterial.microSurface = 1.0;
        hdrSkyboxMaterial.disableLighting = true;
        this._cube.material = hdrSkyboxMaterial;
        this._cube.registerBeforeRender(() => {
            this._cube.rotation.y += 0.01;
        });
    }
}
