import { VertexBuffer } from "../../Meshes/buffer";
import { Nullable } from "../../types";
import { WebGPUCacheRenderPipeline } from "./webgpuCacheRenderPipeline";

class NodeState {
    public values: { [name: number]: NodeState };
    public pipeline: GPURenderPipeline;

    constructor() {
        this.values = {};
    }

    public count(): [number, number] {
        let countNode = 0, countPipeline = this.pipeline ? 1 : 0;
        for (const value in this.values) {
            const node = this.values[value];
            const [childCountNodes, childCoundPipeline] = node!.count();
            countNode += childCountNodes;
            countPipeline += childCoundPipeline;
            countNode++;
        }
        return [countNode, countPipeline];
    }
}

/** @hidden */
export class WebGPUCacheRenderPipelineTree extends WebGPUCacheRenderPipeline {

    private static _Cache: NodeState;

    public static GetNodeCounts(): { nodeCount: number, pipelineCount: number } {
        const counts = WebGPUCacheRenderPipelineTree._Cache.count();

        return { nodeCount: counts[0], pipelineCount: counts[1] };
    }

    constructor(device: GPUDevice, emptyVertexBuffer: VertexBuffer) {
        super(device, emptyVertexBuffer);
        WebGPUCacheRenderPipelineTree._Cache = new NodeState();
    }

    protected _getRenderPipeline(param: { token: any, pipeline: Nullable<GPURenderPipeline> }): void {
        const n0 = WebGPUCacheRenderPipelineTree._Cache;
        let n1 = n0.values[this._states[0]];
        if (!n1) {
            n1 = new NodeState();
            n0.values[this._states[0]] = n1;
        }
        let n2 = n1.values[this._states[1]];
        if (!n2) {
            n2 = new NodeState();
            n1.values[this._states[1]] =  n2;
        }
        let n3 = n2.values[this._states[2]];
        if (!n3) {
            n3 = new NodeState();
            n2.values[this._states[2]] = n3;
        }
        let n4 = n3.values[this._states[3]];
        if (!n4) {
            n4 = new NodeState();
            n3.values[this._states[3]] =  n4;
        }
        let n5 = n4.values[this._states[4]];
        if (!n5) {
            n5 = new NodeState();
            n4.values[this._states[4]] = n5;
        }
        let n6 = n5.values[this._states[5]];
        if (!n6) {
            n6 = new NodeState();
            n5.values[this._states[5]] = n6;
        }
        let n7 = n6.values[this._states[6]];
        if (!n7) {
            n7 = new NodeState();
            n6.values[this._states[6]] = n7;
        }
        let n8 = n7.values[this._states[7]];
        if (!n8) {
            n8 = new NodeState();
            n7.values[this._states[7]] = n8;
        }
        let n9 = n8.values[this._states[8]];
        if (!n9) {
            n9 = new NodeState();
            n8.values[this._states[8]] = n9;
        }
        for (let i = 9; i < this._states.length; ++i) {
            let nn: NodeState | undefined = n9!.values[this._states[i]];
            if (!nn) {
                nn = new NodeState();
                n9!.values[this._states[i]] = nn;
            }
            n9 = nn;
        }

        param.token = n9;
        param.pipeline = n9.pipeline;
    }

    protected _setRenderPipeline(param: { token: NodeState, pipeline: Nullable<GPURenderPipeline> }): void {
        param.token.pipeline = param.pipeline!;
    }
}
