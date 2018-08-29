const express = require('express');
const path = require('path');
const serveStatic = require('serve-static');

let app = express();


app.use("/", serveStatic(path.join (__dirname, '/dist')));

app.get('*', function (req, res) {
    res.sendFile(__dirname + '/dist/index.html')
})

const port = process.env.port || 5000;
app.listen(port, () => {
    console.log('Listening on port ' + port);
})
