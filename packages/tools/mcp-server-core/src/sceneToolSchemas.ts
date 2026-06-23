import { CreateInlineJsonSchema, CreateJsonFileSchema } from "./toolSchemas.js";

/**
 * Create the Node Material input fields used by the Scene MCP server.
 * @param zodFactory - The caller's local Zod factory.
 * @returns Scene Node Material JSON/snippet field schemas.
 */
export function CreateSceneNodeMaterialInputFields(zodFactory: any) {
    return {
        nmeJson: CreateInlineJsonSchema(zodFactory, "For NodeMaterial: the full NME JSON string exported from the Node Material MCP server") as any,
        nmeJsonFile: CreateJsonFileSchema(
            zodFactory,
            "For NodeMaterial: absolute path to a file containing the NME JSON (alternative to inline nmeJson — avoids large payloads in context)"
        ) as any,
        snippetId: zodFactory.string().optional().describe("For NodeMaterial: a Babylon.js Snippet Server ID to load from"),
    };
}

/**
 * Create the Flow Graph attachment input fields used by the Scene MCP server.
 * @param zodFactory - The caller's local Zod factory.
 * @returns Scene Flow Graph attachment field schemas.
 */
export function CreateSceneFlowGraphAttachmentFields(zodFactory: any) {
    return {
        coordinatorJson: CreateInlineJsonSchema(zodFactory, "The complete Flow Graph coordinator JSON string") as any,
        coordinatorJsonFile: CreateJsonFileSchema(zodFactory, "Absolute path to a file containing the Flow Graph coordinator JSON (alternative to inline coordinatorJson)") as any,
        flowGraphJsonFile: CreateJsonFileSchema(zodFactory, "Alias for coordinatorJsonFile — path to the Flow Graph JSON file") as any,
        flowGraphJson: CreateInlineJsonSchema(zodFactory, "Alias for coordinatorJson — the Flow Graph JSON string") as any,
    };
}

/**
 * Create the GUI attachment input fields used by the Scene MCP server.
 * @param zodFactory - The caller's local Zod factory.
 * @returns Scene GUI attachment field schemas.
 */
export function CreateSceneGuiAttachmentFields(zodFactory: any) {
    return {
        guiJson: CreateInlineJsonSchema(zodFactory, "The GUI descriptor JSON string (from the GUI MCP server's export_gui_json)") as any,
        guiJsonFile: CreateJsonFileSchema(zodFactory, "Absolute path to a file containing the GUI JSON (alternative to inline guiJson)") as any,
    };
}

/**
 * Create the render graph attachment input fields used by the Scene MCP server.
 * @param zodFactory - The caller's local Zod factory.
 * @returns Scene render graph attachment field schemas.
 */
export function CreateSceneRenderGraphAttachmentFields(zodFactory: any) {
    return {
        nrgJson: CreateInlineJsonSchema(zodFactory, "The NRG JSON string (from the Node Render Graph MCP server's export_graph_json tool)") as any,
        nrgJsonFile: CreateJsonFileSchema(zodFactory, "Absolute path to a file containing the NRG JSON (alternative to inline nrgJson)") as any,
    };
}

/**
 * Create the node geometry mesh input fields used by the Scene MCP server.
 * @param zodFactory - The caller's local Zod factory.
 * @returns Scene node geometry field schemas.
 */
export function CreateSceneNodeGeometryFields(zodFactory: any) {
    return {
        ngeJson: CreateInlineJsonSchema(zodFactory, "The NGE JSON string (from the Node Geometry MCP server's export_geometry_json tool)") as any,
        ngeJsonFile: CreateJsonFileSchema(zodFactory, "Absolute path to a file containing the NGE JSON (alternative to inline ngeJson)") as any,
    };
}

/**
 * Create the Smart Filter attachment input fields used by the Scene MCP server.
 * @param zodFactory - The caller's local Zod factory.
 * @returns Scene Smart Filter attachment field schemas.
 */
export function CreateSceneSmartFilterAttachmentFields(zodFactory: any) {
    return {
        smartFilterJson: CreateInlineJsonSchema(zodFactory, "The Smart Filter JSON string (from the Smart Filters MCP server's export_smart_filter_json)") as any,
        smartFilterJsonFile: CreateJsonFileSchema(zodFactory, "Absolute path to a file containing the Smart Filter JSON (alternative to inline smartFilterJson)") as any,
    };
}

/**
 * Create the raw scene import input fields used by the Scene MCP server.
 * @param zodFactory - The caller's local Zod factory.
 * @returns Scene raw import field schemas.
 */
export function CreateSceneImportFields(zodFactory: any) {
    return {
        json: CreateInlineJsonSchema(zodFactory, "The scene descriptor JSON string") as any,
        jsonFile: CreateJsonFileSchema(zodFactory, "Absolute path to a file containing the scene descriptor JSON (alternative to inline json)") as any,
    };
}
