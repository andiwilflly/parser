import React from 'react';
import { Layout, PageHeader, Tabs, Card, Rate, List, Typography } from 'antd';
import Lightbox from 'react-image-lightbox';
import 'react-image-lightbox/style.css';

import { observer } from "mobx-react";

import DBGoodWords from "./parser/goodWords";
import DBBadWords from "./parser/badWords";
import DBGoodLocation from "./parser/reports/goodLocation.json";
import DBGoodLocationAndWords from "./parser/reports/goodLocationAndWords.json";

import './app.css';


const regExpGood = new RegExp(`(${DBGoodWords.join('|')})`);
const regExpBad = new RegExp(`(${DBBadWords.join('|')})`);

const { TabPane } = Tabs;
const { Footer, Content } = Layout;


class App extends React.Component {

	imgSize = 150;

	state = {
		visible: false,
		images: [],
		photoIndex: 0
	};


	renderList(offers) {
		return (
			<List
				bordered
				dataSource={ offers }
				renderItem={item => (
					<div style={{ padding: 10, margin: 10, background: 'whitesmoke' }}>
						<h2 style={{ display: 'flex', justifyContent: 'space-between' }}>
							<a rel="noopener noreferrer" href={ item.link } target="_blank">{ item.title }</a>
							<Rate allowHalf value={ item.rate || 0 } />
						</h2>
						<Typography.Text type="danger" code><b>{ item.price } </b>USD</Typography.Text>
						<br/>
						<br/>
						<Typography.Text code>{ item.address }</Typography.Text>
						<br/>
						<br/>

						{ item.details.map(detail => {
							return (
								<div key={detail}>
									{ detail.toLowerCase().match(regExpGood) ?
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
						<br/>
						<br/>

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
					</div>
				)}
			/>
		);
	}


	render() {
		return (
			<Layout>
				<PageHeader title="Olx парсер" dark />
				<Layout>
					<Content>
						<Card title="Список предложений">
							<Tabs defaultActiveKey="1" animated={ false }>
								<TabPane tab={ "Подходят по расположению " + DBGoodLocation.length } key="1">
									{ this.renderList(DBGoodLocation) }
								</TabPane>
								<TabPane tab={ "Подходят по расположению и ключевым словам " + DBGoodLocationAndWords.length } key="2">
									{ this.renderList(DBGoodLocationAndWords) }
								</TabPane>
								<TabPane tab={ "New " + DBGoodLocation.filter(offer => offer.isNew).length } key="3">
									{ this.renderList(DBGoodLocation.filter(offer => offer.isNew)) }
								</TabPane>
							</Tabs>
						</Card>
					</Content>
				</Layout>
				<Footer>Footer</Footer>

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
