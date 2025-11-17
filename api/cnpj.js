// =============================================
// CONFIGURAÇÕES DE PERFORMANCE
// =============================================
const SECURITY_CONFIG = {
  MAX_REQUESTS_PER_MINUTE: 10,
  TIMEOUT_MS: 10000,
  CACHE_TTL: 5 * 60 * 1000, // 5 minutos
  MAX_CACHE_SIZE: 100
};

// Cache otimizado com LRU (Least Recently Used)
class LRUCache {
  constructor(maxSize = 100) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }

  get(key) {
    if (!this.cache.has(key)) return null;
    
    const value = this.cache.get(key);
    // Mover para o final (mais recente)
    this.cache.delete(key);
    this.cache.set(key, value);
    
    return value;
  }

  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remover o mais antigo (primeiro)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      data: value,
      timestamp: Date.now()
    });
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > SECURITY_CONFIG.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }
}

// Instância única do cache
const requestCache = new LRUCache(SECURITY_CONFIG.MAX_CACHE_SIZE);

// Rate limiting otimizado
const rateLimitMap = new Map();

// =============================================
// MIDDLEWARES DE SEGURANÇA OTIMIZADOS
// =============================================
class SecurityMiddleware {
  static checkRateLimit(ip) {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minuto

    // Limpar entradas antigas de forma eficiente
    if (rateLimitMap.size > 1000) {
      for (const [key, timestamp] of rateLimitMap.entries()) {
        if (timestamp < windowStart) {
          rateLimitMap.delete(key);
        }
      }
    }

    const requestCount = Array.from(rateLimitMap.values())
      .filter(timestamp => timestamp > windowStart && timestamp.toString().startsWith(ip))
      .length;

    if (requestCount >= SECURITY_CONFIG.MAX_REQUESTS_PER_MINUTE) {
      return false;
    }

    rateLimitMap.set(`${ip}-${now}`, now);
    return true;
  }

  static getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || 
           req.connection.remoteAddress || 
           'unknown';
  }

  static sanitizeCNPJ(cnpj) {
    return typeof cnpj === 'string' ? cnpj.replace(/\D/g, '').substring(0, 14) : '';
  }
}

// =============================================
// VALIDAÇÃO DE CNPJ OTIMIZADA (SERVER-SIDE)
// =============================================
class CNPJValidatorServer {
  static validate(cnpj) {
    const cleaned = cnpj.replace(/\D/g, '');
    
    if (cleaned.length !== 14) {
      return { isValid: false, error: 'CNPJ deve conter 14 dígitos' };
    }

    if (/^(\d)\1+$/.test(cleaned)) {
      return { isValid: false, error: 'CNPJ inválido' };
    }

    // Validação otimizada
    let sum = 0;
    let weight = 5;
    
    for (let i = 0; i < 12; i++) {
      sum += parseInt(cleaned[i]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    
    let digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    
    if (digit !== parseInt(cleaned[12])) {
      return { isValid: false, error: 'CNPJ inválido' };
    }

    sum = 0;
    weight = 6;
    
    for (let i = 0; i < 13; i++) {
      sum += parseInt(cleaned[i]) * weight;
      weight = weight === 2 ? 9 : weight - 1;
    }
    
    digit = 11 - (sum % 11);
    if (digit > 9) digit = 0;
    
    if (digit !== parseInt(cleaned[13])) {
      return { isValid: false, error: 'CNPJ inválido' };
    }

    return { isValid: true, cleaned };
  }
}

// =============================================
// CLIENTE DA API EXTERNA OTIMIZADO
// =============================================
class ExternalAPIClient {
  static async fetchCNPJData(cnpj) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SECURITY_CONFIG.TIMEOUT_MS);

    try {
      const response = await fetch(`https://publica.cnpj.ws/cnpj/${cnpj}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CNPJ-Finder-App/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(`API externa: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new Error('Timeout na consulta');
      }
      
      throw error;
    }
  }
}

// =============================================
// MAPEADOR DE DADOS OTIMIZADO
// =============================================
class DataMapper {
  static mapToFrontendStructure(apiData) {
    const estabelecimento = apiData.estabelecimento || {};
    
    return {
      taxId: estabelecimento.cnpj || apiData.cnpj_raiz,
      alias: estabelecimento.nome_fantasia || null,
      founded: estabelecimento.data_inicio_atividade,
      updated: apiData.atualizado_em,
      status: { text: estabelecimento.situacao_cadastral || null },
      statusDate: estabelecimento.data_situacao_cadastral,
      head: estabelecimento.tipo === 'MATRIZ',

      company: {
        name: apiData.razao_social || null,
        nature: apiData.natureza_juridica ? {
          id: apiData.natureza_juridica.id,
          text: apiData.natureza_juridica.descricao,
        } : null,
        size: apiData.porte ? {
          text: apiData.porte.descricao,
          acronym: apiData.porte.id,
        } : null,
        equity: this.parseCurrency(apiData.capital_social),
        members: this.mapMembers(apiData.socios),
      },

      address: this.mapAddress(estabelecimento),
      phones: this.mapPhones(estabelecimento),
      emails: this.mapEmails(estabelecimento),
      mainActivity: this.mapActivity(estabelecimento.atividade_principal),
      sideActivities: this.mapActivities(estabelecimento.atividades_secundarias),
      registrations: this.mapRegistrations(estabelecimento.inscricoes_estaduais),
      suframa: [],
    };
  }

