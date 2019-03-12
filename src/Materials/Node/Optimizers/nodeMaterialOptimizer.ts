import { NodeMaterialBlock } from '../nodeMaterialBlock';

/**
 * Root class for all node material optimizers
 */
export class NodeMaterialOptimizer {
    /**
     * Function used to optimize a NodeMaterial graph
     * @param vertexOutputNodes defines the list of output nodes for the vertex shader
     * @param fragmentOutputNodes defines the list of output nodes for the fragment shader
     */
    public optimize(vertexOutputNodes: NodeMaterialBlock[], fragmentOutputNodes: NodeMaterialBlock[]) {
        // Do nothing by default
    }
}