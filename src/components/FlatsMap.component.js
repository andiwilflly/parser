import React from "react";
// Map Ol
import 'ol/ol.css';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {Circle as CircleStyle, Fill, Stroke, Icon, Style} from 'ol/style';
import {fromLonLat} from 'ol/proj';
import TileJSON from 'ol/source/TileJSON';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';


class FlatsMap extends React.Component {

    componentDidMount() {

        const rome = new Feature({
            geometry: new Point(fromLonLat([12.5, 41.9]))
        });

        const london = new Feature({
            geometry: new Point(fromLonLat([-0.12755, 51.507222]))
        });

        const madrid = new Feature({
            geometry: new Point(fromLonLat([-3.683333, 40.4]))
        });

        rome.setStyle(new Style({
            image: new CircleStyle({
                radius: 4,
                fill: new Fill({color: 'orange'}),
            })
        }));

        london.setStyle(new Style({
            image: new CircleStyle({
                radius: 4,
                fill: new Fill({color: 'blue'}),
            })
        }));

        madrid.setStyle(new Style({
            image: new CircleStyle({
                radius: 4,
                fill: new Fill({color: 'yellow'}),
            })
        }));


        const vectorSource = new VectorSource({
            features: [rome, london, madrid]
        });

        const vectorLayer = new VectorLayer({
            source: vectorSource
        });

        // const rasterLayer = new TileLayer({
        //     source: new TileJSON({
        //         url: 'https://a.tiles.mapbox.com/v3/aj.1x1-degrees.json',
        //         crossOrigin: ''
        //     })
        // });

        const tileLayer = new TileLayer({
            source: new OSM()
        });

        const map = new Map({
            layers: [tileLayer, vectorLayer],
            target: document.getElementById('map'),
            view: new View({
                center: fromLonLat([2.896372, 44.60240]),
                zoom: 3
            })
        });
    }


    render() {
        return (
            <div>
                <div id="map" style={{ width: '100wv', height: '100vh' }} />
            </div>
        );
    }
}

export default FlatsMap;