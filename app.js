const { handleUpload } = require('@vercel/blob/client');
const {del}=require('@vercel/blob');
const express = require('express')
const app = express()
const fetch=require("node-fetch").default;

var channels = [];
try {
    channels = JSON.parse(process.env.channels || "[]");
} catch (e) {
    console.log("channelsS env var is not valid JSON")
}
// validate channels
// example '{"test":{"limit":6000,"url":"https://bloptmp.tobylai.fun/api/test-channels-recv"}}'
if (typeof channels !== "object") {
    console.log("channelsS env var is not an object")
    channels = [];
}
for (let name in channels) {
    if (!channels[name].url) {
        channels[name].url = "";
    }
}
app.get('/', (req, res) => {
    res.send('blobserver4vercel')
})

app.get("/api/vercel-blob/handle-upload", (req, res) => {
    let { channel_name } = req.query;
    channel_name = channel_name.toString();
    if (!channels[channel_name]) {
        res.status(400).send("channel not found");
        return;
    }
    let { url } = channels[channel_name];

    handleUpload({
        request: req,
        body: req.body,
        onBeforeGenerateToken: async (pathname, clientPayload) => {
            let verceldat = {
                maximumSizeInBytes: channels[channel_name].limit || 6000,
                allowedContentTypes: channels[channel_name].allow || ["*/*"],
                addRandomSuffix: true,
                tokenPayload: JSON.stringify({
                    "channel_name": channel_name,
                    "url": url,
                    "pathname": pathname,
                })
            }
            return verceldat;
        },
        onUploadCompleted: async ({ blob, tokenPayload }) => {
            console.log('blob upload completed', blob, tokenPayload);
            let { channel_name } = JSON.parse(tokenPayload);
            let resp=await fetch(channels[channel_name].url, {
                method: "POST",
                body: JSON.stringify({
                    "channel_name": channel_name,
                    "url": blob.url,
                    "channel_url": channels[channel_name].url,
                    "downloadUrl":blob.downloadUrl,
                    "pathname": blob.pathname,
                    "contentType": blob.contentType,
                })
            });
            if(!resp.ok){
                console.error("error sending to channel",await resp.text());
                return;
            }
            let data=await resp.text();
        }
    })
});
app.post("/api/vercel-blob/del", (req, res) => {
    let {channel_name,secret,url}=req.body;
    if(!channels[channel_name]){
        res.status(400).send("channel not found");
        return;
    }
    if(channels[channel_name].secret!==secret){
        res.status(400).send("secret not valid");
        return;
    }
    del(url).then(()=>{
        res.send("deleted");
    }).catch((e)=>{
        res.status(500).send("error deleting");
    });
});
app.post("/api/test-channels-recv", (req, res) => {
    let { channel_name,url, downloadUrl, pathname, contentType } = req.body;
    console.log("received from channel", channel_name, downloadUrl, pathname, contentType);
});
module.exports = app