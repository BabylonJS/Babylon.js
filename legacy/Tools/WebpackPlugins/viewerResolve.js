var path = require('path');
var assign = require('object-assign');
var forEachBail = require('enhanced-resolve/lib/forEachBail');
var basename = require('enhanced-resolve/lib/getPaths').basename;

module.exports = function (modulesToResolveToEs5) {
  return {
    apply: doApply.bind(this, modulesToResolveToEs5)
  };
};

function doApply(modulesToResolveToEs5, resolver) {
  // file type taken from: https://github.com/webpack/enhanced-resolve/blob/v4.0.0/test/plugins.js
  var target = resolver.ensureHook("undescribed-raw-file");
  //console.log(resolver.hooks);
  resolver.getHook("resolve")
    .tapAsync("ViewerResolvePlugin", (request, resolveContext, callback) => {
        for(var package of modulesToResolveToEs5){
            if(request.request.indexOf(package+"/") == 0){
                const newRequest = Object.assign({}, request, { request: package, });
                return resolver.doResolve(target, newRequest, "viewer resolved", resolveContext, callback);
            }
        }
        
        return callback();
    });
}
