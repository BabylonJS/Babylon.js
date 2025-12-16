import type { FunctionComponent } from "react";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Nullable } from "core/types";
import type { PropertyLineProps } from "./propertyLine";
import type { ChooseTextureProps } from "../../primitives/chooseTexture";

import { PropertyLine } from "./propertyLine";
import { ChooseTexture } from "../../primitives/chooseTexture";

type ChooseTexturePropertyLineProps = PropertyLineProps<Nullable<BaseTexture>> & ChooseTextureProps;

/**
 * A property line with a ComboBox for selecting from existing scene textures
 * and a button for uploading new texture files.
 * @param props - ChooseTextureProps & PropertyLineProps
 * @returns property-line wrapped ChooseTexture component
 */
export const ChooseTexturePropertyLine: FunctionComponent<ChooseTexturePropertyLineProps> = (props) => {
    ChooseTexturePropertyLine.displayName = "ChooseTexturePropertyLine";

    return (
        <PropertyLine {...props}>
            <ChooseTexture {...props} />
        </PropertyLine>
    );
};
