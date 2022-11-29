#!/usr/bin/env node
import { program } from 'commander';
import process from 'node:process';
// eslint-disable-next-line import/extensions
import pageLoader from './src/index.js';

program
  .version('0.0.1')
  .description('Page loader utility')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .arguments('<url>')
  .action((url, options) => {
    try {
      pageLoader(url, options.output);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(`Failed execution: ${e}`);
      process.exit(1);
    }
  });

program.parse();
