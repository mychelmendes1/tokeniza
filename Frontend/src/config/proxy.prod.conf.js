const PROXY_CONFIG = {
    '/api': {
		target: 'https://plataforma.tokeniza.com.br',
		secure: true,
		changeOrigin: true,
		logLevel: 'debug',
		onProxyRes(proxyRes) {
			let newCookies;
			if (newCookies = proxyRes.headers['set-cookie']) {
				newCookies[0] = newCookies[0]
				.replace(/HttpOnly;/gi, '')
				.replace(/Secure/gi, '');
			}
		}
	}
};

module.exports = PROXY_CONFIG;