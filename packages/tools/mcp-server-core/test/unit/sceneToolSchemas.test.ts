import { z } from "zod";

import {
    CreateSceneFlowGraphAttachmentFields,
    CreateSceneGuiAttachmentFields,
    CreateSceneImportFields,
    CreateSceneNodeGeometryFields,
    CreateSceneNodeMaterialInputFields,
    CreateSceneRenderGraphAttachmentFields,
} from "../../src/index";

describe("scene tool schema helpers", () => {
    it("creates the scene node material helper fields", () => {
        const fields: any = CreateSceneNodeMaterialInputFields(z);

        expect(fields.nmeJson.description).toBe("For NodeMaterial: the full NME JSON string exported from the Node Material MCP server");
        expect(fields.nmeJsonFile.description).toBe(
            "For NodeMaterial: absolute path to a file containing the NME JSON (alternative to inline nmeJson — avoids large payloads in context)"
        );
        expect(fields.snippetId.description).toBe("For NodeMaterial: a Babylon.js Snippet Server ID to load from");
        expect(fields.nmeJson.safeParse("{}").success).toBe(true);
        expect(fields.snippetId.safeParse(undefined).success).toBe(true);
    });

    it("creates the scene flow graph attachment helper fields", () => {
        const fields: any = CreateSceneFlowGraphAttachmentFields(z);

        expect(fields.coordinatorJson.description).toBe("The complete Flow Graph coordinator JSON string");
        expect(fields.coordinatorJsonFile.description).toBe("Absolute path to a file containing the Flow Graph coordinator JSON (alternative to inline coordinatorJson)");
        expect(fields.flowGraphJson.description).toBe("Alias for coordinatorJson — the Flow Graph JSON string");
        expect(fields.flowGraphJsonFile.description).toBe("Alias for coordinatorJsonFile — path to the Flow Graph JSON file");
    });

    it("creates the scene GUI/render graph/node geometry attachment helper fields", () => {
        const guiFields: any = CreateSceneGuiAttachmentFields(z);
        const renderGraphFields: any = CreateSceneRenderGraphAttachmentFields(z);
        const geometryFields: any = CreateSceneNodeGeometryFields(z);

        expect(guiFields.guiJsonFile.description).toBe("Absolute path to a file containing the GUI JSON (alternative to inline guiJson)");
        expect(renderGraphFields.nrgJson.description).toBe("The NRG JSON string (from the Node Render Graph MCP server's export_graph_json tool)");
        expect(geometryFields.ngeJsonFile.description).toBe("Absolute path to a file containing the NGE JSON (alternative to inline ngeJson)");
    });

    it("creates the raw scene import helper fields", () => {
        const fields: any = CreateSceneImportFields(z);

        expect(fields.json.description).toBe("The scene descriptor JSON string");
        expect(fields.jsonFile.description).toBe("Absolute path to a file containing the scene descriptor JSON (alternative to inline json)");
        expect(fields.jsonFile.safeParse("/tmp/scene.json").success).toBe(true);
    });
});
