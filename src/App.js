import React from 'react';
import { Layout } from 'antd';
import 'react-image-lightbox/style.css';
import { observer } from "mobx-react";
import LayoutComponent from "./components/Layout.component";
import './app.css';


class App extends React.Component {

	render() {
		return (
			<Layout>
				<LayoutComponent />
			</Layout>
		);
	}
}

export default observer(App);
