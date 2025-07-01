import type { FrameGraph, FrameGraphContext, FrameGraphPass } from "core/index";
import { FrameGraphTask } from "../../frameGraphTask";

/**
 * Task used to execute a custom function.
 */
export class FrameGraphExecuteTask extends FrameGraphTask {
    /**
     * The function to execute.
     */
    public func: (context: FrameGraphContext) => void;

    /**
     * The function to execute when the task is disabled (optional).
     */
    public funcDisabled?: (context: FrameGraphContext) => void;

    /**
     * Creates a new execute task.
     * @param name The name of the task.
     * @param frameGraph The frame graph the task belongs to.
     */
    constructor(name: string, frameGraph: FrameGraph) {
        super(name, frameGraph);
    }

    public record(): FrameGraphPass<FrameGraphContext> {
        if (!this.func) {
            throw new Error("FrameGraphExecuteTask: Execute task must have a function.");
        }

        const pass = this._frameGraph.addPass(this.name);

        pass.setExecuteFunc((context) => {
            this.func(context);
        });

        const passDisabled = this._frameGraph.addPass(this.name + "_disabled", true);

        passDisabled.setExecuteFunc((context) => {
            this.funcDisabled?.(context);
        });

        return pass;
    }
}
