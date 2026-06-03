import { ParseJsonText } from "./jsonValidation.js";

type JsonObject = Record<string, unknown>;

/**
 * Validated Flow Graph attachment payload.
 */
export interface IValidatedFlowGraphAttachmentPayload {
    /** Parsed coordinator-level or graph-level JSON object. */
    parsed: JsonObject;
    /** Normalized list of graph objects to inspect. */
    graphs: JsonObject[];
}

function ParseJsonObject(value: unknown, label: string): JsonObject {
    const parsed = typeof value === "string" ? ParseJsonText({ jsonText: value, jsonLabel: label }) : value;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        throw new Error(`Invalid ${label}: expected a JSON object.`);
    }
    return parsed as JsonObject;
}

/**
 * Validate a GUI descriptor payload before attaching it to a scene.
 * @param value - GUI JSON as text or parsed object.
 * @returns The parsed GUI descriptor object.
 */
export function ValidateGuiAttachmentPayload(value: unknown): JsonObject {
    const parsed = ParseJsonObject(value, "GUI JSON");
    const root = parsed.root;
    if (!root || typeof root !== "object" || Array.isArray(root)) {
        throw new Error("Invalid GUI JSON: must contain a 'root' object.");
    }
    return parsed;
}

/**
 * Validate a Node Render Graph payload before attaching it to a scene.
 * @param value - NRG JSON as text or parsed object.
 * @returns The parsed render graph object.
 */
export function ValidateNodeRenderGraphAttachmentPayload(value: unknown): JsonObject {
    const parsed = ParseJsonObject(value, "NRG JSON");
    if (parsed.customType !== "BABYLON.NodeRenderGraph") {
        throw new Error(`Invalid NRG JSON: customType must be "BABYLON.NodeRenderGraph" but got "${String(parsed.customType)}".`);
    }
    if (!Array.isArray(parsed.blocks)) {
        throw new Error("Invalid NRG JSON: must contain a 'blocks' array.");
    }
    return parsed;
}

/**
 * Validate a Node Geometry payload before attaching it to a scene.
 * @param value - NGE JSON as text or parsed object.
 * @returns The parsed node geometry object.
 */
export function ValidateNodeGeometryAttachmentPayload(value: unknown): JsonObject {
    const parsed = ParseJsonObject(value, "NGE JSON");
    if (parsed.customType !== "BABYLON.NodeGeometry") {
        throw new Error(`Invalid NGE JSON: customType must be "BABYLON.NodeGeometry" but got "${String(parsed.customType)}".`);
    }
    if (!Array.isArray(parsed.blocks)) {
        throw new Error("Invalid NGE JSON: must contain a 'blocks' array.");
    }
    return parsed;
}

/**
 * Validate a Flow Graph payload before attaching it to a scene.
 * Accepts either coordinator-level JSON with `_flowGraphs` or graph-level JSON with `allBlocks`.
 * @param value - Flow Graph JSON as text or parsed object.
 * @returns The parsed payload and normalized graphs list.
 */
export function ValidateFlowGraphAttachmentPayload(value: unknown): IValidatedFlowGraphAttachmentPayload {
    const parsed = ParseJsonObject(value, "Flow Graph JSON");

    if (Array.isArray(parsed._flowGraphs)) {
        if (parsed._flowGraphs.length === 0) {
            throw new Error("Invalid Flow Graph JSON: '_flowGraphs' must contain at least one graph.");
        }
        for (const graph of parsed._flowGraphs) {
            if (!graph || typeof graph !== "object" || Array.isArray(graph) || !Array.isArray((graph as JsonObject).allBlocks)) {
                throw new Error("Invalid Flow Graph JSON: each coordinator entry must contain an 'allBlocks' array.");
            }
        }
        return { parsed, graphs: parsed._flowGraphs as JsonObject[] };
    }

    if (Array.isArray(parsed.allBlocks)) {
        return { parsed, graphs: [parsed] };
    }

    throw new Error("Invalid Flow Graph JSON: expected coordinator JSON with '_flowGraphs' or graph JSON with 'allBlocks'.");
}

/**
 * Validate a Node Material payload before attaching it to a scene material.
 * @param value - NME JSON as text or parsed object.
 * @returns The parsed node material object.
 */
export function ValidateNodeMaterialAttachmentPayload(value: unknown): JsonObject {
    const parsed = ParseJsonObject(value, "NME JSON");
    if (!Array.isArray(parsed.blocks)) {
        throw new Error("Invalid NME JSON: must contain a 'blocks' array.");
    }
    if (!Array.isArray(parsed.outputNodes)) {
        throw new Error("Invalid NME JSON: must contain an 'outputNodes' array.");
    }

    const mode = typeof parsed.mode === "number" ? parsed.mode : undefined;
    if (mode === undefined || mode === 0) {
        const blocks = parsed.blocks as Array<{ customType?: unknown }>;
        const hasVertexOutput = blocks.some((block) => block.customType === "BABYLON.VertexOutputBlock");
        const hasFragmentOutput = blocks.some((block) => block.customType === "BABYLON.FragmentOutputBlock");
        if (!hasVertexOutput) {
            throw new Error("Invalid NME JSON: missing VertexOutputBlock.");
        }
        if (!hasFragmentOutput) {
            throw new Error("Invalid NME JSON: missing FragmentOutputBlock.");
        }
    }

    return parsed;
}

/**
 * Validate a Smart Filter payload before attaching it to a scene.
 * Expected format: `{ format: "smartFilter", formatVersion: 1, blocks: [...], connections: [...] }`.
 * @param value - Smart Filter JSON as text or parsed object.
 * @returns The parsed smart filter object.
 */
export function ValidateSmartFilterAttachmentPayload(value: unknown): JsonObject {
    const parsed = ParseJsonObject(value, "Smart Filter JSON");
    if (parsed.format !== "smartFilter") {
        throw new Error(`Invalid Smart Filter JSON: format must be "smartFilter" but got "${String(parsed.format)}".`);
    }
    if (parsed.formatVersion !== 1) {
        throw new Error(`Invalid Smart Filter JSON: formatVersion must be 1 but got ${String(parsed.formatVersion)}.`);
    }
    if (!Array.isArray(parsed.blocks)) {
        throw new Error("Invalid Smart Filter JSON: must contain a 'blocks' array.");
    }
    if (!Array.isArray(parsed.connections)) {
        throw new Error("Invalid Smart Filter JSON: must contain a 'connections' array.");
    }
    return parsed;
}
