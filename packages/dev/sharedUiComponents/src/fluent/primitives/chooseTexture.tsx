import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { FunctionComponent } from "react";
import type { PrimitiveProps } from "./primitive";

import { makeStyles, tokens } from "@fluentui/react-components";
import { useCallback } from "react";
import { TextureUpload } from "../hoc/textureUpload";
import { ChooseEntity } from "./chooseEntity";

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

    const getTextures = useCallback(() => scene.textures, [scene.textures]);
    const getName = useCallback((texture: BaseTexture) => texture.displayName || texture.name, []);
    const filter = useCallback((texture: BaseTexture) => !cubeOnly || texture.isCube, [cubeOnly]);

    return (
        <div className={classes.container}>
            <ChooseEntity value={value} onChange={onChange} getEntities={getTextures} getName={getName} filter={filter} />
            <TextureUpload scene={scene} onChange={onChange} cubeOnly={cubeOnly} />
        </div>
    );
};
