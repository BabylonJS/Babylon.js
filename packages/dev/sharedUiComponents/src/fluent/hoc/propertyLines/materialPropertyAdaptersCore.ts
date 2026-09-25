import { type StructuralColor } from "../../primitives/structuralColorPicker";
import { type MaterialPropertyModel } from "./materialPropertyLine";

/** Controlled input shared by runtime-specific material field adapters. */
export type MaterialFieldProps<ValueT> = Readonly<{
    id: string;
    label: string;
    description?: string;
    disabled?: boolean;
    pending?: boolean;
    error?: string;
    value: ValueT;
    onChange: (value: ValueT) => void;
}>;

/**
 * Build a runtime-neutral boolean field.
 * @param props The controlled field.
 * @returns The material field model.
 */
export function CreateBooleanMaterialPropertyModel(props: MaterialFieldProps<boolean>): MaterialPropertyModel {
    return { ...props, kind: "boolean" };
}

/**
 * Build a runtime-neutral number field.
 * @param props The controlled field and numeric limits.
 * @returns The material field model.
 */
export function CreateNumberMaterialPropertyModel(
    props: MaterialFieldProps<number> & Readonly<{ min?: number; max?: number; step?: number; unit?: string }>
): MaterialPropertyModel {
    return { ...props, kind: "number" };
}

/**
 * Build a runtime-neutral color field with a runtime-owned value adapter.
 * @param props The controlled color field.
 * @param getColor Converts the runtime value to structural color.
 * @param createValue Converts an edited color back to the runtime value.
 * @returns The material field model.
 */
export function CreateColor3MaterialPropertyModel<ValueT>(
    props: MaterialFieldProps<ValueT> & Readonly<{ linear?: boolean }>,
    getColor: (value: ValueT) => StructuralColor,
    createValue: (color: StructuralColor) => ValueT
): MaterialPropertyModel {
    const { value, onChange, ...rest } = props;
    return { ...rest, kind: "color", value: getColor(value), onChange: (color) => onChange(createValue(color)) };
}
