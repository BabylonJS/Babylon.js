import { ComponentClass } from 'react';
import { InputPropertyTabComponent } from './properties/inputNodePropertyComponent';
import { IPropertyComponentProps } from './properties/propertyComponentProps';
import { TransformPropertyTabComponent } from './properties/transformNodePropertyComponent';
import { GradientPropertyTabComponent } from './properties/gradientNodePropertyComponent';
import { LightPropertyTabComponent } from './properties/lightPropertyTabComponent';
import { LightInformationPropertyTabComponent } from './properties/lightInformationPropertyTabComponent';
import { TexturePropertyTabComponent } from './properties/texturePropertyTabComponent';
import { TrigonometryPropertyTabComponent } from './properties/trigonometryNodePropertyComponent';

export class PropertyLedger {
    public static RegisteredControls: {[key: string] : ComponentClass<IPropertyComponentProps>} = {};
}

PropertyLedger.RegisteredControls["TransformBlock"] = TransformPropertyTabComponent;
PropertyLedger.RegisteredControls["InputBlock"] = InputPropertyTabComponent;
PropertyLedger.RegisteredControls["GradientBlock"] = GradientPropertyTabComponent;
PropertyLedger.RegisteredControls["LightBlock"] = LightPropertyTabComponent;
PropertyLedger.RegisteredControls["LightInformationBlock"] = LightInformationPropertyTabComponent;
PropertyLedger.RegisteredControls["TextureBlock"] = TexturePropertyTabComponent;
PropertyLedger.RegisteredControls["ReflectionTextureBlock"] = TexturePropertyTabComponent;
PropertyLedger.RegisteredControls["ReflectionBlock"] = TexturePropertyTabComponent;
PropertyLedger.RegisteredControls["RefractionBlock"] = TexturePropertyTabComponent;
PropertyLedger.RegisteredControls["CurrentScreenBlock"] = TexturePropertyTabComponent;
PropertyLedger.RegisteredControls["ParticleTextureBlock"] = TexturePropertyTabComponent;
PropertyLedger.RegisteredControls["TrigonometryBlock"] = TrigonometryPropertyTabComponent;