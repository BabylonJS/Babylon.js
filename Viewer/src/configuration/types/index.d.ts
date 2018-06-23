import { minimalConfiguration } from './minimal';
import { defaultConfiguration } from './default';
import { ViewerConfiguration } from '../configuration';
declare let getConfigurationType: (types: string) => ViewerConfiguration;
export { getConfigurationType, defaultConfiguration, minimalConfiguration };
