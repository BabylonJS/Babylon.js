import { NodeMaterialBlock } from '../nodeMaterialBlock';

/**
 * Root class for all node material optimizers
 */
export class NodeMaterialOptimizer {
    /**
     * Function used to optimize a NodeMaterial graph
     * @param vertexShaderBuildState 
     * @param fragmentShaderBuildState 
     */
    public optimize(vertexOutputNodes: NodeMaterialBlock[], fragmentOutputNodes: NodeMaterialBlock[]) {
        // Do nothing by default
    }
}