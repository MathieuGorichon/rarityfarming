// A tool to explore caves, adventure, and find riches.
// https://github.com/dmptrluke/ramen

import FOREST_ABI_V2 from "./forestabi_v2.json";
import FOREST_ABI_V1 from "./forestabi_v1.json";
import RARITY_ABI from "./rarityabi.json";
import Web3 from 'web3';

import config from './config.json'
import fetch from "node-fetch";

const forest_addressV2 = "0x9e894cd5dCC5Bad1eD3663077871d9D010f654b5";
const forest_addressV1 = "0xb37d3d79ea86B0334d9322c695339D577A3D57be";
const rarity_address = "0xce761D788DF608BD21bdd59d6f4B54b2e27F25Bb";

const web3 = new Web3(config.network.rpc);
const rarity = new web3.eth.Contract(RARITY_ABI, rarity_address);
const forestV2 = new web3.eth.Contract(FOREST_ABI_V2, forest_addressV2);
const forestV1 = new web3.eth.Contract(FOREST_ABI_V1, forest_addressV1);

web3.eth.accounts.wallet.add(config.my_private_key);

let nonce = 0;

async function initNonce() {
    nonce = await web3.eth.getTransactionCount(config.myAddress);
}

async function startResearch(contract, summoner) {
    try {
        let estimated_gas = await contract.methods.startResearch(summoner, config.days).estimateGas(
            {
                from: config.myAddress,
                gas: '179043'
            });
        // console.log(`${summoner}: Estimated gas required is ${estimated_gas}.`);
    } catch (error) {
        // console.log(`${summoner}: The gas required for the transaction is too high, summoner is probably already in the forest.`);
        return;
    }

    let gas_price = await web3.eth.getGasPrice();
    // console.log(`${summoner}: gas price: ${gas_price}.`)

    if ('maximum_gas_price' in config) {
        var max_price = web3.utils.toWei(config.maximum_gas_price.toString(), "Gwei")
    } else {
        var max_price = web3.utils.toWei("1", "Gwei")
    }

    if (parseFloat(gas_price) > max_price) {
        console.log(`Current network gas price is ${web3.utils.fromWei(gas_price, "Gwei")} GWEI, above your price limit of ${web3.utils.fromWei(max_price, "Gwei")} GWEI. Not claiming.`);
        return;
    }
    if (!config.dry_run) {
        contract.methods.startResearch(summoner, config.days)
            .send({
                from: config.myAddress,
                gasPrice: gas_price,
                gas: "179043",
                nonce: nonce
            }).on('sent', () => {
            // console.log(`${summoner}: Transaction submitted ...`)
        }).on('transactionHash', (hash) => {
            console.log(`${summoner}: https://ftmscan.com/tx/${hash}`)
        }).on('receipt', (receipt) => {
            console.log(`#${summoner} is in the forest for ${config.days} days`);
        }).catch((error) => {
            console.log(`${summoner}: Error`, error)
        });
        nonce++;
    } else {
        console.log(`#${summoner} is in the forest for ${config.days} days`);
    }
}

async function discover(contract, summoner) {
    try {
        let estimated_gas = await contract.methods.discover(summoner).estimateGas(
            {
                from: config.myAddress,
                gas: '179043'
            });
        // console.log(`${summoner}: Estimated gas required is ${estimated_gas}.`);
    } catch (error) {
        // console.log(`${summoner}: The gas required for the transaction is too high, summoner is probably already in the forest.`);
        return;
    }

    let gas_price = await web3.eth.getGasPrice();
    // console.log(`${summoner}: gas price: ${gas_price}.`)

    if ('maximum_gas_price' in config) {
        var max_price = web3.utils.toWei(config.maximum_gas_price.toString(), "Gwei")
    } else {
        var max_price = web3.utils.toWei("1", "Gwei")
    }

    if (parseFloat(gas_price) > max_price) {
        console.log(`Current network gas price is ${web3.utils.fromWei(gas_price, "Gwei")} GWEI, above your price limit of ${web3.utils.fromWei(max_price, "Gwei")} GWEI. Not claiming.`);
        return;
    }
    if (!config.dry_run) {
        // console.log(`[#${summoner}] send with gas price: ${gas_price} and nonce: ${nonce}.`);

        contract.methods.discover(summoner)
            .send({
                from: config.myAddress,
                gasPrice: gas_price,
                gas: "179043",
                nonce: nonce
            }).on('sent', () => {
            // console.log(`${summoner}: Transaction submitted ...`)
        }).on('transactionHash', (hash) => {
            console.log(`${summoner}: https://ftmscan.com/tx/${hash}`)
        }).on('receipt', (receipt) => {
            console.log(`#${summoner} discovered a treasure !`);
        }).catch((error) => {
            console.log(`${summoner}: Error`, error)
        });
        nonce++;
    } else {
        console.log(`#${summoner} discovered a treasure !`);
    }
}


async function fetchMySummoners() {
    return fetch(`https://api.ftmscan.com/api?module=account&action=tokennfttx&contractaddress=${rarity_address}&address=${config.myAddress}&apikey=${config.ftmscan_apikey}`)
        .then(res => res.json())
        .then(json => {
            return Array.from(new Set(json.result.map(x => parseInt(x.tokenID))));
        });
}

async function getLevel(summoner) {
    return rarity.methods.level(summoner).call({from: config.myAddress})
        .then(function (level) {
            return level;
        });
}

export default class Forest {
    async go() {
        console.log(`Sending summoners exploring the forest...`);
        await initNonce();
        console.log("nonce", nonce);

        let summoners = await fetchMySummoners();

        for (const summoner of summoners) {
            let level = await getLevel(summoner);
            if (level >= 2) {
                await startResearch(forestV1, summoner);
                await startResearch(forestV2, summoner);
            }
        }
    }

    async disc() {
        console.log(`Discover what summoners found in the forest...`);
        await initNonce();
        console.log("nonce", nonce);

        let summoners = await fetchMySummoners();
        for (const summoner of summoners) {
            let level = await getLevel(summoner);
            if (level >= 2) {
                await discover(forestV1, summoner);
                await discover(forestV2, summoner);
            }
        }
    }
}