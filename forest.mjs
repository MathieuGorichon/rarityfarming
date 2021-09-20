// A tool to explore caves, adventure, and find riches.
// https://github.com/dmptrluke/ramen

import FOREST_ABI from "./forestabi.json";
import { randomBytes } from "crypto";
import Web3 from 'web3';

import config from './config.json'

const forest_address = "0xb37d3d79ea86B0334d9322c695339D577A3D57be";

const summoners = [774976, 775995];

const web3 = new Web3(config.network.rpc);
const forest = new web3.eth.Contract(FOREST_ABI, forest_address);

web3.eth.accounts.wallet.add(config.my_private_key);


async function startResearch(summoner) {
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
            gas: "179043"
        }).on('sent', () => {
            console.log(`${summoner}: Transaction submitted ...`)
        }).on('transactionHash', (hash) => {
            console.log(`${summoner}: https://ftmscan.com/tx/${hash}`)
        }).on('receipt', (receipt) => {
            console.log(`${summoner}: Summoner is in the forest!`)
        })
        .catch((error) => {
            console.log('Error', error)
        });
}

async function main() {
    console.log(`Starting...`);
    summoners.forEach(summoner => {
        console.log(`${summoner}: Sending summoner in the forest...`);
        startResearch(summoner);
    })
};

main();