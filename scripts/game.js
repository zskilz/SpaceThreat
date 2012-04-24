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

  */

var stage = null,
    stageWidth,stageHeight,
    tank,
    invaders = new Array(),
    invaderSpacing = 70,
    numInvaderRows = 4,
    numInvaderColumns = 5,
    numInvaders = numInvaderRows*numInvaderColumns,
    groupHug = false,
    gamePause = true,
    fixedStageDims = {"width":800, "height":600},//all dynamics calculations rely on a constant frame of reference. (This enables me to scale the stage, yet retain the same gameplay)
    flockTarget = {"x":invaderSpacing/2,"y":invaderSpacing/2,"direction" : 1};

window.AudioContext = window.AudioContext || window.webkitAudioContext;


window.requestAnimFrame = window.requestAnimationFrame || 
    window.webkitRequestAnimationFrame || 
    window.mozRequestAnimationFrame || 
    window.oRequestAnimationFrame || 
    window.msRequestAnimationFrame ||
    function(callback) {
        window.setTimeout(callback, 1000 / 60);
    };


//the keys
var keyMap = new Object();
var gameCntrls = [ "left", "right" , "shoot" ];
var cntrlMap = { "left" : 37, "right" : 39, "shoot" : 38 };//default keys
checkKey = function(key)
{
    for(var i = 0; i<gameCntrls.length ; i++)
    {
        if(cntrlMap[gameCntrls[i]]==key)
            return true;
    }
}


var limitTweak = 15;



function processTank(timeDiff) {
    var moveDelta = 0;
    var speed = groupHug ? 30 : 100;
    //px/s

    if(keyMap[cntrlMap["left"]]) {
        moveDelta += -speed;
    }
    if(keyMap[cntrlMap["right"]]) {
        moveDelta += speed;
    }

    //tank moving dynamics

    tank.pos.x += (moveDelta * timeDiff);
    if(tank.pos.x < (tank.size + limitTweak))
        tank.pos.x = tank.size + limitTweak;
    if(tank.pos.x > fixedStageDims.width - tank.size - limitTweak)
        tank.pos.x = fixedStageDims.width - tank.size - limitTweak;

    tank.setPosition(tank.pos.x * globalScale, tank.pos.y * globalScale);

}

var flockTime = 0;
//create a random array for hug positions.
var hugPositions = new Array();
for(var i = 0; i < numInvaders; i++) {
    hugPositions.push({
        "x" : Math.random() * 100 - 50,
        "y" : Math.random() * -50
    });
}

var speakingInterval = 5.0;
var timeToSpeak = speakingInterval / 3.0;
var converseSwitch = 0;

