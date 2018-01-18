/// <reference path="../../../dist/babylon.d.ts" />
/// <reference path="../../../dist/loaders/babylon.glTF2FileLoader.d.ts" />

/// <reference path="../node_modules/@types/chai/index.d.ts" />
/// <reference path="../node_modules/@types/mocha/index.d.ts" />
/// <reference path="../node_modules/@types/sinon/index.d.ts" />

/*
 * Create a constant with the ChaiJS' expect module just to make the code more readable.
 */
const should = chai.should();
const expect = chai.expect;
const assert = chai.assert;

/**
 * Redirects the devtools used to load the dependencies.
 */
declare var BABYLONDEVTOOLS: any;