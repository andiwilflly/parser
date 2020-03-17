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

function randomInteger(min, max) {
    // получить случайное число от (min-0.5) до (max+0.5)
    let rand = min - 0.5 + Math.random() * (max - min + 1);
    return Math.round(rand);
}

const platform = new window.H.service.Platform({
    apikey: 'H6XyiCT0w1t9GgTjqhRXxDMrVj9h78ya3NuxlwM7XUs'
});



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

        this.MAP.set('layers', []);
        this.MAP.render();

        this.createPopup();
        this.forceUpdate();
    }


    get selectedFlat() { return this.flats[this.selectedFlatId.get()].flat; }
    get dots() { return Object.values(this.flats).map(flat => flat.dot); }


    async getLocations() {
        for(const flat of DB_FLATS) {

            // await new Promise(resolve => {
            //     const geocoder = platform.getGeocodingService();
            //     geocoder.geocode(
            //         {
            //             searchText: `Украина Киев ${flat.address}`,
            //             jsonattributes : 1
            //         },
            //         (result)=> {
            //             var locations = result.response.view[0].result;
            //             console.log(locations, "locations!");
            //             resolve();
            //         },
            //         (e)=> {
            //             console.log('error', e);
            //             resolve();
            //         }
            //     );
            // });

            await this.props.mapBoxClient.geocoding
                .forwardGeocode({
                    query: `Украина Киев ${flat.address}`,
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
                        const axes = response.body.features[0].center;
                        this.createFlat(flat, axes);
                        // this.createFlat(flat, [axes[0] + (Math.random()/1000), axes[1] + (Math.random()/1000)]);
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
                    .attr('data-original-title', `${feature.get('title')} (${feature.get('price')})`)
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
                    {/*{ this.dots.map((dot, i)=> {*/}
                    {/*    const link = this.flats[dot.values_.link];*/}
                    {/*    return <div key={i} style={{ background: link.visited ? 'red' : 'lightgray' }}>*/}
                    {/*        {dot.values_.address} | { link.location[0] } : { link.location[1] }*/}
                    {/*    </div>*/}
                    {/*})}*/}
                    { DB_FLATS.map((flat, i)=> {
                        const link = this.flats[flat.link];
                        if(!link) return null;
                        return <div key={i} style={{ background: link.visited ? 'red' : 'lightgray' }}>
                            {flat.address} | { link.location[0] } : { link.location[1] }
                        </div>
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