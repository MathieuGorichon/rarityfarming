#!/usr/bin/env node

import { Command } from 'commander/esm.mjs';
import Forest from './forest.mjs';
import TransferCraftingMaterials from "./transfer_crafting_materials.mjs";
import TransferGold from "./transfer_gold.mjs";
import Market from "./market.mjs";

const program = new Command();

program
    .command("forest-go")
    .description("Send summoners to the forest")
    .action(()=> new Forest().go());

program
    .command("forest-disc")
    .description("Send summoners to the forest")
    .action(()=> new Forest().disc());

program
    .command("transfer-mats")
    .description("Transfer crafting materials from farmers to crafter")
    .action(()=> new TransferCraftingMaterials().run());

program
    .command("transfer-gold")
    .description("Transfer gold from farmers to crafter")
    .action(()=> new TransferGold().run());

program
    .command("market-listed")
    .action(()=> new Market().listed());

program
    .command("market-sellings")
    .action(()=> new Market().sellings());

program.parse(process.argv);
