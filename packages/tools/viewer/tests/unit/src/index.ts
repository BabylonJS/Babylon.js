import { main } from '../../commons/boot';
if (window && !window['validation']) {
    main();
}
import './viewer/viewer';
import './viewer/viewerManager';
import './configuration/mappers';
import './configuration/loader';
import './helper';
import './configuration/updateConfiguration';
import './viewer/sceneManager';
export * from '../../../src';