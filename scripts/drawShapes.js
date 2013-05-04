define(['globals','speech'], function(globals,speech) {
    var drawShapes = {

        eyeTemplate: undefined,
        tentacleTemplate: undefined,
        gearTemplate: undefined,
        cannonFlashTemplate: undefined,

        cannonFlashDraw: function() {
            var context = this.getContext();

            var flashTime = this.flashTime;
            var date = new Date();
            var time = date.getTime() / 1000.0;
            var t = 1.0;
            if (typeof(this.timeToDie) === "undefined") {
                this.timeToDie = time + this.flashTime;

            }
            else {
                t = (this.timeToDie - time) / this.flashTime;

            }

            var cannonFlashTemplate;


            var globalScaleRecip = 1.0 / globals.globalScale;

            if (typeof(drawShapes.cannonFlashTemplate) === "undefined") {
                drawShapes.cannonFlashTemplate = new Kinetic.Shape(drawShapes.flash);

            }

            cannonFlashTemplate = drawShapes.cannonFlashTemplate;
            cannonFlashTemplate.fillStyle = this.fillStyle;
            cannonFlashTemplate.innerRadius = this.innerRadius;
            cannonFlashTemplate.outerRadius = this.outerRadius;
            cannonFlashTemplate.divs = this.divs;
            cannonFlashTemplate.setScale(globalScaleRecip); //undo the effect of the global scaling

            for (var i = 0; i < 5; i++) {

                cannonFlashTemplate.setPosition((Math.random() - 0.5) * this.innerRadius, (Math.random() - 0.5) * this.innerRadius);
                cannonFlashTemplate.setRotation(Math.random() * Math.PI / 4);
                cannonFlashTemplate.setScale(globalScaleRecip * Math.random() * this.fashScale * t * t, globalScaleRecip * Math.random() * this.fashScale * t * t);
                //cannonFlashTemplate.draw();
            }

        },
        flash: function() {
            var context = this.getContext(),
                innerRadius = this.innerRadius,
                outerRadius = this.outerRadius,
                divs = this.divs;


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
            context.fillStyle = this.fillStyle;
            context.fill();

        },

        speechBubbleDraw: function() {
            var context = this.getContext();

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
        tankDraw: function() {
            var context = this.getContext();

            var size = this.size;
            var numWheels = 4;

            var globalScaleRecip = 1.0 / globals.globalScale;




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






            //the wheels

            var gearTemplate = 0;
            if (typeof(drawShapes.gearTemplate) === "undefined") {
                drawShapes.gearTemplate = new Kinetic.Shape(drawShapes.gear);
                gearTemplate = drawShapes.gearTemplate;

                gearTemplate.innerRadius = this.size / 4.1;
                gearTemplate.spokeHeight = gearTemplate.innerRadius / 5;
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
            else {
                gearTemplate = drawShapes.gearTemplate;
                gearTemplate.setScale(globalScaleRecip); //undo the effect of the global scaling
            }

            var wheelRadius = gearTemplate.innerRadius + gearTemplate.spokeHeight;

            gearTemplate.setRotation(this.pos.x / (wheelRadius) / 2);

            for (var wheel = 0; wheel < numWheels; wheel++) {

                gearTemplate.setPosition(-this.size + wheel * ((this.size) * 2 / (numWheels - 1)), this.size - gearTemplate.innerRadius / 2);
                //gearTemplate.draw();
            }



        },
        invaderDraw: function() {
            var context = this.getContext();
            var globalScaleRecip = 1.0 / globals.globalScale;
            var innerRadius = globals.invaderSpacing / 4;

            var grd = context.createRadialGradient(innerRadius / 2, - innerRadius * 0.8, 0, 0, 0, innerRadius);
            grd.addColorStop(0, "#FFF");
            grd.addColorStop(1, this.fillStyle);


            drawShapes.circle(context, innerRadius + 2, grd, this.strokeStyle, 2);


            //tentacles
            var tentacleTemplate = 0;
            if (typeof(drawShapes.tentacleTemplate) === "undefined") {
                drawShapes.tentacleTemplate = new Kinetic.Shape(drawShapes.tentacle);
                tentacleTemplate = drawShapes.tentacleTemplate;
                tentacleTemplate.fillStyle = this.fillStyle;
                tentacleTemplate.strokeStyle = this.strokeStyle;
                tentacleTemplate.l = globals.invaderSpacing / 4 - 2;
            }
            else {
                tentacleTemplate = drawShapes.tentacleTemplate;
                tentacleTemplate.setScale(globalScaleRecip); //undo the effect of the global scaling
            }

            var date = new Date();
            tentacleTemplate.time = date.getTime();
            var numTentaclesPerSide = 3,
                nT, arcSweep = (Math.PI / 2.0) / numTentaclesPerSide;

            for (nT = 0; nT < numTentaclesPerSide; nT++) {

                tentacleTemplate.setPosition(innerRadius * Math.cos(arcSweep * nT), innerRadius * Math.sin(arcSweep * nT));
                tentacleTemplate.setRotation(arcSweep * nT);
                //tentacleTemplate.draw();
            }

            tentacleTemplate.setScale(-globalScaleRecip, globalScaleRecip);

            for (nT = 0; nT < numTentaclesPerSide; nT++) {
                tentacleTemplate.setPosition(-innerRadius * Math.cos(arcSweep * nT), innerRadius * Math.sin(arcSweep * nT));
                tentacleTemplate.setRotation(-arcSweep * nT);
                //tentacleTemplate.draw();

            }



            //eyes
            var eyeSpacing = globals.invaderSpacing / 5 + 2;

            var eyeTemplate = 0;
            if (typeof(drawShapes.eyeTemplate) === "undefined") {
                drawShapes.eyeTemplate = new Kinetic.Shape(drawShapes.eyeBall);
                eyeTemplate = drawShapes.eyeTemplate;
                eyeTemplate.radius = eyeSpacing * 0.8;
                eyeTemplate.pupilRatio = 1.4;
            }
            else {
                eyeTemplate = drawShapes.eyeTemplate;
                eyeTemplate.setScale(globalScaleRecip); //undo the effect of the global scaling
            }

            eyeTemplate.target = this.lookAtTarget;
            eyeTemplate.invaderPos = {
                "x": this.x,
                "y": this.y
            };
            eyeTemplate.setPosition(-eyeSpacing, 0);
            //eyeTemplate.draw();
            eyeTemplate.setPosition(eyeSpacing, 0);
            //eyeTemplate.draw();
        },
        projectileDraw: function() {
            var context = this.getContext();

            var radius = 5;

            drawShapes.circle(context, radius, this.fillStyle, this.strokeStyle, 1);

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
        gear: function() {

            var context = this.getContext(),
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
            context.fillStyle = this.fillStyle;
            context.fill();
            context.lineWidth = this.lineStyle;
            context.strokeStyle = this.strokeStyle;
            context.stroke();
        },

        eyeBall: function() {
            var context = this.getContext(),
                target = this.target,
                radius = this.radius,
                pupilRatio = this.pupilRatio,
                eye = new Object(),
                limit = radius - radius / pupilRatio;



            var dir = {
                "x": target.x - (this.invaderPos.x + this.x),
                "y": target.y - (this.invaderPos.y + this.y)
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
        tentacle: function() {
            var context = this.getContext();
            var speed = 7;
            var t = (this.time / 1000 * speed) % (2 * Math.PI);
            var l = this.l;
            context.beginPath();
            context.moveTo(0, 10);
            context.bezierCurveTo(l / 3, Math.sin(t) * 5, 7 * l / 8, Math.sin(t + Math.PI / 8) * 10, l, Math.sin(t + Math.PI / 7) * 5);
            context.bezierCurveTo(7 * l / 8, Math.sin(t + Math.PI / 8) * 10, l / 3, Math.sin(t) * 5, 0, - 10);
            context.lineWidth = 3;
            context.strokeStyle = this.strokeStyle;
            context.stroke();
            context.closePath();
            context.fillStyle = this.fillStyle;
            context.fill();
        },


        drawBackDrop: function() {
            var context = this.getContext();
            var fixedStageDims = globals.fixedStageDims;

            context.beginPath();
            context.rect(0, 0, fixedStageDims.width, fixedStageDims.height);

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
                minHeight = 20,
                w, h, pos;

            context.lineWidth = 1;
            context.strokeStyle = "#646464";
            for (var i = 0; i < numBuildings; i++) {
                pos = Math.random() * fixedStageDims.width;
                w = Math.random() * (maxWidth - minWidth) + minWidth;
                h = Math.random() * (maxHeight - minHeight) + minHeight;
                context.beginPath();
                context.rect(pos - w / 2, fixedStageDims.height - h, w, h);
                context.fillStyle = "rgb(" + (125 + Math.floor(Math.random() * 15)) + "," + (125 + Math.floor(Math.random() * 15)) + "," + (125 + Math.floor(Math.random() * 45)) + ")";
                context.fill();
                context.stroke();
            }

            //The track
            context.fillStyle = "#444";
            var trackWidth = 5;
            context.beginPath();
            context.moveTo(0, fixedStageDims.height);
            context.lineTo(0, fixedStageDims.height - trackWidth * 3);
            context.lineTo(trackWidth, fixedStageDims.height - trackWidth * 3);
            context.lineTo(trackWidth, fixedStageDims.height - trackWidth);
            context.lineTo(fixedStageDims.width - trackWidth, fixedStageDims.height - trackWidth);
            context.lineTo(fixedStageDims.width - trackWidth, fixedStageDims.height - trackWidth * 3);
            context.lineTo(fixedStageDims.width, fixedStageDims.height - trackWidth * 3);
            context.lineTo(fixedStageDims.width, fixedStageDims.height);
            context.closePath();
            context.fill();
            context.stroke();


        }

    }
    return drawShapes;
})