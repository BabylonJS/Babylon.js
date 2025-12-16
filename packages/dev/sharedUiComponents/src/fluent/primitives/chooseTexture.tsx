import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { FunctionComponent } from "react";
import type { PrimitiveProps } from "./primitive";

import { makeStyles, tokens } from "@fluentui/react-components";
import { useMemo } from "react";
import { TextureUpload } from "../hoc/textureUpload";
import { ComboBox } from "./comboBox";

const useStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
    },
});

export type ChooseTextureProps = PrimitiveProps<Nullable<BaseTexture>> & {
    /**
     * The scene to get textures from
     */
    scene: Scene;
    /**
     * File types to accept for upload
     */
    accept?: string;
    /**
     * Whether to only allow cube textures
     */
    cubeOnly?: boolean;
};

/**
 * A primitive component with a ComboBox for selecting from existing scene textures
 * and a button for uploading new texture files.
 * @param props ChooseTextureProps
 * @returns ChooseTexture component
 */
export const ChooseTexture: FunctionComponent<ChooseTextureProps> = (props) => {
    ChooseTexture.displayName = "ChooseTexture";
    const { scene, cubeOnly, value, onChange } = props;
    const classes = useStyles();

    // Get sorted texture names from scene
    const textureOptions = useMemo(() => {
        return scene.textures
            .filter((t) => t.name && (!cubeOnly || t.isCube))
            .sort((a, b) => (a.displayName || a.name).localeCompare(b.displayName || b.name))
            .map((t) => t.displayName || t.name);
    }, [scene.textures, cubeOnly]);

    // Map texture names to textures for lookup
    const textureMap = useMemo(() => {
        const map = new Map<string, BaseTexture>();
        scene.textures.forEach((t) => {
            if (t.name) {
                map.set(t.displayName || t.name, t);
            }
        });
        return map;
    }, [scene.textures]);

    const handleTextureSelect = (textureName: string) => {
        const texture = textureMap.get(textureName);
        onChange(texture ?? null);
    };

    // Get current texture name for initial display
    const currentTextureName = value ? value.displayName || value.name : "";

    return (
        <div className={classes.container}>
            <ComboBox label="" options={textureOptions} value={currentTextureName} onChange={handleTextureSelect} />
            <TextureUpload scene={scene} onChange={onChange} cubeOnly={cubeOnly} />
        </div>
    );
};