function processInvaders(timeDiff) {
    flockTime += timeDiff;

    if((flockTarget.y + numInvaderRows * invaderSpacing) < (fixedStageDims.height - invaderSpacing * 0.7))//groupHug condition is that invaders reach the bottom
    {
        //flockTarget should sweep out the inveder's entry pattern
        var powTerm = Math.pow(Math.sin(flockTime * 3.0), 2);
        //the judder "march"
        flockTarget.x += powTerm * invaderSpacing * timeDiff * flockTarget.direction;

        //when they reach the end of the screen the target goes one row down and they reverse direction.
        if((flockTarget.x + numInvaderColumns * invaderSpacing - (invaderSpacing / 2.0)) > fixedStageDims.width) {
            if(flockTarget.direction != -1) {
                flockTarget.y += invaderSpacing;
                flockTarget.direction = -1;
            }
        } else if(flockTarget.x < (invaderSpacing / 2.0)) {
            if(flockTarget.direction != 1) {
                flockTarget.y += invaderSpacing;
                flockTarget.direction = 1;
            }
        }
    } else {
        groupHug = true;
    }

    var shapesLayer = stage.getLayer("Shapes");
    var projectile = shapesLayer.getShape("projectile");
    var invader;

    for(var i = 0; i < numInvaders; i++) {
        invader = invaders[i];

        if(groupHug) {
            // hugging dynamics
            invader.pos.x += ((tank.x + hugPositions[i].x * globalScale ) - invader.x) * 0.06;
            invader.pos.y += ((tank.y + hugPositions[i].y * globalScale ) - invader.y) * 0.05;
        } else {
            // moving dynamics
            var gridPos = {
                "x" : i % numInvaderColumns,
                "y" : Math.floor(i / numInvaderColumns)
            };
            invader.pos.x += ((flockTarget.x + gridPos.x * invaderSpacing ) - invader.pos.x) * 0.1;
            invader.pos.y += ((flockTarget.y + gridPos.y * invaderSpacing ) - invader.pos.y) * 0.06;
        }

        if(projectile) {
            //make a normal vector, and calculate the distance while we're at it.
            var u = {
                "x" : (invader.x - projectile.x),
                "y" : (invader.y - projectile.y )
            };
            var dist = Math.sqrt(Math.pow(u.x, 2) + Math.pow(u.y, 2));
            u.x = u.x / dist;
            u.y = u.y / dist;
            var spacing = (invaderSpacing * globalScale);
            if(dist < spacing) {
                var fact = Math.pow((spacing - dist) / (spacing), 2) * 30;
                invader.pos.x += u.x * fact * 3;
                //increase likelyness of moving "side-ways"
                invader.pos.y += u.y * fact;

                invader.lookAtTarget = projectile;

                //possible exclamations:
                if((!invader.speaking) && (i > numInvaderColumns)) {
                    //do a roll
                    if(Math.random() < 0.01) {
                        invader.speak(speech.exclaim(), 1);
                    }
                }
            } else {
                invader.lookAtTarget = tank;
            }
        }
        invader.setPosition(invader.pos.x * globalScale, invader.pos.y * globalScale);
    }

    //general speech.
    if(timeToSpeak < 0) {
        if(groupHug) {
            for(var j = 0; j < numInvaders; j += 3) {
                invaders[j].speak("GROUP HUG!", 2);
            }
            timeToSpeak = speakingInterval * 100;
        } else {

            //if the player has attacked since last speakingInterval, insult them
            if(tank.attacking) {
                //pick a random invader, but not from top row..
                invader = invaders[Math.floor(Math.random() * (invaders.length - numInvaderColumns)) + numInvaderColumns];
                tank.attacking = false;
                invader.speak(speech.insult(), 2);
            }

            // carry on talking (we have the middle top bunch of invaders chatting
            var converseInvader = converseSwitch + Math.floor(numInvaderColumns / 2);
            converseSwitch++;
            if(converseSwitch > 1)
                converseSwitch = 0;
            while(invaders[converseInvader].speaking) {
                converseInvader++;
            }
            invader = invaders[converseInvader];
            //pick the speaking invader

            invader.speak(speech.converse(), 3);
            timeToSpeak = speakingInterval;
        }

    } else {
        timeToSpeak -= timeDiff;
    }
}

var projectileSpeed = 200;

