/**
 * 反垃圾评论工具库
 * 提供多层防护机制，防止表单攻击和垃圾评论
 */

interface RateLimitEntry {
  count: number;
  firstRequest: number;
  lastRequest: number;
}

// 内存存储 - 生产环境建议使用 Redis
const rateLimitStore = new Map<string, RateLimitEntry>();
const ipBlockList = new Set<string>();

/**
 * 速率限制配置
 */
export const RATE_LIMIT_CONFIG = {
  // 时间窗口（毫秒）
  WINDOW_MS: 60 * 1000, // 1分钟
  // 允许的最大请求数
  MAX_REQUESTS: 3,
  // 严格模式窗口（更短时间内的限制）
  STRICT_WINDOW_MS: 10 * 1000, // 10秒
  // 严格模式下的最大请求数
  STRICT_MAX_REQUESTS: 1,
  // IP封禁时间
  BLOCK_DURATION_MS: 60 * 60 * 1000, // 1小时
  // 触发封禁的违规次数
  VIOLATIONS_TO_BLOCK: 5,
};

/**
 * 清理过期的速率限制记录
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    if (now - entry.lastRequest > RATE_LIMIT_CONFIG.WINDOW_MS * 2) {
      rateLimitStore.delete(key);
    }
  }
}

// 每5分钟清理一次
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * 检查速率限制
 * @param identifier - 标识符（IP地址或用户ID）
 * @returns 是否被限制
 */
export function checkRateLimit(identifier: string): {
  allowed: boolean;
  retryAfter?: number;
  reason?: string;
} {
  // 检查是否在封禁列表中
  if (ipBlockList.has(identifier)) {
    return {
      allowed: false,
      reason: 'IP blocked due to excessive violations',
    };
  }

  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    // 首次请求
    rateLimitStore.set(identifier, {
      count: 1,
      firstRequest: now,
      lastRequest: now,
    });
    return { allowed: true };
  }

  // 检查严格模式（10秒内多次请求）
  if (now - entry.lastRequest < RATE_LIMIT_CONFIG.STRICT_WINDOW_MS) {
    if (entry.count >= RATE_LIMIT_CONFIG.STRICT_MAX_REQUESTS) {
      return {
        allowed: false,
        retryAfter: Math.ceil(
          (RATE_LIMIT_CONFIG.STRICT_WINDOW_MS - (now - entry.lastRequest)) / 1000
        ),
        reason: 'Too many requests in a short time',
      };
    }
  }

  // 检查常规速率限制（1分钟内的请求数）
  if (now - entry.firstRequest < RATE_LIMIT_CONFIG.WINDOW_MS) {
    if (entry.count >= RATE_LIMIT_CONFIG.MAX_REQUESTS) {
      return {
        allowed: false,
        retryAfter: Math.ceil(
          (RATE_LIMIT_CONFIG.WINDOW_MS - (now - entry.firstRequest)) / 1000
        ),
        reason: 'Rate limit exceeded',
      };
    }
    // 在时间窗口内，增加计数
    entry.count++;
    entry.lastRequest = now;
  } else {
    // 时间窗口已过，重置计数
    entry.count = 1;
    entry.firstRequest = now;
    entry.lastRequest = now;
  }

  rateLimitStore.set(identifier, entry);
  return { allowed: true };
}

/**
 * 记录违规行为
 * @param identifier - 标识符
 */
export function recordViolation(identifier: string) {
  const violationKey = `violation:${identifier}`;
  const entry = rateLimitStore.get(violationKey);

  if (!entry) {
    rateLimitStore.set(violationKey, {
      count: 1,
      firstRequest: Date.now(),
      lastRequest: Date.now(),
    });
  } else {
    entry.count++;
    entry.lastRequest = Date.now();
    rateLimitStore.set(violationKey, entry);

    // 如果违规次数过多，封禁IP
    if (entry.count >= RATE_LIMIT_CONFIG.VIOLATIONS_TO_BLOCK) {
      ipBlockList.add(identifier);
      console.warn(`[Anti-Spam] Blocked IP: ${identifier}`);

      // 一段时间后自动解封
      setTimeout(() => {
        ipBlockList.delete(identifier);
        rateLimitStore.delete(violationKey);
        console.info(`[Anti-Spam] Unblocked IP: ${identifier}`);
      }, RATE_LIMIT_CONFIG.BLOCK_DURATION_MS);
    }
  }
}

