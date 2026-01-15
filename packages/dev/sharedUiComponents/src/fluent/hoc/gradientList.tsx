import type { FunctionComponent } from "react";

import { useMemo } from "react";

import { List } from "../primitives/list";
import { Color3GradientComponent, Color4GradientComponent, FactorGradientComponent } from "../primitives/gradient";
import { Color3Gradient, ColorGradient as Color4Gradient, FactorGradient } from "core/Misc/gradients";
import type { IValueGradient } from "core/Misc/gradients";
import type { Nullable } from "core/types";
import { Color3, Color4 } from "core/Maths/math.color";

type GradientListProps<T extends FactorGradient | Color3Gradient | Color4Gradient> = {
    label: string;
    gradients: Nullable<Array<T>>;
    addGradient: (step?: T) => void;
    removeGradient: (step: T, index: number) => void;
    onChange: (newGradient: T, index: number) => void;
};

// Convert gradients to LineList items and sort by gradient value
function GradientsToListItems<T extends IValueGradient>(gradients: Nullable<Array<T>>) {
    return (
        gradients?.map((gradient, index) => ({
            id: index,
            data: gradient,
            sortBy: gradient.gradient,
        })) ?? []
    );
}
export const FactorGradientList: FunctionComponent<GradientListProps<FactorGradient>> = (props) => {
    FactorGradientList.displayName = "FactorGradientList";
    const { gradients } = props;
    const items = useMemo(() => GradientsToListItems<FactorGradient>(gradients), [gradients]);
    return (
        <List
            key="Factor"
            addButtonLabel={items.length > 0 ? `Add new ${props.label}` : `Use ${props.label}s`}
            items={items}
            onDelete={(item, index) => props.removeGradient(item.data, index)}
            onAdd={() => {
                if (items.length === 0) {
                    props.addGradient(); // Default
                } else {
                    props.addGradient(new FactorGradient(1, 1, 1));
                }
            }}
            renderItem={(item, index) => {
                return (
                    <FactorGradientComponent
                        value={item.data}
                        onChange={(newGradient: FactorGradient) => {
                            item.data.gradient = newGradient.gradient;
                            item.data.factor1 = newGradient.factor1;
                            item.data.factor2 = newGradient.factor2;
                            props.onChange(newGradient, index);
                        }}
                    />
                );
            }}
        />
    );
};

export const Color3GradientList: FunctionComponent<GradientListProps<Color3Gradient>> = (props) => {
    Color3GradientList.displayName = "Color3GradientList";
    const { gradients } = props;
    const items = useMemo(() => GradientsToListItems<Color3Gradient>(gradients), [gradients]);
    return (
        <List
            key="Color3"
            addButtonLabel={items.length > 0 ? `Add new ${props.label}` : `Use ${props.label}s`}
            items={items}
            onDelete={(item, index) => props.removeGradient(item.data, index)}
            onAdd={() => {
                if (items.length === 0) {
                    props.addGradient(); // Default
                } else {
                    props.addGradient(new Color3Gradient(1, Color3.White()));
                }
            }}
            renderItem={(item, index) => {
                return (
                    <Color3GradientComponent
                        value={item.data}
                        onChange={(newGradient: Color3Gradient) => {
                            item.data.gradient = newGradient.gradient;
                            item.data.color = newGradient.color;
                            props.onChange(newGradient, index);
                        }}
                    />
                );
            }}
        />
    );
};

export const Color4GradientList: FunctionComponent<GradientListProps<Color4Gradient>> = (props) => {
    Color4GradientList.displayName = "Color4GradientList";
    const { gradients } = props;
    const items = useMemo(() => GradientsToListItems<Color4Gradient>(gradients), [gradients]);
    return (
        <List
            key="Color4"
            addButtonLabel={items.length > 0 ? `Add new ${props.label}` : `Use ${props.label}s`}
            items={items}
            onDelete={(item, index) => props.removeGradient(item.data, index)}
            onAdd={() => {
                if (items.length === 0) {
                    props.addGradient(); // Default
                } else {
                    props.addGradient(new Color4Gradient(1, new Color4(1, 1, 1, 1), new Color4(1, 1, 1, 1)));
                }
            }}
            renderItem={(item, index) => {
                return (
                    <Color4GradientComponent
                        value={item.data}
                        onChange={(newGradient: Color4Gradient) => {
                            item.data.gradient = newGradient.gradient;
                            item.data.color1 = newGradient.color1;
                            item.data.color2 = newGradient.color2;
                            props.onChange(newGradient, index);
                        }}
                    />
                );
            }}
        />
    );
};