function processProjectile(timeDiff) {
    var shapesLayer = stage.getLayer("Shapes");
    var projectile = shapesLayer.getShape("projectile");

    if(projectile) {
        projectile.pos.y -= projectileSpeed * timeDiff;
        projectile.setPosition(projectile.pos.x * globalScale, projectile.pos.y * globalScale);
        if(projectile.pos.y < -200) {
            shapesLayer.remove(projectile);
            shapesLayer.shapeNames[projectile.name] = undefined;
            ;
        } else {
            //make trails
            var trailTime = 1.9;
            var trail = new Kinetic.Shape(drawShapes.cannonFlashDraw);
            trail.innerRadius = 5;
            trail.outerRadius = 8;
            trail.divs = 5;
            trail.fashScale = 2;
            trail.fillStyle = "rgba(255,225,200,0.1)";
            trail.setPosition(projectile.x, projectile.y);
            trail.flashTime = trailTime;

            shapesLayer.add(trail);

            window.setTimeout(function() {
                shapesLayer.remove(trail);
            }, trailTime * 1000);
        }
    } else {
        if(!groupHug && keyMap[cntrlMap["shoot"]]) {

            tank.attacking = true;
            projectile = new Kinetic.Shape(drawShapes.projectileDraw);
            projectile.name = "projectile";
            projectile.fillStyle = "#FAC";
            projectile.strokeStyle = "#700";
            projectile.pos = {
                "x" : tank.pos.x,
                "y" : tank.pos.y - tank.size
            };

            projectile.setPosition(projectile.pos.x * globalScale, projectile.pos.y * globalScale);

            shapesLayer.add(projectile);

            playCannonSound();

            var flashTime = 0.3;
            var flash = new Kinetic.Shape(drawShapes.cannonFlashDraw);
            flash.innerRadius = 5;
            flash.outerRadius = 30;
            flash.divs = 6;
            flash.fashScale = 10;
            flash.fillStyle = "rgba(255,255,190,0.2)";
            flash.setPosition(tank.x, (tank.pos.y - tank.size) * globalScale);
            flash.flashTime = flashTime;

            shapesLayer.add(flash);

            window.setTimeout(function() {
                shapesLayer.remove(flash);
            }, flashTime * 1000);
        }
    }
}

var flash;
var chatter = new Array();
var textfont = "18pt Calibri";
textDims = function(text, font) {
    var testEl = $("<div>").css("font", font).css("display", "inline").html(text);
    $("body").append(testEl);
    var ret = {
        "width" : $(testEl).width(),
        "height" : $(testEl).height()
    };
    $(testEl).remove();
    return ret;
}
speakInvader = function(text, speakTime) {
    if(!this.speaking) {
        this.speaking = true;
        var dims = textDims(text, textfont);
        var bubble = new Kinetic.Shape(drawShapes.speechBubbleDraw);
        bubble.w = dims.width + 7;
        bubble.h = dims.height + 7;
        bubble.text = text;
        bubble.invaderNum = this.invaderNum;

        chatter.push(bubble);

        stage.getLayer("Speech").add(bubble);

        var invader = this;
        //store "this" for closure
        window.setTimeout(function() {
            var i = chatter.indexOf(bubble);
            chatter.splice(i, 0);
            //already have the bubble, no need to get again
            stage.getLayer("Speech").remove(bubble);
            delete stage.getLayer("Speech").shapeNames[bubble.name];
            delete bubble;
            //send to garbage collector!
            invader.speaking = false;
        }, speakTime * 1000);
    }
}
function processSpeechBubbles(timeDiff) {
    for(var i = 0; i < chatter.length; i++) {
        var bubble = chatter[i];
        bubble.setPosition(invaders[bubble.invaderNum].x, invaders[bubble.invaderNum].y);
    }

}

function animate(lastTime) {
    // update
    var date = new Date();
    var time = date.getTime();
    var timeDiff = (time - lastTime) / 1000.0;

    if(!gamePause) {

        processTank(timeDiff);
        processInvaders(timeDiff);
        processProjectile(timeDiff);

    }
    // draw
    stage.getLayer("Shapes").draw();

    //speech bubbles
    processSpeechBubbles(timeDiff);
    stage.getLayer("Speech").draw();

    // request new frame
    requestAnimFrame(function() {
        animate(time);
    });
}

var globalScale = 1.0;
resizeStage = function() {
    if(stage !== null) {
        stageWidth = $("#mainStage").width() - 2;
        stageHeight = $("#mainStage").height() - 2;
        var stageAspect = stageWidth / stageHeight;
        var aspect = fixedStageDims.width / fixedStageDims.height;
        var canvasWidth;
        if(stageAspect > aspect) {
            globalScale = stageHeight / fixedStageDims.height;
            canvasWidth = stageWidth * aspect / stageAspect;
            stage.setSize(canvasWidth, stageHeight);
        } else {
            globalScale = stageWidth / fixedStageDims.width;
            canvasWidth = stageWidth;
            stage.setSize(canvasWidth, stageHeight / aspect * stageAspect);

        }

        stage.setScale(globalScale);
    }
}

