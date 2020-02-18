import React from 'react';
import mapboxgl from 'mapbox-gl';
import { Layout, Radio, Menu } from 'antd';
import 'react-image-lightbox/style.css';

import { observable } from "mobx";
import { observer } from "mobx-react";

import AllMap from "./AllMap.component";

import DBGoodLocation from "../parser/reports/goodLocation.json";
import DBGoodLocationAndWords from "../parser/reports/goodLocationAndWords.json";
import DBGoodLocationLeft from "../parser/reports/goodLocationLeft";
import DBGoodLocationAndWordsLeft from "../parser/reports/goodLocationAndWordsLeft.json";


mapboxgl.accessToken = 'pk.eyJ1IjoiYW5kaXdpbGxmbHkiLCJhIjoiY2s2cW1qajhoMHB3MDNzcW81dmM4bDlkMSJ9.gmA_WZGL_NxHa4hdx9sttA';
const mapBoxClient = window.mapboxSdk({ accessToken: mapboxgl.accessToken });


class LayoutComponent extends React.Component {

    tab = observable.box('3');
    mode = observable.box('right');
    selectedKey = observable.box('1');


    get newOffers() {
        return (this.mode.get() === 'left' ? DBGoodLocationAndWordsLeft : DBGoodLocationAndWords).filter(offer => offer.isNew)
    }

    get mapOffers() {
        switch(this.selectedKey.get()) {
            case '1': return this.mode.get() === 'left' ? DBGoodLocationLeft : DBGoodLocation;
            case '2': return this.mode.get() === 'left' ? DBGoodLocationAndWordsLeft : DBGoodLocationAndWords;
            case '3': return this.newOffers;
        }
    }


    render() {
        return (
            <Layout>
                <Layout.Header>
                    <Radio.Group value={this.mode.get()}
                                 onChange={ (e)=> this.mode.set(e.target.value) }>
                        <Radio.Button value={'right'}>Правый берег</Radio.Button>
                        <Radio.Button value={'left'}>Левый берег</Radio.Button>
                        <Radio.Button value={'list'}>Список</Radio.Button>
                    </Radio.Group>
                </Layout.Header>
                <Layout>
                    <Layout.Sider width={400} theme='light'>
                        <Menu theme="light" mode="inline"
                              selectedKeys={[this.selectedKey.get()]}
                              onSelect={ (menu)=> this.selectedKey.set( menu.selectedKeys[0]) }>
                            <Menu.Item key="1">
								<span className="nav-text">
									По расположению <b style={{ color: 'orange' }}>({ (this.mode.get() === 'left' ? DBGoodLocationLeft : DBGoodLocation).length })</b>
								</span>
                            </Menu.Item>
                            <Menu.Item key="2">
								<span className="nav-text">
									По расположению и ключевым словам <b style={{ color: 'orange' }}>({ (this.mode.get() === 'left' ? DBGoodLocationAndWordsLeft : DBGoodLocationAndWords).length })</b>
								</span>
                            </Menu.Item>
                            <Menu.Item key="3">
								<span className="nav-text">
									Новые предложения <b style={{ color: 'orange' }}>({ this.newOffers.length })</b>
								</span>
                            </Menu.Item>
                        </Menu>
                    </Layout.Sider>
                    <Layout.Content>
                        { this.mode.get() === 'list' ?
                            <p>Hello list</p>
                            :
                            <AllMap offers={ this.mapOffers } mapBoxClient={ mapBoxClient } />
                        }
                    </Layout.Content>
                </Layout>
            </Layout>
        );
    }
}

export default observer(LayoutComponent);
