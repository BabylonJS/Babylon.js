import { describe, expect, it, vi } from "vitest";
import { Vector3 } from "core/Maths/math.vector";
import { NullEngine } from "core/Engines/nullEngine";
import { Scene } from "core/scene";
import { CreateSphere } from "core/Meshes/Builders/sphereBuilder";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import { TransformNode } from "core/Meshes/transformNode";
import {
    ContactGap,
    ContactTracker,
    MaxContactAudioBytes,
    ReadContactAudio,
    RemoveContactAudioReaction,
    SetContactAudioReaction,
    ValidateContactAudioFile,
    type ContactShape,
    type IContactShape,
} from "flow-graph-editor/contactAudio";
import { CreateContactAudioDefaults, GetContactObjects, WorldContactShape, ContactAudioRuntime } from "flow-graph-editor/contactAudioRuntime";
import { PatchGltfExtras, PatchGlbExtras, ReadGlbDocument } from "flow-graph-editor/khrGlbBehaviorAuthoring";

const Sphere = (x: number, y = 0): ContactShape => ({ type: "sphere", center: new Vector3(x, y, 0), radius: 0.5 });

describe("contact audio authoring", () => {
    it("assigns cue identifiers when a self-hosted editor has no secure-context UUID API", () => {
        vi.stubGlobal("crypto", { randomUUID: undefined });
        try {
            const shapes: IContactShape[] = [0, 1].map((node) => ({ node, type: "sphere", center: [0, 0, 0], halfSize: [0.5, 0.5, 0.5] }));
            const data = SetContactAudioReaction({ asset: { version: "2.0" }, nodes: [{}, {}] }, [0, 1], [0, 1], shapes, CreateContactAudioDefaults()[0]);
            expect(data.rules[0].cue).toMatch(/^contact\.[0-9a-f-]{36}$/);
        } finally {
            vi.unstubAllGlobals();
        }
    });
    it("adds two distinct cues, edits one without duplicating it, and keeps named identities stable", () => {
        const source = { asset: { version: "2.0" }, nodes: [{ name: "ball" }, { name: "ball" }, { name: "platform" }] };
        const shapes: IContactShape[] = [0, 1, 2].map((node) => ({ node, type: node === 2 ? "box" : "sphere", center: [0, 0, 0], halfSize: [0.5, 0.5, 0.5] }));
        const [tap, click] = CreateContactAudioDefaults();
        const one = SetContactAudioReaction(source, [0, 1], [0, 1], shapes, tap);
        one.sources[0].gain = 0.4;
        const two = SetContactAudioReaction({ ...source, extras: { babylonContactAudio: one } }, [0, 1], [2], shapes, click);
        expect(two.sources[0].gain, "adding another cue preserves the existing source gain").toBe(0.4);
        expect(two.rules).toHaveLength(2);
        expect(two.audio).toHaveLength(2);
        const edited = SetContactAudioReaction({ ...source, extras: { babylonContactAudio: two } }, [0, 1], [0, 1], shapes, click, two.rules[0].cue);
        expect(edited.rules).toHaveLength(2);
        expect(edited.audio, "unused encoded assets are removed on editing a reaction").toHaveLength(1);
        expect(edited.rules.find((rule) => rule.objects.includes(0) && rule.partners.includes(1))?.cue).toBe(one.rules[0].cue);
        expect(source.nodes.map((node) => node.name)).toEqual(["ball", "ball", "platform"]);
        expect(() => SetContactAudioReaction({ ...source, extras: { babylonContactAudio: two } }, [1], [0], shapes, tap)).toThrow("one sound reaction per pair");
        expect(() => SetContactAudioReaction(source, [0], [0], shapes, tap)).toThrow("Choose distinct contact pairs");
        expect(() => SetContactAudioReaction(source, [0], [9], shapes, tap)).toThrow("Malformed contact audio metadata");
        const removed = RemoveContactAudioReaction({ ...source, extras: { babylonContactAudio: two } }, two.rules[0].cue);
        expect(removed.rules).toHaveLength(1);
        expect(removed.audio).toEqual([click]);
        expect(removed.rules[0].cue).toBe(two.rules[1].cue);
    });
    it("patches split glTF JSON tokens and GLB suffix chunks without touching graphs or resource URIs", () => {
        const source =
            '{"asset":{"version":"2.0"},"nodes":[{"name":"ball","extras":{"id":9007199254740993}}],"buffers":[{"uri":"folder/geometry.bin"}],"extensions":{"KHR_interactivity":{"graphs":[]},"VENDOR_unknown":{"token":1.2300e-4}},"extras":{"stableId":"asset-7"}}';
        const value = { version: 1, audio: [{ uri: "data:audio/mpeg;base64,SUQz" }] };
        const patched = PatchGltfExtras(source, "babylonContactAudio", value);
        expect(patched).toContain('"id":9007199254740993');
        expect(patched).toContain('"token":1.2300e-4');
        const doc = JSON.parse(patched);
        expect(doc.extras.stableId).toBe("asset-7");
        expect(doc.extensions).toEqual(JSON.parse(source).extensions);
        expect(doc.buffers).toEqual(JSON.parse(source).buffers);
        const json = new TextEncoder().encode(source);
        const size = Math.ceil(json.length / 4) * 4;
        const glb = new Uint8Array(20 + size + 12).fill(32);
        const view = new DataView(glb.buffer);
        view.setUint32(0, 0x46546c67, true);
        view.setUint32(4, 2, true);
        view.setUint32(8, glb.length, true);
        view.setUint32(12, size, true);
        view.setUint32(16, 0x4e4f534a, true);
        glb.set(json, 20);
        view.setUint32(20 + size, 4, true);
        view.setUint32(24 + size, 0x12345678, true);
        glb.set([1, 2, 3, 4], 28 + size);
        const output = PatchGlbExtras(glb, "babylonContactAudio", value);
        expect(output.slice(20 + new DataView(output.buffer).getUint32(12, true))).toEqual(glb.slice(20 + size));
        expect(ReadGlbDocument(output)).toEqual(doc);
        expect(() => PatchGltfExtras('{"asset":{"version":"2.0"},"extras":"opaque source data"}', "babylonContactAudio", value)).toThrow("non-object extras");
    });
    it("retains source and emitter annotations through adding, editing, and removing other cues", () => {
        const source = { asset: { version: "2.0" }, nodes: [{}, {}, {}] };
        const shapes: IContactShape[] = [0, 1, 2].map((node) => ({ node, type: node === 2 ? "box" : "sphere", center: [0, 0, 0], halfSize: [0.5, 0.5, 0.5] }));
        const [tap, click] = CreateContactAudioDefaults();
        const first = SetContactAudioReaction(source, [0, 1], [0, 1], shapes, tap);
        Object.assign(first.sources[0], { extras: { caption: "balls touching" } });
        Object.assign(first.emitters[0], { extras: { label: "impact emitter" } });
        const withCue = SetContactAudioReaction({ ...source, extras: { babylonContactAudio: first } }, [0], [2], shapes, click);
        const edited = SetContactAudioReaction({ ...source, extras: { babylonContactAudio: withCue } }, [0, 1], [0, 1], shapes, click, first.rules[0].cue);
        const removed = RemoveContactAudioReaction({ ...source, extras: { babylonContactAudio: withCue } }, withCue.rules[1].cue);
        for (const data of [withCue, edited, removed]) {
            const emitter = data.emitters[data.rules.find((rule) => rule.cue === first.rules[0].cue)!.emitter];
            expect(data.sources[emitter.sources[0]], "an unrelated cue edit must retain source annotations").toMatchObject({ extras: { caption: "balls touching" } });
            expect(emitter, "an unrelated cue edit must retain emitter annotations").toMatchObject({ extras: { label: "impact emitter" } });
        }
    });
    it("rejects oversized imports before a decoder is called", () => {
        expect(() => ValidateContactAudioFile("tap.mp3", MaxContactAudioBytes + 1, new Uint8Array([73, 68, 51]))).toThrow("Choose an audio file of 10 MB or less");
    });
    it("counts base64 padding exactly at the per-asset and aggregate encoded budgets", () => {
        const asset = (size: number) => ({ name: "clip", mimeType: "audio/mpeg", uri: `data:audio/mpeg;base64,${Buffer.alloc(size).toString("base64")}` });
        const document = (audio: ReturnType<typeof asset>[]) => ({
            asset: { version: "2.0" },
            extras: { babylonContactAudio: { version: 1, audio, sources: [], emitters: [], shapes: [], rules: [] } },
        });
        expect(() => ReadContactAudio(document([asset(MaxContactAudioBytes), asset(MaxContactAudioBytes)])), "two 10 MB clips fit the encoded budget").not.toThrow();
        expect(() => ReadContactAudio(document([asset(MaxContactAudioBytes + 1)])), "padding must not admit an oversized asset").toThrow("Malformed contact audio metadata");
    });
    it("rejects mislabeled files and unsupported Ogg codecs with actionable messages", () => {
        expect(() => ValidateContactAudioFile("tap.mp3", 12, new TextEncoder().encode("not an audio"))).toThrow("The file contents do not match MP3, AAC, or Ogg Opus");
        expect(() => ValidateContactAudioFile("tap.ogg", 12, new TextEncoder().encode("OggSvorbis"))).toThrow("Choose an Ogg Opus file");
    });
    it("identifies accepted containers independently of an unhelpful browser MIME type", () => {
        expect(ValidateContactAudioFile("tap.MP3", 3, new Uint8Array([73, 68, 51]))).toBe("audio/mpeg");
        expect(ValidateContactAudioFile("tap.aac", 2, new Uint8Array([255, 241]))).toBe("audio/aac");
        expect(ValidateContactAudioFile("tap.m4a", 12, new TextEncoder().encode("\u0000\u0000\u0000\u0018ftypM4A "))).toBe("audio/mp4");
        expect(ValidateContactAudioFile("tap.opus", 16, new TextEncoder().encode("OggS....OpusHead"))).toBe("audio/ogg");
    });
    it("does not overwrite unsupported or malformed saved bindings", () => {
        expect(() => ReadContactAudio({ asset: { version: "2.0" }, extras: { babylonContactAudio: { version: 2 } } })).toThrow("Unsupported contact audio version");
        expect(() => ReadContactAudio({ asset: { version: "2.0" }, extras: { babylonContactAudio: { version: 1 } } })).toThrow("Malformed contact audio metadata");
    });
    it("explains the asset limit instead of calling a seventeenth sound malformed", () => {
        const data = { version: 1, audio: Array.from({ length: 17 }, () => CreateContactAudioDefaults()[0]), sources: [], emitters: [], shapes: [], rules: [] };
        expect(() => ReadContactAudio({ asset: { version: "2.0" }, extras: { babylonContactAudio: data } })).toThrow(
            "Choose at most 16 sound assets. Remove a reaction or reuse a saved sound."
        );
    });
});

