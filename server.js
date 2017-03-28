const app = require('express')();
const fs = require('fs');
const http = require('http');
const https = require('https');
const net = require('net');

//＃生成私钥key文件
//openssl genrsa 1024 > private.pem

//＃通过私钥文件生成CSR证书签名
//openssl req -new -key private.pem -out csr.pem

//＃通过私钥文件和CSR证书签名生成证书文件
//openssl x509 -req -days 365 -in csr.pem -signkey private.pem -out file.crt

const privateKey  = fs.readFileSync('private.pem', 'utf8');
const certificate = fs.readFileSync('file.crt', 'utf8');
const credentials = {key: privateKey, cert: certificate};
const bodyParser = require('body-parser');
const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);
const PORT = 18080;
const SSLPORT = 18081;
const DOUBLE_POSRT = 18082

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

httpServer.listen(PORT, () => {
    console.log('Http Server is running on: http://localhost:%s', PORT);
});
httpsServer.listen(SSLPORT, () => {
    console.log('Https Server is running on: https://localhost:%s', SSLPORT);
});
net.createServer((socket) => {
    socket.once('data', (buf) => {
        var address = buf[0] === 22 ? SSLPORT : PORT;
        //创建一个指向https或http服务器的链接
        var proxy = net.createConnection(address, function() {
            proxy.write(buf);
            //反向代理的过程，tcp接受的数据交给代理链接，代理链接服务器端返回数据交由socket返回给客户端
            socket.pipe(proxy).pipe(socket);
        });
        
        proxy.on('error', function(err) {
            console.log(err);
        });
    });
    
    socket.on('error', function(err) {
        console.log(err);
    });
}).listen(DOUBLE_POSRT, () => {
    console.log('Https and Http is running on: %s', DOUBLE_POSRT);
});

//https请求代理
const httpsProxy = (opts, req, res) => {
    let data, contentType;
    if (opts.content == 'json') {
        data = JSON.stringify(req.body);
        contentType = 'application/json'
    }
    if (opts.content == 'form') {
        data = require('querystring').stringify(req.body)
        contentType = 'application/x-www-form-urlencoded'
    }
    let options = Object.assign({}, {
        agent: false,
        headers: {
            "Content-Type": contentType,  
            "Content-Length": data.length
        }
    }, opts);
    let api_req = https.request(options, (response) => {
        console.log('statusCode:', response.statusCode);
        console.log('headers:', response.headers);
        let result = ''
        if (response.statusCode == 200) {
            response.on('data', (d) => {
                process.stdout.write(d);
                result += d
            }).on('end', (d) => {
                res.status(200).send(result)
            });
        }
        else {
            res.status(500).send("error");
        }
    }); 

    api_req.on('error', (e) => {
        console.error(e);
        res.status(500).send("error");
    });
    api_req.write(data + '\n');
    api_req.end();
}

app.all('*', (req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header("Access-Control-Al" + "low-Methods","PUT,POST,GET,DELETE,OPTIONS");
    res.header("X-Powered-By",' 3.2.1');
    res.header("Content-Type", "application/json;charset=utf-8");
    next();
});

app.get('/', (req, res) => {
    if(req.protocol === 'https') {
        res.status(200).send('Welcome to Https Server!');
    }
    else {
        res.status(200).send('Welcome!');
    }
});

//代理配置
const proxyConfig = {
    target: '/api',
    options: {
        hostname: 'api.example.com',
        path: '/',
        port: 443,
        method: 'POST',
        content: 'form'
    }
}

app.all(proxyConfig.target, (req, res) => {
    console.log(req.body);
    httpsProxy(proxyConfig.options, req, res);
});
