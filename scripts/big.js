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



speech = {
    exclamations : ["Whoa!",
                    "Watch out!",
                    "Carefull!",
                    "aaAARGH!",
                    "Damn fool!",
                    "WTF?",
                    "Chill it!",
                    "Seriously?",
                    "Stop that!",
                    "WHY?",
                    "Eek!",
                    "Hey now!",
                    "NOOooo!",
                    "Chips!",
                    "Incoming!",
                    "Yikes!",
                    "Daayyuum!"],
    exclaim : function(){
                  return this.exclamations[Math.floor(Math.random()*this.exclamations.length)];
              },

    dialogue : ["EVERYONE! STAY IN FORMATION!.",
                "Why are we going so slowly?",
                "It's prescribed in the \"Alien contact manual\".",
                "But why? What is the sense in it?",
                "It's to make us appear unthreatening.",
                "I don't think it is working.",
                "Look! Just stay in formation!",
                "TIME TO INNITIATE GROUP HUG!",//gets to about here before group hug.
                "This is embarrasing...",
                "SHOW THIS ALIEN SOME LOVE!!",
                "Do not feel embasassed."],
    dialoguePos : 0,
    converse : function(){
                   var ret = this.dialogue[this.dialoguePos++];
                   if(this.dialoguePos>=this.dialogue.length) this.dialoguePos = 0;
                   return ret;
               },

    insults : ["A projectile weapon, how quaint.",
               "We're flying here!",
               "We came from outer space man!",
               "We have all sorts of advanced technology.",
               "Did I mention we can fly?",
               "You think a projectile weapon is appropriate?",
               "Wow. You just keep trying, don't you?",
               "And you thought that shot would be different?",
               "I don't think you're a quick learner.",
               "Look! We're just doing our jobs. OK?",
               "GET HIM!"],
    insultPos : 0,
    insult : function(){
                 var ret = this.insults[this.insultPos++];
                 if(this.insultPos>=this.insults.length) this.insultPos = 0;
                 return ret;
             }

}






