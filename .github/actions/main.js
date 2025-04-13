const core = require('@actions/core');//input and output
const exec = require('@actions/exec');//uploading files to s3


function run() {
//getting inputs
    const bucket = core.getInput('bucket',{required:true});//bucket name
    const bucketRegion = core.getInput('bucket-region',{required:true});//bucket region
    const distFolder = core.getInput('dist-folder',{required:true});//dist folder name


//uploading files to s3
const s3Url = 's3://${bucket}';//s3 url
exec.exec('aws s3 sync ${distFolder} ${s3Url} --region ${bucketRegion}')
// 'aws s3 sync ${distFolder} ${s3Url} --region ${bucketRegion}'//aws s3 sync command


//getting website url
const websiteUrl = `http://${bucket}.s3-website-${bucketRegion}.amazonaws.com`//website url
// http://skillmatchesai.s3-website.eu-north-1.amazonaws.com
core.setOutput('website-url', websiteUrl)//setting output
}
run()