-- ============================================================================
-- KidMeal — PostgreSQL Schema DDL (Simplified BIGSERIAL)
-- Standards: Circular 28/2016/TT-BGDĐT, Decision 1246/QĐ-BYT, WHO Child Growth
-- Target RDBMS: PostgreSQL 16
-- ============================================================================

BEGIN;

-- ============================================================================
-- Extensions (optional if available on database server)
-- DO $$ BEGIN PERFORM 1; EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- ============================================================================
-- 1. NHÓM NGƯỜI DÙNG & PHÂN QUYỀN
-- ============================================================================

-- users: Tài khoản đăng nhập chung
CREATE TABLE users (
    id              BIGSERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    full_name       VARCHAR(150) NOT NULL,
    phone           VARCHAR(20),
    avatar          VARCHAR(500),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE', 'INACTIVE', 'LOCKED')),
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);

-- roles: Vai trò hệ thống
CREATE TABLE roles (
    id   BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL
);

-- user_roles: Gán role cho user
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id BIGINT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- staff_profiles: Thông tin nhân viên
CREATE TABLE staff_profiles (
    user_id    BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    staff_type VARCHAR(50),
    position   VARCHAR(100),
    start_date DATE
);

-- parent_profiles: Thông tin phụ huynh
CREATE TABLE parent_profiles (
    user_id    BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    address    TEXT,
    occupation VARCHAR(100),
    note       TEXT
);

-- ============================================================================
-- 2. NHÓM TRƯỜNG – LỚP – HỌC SINH
-- ============================================================================

-- schools: Thông tin trường
CREATE TABLE schools (
    id             BIGSERIAL PRIMARY KEY,
    name           VARCHAR(200) NOT NULL,
    address        TEXT,
    phone          VARCHAR(20),
    email          VARCHAR(255),
    principal_name VARCHAR(150),
    logo           VARCHAR(500)
);