drawShapes = {

    eyeTemplate : undefined,
    tentacleTemplate : undefined,
    gearTemplate : undefined,
    cannonFlashTemplate : undefined,


    cannonFlashDraw : function()
                      {
                          var context = this.getContext();

                          var flashTime = this.flashTime;
                          var date = new Date();
                          var time = date.getTime()/1000.0;
                          var t = 1.0;
                          if(typeof(this.timeToDie)==="undefined")
                          {
                              this.timeToDie = time + this.flashTime;

                          }
                          else
                          {
                              t = (this.timeToDie - time)/this.flashTime;

                          }

                          var cannonFlashTemplate;


                          var globalScaleRecip = 1.0/globalScale;

                          if(typeof(drawShapes.cannonFlashTemplate)==="undefined")
                          {
                              drawShapes.cannonFlashTemplate = new Kinetic.Shape(drawShapes.flash);

                          }

                          cannonFlashTemplate = drawShapes.cannonFlashTemplate;
                          cannonFlashTemplate.fillStyle = this.fillStyle;
                          cannonFlashTemplate.innerRadius = this.innerRadius;
                          cannonFlashTemplate.outerRadius = this.outerRadius;
                          cannonFlashTemplate.divs = this.divs;
                          cannonFlashTemplate.setScale(globalScaleRecip);//undo the effect of the global scaling

                          for(var i = 0;i<5;i++)
                          {

                              cannonFlashTemplate.setPosition((Math.random()-0.5)*this.innerRadius,(Math.random()-0.5)*this.innerRadius);
                              cannonFlashTemplate.setRotation(Math.random()*Math.PI/4);
                              cannonFlashTemplate.setScale(globalScaleRecip*Math.random()*this.fashScale*t*t,globalScaleRecip*Math.random()*this.fashScale*t*t);
                              cannonFlashTemplate.draw(this.layer);
                          }

                      },
    flash : function()
            {
                var context = this.getContext(),
                    innerRadius = this.innerRadius,
                    outerRadius = this.outerRadius,
                    divs = this.divs;


                context.beginPath();

                var arc = Math.PI * 2.0 / divs;
                var term,xcp1,ycp1,xcp3,ycp2,x,y;

                context.moveTo(outerRadius,0);

                for(var i = 0; i < divs ; i ++)
                {
                    term = arc * (i+1);
                    x = Math.cos(term);
                    y = Math.sin(term);
                    term -= arc/3;
                    xcp2 = Math.cos(term);
                    ycp2 = Math.sin(term);
                    term -= arc/3;
                    xcp1 = Math.cos(term);
                    ycp1 = Math.sin(term);

                    context.bezierCurveTo(xcp1*innerRadius,ycp1*innerRadius,
                                          xcp2*innerRadius,ycp2*innerRadius,
                                          x*outerRadius,y*outerRadius);


                }

                context.closePath();
                context.fillStyle = this.fillStyle;
                context.fill();

            },

    speechBubbleDraw : function()
                       {
                           var context = this.getContext();

                           var l = 20;
                           var w = this.w;
                           var w1 = w/2 - w*0.2;
                           var w2 = 10;
                           var h = this.h;
                           var r = 10;//corner rounding radius
                           var text = this.text;

                           context.beginPath();

                           context.moveTo(0,0);
                           context.lineTo(-w/2+w1+w2,l);
                           context.arcTo(w/2,l,w/2,l+h,r);
                           context.arcTo(w/2,l+h,-w/2,l+h,r);
                           context.arcTo(-w/2,l+h,-w/2,l,r);
                           context.arcTo(-w/2,l,-w/2+w1,l,r);

                           context.lineTo(-w/2+w1,l);

                           context.lineTo(0,0);
                           context.fillStyle = "#EEE";
                           context.fill();
                           context.lineWidth = 2;
                           context.strokeStyle = "black";
                           context.stroke();
                           context.font = textfont;
                           context.fillStyle = "black";
                           context.fillText(text, -w/2 + 4 , h/2 + l + 8);
                       },
    tankDraw : function()
               {
                   var context = this.getContext();

                   var size = this.size;
                   var numWheels = 4;

                   var globalScaleRecip = 1.0/globalScale;




                   //barrel
                   context.beginPath();
                   context.moveTo(size/6,0);
                   context.lineTo(size/8,-size);
                   context.lineTo(-size/8,-size);
                   context.lineTo(-size/6,0);
                   context.closePath();

                   var barrelGrd = context.createLinearGradient(size/8, 0, -size/8, 0);
                   barrelGrd.addColorStop(0, this.fillStyle);
                   barrelGrd.addColorStop(0.5, "#FFF");
                   barrelGrd.addColorStop(1, this.fillStyle);

                   context.fillStyle = barrelGrd;
                   context.fill();
                   context.lineWidth = 2;
                   context.strokeStyle = this.strokeStyle;
                   context.stroke();

                   //Turret


                   var turrSize = size*0.3;

                   var turretGrd = context.createRadialGradient(turrSize*0.4, -turrSize*0.4, 0, 0, 0, turrSize);
                   turretGrd.addColorStop(0, "#FFF");
                   turretGrd.addColorStop(1, this.fillStyle);

                   drawShapes.circle(context,turrSize,turretGrd,this.strokeStyle,2);

                   //Chasis
                   context.beginPath();

                   context.moveTo(size,size);
                   context.lineTo(size,size/6);
                   context.lineTo(size/5,0);
                   context.lineTo(-size/5,0);
                   context.lineTo(-size,size/6);
                   context.lineTo(-size,size);
                   context.closePath();

                   var tankGrd = context.createRadialGradient(size*0.1, -size*0.4, 0, 0, size*0.3, size);
                   tankGrd.addColorStop(0, "#FFF");
                   tankGrd.addColorStop(1, this.fillStyle);

                   context.fillStyle = tankGrd;
                   context.fill();
                   context.lineWidth = 2;
                   context.strokeStyle = this.strokeStyle;
                   context.stroke();






                   //the wheels

                   var gearTemplate = 0;
                   if(typeof(drawShapes.gearTemplate)==="undefined")
                   {
                       drawShapes.gearTemplate = new Kinetic.Shape(drawShapes.gear);
                       gearTemplate = drawShapes.gearTemplate;

                       gearTemplate.innerRadius = this.size/4.1;
                       gearTemplate.spokeHeight = gearTemplate.innerRadius/5;
                       gearTemplate.epsilon = 0.09;
                       gearTemplate.divs = 7;


                       var grd = context.createRadialGradient(0, 0, 0, 0, 0, gearTemplate.innerRadius);
                       grd.addColorStop(0, "#FFA");
                       grd.addColorStop(0.4, "#FFA");
                       grd.addColorStop(0.45, "#000");
                       grd.addColorStop(0.5, "#555");
                       grd.addColorStop(1, "#111");
                       gearTemplate.fillStyle = grd;
                       gearTemplate.strokeStyle = this.strokeStyle;

                   }
                   else
                   {
                       gearTemplate = drawShapes.gearTemplate;
                       gearTemplate.setScale(globalScaleRecip);//undo the effect of the global scaling
                   }

                   var wheelRadius = gearTemplate.innerRadius+gearTemplate.spokeHeight;

                   gearTemplate.setRotation(this.pos.x/(wheelRadius)/2);

                   for(var wheel = 0;wheel<numWheels;wheel++)
                   {

                       gearTemplate.setPosition(-this.size + wheel*((this.size)*2/(numWheels-1)),this.size-gearTemplate.innerRadius/2);
                       gearTemplate.draw(this.layer);
                   }



               },
    invaderDraw : function()
                  {
                      var context = this.getContext();
                      var globalScaleRecip = 1.0/globalScale;
                      var innerRadius = invaderSpacing/4;

                      var grd = context.createRadialGradient(innerRadius/2, -innerRadius*0.8, 0, 0, 0, innerRadius);
                      grd.addColorStop(0, "#FFF");
                      grd.addColorStop(1, this.fillStyle);


                      drawShapes.circle(context,innerRadius+2,grd,this.strokeStyle,2);


                      //tentacles
                      var tentacleTemplate = 0;
                      if(typeof(drawShapes.tentacleTemplate)==="undefined")
                      {
                          drawShapes.tentacleTemplate = new Kinetic.Shape(drawShapes.tentacle);
                          tentacleTemplate = drawShapes.tentacleTemplate;
                          tentacleTemplate.fillStyle = this.fillStyle;
                          tentacleTemplate.strokeStyle = this.strokeStyle;
                          tentacleTemplate.l = invaderSpacing/4 - 2;
                      }
                      else
                      {
                          tentacleTemplate = drawShapes.tentacleTemplate;
                          tentacleTemplate.setScale(globalScaleRecip);//undo the effect of the global scaling
                      }

                      var date = new Date();
                      tentacleTemplate.time = date.getTime();
                      var numTentaclesPerSide = 3,nT,arcSweep = (Math.PI/2.0)/numTentaclesPerSide;

                      for(nT=0;nT<numTentaclesPerSide;nT++)
                      {

                          tentacleTemplate.setPosition(innerRadius*Math.cos(arcSweep*nT),innerRadius*Math.sin(arcSweep*nT));
                          tentacleTemplate.setRotation(arcSweep*nT);
                          tentacleTemplate.draw(this.layer);
                      }

                      tentacleTemplate.setScale(-globalScaleRecip,globalScaleRecip);

                      for(nT=0;nT<numTentaclesPerSide;nT++)
                      {
                          tentacleTemplate.setPosition(-innerRadius*Math.cos(arcSweep*nT),innerRadius*Math.sin(arcSweep*nT));
                          tentacleTemplate.setRotation(-arcSweep*nT);
                          tentacleTemplate.draw(this.layer);

                      }



                      //eyes
                      var eyeSpacing = invaderSpacing/5 + 2;

                      var eyeTemplate = 0;
                      if(typeof(drawShapes.eyeTemplate)==="undefined")
                      {
                          drawShapes.eyeTemplate = new Kinetic.Shape(drawShapes.eyeBall);
                          eyeTemplate = drawShapes.eyeTemplate;
                          eyeTemplate.radius = eyeSpacing*0.8;
                          eyeTemplate.pupilRatio = 1.4;
                      }
                      else
                      {
                          eyeTemplate = drawShapes.eyeTemplate;
                          eyeTemplate.setScale(globalScaleRecip);//undo the effect of the global scaling
                      }

                      eyeTemplate.target = this.lookAtTarget;
                      eyeTemplate.invaderPos = {"x":this.x,"y":this.y};
                      eyeTemplate.setPosition(-eyeSpacing,0);
                      eyeTemplate.draw(this.layer);
                      eyeTemplate.setPosition(eyeSpacing,0);
                      eyeTemplate.draw(this.layer);
                  },
    projectileDraw :  function()
                      {
                          var context = this.getContext();

                          var radius = 5;

                          drawShapes.circle(context,radius,this.fillStyle,this.strokeStyle,1);

                      },
    circle : function(context,r,fillStyle,strokeStyle,lineWidth,offSetPos)
             {
                 if(typeof(lineWidth)==="undefined") lineWidth = 1;
                 if(typeof(offSetPos)==="undefined") offSetPos = {"x":0,"y":0};

                 context.beginPath();
                 context.arc(offSetPos.x, offSetPos.y, r, 0, 2 * Math.PI, false);
                 context.fillStyle = fillStyle;
                 context.fill();
                 context.lineWidth = lineWidth;
                 context.strokeStyle = strokeStyle;
                 context.stroke();
             },
    gear : function()
           {

               var context = this.getContext(),
                   innerRadius = this.innerRadius,
                   spokeHeight = this.spokeHeight,
                   epsilon = this.epsilon,
                   divs = this.divs;


               context.beginPath();

               var gearArc = Math.PI / divs;
               var term;


               for(var i = 0; i < divs*2 ; i +=2)
               {
                   term = gearArc * (i + 1);
                   context.arc(0, 0, innerRadius+spokeHeight, gearArc * i + epsilon, term - epsilon, false);
                   context.arc(0, 0, innerRadius, gearArc * i + gearArc + epsilon, term +gearArc - epsilon, false);

               }

               context.closePath();
               context.fillStyle = this.fillStyle;
               context.fill();
               context.lineWidth = this.lineStyle;
               context.strokeStyle = this.strokeStyle;
               context.stroke();
           },

    eyeBall : function()
              {
                  var context = this.getContext(),
                      target = this.target,
                      radius = this.radius,
                      pupilRatio = this.pupilRatio,
                      eye = new Object(),
                      limit = radius - radius/pupilRatio;



                  var dir = {"x":target.x - (this.invaderPos.x + this.x),"y":target.y - (this.invaderPos.y + this.y)};

                  var dist = Math.sqrt(Math.pow(dir.x,2)+Math.pow(dir.y,2));
                  eye.x = (dist > limit )?(dir.x*limit/dist):(dir.x);
                  eye.y = (dist > limit )?(dir.y*limit/dist):(dir.y);
                  drawShapes.circle(context,radius,"#FFF","#000",2);
                  drawShapes.circle(context,radius/pupilRatio,"#000","#000",1,{"x":eye.x,"y":eye.y});



              },
    tentacle : function()
               {
                   var context = this.getContext();
                   var speed = 7;
                   var t = (this.time/1000*speed)%(2*Math.PI);
                   var l = this.l;
                   context.beginPath();
                   context.moveTo(0,10);
                   context.bezierCurveTo(l/3,Math.sin(t)*5,7*l/8,Math.sin(t+Math.PI/8)*10,l,Math.sin(t+Math.PI/7)*5);
                   context.bezierCurveTo(7*l/8,Math.sin(t+Math.PI/8)*10,l/3,Math.sin(t)*5,0,-10);
                   context.lineWidth = 3;
                   context.strokeStyle = this.strokeStyle;
                   context.stroke();
                   context.closePath();
                   context.fillStyle = this.fillStyle;
                   context.fill();
               },


    drawBackDrop : function()
                   {
                       var context = this.getContext();

                       context.beginPath();
                       context.rect(0,0,fixedStageDims.width,fixedStageDims.height);

                       var grd = context.createLinearGradient(0, fixedStageDims.height, 0, 0);
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
                           minHeight = 20,w,h,pos;

                       context.lineWidth = 1;
                       context.strokeStyle = "#646464";
                       for(var i = 0; i<numBuildings;i++)
                       {
                           pos = Math.random()*fixedStageDims.width;
                           w = Math.random()*(maxWidth-minWidth)+minWidth;
                           h = Math.random()*(maxHeight-minHeight)+minHeight;
                           context.beginPath();
                           context.rect(pos-w/2,fixedStageDims.height-h,w,h);
                           context.fillStyle = "rgb("+ (125 + Math.floor(Math.random()*15))
                                   +","+(125 + Math.floor(Math.random()*15))
                                   +","+(125 + Math.floor(Math.random()*45))+")";
                           context.fill();
                           context.stroke();
                       }

                       //The track
                       context.fillStyle = "#444";
                       var trackWidth = 5;
                       context.beginPath();
                       context.moveTo(0,fixedStageDims.height);
                       context.lineTo(0,fixedStageDims.height - trackWidth*3);
                       context.lineTo(trackWidth,fixedStageDims.height - trackWidth*3);
                       context.lineTo(trackWidth,fixedStageDims.height - trackWidth);
                       context.lineTo(fixedStageDims.width - trackWidth,fixedStageDims.height - trackWidth);
                       context.lineTo(fixedStageDims.width - trackWidth,fixedStageDims.height - trackWidth*3);
                       context.lineTo(fixedStageDims.width,fixedStageDims.height - trackWidth*3);
                       context.lineTo(fixedStageDims.width,fixedStageDims.height);
                       context.closePath();
                       context.fill();
                       context.stroke();


                   }

}

