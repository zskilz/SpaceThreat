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
