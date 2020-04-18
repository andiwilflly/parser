import React from "react";
import Fuse from 'fuse.js';
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
import DB_FLATS from "../@PARSER/reports/offers.parsed.json";


const options = {
    shouldSort: false,
    includeScore: false,
    includeMatches: false, // TODO
    threshold: 0.25,
    location: 0,
    distance: 200,
    maxPatternLength: 200,
    minMatchCharLength: 3,
    keys: [
        "flat.title",
        "flat.address.district",
        "flat.address.label"
    ]
};

class FlatsMap extends React.Component {

    fuse = null;
    MAP = null;
    flats = {};
    notInMapFlats = {};

    isMapReady = observable.box(false);
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
        this.getLocations();

        const vectorSource = new VectorSource({
            features: this.dots
        });

        this.vectorLayer = new VectorLayer({
            source: vectorSource
        });

        const tileLayer = new TileLayer({
            source: new OSM()
        });

        this.MAP = new Map({
            layers: [tileLayer, this.vectorLayer],
            target: document.getElementById('map'),
            view: new View({
                center: fromLonLat([30.5241, 50.4501]),
                zoom: 12
            })
        });

        this.MAP.set('layers', []);
        this.MAP.render();

        this.createPopup();
        this.isMapReady.set(true);

        this.fuse = new Fuse(Object.values(this.flats), options);
    }


    get selectedFlats() { return this.clickedFlats.ids.map(link => this.flats[link].flat); }
    get hoveredFlats() { return this.hoveredFlatsData.ids.map(link => this.flats[link].flat); }
    get dots() { return Object.values(this.flats).map(flat => flat.dot); }


    getLocations() {
        for(const flat of DB_FLATS) {
            this.createFlat({
                ...flat,
                address: flat.geo.location.address
            }, [flat.geo.location.displayPosition.longitude, flat.geo.location.displayPosition.latitude]); // latitude longitude
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
                fill: new Fill({ color: flat.isNew ? 'green' : flat.color }),
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


    setFeatures(features) {
        this.vectorLayer.getSource().clear();
        this.vectorLayer.getSource().addFeatures(features);
    }


    timeout = null;
    onSearch = (e)=> {
        clearTimeout(this.timeout);
        this.timeout = setTimeout((text)=> {
            if(text.length < 3) return this.setFeatures(this.dots); // Set all

            this.setFeatures(this.fuse.search(text).map(flat => flat.dot));

        }, 400, e.target.value);
    };


    renderFlat = (flat, size = 100, isShowImg = true)=> {
        return (
            <div key={ flat.title }
                 style={{
                     width: size*1.5,
                     padding: 5,
                     border: `2px solid ${flat.isNew ? 'green' : flat.color}`
                 }}>
                <a href={ flat.link }
                   target="_blank"
                   style={{ fontSize: 12 }}>{ flat.title }</a>
                <hr/>
                <b style={{ color: '#ff6a16', fontSize: 14 }}>{ flat.price }</b>
                { isShowImg ?
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
                    :
                    null }

                <div style={{ fontSize: 10 }}><i>{ flat.address.label }</i></div>
                <div style={{ fontSize: 10, color: flat.color }}><i>({ flat.source })</i></div>
            </div>
        )
    };


    render() {
        return (
            <div>
                {/*<button style={{ position: 'fixed', right: 10, top: 10, zIndex: 2 }}*/}
                {/*        onClick={ ()=> this.isShowNotInMapFlats.set(!this.isShowNotInMapFlats.get()) }>*/}
                {/*    { !this.isShowNotInMapFlats.get() ? 'Показать квартиры не на карте' : 'Скрыть квартиры не на карте' }*/}
                {/*</button>*/}

                <div style={{ position: 'fixed', right: 10, top: 10, zIndex: 2 }}>
                    <input type="search"
                           placeholder='Искать хату'
                           onChange={ this.onSearch }
                           style={{ outline: 'none', border: '1px solid #85be7a', width: 350, padding: 5 }} />
                </div>

                { this.isShowNotInMapFlats.get() ?
                    <div style={{ height: '100vh', overflow: 'auto', zIndex: 1, position: 'fixed', top: 0, left: 0, background: 'white', padding: 5, fontSize: 10 }}>
                        { Object.values(this.notInMapFlats).map((flat, i)=> {
                            return <p key={i}><a href={flat.link} target="_blank">{ flat.title }</a></p>
                        })}
                    </div>
                    : null }

                <div id="map" style={{ width: '100wv', height: '100vh' }}>
                    { this.isMapReady.get() ?
                        null
                        :
                        <img src="https://freefrontend.com/assets/img/css-loaders/css-fun-Little-loader.gif"
                             style={{ width: '100vw', height: '100vh' }} /> }

                    <div id="popup" />
                </div>

                { this.hoveredFlatsData.ids.length ?
                    <div id="smallPopup" style={{
                        position: 'fixed',
                        background: 'white',
                        lineHeight: '100%',
                        display: 'grid',
                        gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(this.hoveredFlats.length))}, 1fr)`,
                        gridTemplateRows: `repeat(${Math.round(Math.sqrt(this.hoveredFlats.length))}, 1fr)`,
                        gridColumnGap: 3,
                        gridRowGap: 3,
                        top: this.hoveredFlatsData.top,
                        boxShadow: '0px 0px 38px 10px rgba(143,143,143,1)',
                        left: this.hoveredFlatsData.left,
                        zIndex: 100
                    }}>
                        { this.hoveredFlats.map(flat => this.renderFlat(flat, 100, false)) }
                    </div>
                    :
                    null }

                { this.clickedFlats.ids.length ?
                    <div id="info" style={{
                        position: 'fixed',
                        bottom: 5,
                        lineHeight: '100%',
                        right: 5,
                        zIndex: 101,
                        overflow: 'auto',
                        maxHeight: '80vh',
                        maxWidth: '60vw',
                        boxShadow: '0px 0px 38px 10px rgba(143,143,143,1)',
                        display: 'grid',
                        gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(this.selectedFlats.length))}, 1fr)`,
                        gridTemplateRows: `repeat(${Math.ceil(Math.sqrt(this.selectedFlats.length))}, 1fr)`,
                        gridColumnGap: 3,
                        gridRowGap: 3,
                        background: 'whitesmoke',
                        padding: 5
                    }}>
                        { this.selectedFlats.map(flat => this.renderFlat(flat, 120)) }
                    </div>
                    : null }
            </div>
        );
    }
}

export default observer(FlatsMap);