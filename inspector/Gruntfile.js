module.exports = function (grunt) {
    
    // load all grunt tasks
    require('jit-grunt')(grunt);    

    grunt.initConfig({
        
        clean: {
            init: ['dist/libs/inspector.js', 'dist/libs/main.css', 'dist/inspector.js', 'dist/inspector.d.ts'],
            compilation: ['dist/inspector/', 'dist/libs/inspector.js', 'dist/libs/main.css']
        },

        // Compilation from TypeScript to ES5²
        ts: {
            inspector: {
                src : ['ts/**/*.ts', 'ts/typings/**/*'],
                outDir: "dist",
                options:{
                    module: 'amd',
                    target: 'es5',
                    declaration: true,
                    sourceMap:true,
                    removeComments:false
                }
            }
        },
        // Concat definition files 
        concat: {
            inspector: {
                files: {
                    'dist/inspector.d.ts': ['dist/inspector/**/*.d.ts']
                },
            },
        },
        // Watches content related changes
        watch : {
            inspector : {
                files: ['ts/inspector/**/*.ts'],
                tasks: ['ts']
            },
            test : {
                files: ['ts/test/**/*.ts'],
                tasks: ['ts']
            },
            sass : {
                files: ['sass/**/*.scss'],
                tasks: ['sass','postcss']
            }
        },
        // Sass compilation. Produce an extended css file in css folder
        sass : {
            options: {
                sourcemap:'none',
                style: 'expanded'
            },
            dist : {
                files: {
                    'dist/libs/main.css': 'sass/main.scss'
                }
            }
        },
        // Auto prefixer css
        postcss : {
            dist: {
                options: {
                    processors: [
                        require('autoprefixer')({browsers: 'last 2 versions'}),
                        require('cssnano')()
                    ]
                },
                src: 'dist/libs/main.css'
            }
        },
        // Build dist version
        uglify : {
            dist: {
                options: {
                    compress:false,
                    beautify: true
                },
                files: {
                    'dist/libs/inspector.js': [
                        'dist/inspector/gui/BasicElement.js',
                        'dist/inspector/gui/CubeTextureElement.js',
                        'dist/inspector/adapters/Adapter.js',
                        'dist/inspector/tabs/Tab.js',
                        'dist/inspector/tabs/PropertyTab.js',
                        'dist/inspector/tools/AbstractTool.js',
                        'dist/inspector/treeTools/AbstractTreeTool.js',
                        'dist/inspector/**/*.js']
                }
            }
        },
        //Server creation
        connect: {
            server: {
                options: {
                    port: 3000,
                    base: '.'
                }
            },
            test: {
                options: {
                    port: 3000,
                    base: '.',
                    keepalive:true
                }
            }
        },
        // Open default browser
        open: {
            local: {
                path: 'http://localhost:3000/dist/test'
            }
        },
        webpack: {
            inspector: require("./webpack.config.js")
        }
    }); 

    grunt.registerTask('default', 'Compile and watch source files', [
        'dev',
        'connect:server',
        'open',
        'watch'
    ]);

    grunt.registerTask('dev', 'build dev version', [
        'clean:init',
        'ts',
        'sass',
        'postcss', 
    ]);

    grunt.registerTask('test', 'test dist version', [
        'open',
        'connect:test'
    ]);

    // Compilation and webpack
    grunt.registerTask('dist', 'build dist version', [
        'dev',
        'uglify',
        'concat',
        'webpack',
        'clean:compilation'
    ]);

};


