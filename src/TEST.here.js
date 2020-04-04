var HereMapsAPI = require('here-maps-node').default; // es5

var config = {
    app_id:   'Z7QohhsOAMvDWDM86U2H',
    app_code: 'yNXTO7pg5KdL_J8_BkDe0_PUDGfbTdwagSXAUs37pTY'
};
var hmAPI = new HereMapsAPI(config);

// geocode API
var geocodeParams = {
    "searchtext":    "121, Curtain Road, EC2A 3AD, London UK"
};

hmAPI.geocode(geocodeParams, function(err, result){
    console.log(result, err, 1);
});

// matrix routing API
var matrixRoutingParams = {
    start0: "25.6586716,-100.3583278",
    destination0: "25.6522234,-100.2942806",
    mode: "fastest;car;traffic:enabled;" // this mode is set by default
};

hmAPI.matrixRouting(matrixRoutingParams, function(err, result){
    console.log(result, 2);
});