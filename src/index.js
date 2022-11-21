import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { URL } from 'url';
import cheerio from 'cheerio';
import copyResourses from './copyResourses';

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
  const { url } = data.config;
  const urlData = new URL(url);
  const { protocol } = urlData;
  const newUrl = url.replace(protocol, '');
  const reg = /[^a-z0-9]+/g;
  const newFilePath = newUrl.replace(reg, '-').slice(1).concat('.html');
  const fullPath = path.resolve(currentDir, newFilePath);
  const imagePaths = await copyResourses(requestUrl, currentDir, data.data);
  const result = replaceUrls(data.data, imagePaths);
  await fs.writeFile(fullPath, result);
  // await Promise.all([writing]);
  return [`Page was successfully downloaded into ${fullPath}`];
};

export default pageLoader;
