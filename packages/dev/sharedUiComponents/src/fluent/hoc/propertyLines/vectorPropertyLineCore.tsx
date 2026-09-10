import { Body1 } from "@fluentui/react-components";
import { useEffect, useState } from "react";

import { type PrimitiveProps } from "../../primitives/primitive";
import { CalculatePrecision } from "../../primitives/utils";
import { NumberInputPropertyLine } from "./inputPropertyLine";
import { type PropertyLineProps, PropertyLine } from "./propertyLine";
import { TextPropertyLine } from "./textPropertyLine";

export type TensorComponent = "x" | "y" | "z" | "w";

export type TensorValue2 = Readonly<{ x: number; y: number }>;
export type TensorValue3 = TensorValue2 & Readonly<{ z: number }>;
export type TensorValue4 = TensorValue3 & Readonly<{ w: number }>;

export type TensorPropertyLineProps<ValueT> = PropertyLineProps<ValueT> &
    PrimitiveProps<ValueT> & {
        min?: number;
        max?: number;
        unit?: string;
        step?: number;
        precision?: number;
        valueConverter?: {
            from: (value: number) => number;
            to: (value: number) => number;
        };
    };

export type TensorValueAdapter<ValueT> = Readonly<{
    components: readonly TensorComponent[];
    getComponent: (value: ValueT, component: TensorComponent) => number;
    withComponent: (value: ValueT, component: TensorComponent, componentValue: number) => ValueT;
}>;

type ControlledTensorPropertyLineProps<ValueT> = TensorPropertyLineProps<ValueT> &
    Readonly<{
        adapter: TensorValueAdapter<ValueT>;
    }>;

/**
 * Runtime-neutral controlled editor for two-, three-, and four-component numeric values.
 * @param props The value, change callback, component adapter, and property-line presentation.
 * @returns The tensor property line.
 */
export const ControlledTensorPropertyLine = <ValueT,>(props: ControlledTensorPropertyLineProps<ValueT>) => {
    const { adapter, min, max, unit, step, precision, valueConverter } = props;
    const converted = (value: number) => (valueConverter ? valueConverter.from(value) : value);
    const formatted = (value: number) => converted(value).toFixed(step !== undefined ? Math.max(0, CalculatePrecision(step)) : 2);
    const [value, setValue] = useState(props.value);

    useEffect(() => {
        setValue(props.value);
    }, [props.value, props.expandedContent]);

    const onComponentChange = (componentValue: number, component: TensorComponent) => {
        const storedValue = valueConverter ? valueConverter.to(componentValue) : componentValue;
        const newValue = adapter.withComponent(value, component, storedValue);
        setValue(newValue);
        props.onChange(newValue);
    };

    const summary = adapter.components.map((component) => formatted(adapter.getComponent(props.value, component))).join(", ");

    return (
        <PropertyLine
            {...props}
            expandedContent={
                <>
                    {props.expandedContent}
                    <TensorSliders
                        value={value}
                        adapter={adapter}
                        min={min}
                        max={max}
                        unit={unit}
                        step={step}
                        precision={precision}
                        converted={converted}
                        onChange={onComponentChange}
                    />
                </>
            }
        >
            <Body1>{`[${summary}]`}</Body1>
        </PropertyLine>
    );
};

type TensorSlidersProps<ValueT> = Readonly<{
    value: ValueT;
    adapter: TensorValueAdapter<ValueT>;
    min?: number;
    max?: number;
    unit?: string;
    step?: number;
    precision?: number;
    converted: (value: number) => number;
    onChange: (value: number, component: TensorComponent) => void;
}>;

const TensorSliders = <ValueT,>(props: TensorSlidersProps<ValueT>) => {
    const { value, adapter, min, max, unit, step, precision, converted, onChange } = props;

    return (
        <>
            {adapter.components.map((component) => (
                <NumberInputPropertyLine
                    key={component}
                    label={component.toUpperCase()}
                    value={converted(adapter.getComponent(value, component))}
                    min={min}
                    max={max}
                    onChange={(componentValue) => onChange(componentValue, component)}
                    unit={unit}
                    step={step}
                    precision={precision}
                />
            ))}
        </>
    );
};

