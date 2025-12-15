import type { FunctionComponent } from "react";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Nullable } from "core/types";
import { PropertyLine, PropertyLineProps } from "./propertyLine";
import { ChooseTexture, ChooseTextureProps } from "../../primitives/chooseTexture";

type ChooseTexturePropertyLineProps = PropertyLineProps<Nullable<BaseTexture>> & ChooseTextureProps;

/**
 * A property line with a ComboBox for selecting from existing scene textures
 * and a button for uploading new texture files.
 */
export const ChooseTexturePropertyLine: FunctionComponent<ChooseTexturePropertyLineProps> = (props) => {
    ChooseTexturePropertyLine.displayName = "ChooseTexturePropertyLine";

    return (
        <PropertyLine {...props}>
            <ChooseTexture {...props} />
        </PropertyLine>
    );
};
