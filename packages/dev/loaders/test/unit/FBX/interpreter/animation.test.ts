import { describe, expect, it } from "vitest";
import { evaluateLayeredProperty, extractAnimations, sampleFBXCurveAtTime, type FBXAnimationLayerData, type FBXLayerBlend } from "loaders/FBX/interpreter/animation";
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

    it("extracts animation layers, rebased keyframes, and layer diagnostics", () => {
        const animations = extractAnimations(resolveConnections(createAnimationDocument()));

        expect(animations).toHaveLength(1);
        expect(animations[0].name).toBe("Take 001");
        expect(animations[0].startTime).toBe(0);
        expect(animations[0].stopTime).toBe(1);
        expect(animations[0].curveNodes[0].targetModelId).toBe(10);
        expect(animations[0].curveNodes[0].curves[0].channel).toBe("d|X");
        expect(animations[0].curveNodes[0].curves[0].keys.map((key) => key.time)).toEqual([0, 1]);
        // Override blending and partial weights are evaluated (not flagged): the layer keeps its blend mode and weight.
        expect(animations[0].layers[0].diagnostics).toEqual([]);
        expect(animations[0].layers[0].blendMode).toBe(1);
        expect(animations[0].layers[0].weight).toBe(50);
    });

    it("keeps authored keyframe times when rebasing is disabled", () => {
        const animations = extractAnimations(resolveConnections(createAnimationDocument()), undefined, { rebaseKeyframes: false });

        // Without LocalStart/LocalStop the clip spans its keys, at the times written in the file.
        expect(animations[0].startTime).toBe(1);
        expect(animations[0].stopTime).toBe(2);
        expect(animations[0].curveNodes[0].curves[0].keys.map((key) => key.time)).toEqual([1, 2]);
    });

    it("spans a clip whose keys are all negative without extending it to zero", () => {
        const keyTimes = [-2 * FBX_TIME_UNIT, -FBX_TIME_UNIT];

        const authored = extractAnimations(resolveConnections(createAnimationDocument(keyTimes)), undefined, { rebaseKeyframes: false });
        expect(authored[0].startTime).toBe(-2);
        expect(authored[0].stopTime).toBe(-1);

        // Rebasing never shifts keys forward; the clip still ends at its last key instead of at zero.
        const rebased = extractAnimations(resolveConnections(createAnimationDocument(keyTimes)));
        expect(rebased[0].startTime).toBe(-2);
        expect(rebased[0].stopTime).toBe(-1);
        expect(rebased[0].curveNodes[0].curves[0].keys.map((key) => key.time)).toEqual([-2, -1]);
    });

    it("spans a legacy Takes clip whose keys are all negative", () => {
        const doc = createLegacyTakesDocument([-2 * FBX_TIME_UNIT, -FBX_TIME_UNIT]);

        const authored = extractAnimations(resolveConnections(doc), doc, { rebaseKeyframes: false });
        expect(authored).toHaveLength(1);
        expect(authored[0].curveNodes[0].curves[0].keys.map((key) => key.time)).toEqual([-2, -1]);
        expect(authored[0].startTime).toBe(-2);
        expect(authored[0].stopTime).toBe(-1);

        const rebased = extractAnimations(resolveConnections(doc), doc);
        expect(rebased[0].startTime).toBe(-2);
        expect(rebased[0].stopTime).toBe(-1);
    });

    it("blends property curves through the animation layers", () => {
        const base = { layerIndex: 0, curves: [constantCurve(10)] };
        const second = { layerIndex: 1, curves: [constantCurve(4)] };

        // Additive layer at 50%: 10 + 4 * 0.5
        expect(
            evaluateLayeredProperty(
                [base, second],
                [createLayer({ additive: true, blended: true, weight: 1 }), createLayer({ additive: true, blended: true, weight: 0.5 })],
                ["d|X"],
                [0],
                0.5
            )
        ).toEqual([12]);
        // Override layer at 50%: halfway between the running result and the layer value
        expect(
            evaluateLayeredProperty(
                [base, second],
                [createLayer({ additive: true, blended: true, weight: 1 }), createLayer({ additive: false, blended: true, weight: 0.5 })],
                ["d|X"],
                [0],
                0.5
            )
        ).toEqual([7]);
        // A single layer replaces the static value
        expect(evaluateLayeredProperty([base], [createLayer({ additive: true, blended: true, weight: 1 })], ["d|X"], [99], 0.5)).toEqual([10]);
        // A layer that does not animate the property leaves the running result alone
        expect(
            evaluateLayeredProperty(
                [second],
                [createLayer({ additive: true, blended: true, weight: 1 }), createLayer({ additive: false, blended: true, weight: 0.5 })],
                ["d|X"],
                [20],
                0.5
            )
        ).toEqual([12]);
    });

    it("extracts ASCII key attributes parsed as Float64Array", () => {
        const animations = extractAnimations(resolveConnections(createAsciiKeyAttributesDocument()));
        const keys = animations[0].curveNodes[0].curves[0].keys;

        expect(keys.map((key) => key.interpolation)).toEqual(["constant", "cubic"]);
    });

    it("extracts one animation clip per AnimationStack (multi-clip)", () => {
        const animations = extractAnimations(resolveConnections(createMultiClipDocument()));

        expect(animations).toHaveLength(2);
        expect(animations.map((animation) => animation.name)).toEqual(["Spin", "Bounce"]);
        // Each clip targets the same model through its own curve node + curve.
        expect(animations[0].curveNodes[0].targetModelId).toBe(10);
        expect(animations[1].curveNodes[0].targetModelId).toBe(10);
        expect(animations[0].curveNodes[0].curves[0].channel).toBe("d|Y");
        expect(animations[1].curveNodes[0].curves[0].channel).toBe("d|Y");
    });
});

