const PROXY_CONFIG = {
    '/api': {
        target: 'http://localhost:7000',
        secure: false,
        pathRewrite: {
            '^/api/': ''
        },
        changeOrigin: true,
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