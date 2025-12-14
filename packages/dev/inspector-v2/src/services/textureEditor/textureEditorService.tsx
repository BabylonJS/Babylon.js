import { type ComponentType } from "react";

import type { IDisposable } from "core/index";
import type { TextureEditorProps, TextureEditorToolProvider } from "../../components/textureEditor/textureEditor";
import type { IService, ServiceDefinition } from "../../modularity/serviceDefinition";

import { TextureEditor } from "../../components/textureEditor/textureEditor";
import { useOrderedObservableCollection } from "../../hooks/observableHooks";
import { ObservableCollection } from "../../misc/observableCollection";
import { Contrast } from "./tools/contrast";
import { Eyedropper } from "./tools/eyedropper";
import { Floodfill } from "./tools/floodfill";
import { Paintbrush } from "./tools/paintbrush";
import { RectangleSelect } from "./tools/rectangularSelect";

export const TextureEditorServiceIdentity = Symbol("TextureEditorService");

/**
 * Allows tools to be added to the texture editor, and also exposes a React component that is the texture editor with all the tools configured.
 */
export interface ITextureEditorService extends IService<typeof TextureEditorServiceIdentity> {
    /**
     * Adds a new tool to the texture editor.
     * @param toolProvider A provider that can create instances of the tool.
     * @returns A disposable that removes the tool from the texture editor when disposed.
     */
    addTool(toolProvider: TextureEditorToolProvider): IDisposable;

    /**
     * The texture editor component with all the registered tools.
     */
    readonly component: ComponentType<TextureEditorProps>;
}

export const TextureEditorServiceDefinition: ServiceDefinition<[ITextureEditorService], []> = {
    friendlyName: "Texture Editor",
    produces: [TextureEditorServiceIdentity],
    factory: () => {
        const toolsCollection = new ObservableCollection<TextureEditorToolProvider>();

        // Add the default tools.
        toolsCollection.add(RectangleSelect);
        toolsCollection.add(Paintbrush);
        toolsCollection.add(Eyedropper);
        toolsCollection.add(Floodfill);
        toolsCollection.add(Contrast);

        return {
            addTool: (toolProvider: TextureEditorToolProvider) => toolsCollection.add(toolProvider),
            component: (props: TextureEditorProps) => {
                const tools = useOrderedObservableCollection(toolsCollection);
                return <TextureEditor {...props} toolProviders={tools} />;
            },
        };
    },
};
