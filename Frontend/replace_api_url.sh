find '/axia' -name '*.js' -exec sed -i -e 's,API_BASE_URL,'"$API_BASE_URL"',g' {} \;
find '/etc/nginx/' -name '*.conf' -exec sed -i -e 's,API_BASE_URL_NGNIX,'"$API_BASE_URL_NGNIX"',g' {} \;

nginx -g "daemon off;"
