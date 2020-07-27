import { Nullable } from "babylonjs/types";
import { Color3 } from 'babylonjs/Maths/math.color';
import { Texture } from "babylonjs/Materials/Textures/texture";
import { StandardMaterial } from "babylonjs/Materials/standardMaterial";

import { Scene } from "babylonjs/scene";
/**
 * Class reading and parsing the MTL file bundled with the obj file.
 */
export class MTLFileLoader {
   /**
    * Invert Y-Axis of referenced textures on load
    */
   public static INVERT_TEXTURE_Y = true;

    /**
     * All material loaded from the mtl will be set here
     */
    public materials: StandardMaterial[] = [];

    /**
     * This function will read the mtl file and create each material described inside
     * This function could be improve by adding :
     * -some component missing (Ni, Tf...)
     * -including the specific options available
     *
     * @param scene defines the scene the material will be created in
     * @param data defines the mtl data to parse
     * @param rootUrl defines the rooturl to use in order to load relative dependencies
     * @param forAssetContainer defines if the material should be registered in the scene
     */
    public parseMTL(scene: Scene, data: string | ArrayBuffer, rootUrl: string, forAssetContainer: boolean): void {
        if (data instanceof ArrayBuffer) {
            return;
        }

        //Split the lines from the file
        var lines = data.split('\n');
        //Space char
        var delimiter_pattern = /\s+/;
        //Array with RGB colors
        var color: number[];
        //New material
        var material: Nullable<StandardMaterial> = null;

        //Look at each line
        for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();

            // Blank line or comment
            if (line.length === 0 || line.charAt(0) === '#') {
                continue;
            }

            //Get the first parameter (keyword)
            var pos = line.indexOf(' ');
            var key = (pos >= 0) ? line.substring(0, pos) : line;
            key = key.toLowerCase();

            //Get the data following the key
            var value: string = (pos >= 0) ? line.substring(pos + 1).trim() : "";

            //This mtl keyword will create the new material
            if (key === "newmtl") {
                //Check if it is the first material.
                // Materials specifications are described after this keyword.
                if (material) {
                    //Add the previous material in the material array.
                    this.materials.push(material);
                }
                //Create a new material.
                // value is the name of the material read in the mtl file

                scene._blockEntityCollection = forAssetContainer;
                material = new StandardMaterial(value, scene);
                scene._blockEntityCollection = false;
            } else if (key === "kd" && material) {
                // Diffuse color (color under white light) using RGB values

                //value  = "r g b"
                color = <number[]>value.split(delimiter_pattern, 3).map(parseFloat);
                //color = [r,g,b]
                //Set tghe color into the material
                material.diffuseColor = Color3.FromArray(color);
            } else if (key === "ka" && material) {
                // Ambient color (color under shadow) using RGB values

                //value = "r g b"
                color = <number[]>value.split(delimiter_pattern, 3).map(parseFloat);
                //color = [r,g,b]
                //Set tghe color into the material
                material.ambientColor = Color3.FromArray(color);
            } else if (key === "ks" && material) {
                // Specular color (color when light is reflected from shiny surface) using RGB values

                //value = "r g b"
                color = <number[]>value.split(delimiter_pattern, 3).map(parseFloat);
                //color = [r,g,b]
                //Set the color into the material
                material.specularColor = Color3.FromArray(color);
            } else if (key === "ke" && material) {
                // Emissive color using RGB values
                color = value.split(delimiter_pattern, 3).map(parseFloat);
                material.emissiveColor = Color3.FromArray(color);
            } else if (key === "ns" && material) {

                //value = "Integer"
                material.specularPower = parseFloat(value);
            } else if (key === "d" && material) {
                //d is dissolve for current material. It mean alpha for BABYLON
                material.alpha = parseFloat(value);

                //Texture
                //This part can be improved by adding the possible options of texture
            } else if (key === "map_ka" && material) {
                // ambient texture map with a loaded image
                //We must first get the folder of the image
                material.ambientTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
            } else if (key === "map_kd" && material) {
                // Diffuse texture map with a loaded image
                material.diffuseTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
            } else if (key === "map_ks" && material) {
                // Specular texture map with a loaded image
                //We must first get the folder of the image
                material.specularTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
            } else if (key === "map_ns") {
                //Specular
                //Specular highlight component
                //We must first get the folder of the image
                //
                //Not supported by BABYLON
                //
                //    continue;
            } else if (key === "map_bump" && material) {
                //The bump texture
                material.bumpTexture = MTLFileLoader._getTexture(rootUrl, value, scene);
            } else if (key === "map_d" && material) {
                // The dissolve of the material
                material.opacityTexture = MTLFileLoader._getTexture(rootUrl, value, scene);

                //Options for illumination
            } else if (key === "illum") {
                //Illumination
                if (value === "0") {
                    //That mean Kd == Kd
                } else if (value === "1") {
                    //Color on and Ambient on
                } else if (value === "2") {
                    //Highlight on
                } else if (value === "3") {
                    //Reflection on and Ray trace on
                } else if (value === "4") {
                    //Transparency: Glass on, Reflection: Ray trace on
                } else if (value === "5") {
                    //Reflection: Fresnel on and Ray trace on
                } else if (value === "6") {
                    //Transparency: Refraction on, Reflection: Fresnel off and Ray trace on
                } else if (value === "7") {
                    //Transparency: Refraction on, Reflection: Fresnel on and Ray trace on
                } else if (value === "8") {
                    //Reflection on and Ray trace off
                } else if (value === "9") {
                    //Transparency: Glass on, Reflection: Ray trace off
                } else if (value === "10") {
                    //Casts shadows onto invisible surfaces
                }
            } else {
                // console.log("Unhandled expression at line : " + i +'\n' + "with value : " + line);
            }
        }
        //At the end of the file, add the last material
        if (material) {
            this.materials.push(material);
        }
    }

    /**
     * Gets the texture for the material.
     *
     * If the material is imported from input file,
     * We sanitize the url to ensure it takes the textre from aside the material.
     *
     * @param rootUrl The root url to load from
     * @param value The value stored in the mtl
     * @return The Texture
     */
    private static _getTexture(rootUrl: string, value: string, scene: Scene): Nullable<Texture> {
        if (!value) {
            return null;
        }

        var url = rootUrl;
        // Load from input file.
        if (rootUrl === "file:") {
            var lastDelimiter = value.lastIndexOf("\\");
            if (lastDelimiter === -1) {
                lastDelimiter = value.lastIndexOf("/");
            }

            if (lastDelimiter > -1) {
                url += value.substr(lastDelimiter + 1);
            }
            else {
                url += value;
            }
        }
        // Not from input file.
        else {
            url += value;
        }

        return new Texture(url, scene, false, MTLFileLoader.INVERT_TEXTURE_Y);
    }
}
