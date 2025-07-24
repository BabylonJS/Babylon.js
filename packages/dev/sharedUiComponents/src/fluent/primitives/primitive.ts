export type ImmutablePrimitiveProps<ValueT> = {
    /**
     * The value of the property to be displayed and modified.
     */
    value: ValueT;

    /**
     * Optional flag to disable the component, preventing any interaction.
     */
    disabled?: boolean;
    /**
     * Optional class name to apply custom styles to the component.
     */
    className?: string;

    /**
     * Optional title for the component, used for tooltips or accessibility.
     */
    title?: string;
};

export type PrimitiveProps<T> = ImmutablePrimitiveProps<T> & {
    /**
     * Called when the primitive value changes
     */
    onChange: (value: T) => void;
};
