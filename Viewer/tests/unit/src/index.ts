import { main } from '../../commons/boot';
if (window && !window['validation']) {
    main();
}
import './viewer/viewer';
import './viewer/viewerManager';
export * from '../../../src'