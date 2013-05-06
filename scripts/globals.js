define(function() {
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