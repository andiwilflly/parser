var platform = new window.H.service.Platform({
    apikey: 'yNXTO7pg5KdL_J8_BkDe0_PUDGfbTdwagSXAUs37pTY'
});


function geocode(place) {
    var geocoder = platform.getGeocodingService(),
        geocodingParameters = {
            searchText: place || 'Украина Киев улица Маяковского 63а',
            jsonattributes : 1
        };

    geocoder.geocode(
        geocodingParameters,
        onSuccess,
        onError
    );
}


function onSuccess(result) {
    var locations = result.response.view[0].result;

    console.log(locations, "locations!");
}

/**
 * This function will be called if a communication error occurs during the JSON-P request
 * @param  {Object} error  The error message received.
 */
function onError(error) {
    alert('Can\'t reach the remote server');
}


//Step 1: initialize communication with the platform
// In your own code, replace variable window.apikey with your own apikey


// Now use the map as required...
export default geocode;