function constantCurve(value: number) {
    return {
        channel: "d|X",
        keys: [
            { time: 0, value, interpolation: "linear" as const },
            { time: 1, value, interpolation: "linear" as const },
        ],
    };
}

function createLayer(blend: Pick<FBXLayerBlend, "additive" | "blended" | "weight">): FBXAnimationLayerData {
    return {
        name: "Layer",
        weight: blend.weight * 100,
        normalizedWeight: blend.weight,
        blendMode: blend.additive ? 0 : 2,
        blend: { ...blend, composeRotation: true, composeScale: true },
        curveNodes: [],
        unsupportedCurveNodes: [],
        diagnostics: [],
    };
}

// A 6.1 style document: one model and a Takes block with linear translation keys on its X channel.
function createLegacyTakesDocument(keyTimes: number[]): FBXDocument {
    const str = (value: string) => ({ type: "string" as const, value });
    const keyProperties = keyTimes.flatMap((time, index) => [{ type: "int64" as const, value: time }, { type: "float64" as const, value: index }, str("L")]);
    const axis: FBXNode = {
        name: "Channel",
        properties: [str("X")],
        children: [
            { name: "Default", properties: [{ type: "float64", value: 0 }], children: [] },
            { name: "KeyVer", properties: [{ type: "int32", value: 4005 }], children: [] },
            { name: "KeyCount", properties: [{ type: "int32", value: keyTimes.length }], children: [] },
            { name: "Key", properties: keyProperties, children: [] },
        ],
    };
    return {
        version: 6100,
        nodes: [
            {
                name: "Objects",
                properties: [],
                children: [{ name: "Model", properties: [str("Model::Box"), str("Null")], children: [] }],
            },
            { name: "Connections", properties: [], children: [] },
            {
                name: "Takes",
                properties: [],
                children: [
                    {
                        name: "Take",
                        properties: [str("Take 001")],
                        children: [
                            {
                                name: "Model",
                                properties: [str("Model::Box")],
                                children: [
                                    {
                                        name: "Channel",
                                        properties: [str("Transform")],
                                        children: [{ name: "Channel", properties: [str("T")], children: [axis] }],
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    };
}

function createAnimationDocument(keyTimes: number[] = [FBX_TIME_UNIT, FBX_TIME_UNIT * 2]): FBXDocument {
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
                        { name: "KeyTime", properties: [{ type: "int64[]", value: new Float64Array(keyTimes) }], children: [] },
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

// Two AnimationStacks ("Spin" then "Bounce") that drive one model — the loader should surface each
// stack as its own clip/animation group.
function createMultiClipDocument(): FBXDocument {
    const keyTime = () => ({
        name: "KeyTime",
        properties: [{ type: "int64[]" as const, value: new Float64Array([0, FBX_TIME_UNIT]) }],
        children: [],
    });
    return {
        version: 7400,
        nodes: [
            {
                name: "Objects",
                properties: [],
                children: [
                    createObject("Model", 10, "Model::Animated", "Null"),
                    // Clip 1 — Spin (rotation).
                    createObject("AnimationStack", 1, "AnimStack::Spin", ""),
                    createObject("AnimationLayer", 2, "AnimLayer::BaseLayer", ""),
                    createObject("AnimationCurveNode", 3, "AnimationCurveNode::R", ""),
                    createObject("AnimationCurve", 4, "AnimCurve::Y", "", [
                        keyTime(),
                        { name: "KeyValueFloat", properties: [{ type: "float32[]", value: new Float32Array([0, 360]) }], children: [] },
                    ]),
                    // Clip 2 — Bounce (translation).
                    createObject("AnimationStack", 5, "AnimStack::Bounce", ""),
                    createObject("AnimationLayer", 6, "AnimLayer::BaseLayer", ""),
                    createObject("AnimationCurveNode", 7, "AnimationCurveNode::T", ""),
                    createObject("AnimationCurve", 8, "AnimCurve::Y", "", [
                        keyTime(),
                        { name: "KeyValueFloat", properties: [{ type: "float32[]", value: new Float32Array([-1, 1]) }], children: [] },
                    ]),
                ],
            },
            {
                name: "Connections",
                properties: [],
                children: [
                    createConnection("OO", 2, 1),
                    createConnection("OO", 3, 2),
                    createConnection("OP", 3, 10, "Lcl Rotation"),
                    createConnection("OP", 4, 3, "d|Y"),
                    createConnection("OO", 6, 5),
                    createConnection("OO", 7, 6),
                    createConnection("OP", 7, 10, "Lcl Translation"),
                    createConnection("OP", 8, 7, "d|Y"),
                ],
            },
        ],
    };
}
