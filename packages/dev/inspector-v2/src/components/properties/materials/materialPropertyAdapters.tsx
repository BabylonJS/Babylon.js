import { type FunctionComponent } from "react";

import { Color3 } from "core/Maths/math.color";

import { MaterialPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/materialPropertyLine";
import { type PrimitiveProps } from "shared-ui-components/fluent/primitives/primitive";
import { type PropertyLineProps } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";

type BabylonMaterialPropertyLineProps<ValueT> = PrimitiveProps<ValueT> & PropertyLineProps<ValueT>;

/**
 * Adapts a Babylon.js boolean property to the runtime-neutral material field model.
 * @param props The controlled Babylon.js property.
 * @returns The runtime-neutral field.
 */
export const BabylonBooleanMaterialPropertyLine: FunctionComponent<BabylonMaterialPropertyLineProps<boolean>> = (props) => {
    const { label, uniqueId, description, disabled, value, onChange } = props;
    return <MaterialPropertyLine model={{ kind: "boolean", id: uniqueId ?? label, label, description, disabled, value, onChange }} />;
};

/**
 * Adapts a Babylon.js number property to the runtime-neutral material field model.
 * @param props The controlled Babylon.js property and numeric constraints.
 * @returns The runtime-neutral field.
 */
export const BabylonNumberMaterialPropertyLine: FunctionComponent<
    BabylonMaterialPropertyLineProps<number> & Readonly<{ min?: number; max?: number; step?: number; unit?: string }>
> = (props) => {
    const { label, uniqueId, description, disabled, value, onChange, min, max, step, unit } = props;
    return <MaterialPropertyLine model={{ kind: "number", id: uniqueId ?? label, label, description, disabled, value, onChange, min, max, step, unit }} />;
};

/**
 * Adapts a Babylon.js Color3 property to the runtime-neutral structural color model.
 * @param props The controlled Babylon.js color property.
 * @returns The runtime-neutral field.
 */
export const BabylonColor3MaterialPropertyLine: FunctionComponent<BabylonMaterialPropertyLineProps<Color3> & Readonly<{ isLinearMode?: boolean }>> = (props) => {
    const { label, uniqueId, description, disabled, value, onChange, isLinearMode } = props;
    return (
        <MaterialPropertyLine
            model={{
                kind: "color",
                id: uniqueId ?? label,
                label,
                description,
                disabled,
                value: { r: value.r, g: value.g, b: value.b },
                onChange: (color) => onChange(new Color3(color.r, color.g, color.b)),
                linear: isLinearMode,
            }}
        />
    );
};
