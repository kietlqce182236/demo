-- Seed file for UC54 - View Snack Services (5 packages matching UI mockup)
DELETE FROM snack_services WHERE id IN (
  '55100000-0000-0000-0000-000000000001',
  '55100000-0000-0000-0000-000000000002',
  '55100000-0000-0000-0000-000000000003',
  '55100000-0000-0000-0000-000000000004',
  '55100000-0000-0000-0000-000000000005'
);

INSERT INTO snack_services (
  id, tenant_id, name, description, service_type, billing_cycle, price_per_unit, is_active, available_from, available_to
) VALUES
('55100000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Gói Năng Lượng Chiều', 'Sữa hạt Yến mạch & Bánh Tart Táo Nướng Mật Ong chất lượng tiêu chuẩn 210 kcal/trẻ, đảm bảo không chất bảo quản và đường hóa học.', 'AFTER_SCHOOL_SNACK', 'MONTHLY', 15000.00, TRUE, '2024-11-15', '2024-11-25'),
('55100000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Gói Dinh Dưỡng Cao Cấp', 'Yogurt Trái Cây & Bánh Đậu Xanh Tươi bổ sung vitamin, khoáng chất và men vi sinh giúp bé tiêu hóa tốt.', 'ORGANIC_FRUIT', 'MONTHLY', 20000.00, TRUE, '2024-11-12', '2024-11-28'),
('55100000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Gói Tiêu Chuẩn Truyền Thống', 'Chè Hạt Sen Long Nhãn & Sữa Đậu Nành tươi giữ gìn hương vị truyền thống và dinh dưỡng thanh mát.', 'AFTER_SCHOOL_SNACK', 'MONTHLY', 12000.00, TRUE, '2024-11-14', '2024-11-28'),
('55100000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Gói Chăm Sóc Đặc Biệt Bé Nhỏ', 'Pudding Ngũ Cốc Tươi & Nước Ép Lê Rơm chế biến mềm, dễ tiêu dành riêng cho lứa tuổi nhà trẻ mầm.', 'CUSTOM_NUTRITION', 'MONTHLY', 18000.00, TRUE, '2024-12-01', '2024-12-15'),
('55100000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Gói Trái Cây Tươi Mùa Thu', 'Dưa Lưới & Táo Bơm Hạt Chia bổ sung chất xơ tự nhiên và lượng nước giàu vitamin.', 'ORGANIC_FRUIT', 'MONTHLY', 10000.00, FALSE, '2024-10-01', '2024-10-20');
