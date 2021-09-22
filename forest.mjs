// A tool to explore caves, adventure, and find riches.
// https://github.com/dmptrluke/ramen

import FOREST_ABI from "./forestabi.json";
import {randomBytes} from "crypto";
import Web3 from 'web3';

import config from './config.json'

const forest_address = "0xb37d3d79ea86B0334d9322c695339D577A3D57be";

//const summoners = [774976, 775995];
const summoners = [629712, 692333, 774967, 774974, 774976, 775995, 776239, 776468, 776570, 776819,
    980608, 980638, 980644, 980649, 980652, 980655, 980659, 980680, 980681, 980701,
    1311940, 1311955, 1311985, 1312038, 1312059, 1312147, 1312149, 1312168, 1383037, 1383090,
    1383152, 1383225, 1383448, 1477623, 1477640, 1477645, 1477657, 1477728, 1477729, 1477735,
    1477736, 1477815, 1477816]

const web3 = new Web3(config.network.rpc);
const forest = new web3.eth.Contract(FOREST_ABI, forest_address);

web3.eth.accounts.wallet.add(config.my_private_key);

async function getNonce() {
    const nonce = await web3.eth.getTransactionCount(config.myAddress);
    return nonce;
}

async function startResearch(summoner, nonce) {
    try {
        let estimated_gas = await forest.methods.startResearch(summoner, config.days).estimateGas(
            {
                from: config.myAddress,
                gas: '179043'
            });
        console.log(`${summoner}: Estimated gas required is ${estimated_gas}.`);
    } catch (error) {
        console.log(`${summoner}: The gas required for the transaction is too high, summoner is probably already in the forest.`);
        return;
    }

    let gas_price = await web3.eth.getGasPrice();
    console.log(`${summoner}: gas price: ${gas_price}.`)

    if ('maximum_gas_price' in config) {
        var max_price = web3.utils.toWei(config.maximum_gas_price.toString(), "Gwei")
    } else {
        var max_price = web3.utils.toWei("1", "Gwei")
    }

    if (parseFloat(gas_price) > max_price) {
        console.log(`Current network gas price is ${web3.utils.fromWei(gas_price, "Gwei")} GWEI, above your price limit of ${web3.utils.fromWei(max_price, "Gwei")} GWEI. Not claiming.`);
        return;
    }

    await forest.methods.startResearch(summoner, config.days)
        .send({
            from: config.myAddress,
            gasPrice: gas_price,
            gas: "179043",
            nonce: nonce
        }).on('sent', () => {
            console.log(`${summoner}: Transaction submitted ...`)
        }).on('transactionHash', (hash) => {
            console.log(`${summoner}: https://ftmscan.com/tx/${hash}`)
        }).on('receipt', (receipt) => {
            console.log(`${summoner}: Summoner is in the forest!`)
        })
        .catch((error) => {
            console.log(`${summoner}: Error`, error)
        });
}

export default class Forest {
    async run() {
        console.log(`Sending summoners exploring the forest...`);
        let nonce = await getNonce()
        console.log("nonce", nonce)
        summoners.forEach(summoner => {
            console.log(`${summoner}: Sending summoner in the forest...`);
            startResearch(summoner, nonce++);
        })
    };

}