# Babylon test tools

This is a collection of ever-growing test tools that are used in Babylon.js.

The current offered test tools are using jest, and are responsible of testing:

1. Event leaks (i.e. events that are registered and are not removed when disposed)
2. Object leaks - Objects that stay in memory after being disposed

This package is mostly used internally! Please use at caution. This package will NOT be kept backwards compatible at all times.

## How to use

The library is under the strict assumption that you are using jest (27.X) and puppeteer (recommended 13.X).

### Memory leaks

To make the event leaks part of your tests work on every test, you need to run the `evaluateEventListenerAugmentation` function before each step as part of the puppeteer page evaluation:

```javascript
// inside jest
beforeEach(async () => {
    await page.goto(`${baseULR}/test.html`, {
        waitUntil: "load",
        timeout: 0,
    });
    await page.evaluate(evaluateEventListenerAugmentation);
});
```

To assess the test results, run `assertEventLeaks` at the end of your test (preferably not as part of "afterEach", as it runs "expect"):

```javascript
// inside the test:
it("Should do the thing it should do!", async () => {
    // do your thing on the page
    // run your asserts
    // ...
    // run assertEventLeaks with the puppeteer page
    await assetEventLeaks(page);
}, 10000);
```

### Object count

There are two types of object count tests. You can either test the Object.prototype (i.e. - ALL object that were created in this session) or specific classes. As we can't send es6-style classes to puppeteer, the HTML page sent to puppeteer has to expose the classes that need to be checked to the window object. This will be expanded later.

To manually run the tests whenever you want, run the "count objects" function whenever you want to take a snapshot of the current browser state. It will make sense to run one at the beginning of the test, and at the end of the test:

```javascript
// inside the test:
it("Should do the thing it should do!", async () => {
    const init = await countObjects(page);
    // do your thing on the page
    // run your asserts
    // ...
    // count objects again
    const valuesAtTheEnd = await countObjects(page);
    // no run expect rules to check if, for example, the number of objects increased less than 200
    expect(valuesAtTheEnd.numberOfObjects - valuesAtTheEnd.numberOfObjects).toBeLessThan(200);
}, 10000);
```

You can also use the helper function `countCurrentObjects` at the end of your tests to run the asserts automatically:

```javascript
// inside the test:
it("Should do the thing it should do!", async () => {
    const init = await countObjects(page);
    // do your thing on the page
    // run your asserts
    // ...
    await countCurrentObjects(page, init);
}, 10000);
```

To run the tests on specific classes, as mentioned above, you need to allow access to them from the window object in the puppeteer page. After doing that, you can provide a list of classes to check to the countObjects function:

```javascript
// inside the test:
it("Should do the thing it should do!", async () => {
    const classes = [
        {
            globalClassName: "FirstComponent",
            disposeFunctionName: "dispose",
        },
        {
            globalClassName: "SecondComponent",
            disposeFunctionName: "dispose",
        }
    ]
    const init = await countObjects(page, classes);
    // do your thing on the page
    // run your asserts
    // ...
    await countCurrentObjects(page, init, classes);
}, 10000);
```

It is possible to check if the object was actually disposed if it has a dispose function. If that's the case you will need to provide the name of the function in the class. The `disposeFunctionName` property is optional, and if not provided, disposing will not be inspected.

To get a stacktrace of the creation of the undisposed object (i.e. - when an object is found not to be removed from the memory - what object is it??) you will need to notify when those objects are created. As it is impossible to extend a class' constructor you will need to call the `onComponentCreated` function with the created object. This function will tag the class/component and will store the stacktrace of the creation.

## Sourcemaps and stack traces

Both class check and event leaks can provide stacktraces to the point when the event or object was created. This can help finding the culprit when testing a larger set of components.

If using javascript, those stack traces will provide the correct position in the source. When using typescript (or when minifying the js code), you can use sourcemaps to provide the correct stacktrace. The sourcemaps MUST be in a .map file (i.e. not embedded in the js file). To enable sourcemap processing you will need to add the library [sourcemapped-stacktrace](https://github.com/novocaine/sourcemapped-stacktrace) to the HTML being used to test on puppeteer:

```html
<script src="https://cdn.jsdelivr.net/npm/sourcemapped-stacktrace@1.1.11/dist/sourcemapped-stacktrace.min.js"></script>
```
