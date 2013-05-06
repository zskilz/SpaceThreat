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



define('game', ['kinetic', 'sounds', 'speech', 'drawShapes', 'globals'], function(Kinetic, sounds, speech, drawShapes, globals) {

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



    function processTank(timeDiff) {
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

    function processInvaders(timeDiff) {
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

    function processProjectile(timeDiff) {
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
                var trail = new Kinetic.Shape(drawShapes.cannonFlashDraw);
                trail.innerRadius = 5;
                trail.outerRadius = 8;
                trail.divs = 5;
                trail.fashScale = 2;
                trail.fillStyle = "rgba(255,225,200,0.1)";
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
                projectile = new Kinetic.Shape({
                    id: 'projectile'
                });
                projectile.setDrawFunc(drawShapes.projectileDraw);
                projectile.fillStyle = "#FAC";
                projectile.strokeStyle = "#700";
                projectile.pos = {
                    "x": tank.pos.x,
                    "y": tank.pos.y - tank.size
                };

                projectile.setPosition(projectile.pos.x, projectile.pos.y);

                shapesLayer.add(projectile);

                sounds.playCannonSound();

                var flashTime = 0.3;
                var flash = new Kinetic.Shape()
                flash.setDrawFunc(drawShapes.cannonFlashDraw);
                flash.innerRadius = 5;
                flash.outerRadius = 30;
                flash.divs = 6;
                flash.fashScale = 10;
                flash.fillStyle = "rgba(255,255,190,0.2)";
                flash.setPosition(tank.pos.x, (tank.pos.y - tank.size));
                flash.flashTime = flashTime;

                shapesLayer.add(flash);

                window.setTimeout(function() {
                    flash.remove();
                }, flashTime * 1000);
            }
        }
    }

    var flash;
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

        function processSpeechBubbles(timeDiff) {
            var invaders = globals.invaders.getChildren();
            var flockPos = globals.invaders.getPosition();
            for (var i = 0; i < chatter.length; i++) {
                var bubble = chatter[i];
                var invader = invaders[bubble.invaderNum];
                var pos = invader.getPosition();

                bubble.setPosition(pos.x + flockPos.x, pos.y + flockPos.y);
            }

        }

        function animate(timeDiff) {
            // update

            if (!globals.gamePause) {

                processTank(timeDiff);
                processInvaders(timeDiff);
                processProjectile(timeDiff);

            }


        }

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
            fillRadialGradientStartPoint: [innerRadius/4,-innerRadius/4],
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
        var eyeL = new Kinetic.Shape({drawFunc:drawShapes.eyeBall,x:-10});
        eyeL.radius = 8+Math.round((Math.random()+0.5)*2.0);
        var eyeR = new Kinetic.Shape({drawFunc:drawShapes.eyeBall,x:10});
        eyeR.radius = 8+Math.round((Math.random()+0.5)*2.0);
        
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
        //initAudio();
        globals.mainStage = mainStage;

        globals.stageWidth = mainStage.width() - 2;
        globals.stageHeight = mainStage.height() - 2;
        globals.stage = new Kinetic.Stage({
            container: _mainStage,
            width: globals.stageWidth,
            height: globals.stageHeight
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

        //scheduleAudio();

    };



    return {
        init: init
    };
});
