import React from "react";
// MobX
import { observable } from "mobx";
import { observer } from "mobx-react";
// Map Ol
import 'ol/ol.css';
import Feature from 'ol/Feature';
import Map from 'ol/Map';
import View from 'ol/View';
import Point from 'ol/geom/Point';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {Circle as CircleStyle, Fill, Stroke, Icon, Style} from 'ol/style';
import { fromLonLat } from 'ol/proj';
import VectorSource from 'ol/source/Vector';
import OSM from 'ol/source/OSM';
// Offers
import DB_FLATS from "../@PARSER/reports/olx.offers.parsed.json";


const platform = new window.H.service.Platform({
    apikey: 'yNXTO7pg5KdL_J8_BkDe0_PUDGfbTdwagSXAUs37pTY'
});



class FlatsMap extends React.Component {

    MAP = null;
    flats = {};
    notInMapFlats = {};

    isShowNotInMapFlats = observable.box(false);
    clickedFlats = observable({
        ids: []
    });
    hoveredFlatsData = observable({
        ids: [],
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
                zoom: 11
            })
        });

        this.MAP.set('layers', []);
        this.MAP.render();

        this.createPopup();
        this.forceUpdate();
    }


    get selectedFlats() { return this.clickedFlats.ids.map(link => this.flats[link].flat); }
    get hoveredFlats() { return this.hoveredFlatsData.ids.map(link => this.flats[link].flat); }
    get dots() { return Object.values(this.flats).map(flat => flat.dot); }


    async getLocations() {
        for(const flat of DB_FLATS) {
            // LS load
            if(window.localStorage.getItem(flat.link)) {
                const flatLS = JSON.parse(window.localStorage.getItem(flat.link));
                this.createFlat(flatLS.flat, flatLS.position) // latitude longitude
                continue;
            }

            await new Promise(resolve => {
                const geocoder = platform.getGeocodingService();
                geocoder.geocode(
                    {
                        searchText: `${flat.address}, ${flat.district}, Київ, 02095, Україна`,
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
                                // LS save not found flat
                                return resolve();
                            }

                            this.createFlat({ ...flat, address }, [position.longitude, position.latitude]); // latitude longitude
                            // LS save
                            window.localStorage.setItem(flat.link, JSON.stringify({
                                flat: { ...flat, address },
                                position: [position.longitude, position.latitude]
                            }));
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
                radius: 6,
                fill: new Fill({ color: 'red' }),
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
            const features = this.MAP.getFeaturesAtPixel(event.pixel);
            this.hoveredFlatsData.ids = [];
            this.clickedFlats.ids = features.map(feature => feature.values_.link);
        });

        this.MAP.on('pointermove', (event)=> {
            if(event.dragging) return this.hoveredFlatsData.ids = [];

            const pixel = this.MAP.getEventPixel(event.originalEvent);
            const features = this.MAP.getFeaturesAtPixel(pixel);

            this.hoveredFlatsData.ids = features.map(feature => feature.values_.link);
            this.hoveredFlatsData.left = pixel[0];
            this.hoveredFlatsData.top = pixel[1] + 25;
            this.MAP.getViewport().style.cursor = features.length ? 'pointer' : 'inherit';
        });
    }


    renderFlat = (flat, size = 100)=> {
        return (
            <div key={ flat.title }
                 style={{ width: size*1.5, padding: 3, background: 'lightgray' }}>
                <a href={ flat.link }
                   target="_blank"
                   style={{ fontSize: 12 }}>{ flat.title }</a><br/>
                <b style={{ color: '#1890ff', fontSize: 14 }}>{ flat.price }</b>
                <div style={{
                    width: size,
                    display: 'flex',
                    flexWrap: 'wrap',
                    height: size,
                    margin: '4px 0',
                    justifyContent: 'start'
                }}>
                    <img src={ DB_FLATS.find(f => f.title === flat.title).img }
                         style={{
                             maxWidth: size - 10,
                             objectFit: 'contain',
                             margin: 1,
                             maxHeight: size - 5
                         }} />
                </div>
                <div style={{ fontSize: 10 }}><i>{ flat.district }, { flat.address.label }</i></div>
            </div>
        )
    };


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
                            return <p key={i}><a href={flat.link} target="_blank">{ flat.title }</a></p>
                        })}
                    </div>
                    : null }

                <div id="map" style={{ width: '100wv', height: '100vh' }}>
                    <div id="popup" />
                </div>

                { this.hoveredFlatsData.ids.length ?
                    <div id="smallPopup" style={{
                        position: 'fixed',
                        background: 'white',
                        lineHeight: '100%',
                        display: 'grid',
                        gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(this.hoveredFlats.length))}, 1fr)`,
                        gridTemplateRows: `repeat(${Math.ceil(Math.sqrt(this.hoveredFlats.length))}, 1fr)`,
                        gridColumnGap: 2,
                        gridRowGap: 2,
                        top: this.hoveredFlatsData.top,
                        boxShadow: '0px 0px 38px 10px rgba(143,143,143,1)',
                        left: this.hoveredFlatsData.left,
                        zIndex: 100
                    }}>
                        { this.hoveredFlats.map(flat => this.renderFlat(flat, 100)) }
                    </div>
                    : null }

                { this.clickedFlats.ids.length ?
                    <div id="info" style={{
                        position: 'fixed',
                        bottom: 5,
                        right: 5,
                        zIndex: 101,
                        overflow: 'auto',
                        maxHeight: '80vh',
                        maxWidth: '60vw',
                        boxShadow: '0px 0px 38px 10px rgba(143,143,143,1)',
                        display: 'grid',
                        gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(this.selectedFlats.length))}, 1fr)`,
                        gridTemplateRows: `repeat(${Math.ceil(Math.sqrt(this.selectedFlats.length))}, 1fr)`,
                        gridColumnGap: 2,
                        gridRowGap: 2,
                        background: 'whitesmoke',
                        padding: 5
                    }}>
                        { this.selectedFlats.map(flat => this.renderFlat(flat, 250)) }
                    </div>
                    : null }
            </div>
        );
    }
}

export default observer(FlatsMap);