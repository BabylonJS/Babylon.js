import type { FunctionComponent } from "react";
import { useMemo } from "react";
import { makeStyles, tokens } from "@fluentui/react-components";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Scene } from "core/scene";
import { PropertyLine, PropertyLineProps } from "./propertyLine";
import type { PrimitiveProps } from "../../primitives/primitive";
import { ComboBox } from "../../primitives/comboBox";
import { TextureUpload } from "../textureUpload";
import { Nullable } from "core/types";

const useStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
    },
});

type ChooseTexturePropertyLineProps = PropertyLineProps<Nullable<BaseTexture>> &
    PrimitiveProps<Nullable<BaseTexture>> & {
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
 * A property line with a ComboBox for selecting from existing scene textures
 * and a button for uploading new texture files.
 */
export const ChooseTexturePropertyLine: FunctionComponent<ChooseTexturePropertyLineProps> = (props) => {
    ChooseTexturePropertyLine.displayName = "ChooseTexturePropertyLine";
    const { scene, accept = ".jpg, .png, .tga, .dds, .env, .exr", cubeOnly, onChange } = props;
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
    const currentTextureName = props.value ? props.value.displayName || props.value.name : "";

    return (
        <PropertyLine label={props.label} description={props.description}>
            <div className={classes.container}>
                <ComboBox label="" options={textureOptions} value={currentTextureName} onChange={handleTextureSelect} />
                <TextureUpload scene={scene} onTextureCreated={onChange} accept={accept} cubeOnly={cubeOnly} />
            </div>
        </PropertyLine>
    );
};
