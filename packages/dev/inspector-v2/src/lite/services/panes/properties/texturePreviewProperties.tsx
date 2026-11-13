import {
    getTextureMetadata,
    getTextureReadbackInfo,
    readTexturePixelsRGBA8,
    type CubeTexture,
    type EngineContext,
    type Texture2D,
    type TextureReadbackInfo,
} from "@babylonjs/lite";
import { Body1 } from "@fluentui/react-components";
import { type FunctionComponent, useCallback } from "react";

import { useObservableState } from "shared-ui-components/modularTool/hooks/observableHooks";

import { TexturePreviewCore, type TexturePreviewSelection } from "../../../../components/properties/textures/texturePreviewCore";
import { ApplyTextureChannels } from "../../../../misc/textureChannels";
import { type ISceneResourceIndexService } from "../scene/sceneResourceIndexService";

type LiteTexture = Texture2D | CubeTexture;

type PreviewSnapshot = Readonly<{
    texture: LiteTexture;
    info?: TextureReadbackInfo;
    name?: string;
    error?: string;
}>;

type TexturePreviewPropertiesProps = Readonly<{
    texture: LiteTexture;
    engine: EngineContext;
    resourceIndexService: ISceneResourceIndexService;
}>;

function GetDownloadFileName(name: string | undefined): string {
    const safeName = name?.trim().replace(/[\\/:*?"<>|\p{Cc}]/gu, "_") || "texture";
    return safeName.toLowerCase().endsWith(".png") ? safeName : `${safeName}.png`;
}

/**
 * Displays and exports a Lite texture using its public readback API.
 * @param props The texture, engine and owning resource index.
 * @returns The texture preview or an error when the texture is unavailable.
 * @internal
 */
export const TexturePreviewProperties: FunctionComponent<TexturePreviewPropertiesProps> = (props) => {
    const { texture, engine, resourceIndexService } = props;
    const getSnapshot = useCallback((): PreviewSnapshot => {
        if (resourceIndexService.isDisposed) {
            return { texture, error: "The Inspector is closed." };
        }
        try {
            return { texture, info: getTextureReadbackInfo(texture), name: getTextureMetadata(texture)?.name };
        } catch (error) {
            return { texture, error: error instanceof Error ? error.message : String(error) };
        }
    }, [texture, resourceIndexService]);
    const observedSnapshot = useObservableState(getSnapshot, resourceIndexService.onChanged, resourceIndexService.onDisposed);
    const snapshot = observedSnapshot.texture === texture ? observedSnapshot : getSnapshot();
    const kind = snapshot.info?.kind;
    const getPixelsAsync = useCallback(
        async (selection: TexturePreviewSelection) => {
            if (resourceIndexService.isDisposed) {
                throw new Error("The Inspector is closed.");
            }
            const options = {
                mipLevel: selection.lod,
                ...(kind === "cube" ? { face: selection.face } : kind === "2d-array" ? { layer: selection.layer } : kind === "3d" ? { slice: selection.slice } : {}),
            };
            const { pixels, width, height } = await readTexturePixelsRGBA8(engine, texture, options);
            if (resourceIndexService.isDisposed) {
                throw new Error("The Inspector is closed.");
            }
            ApplyTextureChannels(pixels, selection.channels, width * height);
            return { data: pixels, width, height };
        },
        [engine, texture, kind, resourceIndexService]
    );

    if (!snapshot.info) {
        return <Body1 role="alert">{`Texture preview failed: ${snapshot.error}`}</Body1>;
    }

    const { info } = snapshot;
    return (
        <TexturePreviewCore
            source={texture}
            kind={info.kind}
            depth={info.kind === "3d" ? info.depthOrArrayLayers : 1}
            layerCount={info.kind === "2d-array" ? info.depthOrArrayLayers : 0}
            maxLod={Math.max(0, info.mipLevelCount - 1)}
            refreshable
            getPixelsAsync={getPixelsAsync}
            downloadFileName={GetDownloadFileName(snapshot.name)}
        />
    );
};