-- classes: Danh sách lớp
CREATE TABLE classes (
    id                  BIGSERIAL PRIMARY KEY,
    school_id           BIGINT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    name                VARCHAR(50) NOT NULL,
    age_group           VARCHAR(20) NOT NULL
                            CHECK (age_group IN ('NHA_TRE', 'MAU_GIAO')),
    school_year         VARCHAR(20) NOT NULL,
    homeroom_teacher_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                            CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX idx_classes_school_id ON classes(school_id);
CREATE INDEX idx_classes_age_group ON classes(age_group);
CREATE INDEX idx_classes_school_year ON classes(school_year);
CREATE INDEX idx_classes_teacher ON classes(homeroom_teacher_id);

-- students: Hồ sơ trẻ
CREATE TABLE students (
    id            BIGSERIAL PRIMARY KEY,
    class_id      BIGINT REFERENCES classes(id) ON DELETE SET NULL,
    student_code  VARCHAR(50) NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender        VARCHAR(10) NOT NULL
                      CHECK (gender IN ('MALE', 'FEMALE')),
    avatar        VARCHAR(500),
    status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                      CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_class_id ON students(class_id);
CREATE INDEX idx_students_code ON students(student_code);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_students_name ON students(full_name);

-- student_parents: Quan hệ phụ huynh – trẻ
CREATE TABLE student_parents (
    student_id   BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    relationship VARCHAR(20) NOT NULL
                     CHECK (relationship IN ('FATHER', 'MOTHER', 'GUARDIAN')),
    is_primary   BOOLEAN NOT NULL DEFAULT FALSE,
    PRIMARY KEY (student_id, parent_id)
);

CREATE INDEX idx_student_parents_parent ON student_parents(parent_id);

-- ============================================================================
-- 3. NHÓM DỊ ỨNG
-- ============================================================================

-- allergens: Danh mục dị ứng chuẩn
CREATE TABLE allergens (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    code        VARCHAR(30) NOT NULL UNIQUE,
    description TEXT
);

-- student_allergies: Dị ứng của từng trẻ
CREATE TABLE student_allergies (
    id          BIGSERIAL PRIMARY KEY,
    student_id  BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    allergen_id BIGINT NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
    severity    VARCHAR(20) NOT NULL DEFAULT 'MEDIUM'
                    CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    note        TEXT,
    declared_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
    declared_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_allergies_student ON student_allergies(student_id);
CREATE INDEX idx_student_allergies_allergen ON student_allergies(allergen_id);

-- ============================================================================
-- 4. NHÓM THỰC PHẨM & DINH DƯỠNG (Core)
-- ============================================================================

-- food_categories: Nhóm thực phẩm (Thịt, Cá, Rau củ…)
CREATE TABLE food_categories (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

-- food_ingredients: Nguyên liệu thô + dinh dưỡng gốc
CREATE TABLE food_ingredients (
    id                  BIGSERIAL PRIMARY KEY,
    category_id         BIGINT REFERENCES food_categories(id) ON DELETE SET NULL,
    name                VARCHAR(150) NOT NULL,
    unit                VARCHAR(20) NOT NULL DEFAULT 'g',
    energy_kcal_100g    NUMERIC(8,2) NOT NULL DEFAULT 0,
    protein_g           NUMERIC(8,2) NOT NULL DEFAULT 0,
    fat_g               NUMERIC(8,2) NOT NULL DEFAULT 0,
    carb_g              NUMERIC(8,2) NOT NULL DEFAULT 0,
    fiber_g             NUMERIC(8,2) NOT NULL DEFAULT 0,
    calcium_mg          NUMERIC(8,2) NOT NULL DEFAULT 0,
    iron_mg             NUMERIC(8,2) NOT NULL DEFAULT 0,
    zinc_mg             NUMERIC(8,2) NOT NULL DEFAULT 0,
    phosphorus_mg       NUMERIC(8,2) NOT NULL DEFAULT 0,
    sodium_mg           NUMERIC(8,2) NOT NULL DEFAULT 0,
    vitamin_a_mcg       NUMERIC(8,2) NOT NULL DEFAULT 0,
    vitamin_c_mg        NUMERIC(8,2) NOT NULL DEFAULT 0,
    refuse_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 0
                            CHECK (refuse_rate_percent >= 0 AND refuse_rate_percent <= 100),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                            CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX idx_food_ingredients_category ON food_ingredients(category_id);
CREATE INDEX idx_food_ingredients_name ON food_ingredients(name);
CREATE INDEX idx_food_ingredients_status ON food_ingredients(status);

-- dish_categories: Phân loại món (Món chính, Canh, Tráng miệng, Xế…)
CREATE TABLE dish_categories (
    id                  BIGSERIAL PRIMARY KEY,
    code                VARCHAR(30) NOT NULL UNIQUE,
    name                VARCHAR(100) NOT NULL,
    display_order       INT NOT NULL DEFAULT 0,
    is_required_in_meal BOOLEAN NOT NULL DEFAULT FALSE,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                            CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

-- dishes: Món ăn
CREATE TABLE dishes (
    id                      BIGSERIAL PRIMARY KEY,
    category_id             BIGINT REFERENCES dish_categories(id) ON DELETE SET NULL,
    name                    VARCHAR(150) NOT NULL,
    description             TEXT,
    standard_serving_size_g NUMERIC(8,2) NOT NULL DEFAULT 100,
    status                  VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                                CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX idx_dishes_category ON dishes(category_id);
CREATE INDEX idx_dishes_name ON dishes(name);
CREATE INDEX idx_dishes_status ON dishes(status);

-- dish_recipes: Công thức món (gross/net weight)
CREATE TABLE dish_recipes (
    id            BIGSERIAL PRIMARY KEY,
    dish_id       BIGINT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    ingredient_id BIGINT NOT NULL REFERENCES food_ingredients(id) ON DELETE CASCADE,
    gross_weight_g NUMERIC(8,2) NOT NULL DEFAULT 0,
    net_weight_g   NUMERIC(8,2) NOT NULL DEFAULT 0,
    note          TEXT,
    CONSTRAINT uq_dish_recipes_dish_ingredient UNIQUE (dish_id, ingredient_id)
);

CREATE INDEX idx_dish_recipes_dish ON dish_recipes(dish_id);
CREATE INDEX idx_dish_recipes_ingredient ON dish_recipes(ingredient_id);

-- dish_nutrition: Dinh dưỡng đã cache của 1 suất chuẩn
CREATE TABLE dish_nutrition (
    dish_id     BIGINT PRIMARY KEY REFERENCES dishes(id) ON DELETE CASCADE,
    energy_kcal NUMERIC(8,2) NOT NULL DEFAULT 0,
    protein_g   NUMERIC(8,2) NOT NULL DEFAULT 0,
    fat_g       NUMERIC(8,2) NOT NULL DEFAULT 0,
    carb_g      NUMERIC(8,2) NOT NULL DEFAULT 0,
    fiber_g     NUMERIC(8,2) NOT NULL DEFAULT 0,
    calcium_mg  NUMERIC(8,2) NOT NULL DEFAULT 0,
    iron_mg     NUMERIC(8,2) NOT NULL DEFAULT 0,
    zinc_mg     NUMERIC(8,2) NOT NULL DEFAULT 0
);

-- dish_allergens: Liên kết món ăn với các chất gây dị ứng (SEAFOOD, EGG, MILK, SOY, PEANUT...)
CREATE TABLE dish_allergens (
    dish_id      BIGINT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    allergen_id  BIGINT NOT NULL REFERENCES allergens(id) ON DELETE CASCADE,
    risk_level   VARCHAR(20) NOT NULL DEFAULT 'HIGH'
                    CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    note         VARCHAR(255),
    PRIMARY KEY (dish_id, allergen_id)
);

CREATE INDEX idx_dish_allergens_dish ON dish_allergens(dish_id);
CREATE INDEX idx_dish_allergens_allergen ON dish_allergens(allergen_id);

-- nutrition_conversion_factors: Hệ số chuyển đổi 4-9-4 (Protein/Fat/Carb…)
CREATE TABLE nutrition_conversion_factors (
    id            BIGSERIAL PRIMARY KEY,
    nutrient_code VARCHAR(20) NOT NULL UNIQUE,
    kcal_per_gram NUMERIC(5,2) NOT NULL,
    description   TEXT,
    is_active     BOOLEAN NOT NULL DEFAULT TRUE
);

-- nutritional_standards: Chuẩn dinh dưỡng theo nhóm tuổi & mức Kcal ngày
CREATE TABLE nutritional_standards (
    id              BIGSERIAL PRIMARY KEY,
    age_group       VARCHAR(20) NOT NULL
                        CHECK (age_group IN ('NHA_TRE', 'MAU_GIAO')),
    meal_scope      VARCHAR(20) NOT NULL
                        CHECK (meal_scope IN ('FULL_DAY', 'DAYBOARDING', 'ALL_DAY', 'LUNCH_ONLY')),
    min_energy_kcal NUMERIC(6,1) NOT NULL DEFAULT 0,
    max_energy_kcal NUMERIC(6,1) NOT NULL DEFAULT 0,
    min_protein_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    max_protein_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
    min_fat_pct     NUMERIC(5,2) NOT NULL DEFAULT 0,
    max_fat_pct     NUMERIC(5,2) NOT NULL DEFAULT 0,
    min_carb_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
    max_carb_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
    min_calcium_mg  NUMERIC(8,2) NOT NULL DEFAULT 0,
    min_iron_mg     NUMERIC(8,2) NOT NULL DEFAULT 0,
    min_zinc_mg     NUMERIC(8,2) NOT NULL DEFAULT 0,
    max_sodium_mg   NUMERIC(8,2) NOT NULL DEFAULT 0,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                        CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX idx_nutritional_standards_age ON nutritional_standards(age_group);

-- nutrition_rule_codes: Mã quy tắc cảnh báo
CREATE TABLE nutrition_rule_codes (
    id          BIGSERIAL PRIMARY KEY,
    code        VARCHAR(50) NOT NULL UNIQUE,
    severity    VARCHAR(20) NOT NULL DEFAULT 'WARNING'
                    CHECK (severity IN ('INFO', 'WARNING', 'ERROR')),
    description TEXT
);

-- ============================================================================
-- 5. NHÓM THỰC ĐƠN
-- ============================================================================

-- menu_cycles: Chu kỳ thực đơn (ví dụ 4 tuần liên tiếp)
CREATE TABLE menu_cycles (
    id                 BIGSERIAL PRIMARY KEY,
    name               VARCHAR(100) NOT NULL,
    age_group          VARCHAR(20) NOT NULL
                           CHECK (age_group IN ('NHA_TRE', 'MAU_GIAO')),
    start_date         DATE NOT NULL,
    end_date           DATE NOT NULL,
    cycle_length_weeks INT NOT NULL DEFAULT 4,
    status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
                           CHECK (status IN ('ACTIVE', 'CLOSED')),
    CONSTRAINT chk_menu_cycles_dates CHECK (end_date >= start_date)
);

-- menus: Thực đơn tuần
CREATE TABLE menus (
    id              BIGSERIAL PRIMARY KEY,
    cycle_id        BIGINT REFERENCES menu_cycles(id) ON DELETE SET NULL,
    week_start_date DATE NOT NULL,
    week_end_date   DATE NOT NULL,
    age_group       VARCHAR(20) NOT NULL
                        CHECK (age_group IN ('NHA_TRE', 'MAU_GIAO')),
    title           VARCHAR(200) NOT NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'DRAFT'
                        CHECK (status IN ('DRAFT', 'PENDING', 'APPROVED', 'PUBLISHED', 'REJECTED')),
    created_by      BIGINT REFERENCES users(id) ON DELETE SET NULL,
    approved_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    approved_at     TIMESTAMPTZ,
    CONSTRAINT chk_menus_dates CHECK (week_end_date >= week_start_date)
);

CREATE INDEX idx_menus_cycle ON menus(cycle_id);
CREATE INDEX idx_menus_status ON menus(status);
CREATE INDEX idx_menus_age_group ON menus(age_group);
CREATE INDEX idx_menus_dates ON menus(week_start_date, week_end_date);

-- menu_versions: Phiên bản thực đơn (hỗ trợ điều chỉnh)
CREATE TABLE menu_versions (
    id             BIGSERIAL PRIMARY KEY,
    menu_id        BIGINT NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    version_number INT NOT NULL DEFAULT 1,
    change_note    TEXT,
    created_by     BIGINT REFERENCES users(id) ON DELETE SET NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_versions_menu ON menu_versions(menu_id);

-- menu_days: Thực đơn theo ngày
CREATE TABLE menu_days (
    id              BIGSERIAL PRIMARY KEY,
    menu_version_id BIGINT NOT NULL REFERENCES menu_versions(id) ON DELETE CASCADE,
    day_of_week     INT NOT NULL CHECK (day_of_week BETWEEN 2 AND 6),
    date            DATE NOT NULL
);

CREATE INDEX idx_menu_days_version ON menu_days(menu_version_id);

-- menu_meals: Các bữa trong ngày
CREATE TABLE menu_meals (
    id          BIGSERIAL PRIMARY KEY,
    menu_day_id BIGINT NOT NULL REFERENCES menu_days(id) ON DELETE CASCADE,
    meal_type   VARCHAR(30) NOT NULL
                    CHECK (meal_type IN ('MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK'))
);

CREATE INDEX idx_menu_meals_day ON menu_meals(menu_day_id);

-- menu_dishes: Món trong từng bữa
CREATE TABLE menu_dishes (
    id             BIGSERIAL PRIMARY KEY,
    menu_meal_id   BIGINT NOT NULL REFERENCES menu_meals(id) ON DELETE CASCADE,
    dish_id        BIGINT NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    portion_size_g NUMERIC(8,2),
    display_order  INT NOT NULL DEFAULT 0,
    special_diet_notes TEXT
);

CREATE INDEX idx_menu_dishes_meal ON menu_dishes(menu_meal_id);
CREATE INDEX idx_menu_dishes_dish ON menu_dishes(dish_id);

-- menu_rule_violations: Lịch sử vi phạm khi thẩm định
CREATE TABLE menu_rule_violations (
    id              BIGSERIAL PRIMARY KEY,
    menu_version_id BIGINT NOT NULL REFERENCES menu_versions(id) ON DELETE CASCADE,
    rule_code       VARCHAR(50) NOT NULL,
    severity        VARCHAR(20) NOT NULL DEFAULT 'WARNING'
                        CHECK (severity IN ('INFO', 'WARNING', 'ERROR')),
    message         TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_menu_rule_violations_version ON menu_rule_violations(menu_version_id);

-- ============================================================================
-- 6. NHÓM DỊCH VỤ ĂN XẾ
-- ============================================================================

-- snack_service_periods: Kỳ đăng ký dịch vụ ăn xế
CREATE TABLE snack_service_periods (
    id                    BIGSERIAL PRIMARY KEY,
    name                  VARCHAR(100) NOT NULL,
    start_date            DATE NOT NULL,
    end_date              DATE NOT NULL,
    registration_deadline DATE,
    fee_amount            NUMERIC(12,2) NOT NULL DEFAULT 0,
    status                VARCHAR(20) NOT NULL DEFAULT 'OPEN'
                              CHECK (status IN ('OPEN', 'CLOSED')),
    CONSTRAINT chk_snack_period_dates CHECK (end_date >= start_date)
);

-- snack_registrations: Đăng ký của trẻ
CREATE TABLE snack_registrations (
    id            BIGSERIAL PRIMARY KEY,
    period_id     BIGINT NOT NULL REFERENCES snack_service_periods(id) ON DELETE CASCADE,
    student_id    BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    parent_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status        VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                      CHECK (status IN ('PENDING', 'PAID', 'CANCELLED')),
    registered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_snack_reg_period ON snack_registrations(period_id);
CREATE INDEX idx_snack_reg_student ON snack_registrations(student_id);
CREATE INDEX idx_snack_reg_parent ON snack_registrations(parent_id);
CREATE INDEX idx_snack_reg_status ON snack_registrations(status);

-- payments: Thanh toán (VNPAY…)
CREATE TABLE payments (
    id                     BIGSERIAL PRIMARY KEY,
    registration_id        BIGINT REFERENCES snack_registrations(id) ON DELETE SET NULL,
    amount                 NUMERIC(12,2) NOT NULL,
    vnpay_transaction_code VARCHAR(100),
    status                 VARCHAR(20) NOT NULL DEFAULT 'PENDING'
                               CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED')),
    paid_at                TIMESTAMPTZ,
    raw_response           TEXT
);

CREATE INDEX idx_payments_registration ON payments(registration_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_vnpay_code ON payments(vnpay_transaction_code);

-- snack_daily_rosters: Danh sách suất xế theo ngày
CREATE TABLE snack_daily_rosters (
    id              BIGSERIAL PRIMARY KEY,
    date            DATE NOT NULL,
    student_id      BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    registration_id BIGINT REFERENCES snack_registrations(id) ON DELETE SET NULL,
    status          VARCHAR(20) NOT NULL DEFAULT 'PLANNED'
                        CHECK (status IN ('PLANNED', 'SERVED', 'ABSENT', 'CANCELLED'))
);

CREATE INDEX idx_snack_roster_date ON snack_daily_rosters(date);
CREATE INDEX idx_snack_roster_student ON snack_daily_rosters(student_id);

-- ============================================================================
-- 7. NHÓM VẬN HÀNH HÀNG NGÀY
-- ============================================================================

-- daily_meal_portions: Số suất cần chuẩn bị
CREATE TABLE daily_meal_portions (
    id               BIGSERIAL PRIMARY KEY,
    date             DATE NOT NULL,
    class_id         BIGINT NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    meal_type        VARCHAR(30) NOT NULL
                         CHECK (meal_type IN ('MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK')),
    planned_quantity INT NOT NULL DEFAULT 0,
    actual_quantity  INT,
    note             TEXT
);

CREATE INDEX idx_daily_portions_date ON daily_meal_portions(date);
CREATE INDEX idx_daily_portions_class ON daily_meal_portions(class_id);

-- meal_attendances: Điểm danh + đánh giá mức độ ăn
CREATE TABLE meal_attendances (
    id                BIGSERIAL PRIMARY KEY,
    student_id        BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    date              DATE NOT NULL,
    meal_type         VARCHAR(30) NOT NULL
                          CHECK (meal_type IN ('MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK')),
    is_attended       BOOLEAN NOT NULL DEFAULT TRUE,
    consumption_level VARCHAR(20)
                          CHECK (consumption_level IN ('FULL', 'PARTIAL', 'NONE')),
    note              TEXT,
    recorded_by       BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_meal_att_student ON meal_attendances(student_id);
CREATE INDEX idx_meal_att_date ON meal_attendances(date);
CREATE UNIQUE INDEX idx_meal_att_unique ON meal_attendances(student_id, date, meal_type);

-- meal_notes: Ghi chú phối hợp giữa các bên
CREATE TABLE meal_notes (
    id           BIGSERIAL PRIMARY KEY,
    date         DATE NOT NULL,
    from_user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content      TEXT NOT NULL,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_meal_notes_date ON meal_notes(date);
CREATE INDEX idx_meal_notes_user ON meal_notes(from_user_id);

-- ============================================================================
-- 8. NHÓM AN TOÀN THỰC PHẨM
-- ============================================================================

-- food_inspections: Kiểm tra 3 bước
CREATE TABLE food_inspections (
    id              BIGSERIAL PRIMARY KEY,
    date            DATE NOT NULL,
    inspection_step VARCHAR(50) NOT NULL
                        CHECK (inspection_step IN (
                            'STEP_1_RAW_CHECK',
                            'STEP_2_PROCESSING_CHECK',
                            'STEP_3_PRE_SERVING_CHECK'
                        )),
    inspector_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    result          VARCHAR(20) NOT NULL DEFAULT 'PASS'
                        CHECK (result IN ('PASS', 'FAIL')),
    meal_session    VARCHAR(50) DEFAULT 'LUNCH',
    session_code    VARCHAR(50),
    note            TEXT
);

CREATE INDEX idx_food_inspections_date ON food_inspections(date);
CREATE INDEX idx_food_inspections_inspector ON food_inspections(inspector_id);

-- inspection_images: Ảnh minh chứng kiểm tra
CREATE TABLE inspection_images (
    id            BIGSERIAL PRIMARY KEY,
    inspection_id BIGINT NOT NULL REFERENCES food_inspections(id) ON DELETE CASCADE,
    image_url     TEXT NOT NULL,
    uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_inspection_images_inspection ON inspection_images(inspection_id);

-- food_samples: Lưu mẫu 24 giờ (QĐ 1246/QĐ-BYT)
CREATE TABLE food_samples (
    id              BIGSERIAL PRIMARY KEY,
    date            DATE NOT NULL,
    dish_name       VARCHAR(150) NOT NULL,
    sample_code     VARCHAR(50) NOT NULL,
    stored_at       TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dispose_at      TIMESTAMPTZ,
    status          VARCHAR(20) NOT NULL DEFAULT 'STORED'
                        CHECK (status IN ('STORED', 'DISPOSED')),
    fridge_unit     VARCHAR(100) DEFAULT 'Tủ lưu mẫu số 1 (Ngăn mát 0-5°C)',
    sample_weight_g NUMERIC(6,1) DEFAULT 150.0,
    storage_temp    NUMERIC(4,1) DEFAULT 3.8,
    collector_name  VARCHAR(100) DEFAULT 'Nguyễn Văn Cường (Bếp trưởng)',
    note            TEXT
);

CREATE INDEX idx_food_samples_date ON food_samples(date);
CREATE INDEX idx_food_samples_status ON food_samples(status);
CREATE INDEX idx_food_samples_code ON food_samples(sample_code);

-- ============================================================================
-- 9. NHÓM TĂNG TRƯỞNG & PHẢN HỒI
-- ============================================================================

-- physical_measurements: Chiều cao – cân nặng
CREATE TABLE physical_measurements (
    id            BIGSERIAL PRIMARY KEY,
    student_id    BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    measured_date DATE NOT NULL,
    height_cm     NUMERIC(5,1) NOT NULL,
    weight_kg     NUMERIC(5,2) NOT NULL,
    measured_by   BIGINT REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_measurements_student ON physical_measurements(student_id);
CREATE INDEX idx_measurements_date ON physical_measurements(measured_date);
CREATE UNIQUE INDEX idx_measurements_unique ON physical_measurements(student_id, measured_date);

-- growth_zscores: Chỉ số Z-score (WHO)
CREATE TABLE growth_zscores (
    id               BIGSERIAL PRIMARY KEY,
    measurement_id   BIGINT NOT NULL REFERENCES physical_measurements(id) ON DELETE CASCADE,
    waz              NUMERIC(5,2),
    haz              NUMERIC(5,2),
    baz              NUMERIC(5,2),
    classification   VARCHAR(30) NOT NULL DEFAULT 'NORMAL'
                         CHECK (classification IN (
                             'NORMAL', 'UNDERWEIGHT', 'OVERWEIGHT', 'OBESE', 'STUNTED'
                         ))
);

CREATE INDEX idx_zscores_measurement ON growth_zscores(measurement_id);
CREATE INDEX idx_zscores_classification ON growth_zscores(classification);

-- parent_evaluations: Đánh giá của phụ huynh
CREATE TABLE parent_evaluations (
    id         BIGSERIAL PRIMARY KEY,
    student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    menu_id    BIGINT REFERENCES menus(id) ON DELETE SET NULL,
    rating     INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment    TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parent_eval_student ON parent_evaluations(student_id);
CREATE INDEX idx_parent_eval_menu ON parent_evaluations(menu_id);

-- evaluation_replies: Phản hồi của nhà trường
CREATE TABLE evaluation_replies (
    id            BIGSERIAL PRIMARY KEY,
    evaluation_id BIGINT NOT NULL REFERENCES parent_evaluations(id) ON DELETE CASCADE,
    replied_by    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content       TEXT NOT NULL,
    replied_at    TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_eval_replies_evaluation ON evaluation_replies(evaluation_id);

-- ============================================================================
-- 10. NHÓM HỖ TRỢ HỆ THỐNG
-- ============================================================================

-- notifications: Thông báo (dị ứng, tăng trưởng, thanh toán…)
CREATE TABLE notifications (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(200) NOT NULL,
    content    TEXT,
    type       VARCHAR(50),
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- system_configs: Cấu hình hệ thống
CREATE TABLE system_configs (
    id           BIGSERIAL PRIMARY KEY,
    config_key   VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT,
    description  TEXT
);

-- ============================================================================
-- WHO Child Growth Reference LMS Lookup Table (hệ thống dùng chung)
-- ============================================================================
CREATE TABLE who_growth_standards (
    id             BIGSERIAL PRIMARY KEY,
    indicator      VARCHAR(10) NOT NULL CHECK (indicator IN ('WAZ', 'HAZ', 'BAZ', 'WHZ')),
    gender         VARCHAR(10) NOT NULL CHECK (gender IN ('MALE', 'FEMALE')),
    age_in_months  INT NOT NULL CHECK (age_in_months BETWEEN 0 AND 84),
    l_value        NUMERIC(8,4) NOT NULL,
    m_value        NUMERIC(8,4) NOT NULL,
    s_value        NUMERIC(8,4) NOT NULL,
    sd3_neg        NUMERIC(8,2) NOT NULL,
    sd2_neg        NUMERIC(8,2) NOT NULL,
    sd1_neg        NUMERIC(8,2) NOT NULL,
    sd0            NUMERIC(8,2) NOT NULL,
    sd1_pos        NUMERIC(8,2) NOT NULL,
    sd2_pos        NUMERIC(8,2) NOT NULL,
    sd3_pos        NUMERIC(8,2) NOT NULL,
    CONSTRAINT uq_who_standards UNIQUE (indicator, gender, age_in_months)
);

CREATE INDEX idx_who_standards_lookup ON who_growth_standards(indicator, gender, age_in_months);

-- ============================================================================
-- TRIGGER: Auto-recalculate dish_nutrition khi dish_recipes thay đổi
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_dish_nutrition()
RETURNS TRIGGER AS $$
DECLARE
    target_dish_id BIGINT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_dish_id := OLD.dish_id;
    ELSE
        target_dish_id := NEW.dish_id;
    END IF;

    INSERT INTO dish_nutrition (dish_id, energy_kcal, protein_g, fat_g, carb_g, fiber_g, calcium_mg, iron_mg, zinc_mg)
    SELECT
        target_dish_id,
        COALESCE(ROUND(SUM((fi.energy_kcal_100g * dr.net_weight_g) / 100.0), 2), 0),
        COALESCE(ROUND(SUM((fi.protein_g         * dr.net_weight_g) / 100.0), 2), 0),
        COALESCE(ROUND(SUM((fi.fat_g             * dr.net_weight_g) / 100.0), 2), 0),
        COALESCE(ROUND(SUM((fi.carb_g            * dr.net_weight_g) / 100.0), 2), 0),
        COALESCE(ROUND(SUM((fi.fiber_g           * dr.net_weight_g) / 100.0), 2), 0),
        COALESCE(ROUND(SUM((fi.calcium_mg        * dr.net_weight_g) / 100.0), 2), 0),
        COALESCE(ROUND(SUM((fi.iron_mg           * dr.net_weight_g) / 100.0), 2), 0),
        COALESCE(ROUND(SUM((fi.zinc_mg           * dr.net_weight_g) / 100.0), 2), 0)
    FROM dish_recipes dr
    JOIN food_ingredients fi ON dr.ingredient_id = fi.id
    WHERE dr.dish_id = target_dish_id
    ON CONFLICT (dish_id) DO UPDATE SET
        energy_kcal = EXCLUDED.energy_kcal,
        protein_g   = EXCLUDED.protein_g,
        fat_g       = EXCLUDED.fat_g,
        carb_g      = EXCLUDED.carb_g,
        fiber_g     = EXCLUDED.fiber_g,
        calcium_mg  = EXCLUDED.calcium_mg,
        iron_mg     = EXCLUDED.iron_mg,
        zinc_mg     = EXCLUDED.zinc_mg;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalculate_dish_nutrition
AFTER INSERT OR UPDATE OR DELETE ON dish_recipes
FOR EACH ROW EXECUTE FUNCTION recalculate_dish_nutrition();

-- ============================================================================
-- SEED: Default roles
-- ============================================================================

INSERT INTO roles (code, name) VALUES
    ('SCHOOL_MANAGER', 'Ban Giám hiệu'),
    ('NUTRITIONIST',   'Chuyên viên Dinh dưỡng'),
    ('TEACHER',        'Giáo viên'),
    ('KITCHEN_STAFF',  'Nhân viên Bếp'),
    ('PARENT',         'Phụ huynh');

-- ============================================================================
-- SEED: Default allergens
-- ============================================================================

INSERT INTO allergens (code, name, description) VALUES
    ('MILK',       'Sữa bò',       'Dị ứng protein sữa bò'),
    ('EGG',        'Trứng',        'Dị ứng trứng gà / vịt'),
    ('PEANUT',     'Đậu phộng',    'Dị ứng đậu phộng'),
    ('TREE_NUT',   'Hạt cây',      'Dị ứng hạt cây (hạnh nhân, điều, óc chó…)'),
    ('SEAFOOD',    'Hải sản',      'Dị ứng tôm, cua, cá…'),
    ('WHEAT',      'Lúa mì',       'Dị ứng gluten / lúa mì'),
    ('SOY',        'Đậu nành',     'Dị ứng đậu nành'),
    ('SESAME',     'Mè (vừng)',    'Dị ứng mè');

-- ============================================================================
-- SEED: Default dish categories
-- ============================================================================

INSERT INTO dish_categories (code, name, display_order, is_required_in_meal) VALUES
    ('MAIN',            'Món chính',      1, TRUE),
    ('SOUP',            'Canh / Súp',     2, TRUE),
    ('RICE',            'Cơm / Cháo',    3, TRUE),
    ('SIDE',            'Món phụ',        4, FALSE),
    ('DESSERT',         'Tráng miệng',   5, FALSE),
    ('SNACK_MORNING',   'Xế sáng',       6, FALSE),
    ('SNACK_AFTERNOON', 'Xế chiều',      7, FALSE),
    ('DRINK',           'Thức uống',      8, FALSE);

-- ============================================================================
-- SEED: Default nutrition conversion factors (4-9-4)
-- ============================================================================

INSERT INTO nutrition_conversion_factors (nutrient_code, kcal_per_gram, description) VALUES
    ('PROTEIN', 4.00, 'Đạm: 1g = 4 kcal'),
    ('FAT',     9.00, 'Béo: 1g = 9 kcal'),
    ('CARB',    4.00, 'Bột đường: 1g = 4 kcal');

-- ============================================================================
-- SEED: Default nutrition rule codes
-- ============================================================================

INSERT INTO nutrition_rule_codes (code, severity, description) VALUES
    ('CALORIE_DEFICIT',       'ERROR',   'Thiếu năng lượng so với chuẩn'),
    ('CALORIE_EXCESS',        'WARNING', 'Vượt năng lượng cho phép'),
    ('PROTEIN_OUT_OF_RANGE',  'WARNING', 'Tỷ lệ đạm ngoài khoảng cho phép'),
    ('FAT_OUT_OF_RANGE',      'WARNING', 'Tỷ lệ béo ngoài khoảng cho phép'),
    ('CARB_OUT_OF_RANGE',     'WARNING', 'Tỷ lệ bột đường ngoài khoảng cho phép'),
    ('CALCIUM_DEFICIT',       'WARNING', 'Thiếu canxi'),
    ('IRON_DEFICIT',          'WARNING', 'Thiếu sắt'),
    ('REPEAT_DISH_IN_4_WEEKS','INFO',    'Trùng món trong chu kỳ 4 tuần'),
    ('ALLERGEN_CONFLICT',     'ERROR',   'Xung đột dị ứng phát hiện');

-- ============================================================================
-- 11. NHÓM ĐA NGÔN NGỮ (I18N / LOCALIZATION)
-- ============================================================================

-- languages: Danh sách ngôn ngữ hệ thống hỗ trợ
CREATE TABLE languages (
    id              BIGSERIAL PRIMARY KEY,
    code            VARCHAR(10) NOT NULL UNIQUE,          -- ISO 639-1 (vi, en, ja, ko…)
    name_native     VARCHAR(100) NOT NULL,                -- Tên ngôn ngữ bằng chính ngôn ngữ đó
    name_english    VARCHAR(100) NOT NULL,                -- Tên tiếng Anh
    flag_icon       VARCHAR(10),                          -- Emoji cờ quốc gia (🇻🇳, 🇬🇧…)
    direction       VARCHAR(3) NOT NULL DEFAULT 'LTR'     -- LTR (Left-to-Right) hoặc RTL
                        CHECK (direction IN ('LTR', 'RTL')),
    is_default      BOOLEAN NOT NULL DEFAULT FALSE,       -- Ngôn ngữ mặc định hệ thống
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,        -- Có đang bật không
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_languages_code ON languages(code);
CREATE INDEX idx_languages_active ON languages(is_active);

-- ui_translations: Bản dịch các key UI (tùy chọn mở rộng sau)
CREATE TABLE ui_translations (
    id              BIGSERIAL PRIMARY KEY,
    language_id     BIGINT NOT NULL REFERENCES languages(id) ON DELETE CASCADE,
    namespace       VARCHAR(50) NOT NULL DEFAULT 'common', -- Nhóm key (common, menu, auth, growth…)
    translation_key VARCHAR(255) NOT NULL,                  -- Key dịch (e.g. 'btn.save', 'label.student_name')
    translation_value TEXT NOT NULL,                        -- Giá trị đã dịch
    created_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_translation_lang_ns_key UNIQUE (language_id, namespace, translation_key)
);

CREATE INDEX idx_ui_translations_lang ON ui_translations(language_id);
CREATE INDEX idx_ui_translations_key ON ui_translations(translation_key);

COMMIT;
