#!/usr/bin/env node

import { Command } from 'commander/esm.mjs';
import Transfer from './transfer.mjs';
import Forest from './forest.mjs';

const program = new Command();

program
    .command("forest")
    .description("Send summoners to the forest")
    .action(()=> new Forest().run());

program
    .command("transfer")
    .description("Transfer crafting materials from farmers to crafter")
    .action(()=> new Transfer().run());

program.parse(process.argv);
