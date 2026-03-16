# Solução para Ícones SVG no Mobile (Capacitor)

## Problema
Quando o app é compilado para Android usando Capacitor, os ícones SVG não carregam corretamente porque o `mat-icon` faz requisições HTTP com caminhos relativos que não funcionam no ambiente mobile.

## Solução Implementada

### Modificação no AppComponent
**Arquivo:** `Frontend/src/app/app.component.ts`

Adicionado import do environment e modificado o método `registrySvg`:

```typescript
import { environment } from '../environments/environments';

public registrySvg(svgList: Array<string>, folder: string): void {
    svgList.forEach((imageName: string) => {
        let iconUrl: string;
        
        if (environment.isCapacitor) {
            // Para mobile (Capacitor), usar URL completa
            iconUrl = `https://${environment.baseUrl}/assets/${folder}/${imageName}.svg`;
        } else {
            // Para web, usar caminho relativo como no código que funciona
            iconUrl = `../assets/${folder}/${imageName}.svg`;
        }
        
        this.iconRegistry.addSvgIcon(
            imageName,
            this.domSanitizer.bypassSecurityTrustResourceUrl(iconUrl)
        );
    });
}
```

## Como Funciona

### Para Web (isCapacitor: false)
- Usa caminho relativo: `../assets/icons/logo.svg`
- Funciona normalmente no navegador

### Para Mobile (isCapacitor: true)
- Usa URL completa: `https://tokeniza.com.br/assets/icons/logo.svg`
- Funciona no ambiente Capacitor/Android

## Configuração

A solução usa a variável `isCapacitor` do arquivo `environments.ts`:

```typescript
export const environment = {
    // ... outras configurações
    isCapacitor: true, // true para mobile, false para web
    baseUrl: 'tokeniza.com.br' // domínio base para URLs completas
};
```

## Benefícios

1. **Solução Simples**: Apenas uma modificação no método existente
2. **Baseada em Código que Funciona**: Segue o padrão do código fornecido
3. **Automática**: Funciona automaticamente baseado na plataforma
4. **Compatível**: Funciona tanto para web quanto para mobile

## Teste

Para testar a solução:

1. **Web**: Os ícones devem carregar normalmente
2. **Mobile**: Os ícones devem carregar via URL completa do servidor

A solução está implementada e pronta para uso!

