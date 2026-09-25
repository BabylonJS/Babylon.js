import { type MaterialPropertyModel } from "shared-ui-components/fluent/hoc/propertyLines/materialPropertyLine";
import { CreateColor3MaterialPropertyModel as CreateColorModel, type MaterialFieldProps } from "shared-ui-components/fluent/hoc/propertyLines/materialPropertyAdaptersCore";

export { CreateBooleanMaterialPropertyModel, CreateNumberMaterialPropertyModel } from "shared-ui-components/fluent/hoc/propertyLines/materialPropertyAdaptersCore";

/**
 * Adapt a Lite color tuple to the runtime-neutral material model.
 * @param props The controlled Lite color.
 * @returns The material field model.
 */
export function CreateColor3MaterialPropertyModel(props: MaterialFieldProps<readonly [number, number, number]> & Readonly<{ linear?: boolean }>): MaterialPropertyModel {
    return CreateColorModel(
        props,
        (value) => ({ r: value[0], g: value[1], b: value[2] }),
        (color): readonly [number, number, number] => [color.r, color.g, color.b]
    );
}
