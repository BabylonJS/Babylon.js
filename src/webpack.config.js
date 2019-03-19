const babylonWebpackConfig = require('../Tools/WebpackPlugins/babylonWebpackConfig');
const WorkerPlugin = require('worker-plugin');

var config = babylonWebpackConfig({
    module: "core",
    // Worker plugin - https://github.com/GoogleChromeLabs/worker-plugin
    /*
    plugins: [
        new WorkerPlugin({ preserveTypeModule: true }),
    ],
    */

    // Worker loader - https://github.com/webpack-contrib/worker-loader
    moduleRules: [
        /*
        {
            loader: 'worker-loader'
            options: { inline: true }
        }
        */
        /*
        { // https://github.com/webpack-contrib/worker-loader/issues/94#issuecomment-445277682
            test: /physicsWorker\.ts/,
            use: [
                {
            		    loader: 'worker-loader',
            		    options: { name: 'babylon.physicsWorker.js' }
            		},
            		{
            		    loader: 'babel-loader',
          			    options: {
          				      cacheDirectory: true
          			    }
            		}
          	],
        }
        */
        {
            test: /physicsWorker\.ts/,
            use: { loader: 'worker-loader' }
        }
    ],
});

module.exports = config;