//____________________________________________
// Audio stuff
//____________________________________________
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

generateAudioBuffer = {


    boomSound : function(){
                    var boomTime = 0.8,
                        n = boomTime*sampleRate,
                        buffer = new Array(n),
                        t,
                        fade,
                        freq=440;

                    for(var i = 0;i<n;i++)
                    {
                        t = i/sampleRate;
                        fade = (n-i)/n;
                        fadeSqr = fade*fade;//square
                        buffer[i]= fadeSqr*Math.sin((freq*fade)*t*Math.PI*2)*Math.random();
                        buffer[i]+= fadeSqr*fadeSqr*Math.sin((12.0/Math.sqrt(fade*10))*t*Math.PI*2)*20*Math.random();
                        buffer[i]*= Math.random() ;
                    }

                    return buffer;
                },

    invaderSweep : function(){
                       var sweepTime = 3.0,
                           n = sweepTime*sampleRate,
                           buffer = new Array(n),
                           t,f1,f2,f3,v1,v2,v3;

                       for(var i = 0;i<n;i++)
                       {
                           t = i/sampleRate;
                           f1 = (sweepTime-t)/sweepTime;
                           f2 = t/sweepTime;
                           f3 = (f1 * f2);
                           v1 = Math.sin(Math.PI*2*t*(440.0*f1));
                           v2 = Math.sin(Math.PI*2*t*(220.0*f2));
                           v2 = v2>0?1:-1;
                           v3 = Math.sin(Math.PI*2*t*(550.0*f3));
                           v3 = v3>0?1:-1;
                           buffer[i] = v1*v1-0.5;
                           buffer[i]-= v2/2;
                           buffer[i]+= v3*0.5;
                           buffer[i]/=3;
                       }

                       return buffer;
                   },

    smoothWindow: function(){
                      // Create a granular synthesis "grain window"
                      // Each small audio snippet will have a smooth fade-in / fade-out according to this shape.
                      var windowLength = 16384;
                      var window = new Float32Array(windowLength);
                      for (var i = 0; i < windowLength; ++i)
                          window[i] = Math.sin(Math.PI * i / windowLength);
                      return window;
                  }
};




