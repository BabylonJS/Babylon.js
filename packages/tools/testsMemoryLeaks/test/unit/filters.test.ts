import { type IHeapNode, type IHeapSnapshot, NumericSet } from "@memlab/core";

import { CreateBabylonLeakFilter } from "../../src/filters";

const networkInspectorPath = [
    { name: "C++ Persistent roots", type: "synthetic" },
    { name: "blink::DevToolsSession", type: "native" },
    {
        name: "blink::HeapVectorBacking<cppgc::internal::BasicMember<blink::InspectorAgent, cppgc::internal::StrongMemberTag, cppgc::internal::DijkstraWriteBarrierPolicy>>",
        type: "native",
    },
    { name: "blink::InspectorNetworkAgent", type: "native" },
    { name: "blink::NetworkResourcesData", type: "native" },
    {
        name: "blink::HeapHashTableBacking<blink::HashTable<blink::String, blink::KeyValuePair<blink::String, cppgc::internal::BasicMember<blink::NetworkResourcesData::ResourceData, cppgc::internal::StrongMemberTag, cppgc::internal::DijkstraWriteBarrierPolicy>>, blink::KeyValuePairExtractor, blink::HashMapValueTraits<blink::HashTraits<String>, blink::HashTraits<cppgc::internal::BasicMember<blink::NetworkResourcesData::ResourceData, cppgc::internal::StrongMemberTag, cppgc::internal::DijkstraWriteBarrierPolicy>>>, blink::HashTraits<String>, blink::HeapAllocator>>",
        type: "native",
    },
];

const createTraceNode = (path: { name: string; type: string }[]): IHeapNode =>
    path.reduce<IHeapNode | null>(
        (parent, node) =>
            ({
                ...node,
                retainedSize: 41096,
                pathEdge: parent ? { type: "element", fromNode: parent } : null,
            }) as IHeapNode,
        null
    )!;

const filterTrace = (path: { name: string; type: string }[]) => CreateBabylonLeakFilter()(createTraceNode(path), {} as IHeapSnapshot, new NumericSet());

describe("createBabylonLeakFilter", () => {
    it("filters known noisy nodes", () => {
        const filter = CreateBabylonLeakFilter();

        expect(
            filter(
                {
                    name: "FontAwesomeConfig",
                    retainedSize: 90000,
                    type: "object",
                } as any,
                {} as any,
                new NumericSet()
            )
        ).toBe(false);
    });

    it("filters nodes below the retained size threshold", () => {
        const filter = CreateBabylonLeakFilter({ minRetainedSize: 50000 });

        expect(
            filter(
                {
                    name: "InterestingNode",
                    retainedSize: 49999,
                    type: "object",
                } as any,
                {} as any,
                new NumericSet()
            )
        ).toBe(false);
    });

    it("keeps large user objects that are not part of the ignore lists", () => {
        const filter = CreateBabylonLeakFilter();

        expect(
            filter(
                {
                    name: "RetainedTextureCache",
                    retainedSize: 120000,
                    type: "object",
                    pathEdge: { type: "property" },
                } as any,
                {} as any,
                new NumericSet()
            )
        ).toBe(true);
    });

    it("filters the reproduced Chromium network inspector hash-table trace", () => {
        expect(filterTrace(networkInspectorPath)).toBe(false);
    });

    it("filters the same native trace without the inspector agent vector", () => {
        expect(filterTrace(networkInspectorPath.filter((_, index) => index !== 2))).toBe(false);
    });

    it.each(["Scene", "Engine", "FlowGraphCoordinator", "RetainedTextureCache"])("keeps ordinary JavaScript leaks of %s", (name) => {
        expect(
            filterTrace([
                { name: "Window", type: "object" },
                { name, type: "object" },
            ])
        ).toBe(true);
    });

    it("keeps JavaScript objects retained below the native network inspector path", () => {
        expect(filterTrace([...networkInspectorPath, { name: "Scene", type: "object" }])).toBe(true);
    });

    it.each([0, 1, 2, 3, 4, 5])("keeps the trace when node %i is a JavaScript object", (index) => {
        const path = networkInspectorPath.map((node, nodeIndex) => (nodeIndex === index ? { ...node, type: "object" } : node));

        expect(filterTrace(path)).toBe(true);
    });

    it.each([
        [0, "Other native roots"],
        [1, "blink::OtherSession"],
        [2, "blink::OtherVectorBacking"],
        [3, "blink::InspectorDOMAgent"],
        [4, "blink::OtherResourcesData"],
        [5, "blink::OtherNativeAllocation"],
    ])("keeps unrelated native traces with node %i named %s", (index, name) => {
        const path = networkInspectorPath.map((node, nodeIndex) => (nodeIndex === index ? { ...node, name } : node));

        expect(filterTrace(path)).toBe(true);
    });

    it("keeps a native hash table retained by an application object", () => {
        expect(filterTrace([{ name: "Scene", type: "object" }, networkInspectorPath[5]])).toBe(true);
    });

    it("keeps incomplete network inspector traces", () => {
        expect(filterTrace(networkInspectorPath.slice(1))).toBe(true);
    });
});
