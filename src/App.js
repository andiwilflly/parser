import React from 'react';
import mapboxgl from 'mapbox-gl';
import VisibilityObserver, { useVisibilityObserver } from 'react-visibility-observer'
import { Layout, PageHeader, Tabs, Card, Switch, List, Typography } from 'antd';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';

import { observable } from "mobx";
import { observer } from "mobx-react";

import AllMap from "./components/AllMap.component";

import DBGoodWords from "./parser/goodWords";
import DBBadWords from "./parser/badWords";
import DBGoodLocation from "./parser/reports/goodLocation.json";
import DBGoodLocationAndWords from "./parser/reports/goodLocationAndWords.json";
import DBGoodLocationLeft from "./parser/reports/goodLocationLeft";
import DBGoodLocationAndWordsLeft from "./parser/reports/goodLocationAndWordsLeft.json";

import './app.css';


const regExpGood = new RegExp(`(${DBGoodWords.join('|')})`);
const regExpBad = new RegExp(`(${DBBadWords.join('|')})`);

const { TabPane } = Tabs;
const { Footer, Content } = Layout;



mapboxgl.accessToken = 'pk.eyJ1IjoiYW5kaXdpbGxmbHkiLCJhIjoiY2s2cW1qajhoMHB3MDNzcW81dmM4bDlkMSJ9.gmA_WZGL_NxHa4hdx9sttA';
const mapBoxClient = window.mapboxSdk({ accessToken: mapboxgl.accessToken });


const MapContainer = ({ item, index })=> {
	const { isVisible } = useVisibilityObserver();

	React.useEffect(()=> {
		if(isVisible) {
			mapBoxClient.geocoding
				.forwardGeocode({
					query: item.address,
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
						const map = new mapboxgl.Map({
							container: `map${index}`, // container id
							style: 'mapbox://styles/mapbox/streets-v11',
							center: response.body.features[0].center, // starting position
							zoom: 9.5
						});

						map.addControl(new mapboxgl.NavigationControl());

						new mapboxgl.Marker({ color: '#1790ff' }).setLngLat(response.body.features[0].center).addTo(map);

						var distanceContainer = document.getElementById('distance');

						var geojson = {
							'type': 'FeatureCollection',
							'features': []
						};

						var linestring = {
							'type': 'Feature',
							'geometry': {
								'type': 'LineString',
								'coordinates': []
							}
						};

						map.on('load', function() {
							map.addSource('geojson', {
								'type': 'geojson',
								'data': geojson
							});

							map.addLayer({
								id: 'measure-points',
								type: 'circle',
								source: 'geojson',
								paint: {
									'circle-radius': 5,
									'circle-color': '#1790ff'
								},
								filter: ['in', '$type', 'Point']
							});
							map.addLayer({
								id: 'measure-lines',
								type: 'line',
								source: 'geojson',
								layout: {
									'line-cap': 'round',
									'line-join': 'round'
								},
								paint: {
									'line-color': '#1790ff',
									'line-width': 2.5
								},
								filter: ['in', '$type', 'LineString']
							});

							map.on('drag', function(e) {
								geojson.features = [];
								map.getSource('geojson').setData(geojson);
							});

							map.on('zoom', function(e) {
								geojson.features = [];
								map.getSource('geojson').setData(geojson);
							});

							map.on('click', function(e) {
								var features = map.queryRenderedFeatures(e.point, {
									layers: ['measure-points']
								});

								if (geojson.features.length > 1) geojson.features.pop();

								distanceContainer.innerHTML = '';

								if (features.length) {
									var id = features[0].properties.id;
									geojson.features = geojson.features.filter(function(point) {
										return point.properties.id !== id;
									});
								} else {
									var point = {
										'type': 'Feature',
										'geometry': {
											'type': 'Point',
											'coordinates': [e.lngLat.lng, e.lngLat.lat]
										},
										'properties': {
											'id': String(new Date().getTime())
										}
									};

									geojson.features.push(point);
								}

								if (geojson.features.length > 1) {
									linestring.geometry.coordinates = geojson.features.map(function(
										point
									) {
										return point.geometry.coordinates;
									});

									geojson.features.push(linestring);

									var value = document.createElement('pre');
									value.textContent =
										'Total distance: ' +
										window.turf.length(linestring).toLocaleString() +
										'km';
									distanceContainer.appendChild(value);
								}

								map.getSource('geojson').setData(geojson);
							});
						});


						map.on('mousemove', function(e) {
							var features = map.queryRenderedFeatures(e.point, {
								layers: ['measure-points']
							});
							map.getCanvas().style.cursor = features.length
								? 'pointer'
								: 'crosshair';
						});
					}
				});
		}
	}, [isVisible, index, item.address]);


	return (
		<div id={ `map${index}` } style={{ width: '80%', height: 400 }} />
	);
};


class App extends React.Component {

	isLeft = observable.box(false);

	imgSize = 150;

	state = {
		visible: false,
		images: [],
		photoIndex: 0
	};


	get newOffers() {
		return (this.isLeft.get() ? DBGoodLocationAndWordsLeft : DBGoodLocationAndWords).filter(offer => offer.isNew)
	}


