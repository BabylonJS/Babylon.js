import { type ComponentType, type FunctionComponent } from "react";

import { type DropdownOption } from "../../primitives/dropdown";
import { type PrimitiveProps } from "../../primitives/primitive";
import { type StructuralColor, type StructuralColorAdapter, StructuralColorPickerPopup } from "../../primitives/structuralColorPicker";
import { NumberDropdownPropertyLine, StringDropdownPropertyLine } from "./dropdownPropertyLine";
import { NumberInputPropertyLine, TextInputPropertyLine } from "./inputPropertyLine";
import { SwitchPropertyLine } from "./switchPropertyLine";
import { TextPropertyLine } from "./textPropertyLine";
import { ControlledTensorPropertyLine, type TensorValue2, type TensorValue3, type TensorValue4, type TensorValueAdapter } from "./vectorPropertyLineCore";
import { ControlledColorPropertyLine, type ColorPropertyLineAdapter } from "./colorPropertyLineCore";

type MaterialPropertyBase = Readonly<{
    id: string;
    label: string;
    description?: string;
    disabled?: boolean;
    error?: string;
}>;

type EditableMaterialProperty<ValueT> = MaterialPropertyBase &
    Readonly<{
        value: ValueT;
        onChange: (value: ValueT) => void;
    }>;

/** A runtime-neutral model for a controlled material property. */
export type MaterialPropertyModel =
    | (EditableMaterialProperty<boolean> & Readonly<{ kind: "boolean" }>)
    | (EditableMaterialProperty<string> & Readonly<{ kind: "string" }>)
    | (EditableMaterialProperty<number> & Readonly<{ kind: "number"; min?: number; max?: number; step?: number; unit?: string }>)
    | (EditableMaterialProperty<number> & Readonly<{ kind: "number-options"; options: readonly DropdownOption<number>[] }>)
    | (EditableMaterialProperty<string> & Readonly<{ kind: "string-options"; options: readonly DropdownOption<string>[] }>)
    | (EditableMaterialProperty<TensorValue2> & Readonly<{ kind: "vector2"; min?: number; max?: number; step?: number }>)
    | (EditableMaterialProperty<TensorValue3> & Readonly<{ kind: "vector3"; min?: number; max?: number; step?: number }>)
    | (EditableMaterialProperty<TensorValue4> & Readonly<{ kind: "vector4"; min?: number; max?: number; step?: number }>)
    | (EditableMaterialProperty<StructuralColor> & Readonly<{ kind: "color"; linear?: boolean }>)
    | (MaterialPropertyBase & Readonly<{ kind: "readonly"; value: string }>);

/** A runtime-neutral model for a material property section. */
export type MaterialPropertySectionModel = Readonly<{
    fields: readonly MaterialPropertyModel[];
    error?: string;
}>;

const Vector2Adapter: TensorValueAdapter<TensorValue2> = {
    components: ["x", "y"],
    getComponent: (value, component) => value[component as keyof TensorValue2],
    withComponent: (value, component, componentValue) => ({ ...value, [component]: componentValue }),
};
const Vector3Adapter: TensorValueAdapter<TensorValue3> = {
    components: ["x", "y", "z"],
    getComponent: (value, component) => value[component as keyof TensorValue3],
    withComponent: (value, component, componentValue) => ({ ...value, [component]: componentValue }),
};
const Vector4Adapter: TensorValueAdapter<TensorValue4> = {
    components: ["x", "y", "z", "w"],
    getComponent: (value, component) => value[component],
    withComponent: (value, component, componentValue) => ({ ...value, [component]: componentValue }),
};

const StructuralColorValueAdapter: StructuralColorAdapter<StructuralColor> = {
    getColor: (value) => value,
    createColor: (color) => color,
};
const StructuralColorPicker: ComponentType<PrimitiveProps<StructuralColor> & { isLinearMode?: boolean }> = (props) => (
    <StructuralColorPickerPopup {...props} adapter={StructuralColorValueAdapter} />
);
const StructuralColorAdapter: ColorPropertyLineAdapter<StructuralColor> = {
    ...StructuralColorValueAdapter,
    picker: StructuralColorPicker,
};

/**
 * Renders one controlled material field without depending on a rendering runtime.
 * @param props The field model.
 * @returns The matching property-line control.
 */
export const MaterialPropertyLine: FunctionComponent<{ model: MaterialPropertyModel }> = (props) => {
    const { model } = props;
    const common = {
        label: model.label,
        uniqueId: model.id,
        description: model.error ? `${model.description ? `${model.description} ` : ""}Error: ${model.error}` : model.description,
        disabled: model.disabled,
    };

    switch (model.kind) {
        case "boolean":
            return <SwitchPropertyLine {...common} value={model.value} onChange={model.onChange} />;
        case "string":
            return <TextInputPropertyLine {...common} value={model.value} onChange={model.onChange} />;
        case "number":
            return <NumberInputPropertyLine {...common} value={model.value} onChange={model.onChange} min={model.min} max={model.max} step={model.step} unit={model.unit} />;
        case "number-options":
            return <NumberDropdownPropertyLine {...common} value={model.value} onChange={model.onChange} options={[...model.options]} />;
        case "string-options":
            return <StringDropdownPropertyLine {...common} value={model.value} onChange={model.onChange} options={[...model.options]} />;
        case "vector2":
            return (
                <ControlledTensorPropertyLine
                    {...common}
                    value={model.value}
                    onChange={model.onChange}
                    adapter={Vector2Adapter}
                    min={model.min}
                    max={model.max}
                    step={model.step}
                />
            );
        case "vector3":
            return (
                <ControlledTensorPropertyLine
                    {...common}
                    value={model.value}
                    onChange={model.onChange}
                    adapter={Vector3Adapter}
                    min={model.min}
                    max={model.max}
                    step={model.step}
                />
            );
        case "vector4":
            return (
                <ControlledTensorPropertyLine
                    {...common}
                    value={model.value}
                    onChange={model.onChange}
                    adapter={Vector4Adapter}
                    min={model.min}
                    max={model.max}
                    step={model.step}
                />
            );
        case "color":
            return <ControlledColorPropertyLine {...common} value={model.value} onChange={model.onChange} adapter={StructuralColorAdapter} isLinearMode={model.linear} />;
        case "readonly":
            return <TextPropertyLine {...common} value={model.value} />;
    }
};

/**
 * Renders an immutable material-section snapshot as controlled property lines.
 * @param props The section model.
 * @returns The material section content.
 */
export const MaterialPropertySection: FunctionComponent<{ model: MaterialPropertySectionModel }> = (props) => {
    const { model } = props;

    return (
        <div role={model.error ? "alert" : undefined}>
            {model.error ? <TextPropertyLine label="Error" value={model.error} /> : undefined}
            {model.fields.map((field) => (
                <MaterialPropertyLine key={field.id} model={field} />
            ))}
        </div>
    );
};
