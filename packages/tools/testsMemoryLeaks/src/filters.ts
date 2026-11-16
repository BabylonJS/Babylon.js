import { type IHeapNode, type IScenario } from "@memlab/core";

/**
 * Tuning options for the Babylon-specific memlab leak filter.
 */
export interface ILeakFilterOptions {
    /** Minimum retained size that should be considered interesting. */
    minRetainedSize?: number;
    /** Exact node names to ignore. */
    ignoredNames?: string[];
    /** Name fragments that identify framework/system nodes to ignore. */
    ignoredNameFragments?: string[];
    /** Heap node types to ignore. */
    ignoredTypes?: string[];
    /** Edge types to ignore. */
    ignoredEdgeTypes?: string[];
}

const DefaultIgnoredNames = ["FontAwesomeConfig", "WebGL2RenderingContext"];
const DefaultIgnoredNameFragments = ["system "];
const DefaultIgnoredTypes = ["hidden"];
const DefaultIgnoredEdgeTypes = ["internal", "hidden", "weak"];

const IsChromiumNetworkInspectorArtifact = (node: IHeapNode): boolean => {
    if (node.type !== "native" || !node.name.startsWith("blink::HeapHashTableBacking<")) {
        return false;
    }

    let retainer = node.pathEdge?.fromNode;
    for (const name of ["blink::NetworkResourcesData", "blink::InspectorNetworkAgent"]) {
        if (retainer?.type !== "native" || retainer.name !== name) {
            return false;
        }
        retainer = retainer.pathEdge?.fromNode;
    }

    // Chromium can store the network agent in the DevTools session's native agent vector.
    if (retainer?.type === "native" && retainer.name.startsWith("blink::HeapVectorBacking<cppgc::internal::BasicMember<blink::InspectorAgent,")) {
        retainer = retainer.pathEdge?.fromNode;
    }

    if (retainer?.type !== "native" || retainer.name !== "blink::DevToolsSession") {
        return false;
    }

    const root = retainer.pathEdge?.fromNode;
    return root?.type === "synthetic" && root.name === "C++ Persistent roots";
};

/**
 * Creates the default Babylon-specific memlab leak filter.
 * @param options Optional filter overrides.
 * @returns A memlab leak filter callback.
 */
export function CreateBabylonLeakFilter(options: ILeakFilterOptions = {}): NonNullable<IScenario["leakFilter"]> {
    const minRetainedSize = options.minRetainedSize ?? 40000;
    const ignoredNames = new Set(options.ignoredNames ?? DefaultIgnoredNames);
    const ignoredNameFragments = options.ignoredNameFragments ?? DefaultIgnoredNameFragments;
    const ignoredTypes = new Set(options.ignoredTypes ?? DefaultIgnoredTypes);
    const ignoredEdgeTypes = new Set(options.ignoredEdgeTypes ?? DefaultIgnoredEdgeTypes);

    return (node) => {
        if (node.retainedSize < minRetainedSize) {
            return false;
        }

        if (IsChromiumNetworkInspectorArtifact(node)) {
            return false;
        }

        if (node.pathEdge?.type && ignoredEdgeTypes.has(node.pathEdge.type)) {
            return false;
        }

        if (ignoredTypes.has(node.type)) {
            return false;
        }

        if (node.name && ignoredNames.has(node.name)) {
            return false;
        }

        if ((!node.name && node.type === "object") || node.name === "Object") {
            return false;
        }

        if (node.name && ignoredNameFragments.some((fragment) => node.name.includes(fragment))) {
            return false;
        }

        if (node.type.includes("system ")) {
            return false;
        }

        return true;
    };
}
