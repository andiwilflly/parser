import React from 'react';
import 'react-image-lightbox/style.css';
import { observer } from "mobx-react";
// Components
import FlatsMap from "./FlatsMap.component";


class LayoutComponent extends React.Component {

    render() {

        return (
            <div>
                <FlatsMap />
            </div>
        );
    }
}

export default observer(LayoutComponent);
