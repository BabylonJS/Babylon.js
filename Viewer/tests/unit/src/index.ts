import { main } from '../../commons/boot';
if (window && !window['validation']) {
    main();
}
export * from './viewer/viewer';
export * from '../../../src'