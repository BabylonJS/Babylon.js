import { type Mesh } from "@babylonjs/lite";
import { describe, expect, it, vi } from "vitest";

vi.hoisted(() => {
    vi.stubGlobal(
        "matchMedia",
        vi.fn(() => ({ matches: false }))
    );
});

import { MeshPropertiesServiceDefinition } from "../../src/lite/services/panes/properties/meshPropertiesService";
import { type IPropertiesService, PropertiesServiceIdentity } from "../../src/services/panes/properties/propertiesService";

describe("Babylon Lite mesh properties service", () => {
    it("registers rendering properties only for Babylon Lite meshes", () => {
        const dispose = vi.fn();
        const addSectionContent = vi.fn(() => ({ dispose }));
        const registration = MeshPropertiesServiceDefinition.factory({ addSectionContent } as unknown as IPropertiesService);
        const sectionContent = addSectionContent.mock.calls[0][0];
        const mesh = {
            name: "Box",
            children: [],
            position: {},
            rotationQuaternion: {},
            scaling: {},
            parent: null,
            material: {},
            receiveShadows: false,
        } as Mesh;

        expect(MeshPropertiesServiceDefinition.consumes).toEqual([PropertiesServiceIdentity]);
        expect(sectionContent.key).toBe("Babylon Lite Mesh Properties");
        expect(sectionContent.content).toHaveLength(1);
        expect(sectionContent.content[0].section).toBe("Rendering");
        expect(sectionContent.predicate(mesh)).toBe(true);
        expect(sectionContent.predicate({ name: "Not a mesh" })).toBe(false);

        registration?.dispose?.();
        expect(dispose).toHaveBeenCalledOnce();
    });
});