  static parseCurrency(value) {
    if (!value) return 0;
    try {
      return parseFloat(
        value.replace('R$', '')
             .replace(/\./g, '')
             .replace(',', '.')
             .trim()
      ) || 0;
    } catch {
      return 0;
    }
  }

  static mapMembers(socios) {
    if (!Array.isArray(socios)) return [];
    return socios.slice(0, 10).map(socio => ({ // Limitar a 10 sócios
      person: { name: socio.nome || null, age: socio.faixa_etaria || null },
      role: { text: socio.qualificacao_socio?.descricao || socio.tipo || 'Sócio' },
      since: socio.data_entrada,
    })).filter(member => member.person.name);
  }

  static mapAddress(estabelecimento) {
    if (!estabelecimento) return null;
    return {
      street: `${estabelecimento.tipo_logradouro || ''} ${estabelecimento.logradouro || ''}`.trim(),
      number: estabelecimento.numero,
      details: estabelecimento.complemento,
      district: estabelecimento.bairro,
      city: estabelecimento.cidade?.nome,
      state: estabelecimento.estado?.sigla,
      zip: estabelecimento.cep,
      country: estabelecimento.pais?.nome,
    };
  }

  static mapPhones(estabelecimento) {
    const phones = [];
    if (estabelecimento.ddd1 && estabelecimento.telefone1) {
      phones.push({ area: estabelecimento.ddd1, number: estabelecimento.telefone1, type: 'LANDLINE' });
    }
    if (estabelecimento.ddd2 && estabelecimento.telefone2) {
      phones.push({ area: estabelecimento.ddd2, number: estabelecimento.telefone2, type: 'LANDLINE' });
    }
    return phones;
  }

  static mapEmails(estabelecimento) {
    return estabelecimento.email ? [{ address: estabelecimento.email, ownership: 'CORPORATE' }] : [];
  }

  static mapActivity(activity) {
    return activity ? { id: activity.id, text: activity.descricao } : null;
  }

  static mapActivities(activities) {
    return Array.isArray(activities) ? activities.slice(0, 10).map(activity => ({ // Limitar a 10 atividades
      id: activity.id, text: activity.descricao 
    })) : [];
  }

  static mapRegistrations(inscricoes) {
    return Array.isArray(inscricoes) ? inscricoes.map(ie => ({
      type: { id: 1, text: 'Normal' }, number: ie.inscricao_estadual, state: ie.estado?.sigla, enabled: ie.ativo, status: { text: ie.ativo ? 'Ativa' : 'Inativa' }
    })) : [];
  }
}

// =============================================
// HANDLER PRINCIPAL OTIMIZADO
// =============================================
export default async function handler(req, res) {
  // Headers de segurança e CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  // OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: true, message: 'Método não permitido' });
  }

  try {
    // Rate limiting
    const clientIP = SecurityMiddleware.getClientIP(req);
    if (!SecurityMiddleware.checkRateLimit(clientIP)) {
      return res.status(429).json({
        error: true,
        message: 'Limite de requisições excedido. Tente novamente em 1 minuto.',
      });
    }

    const { cnpj } = req.query;
    if (!cnpj) {
      return res.status(400).json({ error: true, message: 'CNPJ não informado' });
    }

    // Sanitizar e validar CNPJ
    const sanitizedCNPJ = SecurityMiddleware.sanitizeCNPJ(cnpj);
    const validation = CNPJValidatorServer.validate(sanitizedCNPJ);

    if (!validation.isValid) {
      return res.status(400).json({ error: true, message: validation.error });
    }

    // Verificar cache
    const cachedData = requestCache.get(validation.cleaned);
    if (cachedData && (Date.now() - cachedData.timestamp < SECURITY_CONFIG.CACHE_TTL)) {
      return res.status(200).json({
        error: false,
        data: cachedData.data,
        cached: true,
      });
    }

    // Consultar API externa
    const apiData = await ExternalAPIClient.fetchCNPJData(validation.cleaned);
    const mappedData = DataMapper.mapToFrontendStructure(apiData);

    if (!mappedData.taxId) {
      throw new Error('Dados inválidos da API');
    }

    // Armazenar em cache
    requestCache.set(validation.cleaned, mappedData);

    return res.status(200).json({
      error: false,
      data: mappedData,
      cached: false,
    });

  } catch (error) {
    // Limpeza periódica do cache
    requestCache.cleanup();

    let statusCode = 500;
    let errorMessage = 'Erro interno do servidor';

    if (error.message.includes('Timeout')) {
      statusCode = 408;
      errorMessage = 'Timeout na consulta';
    } else if (error.message.includes('404')) {
      statusCode = 404;
      errorMessage = 'Empresa não encontrada';
    } else if (error.message.includes('429')) {
      statusCode = 429;
      errorMessage = 'API externa com limite excedido';
    }

    return res.status(statusCode).json({
      error: true,
      message: errorMessage,
    });
  }
}

// Limpeza automática a cada 5 minutos
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    requestCache.cleanup();
    
    // Limpar rate limit map antigo
    const windowStart = Date.now() - 60000;
    for (const [key, timestamp] of rateLimitMap.entries()) {
      if (timestamp < windowStart) {
        rateLimitMap.delete(key);
      }
    }
  }, 300000); // 5 minutos
}