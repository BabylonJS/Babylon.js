import { createElement, type ComponentType, type FunctionComponent, type Ref, useEffect, useState } from "react";

import { type StructuralColor, type StructuralColorAdapter } from "../../primitives/structuralColorPicker";
import { type PrimitiveProps } from "../../primitives/primitive";
import { type PropertyLineProps, PropertyLine } from "./propertyLine";
import { SyncedSliderPropertyLine } from "./syncedSliderPropertyLine";

export type ColorPropertyLineAdapter<ValueT> = StructuralColorAdapter<ValueT> &
    Readonly<{
        picker: ComponentType<PrimitiveProps<ValueT> & { isLinearMode?: boolean }>;
    }>;

export type ControlledColorPropertyLineProps<ValueT> = PrimitiveProps<ValueT> &
    PropertyLineProps<ValueT> &
    Readonly<{
        adapter: ColorPropertyLineAdapter<ValueT>;
        isLinearMode?: boolean;
        propertyLineRef?: Ref<HTMLDivElement>;
    }>;

/**
 * Runtime-neutral controlled color editor with RGB or RGBA sliders and an injected picker.
 * @param props The controlled color, runtime adapter, and property-line presentation.
 * @returns The color property line.
 */
export const ControlledColorPropertyLine = <ValueT,>(props: ControlledColorPropertyLineProps<ValueT>) => {
    const { adapter, value, onChange, propertyLineRef } = props;
    const [currentValue, setCurrentValue] = useState(value);

    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleChange = (newValue: ValueT) => {
        setCurrentValue(newValue);
        onChange(newValue);
    };

    const onSliderChange = (componentValue: number, component: keyof StructuralColor) => {
        const color = adapter.getColor(currentValue);
        handleChange(
            adapter.createColor(
                {
                    ...color,
                    [component]: component === "a" ? componentValue : componentValue / 255,
                },
                currentValue
            )
        );
    };

    const color = adapter.getColor(currentValue);
    return (
        <PropertyLine ref={propertyLineRef} {...props} expandedContent={<ColorSliders color={color} onSliderChange={onSliderChange} />}>
            {createElement(adapter.picker, {
                value: currentValue,
                onChange: handleChange,
                isLinearMode: props.isLinearMode,
                disabled: props.disabled,
                className: props.className,
                style: props.style,
                title: props.title,
            })}
        </PropertyLine>
    );
};

type ColorSlidersProps = Readonly<{
    color: StructuralColor;
    onSliderChange: (value: number, component: keyof StructuralColor) => void;
}>;

const ColorSliders: FunctionComponent<ColorSlidersProps> = (props) => {
    const { color, onSliderChange } = props;

    return (
        <>
            <SyncedSliderPropertyLine label="R" value={color.r * 255} min={0} max={255} onChange={(value) => onSliderChange(value, "r")} />
            <SyncedSliderPropertyLine label="G" value={color.g * 255} min={0} max={255} onChange={(value) => onSliderChange(value, "g")} />
            <SyncedSliderPropertyLine label="B" value={color.b * 255} min={0} max={255} onChange={(value) => onSliderChange(value, "b")} />
            {color.a === undefined ? undefined : (
                <SyncedSliderPropertyLine label="A" value={color.a} min={0} max={1} step={0.01} onChange={(value) => onSliderChange(value, "a")} />
            )}
        </>
    );
};
