var BABYLON;
(function (BABYLON) {
    var Internals;
    (function (Internals) {
        var AndOrNotEvaluator = (function () {
            function AndOrNotEvaluator() {
            }
            AndOrNotEvaluator.Eval = function (query, evaluateCallback) {
                if (!query.match(/\([^\(\)]*\)/g)) {
                    query = AndOrNotEvaluator._HandleParenthesisContent(query, evaluateCallback);
                }
                else {
                    query = query.replace(/\([^\(\)]*\)/g, function (r) {
                        // remove parenthesis
                        r = r.slice(1, r.length - 1);
                        return AndOrNotEvaluator._HandleParenthesisContent(r, evaluateCallback);
                    });
                }
                if (query === "true") {
                    return true;
                }
                if (query === "false") {
                    return false;
                }
                return AndOrNotEvaluator.Eval(query, evaluateCallback);
            };
            AndOrNotEvaluator._HandleParenthesisContent = function (parenthesisContent, evaluateCallback) {
                evaluateCallback = evaluateCallback || (function (r) {
                    return r === "true" ? true : false;
                });
                var result;
                var or = parenthesisContent.split("||");
                for (var i in or) {
                    var ori = AndOrNotEvaluator._SimplifyNegation(or[i].trim());
                    var and = ori.split("&&");
                    if (and.length > 1) {
                        for (var j = 0; j < and.length; ++j) {
                            var andj = AndOrNotEvaluator._SimplifyNegation(and[j].trim());
                            if (andj !== "true" && andj !== "false") {
                                if (andj[0] === "!") {
                                    result = !evaluateCallback(andj.substring(1));
                                }
                                else {
                                    result = evaluateCallback(andj);
                                }
                            }
                            else {
                                result = andj === "true" ? true : false;
                            }
                            if (!result) {
                                ori = "false";
                                break;
                            }
                        }
                    }
                    if (result || ori === "true") {
                        result = true;
                        break;
                    }
                    // result equals false (or undefined)
                    if (ori !== "true" && ori !== "false") {
                        if (ori[0] === "!") {
                            result = !evaluateCallback(ori.substring(1));
                        }
                        else {
                            result = evaluateCallback(ori);
                        }
                    }
                    else {
                        result = ori === "true" ? true : false;
                    }
                }
                // the whole parenthesis scope is replaced by 'true' or 'false'
                return result ? "true" : "false";
            };
            AndOrNotEvaluator._SimplifyNegation = function (booleanString) {
                booleanString = booleanString.replace(/^[\s!]+/, function (r) {
                    // remove whitespaces
                    r = r.replace(/[\s]/g, function () { return ""; });
                    return r.length % 2 ? "!" : "";
                });
                booleanString = booleanString.trim();
                if (booleanString === "!true") {
                    booleanString = "false";
                }
                else if (booleanString === "!false") {
                    booleanString = "true";
                }
                return booleanString;
            };
            return AndOrNotEvaluator;
        }());
        Internals.AndOrNotEvaluator = AndOrNotEvaluator;
    })(Internals = BABYLON.Internals || (BABYLON.Internals = {}));
})(BABYLON || (BABYLON = {}));
