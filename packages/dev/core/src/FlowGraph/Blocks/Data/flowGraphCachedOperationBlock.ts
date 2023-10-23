import { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphContext } from "core/FlowGraph/flowGraphContext";

const CACHE_NAME = "cachedValue";

export class FlowGraphCachedOperationBlock extends FlowGraphBlock {
    public _updateOutputs(context: FlowGraphContext) {}
}
