import type { FunctionComponent } from "react";
import { useCallback } from "react";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Scene } from "core/scene";
import { Texture } from "core/Materials/Textures/texture";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { ReadFile } from "core/Misc/fileTools";
import { UploadButton } from "../primitives/uploadButton";

type TextureUploadUpdateProps = {
    /**
     * Existing texture to update via updateURL
     */
    texture: BaseTexture;
    /**
     * Callback after texture is updated
     */
    onChange?: (texture: BaseTexture) => void;
    scene?: never;
    cubeOnly?: never;
};

type TextureUploadCreateProps = {
    /**
     * The scene to create the texture in
     */
    scene: Scene;
    /**
     * Callback when a new texture is created
     */
    onChange: (texture: BaseTexture) => void;
    /**
     * Whether to create cube textures
     */
    cubeOnly?: boolean;
    texture?: never;
};

type TextureUploadProps = TextureUploadUpdateProps | TextureUploadCreateProps;

/**
 * A button that uploads a file and either:
 * - Updates an existing Texture or CubeTexture via updateURL (if texture prop is provided)
 * - Creates a new Texture or CubeTexture (if scene/onChange props are provided)
 * @param props TextureUploadProps
 * @returns UploadButton component that handles texture upload
 */
export const TextureUpload: FunctionComponent<TextureUploadProps> = (props) => {
    TextureUpload.displayName = "TextureUpload";
    const label = props.texture ? "Upload Texture" : undefined;
    // TODO: This should probably be dynamically fetching a list of supported texture extensions
    const accept = ".jpg, .png, .tga, .dds, .env, .exr";
    const handleUpload = useCallback(
        (files: FileList) => {
            const file = files[0];
            if (!file) {
                return;
            }

            ReadFile(
                file,
                (data) => {
                    const blob = new Blob([data], { type: "octet/stream" });

                    // Update existing texture
                    if (props.texture) {
                        const { texture, onChange } = props;
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
                                texture.updateURL(base64data, extension, () => onChange?.(texture));
                            } else if (texture instanceof Texture) {
                                texture.updateURL(base64data, null, () => onChange?.(texture));
                            }
                        };
                    } else {
                        // Create new texture
                        const { scene, cubeOnly, onChange } = props;
                        const url = URL.createObjectURL(blob);
                        const extension = file.name.split(".").pop()?.toLowerCase();

                        // Revoke the object URL after texture loads to prevent memory leak
                        const revokeUrl = () => URL.revokeObjectURL(url);

                        const newTexture = cubeOnly
                            ? new CubeTexture(url, scene, [], false, undefined, revokeUrl, undefined, undefined, false, extension ? "." + extension : undefined)
                            : new Texture(url, scene, false, false, undefined, revokeUrl);

                        onChange(newTexture);
                    }
                },
                undefined,
                true
            );
        },
        [props]
    );

    return <UploadButton onUpload={handleUpload} accept={accept} title={"Upload Texture"} label={label} />;
};
