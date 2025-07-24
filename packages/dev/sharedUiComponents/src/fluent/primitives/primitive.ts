/**
 * PrimitiveProps used for components with a value of type T and, if Mutable, an onChange callback
 * If a component is not mutable, it should set MutableT to false, which removes onChange from the props
 * By default, MutableT is true and onChange is required.
 */
export type PrimitiveProps<T, MutableT extends boolean = true> = MutableT extends true ? MutablePrimitiveProps<T> : BasePrimitiveProps<T>;

type BasePrimitiveProps<ValueT> = {
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

type MutablePrimitiveProps<T> = BasePrimitiveProps<T> & {
    onChange: (value: T) => void;
};
