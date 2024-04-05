const http = require('http');
const app = require('./app');

const port=parseInt(process.env.PORT || '3000');
app.set("port",port);
const server=http.createServer(app);
server.listen(port);
server.on("listening",()=>{
    console.log("server is running on port "+port);
});