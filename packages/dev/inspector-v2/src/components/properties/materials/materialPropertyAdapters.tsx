import { type FunctionComponent } from "react";

import { type Color3 } from "core/Maths/math.color";

import { MaterialPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/materialPropertyLine";
import {
    CreateBooleanMaterialPropertyModel,
    CreateColor3MaterialPropertyModel,
    CreateNumberMaterialPropertyModel,
} from "shared-ui-components/fluent/hoc/propertyLines/materialPropertyAdapters";
import { type PrimitiveProps } from "shared-ui-components/fluent/primitives/primitive";
import { type PropertyLineProps } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";

type MaterialPropertyLineProps<ValueT> = PrimitiveProps<ValueT> & PropertyLineProps<ValueT>;

/**
 * Adapts a Babylon.js boolean property to the runtime-neutral material field model.
 * @param props The controlled Babylon.js property.
 * @returns The runtime-neutral field.
 */
export const BooleanMaterialPropertyLine: FunctionComponent<MaterialPropertyLineProps<boolean>> = (props) => {
    const { label, uniqueId, description, disabled, value, onChange } = props;
    return <MaterialPropertyLine model={CreateBooleanMaterialPropertyModel({ id: uniqueId ?? label, label, description, disabled, value, onChange })} />;
};

/**
 * Adapts a Babylon.js number property to the runtime-neutral material field model.
 * @param props The controlled Babylon.js property and numeric constraints.
 * @returns The runtime-neutral field.
 */
export const NumberMaterialPropertyLine: FunctionComponent<MaterialPropertyLineProps<number> & Readonly<{ min?: number; max?: number; step?: number; unit?: string }>> = (
    props
) => {
    const { label, uniqueId, description, disabled, value, onChange, min, max, step, unit } = props;
    return <MaterialPropertyLine model={CreateNumberMaterialPropertyModel({ id: uniqueId ?? label, label, description, disabled, value, onChange, min, max, step, unit })} />;
};

/**
 * Adapts a Babylon.js Color3 property to the runtime-neutral structural color model.
 * @param props The controlled Babylon.js color property.
 * @returns The runtime-neutral field.
 */
export const Color3MaterialPropertyLine: FunctionComponent<MaterialPropertyLineProps<Color3> & Readonly<{ isLinearMode?: boolean }>> = (props) => {
    const { label, uniqueId, description, disabled, value, onChange, isLinearMode } = props;
    return (
        <MaterialPropertyLine
            model={CreateColor3MaterialPropertyModel({
                id: uniqueId ?? label,
                label,
                description,
                disabled,
                value,
                onChange,
                linear: isLinearMode,
            })}
        />
    );
};
