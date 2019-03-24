import { ShaderMaterial } from "./shaderMaterial";
import { Scene } from "../scene";

export class Uv2Material extends ShaderMaterial {
	constructor(scene: Scene) {
        super("uv2material", scene, "uv2mat", { attributes: ["position", "uv2"] });
    }
}