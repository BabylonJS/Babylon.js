import { RegisterClass } from "../../../../Misc/typeStore";
import type { Effect } from "../../../effect";

import "../../../../Rendering/depthRendererSceneComponent";

import { ImageSourceBlock } from "./imageSourceBlock";
import type { Nullable } from "../../../../types";
import type { Texture } from "../../../Textures/texture";
import type { NodeMaterial } from "../../nodeMaterial";
/**
 * Block used to provide an depth texture for a TextureBlock
 */
export class DepthSourceBlock extends ImageSourceBlock {
    /**
     * Creates a new DepthSourceBlock
     * @param name defines the block name
     */
    public constructor(name: string) {
        super(name);
    }

    /**
     * Gets or sets the texture associated with the node
     */
    public override get texture(): Nullable<Texture> {
        return this._texture;
    }

    public override set texture(texture: Nullable<Texture>) {
        // Do nothing, we always use the depth texture from the scene
    }

    /**
     * Bind data to effect
     * @param effect - the effect to bind to
     * @param nodeMaterial - the node material
     */
    public override bind(effect: Effect, nodeMaterial: NodeMaterial) {
        const scene = nodeMaterial.getScene();
        const renderer = scene.enableDepthRenderer();

        this._texture = renderer.getDepthMap();

        super.bind(effect, nodeMaterial);
    }

    /**
     * Checks if the block is ready
     * @returns true if ready
     */
    public override isReady() {
        return true;
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "DepthSourceBlock";
    }

    protected override _dumpPropertiesCode() {
        return super._dumpPropertiesCode(true);
    }

    /**
     * Serializes the block
     * @returns the serialized object
     */
    public override serialize(): any {
        return super.serialize(true);
    }
}

RegisterClass("BABYLON.DepthSourceBlock", DepthSourceBlock);
