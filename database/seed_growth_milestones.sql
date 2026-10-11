-- Xoa cac ban ghi cu neu co
DELETE FROM growth_zscores WHERE measurement_id IN (
  SELECT id FROM physical_measurements WHERE student_id IN (6, 7) AND measured_date IN ('2024-01-18', '2024-07-18', '2025-01-18', '2025-07-18', '2024-04-25', '2024-10-25', '2025-04-25')
);
DELETE FROM physical_measurements WHERE student_id IN (6, 7) AND measured_date IN ('2024-01-18', '2024-07-18', '2025-01-18', '2025-07-18', '2024-04-25', '2024-10-25', '2025-04-25');

-- 1. Pham Dang Khoa (id=6, DOB=2022-01-18, Male)
-- 24 thang: 2024-01-18
INSERT INTO physical_measurements (student_id, measured_date, weight_kg, height_cm) VALUES (6, '2024-01-18', 14.50, 88.5);
INSERT INTO growth_zscores (measurement_id, waz, haz, baz, classification) VALUES (currval('physical_measurements_id_seq'), 1.72, 0.20, 1.99, 'NORMAL');

-- 30 thang: 2024-07-18
INSERT INTO physical_measurements (student_id, measured_date, weight_kg, height_cm) VALUES (6, '2024-07-18', 17.50, 94.0);
INSERT INTO growth_zscores (measurement_id, waz, haz, baz, classification) VALUES (currval('physical_measurements_id_seq'), 2.70, 0.55, 3.10, 'OBESE');

-- 36 thang: 2025-01-18
INSERT INTO physical_measurements (student_id, measured_date, weight_kg, height_cm) VALUES (6, '2025-01-18', 24.00, 98.5);
INSERT INTO growth_zscores (measurement_id, waz, haz, baz, classification) VALUES (currval('physical_measurements_id_seq'), 4.50, 0.60, 5.20, 'OBESE');

-- 42 thang: 2025-07-18
INSERT INTO physical_measurements (student_id, measured_date, weight_kg, height_cm) VALUES (6, '2025-07-18', 36.00, 101.5);
INSERT INTO growth_zscores (measurement_id, waz, haz, baz, classification) VALUES (currval('physical_measurements_id_seq'), 6.00, 0.40, 6.00, 'OBESE');

-- 2. Vu Ngoc Diep (id=7, DOB=2022-04-25, Female)
-- 24 thang: 2024-04-25
INSERT INTO physical_measurements (student_id, measured_date, weight_kg, height_cm) VALUES (7, '2024-04-25', 13.50, 86.5);
INSERT INTO growth_zscores (measurement_id, waz, haz, baz, classification) VALUES (currval('physical_measurements_id_seq'), 1.45, 0.03, 1.80, 'NORMAL');

-- 30 thang: 2024-10-25
INSERT INTO physical_measurements (student_id, measured_date, weight_kg, height_cm) VALUES (7, '2024-10-25', 16.50, 91.0);
INSERT INTO growth_zscores (measurement_id, waz, haz, baz, classification) VALUES (currval('physical_measurements_id_seq'), 2.30, 0.05, 2.50, 'OVERWEIGHT');

-- 36 thang: 2025-04-25
INSERT INTO physical_measurements (student_id, measured_date, weight_kg, height_cm) VALUES (7, '2025-04-25', 23.00, 96.0);
INSERT INTO growth_zscores (measurement_id, waz, haz, baz, classification) VALUES (currval('physical_measurements_id_seq'), 4.10, 0.22, 4.60, 'OBESE');
