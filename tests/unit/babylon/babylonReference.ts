/// <reference path="../../../dist/preview release/babylon.d.ts" />
/// <reference path="../../../dist/preview release/loaders/babylon.glTF2FileLoader.d.ts" />
/// <reference path="../../../dist/babylon.glTF2Interface.d.ts"/>
/// <reference path="../../../dist/preview release/serializers/babylon.glTF2Serializer.d.ts" />

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