import React from 'react';
import mapboxgl from 'mapbox-gl';
import { Layout, Radio, Menu } from 'antd';
import 'react-image-lightbox/style.css';

import { observable } from "mobx";
import { observer } from "mobx-react";

// Models
import DBModel from "../models/DB.model";
// Components
import AllMap from "./AllMap.component";
import FlatsMap from "./FlatsMap.component";
import OffersList from "./OffersList.component";


mapboxgl.accessToken = 'pk.eyJ1IjoiYW5kaXdpbGxmbHkiLCJhIjoiY2s2cW1qajhoMHB3MDNzcW81dmM4bDlkMSJ9.gmA_WZGL_NxHa4hdx9sttA';
const mapBoxClient = window.mapboxSdk({ accessToken: mapboxgl.accessToken });


class LayoutComponent extends React.Component {

    tab = observable.box('1');
    mode = observable.box('right');
    selectedKey = observable.box('1');


    async componentDidMount() {
        await DBModel.fetchData('goodLocations');
        await DBModel.fetchData('goodLocationsAndWords');
        await DBModel.fetchData('goodLocationsLeft');
        await DBModel.fetchData('goodLocationsAndWordsLeft');
    }

    get newOffers() {
        return (this.mode.get() === 'left' ? DBModel.data.goodLocationsAndWordsLeft : DBModel.data.goodLocationsAndWords).filter(offer => offer.isNew)
    }

    get offers() {
        switch(this.selectedKey.get()) {
            case '1': return this.mode.get() === 'left' ? DBModel.data.goodLocationsLeft : DBModel.data.goodLocations;
            case '2': return this.mode.get() === 'left' ? DBModel.data.goodLocationsAndWordsLeft : DBModel.data.goodLocationsAndWords;
            case '3': return this.newOffers;
        }
    }


    render() {

        return (
            <div>
                <FlatsMap />
            </div>
        );

        return (
            <Layout>
                <Layout.Header>
                    <Radio.Group value={this.mode.get()}
                                 onChange={ (e)=> this.mode.set(e.target.value) }>
                        <Radio.Button value={'right'}>Правий берег</Radio.Button>
                        <Radio.Button value={'left'}>Лівий берег</Radio.Button>
                        <Radio.Button value={'list'}>Список</Radio.Button>
                    </Radio.Group>
                </Layout.Header>
                <Layout>
                    <Layout.Sider width={370} theme='light'>
                        <Menu theme="light" mode="inline"
                              selectedKeys={[this.selectedKey.get()]}
                              onSelect={ (menu)=> this.selectedKey.set( menu.selectedKeys[0]) }>
                            <Menu.Item key="1">
								<span className="nav-text">
									За місцезнаходженням <b style={{ color: 'orange' }}>({ (this.mode.get() === 'left' ? DBModel.data.goodLocationsLeft : DBModel.data.goodLocations).length })</b>
								</span>
                            </Menu.Item>
                            <Menu.Item key="2">
								<span className="nav-text">
									За ключовими словами <b style={{ color: 'orange' }}>({ (this.mode.get() === 'left' ? DBModel.data.goodLocationsAndWordsLeft : DBModel.data.goodLocationsAndWords).length })</b>
								</span>
                            </Menu.Item>
                            <Menu.Item key="3">
								<span className="nav-text">
									Нові пропозиції <b style={{ color: 'orange' }}>({ this.newOffers.length })</b>
								</span>
                            </Menu.Item>
                        </Menu>
                    </Layout.Sider>
                    <Layout.Content>
                        { this.offers.length ?
                            this.mode.get() === 'list' ?
                                <OffersList offers={ this.offers } />
                                :
                                <AllMap offers={ this.offers } mapBoxClient={ mapBoxClient } />
                            :
                            'loading...'
                        }
                    </Layout.Content>
                </Layout>
            </Layout>
        );
    }
}

export default observer(LayoutComponent);
