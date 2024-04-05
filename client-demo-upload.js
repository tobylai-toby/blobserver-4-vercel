const {upload}=require("@vercel/blob/client");
async function uploadFile(file,channel,endpoint){
    const newBlob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: `${endpoint}/api/vercel-blob/handle-upload?channel_name=${encodeURIComponent(channel)}`,
      });
    console.log();
}
// create a file
const file = new File(["hello world"], "hello.txt", {
    type: "text/plain",
})

// upload the file
uploadFile(file,"your-channel-name","https://your-vercel-app.vercel.app");  