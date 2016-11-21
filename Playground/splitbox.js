(function () {

    function startDrag(node, splitter, event) {

        node.setAttribute('dragging', '');
        node.xtag.splitter = splitter;
        splitter.setAttribute('dragging', '');
        splitter.style.zIndex = node.xtag.splitZ = (node.xtag.splitZ || 0) + 1;

        var props = getProps(node);
        var lastCoord = event[props.page] - node[props.edge];
        var next = splitter.nextElementSibling, next = !next.hasAttribute('splitter') && next;
        var previous = splitter.previousElementSibling, previous = !previous.hasAttribute('splitter') && previous;
        var startingTotal = next[props.size] + previous[props.size];

        setPercents(node, props);

        node.xtag.drag = xtag.addEvent(node, 'move', function (e) {
            var delta = e[props.page] - node[props.edge] - lastCoord;
            var nextSize = next[props.size];
            var prevSize = previous[props.size];
            var nextMod = nextSize - delta;
            var prevMod = prevSize + delta;

            if (delta > 0) {
                if (nextSize > 0) {
                    if (nextMod <= 0 || prevMod >= startingTotal || prevMod > startingTotal || nextMod > startingTotal) {
                        prevMod = startingTotal;
                        nextMod = 0;
                    }
                    setMinMax(next, props, nextMod);
                    setMinMax(previous, props, prevMod);
                }
            }

            else if (delta < 0) {
                if (prevSize > 0) {
                    if (prevMod <= 0 || nextMod >= startingTotal || prevMod > startingTotal || nextMod > startingTotal) {
                        nextMod = startingTotal;
                        prevMod = 0;
                    }
                    setMinMax(next, props, nextMod);
                    setMinMax(previous, props, prevMod);
                }
            }

            lastCoord = e[props.page] - node[props.edge];
        });
    }

    function getProps(node) {
        return node.xtag.props = (node.direction == 'column') ? {
            page: 'pageY',
            size: 'clientHeight',
            edge: 'clientTop',
            parentSize: node.clientHeight
        } : {
            page: 'pageX',
            size: 'clientWidth',
            edge: 'clientLeft',
            parentSize: node.clientWidth
        };
    }

    function setPercents(node, props, setup) {
        node.xtag.panels = xtag.queryChildren(node, '*:not([splitter])').map(function (el) {
            setMinMax(el, props, el[props.size], setup);
            return el;
        });
    }

    function setMinMax(panel, props, value, setup) {
        panel.style.flex = panel.style[xtag.prefix.lowercase + 'Flex'] = (setup ? '0 0 ' : '1 1 ') + (value / props.parentSize) * 100 + '%';
    }

    function stopDrag(node) {
        if (node.xtag.drag) {
            xtag.removeEvent(node, node.xtag.drag);
            node.removeAttribute('dragging');
            node.xtag.splitter.removeAttribute('dragging');
            node.xtag.splitter = null;
            node.xtag.drag = null;
        }
    }

    xtag.addEvent(window, 'tapend', function (e) {
        xtag.query(document, 'x-splitbox[dragging]').forEach(stopDrag);
    })

    xtag.register('x-splitbox', {
        events: {
            'tapstart:delegate(x-splitbox > [splitter])': function (e) {
                startDrag(e.currentTarget, this, e);
            },
            dragstart: function (e) {
                if (this.hasAttribute('dragging')) {
                    e.preventDefault();
                    return false;
                }
            },
            contextmemu: function (e) {
                e.preventDefault();
            }
        },
        accessors: {
            direction: {
                attribute: { def: 'row' },
                set: function (direction) {
                    setPercents(this, getProps(this), true);
                }
            }
        }
    });

})();

