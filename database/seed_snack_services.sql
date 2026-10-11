-- ============================================================================
-- KidMeal — Seed Data for Afternoon Snack Services (Dịch vụ Ăn xế 17h)
-- Áp dụng: TRƯỜNG MẪU GIÁO HƯỚNG DƯƠNG
-- Thực đơn đồng bộ: 10 tuần trường mầm non (08/09/2025 – 14/11/2025)
-- ============================================================================

BEGIN;

-- 1. Kỳ dịch vụ ăn xế (snack_service_periods)
INSERT INTO snack_service_periods (id, name, start_date, end_date, registration_deadline, fee_amount, status) VALUES
(1, 'Dịch vụ Ăn xế Tháng 9/2025 - Trường MG Hướng Dương (Tuần 1-3)',  '2025-09-01', '2025-09-30', '2025-08-28', 350000.00, 'CLOSED'),
(2, 'Dịch vụ Ăn xế Tháng 10/2025 - Trường MG Hướng Dương (Tuần 4-7)', '2025-10-01', '2025-10-31', '2025-09-28', 350000.00, 'CLOSED'),
(3, 'Dịch vụ Ăn xế Tháng 11/2025 - Trường MG Hướng Dương (Tuần 8-10)','2025-11-01', '2025-11-30', '2025-10-28', 350000.00, 'OPEN')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  fee_amount = EXCLUDED.fee_amount,
  status = EXCLUDED.status;

-- 2. Đăng ký ăn xế của trẻ (snack_registrations)
INSERT INTO snack_registrations (id, period_id, student_id, parent_id, status) VALUES
(1, 3, 1, 13, 'PAID'),      -- Bé Gia Huy (Mầm 1) -> Đã thanh toán
(2, 3, 2, 14, 'PENDING'),   -- Bé Phương Linh (Mầm 1) -> Chờ thanh toán
(3, 3, 6, 17, 'PAID')       -- Bé Đăng Khoa (Chồi 1) -> Đã thanh toán
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status;

-- 3. Giao dịch thanh toán VNPAY (payments)
INSERT INTO payments (id, registration_id, amount, vnpay_transaction_code, status, paid_at, raw_response) VALUES
(1, 1, 350000.00, 'VNP-HD-20251101-001', 'SUCCESS', '2025-10-29 08:30:00+07', '{"vnp_ResponseCode":"00","vnp_TransactionNo":"14598271","vnp_Amount":"35000000","vnp_BankCode":"NCB"}'),
(2, 3, 350000.00, 'VNP-HD-20251101-002', 'SUCCESS', '2025-10-29 09:15:20+07', '{"vnp_ResponseCode":"00","vnp_TransactionNo":"14598388","vnp_Amount":"35000000","vnp_BankCode":"NCB"}')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status;

COMMIT;
