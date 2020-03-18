import React from "react";
// MobX
import { observable } from "mobx";
import { observer } from "mobx-react";
// Map Ol
import 'ol/ol.css';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import Overlay from 'ol/Overlay';
import Point from 'ol/geom/Point';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {Circle as CircleStyle, Fill, Stroke, Icon, Style} from 'ol/style';
import {fromLonLat} from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
// Offers
import DB_FLATS from "../parser/reports/parsedOffers.json";

// import GEOCODER from './geocoder.util';
//
// GEOCODER('Украина Киев улица Маяковского 63а');
// GEOCODER('Украина Киев улица Маяковского 63');

function randomInteger(min, max) {
    // получить случайное число от (min-0.5) до (max+0.5)
    let rand = min - 0.5 + Math.random() * (max - min + 1);
    return Math.round(rand);
}

const platform = new window.H.service.Platform({
    apikey: 'yNXTO7pg5KdL_J8_BkDe0_PUDGfbTdwagSXAUs37pTY'
});



class FlatsMap extends React.Component {

    MAP = null;
    flats = {};
    notInMapFlats = {};

    selectedFlatId = observable.box(null);


    async componentDidMount() {
        await this.getLocations();

        const vectorSource = new VectorSource({
            features: this.dots
        });

        const vectorLayer = new VectorLayer({
            source: vectorSource
        });

        const tileLayer = new TileLayer({
            source: new OSM()
        });

        this.MAP = new Map({
            layers: [tileLayer, vectorLayer],
            target: document.getElementById('map'),
            view: new View({
                center: fromLonLat([30.5241, 50.4501]),
                zoom: 10
            })
        });

        this.MAP.set('layers', []);
        this.MAP.render();

        this.createPopup();
        this.forceUpdate();
    }


    get selectedFlat() { return this.flats[this.selectedFlatId.get()].flat; }
    get dots() { return Object.values(this.flats).map(flat => flat.dot); }


    async getLocations() {
        for(const flat of DB_FLATS) {

            await new Promise(resolve => {
                const geocoder = platform.getGeocodingService();
                geocoder.geocode(
                    {
                        searchText: `${flat.address}, Київ, 02095, Україна`,
                        jsonattributes : 1
                    },
                    (result)=> {
                        let locations = result.response.view[0];
                        if(locations && locations.result && locations.result.length) {
                            const relevance = locations.result[0].relevance;
                            const location = locations.result[0].location;
                            const position = location.displayPosition;
                            const address = location.address;

                            // Not found in map
                            if(relevance < 0.7 ) {
                                this.notInMapFlats[flat.link] = flat;
                                return resolve();
                            }

                            this.createFlat({ ...flat, address }, [position.longitude, position.latitude]); // latitude longitude
                            resolve();
                        } else {
                            // Not found in map
                            this.notInMapFlats[flat.link] = flat;
                            resolve();
                        }


                    },
                    (e)=> {
                        console.log('error', e);
                        resolve();
                    }
                );
            });
        }
    }


    createFlat(flat = {}, location) {
        const flatDot = new Feature({
            ...flat,
            geometry: new Point(fromLonLat(location))
        });

        flatDot.setStyle(new Style({
            image: new CircleStyle({
                radius: 7,
                fill: new Fill({ color: 'blue' }),
                stroke: new Stroke({ color: 'white', width: 1 })
            })
        }));

        this.flats[flat.link] = {
            dot: flatDot,
            flat,
            location
        };
    }


    createPopup() {
        const info = window.$('#info');
        info.tooltip({
            animation: false,
            trigger: 'manual'
        });

        const displayFeatureInfo = (pixel)=> {
            info.css({
                left: pixel[0] + 'px',
                top: (pixel[1] - 25) + 'px'
            });
            const feature = this.MAP.forEachFeatureAtPixel(pixel, (feature)=> feature);
            if(feature) {

                this.flats[feature.get('link')].visited = true;
                this.forceUpdate();


                info.tooltip('hide')
                    .attr('data-original-title', `${feature.values_.address.label } (${feature.get('price')})`)
                    .tooltip('fixTitle')
                    .tooltip('show');
                this.MAP.getViewport().style.cursor = 'pointer';
            } else {
                info.tooltip('hide');
                this.MAP.getViewport().style.cursor = 'inherit';
            }
        };

        this.MAP.on('click', (event)=> {
            const flatDot = this.MAP.getFeaturesAtPixel(event.pixel)[0];
            if (flatDot) {
                info.tooltip('hide');
                console.log(flatDot.values_);
                this.selectedFlatId.set(flatDot.values_.link);
            } else {
                this.selectedFlatId.set(null);
            }
        });

        this.MAP.on('pointermove', (event)=> {
            if (event.dragging) {
                info.tooltip('hide');
                return;
            }
            displayFeatureInfo(this.MAP.getEventPixel(event.originalEvent));
        });
    }


    render() {
        return (
            <div>
                <div style={{ height: '100vh', overflow: 'auto', zIndex: 1, position: 'fixed', top: 0, left: 0, background: 'white', padding: 5, fontSize: 10 }}>
                    <h4>Not found in map</h4>
                    { Object.values(this.notInMapFlats).map((flat, i)=> {
                        return <p key={i}><a href={flat.link} target="_blank">{ flat.address }</a></p>
                    })}
                </div>

                <div id="map" style={{ width: '100wv', height: '100vh' }} >
                    <div id="popup" />
                </div>
                <div id="info" style={{
                    position: 'absolute',
                    height: 1,
                    width: 1,
                    zIndex: 100
                }}/>

                { this.selectedFlatId.get() ?
                    <div id="info" style={{
                        position: 'fixed',
                        bottom: 5,
                        right: 5,
                        overflow: 'auto',
                        maxHeight: '80vh',
                        boxShadow: '0px 0px 38px 10px rgba(143,143,143,1)',
                        width: 500,
                        minHeight: 500,
                        background: 'whitesmoke',
                        padding: 5
                    }}>
                        { this.selectedFlat.isNew ?
                            <div style={{
                                background: 'green',
                                color: 'white',
                                position: 'absolute',
                                top: 60,
                                right: 10,
                                padding: 5,
                                borderRadius: 5
                            }}>new</div>
                            : null }

                        <a href={ this.selectedFlat.link} target='_blank'>{ this.selectedFlat.title }</a>
                        <br/>
                        <b style={{ color: 'orange' }}>{ this.selectedFlat.price }</b>
                        <br/>
                        <i>{ this.selectedFlat.address.label }</i>
                        <br/>
                        <i style={{ fontSize: 11, color: 'gray' }}>{ this.selectedFlat.date }</i>
                        <hr />
                        <div style={{
                            width: '100%',
                            display: 'flex',
                            flexWrap: 'wrap',
                            background: 'whitesmoke',
                            justifyContent: 'start'
                        }}>
                            { this.selectedFlat.images.map(src => {
                                return (
                                    <img src={ src }
                                         key={src}
                                         style={{
                                             maxWidth: 150,
                                             objectFit: 'contain',
                                             margin: 2,
                                             maxHeight: 150
                                         }} />
                                )
                            }) }
                        </div>
                        <hr/>
                        <div>
                            { this.selectedFlat.description }
                        </div>
                    </div>
                    : null }
            </div>
        );
    }
}

export default observer(FlatsMap);