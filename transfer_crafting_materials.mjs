import CRAFTING_MATERIALS_ABI from "./craftingmaterialsabi.json";
import Web3 from 'web3';
import fetch from 'node-fetch';

import config from './config.json'

const crafting_materials_address = "0x2A0F1cB17680161cF255348dDFDeE94ea8Ca196A";
const rarity_address = "0xce761D788DF608BD21bdd59d6f4B54b2e27F25Bb";
const MIN_BALANCE = 10;

const web3 = new Web3(config.network.rpc);
const craftingMaterials = new web3.eth.Contract(CRAFTING_MATERIALS_ABI, crafting_materials_address);


web3.eth.accounts.wallet.add(config.my_private_key);

async function getNonce() {
    return await web3.eth.getTransactionCount(config.myAddress);
}

async function transfer_crafting_materials(from, to, amount, nonce) {
    let max_price;
    let estimated_gas = 0;
    try {
        estimated_gas = await craftingMaterials.methods.transfer(from, to, amount).estimateGas(
            {
                from: config.myAddress,
                gas: '179043'
            });
        // console.log(`[#${from}] Estimated gas required is ${estimated_gas}.`);
    } catch (error) {
        console.log(`[#${from}] The gas required for the transaction is too high, summoner is probably already in the forest.`);
        return;
    }

    let gas_price = await web3.eth.getGasPrice();
    // console.log(`[#${from}] gas price=    ${web3.utils.fromWei(gas_price, "Gwei")}`)

    if ('maximum_gas_price' in config) {
        max_price = web3.utils.toWei(config.maximum_gas_price.toString(), "Gwei");
    } else {
        max_price = web3.utils.toWei("1", "Gwei");
    }

    if (parseFloat(gas_price) > max_price) {
        console.log(`Current network gas price is ${web3.utils.fromWei(gas_price, "Gwei")} GWEI, above your price limit of ${web3.utils.fromWei(max_price, "Gwei")} GWEI. Not claiming.`);
        return;
    }

    if (!config.dry_run) {
        await craftingMaterials.methods.transfer(from, to, amount)
            .send({
                from: config.myAddress,
                gasPrice: gas_price,
                gas: "179043",
                nonce: nonce
            }).on('sent', () => {
                console.log(`[${from}] Transaction submitted ...`)
            }).on('transactionHash', (hash) => {
                console.log(`[${from}] https://ftmscan.com/tx/${hash}`)
            }).on('receipt', (receipt) => {
                console.log(`[#${from}] transfered ${amount} from ${from} to ${to}`);
            })
            .catch((error) => {
                console.log(`[${from}] Error`, error)
            });
    } else {
        console.log(`[#${from}] transfered ${amount} from #${from} to #${to}`);
    }
}

async function fetchMySummoners() {
    return fetch(`https://api.ftmscan.com/api?module=account&action=tokennfttx&contractaddress=${rarity_address}&address=${config.myAddress}&apikey=${config.ftmscan_apikey}`)
        .then(res => res.json())
        .then(json => {
            return Array.from(new Set(json.result.map(x => parseInt(x.tokenID))));
        });
}

function findFarmers(summoners) {
    return summoners.filter(s => s !== config.crafter);
}

export default class TransferCraftingMaterials {

    async run() {
        console.log("ready to transfer crafting materials");

        let nonce = await getNonce();
        console.log("nonce", nonce);

        let summoners = await fetchMySummoners();
        let farmers = findFarmers(summoners);

        farmers.forEach(summoner => {
            craftingMaterials.methods.balanceOf(summoner).call({from: config.myAddress})
                .then(function (balance) {
                    let amount = parseInt(balance);
                    if (balance >= MIN_BALANCE) {
                        transfer_crafting_materials(summoner, config.crafter, amount, nonce++);
                    }
                });
        })
    }
}
