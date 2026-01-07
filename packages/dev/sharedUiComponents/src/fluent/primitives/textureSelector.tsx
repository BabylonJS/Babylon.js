import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { FunctionComponent } from "react";
import type { PrimitiveProps } from "./primitive";
import type { EntitySelectorProps } from "./entitySelector";

import { makeStyles, tokens } from "@fluentui/react-components";
import { useCallback } from "react";
import { TextureUpload } from "../hoc/textureUpload";
import { EntitySelector } from "./entitySelector";

const useStyles = makeStyles({
    container: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: tokens.spacingHorizontalS,
    },
});

export type TextureSelectorProps = PrimitiveProps<Nullable<BaseTexture>> & {
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
} & Omit<EntitySelectorProps<BaseTexture>, "getEntities" | "getName">;

/**
 * A primitive component with a ComboBox for selecting from existing scene textures
 * and a button for uploading new texture files.
 * @param props TextureSelectorProps
 * @returns TextureSelector component
 */
export const TextureSelector: FunctionComponent<TextureSelectorProps> = (props) => {
    TextureSelector.displayName = "TextureSelector";
    const { scene, cubeOnly, value, onChange, onLink, defaultValue } = props;
    const classes = useStyles();

    const getTextures = useCallback(() => scene.textures, [scene.textures]);
    const getName = useCallback((texture: BaseTexture) => texture.displayName || texture.name || `${texture.getClassName() || "Unnamed Texture"} (${texture.uniqueId})`, []);
    const filter = useCallback((texture: BaseTexture) => !cubeOnly || texture.isCube, [cubeOnly]);

    return (
        <div className={classes.container}>
            <EntitySelector value={value} onChange={onChange} onLink={onLink} defaultValue={defaultValue} getEntities={getTextures} getName={getName} filter={filter} />
            {!value && <TextureUpload scene={scene} onChange={onChange} cubeOnly={cubeOnly} />}
        </div>
    );
};
