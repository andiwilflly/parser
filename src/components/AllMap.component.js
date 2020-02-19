import React from "react";
import { observable } from "mobx";
import { observer } from "mobx-react";
import mapboxgl from "mapbox-gl";


class AllMap extends React.Component {


    map = null;
    geo = {};
    popup = null;


    componentDidMount() {
        this.setupMap();
    }


    componentDidUpdate(prevProps, prevState, snapshot) {
        if(JSON.stringify(this.props.offers) === JSON.stringify(prevProps.offers)) return;
        // if(this.props.offers.length === prevProps.offers.length) return;
        this.map.remove();
        this.map = null;
        this.geo = {};
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
                            style: `mapbox://styles/mapbox/streets-v11`,
                            center: [30.5241, 50.4501], // starting position
                            zoom: 10,
                        });

                        const location = response.body.features[0].center;
                        const duplicated = Object.values(this.geo).filter(geo => {
                            return geo[0] === location[0] &&
                                   geo[1] === location[1];
                        });

                        this.geo[offer.link] = duplicated.length ?
                            [location[0] + 0.01, location[1] + 0.01]
                            :
                            location;
                    }
                });
        }

        // https://github.com/mapbox/mapbox-gl-directions
        this.map.addControl(
            new window.MapboxDirections({
                accessToken: mapboxgl.accessToken,
                zoom: 10,
                flyTo: false,
                congestion: true,
                alternatives: true,
                placeholderOrigin: 'Звідки',
                placeholderDestination: 'Куди',
                controls: {
                    profileSwitcher: true
                }
            }),
            'top-right'
        );

        this.map.on('load', ()=> {
            this.addPlaces();

            this.map.on('mouseenter', 'places', (e)=> {
                // Change the cursor style as a UI indicator.
                this.map.getCanvas().style.cursor = 'pointer';

                var coordinates = e.features[0].geometry.coordinates.slice();
                var description = e.features[0].properties.description;

                while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                    coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                }

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
                'features': this.props.offers.map((offer, i)=> ({
                    'type': 'Feature',
                    'properties': {
                        'description':
                            `<div>
                                <b style="color: forestgreen">${offer.price} USD</b>    
                                <br>
                                <strong>${offer.title}</strong>                                                          
                                <hr>
                                <i>${offer.address}</i>     
                                <br />
                                <div style="width: 100%; height: 100px; display: flex; background: whitesmoke; justify-content: space-around">
                                    <img src="${offer.images[0]}" 
                                         style="max-width: 50%; object-fit: contain; margin: 1px; max-height: 100px">  
                                    <img src="${offer.images[1]}" 
                                         style="max-width: 50%; object-fit: contain; margin: 1px; max-height: 100px">                                                                    
                                </div>
                            </div>`,
                        'icon': 'rocket'
                    },
                    'geometry': {
                        'type': 'Point',
                        'coordinates': this.geo[offer.link]
                    }
                }))
            }
        });

        this.map.loadImage(
            'https://encrypted-tbn0.gstatic.com/images?q=tbn%3AANd9GcQy5hI_8kp49sn1AN9iSSklHlgRo3z5efnSJ_F0zhnIB4ZhlcSA',
            (error, image)=> {
                if (error) throw error;
                this.map.addImage('house', image);

                this.map.addLayer({
                    'id': 'places',
                    'type': 'symbol',
                    'source': 'places',
                    'layout': {
                        'icon-image': 'house',
                        'icon-size': 0.07
                    }
                });
            }
        );

        // Create a popup, but don't add it to the this.map yet.
        this.popup = new mapboxgl.Popup({
            closeButton: false,
            closeOnClick: false
        });
    }


    render() {

        return (
            <div style={{ position: 'relative' }}>
                <div id="distance" className="distance-container" />
                <div id='allMap' style={{ width: '100%', height: 'calc(100vh - 65px)' }} />
            </div>
        );
    }
}


export default observer(AllMap);
