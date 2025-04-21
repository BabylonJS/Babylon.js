import type { IFlowGraphBlockConfiguration } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { IGLTF } from "../../glTFLoaderInterfaces";
import type { FlowGraphDataConnection } from "core/FlowGraph/flowGraphDataConnection";
import type { AnimationGroup } from "core/Animations/animationGroup";
import type { TransformNode } from "core/Meshes/transformNode";
import { RichTypeAny } from "core/FlowGraph/flowGraphRichTypes";

/**
 * a configuration interface for this block
 */
export interface IFlowGraphGLTFDataProviderBlockConfiguration extends IFlowGraphBlockConfiguration {
    /**
     * the glTF object to provide data from
     */
    glTF: IGLTF;
}

/**
 * a glTF-based FlowGraph block that provides arrays with babylon object, based on the glTF tree
 * Can be used, for example, to get animation index from a glTF animation
 */
export class FlowGraphGLTFDataProvider extends FlowGraphBlock {
    /**
     * Output: an array of animation groups
     * Corresponds directly to the glTF animations array
     */
    public readonly animationGroups: FlowGraphDataConnection<AnimationGroup[]>;

    /**
     * Output an array of (Transform) nodes
     * Corresponds directly to the glTF nodes array
     */
    public readonly nodes: FlowGraphDataConnection<TransformNode[]>;

    constructor(config: IFlowGraphGLTFDataProviderBlockConfiguration) {
        super();
        const glTF = config.glTF;
        const animationGroups = glTF.animations?.map((a) => a._babylonAnimationGroup) || [];
        this.animationGroups = this.registerDataOutput("animationGroups", RichTypeAny, animationGroups);
        const nodes = glTF.nodes?.map((n) => n._babylonTransformNode) || [];
        this.nodes = this.registerDataOutput("nodes", RichTypeAny, nodes);
    }

    public override getClassName(): string {
        return "FlowGraphGLTFDataProvider";
    }
}
