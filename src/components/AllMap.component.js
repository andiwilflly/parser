import { useVisibilityObserver } from "react-visibility-observer";
import React from "react";
import mapboxgl from "mapbox-gl";


const AllMap = ({ offers, mapBoxClient })=> {

    React.useEffect(async ()=> {
        let map = null;
        let geo = {};

        for(const offer of offers) {
            await mapBoxClient.geocoding
                .forwardGeocode({
                    query: offer.address,
                    autocomplete: false,
                    limit: 1
                })
                .send()
                .then(function(response) {
                    if (
                        response &&
                        response.body &&
                        response.body.features &&
                        response.body.features.length
                    ) {
                        if(!map) map = new mapboxgl.Map({
                            container: `allMap`, // container id
                            style: 'mapbox://styles/mapbox/streets-v11',
                            center: [30.5241, 50.4501], // starting position
                            zoom: 9
                        });

                        geo[offer.title] = response.body.features[0].center;
                    }
                });
        }


        map.on('load', function() {
            map.addSource('places', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': offers.map(offer => ({
                        'type': 'Feature',
                        'properties': {
                            'description':
                                `<strong>${offer.title}</strong>
                                <strong>${offer.price}</strong>
                                 <hr />
                                 <p>${offer.description}</p>`,
                            'icon': 'art-gallery'
                        },
                        'geometry': {
                            'type': 'Point',
                            'coordinates': geo[offer.title]
                        }
                    }))
                }
            });




            // Add a layer showing the places.
            map.addLayer({
                'id': 'places',
                'type': 'symbol',
                'source': 'places',
                'layout': {
                    'icon-image': '{icon}-15',
                    'icon-allow-overlap': true
                }
            });

// Create a popup, but don't add it to the map yet.
            var popup = new mapboxgl.Popup({
                closeButton: false,
                closeOnClick: false
            });

            map.on('mouseenter', 'places', function(e) {
// Change the cursor style as a UI indicator.
                map.getCanvas().style.cursor = 'pointer';

                var coordinates = e.features[0].geometry.coordinates.slice();
                var description = e.features[0].properties.description;

// Ensure that if the map is zoomed out such that multiple
// copies of the feature are visible, the popup appears
// over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

// Populate the popup and set its coordinates
// based on the feature found.
                popup
                    .setLngLat(coordinates)
                    .setHTML(description)
                    .addTo(map);
            });

            map.on('mouseleave', 'places', function() {
                map.getCanvas().style.cursor = '';
                popup.remove();
            });
        });

    }, [offers]);


    return (
        <div style={{ position: 'relative' }}>
            <div id='allMap' style={{ width: '100%', height: 500 }} />
        </div>
    );
};

export default AllMap;