//over-complicated invader chatter noise grain scheduler. taken from google Web Audio API examples.
function scheduleInvaderGrain() {

    var speed = 1.0;

    var source = audioCtx.createBufferSource();
    source.buffer = invaderDroneBuffer;


    var panner = audioCtx.createPanner();
    panner.panningModel = webkitAudioPannerNode.EQUALPOWER;
    panner.refDistance = fixedStageDims.width/8;
    panner.maxDistance = fixedStageDims.width/2;
    panner.rolloffFactor = 0.4;

    panner.setPosition(flockTarget.x+(invaderSpacing*numInvaderRows/2)-fixedStageDims.width/2, flockTarget.y+(invaderSpacing*numInvaderColumns/2)-fixedStageDims.height/2, 100);

    // Connect panner to the compressor
    panner.connect(compressor);


    var grainWindowNode;
    grainWindowNode = audioCtx.createGainNode();
    invaderVolNode = audioCtx.createGainNode();
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

    var windowDuration = grainDuration ;
    grainWindowNode.gain.value = 0.0; // make default value 0
    grainWindowNode.gain.setValueCurveAtTime(grainWindow, realTime, windowDuration);


    var lastGrainTime = grainTime;

    // Update time params
    realTime += grainSpacing;
    grainTime += speed * grainSpacing;
    if (grainTime > invaderDroneBuffer.duration) grainTime = 0.0;
    if (grainTime < 0.0) grainTime += invaderDroneBuffer.duration; // backwards wrap-around
}

