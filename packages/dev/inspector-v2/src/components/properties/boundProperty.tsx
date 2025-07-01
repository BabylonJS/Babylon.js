import type { ComponentType } from "react";
import type { BaseComponentProps } from "shared-ui-components/fluent/hoc/propertyLine";
import { useProperty } from "../../hooks/compoundPropertyHooks";

/**
 * This enables type safety when using a BoundProperty
 * Generic types TargetT and PropertyKeyT ensure that target[propertyKey] has the same type as the value/onChange of the BaseComponent
 * Generic type PropsT ensures that the BoundProperty component accepts only the props of the underlying ComponentType
 */
export type BoundPropertyProps<TargetT extends object, PropertyKeyT extends keyof TargetT, PropsT extends object> = Omit<PropsT, "value" | "onChange"> & {
    component: ComponentType<PropsT & BaseComponentProps<TargetT[PropertyKeyT]>>;
    target: TargetT;
    propertyKey: PropertyKeyT;
    convertTo?: (value: TargetT[PropertyKeyT]) => TargetT[PropertyKeyT];
    convertFrom?: (value: TargetT[PropertyKeyT]) => TargetT[PropertyKeyT];
};

/**
 * Intercepts the passed in component's target[propertyKey] with useInterceptObservable and sets component state using useObservableState.
 * Renders the passed in component with value as the new observableState value and onChange as a callback to set the target[propertyKey] value.
 * @param props
 * @returns
 */
export function BoundProperty<TargetT extends object, PropertyKeyT extends keyof TargetT, PropsT extends object>(props: BoundPropertyProps<TargetT, PropertyKeyT, PropsT>) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { target, propertyKey, convertTo, convertFrom, component: Component, ...rest } = props;
    const value = useProperty(target, propertyKey);

    return (
        <Component
            {...(rest as PropsT)}
            value={convertTo ? convertTo(value) : value}
            onChange={(val: TargetT[PropertyKeyT]) => {
                target[propertyKey] = convertFrom ? convertFrom(val) : val;
            }}
        />
    );
}