describe("rigid contact geometry and lifecycle", () => {
    it("uses source indices for duplicate names and excludes ambiguous primitive groups", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            const a = CreateSphere("ball", { diameter: 1 }, scene);
            const b = CreateSphere("ball", { diameter: 1 }, scene);
            const platform = CreateBox("ball", { size: 1 }, scene);
            [a, b, platform].forEach((mesh, index) => {
                mesh._internalMetadata = { gltf: { pointers: [`/nodes/${index}`] } };
            });
            expect(GetContactObjects(scene.meshes, 3).map((entry) => [entry.shape.node, entry.shape.type])).toEqual([
                [0, "sphere"],
                [1, "sphere"],
                [2, "box"],
            ]);
            const parent = new TransformNode("multiple primitives", scene);
            parent._internalMetadata = { gltf: { pointers: ["/nodes/0"] } };
            a._internalMetadata = null;
            a.parent = parent;
            b._internalMetadata = null;
            b.parent = parent;
            expect(GetContactObjects(scene.meshes, 3).map((entry) => entry.shape.node)).toEqual([2]);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
    it("handles scaled, rotated platforms but excludes shears, flattened and stretched spheres", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            const mesh = CreateBox("platform", {}, scene);
            const shape: IContactShape = { node: 0, type: "box", center: [0, 0, 0], halfSize: [0.5, 0.5, 0.5] };
            mesh.scaling.set(-4, 0.5, 2);
            mesh.rotation.z = Math.PI / 2;
            const box = WorldContactShape(mesh, shape);
            expect(box?.type).toBe("box");
            expect(box?.type === "box" && box.halfSize).toEqual([2, 0.25, 1]);
            expect(WorldContactShape(mesh, { ...shape, type: "sphere" })).toBeNull();
            mesh.scaling.set(0, 1, 1);
            expect(WorldContactShape(mesh, shape)).toBeNull();
            const parent = new TransformNode("scaled parent", scene);
            parent.scaling.set(2, 1, 1);
            mesh.parent = parent;
            mesh.scaling.set(1, 1, 1);
            mesh.rotation.z = Math.PI / 4;
            expect(WorldContactShape(mesh, shape), "a sheared proxy must not masquerade as an orthogonal box").toBeNull();
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
    it("stops contact dispatch while paused and removes scene observers on disposal", () => {
        const engine = new NullEngine();
        const scene = new Scene(engine);
        try {
            const a = CreateSphere("a", { diameter: 1 }, scene);
            const b = CreateSphere("b", { diameter: 1 }, scene);
            b.position.x = 2;
            const shapes: IContactShape[] = [0, 1].map((node) => ({ node, type: "sphere", center: [0, 0, 0], halfSize: [0.5, 0.5, 0.5] }));
            const data = SetContactAudioReaction({ nodes: [{}, {}] }, [0], [1], shapes, CreateContactAudioDefaults()[0]);
            let running = true;
            const cues: number[][] = [];
            const observersBefore = scene.onAfterRenderObservable.observers.length;
            const runtime = new ContactAudioRuntime(
                scene,
                data,
                new Map([
                    [0, a],
                    [1, b],
                ]),
                () => running,
                () => {}
            );
            runtime.onCueObservable.add((event) => cues.push(event.nodes));
            scene.onAfterRenderObservable.notifyObservers(scene);
            b.position.x = 1;
            scene.onAfterRenderObservable.notifyObservers(scene);
            expect(cues).toEqual([[0, 1]]);
            running = false;
            b.position.x = 2;
            scene.onAfterRenderObservable.notifyObservers(scene);
            running = true;
            scene.onAfterRenderObservable.notifyObservers(scene);
            b.position.x = 1;
            scene.onAfterRenderObservable.notifyObservers(scene);
            expect(cues).toHaveLength(2);
            runtime.dispose();
            expect(scene.onAfterRenderObservable.observers.length).toBe(observersBefore);
            runtime.dispose();
            scene.onAfterRenderObservable.notifyObservers(scene);
            expect(cues).toHaveLength(2);
        } finally {
            scene.dispose();
            engine.dispose();
        }
    });
});

describe("scene contact cues", () => {
    it("measures sphere-to-sphere distance and the spatial cue point", () => {
        const contact = ContactGap(Sphere(0), Sphere(1));
        expect(contact?.gap, "touching spheres have zero surface gap").toBeCloseTo(0);
        expect(contact?.point.asArray()).toEqual([0.5, 0, 0]);
    });
    it("finds the nearest point on a rotated platform and rejects box-to-box pairs", () => {
        const box: ContactShape = { type: "box", center: Vector3.Zero(), axes: [new Vector3(0, 1, 0), new Vector3(-1, 0, 0), new Vector3(0, 0, 1)], halfSize: [2, 0.25, 1] };
        expect(ContactGap(Sphere(0.75), box)?.gap, "sphere touches the rotated platform's thin face").toBeCloseTo(0);
        expect(ContactGap(box, Sphere(0.75))?.point.asArray()).toEqual([0.25, 0, 0]);
        expect(ContactGap(box, box)).toBeNull();
    });
    it("positions an embedded sphere's cue on the nearest box surface", () => {
        const box: ContactShape = { type: "box", center: Vector3.Zero(), axes: [Vector3.Right(), Vector3.Up(), Vector3.Forward()], halfSize: [2, 0.25, 1] };
        const contact = ContactGap(Sphere(0.1), box);
        expect(contact?.point.asArray(), "an inside contact uses the nearest surface, rather than the sphere center").toEqual([0.1, 0.25, 0]);
        expect(contact?.gap).toBeCloseTo(-0.75);
    });
    it("fires once on onset, de-duplicates reversed pairs, and re-arms after separation", () => {
        const tracker = new ContactTracker();
        const shapes = new Map<number, ContactShape>([
            [3, Sphere(0)],
            [4, Sphere(2)],
        ]);
        const pairs = [
            [3, 4],
            [4, 3],
            [3, 3],
        ] as const;
        expect(tracker.update(pairs, shapes)).toHaveLength(0);
        shapes.set(4, Sphere(1));
        expect(tracker.update(pairs, shapes), "one cue for the ball pair").toHaveLength(1);
        expect(tracker.update(pairs, shapes), "resting contact must stay silent").toHaveLength(0);
        shapes.set(4, Sphere(1.006));
        expect(tracker.update(pairs, shapes), "small contact jitter must stay silent").toHaveLength(0);
        shapes.set(4, Sphere(2));
        tracker.update(pairs, shapes);
        shapes.set(4, Sphere(1));
        expect(tracker.update(pairs, shapes), "a new impact re-arms the cue").toHaveLength(1);
    });
    it("suppresses initial overlaps and forgets removed objects and reset state", () => {
        const tracker = new ContactTracker();
        const shapes = new Map<number, ContactShape>([
            [0, Sphere(0)],
            [1, Sphere(1)],
        ]);
        expect(tracker.update([[0, 1]], shapes)).toHaveLength(0);
        tracker.reset();
        expect(tracker.update([[0, 1]], shapes)).toHaveLength(0);
        shapes.delete(1);
        expect(tracker.update([[0, 1]], shapes)).toHaveLength(0);
        shapes.set(1, Sphere(1));
        expect(tracker.update([[0, 1]], shapes)).toHaveLength(0);
    });
});
