-- Seed file for Dayboarding Services (Dịch vụ bán trú mầm non)
INSERT INTO snack_services (
  id, tenant_id, name, description, service_type, billing_cycle, price_per_unit, is_active, available_from, available_to
) VALUES
('66100000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Bán Trú Tiêu Chuẩn (Bữa Trưa & Ngủ Trưa)', 'Suất ăn trưa dinh dưỡng đạt chuẩn Thông tư 28/2016/TT-BGDĐT, giường nệm gối riêng biệt khử khuẩn định kỳ, giáo viên chăm sóc giấc ngủ 11h30 - 14h00.', 'DAYBOARDING_STANDARD', 'MONTHLY', 35000.00, TRUE, '2024-09-01', '2025-05-31'),
('66100000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Dịch Vụ Ăn Sáng Tại Trường', 'Bữa sáng ấm nóng chế biến tại bếp trường: Phở gà, cháo lươn, súp cua, bánh canh, nui thịt bằm và sữa tươi/sữa hạt 7h00 - 7h45.', 'BREAKFAST', 'MONTHLY', 15000.00, TRUE, '2024-09-01', '2025-05-31'),
('66100000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Gói Ăn Xế Chiều Tăng Cường (17h00)', 'Bữa phụ chiều giàu năng lượng trước giờ đón trẻ: Sữa chua trái cây, bánh tart, sữa yến mạch, chè hạt sen thanh mát.', 'AFTER_SCHOOL_SNACK', 'MONTHLY', 15000.00, TRUE, '2024-09-01', '2025-05-31'),
('66100000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Dịch Vụ Trông Trẻ Ngoài Giờ (Đón Muộn)', 'Giáo viên phụ trách trông nom, tổ chức trò chơi phát triển kỹ năng và góc đọc sách sau 17h15 đến 18h30.', 'LATE_PICKUP', 'DAILY', 20000.00, TRUE, '2024-09-01', '2025-05-31'),
('66100000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Chăm Sóc Đồ Dùng Bán Trú & Khăn Gối', 'Trang bị chăn ga gối nệm cá nhân, cốc nước riêng, giặt sấy hấp tiệt trùng và bảo dưỡng điều hòa buồng ngủ.', 'FACILITIES_CARE', 'SEMESTER', 150000.00, TRUE, '2024-09-01', '2025-05-31')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  service_type = EXCLUDED.service_type,
  billing_cycle = EXCLUDED.billing_cycle,
  price_per_unit = EXCLUDED.price_per_unit,
  is_active = EXCLUDED.is_active;
