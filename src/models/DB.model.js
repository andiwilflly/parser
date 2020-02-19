// MobX
import { observable } from 'mobx';


class DB {

    data = observable({
        goodLocations: [],
        goodLocationsAndWords: [],

        goodLocationsLeft: [],
        goodLocationsAndWordsLeft: []
    });


    async fetchData(dataName = '') {

        let response = await window.fetch(`/api/${dataName}`);
        response = await response.json();

        this.data[dataName] = response;
    }
}


export default new DB();