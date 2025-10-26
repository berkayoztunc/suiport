# SuiPort MCP Server

SuiPort MCP (Model Context Protocol) Server, AI asistanlarının SUI blockchain üzerindeki cüzdan bakiyelerini ve token fiyatlarını sorgulamasını sağlar.

## MCP Nedir?

Model Context Protocol (MCP), AI modellerinin dış sistemlerle güvenli ve standart bir şekilde etkileşime girmesini sağlayan bir protokoldür. SuiPort MCP server'ı, AI asistanlarına SUI blockchain verilerine erişim imkanı sunar.

## Kurulum

### 1. Bağımlılıkları Yükleyin

```bash
yarn install
```

### 2. Projeyi Deploy Edin

```bash
yarn deploy
```

### 3. MCP Endpoint'i

Deploy sonrası MCP endpoint'iniz şu adreste olacak:
```
https://your-worker-url.workers.dev/mcp
```

## Kullanılabilir Tool'lar

### 1. get_wallet_balance

Bir SUI cüzdan adresinin bakiyesini ve token varlıklarını sorgular.

**Parametreler:**
- `address` (string, required): Sorgulanacak SUI cüzdan adresi

**Örnek İstek:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_wallet_balance",
    "arguments": {
      "address": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
    }
  }
}
```

**Örnek Yanıt:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{
          \"success\": true,
          \"data\": {
            \"address\": \"0x1234...\",
            \"totalValueUSD\": 1234.56,
            \"tokenCount\": 5,
            \"tokens\": [
              {
                \"coinType\": \"0x2::sui::SUI\",
                \"balance\": \"1000000000\",
                \"valueUSD\": 1.85,
                \"price\": 1.85,
                \"metadata\": {
                  \"decimals\": 9,
                  \"name\": \"Sui\",
                  \"symbol\": \"SUI\"
                }
              }
            ]
          }
        }"
      }
    ]
  }
}
```

### 2. get_token_price

Bir token'ın güncel USD fiyatını sorgular.

**Parametreler:**
- `tokenType` (string, required): Token'ın tam tipi/adresi (örn: `0x2::sui::SUI`)

**Örnek İstek:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_token_price",
    "arguments": {
      "tokenType": "0x2::sui::SUI"
    }
  }
}
```

**Örnek Yanıt:**

```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{
          \"success\": true,
          \"data\": {
            \"tokenType\": \"0x2::sui::SUI\",
            \"priceUSD\": 1.85,
            \"fromCache\": false
          }
        }"
      }
    ]
  }
}
```

## AI İstemcileriyle Kullanım

### Claude Desktop ile Kullanım

`claude_desktop_config.json` dosyanıza şunu ekleyin:

```json
{
  "mcpServers": {
    "suiport": {
      "command": "curl",
      "args": [
        "-X", "POST",
        "-H", "Content-Type: application/json",
        "-d", "@-",
        "https://your-worker-url.workers.dev/mcp"
      ]
    }
  }
}
```

### Programatik Kullanım

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

const client = new Client({
  name: 'suiport-client',
  version: '1.0.0',
});

// MCP server'a bağlan
await client.connect({
  type: 'http',
  url: 'https://your-worker-url.workers.dev/mcp',
});

// Cüzdan bakiyesi sorgula
const result = await client.callTool('get_wallet_balance', {
  address: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'
});

console.log(result);
```

## Özellikler

- ✅ **Gerçek Zamanlı Veri**: SUI blockchain'den güncel veri çeker
- ✅ **Önbellekleme**: Token fiyatları veritabanında önbelleklenir
- ✅ **Metadata Desteği**: Token metadata'sı (isim, sembol, decimals, vb.)
- ✅ **USD Değerleme**: Tüm token bakiyeleri USD cinsinden hesaplanır
- ✅ **Hata Yönetimi**: Kapsamlı hata yakalama ve raporlama
- ✅ **Cloudflare Workers**: Edge üzerinde hızlı yanıt süreleri

## API Endpoint'leri

MCP Server'ın yanı sıra, REST API endpoint'leri de mevcuttur:

- `GET /wallet/:address` - Cüzdan bakiyesi sorgula
- `GET /price/:tokenType` - Token fiyatı sorgula
- `GET /sui-price-history` - SUI fiyat geçmişi
- `POST /graphql` - GraphQL API

## Geliştirme

### Yerel Çalıştırma

```bash
yarn dev
```

### Test

```bash
# MCP endpoint'i test et
curl -X POST https://localhost:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list"
  }'
```

## Lisans

MIT
