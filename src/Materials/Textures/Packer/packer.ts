import { BaseTexture } from "../../Materials/Textures/baseTexture";
import { Constants } from "../../../Engines/constants";
import { AbstractMesh } from "../../../Meshes/abstractMesh";
import { VertexBuffer } from "../../../Meshes/buffer";
import { Scene } from "../../../scene";

/**
 * Defines the basic options interface of a SpriteMap
 */
export interface IPackerOptions{

    /**
	 * Custom targets for the channels of a texture packer.  Default is all the channels of the Standard Material
	 */
    map?: string[];

    /**
	 * the UV input targets, as a single value for all meshes or an array of values that matches the mesh count.  Defaults to VertexBuffer.UVKind
	 */
    uvsIn?: string | string[];

    /**
	 * the UV output targets, as a single value for all meshes or an array of values that matches the mesh count.  Defaults to VertexBuffer.UVKind
	 */
    uvsOut?: string | string[];

    /**
	 * number representing the layout style. Defaults to LAYOUT_STRIP
	 */
    layout?: number;

    /**
	 * number of columns if using custom column count layout(2).  This defaults to 4.
	 */
    colcount?: number;

    /**
	 * flag to update the input meshes to the new packed texture after compilation. Defaults to true.
	 */
    updateInputMeshes?: boolean;

    /**
	* boolean flag to dispose all the source textures.  Defaults to true.
	*/
    disposeSource?: boolean;

    /**
	 * Fills the blank cells in a set to the customFillColor.  Defaults to true.
	 */
    fillBlanks?: boolean;
    
    /**
	 * string value representing the context fill style color.  Defaults to 'black'.
	 */
    customFillColor?: string;

}

/**
 * This is a support class that generates a series of packed texture sets.
 * @see #TODO ADD THIS
 */ 
export class Packer{ 
   
    /** mag = nearest and min = nearest and mip = nearest */
    public static readonly LAYOUT_STRIP = Constants.LAYOUT_STRIP;
    /** mag = nearest and min = linear and mip = nearest */
    public static readonly LAYOUT_POWER2 = Constants.LAYOUT_POWER2;
    /** mag = nearest and min = linear and mip = linear */
    public static readonly LAYOUT_COLNUM = Constants.LAYOUT_COLNUM;

    /** Arguments passed with the Constructor */
    public options: IPackerOptions;


    /**
    * Initializes a texture package series from an array of meshes or a single mesh. 
    * @param name The name of the package
    * @param meshes The target meshes to compose the package from
    * @param options The arguments that texture packer should follow while building.
    * @param scene The scene which the textures are scoped to.
    * @returns Packer
    */
    constructor(name: string, meshes: AbstractMesh | AbstractMesh[], options: IPackerOptions, scene: Scene ){
        /**
        * Run through the options and set what ever defaults are needed that where not declared.
        */
        this.options = options;
        this.options.map = this.options.map || [
                'ambientTexture',
                'bumpTexture',
                'diffuseTexture',
                'emissiveTexture',
                'lightmapTexture',
                'opacityTexture',
                'reflectionTexture',
                'refractionTexture',
                'specularTexture'
            ];            
      
        this.options.uvsIn = this.options.uvsIn || VertexBuffer.UVKind;
        this.options.uvsOut = this.options.uvsOut || VertexBuffer.UVKind;
        this.options.layout = this.options.layout || Packer.LAYOUT_STRIP;
        
        if(this.options.layout === Packer.LAYOUT_COLNUM){
            this.options.colcount = this.options.colcount || 4;
        }
        
        this.options.updateInputMeshes = this.options.updateInputMeshes || true;
        this.options.disposeSource = this.options.disposeSource || true;
        this.options.fillBlanks = this.options.fillBlanks || true;
        
        if(this.options.fillBlanks === true){
            this.options.customFillColor = this.options.customFillColor || 'black';
        }        
        
              
    }    
}