	renderList(offers) {
		return (
			<div>
				<AllMap offers={ offers } mapBoxClient={ mapBoxClient } />
				<br/>
				<br/>
				<hr/>

				<List
					bordered
					dataSource={ offers }
					renderItem={(item, i)=> (
						<div style={{ padding: 10, margin: 10, background: 'whitesmoke' }}>
							<h2 style={{ display: 'flex', justifyContent: 'space-between' }}>
								<a rel="noopener noreferrer" href={ item.link } target="_blank">{ item.title }</a>
								<div style={{ fontSize: 15 }}>
									{ item.isNew ? <b style={{ background: '#3cce3c', color: 'white', padding: 5, borderRadius: 5 }}>NEW</b> : null }
									{ DBBadWords.find(word => item.description.includes(word)) ? <b style={{ background: 'red', color: 'white', whiteSpace: "nowrap", padding: 5, borderRadius: 5 }}>{ DBBadWords.find(word => item.description.includes(word)) }</b> : null }
								</div>
							</h2>
							<Typography.Text type="secondary" code><i>{ item.date }</i></Typography.Text>
							<Typography.Text type="danger" code><b>{ item.price } </b>USD</Typography.Text>
							<br/>
							<br/>
							<Typography.Text code>{ item.address }</Typography.Text>
							<br/>
							<br/>

							{/*<VisibilityObserver rootMargin="200px 200px 200px 200px">*/}
							{/*	<MapContainer item={ item } index={i} />*/}
							{/*</VisibilityObserver>*/}
							{/*<br/>*/}
							{/*<br/>*/}

							<div style={{
								display: 'flex',
								flexWrap: 'wrap'
							}}>
								{ item.images.map((src, photoIndex)=> {
									return (
										<div key={src}
											 onClick={ ()=> {
												 this.setState({
													 visible: true,
													 images: item.images,
													 photoIndex
												 })
											 }}
											 style={{
												 cursor: 'pointer',
												 width: this.imgSize + 2,
												 height: this.imgSize + 2,
												 display: 'flex',
												 justifyContent: 'center',
												 background: 'white',
												 margin: 1
											 }}>
											<img src={ src }
												 style={{
													 maxWidth: this.imgSize,
													 objectFit: 'contain',
													 border: '1px solid lightgray',
													 maxHeight: this.imgSize
												 }} />
										</div>
									);
								}) }
							</div>

							<br/>
							<br/>
							{ item.details.map(detail => {
								return (
									<div key={detail}>
										{ detail.includes('Общая площадь') ?
											<div style={{ color: +detail.match(/[0-9]+/) > 280 ? 'red' : '#3cce3c', fontWeight: 'bold' }}>{ detail }</div>
											:
											detail.toLowerCase().match(regExpGood) ?
												<div style={{ color: '#3cce3c', fontWeight: 'bold' }}>{ detail }</div>
												:
												<div>{ detail }</div>
										}
									</div>
								);
							}) }
							<br/>

							<div style={{ display: 'flex', flexWrap: 'wrap' }}>
								{ item.description.split(' ').map((word, i) => {
									return (
										<span key={i}>
									{ word.toLowerCase().match(regExpGood) ?
										<span style={{ color: '#3cce3c', fontWeight: 'bold' }}>{ word }</span>
										:
										word.toLowerCase().match(regExpBad) ?
											<span style={{ color: 'red', fontWeight: 'bold' }}>{ word }</span>
											:
											<span>{ word }</span>
									}
											&nbsp;
									</span>
									);
								}) }
							</div>
						</div>
					)}
				/>
			</div>
		);
	}


	render() {
		return (
			<Layout>
				<PageHeader title="Olx парсер" dark />

				<div id="distance" className="distance-container" />

				<Layout>
					<Content>
						<Card title={
							<div style={{ display: 'flex', justifyContent: 'space-between' }}>
								Список предложений&nbsp;({ this.isLeft.get() ? 'Левый берег' : 'Правый берег' })
								<Switch checked={ this.isLeft.get() }
										onChange={(checked)=> this.isLeft.set(checked) } />
							</div>
						}>
							<Tabs defaultActiveKey="3" animated={ false }>
								<TabPane tab={ "Подходят по расположению " + (this.isLeft.get() ? DBGoodLocationLeft : DBGoodLocation).length } key="1">
									{ this.renderList(this.isLeft.get() ? DBGoodLocationLeft : DBGoodLocation) }
								</TabPane>
								<TabPane tab={ "Подходят по расположению и ключевым словам " + (this.isLeft.get() ? DBGoodLocationAndWordsLeft : DBGoodLocationAndWords).length } key="2">
									{ this.renderList(this.isLeft.get() ? DBGoodLocationAndWordsLeft : DBGoodLocationAndWords) }
								</TabPane>
								<TabPane tab={ "New " + this.newOffers.length } key="3">
									{ this.renderList(this.newOffers) }
								</TabPane>
							</Tabs>
						</Card>
					</Content>
				</Layout>

				{ this.state.visible && (
					<Lightbox
						mainSrc={this.state.images[this.state.photoIndex]}
						nextSrc={this.state.images[(this.state.photoIndex + 1) % this.state.images.length]}
						prevSrc={this.state.images[(this.state.photoIndex + this.state.images.length - 1) % this.state.images.length]}
						onCloseRequest={() => this.setState({ visible: false })}
						onMovePrevRequest={() =>
							this.setState({
								photoIndex: (this.state.photoIndex + this.state.images.length - 1) % this.state.images.length,
							})
						}
						onMoveNextRequest={() =>
							this.setState({
								photoIndex: (this.state.photoIndex + 1) % this.state.images.length,
							})
						}
					/>
				)}
			</Layout>
		);
	}
}

export default observer(App);
