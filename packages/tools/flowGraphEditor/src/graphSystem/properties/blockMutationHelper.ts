import type { FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import type { FlowGraphSignalConnection } from "core/FlowGraph/flowGraphSignalConnection";

/**
 * Removes a data input port from a block by name, disconnecting any existing connections.
 */
export function removeDataInput(block: FlowGraphBlock, name: string): void {
    const input = block.getDataInput(name);
    if (input) {
        input.disconnectFromAll();
        const idx = block.dataInputs.indexOf(input);
        if (idx !== -1) {
            block.dataInputs.splice(idx, 1);
        }
    }
}

/**
 * Removes a data output port from a block by name, disconnecting any existing connections.
 */
export function removeDataOutput(block: FlowGraphBlock, name: string): void {
    const output = block.getDataOutput(name);
    if (output) {
        output.disconnectFromAll();
        const idx = block.dataOutputs.indexOf(output);
        if (idx !== -1) {
            block.dataOutputs.splice(idx, 1);
        }
    }
}

/**
 * Removes a signal output port from an execution block by name, disconnecting any existing connections.
 */
export function removeSignalOutput(block: FlowGraphBlock, name: string): void {
    const execBlock = block as any;
    if (!execBlock.signalOutputs) {
        return;
    }
    const outputs: FlowGraphSignalConnection[] = execBlock.signalOutputs;
    const output = outputs.find((s) => s.name === name);
    if (output) {
        output.disconnectFromAll();
        const idx = outputs.indexOf(output);
        if (idx !== -1) {
            outputs.splice(idx, 1);
        }
    }
}
