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
     * Callback when a texture is uploaded/created or updated
     */
    onChange: (texture: Nullable<BaseTexture>) => void;
    /**
     * Optional existing texture to update instead of creating a new one
     */
    texture?: Nullable<BaseTexture>;
    /**
     * File types to accept for upload
     */
    accept?: string;
    /**
     * Whether to create cube textures (only applies when creating new textures)
     */
    cubeOnly?: boolean;
    /**
     * Button title
     */
    title?: string;
};

/**
 * A button that uploads a file and either:
 * - Creates a new Texture or CubeTexture (if no texture prop is provided)
 * - Updates an existing Texture or CubeTexture via updateURL (if texture prop is provided)
 */
export const TextureUpload: FunctionComponent<TextureUploadProps> = (props) => {
    TextureUpload.displayName = "TextureUpload";
    const { scene, onChange, texture, accept = ".jpg, .png, .tga, .dds, .env, .exr", cubeOnly, title = "Upload Texture" } = props;
    const handleUpload = useCallback(
        (files: FileList) => {
            const file = files[0];
            if (!file) return;

            ReadFile(
                file,
                (data) => {
                    const blob = new Blob([data], { type: "octet/stream" });

                    // If texture is provided, update it
                    if (texture && (texture instanceof Texture || texture instanceof CubeTexture)) {
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
                                texture.updateURL(base64data, extension, () => onChange(texture));
                            } else if (texture instanceof Texture) {
                                texture.updateURL(base64data, null, () => onChange(texture));
                            }
                        };
                    } else {
                        // Create new texture
                        const url = URL.createObjectURL(blob);
                        const extension = file.name.split(".").pop()?.toLowerCase();
                        const newTexture = cubeOnly
                            ? new CubeTexture(url, scene, [], false, undefined, undefined, undefined, undefined, false, extension ? "." + extension : undefined)
                            : new Texture(url, scene, false, false);

                        onChange(newTexture);
                    }
                },
                undefined,
                true
            );
        },
        [scene, texture, cubeOnly, onChange]
    );

    return <UploadButton onUpload={handleUpload} accept={accept} title={title} />;
};
