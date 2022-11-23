#!/usr/bin/env node
import { program } from 'commander';

// eslint-disable-next-line import/extensions
import pageLoader from './src/index.js';

program
  .version('0.0.1')
  .description('Page loader utility')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .arguments('<url>')
  .action((url, options) => {
    pageLoader(options.output, url);
  });

program.parse();
