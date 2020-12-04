import { Color4 } from '../../Maths/math.color';
import { Scene } from "../../scene";
import { ShaderMaterial } from '../shaderMaterial';

import "../../Shaders/color.fragment";
import "../../Shaders/color.vertex";

/**
 * A material to use for fast depth-only rendering.
 */
export class OcclusionMaterial extends ShaderMaterial {
    constructor(name: string, scene: Scene) {
        super(name, scene, "color", {
            attributes: ["position"],
            uniforms: ["world", "viewProjection", "color"]
        });
        this.disableColorWrite = true;
        this.forceDepthWrite = true;
        this.setColor4("color", new Color4(0, 0, 0, 1));
    }
}