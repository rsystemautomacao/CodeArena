/**
 * Utilitários para validação de IP e controle de acesso
 *
 * ATENÇÃO SOBRE IP SPOOFING:
 * O cabeçalho X-Forwarded-For pode ser forjado pelo cliente caso a aplicação
 * não esteja atrás de um proxy reverso confiável (Vercel Edge, Nginx, Cloudflare).
 * Em ambientes de produção, certifique-se de que somente o proxy confiável pode
 * definir/sobrescrever X-Forwarded-For. Nunca confie em IPs de clientes não verificados.
 */

/**
 * Valida se uma string representa um endereço IPv4 válido (octetos 0-255).
 */
function isValidIPv4(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    const n = Number(part);
    return Number.isInteger(n) && n >= 0 && n <= 255 && part === String(n);
  });
}

/**
 * Obtém o IP real do cliente a partir da requisição.
 * Suporta tanto Request (fetch) quanto NextRequest (Next.js).
 *
 * Ordem de prioridade (mais confiável primeiro):
 * 1. CF-Connecting-IP (Cloudflare – gerenciado pela CDN, não pelo cliente)
 * 2. X-Real-IP (definido por Nginx/proxy confiável)
 * 3. Último IP de X-Forwarded-For (proxy confiável adiciona ao final)
 */
export function getClientIP(request: Request | { headers: Headers | { get: (key: string) => string | null }, url?: string }): string {
  const headers = request.headers as Headers;

  // Cloudflare injeta este header com o IP real — não pode ser forjado pelo cliente
  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP && isValidIPv4(cfConnectingIP.trim())) {
    return cfConnectingIP.trim();
  }

  // X-Real-IP definido por Nginx/proxy confiável
  const realIP = headers.get('x-real-ip');
  if (realIP && isValidIPv4(realIP.trim())) {
    return realIP.trim();
  }

  // X-Forwarded-For: "client, proxy1, proxy2"
  // O proxy confiável adiciona ao FINAL da lista. Usar o último IP válido.
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim()).filter(isValidIPv4);
    if (ips.length > 0) {
      // Usar o último IP válido (adicionado pelo proxy mais próximo da aplicação)
      return ips[ips.length - 1];
    }
  }

  // Fallback para desenvolvimento local
  if (request.url) {
    try {
      const hostname = new URL(request.url).hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return '127.0.0.1';
      }
    } catch (_) {
      // URL inválida — ignorar
    }
  }

  return '';
}

/**
 * Converte um IP IPv4 válido para número inteiro sem sinal para comparação.
 * Retorna 0 se o IP for inválido.
 */
function ipToNumber(ip: string): number {
  if (!isValidIPv4(ip)) return 0;
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

/**
 * Verifica se um IP está em uma faixa CIDR
 * Exemplo: isIPInRange("192.168.1.100", "192.168.1.0/24") => true
 */
function isIPInRange(ip: string, cidr: string): boolean {
  try {
    const [network, prefixLength] = cidr.split('/');
    const prefix = Number(prefixLength);
    
    if (isNaN(prefix) || prefix < 0 || prefix > 32) {
      return false;
    }

    const networkNum = ipToNumber(network);
    const ipNum = ipToNumber(ip);
    
    const mask = (0xFFFFFFFF << (32 - prefix)) >>> 0;
    
    return (networkNum & mask) === (ipNum & mask);
  } catch (error) {
    console.error('Erro ao validar IP:', error);
    return false;
  }
}

/**
 * Verifica se um IP está em uma das faixas permitidas
 */
export function isIPAllowed(clientIP: string, allowedRanges: string[]): boolean {
  if (!clientIP || allowedRanges.length === 0) {
    return false;
  }

  // Verificar se o IP está em alguma das faixas
  return allowedRanges.some(range => {
    // Se for um IP exato (sem /), comparar diretamente
    if (!range.includes('/')) {
      return clientIP === range;
    }
    
    // Se for uma faixa CIDR, usar a função de validação
    return isIPInRange(clientIP, range);
  });
}

/**
 * Valida se o IP do cliente está na rede do laboratório
 * Suporta tanto Request (fetch) quanto NextRequest (Next.js)
 */
export function validateLabIP(request: Request | { headers: Headers | { get: (key: string) => string | null }, url?: string }, allowedIPRanges: string[]): {
  isValid: boolean;
  clientIP: string;
  reason?: string;
} {
  const clientIP = getClientIP(request);
  
  if (!clientIP) {
    return {
      isValid: false,
      clientIP: '',
      reason: 'Não foi possível determinar o IP do cliente',
    };
  }

  if (allowedIPRanges.length === 0) {
    return {
      isValid: false,
      clientIP,
      reason: 'Nenhuma faixa de IP configurada',
    };
  }

  const isAllowed = isIPAllowed(clientIP, allowedIPRanges);
  
  return {
    isValid: isAllowed,
    clientIP,
    reason: isAllowed 
      ? 'IP permitido' 
      : `IP ${clientIP} não está na rede do laboratório permitida`,
  };
}
