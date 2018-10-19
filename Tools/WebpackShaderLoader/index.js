//modified https://github.com/grieve/webpack-glsl-loader/blob/master/index.js
let parser = require('./parser')

module.exports = function (source) {
    this.cacheable();
    var cb = this.async();
    parser(this, source, this.context, function (err, bld) {
        if (err) {
            return cb(err);
        }

        cb(null, 'module.exports = ' + JSON.stringify(bld));
    });
};