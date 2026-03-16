const PROXY_CONFIG = {
    '/api': {
        target: 'http://localhost:7002',
        secure: false,
        pathRewrite: {
            '^/api/': ''
        },
        onProxyRes(proxyRes)
        {
            let newCookies;

            if (newCookies = proxyRes.headers['set-cookie'])
            {
                newCookies[0] = newCookies[0]
                    .replace(/HttpOnly;/gi, '')
                    .replace(/Secure/gi, '');
            }
        }
    }
};

module.exports = PROXY_CONFIG;