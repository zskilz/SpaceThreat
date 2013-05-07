define(['globals', 'speech'], function(globals, speech) {
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

        projectileDraw: function(canvas) {
            var context = canvas.getContext();

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
})