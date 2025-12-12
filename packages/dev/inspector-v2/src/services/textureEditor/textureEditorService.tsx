import { useState, type ComponentType } from "react";

import type { BaseTexture, IDisposable } from "core/index";
import type { TextureEditorToolProvider } from "../../components/textureEditor/textureEditor";
import type { IService, ServiceDefinition } from "../../modularity/serviceDefinition";

import { TextureEditor } from "../../components/textureEditor/textureEditor";
import { useObservableCollection } from "../../hooks/observableHooks";
import { ObservableCollection } from "../../misc/observableCollection";
import { RectangleSelect } from "./tools/rectangularSelect";
import { Contrast } from "./tools/contrast";

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

        toolsCollection.add(RectangleSelect);
        toolsCollection.add(Contrast);

        return {
            addTool: (toolProvider: TextureEditorToolProvider) => toolsCollection.add(toolProvider),
            useTextureEditor: () => {
                const tools = useObservableCollection(toolsCollection);
                const [, setTextureVersion] = useState(0);
                return (props: { texture: BaseTexture }) => <TextureEditor {...props} toolProviders={tools} onUpdate={() => setTextureVersion((version) => version + 1)} />;
            },
        };
    },
};
