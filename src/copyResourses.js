import cheerio from 'cheerio';
import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';
import Listr from 'listr';
import debug from 'debug';
import { mkdir } from 'node:fs/promises';
import { URL } from 'url';

// const debugPageLoader = debug('page-loader');

const requests = async (requestUrls, downloadedResoursesPaths, projectDir, newFilePath, urls) => {
  const requestsMap = [];
  const tasks = new Listr(
    requestUrls.map((requestUrl, idx) => ({
      title: requestUrl,
      task: async () => {
        const response = await axios({
          method: 'get',
          url: requestUrl,
          responseType: 'arraybuffer',
          timeout: 5000,
          encoding: null,
        });
        debug(`page-loader: resource ${requestUrl} was successfully loaded`);
        const downloadedResoursesPath = downloadedResoursesPaths[idx];
        const imagePath = projectDir + downloadedResoursesPath;
        const urlAttr = Object.values(urls).map((elem) => elem.attr);
        const urlPath = Object.keys(urls).map((elem) => elem);
        await fs.writeFile(imagePath, response.data).catch((e) => {
          debug(`page-loader: error while loading
          resource ${requestUrl}: ${JSON.stringify(e)}`);
          return Promise.reject(e);
        });
        requestsMap.push([[urlPath[idx]], {
          attr: urlAttr[idx],
          newPath: newFilePath + downloadedResoursesPath,
        }]);
      },
    })),
    { concurrent: true },
  );
  await tasks.run();
  return Object.fromEntries(requestsMap);
};

const reg1 = /[^a-z0-9]+/g;
const reg2 = /[^a-z0-9.]+/g;

const resoursesPaths = (data, host, origin) => {
  const paths = data.map((elem) => (elem.startsWith(origin)
    ? elem.replace(origin, '').replace(reg2, '-')
    : elem.replace(reg2, '-')));
  const newHost = host.replace(reg1, '-');
  return paths.map((elem) => (path.extname(elem) === ''
    ? `/${newHost}${elem}.html`
    : `/${newHost}${elem}`));
};

const createProjectDir = async (currentDir, newFilePath) => {
  const fullPath = await path.resolve(currentDir, newFilePath);
  try {
    const projectFolder = new URL(fullPath, import.meta.url);
    const projectDir = await mkdir(projectFolder, { recursive: true });
    return projectDir ?? projectFolder.pathname;
  } catch (err) {
    return err;
  }
};

const findResourses = (data, host, protocol) => {
  const $ = cheerio.load(data);

  const findLinks = (sel, attr) => Object.fromEntries($('html').find(sel).toArray()
    .map((el) => $(el).attr(attr))
    .filter(Boolean)
    .filter((elem) => elem.match(host) || !elem.startsWith(protocol))
    .map((elem) => [elem, { attr }]));

  return Object.assign(...[
    ['img', 'src'],
    ['link', 'href'],
    ['script', 'src'],
  ].map((args) => findLinks(...args)));
};

const copyResourses = async (pagePath, currentDir, data) => {
  const url = new URL(pagePath);
  const { protocol, host, origin } = url;

  const newUrl = pagePath.replace(protocol, '');

  const newFilePath = newUrl
    .replace(/^\/\//, '')
    .replace(/\/$/, '')
    .replace(reg1, '-')
    .concat('_files');

  const urls = findResourses(data, host, protocol);
  console.log({ urls });
  const requestUrls = Object.keys(urls).map((elem) => ((elem.match(origin))
    ? elem
    : `${protocol}//${host}${elem}`));

  const downloadedResoursesPaths = resoursesPaths(Object.keys(urls), host, origin);

  const projectDir = await createProjectDir(currentDir, newFilePath);

  return requests(
    requestUrls,
    downloadedResoursesPaths,
    projectDir,
    newFilePath,
    urls,
  );
};

export default copyResourses;
