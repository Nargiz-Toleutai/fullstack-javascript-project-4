#!/usr/bin/env node
/* eslint-disable no-console */
import { program } from 'commander';
import process from 'node:process';
// eslint-disable-next-line import/extensions
import pageLoader from './src/index.js';

const configureErrorOutput = (error) => {
  if (error.isAxiosError) {
    return `error while loading resource ${error.config.url} with code: ${error.code}`;
  }
  return '';
};

program
  .version('0.0.1')
  .description('Page loader utility')
  .option('-o, --output [dir]', 'output dir', process.cwd())
  .arguments('<url>')
  .action((url, options) => {
    pageLoader(url, options.output)
      .then((result) => {
        console.log(`Page was successfully downloaded into '${result}'`);
        process.exit(0);
      })
      .catch((error) => {
        console.error('[ERR]', configureErrorOutput(error), '\n', error);
        process.exit(1);
      });
  });

program.parse();
