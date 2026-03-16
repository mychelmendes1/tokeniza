find src/app/constants/rest-endpoint.constants.ts -name '*.ts' -exec sed -i -e 's,/api/,'https://plataforma.tokeniza.com.br/api/',g' {} \;

find src/environments/environment.ts -name '*.ts' -exec sed -i -e 's,isCapacitor:false,isCapacitor:true,g' {} \;

npm run build

npx cap sync ios