export const RadiansToDegreesConverter = {
    from: (value: number) => (value * 180) / Math.PI,
    to: (value: number) => (value * Math.PI) / 180,
};

type ControlledRotationVectorPropertyLineProps<ValueT> = TensorPropertyLineProps<ValueT> &
    Readonly<{
        adapter: TensorValueAdapter<ValueT>;
        useDegrees?: boolean;
    }>;

/**
 * Runtime-neutral controlled Euler rotation editor.
 * @param props The rotation value, runtime adapter, and display options.
 * @returns The rotation property line.
 */
export const ControlledRotationVectorPropertyLine = <ValueT,>(props: ControlledRotationVectorPropertyLineProps<ValueT>) => {
    const { useDegrees, ...rest } = props;

    return (
        <ControlledTensorPropertyLine
            {...rest}
            unit={useDegrees ? "°" : "rad"}
            valueConverter={useDegrees ? RadiansToDegreesConverter : undefined}
            step={useDegrees ? 1 : 0.01}
            precision={useDegrees ? 1 : 2}
        />
    );
};

export type QuaternionValueAdapter<QuaternionT, EulerT> = Readonly<{
    quaternion: TensorValueAdapter<QuaternionT>;
    euler: TensorValueAdapter<EulerT>;
    fromEuler: (value: EulerT, source: QuaternionT) => QuaternionT;
    toEuler: (value: QuaternionT) => EulerT;
}>;

type ControlledQuaternionPropertyLineProps<QuaternionT, EulerT> = TensorPropertyLineProps<QuaternionT> &
    Readonly<{
        adapter: QuaternionValueAdapter<QuaternionT, EulerT>;
        useDegrees?: boolean;
        useEuler?: boolean;
    }>;

/**
 * Runtime-neutral controlled quaternion editor with optional Euler presentation.
 * @param props The quaternion value, runtime conversion adapter, and display options.
 * @returns The quaternion or Euler property line.
 */
export const ControlledQuaternionPropertyLine = <QuaternionT, EulerT>(props: ControlledQuaternionPropertyLineProps<QuaternionT, EulerT>) => {
    const { adapter, useEuler, useDegrees, ...rest } = props;
    const [quaternion, setQuaternion] = useState(props.value);

    useEffect(() => {
        setQuaternion(props.value);
    }, [props.value]);

    const onQuaternionChange = (value: QuaternionT) => {
        setQuaternion(value);
        props.onChange(value);
    };

    if (useEuler) {
        const quaternionSummary = adapter.quaternion.components.map((component) => adapter.quaternion.getComponent(quaternion, component).toFixed(4)).join(", ");

        return (
            <ControlledTensorPropertyLine
                {...rest}
                nullable={false}
                ignoreNullable={false}
                value={adapter.toEuler(quaternion)}
                adapter={adapter.euler}
                valueConverter={useDegrees ? RadiansToDegreesConverter : undefined}
                onChange={(value) => onQuaternionChange(adapter.fromEuler(value, quaternion))}
                unit={useDegrees ? "°" : "rad"}
                step={useDegrees ? 1 : 0.01}
                precision={useDegrees ? 1 : 2}
                expandedContent={<TextPropertyLine label="Quaternion" value={`[${quaternionSummary}]`} />}
            />
        );
    }

    return (
        <ControlledTensorPropertyLine
            {...props}
            nullable={false}
            value={quaternion}
            adapter={adapter.quaternion}
            onChange={onQuaternionChange}
            unit={useDegrees ? "°" : "rad"}
            step={useDegrees ? 1 : 0.01}
            precision={useDegrees ? 1 : 2}
        />
    );
};
