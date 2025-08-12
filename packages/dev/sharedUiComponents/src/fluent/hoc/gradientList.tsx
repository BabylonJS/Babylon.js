import type { FunctionComponent } from "react";

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
    removeGradient: (step: T) => void;
    onChange: (newGradient: T) => void;
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
    const { gradients } = props;
    const items = GradientsToListItems<FactorGradient>(gradients);
    return (
        <List
            key="Factor"
            addButtonLabel={items.length > 0 ? `Add new ${props.label}` : `Use ${props.label}s`}
            items={items}
            onDelete={(item) => props.removeGradient(item.data)}
            onAdd={() => {
                if (items.length === 0) {
                    props.addGradient(); // Default
                } else {
                    props.addGradient(new FactorGradient(1, 1, 1));
                }
            }}
            renderItem={(item) => {
                return (
                    <FactorGradientComponent
                        value={item.data}
                        onChange={(newGradient: FactorGradient) => {
                            item.data.gradient = newGradient.gradient;
                            item.data.factor1 = newGradient.factor1;
                            item.data.factor2 = newGradient.factor2;
                            props.onChange(newGradient);
                        }}
                    />
                );
            }}
        />
    );
};

export const Color3GradientList: FunctionComponent<GradientListProps<Color3Gradient>> = (props) => {
    const { gradients } = props;
    const items = GradientsToListItems<Color3Gradient>(gradients);
    return (
        <List
            key="Color3"
            addButtonLabel={items.length > 0 ? `Add new ${props.label}` : `Use ${props.label}s`}
            items={items}
            onDelete={(item) => props.removeGradient(item.data)}
            onAdd={() => {
                if (items.length === 0) {
                    props.addGradient(); // Default
                } else {
                    props.addGradient(new Color3Gradient(1, Color3.White()));
                }
            }}
            renderItem={(item) => {
                return (
                    <Color3GradientComponent
                        value={item.data}
                        onChange={(newGradient: Color3Gradient) => {
                            item.data.gradient = newGradient.gradient;
                            item.data.color = newGradient.color;
                            props.onChange(newGradient);
                        }}
                    />
                );
            }}
        />
    );
};

export const Color4GradientList: FunctionComponent<GradientListProps<Color4Gradient>> = (props) => {
    const { gradients } = props;
    const items = GradientsToListItems<Color4Gradient>(gradients);
    return (
        <List
            key="Color4"
            addButtonLabel={items.length > 0 ? `Add new ${props.label}` : `Use ${props.label}s`}
            items={items}
            onDelete={(item) => props.removeGradient(item.data)}
            onAdd={() => {
                if (items.length === 0) {
                    props.addGradient(); // Default
                } else {
                    props.addGradient(new Color4Gradient(1, new Color4(1, 1, 1, 1), new Color4(1, 1, 1, 1)));
                }
            }}
            renderItem={(item) => {
                return (
                    <Color4GradientComponent
                        value={item.data}
                        onChange={(newGradient: Color4Gradient) => {
                            item.data.gradient = newGradient.gradient;
                            item.data.color1 = newGradient.color1;
                            item.data.color2 = newGradient.color2;
                            props.onChange(newGradient);
                        }}
                    />
                );
            }}
        />
    );
};
