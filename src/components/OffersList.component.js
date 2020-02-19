import React from 'react';
import { Avatar, Tag, Card, List } from 'antd';
import 'react-image-lightbox/style.css';
import Gallery from 'react-grid-gallery';
import Highlighter from "react-highlight-words";
import { observable } from "mobx";
import { observer } from "mobx-react";
import DBGoodWords from "../parser/goodWords";
import DBBadWords from "../parser/badWords";

const Highlight = ({ children })=> {
    return <span style={{ background: DBBadWords.includes(children) ? 'rgba(247, 0, 0, 0.45)' : '#90ee9069' }}>
        { children }
    </span>
};

class OffersList extends React.Component {


    listData = [];


    constructor(props) {
        super(props);

        this.listData = [...props.offers];
    }


    componentDidUpdate(prevProps, prevState, snapshot) {
        if(this.props.offers.length === prevProps.offers.length) return;
        this.listData = [...this.props.offers];
        this.forceUpdate();
    }


    render() {
        return (
            <Card>
                <List
                    itemLayout="vertical"
                    size="small"
                    pagination={{ pageSize: 10 }}
                    dataSource={ this.listData }
                    renderItem={offer => (
                        <List.Item key={offer.link}>
                            <List.Item.Meta
                                avatar={<Avatar size={50} src={offer.images[0]} />}
                                title={<a target='_blank' href={offer.link}>{offer.title} { offer.isNew ? <span style={{ background: '#3cce3c', color: 'white', padding: 5, borderRadius: 5 }}>new</span> : null }</a>}
                                description={
                                    <Highlighter
                                        highlightTag={ Highlight }
                                        searchWords={[...DBGoodWords, ...DBBadWords]}
                                        autoEscape={true}
                                        textToHighlight={ offer.description }
                                        /> } />

                            <div className='clearfix' style={{ marginLeft: 65 }}>
                                { offer.details
                                    .map(d => d.trim())
                                    .filter(Boolean)
                                    .map(detail => <Tag key={detail}>{ detail }</Tag>) }
                                <br/>
                                <br/>
                                <Gallery rowHeight={100}
                                         images={ offer.images.map(img => ({
                                            src: img,
                                            thumbnail: img,
                                            thumbnailWidth: 'auto',
                                            thumbnailHeight: 100
                                        })) }/>
                            </div>
                        </List.Item>
                    )}
                />
            </Card>
        );
    }
}

export default observer(OffersList);
