// The programming goals of Split.js are to deliver readable, understandable and
// maintainable code, while at the same time manually optimizing for tiny minified file size,
// browser compatibility without additional requirements, graceful fallback (IE8 is supported)
// and very few assumptions about the user's page layout.
//
// Make sure all browsers handle this JS library correctly with ES5.
// More information here: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode
'use strict';

// A wrapper function that does a couple things:
//
// 1. Doesn't pollute the global namespace. This is important for a library.
// 2. Allows us to mount the library in different module systems, as well as
//    directly in the browser.
(function() {

// Save the global `this` for use later. In this case, since the library only
// runs in the browser, it will refer to `window`. Also, figure out if we're in IE8
// or not. IE8 will still render correctly, but will be static instead of draggable.
//
// Save a couple long function names that are used frequently.
// This optimization saves around 400 bytes.
//
// Set a float fudging global, used when dividing and setting sizes to long floats.
// There's a chance that sometimes the sum of the floats would end up being slightly
// larger than 100%, breaking the layout. The float fudging value is subtracted from
// the percentage size.
var global = this
  , isIE8 = global.attachEvent && !global[addEventListener]
  , document = global.document
  , addEventListener = 'addEventListener'
  , removeEventListener = 'removeEventListener'
  , getBoundingClientRect = 'getBoundingClientRect'
  , FLOAT_FUDGING = 0.5

  // This library only needs two helper functions:
  //
  // The first determines which prefixes of CSS calc we need.
  // We only need to do this once on startup, when this anonymous function is called.
  // 
  // Tests -webkit, -moz and -o prefixes. Modified from StackOverflow:
  // http://stackoverflow.com/questions/16625140/js-feature-detection-to-detect-the-usage-of-webkit-calc-over-calc/16625167#16625167
  , calc = (function () {
        var el
          , prefixes = ["", "-webkit-", "-moz-", "-o-"]

        for (var i = 0; i < prefixes.length; i++) {
            el = document.createElement('div')
            el.style.cssText = "width:" + prefixes[i] + "calc(9px)"

            if (el.style.length) {
                return prefixes[i] + "calc"
            }
        }
    })()

  // The second helper function allows elements and string selectors to be used
  // interchangeably. In either case an element is returned. This allows us to
  // do `Split(elem1, elem2)` as well as `Split('#id1', '#id2')`.
  , elementOrSelector = function (el) {
        if (typeof el === 'string' || el instanceof String) {
            return document.querySelector(el)
        } else {
            return el
        }
    }

  // The main function to initialize a split. Split.js thinks about each pair
  // of elements as an independant pair. Dragging the gutter between two elements
  // only changes the dimensions of elements in that pair. This is key to understanding
  // how the following functions operate, since each function is bound to a pair.
  // 
  // A pair object is shaped like this:
  // 
  // {
  //     a: DOM element,
  //     b: DOM element,
  //     aMin: Number,
  //     bMin: Number,
  //     dragging: Boolean,
  //     parent: DOM element,
  //     isFirst: Boolean,
  //     isLast: Boolean,
  //     direction: 'horizontal' | 'vertical'
  // }
  //
  // The basic sequence:
  // 
  // 1. Set defaults to something sane. `options` doesn't have to be passed at all.
  // 2. Initialize a bunch of strings based on the direction we're splitting.
  //    A lot of the behavior in the rest of the library is paramatized down to
  //    rely on CSS strings and classes.
  // 3. Define the dragging helper functions, and a few helpers to go with them.
  // 4. Loop through the elements while pairing them off. Every pair gets an
  //    `pair` object, a gutter, and special isFirst/isLast properties.
  // 5. Actually size the pair elements, insert gutters and attach event listeners.
  , Split = function (ids, options) {
    var dimension
      , i
      , clientDimension
      , clientAxis
      , position
      , gutterClass
      , paddingA
      , paddingB
      , pairs = []

    // 1. Set defaults to something sane. `options` doesn't have to be passed at all,
    // so create an options object if none exists. Pixel values 10, 100 and 30 are
    // arbitrary but feel natural.
    options = typeof options !== 'undefined' ?  options : {}

    if (typeof options.gutterSize === 'undefined') options.gutterSize = 10
    if (typeof options.minSize === 'undefined') options.minSize = 100
    if (typeof options.snapOffset === 'undefined') options.snapOffset = 30
    if (typeof options.direction === 'undefined') options.direction = 'horizontal'
    if (typeof options.elementStyle === 'undefined') options.elementStyle = function (dimension, size, gutterSize) {
        var style = {}

        if (typeof size !== 'string' && !(size instanceof String)) {
            if (!isIE8) {
                style[dimension] = calc + '(' + size + '% - ' + gutterSize + 'px)'
            } else {
                style[dimension] = size + '%'
            }
        } else {
            style[dimension] = size
        }

        return style
    }
    if (typeof options.gutterStyle === 'undefined') options.gutterStyle = function (dimension, gutterSize) {
        var style = {}

        style[dimension] = gutterSize + 'px'

        return style
    }

    // 2. Initialize a bunch of strings based on the direction we're splitting.
    // A lot of the behavior in the rest of the library is paramatized down to
    // rely on CSS strings and classes.
    if (options.direction == 'horizontal') {
        dimension = 'width'
        clientDimension = 'clientWidth'
        clientAxis = 'clientX'
        position = 'left'
        gutterClass = 'gutter gutter-horizontal'
        paddingA = 'paddingLeft'
        paddingB = 'paddingRight'
        if (!options.cursor) options.cursor = 'ew-resize'
    } else if (options.direction == 'vertical') {
        dimension = 'height'
        clientDimension = 'clientHeight'
        clientAxis = 'clientY'
        position = 'top'
        gutterClass = 'gutter gutter-vertical'
        paddingA = 'paddingTop'
        paddingB = 'paddingBottom'
        if (!options.cursor) options.cursor = 'ns-resize'
    }

    // 3. Define the dragging helper functions, and a few helpers to go with them.
    // Each helper is bound to a pair object that contains it's metadata. This
    // also makes it easy to store references to listeners that that will be
    // added and removed.
    // 
    // Even though there are no other functions contained in them, aliasing
    // this to self saves 50 bytes or so since it's used so frequently.
    //
    // The pair object saves metadata like dragging state, position and
    // event listener references.
    //
    // startDragging calls `calculateSizes` to store the inital size in the pair object.
    // It also adds event listeners for mouse/touch events,
    // and prevents selection while dragging so avoid the selecting text.
    var startDragging = function (e) {
            // Alias frequently used variables to save space. 200 bytes.
            var self = this
              , a = self.a
              , b = self.b

            // Call the onDragStart callback.
            if (!self.dragging && options.onDragStart) {
                options.onDragStart()
            }

            // Don't actually drag the element. We emulate that in the drag function.
            e.preventDefault()

            // Set the dragging property of the pair object.
            self.dragging = true

            // Create two event listeners bound to the same pair object and store
            // them in the pair object.
            self.move = drag.bind(self)
            self.stop = stopDragging.bind(self)

            // All the binding. `window` gets the stop events in case we drag out of the elements.
            global[addEventListener]('mouseup', self.stop)
            global[addEventListener]('touchend', self.stop)
            global[addEventListener]('touchcancel', self.stop)

            self.parent[addEventListener]('mousemove', self.move)
            self.parent[addEventListener]('touchmove', self.move)

            // Disable selection. Disable!
            a[addEventListener]('selectstart', noop)
            a[addEventListener]('dragstart', noop)
            b[addEventListener]('selectstart', noop)
            b[addEventListener]('dragstart', noop)

            a.style.userSelect = 'none'
            a.style.webkitUserSelect = 'none'
            a.style.MozUserSelect = 'none'
            a.style.pointerEvents = 'none'

            b.style.userSelect = 'none'
            b.style.webkitUserSelect = 'none'
            b.style.MozUserSelect = 'none'
            b.style.pointerEvents = 'none'

            // Set the cursor, both on the gutter and the parent element.
            // Doing only a, b and gutter causes flickering.
            self.gutter.style.cursor = options.cursor
            self.parent.style.cursor = options.cursor

            // Cache the initial sizes of the pair.
            calculateSizes.call(self)
        }

      // stopDragging is very similar to startDragging in reverse.
      , stopDragging = function () {
            var self = this
              , a = self.a
              , b = self.b

            if (self.dragging && options.onDragEnd) {
                options.onDragEnd()
            }

            self.dragging = false

            // Remove the stored event listeners. This is why we store them.
            global[removeEventListener]('mouseup', self.stop)
            global[removeEventListener]('touchend', self.stop)
            global[removeEventListener]('touchcancel', self.stop)

            self.parent[removeEventListener]('mousemove', self.move)
            self.parent[removeEventListener]('touchmove', self.move)

            // Delete them once they are removed. I think this makes a difference
            // in memory usage with a lot of splits on one page. But I don't know for sure.
            delete self.stop
            delete self.move

            a[removeEventListener]('selectstart', noop)
            a[removeEventListener]('dragstart', noop)
            b[removeEventListener]('selectstart', noop)
            b[removeEventListener]('dragstart', noop)

            a.style.userSelect = ''
            a.style.webkitUserSelect = ''
            a.style.MozUserSelect = ''
            a.style.pointerEvents = ''

            b.style.userSelect = ''
            b.style.webkitUserSelect = ''
            b.style.MozUserSelect = ''
            b.style.pointerEvents = ''

            self.gutter.style.cursor = ''
            self.parent.style.cursor = ''
        }

      // drag, where all the magic happens. The logic is really quite simple:
      // 
      // 1. Ignore if the pair is not dragging.
      // 2. Get the offset of the event.
      // 3. Snap offset to min if within snappable range (within min + snapOffset).
      // 4. Actually adjust each element in the pair to offset.
      // 
      // ---------------------------------------------------------------------
      // |    | <- this.aMin               ||              this.bMin -> |    |
      // |    |  | <- this.snapOffset      ||     this.snapOffset -> |  |    |
      // |    |  |                         ||                        |  |    |
      // |    |  |                         ||                        |  |    |
      // ---------------------------------------------------------------------
      // | <- this.start                                        this.size -> |
      , drag = function (e) {
            var offset

            if (!this.dragging) return

            // Get the offset of the event from the first side of the
            // pair `this.start`. Supports touch events, but not multitouch, so only the first
            // finger `touches[0]` is counted.
            if ('touches' in e) {
                offset = e.touches[0][clientAxis] - this.start
            } else {
                offset = e[clientAxis] - this.start
            }

            // If within snapOffset of min or max, set offset to min or max.
            // snapOffset buffers aMin and bMin, so logic is opposite for both.
            // Include the appropriate gutter sizes to prevent overflows.
            if (offset <= this.aMin + options.snapOffset + this.aGutterSize) {
                offset = this.aMin + this.aGutterSize
            } else if (offset >= this.size - (this.bMin + options.snapOffset + this.bGutterSize)) {
                offset = this.size - (this.bMin + this.bGutterSize)
            }

            offset = offset - FLOAT_FUDGING

            // Actually adjust the size.
            adjust.call(this, offset)

            // Call the drag callback continously. Don't do anything too intensive
            // in this callback.
            if (options.onDrag) {
                options.onDrag()
            }
        }

      // Cache some important sizes when drag starts, so we don't have to do that
      // continously:
      // 
      // `size`: The total size of the pair. First element + second element + first gutter + second gutter.
      // `percentage`: The percentage between 0-100 that the pair occupies in the parent.
      // `start`: The leading side of the first element.
      //
      // ------------------------------------------------ - - - - - - - - - - -
      // |      aGutterSize -> |||                      |                     |
      // |                     |||                      |                     |
      // |                     |||                      |                     |
      // |                     ||| <- bGutterSize       |                     |
      // ------------------------------------------------ - - - - - - - - - - -
      // | <- start                             size -> |       parentSize -> |
      , calculateSizes = function () {
            // Figure out the parent size minus padding.
            var computedStyle = global.getComputedStyle(this.parent)
              , parentSize = this.parent[clientDimension] - parseFloat(computedStyle[paddingA]) - parseFloat(computedStyle[paddingB])

            this.size = this.a[getBoundingClientRect]()[dimension] + this.b[getBoundingClientRect]()[dimension] + this.aGutterSize + this.bGutterSize
            this.percentage = Math.min(this.size / parentSize * 100, 100)
            this.start = this.a[getBoundingClientRect]()[position]
        }

      // Actually adjust the size of elements `a` and `b` to `offset` while dragging.
      // calc is used to allow calc(percentage + gutterpx) on the whole split instance,
      // which allows the viewport to be resized without additional logic.
      // Element a's size is the same as offset. b's size is total size - a size.
      // Both sizes are calculated from the initial parent percentage, then the gutter size is subtracted.
      , adjust = function (offset) {
            setElementSize(this.a, (offset / this.size * this.percentage), this.aGutterSize)
            setElementSize(this.b, (this.percentage - (offset / this.size * this.percentage)), this.bGutterSize)
        }
      , setElementSize = function (el, size, gutterSize) {
            // Split.js allows setting sizes via numbers (ideally), or if you must,
            // by string, like '300px'. This is less than ideal, because it breaks
            // the fluid layout that `calc(% - px)` provides. You're on your own if you do that,
            // make sure you calculate the gutter size by hand.
            var style = options.elementStyle(dimension, size, gutterSize)
              , props = Object.keys(style)

            for (var i = 0; i < props.length; i++) {
                el.style[props[i]] = style[props[i]]
            }
        }
      , setGutterSize = function (gutter, gutterSize) {
            var style = options.gutterStyle(dimension, gutterSize)
              , props = Object.keys(style)

            for (var i = 0; i < props.length; i++) {
                gutter.style[props[i]] = style[props[i]]
            }
        }

      // No-op function to prevent default. Used to prevent selection.
      , noop = function () { return false }

      // All DOM elements in the split should have a common parent. We can grab
      // the first elements parent and hope users read the docs because the
      // behavior will be whacky otherwise.
      , parent = elementOrSelector(ids[0]).parentNode

    // Set default options.sizes to equal percentages of the parent element.
    if (!options.sizes) {
        var percent = 100 / ids.length

        options.sizes = []

        for (i = 0; i < ids.length; i++) {
            options.sizes.push(percent)
        }
    }

    // Standardize minSize to an array if it isn't already. This allows minSize
    // to be passed as a number.
    if (!Array.isArray(options.minSize)) {
        var minSizes = []

        for (i = 0; i < ids.length; i++) {
            minSizes.push(options.minSize)
        }

        options.minSize = minSizes
    }

    // 5. Loop through the elements while pairing them off. Every pair gets a
    // `pair` object, a gutter, and isFirst/isLast properties.
    //
    // Basic logic:
    //
    // - Starting with the second element `i > 0`, create `pair` objects with
    //   `a = ids[i - 1]` and `b = ids[i]`
    // - Set gutter sizes based on the _pair_ being first/last. The first and last
    //   pair have gutterSize / 2, since they only have one half gutter, and not two.
    // - Create gutter elements and add event listeners.
    // - Set the size of the elements, minus the gutter sizes.
    //
    // -----------------------------------------------------------------------
    // |     i=0     |         i=1         |        i=2       |      i=3     |
    // |             |       isFirst       |                  |     isLast   |
    // |           pair 0                pair 1             pair 2           |
    // |             |                     |                  |              |
    // -----------------------------------------------------------------------
    for (i = 0; i < ids.length; i++) {
        var el = elementOrSelector(ids[i])
          , isFirstPair = (i == 1)
          , isLastPair = (i == ids.length - 1)
          , size = options.sizes[i]
          , gutterSize = options.gutterSize
          , pair
          , parentFlexDirection = window.getComputedStyle(parent).flexDirection
          , temp

        if (i > 0) {
            // Create the pair object with it's metadata.
            pair = {
                a: elementOrSelector(ids[i - 1]),
                b: el,
                aMin: options.minSize[i - 1],
                bMin: options.minSize[i],
                dragging: false,
                parent: parent,
                isFirst: isFirstPair,
                isLast: isLastPair,
                direction: options.direction
            }

            // For first and last pairs, first and last gutter width is half.
            pair.aGutterSize = options.gutterSize
            pair.bGutterSize = options.gutterSize

            if (isFirstPair) {
                pair.aGutterSize = options.gutterSize / 2
            }

            if (isLastPair) {
                pair.bGutterSize = options.gutterSize / 2
            }

            // if the parent has a reverse flex-direction, switch the pair elements.
            if (parentFlexDirection === 'row-reverse' || parentFlexDirection === 'column-reverse') {
                temp = pair.a;
                pair.a = pair.b;
                pair.b = temp;
            }
        }

        // Determine the size of the current element. IE8 is supported by
        // staticly assigning sizes without draggable gutters. Assigns a string
        // to `size`.
        // 
        // IE9 and above
        if (!isIE8) {
            // Create gutter elements for each pair.
            if (i > 0) {
                var gutter = document.createElement('div')

                gutter.className = gutterClass

                setGutterSize(gutter, gutterSize)

                gutter[addEventListener]('mousedown', startDragging.bind(pair))
                gutter[addEventListener]('touchstart', startDragging.bind(pair))

                parent.insertBefore(gutter, el)

                pair.gutter = gutter
            }

            // Half-size gutters for first and last elements.
            if (i === 0 || i == ids.length - 1) {
                gutterSize = options.gutterSize / 2
            }
        }

        // Set the element size to our determined size.
        setElementSize(el, size, gutterSize)

        if (i > 0) {
            var aSize = pair.a[getBoundingClientRect]()[dimension]
              , bSize = pair.b[getBoundingClientRect]()[dimension]

            if (aSize < pair.aMin) {
                pair.aMin = aSize
            }

            if (bSize < pair.bMin) {
                pair.bMin = bSize
            }
        }

        // After the first iteration, and we have a pair object, append it to the
        // list of pairs.
        if (i > 0) {
            pairs.push(pair)
        }
    }

    return {
        setSizes: function (sizes) {
            for (var i = 0; i < sizes.length; i++) {
                if (i > 0) {
                    var pair = pairs[i - 1]

                    setElementSize(pair.a, sizes[i - 1], pair.aGutterSize)
                    setElementSize(pair.b, sizes[i], pair.bGutterSize)
                }
            }
        },
        getSizes: function () {
            var sizes = []

            for (var i = 0; i < pairs.length; i++) {
                var pair = pairs[i]
                  , computedStyle = global.getComputedStyle(pair.parent)
                  , parentSize = pair.parent[clientDimension] - parseFloat(computedStyle[paddingA]) - parseFloat(computedStyle[paddingB])

                sizes.push((pair.a[getBoundingClientRect]()[dimension] + pair.aGutterSize) / parentSize * 100)

                if (i === pairs.length - 1) {
                    sizes.push((pair.b[getBoundingClientRect]()[dimension] + pair.bGutterSize) / parentSize * 100)
                }
            }

            return sizes
        },
        collapse: function (i) {
            var pair

            if (i === pairs.length) {
                pair = pairs[i - 1]

                calculateSizes.call(pair)
                adjust.call(pair, pair.size - pair.bGutterSize)
            } else {
                pair = pairs[i]

                calculateSizes.call(pair)
                adjust.call(pair, pair.aGutterSize)
            }
        },
        destroy: function () {
            for (var i = 0; i < pairs.length; i++) {
                pairs[i].parent.removeChild(pairs[i].gutter)
                pairs[i].a.style[dimension] = ''
                pairs[i].b.style[dimension] = ''
            }
        }
    }
}

// Play nicely with module systems, and the browser too if you include it raw.
if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
        exports = module.exports = Split
    }
    exports.Split = Split
} else {
    global.Split = Split
}

// Call our wrapper function with the current global. In this case, `window`.
}).call(window);
