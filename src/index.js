/* eslint-disable import/extensions */
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { URL } from 'url';
import cheerio from 'cheerio';
import debug from 'debug';
import { access, constants } from 'node:fs/promises';
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
  // console.log({ currentDir, requestUrl });
  if (!requestUrl) { throw new Error('no request url provided'); }
  const data = await axios.get(requestUrl).catch(() => {
    throw new Error('invalid request url');
  });
  debug('page-loader: pageLoader')(`${data.data}`);
  const { url } = data.config;
  const urlData = new URL(url);
  const { protocol } = urlData;
  const newUrl = url.replace(protocol, '');
  const reg = /[^a-z0-9-]+/g;
  const newFilePath = newUrl.replace(reg, '-').slice(1).concat('.html');
  try {
    await access(currentDir, constants.R_OK | constants.W_OK);
  } catch {
    console.error('directory does not exist');
  }
  const fullPath = path.resolve(currentDir, newFilePath);
  const imagePaths = await copyResourses(requestUrl, currentDir, data.data);
  const result = replaceUrls(data.data, imagePaths);
  await fs.writeFile(fullPath, result);
  return `Page was successfully downloaded into ${fullPath}`;
};

export default pageLoader;
