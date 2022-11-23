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

const pageLoader = async (currentDir, requestUrl) => {
  const data = await axios.get(requestUrl);
  debug('page-loader: pageLoader')(`${data.data}`);
  const { url } = data.config;
  const urlData = new URL(url);
  const { protocol } = urlData;
  const newUrl = url.replace(protocol, '');
  const reg = /[^a-z0-9-]+/g;

  const newFilePath = newUrl.replace(reg, '-').slice(1).concat('.html'); // page-loader-hexlet-repl.co.html
  // const newFilePath = newUrl
  //   .replace(/^\/\//, '')
  //   .replace(/\/$/, '')
  //   .replace(/[.](?=.*[.])/g, '-')
  //   .concat('.html');
  // console.log({
  //   currentDir, requestUrl, newFilePath, newUrl,
  // });
  const fullPath = path.resolve(currentDir, newFilePath);
  const imagePaths = await copyResourses(requestUrl, currentDir, data.data);
  const result = replaceUrls(data.data, imagePaths);
  await fs.writeFile(fullPath, result);
  return [`Page was successfully downloaded into ${fullPath}`];
};

export default pageLoader;
// page-loader-hexlet-repl.co.html
