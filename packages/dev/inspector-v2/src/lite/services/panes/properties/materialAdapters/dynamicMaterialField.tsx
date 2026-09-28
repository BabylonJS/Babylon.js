import { Body1 } from "@fluentui/react-components";
import { type FunctionComponent, useCallback, useEffect, useState } from "react";

import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/propertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { Vector2PropertyLine, Vector3PropertyLine, Vector4PropertyLine } from "shared-ui-components/lite/fluent/hoc/propertyLines/vectorPropertyLine";

import { ComputedProperty, DerivedProperty } from "../../../../../components/properties/boundProperty";
import { useWatchedValue } from "../../../../../contexts/watcherContext";

export type DynamicFieldType = "number" | "vec2" | "vec3" | "vec4" | "mat4";
export type DynamicFieldValue = number | readonly number[];

type DynamicFieldProps = Readonly<{
    target: object;
    id: string;
    label: string;
    type: DynamicFieldType;
    read: () => DynamicFieldValue | undefined;
    write: (value: DynamicFieldValue) => void;
    unavailable: string;
    pending?: boolean;
    error?: string;
    integer?: boolean;
    min?: number;
    max?: number;
}>;

type MatrixValue = readonly [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];

const MatrixField: FunctionComponent<{
    label: string;
    uniqueId: string;
    description?: string;
    disabled?: boolean;
    value: MatrixValue;
    onChange: (value: MatrixValue) => void;
}> = (props) => {
    const { label, uniqueId, description, disabled, value, onChange } = props;
    const [draft, setDraft] = useState(value);
    useEffect(() => setDraft(value), [value]);
    return (
        <PropertyLine
            label={label}
            uniqueId={uniqueId}
            description={description}
            expandedContent={
                <>
                    {draft.map((component, index) => (
                        <NumberInputPropertyLine
                            key={index}
                            label={`M${Math.floor(index / 4)}${index % 4}`}
                            value={component}
                            disabled={disabled}
                            onChange={(nextValue) => {
                                const next = [...draft] as [...MatrixValue];
                                next[index] = nextValue;
                                setDraft(next);
                                onChange(next);
                            }}
                        />
                    ))}
                </>
            }
        >
            <Body1>[4 × 4]</Body1>
        </PropertyLine>
    );
};

/**
 * Displays a discovered scalar, vector, or matrix input with a guarded write callback.
 * @param props The runtime value reader, writer, constraints, and row status.
 * @returns An editable property line or an unavailable read-only fallback.
 */
export const DynamicMaterialField: FunctionComponent<DynamicFieldProps> = (props) => {
    const { target, id, label, type, read, write, unavailable, pending, error, integer, min, max } = props;
    const getValue = useCallback(() => {
        try {
            return read();
        } catch {
            return undefined;
        }
    }, [read]);
    const value = useWatchedValue(target, getValue);
    const common = { label, uniqueId: id, disabled: pending, description: error ? `Error: ${error}` : undefined };
    let control: React.ReactNode;
    if (value === undefined) {
        control = <ComputedProperty component={TextPropertyLine} target={target} getValue={() => `Unavailable: ${unavailable}`} label={label} uniqueId={id} />;
    } else {
        switch (type) {
            case "number":
                control = (
                    <DerivedProperty
                        component={NumberInputPropertyLine}
                        target={target}
                        getValue={getValue as () => number}
                        setValue={(_target, next) => write(next)}
                        {...common}
                        min={min}
                        max={max}
                        step={integer ? 1 : undefined}
                        forceInt={integer}
                    />
                );
                break;
            case "vec2":
                control = (
                    <DerivedProperty
                        component={Vector2PropertyLine}
                        target={target}
                        getValue={getValue as () => readonly [number, number]}
                        setValue={(_target, next) => write("x" in next ? [next.x, next.y] : next)}
                        {...common}
                    />
                );
                break;
            case "vec3":
                control = (
                    <DerivedProperty
                        component={Vector3PropertyLine}
                        target={target}
                        getValue={getValue as () => readonly [number, number, number]}
                        setValue={(_target, next) => write("x" in next ? [next.x, next.y, next.z] : next)}
                        {...common}
                    />
                );
                break;
            case "vec4":
                control = (
                    <DerivedProperty
                        component={Vector4PropertyLine}
                        target={target}
                        getValue={getValue as () => readonly [number, number, number, number]}
                        setValue={(_target, next) => write("x" in next ? [next.x, next.y, next.z, next.w] : next)}
                        {...common}
                    />
                );
                break;
            case "mat4":
                control = (
                    <DerivedProperty component={MatrixField} target={target} getValue={getValue as () => MatrixValue} setValue={(_target, next) => write(next)} {...common} />
                );
                break;
        }
    }
    return (
        <div aria-busy={pending}>
            {control}
            {pending ? <Body1 role="status">{`Applying ${label}…`}</Body1> : undefined}
            {error ? <Body1 role="alert">{error}</Body1> : undefined}
        </div>
    );
};

/**
 * Validates a discovered numeric input before sending it to the Lite setter.
 * @param id The property row identifier.
 * @param value The proposed scalar or tuple.
 * @param length The expected tuple length, or one for a scalar.
 * @param integer Whether the scalar must be an integer.
 * @param min The optional scalar lower bound.
 * @param max The optional scalar upper bound.
 * @returns A detached scalar or array suitable for the Lite setter.
 */
export function ValidateDynamicValue(id: string, value: DynamicFieldValue, length: number, integer = false, min?: number, max?: number): number | number[] {
    if (length === 1) {
        if (typeof value !== "number" || !Number.isFinite(value)) {
            throw new TypeError(`Property "${id}" requires a finite number.`);
        }
        if (integer && !Number.isInteger(value)) {
            throw new TypeError(`Property "${id}" requires an integer.`);
        }
        if (min !== undefined && value < min) {
            throw new RangeError(`Property "${id}" must be at least ${min}.`);
        }
        if (max !== undefined && value > max) {
            throw new RangeError(`Property "${id}" must be at most ${max}.`);
        }
        return value;
    }
    if (!Array.isArray(value) || value.length !== length) {
        throw new TypeError(`Property "${id}" requires a ${length}-component tuple.`);
    }
    if (value.some((component) => typeof component !== "number" || !Number.isFinite(component))) {
        throw new TypeError(`Property "${id}" requires finite tuple components.`);
    }
    return [...value];
}
