import { useInterceptObservable } from "../../hooks/instrumentationHooks";
import { useObservableState } from "../../hooks/observableHooks";
import type { ComponentType } from "react";
import type { BaseComponentProps } from "shared-ui-components/fluent/hoc/propertyLine";

/**
 * This enables type safety when using a BoundProperty
 * Generic types O and K ensure that target[propertyKey] has the same type as the value/onChange of the BaseComponent>
 * Generic type P ensures that the BoundProperty component accepts only the props of the underlying ComponentType
 */
export type BoundPropertyProps<O extends object, K extends keyof O, P extends object> = Omit<P, "value" | "onChange"> & {
    component: ComponentType<P & BaseComponentProps<O[K]>>;
    target: O;
    propertyKey: K;
};

/**
 * Intercepts the passed in component's target[propertyKey] with useInterceptObservable and sets component state using useObservableState.
 * Renders the passed in component with value as the new observableState value and onChange as a callback to set the target[propertyKey] value.
 * @param props
 * @returns
 */
export function BoundProperty<O extends object, K extends keyof O, P extends object>(props: BoundPropertyProps<O, K, P>) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { target, propertyKey, component: Component, ...rest } = props;
    const value = useObservableState(() => target[propertyKey], useInterceptObservable("property", target, propertyKey));

    return (
        <Component
            {...(rest as P)}
            value={value}
            onChange={(val: O[K]) => {
                target[propertyKey] = val;
            }}
        />
    );
}
