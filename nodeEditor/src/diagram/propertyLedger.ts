import { ComponentClass } from 'react';
import { InputPropertyTabComponent } from './properties/inputNodePropertyComponent';
import { IPropertyComponentProps } from './properties/propertyComponentProps';
import { TransformPropertyTabComponent } from './properties/transformNodePropertyComponent';
import { PerturbNormalPropertyTabComponent } from './properties/PerturbNormalNodePropertyComponent';
import { WorleyNoise3DNodePropertyComponent } from './properties/worleyNoise3DNodePropertyComponent';
import { ClampPropertyTabComponent } from './properties/clampNodePropertyComponent';
import { GradientPropertyTabComponent } from './properties/gradientNodePropertyComponent';
import { LightPropertyTabComponent } from './properties/lightPropertyTabComponent';
import { LightInformationPropertyTabComponent } from './properties/lightInformationPropertyTabComponent';
import { RemapPropertyTabComponent } from './properties/remapNodePropertyComponent';
import { TexturePropertyTabComponent } from './properties/texturePropertyTabComponent';
import { TrigonometryPropertyTabComponent } from './properties/trigonometryNodePropertyComponent';

export class PropertyLedger {
    public static RegisteredControls: {[key: string] : ComponentClass<IPropertyComponentProps>} = {};
}

PropertyLedger.RegisteredControls["TransformBlock"] = TransformPropertyTabComponent;
PropertyLedger.RegisteredControls["InputBlock"] = InputPropertyTabComponent;
PropertyLedger.RegisteredControls["PerturbNormalBlock"] = PerturbNormalPropertyTabComponent;
PropertyLedger.RegisteredControls["WorleyNoise3DBlock"] = WorleyNoise3DNodePropertyComponent;
PropertyLedger.RegisteredControls["ClampBlock"] = ClampPropertyTabComponent;
PropertyLedger.RegisteredControls["GradientBlock"] = GradientPropertyTabComponent;
PropertyLedger.RegisteredControls["LightBlock"] = LightPropertyTabComponent;
PropertyLedger.RegisteredControls["LightInformationBlock"] = LightInformationPropertyTabComponent;
PropertyLedger.RegisteredControls["RemapBlock"] = RemapPropertyTabComponent;
PropertyLedger.RegisteredControls["TextureBlock"] = TexturePropertyTabComponent;
PropertyLedger.RegisteredControls["ReflectionTextureBlock"] = TexturePropertyTabComponent;
PropertyLedger.RegisteredControls["TrigonometryBlock"] = TrigonometryPropertyTabComponent;