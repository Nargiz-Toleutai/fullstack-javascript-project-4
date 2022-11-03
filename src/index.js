import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

const pageLoader = async (currentDir, filePath) => {
  const data = await axios.get(filePath);
  const { url } = data.config;
  const { protocol } = data.request;
  const newUrl = url.replace(protocol, '');
  const reg = /[^a-z0-9]+/g;
  const newFilePath = newUrl.replace(reg, '-').slice(1).concat('.html');
  const fullPath = path.resolve(currentDir, newFilePath);
  await fs.writeFile(fullPath, data.data);
  // await Promise.all([writing]);
  return [`Page was successfully downloaded into ${fullPath}`];
};

export default pageLoader;
