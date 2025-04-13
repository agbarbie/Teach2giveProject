const core = require('@actions/core'); // Input and output
const exec = require('@actions/exec'); // Uploading files to S3

async function run() {
  try {
    // Getting inputs
    const bucket = core.getInput('bucket', { required: true }); // Bucket name
    const bucketRegion = core.getInput('bucket-region', { required: true }); // Bucket region
    const distFolder = core.getInput('dist-folder', { required: true }); // Dist folder name

    // Uploading files to S3
    const s3Url = `s3://${bucket}`; // Correctly interpolated S3 URL
    await exec.exec('aws', ['s3', 'sync', distFolder, s3Url, '--region', bucketRegion]);

    // Getting website URL
    const websiteUrl = `http://${bucket}.s3-website-${bucketRegion}.amazonaws.com`; // Website URL
    core.setOutput('website-url', websiteUrl); // Setting output
  } catch (error) {
    // http://skillmatchesai.s3-website.eu-north-1.amazonaws.com
    core.setFailed(error.message);
  }
}

run();
