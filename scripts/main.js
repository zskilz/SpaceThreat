require.config({
    
    baseUrl: 'scripts',

    shim: {
        'game': {            
            deps: ['jquery'],
            //exports: 'spacethreat'
        }
    },
    
    paths:{
        jquery: '//ajax.googleapis.com/ajax/libs/jquery/2.0.0/jquery.min',
        kinetic: '//d3lp1msu2r81bx.cloudfront.net/kjs/js/lib/kinetic-v4.4.3.min',
        
        
    }
});


require(['jquery','game'],function($,spacethreat){
    $(function(){
       spacethreat.init('mainStage');
    });
});