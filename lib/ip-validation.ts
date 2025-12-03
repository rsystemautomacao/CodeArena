/**
 * Utilitários para validação de IP e controle de acesso
 */

/**
 * Obtém o IP real do cliente a partir da requisição
 * Suporta tanto Request (fetch) quanto NextRequest (Next.js)
 */
export function getClientIP(request: Request | { headers: Headers | { get: (key: string) => string | null }, url?: string }): string {
  // Tentar obter de headers comuns de proxy/load balancer
  const headers = request.headers as Headers;
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    // x-forwarded-for pode conter múltiplos IPs separados por vírgula
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0]; // Retornar o primeiro IP (cliente original)
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers.get('cf-connecting-ip'); // Cloudflare
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback: tentar obter do URL (para desenvolvimento local)
  if (request.url) {
    try {
      const url = new URL(request.url);
      const hostname = url.hostname;
      
      // Se for localhost, retornar localhost
      if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return '127.0.0.1';
      }
    } catch (e) {
      // Ignorar erro de URL inválida
    }
  }

  // Se não conseguir determinar, retornar string vazia
  return '';
}

/**
 * Converte um IP para número para comparação
 */
function ipToNumber(ip: string): number {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4) return 0;
  return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
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

