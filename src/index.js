/* eslint-disable import/extensions */
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { URL } from 'url';
import cheerio from 'cheerio';
import debug from 'debug';
import copyResourses from './copyResourses.js';

export const replaceUrls = (data, imagePaths) => {
  const $ = cheerio.load(data);
  // eslint-disable-next-line no-restricted-syntax
  for (const [originalUrl, { attr, newPath }] of Object.entries(imagePaths)) {
    $('html').find(`[${attr}="${originalUrl}"]`).attr(attr, newPath);
  }
  return $.html();
};

const pageLoader = async (requestUrl, currentDir) => {
  if (!requestUrl) { throw new Error('no request url or currentDir provided'); }
  // eslint-disable-next-line no-param-reassign
  if (!currentDir) { currentDir = process.cwd(); }
  const data = await axios.get(requestUrl).catch((e) => {
    console.log({e})
    throw new Error(e);
  });
  debug('page-loader: pageLoader')(`${data.data}`);
  const { url } = data.config;
  const urlData = new URL(url);
  const { protocol } = urlData;
  const newUrl = url.replace(protocol, '');
  const reg = /[^a-z0-9-]+/g;
  const newFilePath = newUrl.replace(reg, '-').slice(1).concat('.html');
  const fullPath = path.resolve(currentDir, newFilePath);
  const imagePaths = await copyResourses(requestUrl, currentDir, data.data);
  const result = replaceUrls(data.data, imagePaths);
  await fs.writeFile(fullPath, result);
  return fullPath;
};

export default pageLoader;
