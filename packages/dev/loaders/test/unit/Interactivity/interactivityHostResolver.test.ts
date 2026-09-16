import { InteractivityHostResolver } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityHostResolver";
import { EventReferencePrefix, GetEventReference, GetEventReferenceKey, IsEventReference } from "loaders/glTF/2.0/Extensions/KHR_interactivity/interactivityReferences";

/**
 * The KHR_interactivity loader owns how opaque `ref` values are represented, and supplies that
 * representation to the FlowGraph engine through {@link InteractivityHostResolver}.
 *
 * Reference values are static JSON Pointers (RFC 6901) with no trailing slash: `/nodes/5` and
 * `/nodes/5/` are different pointers, and only the former addresses the node.
 */
describe("KHR_interactivity host resolver", () => {
    const resolver = new InteractivityHostResolver();

    describe("event references", () => {
        it("round-trips an event source key", () => {
            const reference = resolver.encodeEventReference("myEvent");

            expect(reference).toBe(`${EventReferencePrefix}myEvent`);
            expect(resolver.decodeEventReference(reference)).toBe("myEvent");
        });

        it("rejects a value from another namespace", () => {
            expect(resolver.decodeEventReference("/extensions/OTHER/events/myEvent")).toBeUndefined();
            expect(IsEventReference("/nodes/0")).toBe(false);
        });

        it("produces equal references for the same source", () => {
            expect(GetEventReference("onTick")).toBe(GetEventReference("onTick"));
            expect(GetEventReferenceKey(GetEventReference("onTick"))).toBe("onTick");
        });
    });

    describe("indexed references", () => {
        it.each([
            ["/animations/0", 0],
            ["/animations/12", 12],
            ["/nodes/7", 7],
        ])("decodes %s", (reference, expected) => {
            expect(resolver.decodeIndexReference(reference)).toBe(expected);
        });

        it.each([
            // Not a JSON Pointer.
            ["animations/0"],
            [""],
            // RFC 6901 array indices are unsigned decimals with no leading zeros, so these numeric
            // literal forms must not be accepted.
            ["/animations/01"],
            ["/animations/0x2"],
            ["/animations/1e1"],
            ["/animations/-1"],
            ["/animations/1.5"],
            ["/animations/ 3"],
            // A trailing slash addresses the empty-string child, not the animation.
            ["/animations/0/"],
            ["/animations/name"],
        ])("rejects %s", (reference) => {
            expect(resolver.decodeIndexReference(reference)).toBeUndefined();
        });
    });

    describe("object references", () => {
        const meshLikeObject = { _internalMetadata: { gltf: { pointers: ["/meshes/3/primitives/0", "/nodes/9"] } } };

        it("prefers the pointer matching the hint", () => {
            expect(resolver.getObjectReference(meshLikeObject, "nodes")).toBe("/nodes/9");
            expect(resolver.getObjectReference(meshLikeObject, "meshes")).toBe("/meshes/3/primitives/0");
        });

        it("falls back to the first pointer when the hint does not match", () => {
            expect(resolver.getObjectReference(meshLikeObject, "materials")).toBe("/meshes/3/primitives/0");
            expect(resolver.getObjectReference(meshLikeObject)).toBe("/meshes/3/primitives/0");
        });

        it("returns undefined for an object the loader did not stamp", () => {
            expect(resolver.getObjectReference({})).toBeUndefined();
            expect(resolver.getObjectReference({ _internalMetadata: { gltf: { pointers: [] } } })).toBeUndefined();
        });
    });
});
