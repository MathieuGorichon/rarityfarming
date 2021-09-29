import RARITY_MARKET_CRAFTINGS_ABI from "./market_craftings_abi.json";
import CRAFTING_ABI from "./crafting_abi.json";
import Web3 from 'web3';

import * as fs from 'fs/promises';

import config from './config.json'
import fetch from "node-fetch";

const market_craftings_address = "0x4adEe474eA0A10E78376Ee5DFee7Be2A2A4CdDD0";
const crafting_address = "0xf41270836dF4Db1D28F7fd0935270e3A603e78cC";

const web3 = new Web3(config.network.rpc);
const market_craftings = new web3.eth.Contract(RARITY_MARKET_CRAFTINGS_ABI, market_craftings_address);
const crafting = new web3.eth.Contract(CRAFTING_ABI, crafting_address);

web3.eth.accounts.wallet.add(config.my_private_key);

async function marketLength() {
    return market_craftings.methods.listLength().call({from: config.myAddress}).then(function (length) {
        return length;
    });
}

async function listsAt(length) {
    return market_craftings.methods.listsAt(0, length).call({from: config.myAddress}).then(function (list) {
        return list;
    });
}

async function getItem(itemId) {
    return crafting.methods.items(itemId).call({from: config.myAddress}).then(function (result) {
        return result;
    });
}


export default class Market {

    async listed() {
        let length = await marketLength();
        let list = await listsAt(length);
        let ids = list.rIds;
        let prices = list.rPrices;

        let fileHandle = await fs.open("listed.txt", "w");
        // fileHandle.appendFile(`item_id;base_type;item_type;price\n`);

        for (let i = 0; i < length; i++) {
            getItem(ids[i]).then(item => {
                let data = `${ids[i]};${item.base_type};${item.item_type};${prices[i] / 1e18}`;
                fileHandle.appendFile(`${data}\n`);
            });
        }
    }

    async sellings() {
        let fileHandle = await fs.open("sellings.txt", "w");
        // fileHandle.appendFile(`item_id;base_type;item_type;price\n`);

        market_craftings.getPastEvents('Buy', {
            fromBlock: 0,
            toBlock: 'latest'
        }).then(events => {
            events.forEach(event => {
                getItem(event.returnValues.id).then(item => {
                    let data = `${event.returnValues.id};${item.base_type};${item.item_type};${event.returnValues.price / 1e18}`;
                    fileHandle.appendFile(`${data}\n`);
                });
            });
        })
    }

}