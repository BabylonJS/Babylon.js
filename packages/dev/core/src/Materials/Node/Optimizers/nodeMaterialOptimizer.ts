import type { NodeMaterialBlock } from "../nodeMaterialBlock";

/**
 * Root class for all node material optimizers
 */
export class NodeMaterialOptimizer {
    /**
     * Function used to optimize a NodeMaterial graph
     * @param _vertexOutputNodes defines the list of output nodes for the vertex shader
     * @param _fragmentOutputNodes defines the list of output nodes for the fragment shader
     */
    public optimize(_vertexOutputNodes: NodeMaterialBlock[], _fragmentOutputNodes: NodeMaterialBlock[]) {
        // Do nothing by default
    }
}
