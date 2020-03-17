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


class FlatsMap extends React.Component {

    MAP = null;
    flats = {};

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

        this.createPopup();
    }


    get selectedFlat() { return this.flats[this.selectedFlatId.get()].flat; }
    get dots() { return Object.values(this.flats).map(flat => flat.dot); }


    async getLocations() {
        for(const flat of DB_FLATS) {
            await this.props.mapBoxClient.geocoding
                .forwardGeocode({
                    query: `Киев, ${flat.address}`,
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
                        this.createFlat(flat, response.body.features[0].center);
                    }
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
        this.MAP.on('click', (event)=> {
            const flatDot = this.MAP.getFeaturesAtPixel(event.pixel)[0];
            if (flatDot) {
                this.selectedFlatId.set(flatDot.values_.link);
            } else {
                this.selectedFlatId.set(null);
            }
        });

        this.MAP.on('pointermove', (event)=> {
            const flatDot = this.MAP.getFeaturesAtPixel(event.pixel)[0];
            if (this.MAP.hasFeatureAtPixel(event.pixel)) {
                this.MAP.getViewport().style.cursor = 'pointer';
                //this.selectedFlatId.set(flatDot.values_.link);
            } else {
                this.MAP.getViewport().style.cursor = 'inherit';
                //this.selectedFlatId.set(null);
            }
        });
    }


    render() {
        if(this.selectedFlatId.get()) console.log(this.selectedFlat);
        return (
            <div>
                <div id="map" style={{ width: '100wv', height: '100vh' }} >
                    <div id="popup" />
                </div>
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
                        <i>{ this.selectedFlat.address }</i>
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