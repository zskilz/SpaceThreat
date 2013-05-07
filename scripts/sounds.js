//____________________________________________
// Audio stuff
//____________________________________________
define(['globals'],function(globals) {
    var audioCtx = 0,
        audioSupported = false,
        compressor = 0,
        mainVol = 0,
        cannonBoomBuffer = 0,
        invaderDroneBuffer = 0,
        invaderVol = 0.06,
        channels = 2,
        sampleRate = 44100,
        realTime = 0.0,
        grainTime = 0.0,
        kGrainSize = 0.10,
        grainDuration = kGrainSize,
        grainSpacing = 0.4 * kGrainSize,
        grainWindow;

    var _export = {
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

            var source = audioCtx.createBufferSource();
            source.buffer = invaderDroneBuffer;


            var panner = audioCtx.createPanner();
            panner.panningModel = webkitAudioPannerNode.EQUALPOWER;
            panner.refDistance = globals.fixedStageDims.width / 8;
            panner.maxDistance = globals.fixedStageDims.width / 2;
            panner.rolloffFactor = 0.4;

            panner.setPosition(globals.flockTarget.x + (globals.invaderSpacing * globals.numInvaderRows / 2) - 
            globals.fixedStageDims.width / 2, globals.flockTarget.y + (globals.invaderSpacing * globals.numInvaderColumns / 2) - globals.fixedStageDims.height / 2, 100);

            // Connect panner to the compressor
            panner.connect(compressor);


            var grainWindowNode;
            grainWindowNode = audioCtx.createGainNode();
            var invaderVolNode = audioCtx.createGainNode();
            invaderVolNode.gain.value = invaderVol;
            source.connect(grainWindowNode);
            grainWindowNode.connect(invaderVolNode);
            invaderVolNode.connect(panner);


            // Time randomization
            var randomGrainOffset = (Math.random() - 0.5) * 2.0 * (invaderDroneBuffer.duration);

            // Schedule sound grain
            source.noteGrainOn(realTime, grainTime + randomGrainOffset, grainDuration);

            // Schedule the grain window.
            // This applies a time-varying gain change for smooth fade-in / fade-out.

            var windowDuration = grainDuration;
            grainWindowNode.gain.value = 0.0; // make default value 0
            grainWindowNode.gain.setValueCurveAtTime(grainWindow, realTime, windowDuration);


            var lastGrainTime = grainTime;

            // Update time params
            realTime += grainSpacing;
            grainTime += speed * grainSpacing;
            if (grainTime > invaderDroneBuffer.duration) grainTime = 0.0;
            if (grainTime < 0.0) grainTime += invaderDroneBuffer.duration; // backwards wrap-around
        },

        scheduleAudio: function() {
            if (audioSupported) {
                if (!globals.gamePause) {
                    var currentTime = audioCtx.currentTime;

                    while (realTime < currentTime + 0.100) {
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


            audioCtx = new AudioContext();

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
                var cannonSource = audioCtx.createBufferSource();
                cannonSource.buffer = cannonBoomBuffer;

                // Spatialization
                var panner = audioCtx.createPanner();


                panner.panningModel = webkitAudioPannerNode.EQUALPOWER;
                panner.refDistance = 200;
                panner.maxDistance = 400;
                panner.setPosition((globals.tank.pos.x - globals.fixedStageDims.width / 2), 0, 100);

                var lpFilter = audioCtx.createBiquadFilter();

                lpFilter.type = 2; // Band-pass filter.
                lpFilter.frequency.value = 80;
                lpFilter.Q.value = 20.0; //1.0/Math.sqrt(2.0);

                cannonSource.connect(lpFilter);


                var boostVol = audioCtx.createGainNode();
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