function scheduleAudio() {
    if(audioSupported)
    {
        if(!gamePause)
        {
            var currentTime = audioCtx.currentTime;

            while (realTime < currentTime + 0.100) {
                scheduleInvaderGrain();
            }

        }
        setTimeout("scheduleAudio()", 20);
    }

}

initAudio = function()
{
    if(AudioContext)
    {

        audioSupported=true;
    }
    else
    {
        return undefined;
    }


    audioCtx = new AudioContext();

    if(audioCtx)
    {

        var boomSoundBuffer = generateAudioBuffer.boomSound();
        cannonBoomBuffer = audioCtx.createBuffer(1, boomSoundBuffer.length , sampleRate);
        cannonBoomBuffer.getChannelData(0).set(boomSoundBuffer);
        var invaderSweepBuffer = generateAudioBuffer.invaderSweep();
        invaderDroneBuffer = audioCtx.createBuffer(1, invaderSweepBuffer.length , sampleRate);
        invaderDroneBuffer.getChannelData(0).set(invaderSweepBuffer);


        mainVol = audioCtx.createGainNode();
        // Connect MainVol to final destination
        mainVol.connect(audioCtx.destination);
        mainVol.gain.value = 0.5;
        compressor = audioCtx.createDynamicsCompressor();

        compressor.connect(mainVol);

        lpFilter = audioCtx.createBiquadFilter();

        lpFilter.type = 0; // Low-pass filter. See BiquadFilterNode docs
        lpFilter.frequency.value = 80; // Set cutoff to 440 HZ
        lpFilter.Q.value = 20.0;//1.0/Math.sqrt(2.0); // Set cutoff to 440 HZ
        lpFilter.connect(compressor);

        grainWindow = generateAudioBuffer.smoothWindow();

    }

}

