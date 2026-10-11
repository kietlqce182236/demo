-- ============================================================================
-- KidMeal — Seed Data for Dayboarding Meal Standards (Tiêu chuẩn Bán trú Mầm non)
-- Áp dụng: TRƯỜNG MẪU GIÁO HƯỚNG DƯƠNG
-- Đồng bộ theo Thông tư 28/2016/TT-BGDĐT và Thực đơn thực tế 10 tuần
-- ============================================================================

BEGIN;

-- Cập nhật cấu hình dịch vụ bán trú vào system_configs
INSERT INTO system_configs (config_key, config_value, description) VALUES
('SCHOOL_NAME',               'Trường Mẫu Giáo Hướng Dương',                                                               'Tên trường mẫu giáo áp dụng'),
('DAYBOARDING_MEAL_SCHEDULE', '{"MORNING_SNACK":"08:15","LUNCH":"10:45","AFTERNOON_SNACK":"14:30","LATE_SNACK":"17:00"}', 'Khung giờ phân phối 4 bữa ăn bán trú trong ngày'),
('DAYBOARDING_ENERGY_TARGET', '{"NHA_TRE":{"min":600,"max":735},"MAU_GIAO":{"min":615,"max":726}}',                         'Mục tiêu calo bán trú chuẩn Thông tư 28/2016/TT-BGDĐT'),
('DAYBOARDING_FEE_MONTHLY',   '850000',                                                                                    'Mức thu tiền ăn bán trú tiêu chuẩn hàng tháng (bữa chính trưa + phụ sáng + xế chiều)')
ON CONFLICT (config_key) DO UPDATE SET
  config_value = EXCLUDED.config_value;

COMMIT;
