/**
 * Pure utility functions for the flow graph variable feature.
 * Extracted from component code to enable unit testing in a Node.js environment.
 */

import { type FlowGraph } from "core/FlowGraph/flowGraph";
import { type FlowGraphBlock } from "core/FlowGraph/flowGraphBlock";
import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";

/**
 * Represents a variable entry found across the graph's blocks and contexts.
 */
export interface IVariableEntry {
    /** Variable name */
    name: string;
    /** Number of GetVariable blocks referencing this name */
    getCount: number;
    /** Number of SetVariable blocks referencing this name */
    setCount: number;
}

/**
 * Scan all blocks and context user variables in the flow graph to build a
 * sorted list of variable entries.
 * @param fg - The flow graph to scan.
 * @returns Sorted array of variable entries.
 */
export function GatherVariables(fg: FlowGraph): IVariableEntry[] {
    const varMap = new Map<string, IVariableEntry>();

    const ensureVar = (name: string): IVariableEntry => {
        let entry = varMap.get(name);
        if (!entry) {
            entry = { name, getCount: 0, setCount: 0 };
            varMap.set(name, entry);
        }
        return entry;
    };

    for (const block of fg.getAllBlocks()) {
        const className = block.getClassName();
        const config = block.config as any;
        if (className === FlowGraphBlockNames.GetVariable) {
            if (config?.variable) {
                ensureVar(config.variable).getCount++;
            }
        } else if (className === FlowGraphBlockNames.SetVariable) {
            if (config?.variables) {
                for (const v of config.variables) {
                    ensureVar(v).setCount++;
                }
            } else if (config?.variable) {
                ensureVar(config.variable).setCount++;
            }
        }
    }

    // Also include variables defined on the context but not yet referenced
    // by any block — these are created from the "+ Add" button.
    let ctxIndex = 0;
    let ctx = fg.getContext(ctxIndex);
    while (ctx) {
        for (const key of Object.keys(ctx.userVariables)) {
            ensureVar(key);
        }
        ctxIndex++;
        ctx = fg.getContext(ctxIndex);
    }

    return Array.from(varMap.values()).sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Gather all variable names from a flow graph, excluding variables owned
 * by a specific block (to avoid self-reference in pickers).
 * @param fg - The flow graph to scan.
 * @param excludeBlock - A block to exclude from the scan.
 * @returns Sorted array of variable names.
 */
export function GatherVariableNames(fg: FlowGraph, excludeBlock?: FlowGraphBlock): string[] {
    const names = new Set<string>();
    for (const block of fg.getAllBlocks()) {
        if (block === excludeBlock) {
            continue;
        }
        const className = block.getClassName();
        const config = block.config as any;
        if (className === FlowGraphBlockNames.GetVariable) {
            if (config?.variable) {
                names.add(config.variable);
            }
        } else if (className === FlowGraphBlockNames.SetVariable) {
            if (config?.variables) {
                for (const v of config.variables) {
                    names.add(v);
                }
            } else if (config?.variable) {
                names.add(config.variable);
            }
        }
    }

    // Also include context user variables
    let ctxIndex = 0;
    let ctx = fg.getContext(ctxIndex);
    while (ctx) {
        for (const key of Object.keys(ctx.userVariables)) {
            names.add(key);
        }
        ctxIndex++;
        ctx = fg.getContext(ctxIndex);
    }

    return Array.from(names).sort();
}

/**
 * Rename a variable across all GetVariable and SetVariable blocks and
 * across all execution contexts.
 * @param fg - The flow graph.
 * @param oldName - The current variable name.
 * @param newName - The new variable name.
 */
export function RenameVariable(fg: FlowGraph, oldName: string, newName: string): void {
    if (!newName || newName === oldName) {
        return;
    }

    for (const block of fg.getAllBlocks()) {
        const className = block.getClassName();
        const config = block.config as any;
        if (className === FlowGraphBlockNames.GetVariable) {
            if (config?.variable === oldName) {
                config.variable = newName;
            }
        } else if (className === FlowGraphBlockNames.SetVariable) {
            if (config?.variables) {
                const idx = config.variables.indexOf(oldName);
                if (idx !== -1) {
                    config.variables[idx] = newName;
                    const dataInput = block.getDataInput(oldName);
                    if (dataInput) {
                        dataInput.name = newName;
                    }
                }
            } else if (config?.variable === oldName) {
                config.variable = newName;
            }
        }
    }

    let ctxIndex = 0;
    let ctx = fg.getContext(ctxIndex);
    while (ctx) {
        if (ctx.hasVariable(oldName)) {
            const value = ctx.getVariable(oldName);
            ctx.setVariable(newName, value);
            delete (ctx as any)._userVariables[oldName];
        }
        ctxIndex++;
        ctx = fg.getContext(ctxIndex);
    }
}

/**
 * Delete a variable by removing all GetVariable and SetVariable blocks that
 * reference it, and removing it from all execution contexts.
 * @param fg - The flow graph.
 * @param name - The variable name to delete.
 */
export function DeleteVariable(fg: FlowGraph, name: string): void {
    const blocksToRemove: FlowGraphBlock[] = [];

    for (const block of fg.getAllBlocks()) {
        const className = block.getClassName();
        const config = block.config as any;
        if (className === FlowGraphBlockNames.GetVariable && config?.variable === name) {
            blocksToRemove.push(block);
        } else if (className === FlowGraphBlockNames.SetVariable) {
            if (config?.variables) {
                const idx = config.variables.indexOf(name);
                if (idx !== -1) {
                    // Remove the corresponding data input port
                    const dataInput = block.getDataInput(name);
                    if (dataInput) {
                        dataInput.disconnectFromAll();
                        const portIdx = block.dataInputs.indexOf(dataInput);
                        if (portIdx !== -1) {
                            block.dataInputs.splice(portIdx, 1);
                        }
                    }
                    config.variables.splice(idx, 1);
                    if (config.variables.length === 0) {
                        blocksToRemove.push(block);
                    }
                }
            } else if (config?.variable === name) {
                blocksToRemove.push(block);
            }
        }
    }

    for (const block of blocksToRemove) {
        fg.removeBlock(block);
    }

    let ctxIndex = 0;
    let ctx = fg.getContext(ctxIndex);
    while (ctx) {
        if (ctx.hasVariable(name)) {
            delete (ctx as any)._userVariables[name];
        }
        ctxIndex++;
        ctx = fg.getContext(ctxIndex);
    }
}

/**
 * Format a runtime variable value for display in the variables panel.
 * @param val - The value to format.
 * @returns A human-readable string representation.
 */
export function FormatVariableValue(val: unknown): string {
    if (val === undefined) {
        return "undefined";
    }
    if (val === null) {
        return "null";
    }
    if (typeof val === "object") {
        if (typeof (val as any).toString === "function" && (val as any).toString !== Object.prototype.toString) {
            return (val as any).toString();
        }
        try {
            const json = JSON.stringify(val);
            return json.length > 60 ? json.slice(0, 57) + "..." : json;
        } catch {
            return "[object]";
        }
    }
    const str = String(val);
    return str.length > 60 ? str.slice(0, 57) + "..." : str;
}

/**
 * Filter autocomplete suggestions by a query string (case-insensitive substring match).
 * @param suggestions - The full list of suggestions.
 * @param query - The filter query.
 * @returns Filtered suggestions. If query is empty, returns all suggestions.
 */
export function FilterSuggestions(suggestions: string[], query: string): string[] {
    const q = query.toLowerCase();
    if (!q) {
        return suggestions;
    }
    return suggestions.filter((s) => s.toLowerCase().includes(q));
}
