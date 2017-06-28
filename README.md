# nodejs-https-server

nodejs https服务，支持https代理请求

```js
const proxyConfig = {
    // 代理服务根地址
    target: '/invoke.json',
    options: {
        //远程api域名地址
        hostname: 'api.example.com',
        //远程api路径
        path: '/',
        port: 443,
        method: 'POST',
        //支持form、json格式
        content: 'form'
    },
    //http 代理端口
    PORT: 18080,
    //https 代理端口
    SSLPORT: 18081,
    //双端口
    DOUBLE_POSRT: 18082
}
```