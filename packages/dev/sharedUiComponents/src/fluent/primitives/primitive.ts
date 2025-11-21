import type { InfoLabelParentProps } from "./infoLabel";

export type BasePrimitiveProps = {
    /**
     * Optional flag to disable the component, preventing any interaction.
     */
    disabled?: boolean;
    /**
     * Optional class name to apply custom styles to the component.
     */
    className?: string;
    /**
     * Optional style object to apply custom inline styles to the top-level HTML element.
     */
    style?: React.CSSProperties;
    /**
     * Optional title for the component, used for tooltips or accessibility.
     */
    title?: string;
};

export type ImmutablePrimitiveProps<ValueT> = BasePrimitiveProps & {
    /**
     * The value of the property to be displayed and modified.
     */
    value: ValueT;

    /**
     * Optional information to display as an infoLabel popup aside the component.
     */
    infoLabel?: InfoLabelParentProps;
};

export type PrimitiveProps<T> = ImmutablePrimitiveProps<T> & {
    /**
     * Called when the primitive value changes
     */
    onChange: (value: T) => void;
};
