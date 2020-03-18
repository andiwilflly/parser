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


class LayoutComponent extends React.Component {

    tab = observable.box('1');
    mode = observable.box('right');
    selectedKey = observable.box('1');


    async componentDidMount() {
        // await DBModel.fetchData('goodLocations');
        // await DBModel.fetchData('goodLocationsAndWords');
        // await DBModel.fetchData('goodLocationsLeft');
        // await DBModel.fetchData('goodLocationsAndWordsLeft');
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
    }
}

export default observer(LayoutComponent);
