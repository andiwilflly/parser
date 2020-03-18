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


const platform = new window.H.service.Platform({
    apikey: 'yNXTO7pg5KdL_J8_BkDe0_PUDGfbTdwagSXAUs37pTY'
});



class FlatsMap extends React.Component {

    MAP = null;
    flats = {};
    notInMapFlats = {};

    isShowNotInMapFlats = observable.box(false);
    selectedFlatId = observable.box(null);
    hoveredFlatData = observable({
        id: '',
        top: '',
        left: ''
    });


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
    get hoveredFlat() { return this.flats[this.hoveredFlatData.id] ? this.flats[this.hoveredFlatData.id].flat : null; }
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
                radius: 5,
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
                this.hoveredFlatData.id = '';
                this.selectedFlatId.set(flatDot.values_.link);
            } else {
                this.selectedFlatId.set(null);
            }
        });

        this.MAP.on('pointermove', (event)=> {
            if(event.dragging) return this.hoveredFlatData.id = '';

            const pixel = this.MAP.getEventPixel(event.originalEvent);
            const feature = this.MAP.forEachFeatureAtPixel(pixel, (feature)=> feature);
            this.hoveredFlatData.id = feature ? feature.values_.link : '';
            this.hoveredFlatData.left = pixel[0];
            this.hoveredFlatData.top = pixel[1] + 25;
            this.MAP.getViewport().style.cursor = feature ? 'pointer' : 'inherit';
        });
    }


    render() {
        return (
            <div>
                <button style={{ position: 'fixed', right: 10, top: 10, zIndex: 2 }}
                        onClick={ ()=> this.isShowNotInMapFlats.set(!this.isShowNotInMapFlats.get()) }>
                    { !this.isShowNotInMapFlats.get() ? 'Показать квартиры не на карте' : 'Скрыть квартиры не на карте' }
                </button>
                { this.isShowNotInMapFlats.get() ?
                    <div style={{ height: '100vh', overflow: 'auto', zIndex: 1, position: 'fixed', top: 0, left: 0, background: 'white', padding: 5, fontSize: 10 }}>
                        { Object.values(this.notInMapFlats).map((flat, i)=> {
                            return <p key={i}><a href={flat.link} target="_blank">{ flat.address }</a></p>
                        })}
                    </div>
                    : null }

                <div id="map" style={{ width: '100wv', height: '100vh' }}>
                    <div id="popup" />
                </div>

                { this.hoveredFlat ?
                    <div id="smallPopup" style={{
                        position: 'fixed',
                        background: 'white',
                        padding: 5,
                        maxWidth: 250,
                        top: this.hoveredFlatData.top,
                        boxShadow: '0px 0px 38px 10px rgba(143,143,143,1)',
                        left: this.hoveredFlatData.left,
                        zIndex: 100
                    }}>
                        <div style={{ fontSize: 12 }}>{ this.hoveredFlat.title }</div>
                        <div style={{ color: 'orange', fontSize: 14 }}>{ this.hoveredFlat.price }</div>
                        <hr/>
                        <div style={{ fontSize: 10 }}><i>{ this.hoveredFlat.address.label }</i></div>
                    </div>
                    : null }

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