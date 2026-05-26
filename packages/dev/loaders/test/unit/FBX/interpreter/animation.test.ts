import { describe, expect, it } from "vitest";
import { extractAnimations, isFrameBakedSampledCurve, sampleFBXCurveAtTime, type FBXKeyframe } from "loaders/FBX/interpreter/animation";
import { resolveConnections } from "loaders/FBX/interpreter/connections";
import { type FBXDocument, type FBXNode } from "loaders/FBX/types/fbxTypes";

const FBX_TIME_UNIT = 46186158000;

describe("FBX animation interpretation", () => {
    it("samples constant and cubic curves according to their key interpolation", () => {
        expect(
            sampleFBXCurveAtTime(
                {
                    channel: "d|X",
                    keys: [
                        { time: 0, value: 1, interpolation: "constant" },
                        { time: 1, value: 9, interpolation: "linear" },
                    ],
                },
                0.5
            )
        ).toBe(1);

        expect(
            sampleFBXCurveAtTime(
                {
                    channel: "d|X",
                    keys: [
                        { time: 0, value: 1, interpolation: "constant", constantMode: "next" },
                        { time: 1, value: 9, interpolation: "linear" },
                    ],
                },
                0.5
            )
        ).toBe(9);

        expect(
            sampleFBXCurveAtTime(
                {
                    channel: "d|X",
                    keys: [
                        { time: 0, value: 0, interpolation: "cubic", rightSlope: 0, nextLeftSlope: 0 },
                        { time: 1, value: 10, interpolation: "linear" },
                    ],
                },
                0.25
            )
        ).toBeCloseTo(1.5625);
    });

    it("detects uniformly frame-baked sampled curves", () => {
        const sampledKeys = createSampledKeys(8, 30);

        expect(isFrameBakedSampledCurve(sampledKeys)).toBe(true);
        expect(isFrameBakedSampledCurve([{ ...sampledKeys[0], time: 0 }, { ...sampledKeys[1], time: 0.1 }, ...sampledKeys.slice(2)])).toBe(false);
    });

    it("extracts animation layers, rebased keyframes, and layer diagnostics", () => {
        const animations = extractAnimations(resolveConnections(createAnimationDocument()));

        expect(animations).toHaveLength(1);
        expect(animations[0].name).toBe("Take 001");
        expect(animations[0].startTime).toBe(0);
        expect(animations[0].stopTime).toBe(1);
        expect(animations[0].curveNodes[0].targetModelId).toBe(10);
        expect(animations[0].curveNodes[0].curves[0].channel).toBe("d|X");
        expect(animations[0].curveNodes[0].curves[0].keys.map((key) => key.time)).toEqual([0, 1]);
        expect(animations[0].layers[0].diagnostics.map((diagnostic) => diagnostic.type)).toEqual(["unsupported-layer-blend-mode", "partial-layer-weight"]);
    });

    it("extracts ASCII key attributes parsed as Float64Array", () => {
        const animations = extractAnimations(resolveConnections(createAsciiKeyAttributesDocument()));
        const keys = animations[0].curveNodes[0].curves[0].keys;

        expect(keys.map((key) => key.interpolation)).toEqual(["constant", "cubic"]);
    });
});

function createSampledKeys(count: number, fps: number): FBXKeyframe[] {
    return Array.from({ length: count }, (_, index) => ({
        time: index / fps,
        value: index,
        interpolation: "linear" as const,
    }));
}

function createAnimationDocument(): FBXDocument {
    return {
        version: 7400,
        nodes: [
            {
                name: "Objects",
                properties: [],
                children: [
                    createObject("Model", 10, "Model::Animated", "Null"),
                    createObject("AnimationStack", 1, "AnimStack::Take 001", "", [
                        {
                            name: "Properties70",
                            properties: [],
                            children: [],
                        },
                    ]),
                    createObject("AnimationLayer", 2, "AnimLayer::BaseLayer", "", [
                        {
                            name: "Properties70",
                            properties: [],
                            children: [createProperty("Weight", 50), createProperty("BlendMode", 1)],
                        },
                    ]),
                    createObject("AnimationCurveNode", 3, "AnimationCurveNode::T", ""),
                    createObject("AnimationCurve", 4, "AnimCurve::X", "", [
                        { name: "KeyTime", properties: [{ type: "int64[]", value: new Float64Array([FBX_TIME_UNIT, FBX_TIME_UNIT * 2]) }], children: [] },
                        { name: "KeyValueFloat", properties: [{ type: "float32[]", value: new Float32Array([3, 6]) }], children: [] },
                    ]),
                ],
            },
            {
                name: "Connections",
                properties: [],
                children: [createConnection("OO", 2, 1), createConnection("OO", 3, 2), createConnection("OP", 3, 10, "Lcl Translation"), createConnection("OP", 4, 3, "d|X")],
            },
        ],
    };
}

function createAsciiKeyAttributesDocument(): FBXDocument {
    return {
        version: 7400,
        nodes: [
            {
                name: "Objects",
                properties: [],
                children: [
                    createObject("Model", 10, "Model::Animated", "Null"),
                    createObject("AnimationStack", 1, "AnimStack::Take 001", ""),
                    createObject("AnimationLayer", 2, "AnimLayer::BaseLayer", ""),
                    createObject("AnimationCurveNode", 3, "AnimationCurveNode::T", ""),
                    createObject("AnimationCurve", 4, "AnimCurve::X", "", [
                        { name: "KeyTime", properties: [{ type: "int64[]", value: new Float64Array([0, FBX_TIME_UNIT]) }], children: [] },
                        { name: "KeyValueFloat", properties: [{ type: "float32[]", value: new Float32Array([3, 6]) }], children: [] },
                        { name: "KeyAttrFlags", properties: [{ type: "float64[]", value: new Float64Array([0x00000002, 0x00000008]) }], children: [] },
                        { name: "KeyAttrRefCount", properties: [{ type: "float64[]", value: new Float64Array([1, 1]) }], children: [] },
                    ]),
                ],
            },
            {
                name: "Connections",
                properties: [],
                children: [createConnection("OO", 2, 1), createConnection("OO", 3, 2), createConnection("OP", 3, 10, "Lcl Translation"), createConnection("OP", 4, 3, "d|X")],
            },
        ],
    };
}

function createObject(name: string, id: number, objectName: string, subType: string, children: FBXNode[] = []): FBXNode {
    return {
        name,
        properties: [
            { type: "int64", value: id },
            { type: "string", value: objectName },
            { type: "string", value: subType },
        ],
        children,
    };
}

function createProperty(name: string, value: number): FBXNode {
    return {
        name: "P",
        properties: [
            { type: "string", value: name },
            { type: "string", value: "Number" },
            { type: "string", value: "" },
            { type: "string", value: "A" },
            { type: "float64", value },
        ],
        children: [],
    };
}

function createConnection(type: string, child: number, parent: number, propertyName?: string): FBXNode {
    return {
        name: "C",
        properties: [
            { type: "string", value: type },
            { type: "int64", value: child },
            { type: "int64", value: parent },
            ...(propertyName ? [{ type: "string" as const, value: propertyName }] : []),
        ],
        children: [],
    };
}
