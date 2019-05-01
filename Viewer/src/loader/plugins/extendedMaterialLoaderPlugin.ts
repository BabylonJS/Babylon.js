import { Material } from 'babylonjs/Materials/material';
import { PBRMaterial } from 'babylonjs/Materials/PBR/pbrMaterial';
import { Engine } from 'babylonjs/Engines/engine';
import { ILoaderPlugin } from './loaderPlugin';

/**
 * A (PBR) material will be extended using this function.
 * This function will hold extra default configuration for the viewer, if not implemented in Babylon itself.
 */
export class ExtendedMaterialLoaderPlugin implements ILoaderPlugin {

    public onMaterialLoaded(baseMaterial: Material) {
        var material = baseMaterial as PBRMaterial;
        material.alphaMode = Engine.ALPHA_PREMULTIPLIED_PORTERDUFF;
    }
}