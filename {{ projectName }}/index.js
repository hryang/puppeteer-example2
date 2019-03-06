const setup = require('./lib/setup');
const ossClient = require('./lib/oss-client');
const path = require('path');

let browser;

module.exports.initializer = (context, callback) => {
  setup.getBrowser(context)
    .then(b => {
      browser = b
      callback(null, '');
    }).catch(callback);
};


module.exports.handler = (event, context, callback) => {
  let evtStr = event.toString();
  let pageUrl = evtStr
  console.log(`page url: ${pageUrl}`);
  dir = 'html2png'
  obj = pageUrl.trim().replace(/^https?:\/\//g, '').replace(/\./g, '_').replace(/\//g, '_') + '.png'
  objPath = path.join(dir, obj)
  screenshot(pageUrl)
    .then(file => uploadToOss(context, objPath, file))
    .then(url => callback(null, `The screenshot has been uploaded to ${url}`))
    .catch(callback);
};

async function screenshot(url) {
  const page = await browser.newPage();
  const outputFile = '/tmp/screenshot.png';
  await page.goto(url);
  await page.screenshot({
    path: outputFile,
    fullPage: true
  });
  console.log("screenshot save to /tmp/screenshot.png");
  return outputFile;
};

async function uploadToOss(context, objPath, file) {
  let client = ossClient(context);

  let result = await client.put(objPath, file);
  await client.putACL(objPath, 'public-read');

  return result.url.replace('-internal.aliyuncs.com/', '.aliyuncs.com/');
}

