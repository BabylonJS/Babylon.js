import { NodeMaterialOptimizer } from './nodeMaterialOptimizer';
import { NodeMaterialBlock } from '../nodeMaterialBlock';

/**
 * Optimizer that will try to reuse uv varyings across the node graph
 */
export class UVVaryingOptimizer extends NodeMaterialOptimizer {
    public optimize(vertexOutputNodes: NodeMaterialBlock[], fragmentOutputNodes: NodeMaterialBlock[]) {

    }
}