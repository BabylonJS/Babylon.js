import { NodeMaterialBlock } from './nodeMaterialBlock';

/**
 * Defines a class that will hold NodeMaterialBlocks
 */
export class NodeMaterialBlockGroup {
    public blocks: NodeMaterialBlock[] = [];

    /**
     * Creates a new block group
     * @param name defines the name of the group
     */
    public constructor(
        /** Defines the name of the group */
        public name: string
    ) {
    }
}