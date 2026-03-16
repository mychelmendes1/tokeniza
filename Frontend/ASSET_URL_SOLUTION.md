# Solução para Carregamento de Assets no Mobile (Capacitor)

## Problema
Quando o app é compilado para Android usando Capacitor, as imagens não carregam corretamente porque o `mat-icon` faz requisições HTTP com caminhos relativos que não funcionam no ambiente mobile.

## Análise do Código que Funciona
Analisando um exemplo de código que funciona corretamente, identificamos que:

1. **Caminho relativo correto**: Usa `../assets/` (com dois pontos) para web
2. **Registro direto**: Alguns ícones são registrados diretamente no construtor
3. **Estrutura de pastas**: Os ícones estão organizados em `assets/icons/` e `assets/images/`

**Exemplo do código que funciona:**
```typescript
this.matIconRegistry.addSvgIcon(
    "blockchain",
    this.domSanitizer.bypassSecurityTrustResourceUrl("../assets/svgIcons/blockchain_icon.svg")
);

// Para múltiplos ícones
this.svgIcons.forEach((imageName: string) => {
    this.matIconRegistry.addSvgIcon(
        imageName,
        this.domSanitizer.bypassSecurityTrustResourceUrl(`../assets/svg-icons/${imageName}.svg`)
    );
});
```

## Solução Implementada

### 1. AssetUrlService
Criado um serviço centralizado para gerenciar URLs de assets:

**Arquivo:** `Frontend/src/app/shared/services/asset-url/asset-url.service.ts`

**Funcionalidades:**
- `getAssetUrl(assetPath: string)`: Retorna URL completa para mobile ou caminho relativo para web
- `getIconUrl(iconName: string)`: Específico para ícones SVG
- `getImageUrl(imageName: string)`: Específico para imagens

### 2. AssetUrlPipe
Criado um pipe para facilitar o uso nos templates HTML:

**Arquivo:** `Frontend/src/app/shared/pipes/asset-url/asset-url.pipe.ts`

**Uso no template:**
```html
<!-- Antes -->
<img src="assets/images/logo.svg" alt="logo">

<!-- Depois -->
<img [src]="'images/logo.svg' | assetUrl" alt="logo">
```

### 3. Atualização do AppComponent
Modificado o método `registrySvg` para usar o `AssetUrlService`:

**Arquivo:** `Frontend/src/app/app.component.ts`

```typescript
public registrySvg(svgList: Array<string>, folder: string): void {
    svgList.forEach((imageName: string) => {
        const iconUrl = this.assetUrlService.getAssetUrl(`${folder}/${imageName}.svg`);
        
        this.iconRegistry.addSvgIcon(
            imageName,
            this.domSanitizer.bypassSecurityTrustResourceUrl(iconUrl)
        );
    });
}
```

### 4. Atualização do ImagePreloaderService
Modificado para usar URLs corretas no preload de imagens:

**Arquivo:** `Frontend/src/app/shared/services/util/image-preloader.service.ts`

## Como Usar

### Para Ícones SVG (mat-icon)
Os ícones SVG já são tratados automaticamente pelo `AppComponent`. Não é necessário fazer alterações.

### Para Imagens em Templates
Use o pipe `assetUrl`:

```html
<!-- Imagem simples -->
<img [src]="'images/logo.svg' | assetUrl" alt="logo">

<!-- Imagem com condição -->
<img [src]="(user.avatar ? user.avatar : 'images/default-avatar.svg') | assetUrl" alt="avatar">
```

### Para Imagens em Componentes TypeScript
Use o `AssetUrlService`:

```typescript
import { AssetUrlService } from './shared/services/asset-url/asset-url.service';

constructor(private assetUrlService: AssetUrlService) {}

// Exemplo de uso
const imageUrl = this.assetUrlService.getImageUrl('logo.svg');
const iconUrl = this.assetUrlService.getIconUrl('check');
```

## Configuração

A solução usa a variável `isCapacitor` do arquivo `environments.ts` para determinar se deve usar URLs completas ou caminhos relativos:

```typescript
// environments.ts
export const environment = {
    // ... outras configurações
    isCapacitor: true, // true para mobile, false para web
    baseUrl: 'tokeniza.com.br' // domínio base para URLs completas
};
```

## URLs Geradas

### Para Web (isCapacitor: false)
- Ícones: `../assets/icons/logo.svg`
- Imagens: `../assets/images/logo.svg`

### Para Mobile (isCapacitor: true)
- Ícones: `https://tokeniza.com.br/assets/icons/logo.svg`
- Imagens: `https://tokeniza.com.br/assets/images/logo.svg`

## Benefícios

1. **Solução Centralizada**: Todas as URLs de assets são gerenciadas em um local
2. **Automática**: Funciona automaticamente baseado na plataforma
3. **Flexível**: Fácil de usar em templates e componentes
4. **Manutenível**: Mudanças futuras precisam ser feitas apenas no serviço
5. **Compatível**: Funciona tanto para web quanto para mobile

## Arquivos Modificados

1. `Frontend/src/app/app.component.ts` - Registro de ícones SVG
2. `Frontend/src/app/shared/services/asset-url/asset-url.service.ts` - Novo serviço
3. `Frontend/src/app/shared/pipes/asset-url/asset-url.pipe.ts` - Novo pipe
4. `Frontend/src/app/shared/pipes/pipes.module.ts` - Exportação do pipe
5. `Frontend/src/app/shared/services/util/image-preloader.service.ts` - Preload de imagens
6. `Frontend/src/app/app.config.ts` - Configuração de preload
7. `Frontend/src/app/home/home.component.html` - Exemplo de uso do pipe