playCannonSound = function()
{
    if(audioSupported)
    {
        // Create a couple of sources
        var cannonSource = audioCtx.createBufferSource();
        cannonSource.buffer = cannonBoomBuffer;

        // Spatialization
        var panner = audioCtx.createPanner();


        panner.panningModel = webkitAudioPannerNode.EQUALPOWER;
        panner.refDistance = 200;
        panner.maxDistance = 400;
        panner.setPosition((tank.pos.x-fixedStageDims.width/2), 0, 100);

        var lpFilter = audioCtx.createBiquadFilter();

        lpFilter.type = 2; // Band-pass filter.
        lpFilter.frequency.value = 80;
        lpFilter.Q.value = 20.0;//1.0/Math.sqrt(2.0);

        cannonSource.connect(lpFilter);


        var boostVol = audioCtx.createGainNode();
        boostVol.gain.value = 5;

        lpFilter.connect(panner);
        panner.connect(boostVol);
        boostVol.connect(compressor);

        cannonSource.noteOn(0);

    }
}



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

window.requestAnimFrame = (function(callback){
                               return window.requestAnimationFrame ||
                                       window.webkitRequestAnimationFrame ||
                                       window.mozRequestAnimationFrame ||
                                       window.oRequestAnimationFrame ||
                                       window.msRequestAnimationFrame ||
                                       function(callback){
                                   window.setTimeout(callback, 1000 / 60);
                               };
                           })();

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



function processTank(timeDiff)
{
    var moveDelta = 0;
    var speed = groupHug?30:100;//px/s


    if(keyMap[cntrlMap["left"]])
    {
        moveDelta += -speed;
    }
    if(keyMap[cntrlMap["right"]])
    {
        moveDelta += speed;
    }


    //tank moving dynamics

    tank.pos.x += (moveDelta*timeDiff);
    if(tank.pos.x<(tank.size+limitTweak))
        tank.pos.x = tank.size+limitTweak;
    if(tank.pos.x>fixedStageDims.width - tank.size-limitTweak)
        tank.pos.x = fixedStageDims.width - tank.size-limitTweak;

    tank.setPosition(tank.pos.x*globalScale,tank.pos.y*globalScale);

}

var flockTime = 0;
//create a random array for hug positions.
var hugPositions = new Array();
for(var i = 0; i< numInvaders ; i++)
{
    hugPositions.push({"x":Math.random() * 100 - 50,"y":Math.random() * -50});
}

var speakingInterval = 5.0;
var timeToSpeak = speakingInterval/3.0;
var converseSwitch = 0;

