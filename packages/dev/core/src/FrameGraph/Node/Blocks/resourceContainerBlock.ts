import type { NodeRenderGraphConnectionPoint, Scene, FrameGraph } from "core/index";
import { RegisterClass } from "../../../Misc/typeStore";
import { NodeRenderGraphBlockConnectionPointTypes } from "../Types/nodeRenderGraphTypes";
import { NodeRenderGraphBlock } from "../nodeRenderGraphBlock";

/**
 * Block used as a resource (textures, buffers) container
 */
export class NodeRenderGraphResourceContainerBlock extends NodeRenderGraphBlock {
    /**
     * Creates a new NodeRenderGraphResourceContainerBlock
     * @param name defines the block name
     * @param frameGraph defines the hosting frame graph
     * @param scene defines the hosting scene
     */
    public constructor(name: string, frameGraph: FrameGraph, scene: Scene) {
        super(name, frameGraph, scene);

        this.registerInput("resource0", NodeRenderGraphBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("resource1", NodeRenderGraphBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("resource2", NodeRenderGraphBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("resource3", NodeRenderGraphBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("resource4", NodeRenderGraphBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("resource5", NodeRenderGraphBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("resource6", NodeRenderGraphBlockConnectionPointTypes.AutoDetect, true);
        this.registerInput("resource7", NodeRenderGraphBlockConnectionPointTypes.AutoDetect, true);

        this.registerOutput("output", NodeRenderGraphBlockConnectionPointTypes.ResourceContainer);

        this.resource0.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer | NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator
        );
        this.resource1.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer | NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator
        );
        this.resource2.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer | NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator
        );
        this.resource3.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer | NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator
        );
        this.resource4.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer | NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator
        );
        this.resource5.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer | NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator
        );
        this.resource6.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer | NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator
        );
        this.resource7.addExcludedConnectionPointFromAllowedTypes(
            NodeRenderGraphBlockConnectionPointTypes.TextureAllButBackBuffer | NodeRenderGraphBlockConnectionPointTypes.ShadowGenerator
        );
    }

    /**
     * Gets the current class name
     * @returns the class name
     */
    public override getClassName() {
        return "NodeRenderGraphResourceContainerBlock";
    }

    /**
     * Gets the resource0 component
     */
    public get resource0(): NodeRenderGraphConnectionPoint {
        return this._inputs[0];
    }

    /**
     * Gets the resource1 component
     */
    public get resource1(): NodeRenderGraphConnectionPoint {
        return this._inputs[1];
    }

    /**
     * Gets the resource2 component
     */
    public get resource2(): NodeRenderGraphConnectionPoint {
        return this._inputs[2];
    }

    /**
     * Gets the resource3 component
     */
    public get resource3(): NodeRenderGraphConnectionPoint {
        return this._inputs[3];
    }

    /**
     * Gets the resource4 component
     */
    public get resource4(): NodeRenderGraphConnectionPoint {
        return this._inputs[4];
    }

    /**
     * Gets the resource5 component
     */
    public get resource5(): NodeRenderGraphConnectionPoint {
        return this._inputs[5];
    }

    /**
     * Gets the resource6 component
     */
    public get resource6(): NodeRenderGraphConnectionPoint {
        return this._inputs[6];
    }

    /**
     * Gets the resource7 component
     */
    public get resource7(): NodeRenderGraphConnectionPoint {
        return this._inputs[7];
    }

    /**
     * Gets the output component
     */
    public get output(): NodeRenderGraphConnectionPoint {
        return this._outputs[0];
    }
}

RegisterClass("BABYLON.NodeRenderGraphResourceContainerBlock", NodeRenderGraphResourceContainerBlock);
