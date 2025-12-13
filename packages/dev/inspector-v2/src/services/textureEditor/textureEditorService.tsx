import { useMemo, useState, type ComponentType } from "react";

import type { BaseTexture, IDisposable } from "core/index";
import type { TextureEditorToolProvider } from "../../components/textureEditor/textureEditor";
import type { IService, ServiceDefinition } from "../../modularity/serviceDefinition";

import { TextureEditor } from "../../components/textureEditor/textureEditor";
import { useObservableCollection } from "../../hooks/observableHooks";
import { ObservableCollection } from "../../misc/observableCollection";
import { Contrast } from "./tools/contrast";
import { Eyedropper } from "./tools/eyedropper";
import { Floodfill } from "./tools/floodfill";
import { Paintbrush } from "./tools/paintbrush";
import { RectangleSelect } from "./tools/rectangularSelect";

export const TextureEditorServiceIdentity = Symbol("TextureEditorService");

export interface ITextureEditorService extends IService<typeof TextureEditorServiceIdentity> {
    addTool(toolProvider: TextureEditorToolProvider): IDisposable;
    useTextureEditor(): ComponentType<{ texture: BaseTexture }>;
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
            useTextureEditor: () => {
                const [, setTextureVersion] = useState(0);
                return useMemo(
                    () => (props: { texture: BaseTexture }) => {
                        const tools = useObservableCollection(toolsCollection);
                        return <TextureEditor {...props} toolProviders={tools} onUpdate={() => setTextureVersion((version) => version + 1)} />;
                    },
                    []
                );
            },
        };
    },
};