function processInvaders(timeDiff)
{
    flockTime += timeDiff;

    if((flockTarget.y+numInvaderRows*invaderSpacing)<(fixedStageDims.height-invaderSpacing*0.7))//groupHug condition is that invaders reach the bottom
    {
        //flockTarget should sweep out the inveder's entry pattern
        var powTerm = Math.pow(Math.sin(flockTime*3.0),2);//the judder "march"
        flockTarget.x += powTerm*invaderSpacing*timeDiff*flockTarget.direction;

        //when they reach the end of the screen the target goes one row down and they reverse direction.
        if((flockTarget.x+numInvaderColumns*invaderSpacing-(invaderSpacing/2.0))>fixedStageDims.width)
        {
            if(flockTarget.direction != -1)
            {
                flockTarget.y += invaderSpacing;
                flockTarget.direction = -1;
            }
        }
        else if (flockTarget.x<(invaderSpacing/2.0))
        {
            if(flockTarget.direction != 1)
            {
                flockTarget.y += invaderSpacing;
                flockTarget.direction = 1;
            }
        }
    }
    else
    {
        groupHug = true;
    }

    var shapesLayer = stage.getLayer("Shapes");
    var projectile = shapesLayer.getShape("projectile");
    var invader;

    for (var i = 0; i< numInvaders ; i++)
    {
        invader = invaders[i];

        if(groupHug)
        {
            // hugging dynamics
            invader.pos.x += ((tank.x + hugPositions[i].x*globalScale ) - invader.x)*0.06;
            invader.pos.y += ((tank.y + hugPositions[i].y*globalScale ) - invader.y)*0.05;
        }
        else
        {
            // moving dynamics
            var gridPos = { "x":i%numInvaderColumns,"y": Math.floor(i/numInvaderColumns) };
            invader.pos.x += ((flockTarget.x + gridPos.x * invaderSpacing ) - invader.pos.x)*0.1;
            invader.pos.y += ((flockTarget.y + gridPos.y * invaderSpacing ) - invader.pos.y)*0.06;
        }


        if(projectile)
        {
            //make a normal vector, and calculate the distance while we're at it.
            var u = {"x":( invader.x - projectile.x),"y":( invader.y - projectile.y )};
            var dist = Math.sqrt(Math.pow(u.x,2)+Math.pow(u.y,2));
            u.x = u.x / dist;
            u.y = u.y / dist;
            var spacing = (invaderSpacing*globalScale);
            if(dist<spacing)
            {
                var fact = Math.pow((spacing - dist)/(spacing),2)*30;
                invader.pos.x += u.x*fact*3; //increase likelyness of moving "side-ways"
                invader.pos.y += u.y*fact;


                invader.lookAtTarget = projectile;

                //possible exclamations:
                if((!invader.speaking)&&(i>numInvaderColumns))
                {
                    //do a roll
                    if(Math.random()<0.01)
                    {
                        invader.speak(speech.exclaim(),1);
                    }
                }
            }
            else
            {
                invader.lookAtTarget = tank;
            }
        }
        invader.setPosition(invader.pos.x*globalScale,invader.pos.y*globalScale);
    }

    //general speech.
    if( timeToSpeak<0 )
    {
        if(groupHug)
        {
            for(var j = 0;j<numInvaders; j+=3)
            {
                invaders[j].speak("GROUP HUG!",2);
            }

            timeToSpeak = speakingInterval*100;
        }
        else
        {

            //if the player has attacked since last speakingInterval, insult them
            if(tank.attacking)
            {
                //pick a random invader, but not from top row..
                invader = invaders[Math.floor(Math.random()*(invaders.length-numInvaderColumns))+numInvaderColumns];
                tank.attacking = false;
                invader.speak(speech.insult(),2);
            }

            // carry on talking (we have the middle top bunch of invaders chatting
            var converseInvader = converseSwitch + Math.floor(numInvaderColumns/2);
            converseSwitch++;
            if(converseSwitch>1) converseSwitch = 0;
            while(invaders[converseInvader].speaking)
            {
                converseInvader++;
            }

            invader = invaders[converseInvader];//pick the speaking invader

            invader.speak(speech.converse(),3);
            timeToSpeak = speakingInterval;
        }




    }
    else
    {
        timeToSpeak -= timeDiff;
    }
}




var projectileSpeed = 200;

function processProjectile(timeDiff)
{
    var shapesLayer = stage.getLayer("Shapes");
    var projectile = shapesLayer.getShape("projectile");


    if(projectile)
    {
        projectile.pos.y -= projectileSpeed*timeDiff;
        projectile.setPosition(projectile.pos.x*globalScale,projectile.pos.y*globalScale);
        if(projectile.pos.y<-200)
        {
            shapesLayer.remove(projectile);
            shapesLayer.shapeNames[projectile.name] = undefined;;
        }
        else
        {
            //make trails
            var trailTime = 1.9;
            var trail = new Kinetic.Shape( drawShapes.cannonFlashDraw );
            trail.innerRadius = 5;
            trail.outerRadius = 8;
            trail.divs = 5;
            trail.fashScale = 2;
            trail.fillStyle = "rgba(255,225,200,0.1)";
            trail.setPosition( projectile.x , projectile.y );
            trail.flashTime = trailTime;

            shapesLayer.add(trail);


            window.setTimeout(function(){
                                  shapesLayer.remove(trail);
                              },trailTime*1000);
        }
    }
    else
    {
        if(!groupHug&&keyMap[cntrlMap["shoot"]])
        {

            tank.attacking = true;
            projectile = new Kinetic.Shape( drawShapes.projectileDraw );
            projectile.name = "projectile";
            projectile.fillStyle = "#FAC";
            projectile.strokeStyle = "#700";
            projectile.pos = { "x" : tank.pos.x  ,"y" : tank.pos.y - tank.size };

            projectile.setPosition(projectile.pos.x*globalScale,projectile.pos.y*globalScale);

            shapesLayer.add(projectile);

            playCannonSound();

            var flashTime = 0.3;
            var flash = new Kinetic.Shape( drawShapes.cannonFlashDraw );
            flash.innerRadius = 5;
            flash.outerRadius = 30;
            flash.divs = 6;
            flash.fashScale = 10;
            flash.fillStyle = "rgba(255,255,190,0.2)";
            flash.setPosition( tank.x  , (tank.pos.y-tank.size)*globalScale );
            flash.flashTime = flashTime;

            shapesLayer.add(flash);


            window.setTimeout(function(){
                                  shapesLayer.remove(flash);
                              },flashTime*1000);

        }
    }
}
var flash;
var chatter = new Array();
var textfont = "18pt Calibri";


