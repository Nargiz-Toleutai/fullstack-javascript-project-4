/* eslint-disable no-shadow */
import axios from 'axios';
import { cwd } from 'node:process';
import fsp from 'fs/promises';
import path from 'path';
import * as cheerio from 'cheerio';
import axiosDebug from 'axios-debug-log';
import debug from 'debug';
import Listr from 'listr';
import prettier from 'prettier';
import {
  nameChanger, normalizeName, getResoursesLinks, localizeLinks,
} from './util.js';

const log = debug('page-loader');

axiosDebug({
  request(httpDebug, config) {
    httpDebug(`Request ${config.url}`);
  },
  response(httpDebug, response) {
    httpDebug(
      `Response with ${response.headers['content-type']}`,
      `from ${response.config.url}`,
    );
  },
});

const downloadResourses = (downloadLink, dirPath, srcName, link) => {
  const task = axios.get(downloadLink, { responseType: 'arraybuffer' })
    .then(({ data }) => fsp.writeFile(path.join(dirPath, srcName), data));
  log(`Download resourse from ${downloadLink.href}`);
  return { title: link, task: () => task };
};

const resourceProcessing = (filePath, url, fileName) => {
  const dirName = `${fileName}_files`;
  const dirPath = `${filePath}_files`;
  const htmlFilePath = `${filePath}.html`;
  const resourcesToLocalize = [];
  let $;
  return axios.get(url)
    .then(({ data }) => {
      $ = cheerio.load(data);
      const linkForDownload = getResoursesLinks($, url);
      if (linkForDownload.length === 0) {
        console.error('No resourses for download');
      }
      const tasks = new Listr(
        linkForDownload.map((link) => {
          const downloadLink = new URL(link, url);
          const srcName = normalizeName(downloadLink);
          const relativePath = `${dirName}/${srcName}`;
          resourcesToLocalize.push({ link, relativePath });
          log(`Filename is ${srcName}`);
          return downloadResourses(downloadLink.href, dirPath, srcName, link);
        }),
      );
      return tasks.run();
    })
    .then(() => {
      localizeLinks($, resourcesToLocalize);
      log(`HTML filepath is ${htmlFilePath}`);
      console.log(`Page was successfully downloaded into ${htmlFilePath}`);
      return fsp.writeFile(htmlFilePath, prettier.format($.html(), { parser: 'html' }));
    });
};

const downloadPage = (url, filePath = cwd()) => {
  const fileName = nameChanger(url);
  const resultPath = path.join(filePath, fileName);
  log(`Resultpath is ${resultPath}`);
  return fsp.access(filePath)
    .catch(() => fsp.mkdir(filePath, { recursive: true }))
    .then(() => fsp.mkdir(`${resultPath}_files`, { recursive: true }))
    .then(() => resourceProcessing(`${resultPath}`, url, fileName));
};

export default downloadPage;
