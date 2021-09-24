#!/usr/bin/env node

import { Command } from 'commander/esm.mjs';
import Forest from './forest.mjs';
import TransferCraftingMaterials from "./transfer_crafting_materials.mjs";
import TransferGold from "./transfer_gold.mjs";

const program = new Command();

program
    .command("forest")
    .description("Send summoners to the forest")
    .action(()=> new Forest().run());

program
    .command("transfer-mats")
    .description("Transfer crafting materials from farmers to crafter")
    .action(()=> new TransferCraftingMaterials().run());

program
    .command("transfer-gold")
    .description("Transfer gold from farmers to crafter")
    .action(()=> new TransferGold().run());

program.parse(process.argv);