textDims = function(text,font)
{
    var testEl = $("<div>").css("font",font).css("display","inline").html(text);
    $("body").append(testEl);
    var ret = { "width": $(testEl).width(), "height" : $(testEl).height() };
    $(testEl).remove();
    return ret;
}

speakInvader = function(text,speakTime)
{
    if(!this.speaking)
    {
        this.speaking = true;
        var dims = textDims(text,textfont);
        var bubble = new Kinetic.Shape( drawShapes.speechBubbleDraw );
        bubble.w = dims.width+7;
        bubble.h = dims.height+7;
        bubble.text = text;
        bubble.invaderNum = this.invaderNum;

        chatter.push(bubble);

        stage.getLayer("Speech").add(bubble);

        var invader = this;//store "this" for closure
        window.setTimeout(function(){
                              var i = chatter.indexOf(bubble);
                              chatter.splice(i,0);//already have the bubble, no need to get again
                              stage.getLayer("Speech").remove(bubble);
                              delete stage.getLayer("Speech").shapeNames[bubble.name];
                              delete bubble;//send to garbage collector!
                              invader.speaking = false;
                          },speakTime*1000);
    }
}

function processSpeechBubbles(timeDiff)
{
    for(var i = 0;i<chatter.length;i++)
    {
        var bubble = chatter[i];
        bubble.setPosition( invaders[bubble.invaderNum].x , invaders[bubble.invaderNum].y );
    }

}

function animate(lastTime){
    // update
    var date = new Date();
    var time = date.getTime();
    var timeDiff = (time - lastTime)/1000.0;

    if(!gamePause)
    {

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
    requestAnimFrame(function(){
                         animate(time);
                     });


}

var globalScale = 1.0;

resizeStage = function()
{
    if(stage!==null)
    {
        stageWidth = $("#mainStage").width()-2;
        stageHeight = $("#mainStage").height()-2;
        var stageAspect = stageWidth/stageHeight;
        var aspect = fixedStageDims.width/fixedStageDims.height;
        var canvasWidth;
        if(stageAspect>aspect)
        {

            globalScale = stageHeight/fixedStageDims.height;
            canvasWidth = stageWidth*aspect/stageAspect;
            stage.setSize( canvasWidth, stageHeight);
        }
        else
        {
            globalScale = stageWidth/fixedStageDims.width;
            canvasWidth = stageWidth;
            stage.setSize( canvasWidth, stageHeight/aspect*stageAspect);

        }

        stage.setScale(globalScale);
    }
}


$(window).resize(resizeStage);


initGame = function()
{
    speech.dialoguePos = 0;
    speech.insultPos = 0;
    flockTarget = {"x":invaderSpacing/2,"y":invaderSpacing/2,"direction" : 1};
    groupHug = false;
    tank.pos = {"x":fixedStageDims.width/2,"y":fixedStageDims.height-40};
    tank.setPosition(tank.pos.x*globalScale,tank.pos.y*globalScale);

    timeToSpeak = speakingInterval/3.0;
    converseSwitch = 0;
    //init invader positions
    for (var i = 0; i< numInvaders ; i++)
    {
        var gridPos = { "x":i%numInvaderColumns,"y": Math.floor(i/numInvaderColumns) };
        invaders[i].pos = {"x":gridPos.x*invaderSpacing+flockTarget.x,"y":gridPos.y*invaderSpacing+flockTarget.y};
        invaders[i].setPosition(invaders[i].pos.x,invaders[i].pos.y);
    }
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

                      $("#controlInput").focus(function(){gamePause=false;});
                      $("#controlInput").blur(function(){gamePause=true});

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

                      scheduleAudio();

                  });
