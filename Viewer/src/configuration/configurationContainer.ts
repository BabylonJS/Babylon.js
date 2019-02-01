import { ViewerConfiguration } from './configuration';
import { Color3 } from '@babylonjs/core/Maths/math';
import { Scene } from '@babylonjs/core/scene';

export class ConfigurationContainer {

    public configuration: ViewerConfiguration;

    public viewerId: string;

    public mainColor: Color3 = Color3.White();
    public reflectionColor: Color3 = Color3.White();
    public scene?: Scene;
}