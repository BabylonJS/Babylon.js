import { ShaderMaterial } from "./shaderMaterial";
import { Scene } from "../scene";
import { RenderTargetTexture } from "../Materials/Textures/renderTargetTexture";
import { Texture } from "../Materials/Textures/texture";
import { Constants } from "../Engines/constants";

export class Uv2Material extends ShaderMaterial {
	constructor(scene: Scene) {
        super("uv2material", scene, "uv2mat", { attributes: ["position", "uv2"], uniforms: ["viewProjection", "world"] });

        var texture = new RenderTargetTexture("test", 1024, scene, true,
        	true, 
        	Constants.TEXTURETYPE_UNSIGNED_INT, 
        	false, 
        	Texture.NEAREST_SAMPLINGMODE
        );
        texture.refreshRate === RenderTargetTexture.REFRESHRATE_RENDER_ONCE;

    }
}