import { ViewerConfiguration } from './../configuration';

/**
 * Lab-oriented default .env support
 */
export const environmentMapConfiguration: ViewerConfiguration = {
    lab: {
        assetsRootURL: '/assets/environment/',
        environmentMap: {
            texture: 'EnvMap_3.0-256.env',
            rotationY: 0,
            tintLevel: 0.4
        }
    }
};