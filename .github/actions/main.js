const core = require("@actions/core"); // input and output
const exec = require("@actions/exec"); // uploading to S3

async function run() {
  // Get inputs
  const bucket = core.getInput("bucket", { required: true });
  const bucketRegion = core.getInput("bucket-region", { required: true });
  const distFolder = core.getInput("dist-folder", { required: true });

  // Upload files to S3
  const s3URI = `s3://${bucket}`;
  await exec.exec(`aws s3 sync ${distFolder} ${s3URI} --region ${bucketRegion}`);

  // Get URL
  const websiteUrl = `http://${bucket}.s3-website-${bucketRegion}.amazonaws.com`;

  // Set the output URL for use in subsequent steps
  core.setOutput("website-url", websiteUrl);
}

run().catch((error) => {
  core.setFailed(error.message);
});