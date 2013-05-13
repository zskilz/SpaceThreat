(function() {
/**
 * almond 0.2.5 Copyright (c) 2011-2012, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);

                name = baseParts.concat(name.split("/"));

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (typeof callback === 'function') {

            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback.apply(defined[name], args);

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        config = cfg;
        if (config.deps) {
            req(config.deps, config.callback);
        }
        return req;
    };

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("almond", function(){});

// Author: Petrus J Pretorius - See README.md for lisence details.
define('globals',[],function() {
    var globals = {
        flockTime: 0,
        mainStage: null,
        stage: null,
        stageWidth: null,
        stageHeight: null,
        tank: null,
        invaders: [],
        invaderSpacing: 70,
        numInvaderRows: 4,
        numInvaderColumns: 5,

        groupHug: false,
        gamePause: true,
        fixedStageDims: {
            "width": 800,
            "height": 600
        }, //all dynamics calculations rely on a constant frame of reference. (This enables me to scale the stage, yet retain the same gameplay)
        pupilRatio: 1.6
    }
    globals.numInvaders = globals.numInvaderRows * globals.numInvaderColumns;
    globals.flockTarget = {
        "x": globals.invaderSpacing / 2,
        "y": globals.invaderSpacing / 2,
        "direction": 1
    }
    return globals;
});
//____________________________________________
// Audio stuff
//
// Author: Petrus J Pretorius - See README.md for lisence details.
//____________________________________________
define('sounds',['globals'],function(globals) {
    var audioSupported = false,
        compressor = 0,
        mainVol = 0,
        cannonBoomBuffer = 0,
        invaderDroneBuffer = 0,
        invaderVol = 0.06,
        channels = 2,
        sampleRate = 44100,       
        grainTime = 0.0,
        kGrainSize = 0.10,
        grainDuration = kGrainSize,
        grainSpacing = 0.4 * kGrainSize,
        grainWindow;

    var _export = {
        audioCtx : 0,
        realTime : 0.0,
        generateAudioBuffer: {


            boomSound: function() {
                var boomTime = 0.8,
                    n = boomTime * sampleRate,
                    buffer = new Array(n),
                    t,
                    fade, fadeSqr,
                    freq = 440;

                for (var i = 0; i < n; i++) {
                    t = i / sampleRate;
                    fade = (n - i) / n;
                    fadeSqr = fade * fade; //square
                    buffer[i] = fadeSqr * Math.sin((freq * fade) * t * Math.PI * 2) * Math.random();
                    buffer[i] += fadeSqr * fadeSqr * Math.sin((12.0 / Math.sqrt(fade * 10)) * t * Math.PI * 2) * 20 * Math.random();
                    buffer[i] *= Math.random();
                }

                return buffer;
            },

            invaderSweep: function() {
                var sweepTime = 3.0,
                    n = sweepTime * sampleRate,
                    buffer = new Array(n),
                    t, f1, f2, f3, v1, v2, v3;

                for (var i = 0; i < n; i++) {
                    t = i / sampleRate;
                    f1 = (sweepTime - t) / sweepTime;
                    f2 = t / sweepTime;
                    f3 = (f1 * f2);
                    v1 = Math.sin(Math.PI * 2 * t * (440.0 * f1));
                    v2 = Math.sin(Math.PI * 2 * t * (220.0 * f2));
                    v2 = v2 > 0 ? 1 : -1;
                    v3 = Math.sin(Math.PI * 2 * t * (550.0 * f3));
                    v3 = v3 > 0 ? 1 : -1;
                    buffer[i] = v1 * v1 - 0.5;
                    buffer[i] -= v2 / 2;
                    buffer[i] += v3 * 0.5;
                    buffer[i] /= 3;
                }

                return buffer;
            },

            smoothWindow: function() {
                // Create a granular synthesis "grain window"
                // Each small audio snippet will have a smooth fade-in / fade-out according to this shape.
                var windowLength = 16384;
                var window = new Float32Array(windowLength);
                for (var i = 0; i < windowLength; ++i)
                window[i] = Math.sin(Math.PI * i / windowLength);
                return window;
            }
        },




        //over-complicated invader chatter noise grain scheduler. taken from google Web Audio API examples.
        scheduleInvaderGrain: function() {

            var speed = 1.0;

            var source = _export.audioCtx.createBufferSource();
            source.buffer = invaderDroneBuffer;


            var panner = _export.audioCtx.createPanner();
            panner.panningModel = webkitAudioPannerNode.EQUALPOWER;
            panner.refDistance = globals.fixedStageDims.width / 8;
            panner.maxDistance = globals.fixedStageDims.width / 2;
            panner.rolloffFactor = 0.4;

            panner.setPosition(globals.flockTarget.x + (globals.invaderSpacing * globals.numInvaderRows / 2) - 
            globals.fixedStageDims.width / 2, globals.flockTarget.y + (globals.invaderSpacing * globals.numInvaderColumns / 2) - globals.fixedStageDims.height / 2, 100);

            // Connect panner to the compressor
            panner.connect(compressor);


            var grainWindowNode;
            grainWindowNode = _export.audioCtx.createGainNode();
            var invaderVolNode = _export.audioCtx.createGainNode();
            invaderVolNode.gain.value = invaderVol;
            source.connect(grainWindowNode);
            grainWindowNode.connect(invaderVolNode);
            invaderVolNode.connect(panner);


            // Time randomization
            var randomGrainOffset = (Math.random() - 0.5) * 2.0 * (invaderDroneBuffer.duration);

            // Schedule sound grain
            source.noteGrainOn(_export.realTime, grainTime + randomGrainOffset, grainDuration);

            // Schedule the grain window.
            // This applies a time-varying gain change for smooth fade-in / fade-out.

            var windowDuration = grainDuration;
            grainWindowNode.gain.value = 0.0; // make default value 0
            grainWindowNode.gain.setValueCurveAtTime(grainWindow, _export.realTime, windowDuration);


            var lastGrainTime = grainTime;

            // Update time params
            _export.realTime += grainSpacing;
            grainTime += speed * grainSpacing;
            if (grainTime > invaderDroneBuffer.duration) grainTime = 0.0;
            if (grainTime < 0.0) grainTime += invaderDroneBuffer.duration; // backwards wrap-around
        },

        scheduleAudio: function() {
            if (audioSupported) {
                if (!globals.gamePause) {
                    var currentTime = _export.audioCtx.currentTime;

                    while (_export.realTime < currentTime + 0.100) {
                        _export.scheduleInvaderGrain();
                    }

                }
                setTimeout(_export.scheduleAudio, 100);
            }

        },

        initAudio: function() {
            if (AudioContext) {

                audioSupported = true;
            }
            else {
                return undefined;
            }


            var audioCtx = _export.audioCtx = new AudioContext();

            if (audioCtx) {

                var boomSoundBuffer = _export.generateAudioBuffer.boomSound();
                cannonBoomBuffer = audioCtx.createBuffer(1, boomSoundBuffer.length, sampleRate);
                cannonBoomBuffer.getChannelData(0).set(boomSoundBuffer);
                var invaderSweepBuffer = _export.generateAudioBuffer.invaderSweep();
                invaderDroneBuffer = audioCtx.createBuffer(1, invaderSweepBuffer.length , sampleRate);
                invaderDroneBuffer.getChannelData(0).set(invaderSweepBuffer);


                mainVol = audioCtx.createGainNode();
                // Connect MainVol to final destination
                mainVol.connect(audioCtx.destination);
                mainVol.gain.value = 0.5;
                compressor = audioCtx.createDynamicsCompressor();

                compressor.connect(mainVol);

                var lpFilter = audioCtx.createBiquadFilter();

                lpFilter.type = 0; // Low-pass filter. See BiquadFilterNode docs
                lpFilter.frequency.value = 80; // Set cutoff to 440 HZ
                lpFilter.Q.value = 20.0; //1.0/Math.sqrt(2.0); // Set cutoff to 440 HZ
                lpFilter.connect(compressor);

                grainWindow = _export.generateAudioBuffer.smoothWindow();

            }

        },

        playCannonSound: function() {
            if (audioSupported) {
                // Create a couple of sources
                var cannonSource = _export.audioCtx.createBufferSource();
                cannonSource.buffer = cannonBoomBuffer;

                // Spatialization
                var panner = _export.audioCtx.createPanner();


                panner.panningModel = webkitAudioPannerNode.EQUALPOWER;
                panner.refDistance = 200;
                panner.maxDistance = 400;
                panner.setPosition((globals.tank.pos.x - globals.fixedStageDims.width / 2), 0, 100);

                var lpFilter = _export.audioCtx.createBiquadFilter();

                lpFilter.type = 2; // Band-pass filter.
                lpFilter.frequency.value = 80;
                lpFilter.Q.value = 20.0; //1.0/Math.sqrt(2.0);

                cannonSource.connect(lpFilter);


                var boostVol = _export.audioCtx.createGainNode();
                boostVol.gain.value = 5.0;

                lpFilter.connect(panner);
                panner.connect(boostVol);
                boostVol.connect(compressor);

                cannonSource.noteOn(0);

            }
        }
    }
    return _export;
})
;
// Author: Petrus J Pretorius - See README.md for lisence details.
define('speech',{
    
    textfont: "18pt Calibri",
    exclamations: ["Whoa!", "Watch out!", "Carefull!", "aaAARGH!", "Damn fool!", "WTF?", "Chill it!", "Seriously?", "Stop that!", "WHY?", "Eek!", "Hey now!", "NOOooo!", "Chips!", "Incoming!", "Yikes!", "Daayyuum!"],
    exclaim: function() {
        return this.exclamations[Math.floor(Math.random() * this.exclamations.length)];
    },

    dialogue: ["EVERYONE! STAY IN FORMATION!.", "Why are we going so slowly?", "It's prescribed in the \"Alien contact manual\".", "But why? What is the sense in it?", "It's to make us appear unthreatening.", "I don't think it is working.", "Look! Just stay in formation!", "TIME TO INNITIATE GROUP HUG!", //gets to about here before group hug.
    "This is embarrasing...", "SHOW THIS ALIEN SOME LOVE!!", "Do not feel embasassed."],
    dialoguePos: 0,
    converse: function() {
        var ret = this.dialogue[this.dialoguePos++];
        if (this.dialoguePos >= this.dialogue.length) this.dialoguePos = 0;
        return ret;
    },
    insults: ["A projectile weapon, how quaint.", "We're flying here!", "We came from outer space man!", "We have all sorts of advanced technology.", "Did I mention we can fly?", "You think a projectile weapon is appropriate?", "Wow. You just keep trying, don't you?", "And you thought that shot would be different?", "I don't think you're a quick learner.", "Look! We're just doing our jobs. OK?", "GET HIM!"],
    insultPos: 0,
    insult: function() {
        var ret = this.insults[this.insultPos++];
        if (this.insultPos >= this.insults.length) this.insultPos = 0;
        return ret;
    }

});
// Author: Petrus J Pretorius - See README.md for lisence details.
define('drawShapes',['globals', 'speech'], function(globals, speech) {
    var drawShapes = {

        makeCannonFlash: function( innerRadius, outerRadius, divs, fill, stroke) {
            var cannonFlash = new Kinetic.Group();
            cannonFlash.innerRadius = innerRadius;
            cannonFlash.outerRadius = outerRadius;
            cannonFlash.divs = divs;
            
            
            
            for (var i = 0; i < 5; i++) {
                var cannonFlashShape = new Kinetic.Shape({
                    drawFunc:drawShapes.flash,
                    name : 'flashShape',
                    fill: fill,
                    stroke: stroke
                });
                cannonFlashShape.setPosition((Math.random() - 0.5) * innerRadius, (Math.random() - 0.5) * innerRadius);
                cannonFlashShape.setRotation(Math.random() * Math.PI / 4);             
                cannonFlash.add(cannonFlashShape);
            }

            return cannonFlash;
        },       
        flash: function(canvas) {
            var context = canvas.getContext(),
            parent = this.getParent(),
                innerRadius = parent.innerRadius,
                outerRadius = parent.outerRadius,
                divs = parent.divs,
                time = globals.flockTime,
                t = 1;

            if (typeof(parent.timeToDie) === "undefined") {
                parent.timeToDie = time + parent.flashTime;

            }
            else {
                t = (parent.timeToDie - time) / parent.flashTime;
                
            }
            
            this.setOpacity(t*t*t);

            context.beginPath();

            var arc = Math.PI * 2.0 / divs;
            var term, xcp1, ycp1, xcp2, ycp2, x, y;

            context.moveTo(outerRadius, 0);

            for (var i = 0; i < divs; i++) {
                term = arc * (i + 1);
                x = Math.cos(term);
                y = Math.sin(term);
                term -= arc / 3;
                xcp2 = Math.cos(term);
                ycp2 = Math.sin(term);
                term -= arc / 3;
                xcp1 = Math.cos(term);
                ycp1 = Math.sin(term);

                context.bezierCurveTo(xcp1 * innerRadius, ycp1 * innerRadius,
                xcp2 * innerRadius, ycp2 * innerRadius,
                x * outerRadius, y * outerRadius);


            }

            context.closePath();
            canvas.fillStroke(this);

        },

        speechBubbleDraw: function(canvas) {
            var context = canvas.getContext();

            var l = 20;
            var w = this.w;
            var w1 = w / 2 - w * 0.2;
            var w2 = 10;
            var h = this.h;
            var r = 10; //corner rounding radius
            var text = this.text;

            context.beginPath();

            context.moveTo(0, 0);
            context.lineTo(-w / 2 + w1 + w2, l);
            context.arcTo(w / 2, l, w / 2, l + h, r);
            context.arcTo(w / 2, l + h, - w / 2, l + h, r);
            context.arcTo(-w / 2, l + h, - w / 2, l, r);
            context.arcTo(-w / 2, l, - w / 2 + w1, l, r);

            context.lineTo(-w / 2 + w1, l);

            context.lineTo(0, 0);
            context.fillStyle = "#EEE";
            context.fill();
            context.lineWidth = 2;
            context.strokeStyle = "black";
            context.stroke();
            context.font = speech.textfont;
            context.fillStyle = "black";
            context.fillText(text, - w / 2 + 4, h / 2 + l + 8);
        },
        tankDraw: function(canvas) {
            var context = canvas.getContext();

            var size = this.size;


            //barrel
            context.beginPath();
            context.moveTo(size / 6, 0);
            context.lineTo(size / 8, - size);
            context.lineTo(-size / 8, - size);
            context.lineTo(-size / 6, 0);
            context.closePath();

            var barrelGrd = context.createLinearGradient(size / 8, 0, - size / 8, 0);
            barrelGrd.addColorStop(0, this.fillStyle);
            barrelGrd.addColorStop(0.5, "#FFF");
            barrelGrd.addColorStop(1, this.fillStyle);

            context.fillStyle = barrelGrd;
            context.fill();
            context.lineWidth = 2;
            context.strokeStyle = this.strokeStyle;
            context.stroke();

            //Turret


            var turrSize = size * 0.3;

            var turretGrd = context.createRadialGradient(turrSize * 0.4, - turrSize * 0.4, 0, 0, 0, turrSize);
            turretGrd.addColorStop(0, "#FFF");
            turretGrd.addColorStop(1, this.fillStyle);

            drawShapes.circle(context, turrSize, turretGrd, this.strokeStyle, 2);

            //Chasis
            context.beginPath();

            context.moveTo(size, size);
            context.lineTo(size, size / 6);
            context.lineTo(size / 5, 0);
            context.lineTo(-size / 5, 0);
            context.lineTo(-size, size / 6);
            context.lineTo(-size, size);
            context.closePath();

            var tankGrd = context.createRadialGradient(size * 0.1, - size * 0.4, 0, 0, size * 0.3, size);
            tankGrd.addColorStop(0, "#FFF");
            tankGrd.addColorStop(1, this.fillStyle);

            context.fillStyle = tankGrd;
            context.fill();
            context.lineWidth = 2;
            context.strokeStyle = this.strokeStyle;
            context.stroke();


        },

        
        circle: function(context, r, fillStyle, strokeStyle, lineWidth, offSetPos) {
            if (typeof(lineWidth) === "undefined") lineWidth = 1;
            if (typeof(offSetPos) === "undefined") offSetPos = {
                "x": 0,
                "y": 0
            };

            context.beginPath();
            context.arc(offSetPos.x, offSetPos.y, r, 0, 2 * Math.PI, false);
            context.fillStyle = fillStyle;
            context.fill();
            context.lineWidth = lineWidth;
            context.strokeStyle = strokeStyle;
            context.stroke();
        },
        gear: function(canvas) {

            var context = canvas.getContext(),
                innerRadius = this.innerRadius,
                spokeHeight = this.spokeHeight,
                epsilon = this.epsilon,
                divs = this.divs;


            context.beginPath();

            var gearArc = Math.PI / divs;
            var term;


            for (var i = 0; i < divs * 2; i += 2) {
                term = gearArc * (i + 1);
                context.arc(0, 0, innerRadius + spokeHeight, gearArc * i + epsilon, term - epsilon, false);
                context.arc(0, 0, innerRadius, gearArc * i + gearArc + epsilon, term + gearArc - epsilon, false);

            }

            context.closePath();
            canvas.fillStroke(this);
        },

        eyeBall: function(canvas) {
            var context = canvas.getContext(),
                target = this.getParent().lookAtTarget.getPosition(),
                radius = this.radius,
                pos = this.getParent().getPosition(),
                thisPos = this.getPosition(),
                pupilRatio = globals.pupilRatio,
                eye = new Object(),
                limit = radius - radius / pupilRatio;



            var dir = {
                "x": target.x - (pos.x + thisPos.x + globals.flockTarget.x),
                "y": target.y - (pos.y + thisPos.y + globals.flockTarget.y)
            };

            var dist = Math.sqrt(Math.pow(dir.x, 2) + Math.pow(dir.y, 2));
            eye.x = (dist > limit) ? (dir.x * limit / dist) : (dir.x);
            eye.y = (dist > limit) ? (dir.y * limit / dist) : (dir.y);
            drawShapes.circle(context, radius, "#FFF", "#000", 2);
            drawShapes.circle(context, radius / pupilRatio, "#000", "#000", 1, {
                "x": eye.x,
                "y": eye.y
            });

        },
        tentacle: function(canvas) {
            var context = canvas.getContext();
            var speed = 7;
            var t = ((globals.flockTime * speed) % (2 * Math.PI));
            var l = this.l;
            context.beginPath();
            context.moveTo(0, 8);
            context.bezierCurveTo(l / 3, Math.sin(t) * 5, 7 * l / 8, Math.sin(t + Math.PI / 8) * 10, l, Math.sin(t + Math.PI / 7) * 5);
            context.bezierCurveTo(7 * l / 8, Math.sin(t + Math.PI / 8) * 10, l / 3, Math.sin(t) * 5, 0, - 10);
            context.lineWidth = 3;
            canvas.fillStroke(this);
        },


        drawBackDrop: function(canvas) {
            var context = canvas.getContext();
            var fixedStageDims = globals.fixedStageDims;
            var _W = globals.fixedStageDims.width,
                _H = globals.fixedStageDims.height;

            context.beginPath();
            context.rect(0, 0, _W, fixedStageDims.height);

            var grd = context.createLinearGradient(0, _H, 0, 0);
            grd.addColorStop(0, "#FFF");
            grd.addColorStop(0.3, "#BEE");
            grd.addColorStop(1, "#006");

            context.fillStyle = grd;
            context.fill();


            //draw some buildings:
            var numBuildings = 160,
                maxWidth = 50,
                minWidth = 10,
                maxHeight = 100,
                minHeight = 20,
                w, h, pos;

            context.lineWidth = 1;
            context.strokeStyle = "#646464";
            for (var i = 0; i < numBuildings; i++) {
                pos = Math.random() * _W;
                w = Math.random() * (maxWidth - minWidth) + minWidth;
                h = Math.random() * (maxHeight - minHeight) + minHeight;
                context.beginPath();
                context.rect(pos - w / 2, _H - h, w, h);
                context.fillStyle = "rgb(" + (125 + Math.floor(Math.random() * 15)) + "," + (125 + Math.floor(Math.random() * 15)) + "," + (125 + Math.floor(Math.random() * 45)) + ")";
                context.fill();
                context.stroke();
            }

            //The track
            context.fillStyle = "#444";
            var trackWidth = 5;
            context.beginPath();
            context.moveTo(0, _H);
            context.lineTo(0, _H - trackWidth * 3);
            context.lineTo(trackWidth, _H - trackWidth * 3);
            context.lineTo(trackWidth, _H - trackWidth);
            context.lineTo(_W - trackWidth, _H - trackWidth);
            context.lineTo(_W - trackWidth, _H - trackWidth * 3);
            context.lineTo(_W, _H - trackWidth * 3);
            context.lineTo(_W, _H);
            context.closePath();
            context.fill();
            context.stroke();

        }

    }
    return drawShapes;
});
/*
  Game script for "Invaders from space! OMG!"(working title)
  Author: Petrus J. Pretorius
  First revision:(22 Jan 2012)
  Dependencies: drawShapes.js, speech.js, jquery-1.7.1.js,
    kinetic-v3.6.2.js (patched line 170:
Kinetic.Layer.prototype.remove = function(shape){
    if (shape.name) {
        delete this.shapeNames[shape.name];
    } .... )
    
    TODO: add these.
        <form>
			<input id="controlInput" type="text" />
		</form>
		<div id="mainStage" ></div>
		<button id="restart">
			RESTART
		</button>

  */



define('game', ['sounds', 'speech', 'drawShapes', 'globals'], function(sounds, speech, drawShapes, globals) {

    window.AudioContext = window.AudioContext || window.webkitAudioContext;


    window.requestAnimFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function(callback) {
        window.setTimeout(callback, 1000 / 60);
    };

    //the keys
    var keyMap = {};
    var gameCntrls = ["left", "right", "shoot"];
    var cntrlMap = {
        "left": 37,
        "right": 39,
        "shoot": 38
    }; //default keys
    var checkKey = function(key) {
        for (var i = 0; i < gameCntrls.length; i++) {
            if (cntrlMap[gameCntrls[i]] == key) return true;
        }
    }

    var limitTweak = 15;

    var processTank = function(timeDiff) {
        var moveDelta = 0;
        var speed = globals.groupHug ? 30 : 100;
        //px/s

        if (keyMap[cntrlMap["left"]]) {
            moveDelta += -speed;
        }
        if (keyMap[cntrlMap["right"]]) {
            moveDelta += speed;
        }

        //tank moving dynamics
        var tank = globals.tank;
        tank.pos.x += (moveDelta * timeDiff);
        if (tank.pos.x < (tank.size + limitTweak)) tank.pos.x = tank.size + limitTweak;
        if (tank.pos.x > globals.fixedStageDims.width - tank.size - limitTweak) tank.pos.x = globals.fixedStageDims.width - tank.size - limitTweak;

        tank.setPosition(tank.pos.x, tank.pos.y);

        //rotate the wheels..
        var wheels = tank.wheels;
        for (var wheel = 0; wheel < tank.numWheels; wheel++) {

            wheels[wheel].setRotation(tank.pos.x / tank.wheelRadius / 2.0);


        }

    }

    //create a random array for hug positions.
    var hugPositions = [];
    for (var i = 0; i < globals.numInvaders; i++) {
        hugPositions.push({
            "x": Math.random() * 100 - 50,
            "y": Math.random() * -50
        });
    }

    var speakingInterval = 5.0;
    var timeToSpeak = speakingInterval / 3.0;
    var converseSwitch = 0;

    var processInvaders = function(timeDiff) {
        globals.flockTime += timeDiff;
        var flockTarget = globals.flockTarget;
        var numInvaderRows = globals.numInvaderRows;
        var numInvaderColumns = globals.numInvaderColumns;
        var numInvaders = globals.numInvaders;
        var invaderSpacing = globals.invaderSpacing;
        var fixedStageDims = globals.fixedStageDims;
        var tank = globals.tank;

        if ((flockTarget.y + numInvaderRows * invaderSpacing) < (fixedStageDims.height - invaderSpacing * 0.7)) //groupHug condition is that invaders reach the bottom
        {
            //flockTarget should sweep out the invaders' entry pattern
            var powTerm = Math.pow(Math.sin(globals.flockTime * 3.0), 2);
            //the jitter "march"
            flockTarget.x += powTerm * invaderSpacing * timeDiff * flockTarget.direction;

            //when they reach the end of the screen the target goes one row down and they reverse direction.
            if ((flockTarget.x + numInvaderColumns * invaderSpacing - (invaderSpacing / 2.0)) > fixedStageDims.width) {
                if (flockTarget.direction != -1) {
                    flockTarget.y += invaderSpacing;
                    flockTarget.direction = -1;
                }
            }
            else if (flockTarget.x < (invaderSpacing / 2.0)) {
                if (flockTarget.direction != 1) {
                    flockTarget.y += invaderSpacing;
                    flockTarget.direction = 1;
                }
            }
        }
        else {
            globals.groupHug = true;
        }

        var shapesLayer = globals.stage.get("#Shapes")[0];
        var projectile = shapesLayer.get("#projectile")[0];
        var invader, invadersGroup = globals.invaders,
            invaders = invadersGroup.getChildren();


        // moving dynamics

        var pos = invadersGroup.getPosition();
        invadersGroup.setPosition(pos.x + (flockTarget.x - pos.x) * 0.1, pos.y + (flockTarget.y - pos.y) * 0.06);
        for (var i = 0; i < numInvaders; i++) {
            invader = invaders[i];

            if (globals.groupHug) {
                // hugging dynamics 

                invader.pos.x += ((tank.pos.x + hugPositions[i].x) - invader.pos.x - pos.x) * 0.06;
                invader.pos.y += ((tank.pos.y + hugPositions[i].y) - invader.pos.y - pos.y) * 0.05;
            }
            else {
                //centering
                var gridPos = {
                    "x": i % numInvaderColumns,
                    "y": Math.floor(i / numInvaderColumns)
                };
                invader.pos.x += (gridPos.x * invaderSpacing - invader.pos.x) * 0.06;
                invader.pos.y += (gridPos.y * invaderSpacing - invader.pos.y) * 0.05;
            }

            if (projectile) {
                //make a normal vector, and calculate the distance while we're at it.
                var u = {
                    "x": (invader.pos.x - projectile.pos.x + pos.x),
                    "y": (invader.pos.y - projectile.pos.y + pos.y)
                };
                var dist = Math.sqrt(Math.pow(u.x, 2) + Math.pow(u.y, 2));
                u.x = u.x / dist;
                u.y = u.y / dist;
                var spacing = (invaderSpacing);
                if (dist < spacing) {
                    var fact = Math.pow((spacing - dist) / (spacing), 2) * 30;
                    invader.pos.x += u.x * fact * 3;
                    //increase likelyness of moving "side-ways"
                    invader.pos.y += u.y * fact;

                    invader.lookAtTarget = projectile;

                    //possible exclamations:
                    if ((!invader.speaking) && (i > numInvaderColumns)) {
                        //do a roll
                        if (Math.random() < 0.01) {
                            invader.speak(speech.exclaim(), 1);
                        }
                    }
                }
                else {
                    invader.lookAtTarget = tank;
                }
            }
            invader.setPosition(invader.pos.x, invader.pos.y);
        }

        //general speech.
        if (timeToSpeak < 0) {
            if (globals.groupHug) {
                for (var j = 0; j < numInvaders; j += 3) {
                    invaders[j].speak("GROUP HUG!", 2);
                }
                timeToSpeak = speakingInterval * 100;
            }
            else {

                //if the player has attacked since last speakingInterval, insult them
                if (tank.attacking) {
                    //pick a random invader, but not from top row..
                    invader = invaders[Math.floor(Math.random() * (invaders.length - numInvaderColumns)) + numInvaderColumns];
                    tank.attacking = false;
                    invader.speak(speech.insult(), 2);
                }

                // carry on talking (we have the middle top bunch of invaders chatting
                var converseInvader = converseSwitch + Math.floor(numInvaderColumns / 2);
                converseSwitch++;
                if (converseSwitch > 1) converseSwitch = 0;
                while (invaders[converseInvader].speaking) {
                    converseInvader++;
                }
                invader = invaders[converseInvader];
                //pick the speaking invader

                invader.speak(speech.converse(), 3);
                timeToSpeak = speakingInterval;
            }

        }
        else {
            timeToSpeak -= timeDiff;
        }
    }

    var projectileSpeed = 200;

    var processProjectile = function(timeDiff) {
        var shapesLayer = globals.stage.get("#Shapes")[0];
        var projectile = shapesLayer.get("#projectile")[0];
        var tank = globals.tank;

        if (projectile) {
            projectile.pos.y -= projectileSpeed * timeDiff;
            projectile.setPosition(projectile.pos.x, projectile.pos.y);
            if (projectile.pos.y < -200) {
                projectile.remove();
            }
            else {
                //make trails
                var trailTime = 1.9;
                var trail = drawShapes.makeCannonFlash(5, 8, 5, "rgba(255,225,200,0.1)", "rgba(255,225,200,0.1)");
                trail.setPosition(projectile.pos.x, projectile.pos.y);
                trail.flashTime = trailTime;

                shapesLayer.add(trail);

                window.setTimeout(function() {
                    trail.remove();
                }, trailTime * 1000);
            }
        }
        else {
            if (!globals.groupHug && keyMap[cntrlMap["shoot"]]) {

                tank.attacking = true;
                projectile = new Kinetic.Circle({
                    id: 'projectile',
                    radius: 5,
                    fill: '#FAC',
                    stroke: '#700'
                });
                projectile.pos = {
                    "x": tank.pos.x,
                    "y": tank.pos.y - tank.size
                };

                projectile.setPosition(projectile.pos.x, projectile.pos.y);

                shapesLayer.add(projectile);

                sounds.playCannonSound();

                var flashTime = 0.3;
                var flash = drawShapes.makeCannonFlash(5, 30, 6, "rgba(255,255,0,0.3)", "rgba(255,255,255,0.1)");

                flash.setPosition(tank.pos.x, (tank.pos.y - tank.size));
                flash.flashTime = flashTime;

                shapesLayer.add(flash);

                window.setTimeout(function() {
                    flash.remove();
                }, flashTime * 1000);
            }
        }
        //finally, "jitter the flashes"
        var flashShapes = globals.stage.get(".flashShape");
        $.each(flashShapes, function(i, cannonFlashShape) {
            var parent = cannonFlashShape.getParent();
            cannonFlashShape.setPosition((Math.random() - 0.5) * parent.innerRadius, (Math.random() - 0.5) * parent.innerRadius);
            cannonFlashShape.setRotation(Math.random() * Math.PI / 4);
        });

    }

    var chatter = [];
    var textDims = function(text, font) {
        var testEl = $("<div>").css("font", font).css("display", "inline").html(text);
        $("body").append(testEl);
        var ret = {
            "width": $(testEl).width(),
            "height": $(testEl).height()
        };
        $(testEl).remove();
        return ret;
    }
    var speakInvader = function(text, speakTime) {
        if (!this.speaking) {
            this.speaking = true;
            var dims = textDims(text, speech.textfont);
            var bubble = new Kinetic.Shape();
            bubble.setDrawFunc(drawShapes.speechBubbleDraw);
            bubble.w = dims.width + 7;
            bubble.h = dims.height + 7;
            bubble.text = text;
            bubble.invaderNum = this.invaderNum;

            chatter.push(bubble);

            globals.stage.get("#Speech")[0].add(bubble);

            var invader = this;
            //store "this" for closure
            window.setTimeout(function() {
                var i = chatter.indexOf(bubble);
                chatter.splice(i, 0);
                //already have the bubble, no need to get again
                bubble.remove();
                invader.speaking = false;
            }, speakTime * 1000);
        }
    }

    var processSpeechBubbles = function(timeDiff) {
        var invaders = globals.invaders.getChildren();
        var flockPos = globals.invaders.getPosition();
        for (var i = 0; i < chatter.length; i++) {
            var bubble = chatter[i];
            var invader = invaders[bubble.invaderNum];
            var pos = invader.getPosition();

            bubble.setPosition(pos.x + flockPos.x, pos.y + flockPos.y);
        }

    }

    var animate = function(timeDiff) {
        // update

        if (!globals.gamePause) {

            processTank(timeDiff);
            processInvaders(timeDiff);
            processProjectile(timeDiff);

        }


    };

    var globalScale = 1.0;

    var resizeStage = function() {
        var stage = globals.stage;
        if (stage !== null) {
            globals.stageWidth = globals.mainStage.width() - 2;
            globals.stageHeight = globals.mainStage.height() - 2;
            var stageAspect = globals.stageWidth / globals.stageHeight;
            var aspect = globals.fixedStageDims.width / globals.fixedStageDims.height;
            var canvasWidth;
            if (stageAspect > aspect) {
                globalScale = globals.stageHeight / globals.fixedStageDims.height;
                canvasWidth = globals.stageWidth * aspect / stageAspect;
                stage.setSize(canvasWidth, globals.stageHeight);
            }
            else {
                globalScale = globals.stageWidth / globals.fixedStageDims.width;
                canvasWidth = globals.stageWidth;
                stage.setSize(canvasWidth, globals.stageHeight / aspect * stageAspect);

            }
            stage.setScale(globalScale);
        }
    }

    $(window).resize(resizeStage);

    var initGame = function() {
        speech.dialoguePos = 0;
        speech.insultPos = 0;
        globals.flockTarget = {
            "x": globals.invaderSpacing / 2,
            "y": globals.invaderSpacing / 2,
            "direction": 1
        };
        globals.groupHug = false;
        var tank = globals.tank;
        tank.pos = {
            "x": globals.fixedStageDims.width / 2,
            "y": globals.fixedStageDims.height - 40
        };
        tank.setPosition(tank.pos.x, tank.pos.y);
        timeToSpeak = speakingInterval / 3.0;
        converseSwitch = 0;

    }
    var unpause = function() {
        if (sounds.audioCtx) //fix sound stutters.
        sounds.realTime = sounds.audioCtx.currentTime;
        globals.gamePause = false;
    }
    var pause = function() {
        globals.gamePause = true;
    }

    var initInvader = function(i, lookAtTarget) {
        var innerRadius = globals.invaderSpacing / 4;
        var invader = new Kinetic.Group();
        invader.speak = speakInvader;
        invader.radius = 30;
        invader.invaderNum = i;
        invader.speaking = false;
        invader.lookAtTarget = lookAtTarget;

        var invaderBody = new Kinetic.Circle({
            radius: innerRadius,
            stroke: "rgba(0,0,0,0.5)",
            fillRadialGradientStartPoint: [innerRadius / 4, - innerRadius / 4],
            fillRadialGradientStartRadius: 0,
            fillRadialGradientEndPoint: 0,
            fillRadialGradientEndRadius: innerRadius,
            fillRadialGradientColorStops: [0, "#FFF", 1, "rgba(125,255,125,0.5)"]
        });
        invader.add(invaderBody);

        var numTentaclesPerSide = 3,
            nT, arcSweep = (Math.PI / 2.0) / numTentaclesPerSide;

        for (nT = 0; nT < numTentaclesPerSide; nT++) {
            var tentacle = invaderBody.clone();
            tentacle.setDrawFunc(drawShapes.tentacle);
            tentacle.setName('tentacle');

            tentacle.l = globals.invaderSpacing / 4 - 2;
            tentacle.setPosition(innerRadius * Math.cos(arcSweep * nT), innerRadius * Math.sin(arcSweep * nT));
            tentacle.setRotation(arcSweep * nT);
            invader.add(tentacle);
        }

        for (nT = 0; nT < numTentaclesPerSide; nT++) {
            var tentacle = invaderBody.clone();
            tentacle.setDrawFunc(drawShapes.tentacle);
            tentacle.setName('tentacle');

            tentacle.l = -globals.invaderSpacing / 4 - 2;
            tentacle.setPosition(-innerRadius * Math.cos(arcSweep * nT), innerRadius * Math.sin(arcSweep * nT));
            tentacle.setRotation(-arcSweep * nT);
            invader.add(tentacle);
        }

        //eyeballs
        var eyeL = new Kinetic.Shape({
            drawFunc: drawShapes.eyeBall,
            x: -10
        });
        eyeL.radius = 8 + Math.round((Math.random() + 0.5) * 2.0);
        var eyeR = new Kinetic.Shape({
            drawFunc: drawShapes.eyeBall,
            x: 10
        });
        eyeR.radius = 8 + Math.round((Math.random() + 0.5) * 2.0);

        invader.add(eyeL);
        invader.add(eyeR);

        //init invader positions
        var gridPos = {
            "x": i % globals.numInvaderColumns,
            "y": Math.floor(i / globals.numInvaderColumns)
        }
        invader.pos = {
            'x': gridPos.x * globals.invaderSpacing,
            'y': gridPos.y * globals.invaderSpacing
        };
        invader.setPosition(invader.pos.x, invader.pos.y);
        return invader;
    }

    var initInvaders = function(lookAtTarget) {
        //init invaders
        var invaders = new Kinetic.Group();
        for (var i = 0; i < globals.numInvaders; i++) {
            var invader = initInvader(i, lookAtTarget);

            invaders.add(invader);

        }

        return invaders;
    }

    var initTank = function() {
        //init the player tank

        var tank = new Kinetic.Group();
        tank.attacking = false;

        var chasis = new Kinetic.Shape();
        chasis.setDrawFunc(drawShapes.tankDraw);
        tank.size = chasis.size = 30;
        chasis.fillStyle = "#B55";
        chasis.strokeStyle = "black";
        tank.add(chasis);


        //wheel shapes
        var gearShape = new Kinetic.Shape({
            drawFunc: drawShapes.gear,
            fillRadialGradientStartPoint: 0,
            fillRadialGradientStartRadius: 0,
            fillRadialGradientEndPoint: 0,
            fillRadialGradientEndRadius: 0,
            fillRadialGradientColorStops: [0, "#FFA", 0.4, "#FFA", 0.45, "#000", 0.5, "#555", 1, "#111"],
            strokeStyle: chasis.strokeStyle
        });

        gearShape.innerRadius = chasis.size / 4.1;
        gearShape.spokeHeight = gearShape.innerRadius / 5;
        tank.wheelRadius = gearShape.innerRadius + gearShape.spokeHeight;

        gearShape.setFillRadialGradientEndRadius(tank.wheelRadius);

        //the wheels
        tank.numWheels = 4;
        var wheels = tank.wheels = [];

        for (var wheel = 0; wheel < tank.numWheels; wheel++) {
            wheels[wheel] = gearShape.clone();
            wheels[wheel].innerRadius = gearShape.innerRadius;
            wheels[wheel].spokeHeight = gearShape.spokeHeight;
            wheels[wheel].epsilon = 0.09;
            wheels[wheel].divs = 7;
            wheels[wheel].setPosition(-chasis.size + wheel * ((chasis.size) * 2 / (tank.numWheels - 1)), chasis.size - gearShape.innerRadius / 2);
            tank.add(wheels[wheel]);

        }

        return tank;
    }

    //========================================================================================================
    // Starting point.
    //========================================================================================================
    var init = function(_mainStage) {
        //add the initial components..
        var mainStage = $('#' + _mainStage);
        mainStage.append('<form><input id="controlInput" type="text" /></form>');
        mainStage.after('<button id="restart">RESTART</button>');
        sounds.initAudio();
        globals.mainStage = mainStage;

        globals.stageWidth = mainStage.width() - 2;
        globals.stageHeight = mainStage.height() - 2;
        globals.stage = new Kinetic.Stage({
            container: _mainStage,
            width: globals.stageWidth,
            height: globals.stageHeight,
            listening:false
        });

        resizeStage();
        //first set up the background
        var bgLayer = new Kinetic.Layer({
            id: "BackDrop"
        });
        var bg = new Kinetic.Shape({
            drawFunc: drawShapes.drawBackDrop
        });
        bgLayer.add(bg);
        globals.stage.add(bgLayer);

        var shapesLayer = new Kinetic.Layer({
            id: "Shapes"
        });
        var speechLayer = new Kinetic.Layer({
            id: "Speech"
        });

        globals.stage.add(shapesLayer);
        globals.stage.add(speechLayer);

        globals.tank = initTank();
        shapesLayer.add(globals.tank);

        globals.invaders = initInvaders(globals.tank);
        shapesLayer.add(globals.invaders);
        initGame();

        var date = new Date();
        var time = date.getTime();

        $("#controlInput").focus(unpause);
        $("#controlInput").blur(pause);

        $("#controlInput").focus();

        mainStage.click(function() {
            $("#controlInput").focus();
        });

        $("#controlInput").keydown(function(e) {

            if (e.which === 27) {
                $("#controlInput").blur();
                return;
            }

            if (checkKey(e.which)) {
                keyMap[e.which] = true;
            }
            e.preventDefault();

        });

        $("#controlInput").keyup(function(e) {
            if (checkKey(e.which)) {
                keyMap[e.which] = false;
            }
            e.preventDefault();
        });

        $("#restart").click(initGame);



        var anim = new Kinetic.Animation(function(frame) {
            var //time = frame.time,
            timeDiff = frame.timeDiff / 1000.0; //,
            //frameRate = frame.frameRate;
            animate(timeDiff);
            // update stuff
        }, shapesLayer);


        var anim2 = new Kinetic.Animation(function(frame) {
            var //time = frame.time,
            timeDiff = frame.timeDiff / 1000.0; //,
            //frameRate = frame.frameRate;
            processSpeechBubbles(timeDiff);
            // update stuff
        }, speechLayer);

        anim.start();
        anim2.start();

        sounds.scheduleAudio();

    };

    return {
        init: init
    };
});
spacethreat = require('game');}());