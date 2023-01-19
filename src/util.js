import path from 'path';
import debug from 'debug';

const module = 'page-loader: normalizeName';
const log = debug(module);

const tags = ['img', 'link', 'script'];
const tagAttrs = ['src', 'href'];

const mapping = {
  img: 'src',
  script: 'src',
  link: 'href',
};

const tagNames = Object.keys(mapping);

export const localizeLinks = ($, resourcesToLocalize) => {
  tags.forEach((tag) => {
    $(tag).each(function a() {
      resourcesToLocalize.forEach(({ link, relativePath }) => {
        const tagAttr = tagAttrs.filter((el) => $(this).attr(el)).join('');
        if ($(this).attr(tagAttr) === link) {
          $(this).attr(tagAttr, relativePath);
        }
      });
    });
  });
};

export const nameChanger = (url) => url.replace(/htt(p|ps):\/\//, '').replace(/\W/g, '-');

export const normalizeName = (url) => {
  const nameForChange = `${path.parse(url.href).dir}/${path.parse(url.href).name}`;
  const nameWhithOutExt = nameChanger(nameForChange);
  const resultName = `${nameWhithOutExt}${path.parse(url.href).ext}`;
  if (path.parse(url.href).ext === '') {
    return `${resultName}.html`;
  }
  log(`Filename is ${resultName}`);
  return resultName;
};

export const isDownloadable = (src, url) => {
  const srcUrl = new URL(src, url);
  const pageUrl = new URL(url);
  return srcUrl.origin === pageUrl.origin;
};

export const getResoursesLinks = ($, url) => {
  const links = [];
  tagNames.forEach((tagName) => {
    const attrName = mapping[tagName];
    const srcLinks = $(tagName).toArray();
    srcLinks.forEach((link) => {
      const srcLink = $(link).attr(attrName);
      if (srcLink && isDownloadable(srcLink, url)) {
        links.push(srcLink);
      }
    });
  });
  return links;
};
