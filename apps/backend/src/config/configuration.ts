export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  database: {
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5433,
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'kidsnutrijournal_dev',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || 'RedisSecureToken2026!',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'super-secret-jwt-signing-key-minimum-32-chars-kidsnutri-2026',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-jwt-key-minimum-32-chars-nutri-2026',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  vnpay: {
    tmnCode: process.env.VNPAY_TMN_CODE || 'SANDBOX01TMN',
    hashSecret: process.env.VNPAY_HASH_SECRET || 'SECRETSECRETSECRETSECRETSECRET123',
    url: process.env.VNPAY_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    returnUrl: process.env.VNPAY_RETURN_URL || 'http://localhost:5173/payments/vnpay-return',
  },
  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT, 10) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER || 'lamquockiet240321@gmail.com',
    pass: process.env.MAIL_PASS || 'luvzjmhyvuohzjb',
    from: process.env.MAIL_FROM || '"KidMeal - Hệ thống Quản trị Bán trú Mầm non" <lamquockiet240321@gmail.com>',
  },
});
