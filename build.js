({
    baseUrl: 'scripts',
    optimize: "none",
    name: 'almond',
    shim: {
        'game': {
            deps: [ 'sounds', 'speech', 'drawShapes', 'globals'],
            exports: 'spacethreat'
        }
    },
    paths:{
        jquery: 'empty:',
        kinetic: 'empty:'
    },
    include: ['game'],
    out: 'build/spacethreat.js',
    wrap: {
        start: "(function() {",
        end: "spacethreat = require('game');}());"
    },
})