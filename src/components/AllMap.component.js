import React from "react";
import mapboxgl from "mapbox-gl";


class AllMap extends React.Component {


    map = null;
    geo = {};
    popup = null;


    componentDidMount() {
        this.setupMap();
    }


    async setupMap() {

        for(const offer of this.props.offers) {
            await this.props.mapBoxClient.geocoding
                .forwardGeocode({
                    query: offer.address,
                    autocomplete: false,
                    limit: 1
                })
                .send()
                .then((response)=> {
                    if (
                        response &&
                        response.body &&
                        response.body.features &&
                        response.body.features.length
                    ) {
                        if(!this.map) this.map = new mapboxgl.Map({
                            container: `allMap`, // container id
                            style: 'mapbox://styles/mapbox/streets-v11',
                            center: [30.5241, 50.4501], // starting position
                            zoom: 9
                        });

                        this.geo[offer.link] = response.body.features[0].center;
                    }
                });
        }


        this.map.on('load', ()=> {
            this.addPlaces();

            this.map.on('mouseenter', 'places', (e)=> {
                // Change the cursor style as a UI indicator.
                this.map.getCanvas().style.cursor = 'pointer';

                var coordinates = e.features[0].geometry.coordinates.slice();
                var description = e.features[0].properties.description;

                // Ensure that if the this.map is zoomed out such that multiple
                // copies of the feature are visible, the popup appears
                // over the copy being pointed to.
                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

                // Populate the popup and set its coordinates
                // based on the feature found.
                this.popup
                    .setLngLat(coordinates)
                    .setHTML(description)
                    .addTo(this.map);
            });

            this.map.on('mouseleave', 'places', ()=> {
                this.map.getCanvas().style.cursor = '';
                this.popup.remove();
            });

            this.map.on('click', 'places', (e)=> {
                const placeGeo = e.features[0].geometry.coordinates.slice();
                const placeLink = Object.keys(this.geo).find(link => {
                    const geo = this.geo[link];
                    return geo[0].toFixed(3) === placeGeo[0].toFixed(3) &&
                           geo[1].toFixed(3) === placeGeo[1].toFixed(3)
                });
                window.open(placeLink, '_blank');
            });
        });
    }


    addPlaces() {
        this.map.addSource('places', {
            'type': 'geojson',
            'data': {
                'type': 'FeatureCollection',
                'features': this.props.offers.map(offer => ({
                    'type': 'Feature',
                    'properties': {
                        'description':
                            `<div>
                                <strong>${offer.title}</strong>
                                <br />
                                <b style="color: forestgreen">${offer.price} USD</b>                                                      
                            </div>`,
                        'icon': 'monument',
                        'title': 'Washington DC',
                    },
                    'geometry': {
                        'type': 'Point',
                        'coordinates': this.geo[offer.link]
                    }
                }))
            }
        });


        // Add a layer showing the places.
        this.map.addLayer({
            'id': 'places',
            'type': 'symbol',
            'source': 'places',
            'layout': {
                'icon-image': '{icon}-15',
                'icon-allow-overlap': true
            }
        });

        // Create a popup, but don't add it to the this.map yet.
        this.popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });
    }


    render() {

        return (
            <div style={{ position: 'relative' }}>
                <div id='allMap' style={{ width: '100%', height: 500 }} />
            </div>
        );
    }
}


export default AllMap;
