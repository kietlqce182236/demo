export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  database: {
    host: process.env.POSTGRES_HOST || '171.244.39.202',
    port: parseInt(process.env.POSTGRES_PORT, 10) || 5432,
    database: process.env.POSTGRES_DB || 'KidMeal',
    username: process.env.POSTGRES_USER || 'KidMeal',
    password: process.env.POSTGRES_PASSWORD || 'A5a(sSghC=~oqs£43Up',
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

  minio: {
    endpoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT, 10) || 9000,
    accessKey: process.env.MINIO_ACCESS_KEY || 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY || 'minioadmin123',
    bucket: process.env.MINIO_BUCKET || 'kidmeal-uploads',
  },

  mail: {
    host: process.env.MAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.MAIL_PORT, 10) || 587,
    secure: process.env.MAIL_SECURE === 'true',
    user: process.env.MAIL_USER || 'lamquockiet240321@gmail.com',
    pass: process.env.MAIL_PASS || 'luvzjmhyvuohzjb',
    from: process.env.MAIL_FROM || 'KidMeal <lamquockiet240321@gmail.com>',
  },
});
