import { Color3 } from "core/Maths/math.color";

import { type MaterialPropertyModel } from "./materialPropertyLine";
import { CreateColor3MaterialPropertyModel as CreateColorModel, type MaterialFieldProps } from "./materialPropertyAdaptersCore";

export { CreateBooleanMaterialPropertyModel, CreateNumberMaterialPropertyModel } from "./materialPropertyAdaptersCore";

/**
 * Adapt a Babylon.js Color3 field to the runtime-neutral material model.
 * @param props The controlled Babylon.js color.
 * @returns The material field model.
 */
export function CreateColor3MaterialPropertyModel(props: MaterialFieldProps<Color3> & Readonly<{ linear?: boolean }>): MaterialPropertyModel {
    return CreateColorModel(
        props,
        (value) => ({ r: value.r, g: value.g, b: value.b }),
        (color) => new Color3(color.r, color.g, color.b)
    );
}
