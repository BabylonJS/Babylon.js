import { ComponentClass } from 'react';

import { IPropertyComponentProps } from './properties/propertyComponentProps';
import { ButtonPropertyTabComponent } from './properties/buttonGuiPropertyComponent copy';
import { SliderPropertyTabComponent } from './properties/sliderGuiPropertyComponent';
import { CheckboxPropertyTabComponent } from './properties/checkboxGuiPropertyComponent';
import { ShapePropertyTabComponent } from './properties/shapeGuiPropertyComponent';
import { LinePropertyTabComponent } from './properties/lineGuiPropertyComponent';

export class PropertyLedger {
    public static RegisteredControls: {[key: string] : ComponentClass<IPropertyComponentProps>} = {};
}

export class PropertyGuiLedger {
    public static RegisteredControls: {[key: string] : ComponentClass<IPropertyComponentProps>} = {};
}


PropertyGuiLedger.RegisteredControls["Button"] = ButtonPropertyTabComponent;
PropertyGuiLedger.RegisteredControls["Slider"] = SliderPropertyTabComponent;
PropertyGuiLedger.RegisteredControls["Checkbox"] = CheckboxPropertyTabComponent;
PropertyGuiLedger.RegisteredControls["Rectangle"] = ShapePropertyTabComponent;
PropertyGuiLedger.RegisteredControls["Ellipse"] = ShapePropertyTabComponent;
PropertyGuiLedger.RegisteredControls["Line"] = LinePropertyTabComponent;