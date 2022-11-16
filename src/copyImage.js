import cheerio from 'cheerio';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import { mkdir } from 'node:fs/promises';
import { URL } from 'url';

const request = async (requestUrls, downloadedResoursesPaths, projectDir, newFilePath) => {
  const responses = await Promise.all(requestUrls.map((requestUrl) => axios({
    method: 'get',
    url: requestUrl,
    responseType: 'arraybuffer',
    encoding: null,
  })));

  const result = {};

  await Promise.all(responses.map(async (response, idx) => {
    const downloadedResoursesPath = downloadedResoursesPaths[idx];
    const imagePath = projectDir + downloadedResoursesPath;
    result[response.request.path] = newFilePath + downloadedResoursesPath;
    await fs.writeFile(imagePath, response.data);
  }));
  return result;
};

const copyImages = async (pagePath, data, currentDir) => {
  const url = new URL(pagePath);
  const proto = url.protocol;
  const host = url.hostname;

  const reg1 = /[^a-z0-9]+/g;
  const reg2 = /[^a-z0-9.]+/g;

  const newUrl = pagePath.replace(proto, '');
  const newFilePath = newUrl.replace(reg1, '-').slice(1).concat('_files');

  const $ = cheerio.load(data);
  const imageUrls = $('body').find('img').toArray().map((el) => {
    // eslint-disable-next-line no-param-reassign
    el = $(el);
    return el.attr('src');
  });

  const requestUrls = imageUrls.map((elem) => `${proto}//${host}${elem}`);

  const paths = imageUrls.map((elem) => elem.replace(reg2, '-'));
  const newHost = host.replace(reg1, '-');
  const downloadedResoursesPaths = paths.map((elem) => `/${newHost}${elem}`);

  const fullPath = await path.resolve(currentDir, newFilePath);
  const projectFolder = new URL(fullPath, import.meta.url);
  const projectDir = await mkdir(projectFolder, { recursive: true });
  return request(requestUrls, downloadedResoursesPaths, projectDir, newFilePath);
};

export default copyImages;
