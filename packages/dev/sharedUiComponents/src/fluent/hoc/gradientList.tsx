import type { FunctionComponent } from "react";

import { List } from "../primitives/list";
import { Color3GradientComponent, Color4GradientComponent, FactorGradientComponent } from "../primitives/gradient";
import { Color3Gradient, ColorGradient as Color4Gradient, FactorGradient } from "core/Misc/gradients";
import type { IValueGradient } from "core/Misc/gradients";
import type { Nullable } from "core/types";
import { Color3, Color4 } from "core/Maths/math.color";

type GradientTypes = "Factor" | "Color3" | "Color4";

type GradientListProps<T extends FactorGradient | Color3Gradient | Color4Gradient> = {
    label: string;
    gradients: Nullable<Array<T>>;
    addGradient: (step?: T) => void;
    removeGradient: (step: T) => void;
    onChange: (newGradient: T) => void;
};

// Convert gradients to LineList items and sort by gradient value
function GradientsToListItems(gradients: Nullable<Array<IValueGradient>>) {
    return (
        gradients?.map((gradient, index) => ({
            id: index,
            data: gradient,
            sortBy: gradient.gradient,
        })) ?? []
    );
}

const GradientList: FunctionComponent<GradientListProps<FactorGradient | Color3Gradient | Color4Gradient> & { type: GradientTypes }> = (props) => {
    const { gradients, type } = props;
    const items = GradientsToListItems(gradients);

    const deleteStep = (step: FactorGradient | Color3Gradient | Color4Gradient) => {
        props.removeGradient(step);
    };

    const addNewStep = () => {
        if (items.length === 0) {
            props.addGradient(); // Default
        } else {
            switch (props.type) {
                case "Factor": {
                    const newStep = new FactorGradient(1, 1, 1);
                    props.addGradient(newStep);
                    break;
                }
                case "Color3": {
                    const newStepColor3 = new Color3Gradient(1, Color3.White());
                    props.addGradient(newStepColor3);
                    break;
                }
                case "Color4": {
                    const newStepColor = new Color4Gradient(1, new Color4(1, 1, 1, 1), new Color4(1, 1, 1, 1));
                    props.addGradient(newStepColor);
                    break;
                }
            }
        }
    };

    return (
        <div>
            <List
                key={type}
                addButtonLabel={items.length > 0 ? `Add new ${props.label}` : `Use ${props.label}s`}
                items={items}
                onDelete={(item) => deleteStep(item.data)}
                onAdd={addNewStep}
                renderItem={(item) => {
                    const gradient = item.data;
                    switch (props.type) {
                        case "Factor":
                            return (
                                <FactorGradientComponent
                                    value={gradient}
                                    onChange={(newGradient: FactorGradient) => {
                                        item.data.gradient = newGradient.gradient;
                                        item.data.factor1 = newGradient.factor1;
                                        item.data.factor2 = newGradient.factor2;
                                        props.onChange(newGradient);
                                    }}
                                />
                            );

                        case "Color3":
                            return (
                                <Color3GradientComponent
                                    value={gradient}
                                    onChange={(newGradient: Color3Gradient) => {
                                        item.data.gradient = newGradient.gradient;
                                        item.data.color = newGradient.color;
                                        props.onChange(newGradient);
                                    }}
                                />
                            );
                        case "Color4":
                            return (
                                <Color4GradientComponent
                                    value={gradient}
                                    onChange={(newGradient: Color4Gradient) => {
                                        item.data.gradient = newGradient.gradient;
                                        item.data.color1 = newGradient.color1;
                                        item.data.color2 = newGradient.color2;
                                        props.onChange(newGradient);
                                    }}
                                />
                            );
                    }
                }}
            />
        </div>
    );
};

const FactorGradientCast = GradientList as FunctionComponent<GradientListProps<FactorGradient> & { type: "Factor" }>;
const Color3GradientCast = GradientList as FunctionComponent<GradientListProps<Color3Gradient> & { type: "Color3" }>;
const Color4GradientCast = GradientList as FunctionComponent<GradientListProps<Color4Gradient> & { type: "Color4" }>;

export const FactorGradientList: FunctionComponent<GradientListProps<FactorGradient>> = (props) => <FactorGradientCast {...props} type="Factor" />;
export const Color3GradientList: FunctionComponent<GradientListProps<Color3Gradient>> = (props) => <Color3GradientCast {...props} type="Color3" />;
export const Color4GradientList: FunctionComponent<GradientListProps<Color4Gradient>> = (props) => <Color4GradientCast {...props} type="Color4" />;
