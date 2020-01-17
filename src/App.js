import React from 'react';
import { Layout, PageHeader, Tabs, Card, List, Typography } from 'antd';

import { observer } from "mobx-react";
import { observable, runInAction } from "mobx";

import './app.css';

import analyzer from "./analyzer";
import offers from "./mock.json";


const { TabPane } = Tabs;
const { Footer, Content } = Layout;


class App extends React.Component {

	data = observable({
		offers: [],
		newOffers: [],
		goodOffers: [],
		goodOffersWords: []
	});


	componentDidMount() {
		//this.setOffers(offers);
		this.fetchOffers();
		this.fetchNewOffers();
	}


	async fetchOffers() {
		let response = await window.fetch('/offers');
		response = await response.json();
		runInAction(()=> {
			this.setOffers(response);
		});
	}


	async fetchNewOffers() {
		let response = await window.fetch('/newOffers');
		response = await response.json();
		runInAction(()=> {
			this.setNewOffers(response);
		});
	}


	setOffers(offers = {}) {
		this.data.offers = Object.values(offers);
		const result = analyzer(Object.values(this.data.offers));

		this.data.goodOffers = result.goodOffers;
		this.data.goodOffersWords = result.goodOffersWords;
	}


	setNewOffers(offers = {}) {
		this.data.newOffers = Object.values(offers);
	}


	renderList(offers) {
		return (
			<List
				bordered
				dataSource={ offers }
				renderItem={item => (
					<List.Item>
						<a rel="noopener noreferrer" href={ item.link } target="_blank">{ item.link }</a> <br/>
						<Typography.Text mark>{ item.price }</Typography.Text> <br/>
						<Typography.Text mark>{ item.location }</Typography.Text> <br/>
						<img src={ item.image } width='400' height='auto' />
						<br/>
						{ item.description }
					</List.Item>
				)}
			/>
		);
	}


	render() {
		return (
			<Layout>
				<PageHeader title="Olx парсер" />
				<Layout>
					<Content>
						<Card title="Список предложений">
							<Typography.Text>Всего найдено: { this.data.offers.length }</Typography.Text>
							<br/>
							<Tabs defaultActiveKey="1">
								<TabPane tab={ "Новые предложения " + this.data.newOffers.length } key="1">
									{ this.renderList(this.data.newOffers) }
								</TabPane>
								<TabPane tab={ "Подходят по расположению " + this.data.goodOffers.length } key="2">
									{ this.renderList(this.data.goodOffers) }
								</TabPane>
								<TabPane tab={ "Подходят по расположению и ключевым словам " + this.data.goodOffersWords.length } key="3">
									{ this.renderList(this.data.goodOffersWords) }
								</TabPane>
							</Tabs>
						</Card>
					</Content>
				</Layout>
				<Footer>Footer</Footer>
			</Layout>
		);
	}
}


/**


 description: "Объявление от    Частного лица         Выберите рубрику    Продажа домов           Без комиссии    Без комиссии         Возможность обмена    Возможность обмена           Готов сотрудничать с риэлторами    Готов сотрудничать с риэлторами         Расстояние до ближайшего города    до 15 км.           Этажность   1        Общая площадь   80 м²          Количество комнат   3        Площадь участка   22 соток          Тип дома    Дом         Тип стен    Кирпичный           Санузел    Смежный         Отопление    Индивидуальное газовое           Ремонт    Жилое состояние         Бытовая техника    Холодильник  Плита           Комфорт    Подсобные помещения  Ванна  Забор  ограждение         Коммуникации    Асфальтированная дорога  Электричество  Газ  Скважина           Инфраструктура (до 500 метров)    Детский сад  Школа  Остановка транспорта         Ландшафт (до 1 км.)    Лес  Река                                                                                          Продам добротный кирпичный дом, сарай, погреб, хоз. постройки. Участок 22 сотки участок обрабатывается не запущен  10-12 км от окружной хороший подъезд фасад центральной улица с. Белогородка, рядом лес, школа, магазины, маршрутка возле дома, хорошие соседи, телефон, газ, электричество, с/у в доме совмещённый, вода в доме - скважина+насосная станция, цена 53000 долл."
 images: 5
 link: "https://www.olx.ua/obyavlenie/belogorodka-ul-lenina-168-dom-22-sotki-zemli-ID4gYMR.html#f7065a9d45"
 location: "Белогородка, Киевская область, Киево-Святошинский район↵                        ↵                            Показать на карте"
 price: "53 000 $ Договорная"
 Без комиссии: "Без комиссии"
 Бытовая техника: "Холодильник↵↵Плита"
 Возможность обмена: "Возможность обмена"
 Выберите рубрику: "Продажа домов"
 Готов сотрудничать с риэлторами: "Готов сотрудничать с риэлторами"
 Инфраструктура (до 500 метров): "Детский сад↵↵Школа↵↵Остановка транспорта"
 Количество комнат: "3"
 Коммуникации: "Асфальтированная дорога↵↵Электричество↵↵Газ↵↵Скважина"
 Комфорт: "Подсобные помещения↵↵Ванна↵↵Забор↵↵ограждение"
 Ландшафт (до 1 км.): "Лес↵↵Река"
 Общая площадь: "80 м²"
 Объявление от: "Частного лица"
 Отопление: "Индивидуальное газовое"
 Площадь участка: "22 соток"
 Расстояние до ближайшего города: "до 15 км."
 Ремонт: "Жилое состояние"
 Санузел: "Смежный"
 Тип дома: "Дом"
 Тип стен: "Кирпичный"
 Этажность: "1"

 */

export default observer(App);
