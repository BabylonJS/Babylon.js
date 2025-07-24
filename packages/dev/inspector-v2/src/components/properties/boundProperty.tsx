import type { ComponentType, ComponentProps } from "react";
import { forwardRef } from "react";

import { useProperty } from "../../hooks/compoundPropertyHooks";

/**
 * Helper type to check if a type includes null or undefined
 */
type IsNullable<T> = null extends T ? true : undefined extends T ? true : false;

/**
 * Base props for BoundProperty
 */
type BaseBoundPropertyProps<TargetT extends object, PropertyKeyT extends keyof TargetT, ComponentT extends ComponentType<any>> = Omit<
    ComponentProps<ComponentT>,
    "value" | "onChange" | "nullable" | "defaultValue"
> & {
    component: ComponentT;
    target: TargetT;
    propertyKey: PropertyKeyT;
    convertTo?: (value: TargetT[PropertyKeyT]) => TargetT[PropertyKeyT];
    convertFrom?: (value: TargetT[PropertyKeyT]) => TargetT[PropertyKeyT];
};

/**
 * Enhanced BoundProperty props that enforces strict nullable handling
 */
export type BoundPropertyProps<TargetT extends object, PropertyKeyT extends keyof TargetT, ComponentT extends ComponentType<any>> = BaseBoundPropertyProps<
    TargetT,
    PropertyKeyT,
    ComponentT
> &
    (IsNullable<TargetT[PropertyKeyT]> extends true
        ? ComponentProps<ComponentT> extends { nullable?: boolean }
            ? // Component supports nullable UI and thus requires a defaultValue to be sent with nullable = {true}
              {
                  nullable: true;
                  defaultValue: NonNullable<TargetT[PropertyKeyT]>;
              }
            : // Component doesn't support nullable UI - prevent usage entirely with nullable properties
              never
        : {});

function BoundPropertyImpl<TargetT extends object, PropertyKeyT extends keyof TargetT, ComponentT extends ComponentType<any>>(
    props: BoundPropertyProps<TargetT, PropertyKeyT, ComponentT>,
    ref?: any
) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { target, propertyKey, convertTo, convertFrom, component: Component, ...rest } = props;
    const value = useProperty(target, propertyKey);
    const convertedValue = convertTo ? convertTo(value) : value;

    const propsToSend = {
        ...rest,
        ref,
        value: convertedValue as TargetT[PropertyKeyT],
        onChange: (val: TargetT[PropertyKeyT]) => {
            const newValue = convertFrom ? convertFrom(val) : val;
            target[propertyKey] = newValue;
        },
    };

    return <Component {...(propsToSend as ComponentProps<ComponentT>)} />;
}

// Custom generic forwardRef function (this is needed because using forwardRef with BoundPropertyImpl does not properly resolve Generic types)
function CreateGenericForwardRef<T extends (...args: any[]) => any>(render: T) {
    return forwardRef(render as any) as unknown as T;
}

/**
 * Intercepts the passed in component's target[propertyKey] with useInterceptObservable and sets component state using useObservableState.
 * Renders the passed in component with value as the new observableState value and onChange as a callback to set the target[propertyKey] value.
 *
 * NOTE: BoundProperty has strict nullable enforcement!
 *
 * If Target[PropertyKey] is Nullable, caller can only bind to a component that explicitly handles nullable (and caller must send nullable/defaultValue props)
 *
 * @param props BoundPropertyProps with strict nullable validation
 * @returns JSX element
 */
export const BoundProperty = CreateGenericForwardRef(BoundPropertyImpl);