/**
 * 验证 honeypot 字段
 * @param honeypotValue - honeypot 字段的值（应该为空）
 * @returns 是否通过验证
 */
export function validateHoneypot(honeypotValue: any): boolean {
  // Honeypot 字段应该为空或undefined
  return !honeypotValue || honeypotValue === '';
}

/**
 * 验证时间戳（防止表单重放攻击）
 * @param timestamp - 表单生成时的时间戳
 * @returns 验证结果
 */
export function validateTimestamp(timestamp: number): {
  valid: boolean;
  reason?: string;
} {
  const now = Date.now();
  const age = now - timestamp;

  // 表单提交太快（少于3秒）- 可能是机器人
  if (age < 3000) {
    return {
      valid: false,
      reason: 'Form submitted too quickly',
    };
  }

  // 表单太旧（超过1小时）
  if (age > 60 * 60 * 1000) {
    return {
      valid: false,
      reason: 'Form token expired',
    };
  }

  return { valid: true };
}

/**
 * 验证评论内容
 * @param content - 评论内容
 * @returns 验证结果
 */
export function validateCommentContent(content: string): {
  valid: boolean;
  reason?: string;
} {
  // 长度检查
  if (content.length < 2) {
    return {
      valid: false,
      reason: 'Comment too short',
    };
  }

  if (content.length > 5000) {
    return {
      valid: false,
      reason: 'Comment too long',
    };
  }

  // 检查是否包含过多链接（垃圾评论通常有很多链接）
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const urls = content.match(urlPattern) || [];
  if (urls.length > 3) {
    return {
      valid: false,
      reason: 'Too many links in comment',
    };
  }

  // 检查是否包含过多重复字符
  const repeatedCharsPattern = /(.)\1{10,}/;
  if (repeatedCharsPattern.test(content)) {
    return {
      valid: false,
      reason: 'Excessive repeated characters',
    };
  }

  // 检查是否全是大写字母（垃圾评论常见特征）
  const upperCaseRatio =
    (content.match(/[A-Z]/g) || []).length / content.length;
  if (content.length > 20 && upperCaseRatio > 0.7) {
    return {
      valid: false,
      reason: 'Excessive uppercase characters',
    };
  }

  // 简单的垃圾词检测
  const spamKeywords = [
    'viagra',
    'casino',
    'poker',
    'lottery',
    'click here',
    'buy now',
    'limited offer',
    '100% free',
    'make money fast',
  ];

  const lowerContent = content.toLowerCase();
  for (const keyword of spamKeywords) {
    if (lowerContent.includes(keyword)) {
      return {
        valid: false,
        reason: 'Potential spam content detected',
      };
    }
  }

  return { valid: true };
}

/**
 * 获取客户端 IP 地址
 * @param request - Next.js Request 对象
 * @returns IP 地址
 */
export function getClientIP(request: Request): string {
  // 尝试从各种 header 中获取真实 IP
  const headers = request.headers;

  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = headers.get('x-real-ip');
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // 如果都没有，返回一个默认值
  return 'unknown';
}

/**
 * 综合反垃圾检查
 * @param params - 检查参数
 * @returns 检查结果
 */
export function performAntiSpamCheck(params: {
  identifier: string;
  content: string;
  honeypot?: any;
  timestamp?: number;
}): {
  passed: boolean;
  reason?: string;
  retryAfter?: number;
} {
  const { identifier, content, honeypot, timestamp } = params;

  // 1. Honeypot 检查
  if (honeypot !== undefined && !validateHoneypot(honeypot)) {
    recordViolation(identifier);
    return {
      passed: false,
      reason: 'Spam detected',
    };
  }

  // 2. 时间戳检查
  if (timestamp) {
    const tsValidation = validateTimestamp(timestamp);
    if (!tsValidation.valid) {
      recordViolation(identifier);
      return {
        passed: false,
        reason: tsValidation.reason,
      };
    }
  }

  // 3. 速率限制检查
  const rateLimitResult = checkRateLimit(identifier);
  if (!rateLimitResult.allowed) {
    return {
      passed: false,
      reason: rateLimitResult.reason,
      retryAfter: rateLimitResult.retryAfter,
    };
  }

  // 4. 内容验证
  const contentValidation = validateCommentContent(content);
  if (!contentValidation.valid) {
    recordViolation(identifier);
    return {
      passed: false,
      reason: contentValidation.reason,
    };
  }

  return { passed: true };
}
