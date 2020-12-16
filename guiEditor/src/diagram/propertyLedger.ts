import { ComponentClass } from 'react';

import { IPropertyComponentProps } from './properties/propertyComponentProps';
import { SliderPropertyTabComponent } from './properties/sliderGuiPropertyComponent';

export class PropertyGuiLedger {
    public static RegisteredControls: {[key: string] : ComponentClass<IPropertyComponentProps>} = {};
}

PropertyGuiLedger.RegisteredControls["Slider"] = SliderPropertyTabComponent;
