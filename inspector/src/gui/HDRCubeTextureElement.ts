 module INSPECTOR {
     /**
     * Display a very small div. A new canvas is created, with a new Babylon.js scene, containing only the 
     * cube texture in a cube
     */
    export class HDRCubeTextureElement extends CubeTextureElement{

            
        /** The texture given as a parameter should be cube. */
        constructor(tex : BABYLON.Texture) {
            super(tex);
        }
        
        /** Creates the box  */
        protected _populateScene() {
            // Create the hdr texture
            let hdrTexture                      = new BABYLON.HDRCubeTexture(this._textureUrl, this._scene, 512);
            hdrTexture.coordinatesMode          = BABYLON.Texture.SKYBOX_MODE;
            
            this._cube                          = BABYLON.Mesh.CreateBox("hdrSkyBox", 10.0, this._scene);
            let hdrSkyboxMaterial               = new BABYLON.PBRMaterial("skyBox", this._scene);
            hdrSkyboxMaterial.backFaceCulling   = false;
            hdrSkyboxMaterial.reflectionTexture = hdrTexture;
            hdrSkyboxMaterial.microSurface      = 1.0;
            hdrSkyboxMaterial.disableLighting   = true;
            this._cube.material                 = hdrSkyboxMaterial;
            this._cube.registerBeforeRender(() => {
                this._cube.rotation.y += 0.01;
            })
        }        
    }
 }