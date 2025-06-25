import { useInterceptObservable } from "../../hooks/instrumentationHooks";
import { useObservableState } from "../../hooks/observableHooks";
import type { ComponentType } from "react";
import type { BaseComponentProps } from "shared-ui-components/fluent/hoc/propertyLine";

export type BoundPropertyProps<T, P extends object> = Omit<P, "value" | "onChange"> & {
    component: ComponentType<P & BaseComponentProps<T>>;
    target: any;
    propertyKey: PropertyKey;
};

/**
 * Intercepts the passed in component's target[propertyKey] with useInterceptObservable and sets component state using useObservableState.
 * Renders the passed in component with value as the new observableState value and onChange as a callback to set the target[propertyKey] value.
 * @param props
 * @returns
 */
export function BoundProperty<T, P extends object>(props: BoundPropertyProps<T, P>) {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    const { target, propertyKey, component: Component, ...rest } = props;
    const value = useObservableState(() => target[propertyKey], useInterceptObservable("property", target, propertyKey));

    return <Component {...(rest as P)} value={value} onChange={(val: T) => (target[propertyKey] = val)} />;
}
