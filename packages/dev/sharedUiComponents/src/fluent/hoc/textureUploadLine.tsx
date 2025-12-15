import type { FunctionComponent } from "react";
import { useCallback } from "react";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Texture } from "core/Materials/Textures/texture";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { ReadFile } from "core/Misc/fileTools";
import { FileUploadLine } from "./fileUploadLine";

type TextureUploadLineProps = {
    texture: BaseTexture;
    label?: string;
    accept?: string;
    onTextureUpdated?: () => void;
};

/**
 * Component for uploading and updating a texture from a file.
 * Handles both regular textures and cube textures.
 * Only renders if the texture is updatable (Texture or CubeTexture instance).
 */
export const TextureUploadLine: FunctionComponent<TextureUploadLineProps> = ({
    texture,
    label = "Load Texture From File",
    accept = ".jpg, .png, .tga, .dds, .env, .exr",
    onTextureUpdated,
}) => {
    TextureUploadLine.displayName = "TextureUploadLine";

    const isUpdatable = texture instanceof Texture || texture instanceof CubeTexture;

    const updateTexture = useCallback(
        (files: FileList) => {
            const file = files[0];
            if (!file) return;

            ReadFile(
                file,
                (data) => {
                    const blob = new Blob([data], { type: "octet/stream" });

                    const reader = new FileReader();
                    reader.readAsDataURL(blob);
                    reader.onloadend = () => {
                        const base64data = reader.result as string;

                        if (texture instanceof CubeTexture) {
                            let extension: string | undefined = undefined;
                            if (file.name.toLowerCase().indexOf(".dds") > 0) {
                                extension = ".dds";
                            } else if (file.name.toLowerCase().indexOf(".env") > 0) {
                                extension = ".env";
                            }

                            texture.updateURL(base64data, extension, () => onTextureUpdated?.());
                        } else if (texture instanceof Texture) {
                            texture.updateURL(base64data, null, () => onTextureUpdated?.());
                        }
                    };
                },
                undefined,
                true
            );
        },
        [texture, onTextureUpdated]
    );

    if (!isUpdatable) {
        return null;
    }

    return <FileUploadLine label={label} onClick={updateTexture} accept={accept} />;
};
