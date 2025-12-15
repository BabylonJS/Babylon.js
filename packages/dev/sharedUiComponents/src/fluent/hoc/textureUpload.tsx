import type { FunctionComponent } from "react";
import { useCallback } from "react";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Nullable } from "core/types";
import type { Scene } from "core/scene";
import { Texture } from "core/Materials/Textures/texture";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { ReadFile } from "core/Misc/fileTools";
import { UploadButton } from "../primitives/uploadButton";

type TextureUploadProps = {
    /**
     * The scene to create the texture in
     */
    scene: Scene;
    /**
     * Callback when a texture is uploaded/created
     */
    onTextureCreated: (texture: BaseTexture) => void;
    /**
     * File types to accept for upload
     */
    accept?: string;
    /**
     * Whether to create cube textures
     */
    cubeOnly?: boolean;
    /**
     * Button title
     */
    title?: string;
};

/**
 * A button that uploads a file and creates a new Texture or CubeTexture.
 */
export const TextureUpload: FunctionComponent<TextureUploadProps> = ({
    scene,
    onTextureCreated,
    accept = ".jpg, .png, .tga, .dds, .env, .exr",
    cubeOnly,
    title = "Upload texture",
}) => {
    TextureUpload.displayName = "TextureUpload";

    const handleUpload = useCallback(
        (files: FileList) => {
            const file = files[0];
            if (!file) return;

            ReadFile(
                file,
                (data) => {
                    const blob = new Blob([data], { type: "octet/stream" });
                    const url = URL.createObjectURL(blob);

                    const extension = file.name.split(".").pop()?.toLowerCase();
                    const texture = cubeOnly
                        ? new CubeTexture(url, scene, [], false, undefined, undefined, undefined, undefined, false, extension ? "." + extension : undefined)
                        : new Texture(url, scene, false, false);

                    onTextureCreated(texture);
                },
                undefined,
                true
            );
        },
        [scene, cubeOnly, onTextureCreated]
    );

    return <UploadButton onUpload={handleUpload} accept={accept} title={title} />;
};

/**
 * Props for TextureUpdateUpload - updates an existing texture's content
 */
type TextureUpdateUploadProps = {
    /**
     * The texture to update
     */
    texture: Nullable<BaseTexture>;
    /**
     * Callback when texture is updated
     */
    onTextureUpdated?: () => void;
    /**
     * File types to accept for upload
     */
    accept?: string;
    /**
     * Button title
     */
    title?: string;
};

/**
 * A button that uploads a file and updates an existing Texture or CubeTexture's content.
 * Only renders if the texture is updatable (Texture or CubeTexture instance).
 */
export const TextureUpdateUpload: FunctionComponent<TextureUpdateUploadProps> = ({
    texture,
    onTextureUpdated,
    accept = ".jpg, .png, .tga, .dds, .env, .exr",
    title = "Load texture from file",
}) => {
    TextureUpdateUpload.displayName = "TextureUpdateUpload";

    const isUpdatable = texture instanceof Texture || texture instanceof CubeTexture;

    const handleUpload = useCallback(
        (files: FileList) => {
            const file = files[0];
            if (!file || !texture) return;

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

    return <UploadButton onUpload={handleUpload} accept={accept} title={title} label={title} />;
};