$(window).resize(resizeStage);
initGame = function() {
    speech.dialoguePos = 0;
    speech.insultPos = 0;
    flockTarget = {
        "x" : invaderSpacing / 2,
        "y" : invaderSpacing / 2,
        "direction" : 1
    };
    groupHug = false;
    tank.pos = {
        "x" : fixedStageDims.width / 2,
        "y" : fixedStageDims.height - 40
    };
    tank.setPosition(tank.pos.x * globalScale, tank.pos.y * globalScale);
    timeToSpeak = speakingInterval / 3.0;
    converseSwitch = 0;
    //init invader positions
    for(var i = 0; i < numInvaders; i++) {
        var gridPos = {
            "x" : i % numInvaderColumns,
            "y" : Math.floor(i / numInvaderColumns)
        };
        invaders[i].pos = {
            "x" : gridPos.x * invaderSpacing + flockTarget.x,
            "y" : gridPos.y * invaderSpacing + flockTarget.y
        };
        invaders[i].setPosition(invaders[i].pos.x, invaders[i].pos.y);
    }
}
unpause = function() {
    if(audioCtx)//fix sound stutters.
        realTime = audioCtx.currentTime;
    gamePause = false;
}
pause = function() {
    gamePause = true;
}



//========================================================================================================
// Starting point.
//========================================================================================================
$(document).ready(function(){

                      initAudio();


                      stageWidth = $("#mainStage").width()-2;
                      stageHeight = $("#mainStage").height()-2;
                      stage = new Kinetic.Stage( "mainStage", stageWidth, stageHeight );

                      resizeStage();

                      //first set up the background
                      var bgLayer = new Kinetic.Layer();
                      var bg = new Kinetic.Shape( drawShapes.drawBackDrop );
                      bgLayer.add(bg);

                      var shapesLayer = new Kinetic.Layer();
                      var speechLayer = new Kinetic.Layer();
                      //init the player tank
                      tank = new Kinetic.Shape( drawShapes.tankDraw );
                      tank.attacking = false;
                      tank.size = 30;
                      tank.fillStyle = "#B55";
                      tank.strokeStyle = "black";
                      shapesLayer.add(tank);


                      //init invaders
                      for (var i = 0; i< numInvaders ; i++)
                      {
                          var invader = new Kinetic.Shape( drawShapes.invaderDraw );
                          invader.speak = speakInvader;
                          invader.radius = 30;
                          invader.invaderNum = i;
                          invader.fillStyle = "rgba(125,255,125,0.5)";
                          invader.strokeStyle = "black";
                          invader.speaking = false;
                          invader.lookAtTarget = tank;


                          invaders.push(invader);

                          shapesLayer.add(invader);
                      }

                      initGame();

                      shapesLayer.name = "BG";
                      shapesLayer.name = "Shapes";
                      speechLayer.name = "Speech"
                      stage.add(bgLayer);
                      stage.add(shapesLayer);
                      stage.add(speechLayer);


                      var date = new Date();
                      var time = date.getTime();

                      $("#controlInput").focus(unpause);
                      $("#controlInput").blur(pause);

                      $("#controlInput").focus();

                      $("#mainStage").click(function(){
                                                $("#controlInput").focus();
                                            });

                      $("#controlInput").keydown( function(e)
                                                 {

                                                     if(e.which===27)
                                                     {
                                                         $("#controlInput").blur();
                                                         return;
                                                     }

                                                     if(checkKey(e.which))
                                                     {
                                                         keyMap[e.which] = true;
                                                     }
                                                     e.preventDefault();

                                                 });

                      $("#controlInput").keyup( function(e)
                                               {
                                                   if(checkKey(e.which))
                                                   {
                                                       keyMap[e.which] = false;
                                                   }
                                                   e.preventDefault();
                                               });

                      $("#restart").click(initGame);

                      animate(time, stage);

                      //scheduleAudio();

                  });
