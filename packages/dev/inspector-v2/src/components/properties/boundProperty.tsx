import type { ComponentProps, ComponentType } from "react";
import { forwardRef, useMemo } from "react";

import { MakePropertyHook, useProperty } from "../../hooks/compoundPropertyHooks";

/**
 * Helper type to check if a type includes null or undefined
 */
type IsNullable<T> = null extends T ? true : undefined extends T ? true : false;

/**
 * Base props for BoundProperty
 */
type BaseBoundPropertyProps<TargetT extends object, PropertyKeyT extends keyof TargetT, ComponentT extends ComponentType<any>> = Omit<
    ComponentProps<ComponentT>,
    "value" | "onChange" | "nullable" | "defaultValue" | "ignoreNullable"
> & {
    component: ComponentT;
    target: TargetT | null | undefined;
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
              | {
                        nullable: true;
                        defaultValue: NonNullable<TargetT[PropertyKeyT]>;
                    }
                  | {
                        ignoreNullable: true;
                        defaultValue: NonNullable<TargetT[PropertyKeyT]>;
                    }
            : // Component doesn't support nullable UI - prevent usage entirely with nullable properties
              never
        : {});

function BoundPropertyCoreImpl<TargetT extends object, PropertyKeyT extends keyof TargetT, ComponentT extends ComponentType<any>>(
    props: Omit<BoundPropertyProps<TargetT, PropertyKeyT, ComponentT>, "target"> & { target: TargetT },
    ref?: any
) {
    const { target, propertyKey } = props;

    // Get the value of the property. If it changes, it will cause a re-render, which is needed to
    // re-evaluate which specific hook will catch all the nested property changes we want to observe.
    const value = useProperty(target, propertyKey);

    // Determine which specific property hook to use based on the value's type.
    const useSpecificProperty = useMemo(() => MakePropertyHook(value), [value]);

    // Create an inline nested component that changes when the desired specific hook type changes (since hooks can't be conditional).
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const SpecificComponent = useMemo(() => {
        return (props: ComponentProps<ComponentT>) => {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            const { target, propertyKey, convertTo, convertFrom, component: Component, ...rest } = props;

            // Hook the property, using the specific hook that also catches changes to nested properties as well (like x/y/z on a Vector3 for example).
            const value = useSpecificProperty(target, propertyKey);
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
        };
    }, [useSpecificProperty]);

    return <SpecificComponent {...(props as ComponentProps<ComponentT>)} />;
}

const BoundPropertyCore = CreateGenericForwardRef(BoundPropertyCoreImpl);

function BoundPropertyImpl<TargetT extends object, PropertyKeyT extends keyof TargetT, ComponentT extends ComponentType<any>>(
    props: BoundPropertyProps<TargetT, PropertyKeyT, ComponentT>,
    ref?: any
) {
    const { target, ...rest } = props;

    // If target is null, don't render anything.
    if (!target) {
        return null;
    }

    // Target is guaranteed to be non-null here, pass to core implementation.
    return <BoundPropertyCore {...rest} target={target} ref={ref} />;
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
