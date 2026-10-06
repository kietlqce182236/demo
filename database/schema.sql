-- ============================================================================
-- KidsNutriJournal — Multi-Tenant PostgreSQL Schema DDL (Production Grade)
-- Standards: Circular 28/2016/TT-BGDĐT, Decision 1246/QĐ-BYT, WHO Child Growth
-- Normalization: Third Normal Form (3NF) with Native Row-Level Security (RLS)
-- Target RDBMS: PostgreSQL 15+ / 16
-- ============================================================================

BEGIN;

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- 2. COMMON TRIGGER FOR AUTO-UPDATING updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. HELPER FUNCTIONS FOR RLS SESSION RESOLUTION
CREATE OR REPLACE FUNCTION get_current_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', true), '')::UUID;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION is_current_super_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(NULLIF(current_setting('app.is_super_admin', true), '') = 'true', false);
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- MODULE 1: SYSTEM & RBAC
-- ============================================================================

CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NULL,
    contact_email VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL')),
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'STANDARD' 
        CHECK (subscription_tier IN ('FREE', 'STANDARD', 'PREMIUM', 'ENTERPRISE')),
    max_children INT NOT NULL DEFAULT 500 CHECK (max_children > 0),
    settings JSONB NOT NULL DEFAULT '{
        "meal_times": ["BREAKFAST", "LUNCH", "AFTERNOON_SNACK"],
        "standard_weekly_cycle_length": 4,
        "food_retention_hours": 24,
        "who_zscore_auto_calc": true
    }'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_tenants_code UNIQUE (code),
    CONSTRAINT uq_tenants_domain UNIQUE (domain)
);

CREATE INDEX idx_tenants_status ON tenants(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_tenants_settings_gin ON tenants USING gin (settings);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NULL,
    avatar_url TEXT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'INACTIVE', 'BLOCKED', 'INVITED')),
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret VARCHAR(255) NULL,
    two_factor_recovery_codes TEXT[] NULL,
    last_login_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_users_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_tenant_status ON users(tenant_id, status) WHERE deleted_at IS NULL;

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_roles_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX idx_roles_tenant_id ON roles(tenant_id);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    module VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_permissions_module ON permissions(module);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_perm_id ON role_permissions(permission_id);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_tenant_user ON user_roles(tenant_id, user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    family_id UUID NOT NULL DEFAULT gen_random_uuid(),
    is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
    expires_at TIMESTAMPTZ NOT NULL,
    device_info TEXT NULL,
    ip_address VARCHAR(45) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_refresh_tokens_tenant ON refresh_tokens(tenant_id);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_family ON refresh_tokens(family_id);
CREATE INDEX idx_refresh_tokens_hash ON refresh_tokens(token_hash);

CREATE TABLE classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) NOT NULL CHECK (grade_level IN (
        'INFANT_0_1Y', 'TODDLER_1_2Y', 'TODDLER_2_3Y', 
        'KINDERGARTEN_3_4Y', 'KINDERGARTEN_4_5Y', 'KINDERGARTEN_5_6Y'
    )),
    academic_year VARCHAR(20) NOT NULL,
    room_number VARCHAR(50) NULL,
    main_teacher_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_classes_tenant_name_year UNIQUE (tenant_id, name, academic_year)
);

CREATE INDEX idx_classes_tenant_id ON classes(tenant_id);
CREATE INDEX idx_classes_tenant_grade ON classes(tenant_id, grade_level);
CREATE INDEX idx_classes_tenant_status ON classes(tenant_id, status);
CREATE INDEX idx_classes_main_teacher ON classes(main_teacher_id);

-- ============================================================================
-- MODULE 2: CHILD PROFILES & INDIVIDUAL ALLERGIES
-- ============================================================================

CREATE TABLE allergen_catalogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name_vi VARCHAR(150) NOT NULL,
    name_en VARCHAR(150) NOT NULL,
    common_foods TEXT NULL,
    description TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE children (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    class_id UUID NULL REFERENCES classes(id) ON DELETE SET NULL,
    parent_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    student_code VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    date_of_birth DATE NOT NULL CHECK (date_of_birth <= CURRENT_DATE),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    blood_type VARCHAR(10) NULL CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' 
        CHECK (status IN ('ACTIVE', 'SUSPENDED', 'GRADUATED', 'WITHDRAWN')),
    avatar_url TEXT NULL,
    emergency_contact_name VARCHAR(255) NOT NULL,
    emergency_contact_phone VARCHAR(50) NOT NULL,
    medical_notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMPTZ NULL,
    CONSTRAINT uq_children_tenant_student_code UNIQUE (tenant_id, student_code)
);

CREATE INDEX idx_children_tenant_id ON children(tenant_id);
CREATE INDEX idx_children_tenant_class ON children(tenant_id, class_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_children_tenant_parent ON children(tenant_id, parent_id);
CREATE INDEX idx_children_tenant_status ON children(tenant_id, status);
CREATE INDEX idx_children_tenant_dob ON children(tenant_id, date_of_birth);
CREATE INDEX idx_children_name_trgm ON children USING gin (full_name gin_trgm_ops);

CREATE TABLE child_allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    allergen_id UUID NULL REFERENCES allergen_catalogs(id) ON DELETE SET NULL,
    custom_allergen_name VARCHAR(150) NULL,
    allergy_type VARCHAR(50) NOT NULL DEFAULT 'ALLERGY' 
        CHECK (allergy_type IN ('ALLERGY', 'INTOLERANCE', 'RELIGIOUS_RESTRICTION', 'MEDICAL_RESTRICTION')),
    severity VARCHAR(50) NOT NULL DEFAULT 'MODERATE' 
        CHECK (severity IN ('MILD', 'MODERATE', 'SEVERE', 'ANAPHYLACTIC')),
    symptoms TEXT NULL,
    reaction_treatment TEXT NULL,
    diagnosed_date DATE NULL,
    medical_certificate_url TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_allergen_specified CHECK (allergen_id IS NOT NULL OR custom_allergen_name IS NOT NULL)
);

CREATE INDEX idx_child_allergies_tenant_id ON child_allergies(tenant_id);
CREATE INDEX idx_child_allergies_tenant_child ON child_allergies(tenant_id, child_id);
CREATE INDEX idx_child_allergies_allergen ON child_allergies(allergen_id);
CREATE INDEX idx_child_allergies_active ON child_allergies(tenant_id, is_active);

-- ============================================================================
-- MODULE 3: FOODS, DISHES & RECIPE ITEMS
-- ============================================================================

CREATE TABLE foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL CHECK (category IN (
        'CEREAL_GRAINS', 'MEAT_POULTRY', 'SEAFOOD', 'EGGS', 'DAIRY', 
        'VEGETABLES', 'FRUITS', 'FATS_OILS', 'NUTS_SEEDS', 
        'SPICES_CONDIMENTS', 'BEVERAGES', 'OTHER'
    )),
    energy_kcal NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (energy_kcal >= 0),
    protein_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (protein_g >= 0),
    fat_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (fat_g >= 0),
    carb_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (carb_g >= 0),
    fiber_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (fiber_g >= 0),
    calcium_mg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (calcium_mg >= 0),
    iron_mg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (iron_mg >= 0),
    zinc_mg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (zinc_mg >= 0),
    vitamin_a_mcg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (vitamin_a_mcg >= 0),
    vitamin_c_mg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (vitamin_c_mg >= 0),
    refuse_rate_percent NUMERIC(5,2) NOT NULL DEFAULT 0 
        CHECK (refuse_rate_percent >= 0 AND refuse_rate_percent <= 100),
    default_unit VARCHAR(50) NOT NULL DEFAULT 'gram',
    allergens TEXT[] NULL,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_foods_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX idx_foods_tenant_id ON foods(tenant_id);
CREATE INDEX idx_foods_tenant_category ON foods(tenant_id, category);
CREATE INDEX idx_foods_allergens_gin ON foods USING gin (allergens);
CREATE INDEX idx_foods_name_trgm ON foods USING gin (name gin_trgm_ops);

CREATE TABLE dishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    dish_type VARCHAR(50) NOT NULL CHECK (dish_type IN (
        'MAIN_COURSE', 'SOUP', 'SIDE_VEGETABLE', 'RICE_STAPLE', 
        'PORRIDGE_NOODLE', 'DESSERT', 'SNACK_AFTERNOON', 'DRINK'
    )),
    target_age_group VARCHAR(50) NOT NULL CHECK (target_age_group IN (
        'TODDLER_18_36M', 'KINDERGARTEN_3_5Y', 'ALL_AGES'
    )),
    standard_serving_size_g NUMERIC(8,2) NOT NULL DEFAULT 100 CHECK (standard_serving_size_g > 0),
    total_calories NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (total_calories >= 0),
    total_protein_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (total_protein_g >= 0),
    total_fat_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (total_fat_g >= 0),
    total_carb_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (total_carb_g >= 0),
    total_calcium_mg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (total_calcium_mg >= 0),
    total_iron_mg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (total_iron_mg >= 0),
    total_zinc_mg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (total_zinc_mg >= 0),
    cooking_instructions TEXT NULL,
    presentation_notes TEXT NULL,
    photo_url TEXT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_dishes_tenant_name UNIQUE (tenant_id, name)
);

CREATE INDEX idx_dishes_tenant_id ON dishes(tenant_id);
CREATE INDEX idx_dishes_tenant_type ON dishes(tenant_id, dish_type);
CREATE INDEX idx_dishes_tenant_active ON dishes(tenant_id, is_active);
CREATE INDEX idx_dishes_name_trgm ON dishes USING gin (name gin_trgm_ops);

CREATE TABLE recipe_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE CASCADE,
    food_id UUID NOT NULL REFERENCES foods(id) ON DELETE RESTRICT,
    net_weight_per_portion_g NUMERIC(8,2) NOT NULL CHECK (net_weight_per_portion_g > 0),
    gross_weight_per_portion_g NUMERIC(8,2) NOT NULL,
    shrinkage_ratio NUMERIC(5,2) NOT NULL DEFAULT 0 
        CHECK (shrinkage_ratio >= 0 AND shrinkage_ratio <= 100),
    prep_notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_gross_gte_net CHECK (gross_weight_per_portion_g >= net_weight_per_portion_g),
    CONSTRAINT uq_recipe_items_dish_food UNIQUE (dish_id, food_id)
);

CREATE INDEX idx_recipe_items_tenant_id ON recipe_items(tenant_id);
CREATE INDEX idx_recipe_items_tenant_dish ON recipe_items(tenant_id, dish_id);
CREATE INDEX idx_recipe_items_food ON recipe_items(food_id);

-- ============================================================================
-- MODULE 4: NUTRITION STANDARDS, RULES & VIOLATIONS LOG
-- ============================================================================

CREATE TABLE nutrition_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    target_age_group VARCHAR(50) NOT NULL CHECK (target_age_group IN (
        'TODDLER_18_36M', 'KINDERGARTEN_3_4Y', 'KINDERGARTEN_4_5Y', 'KINDERGARTEN_5_6Y', 'ALL_AGES'
    )),
    meal_scope VARCHAR(50) NOT NULL CHECK (meal_scope IN (
        'FULL_DAY_SCHOOL', 'LUNCH_ONLY', 'SNACK_ONLY', 'PER_MEAL'
    )),
    min_calories_kcal NUMERIC(8,2) NOT NULL CHECK (min_calories_kcal >= 0),
    max_calories_kcal NUMERIC(8,2) NOT NULL,
    min_protein_percent NUMERIC(5,2) NOT NULL CHECK (min_protein_percent >= 0),
    max_protein_percent NUMERIC(5,2) NOT NULL,
    min_fat_percent NUMERIC(5,2) NOT NULL CHECK (min_fat_percent >= 0),
    max_fat_percent NUMERIC(5,2) NOT NULL,
    min_carb_percent NUMERIC(5,2) NOT NULL CHECK (min_carb_percent >= 0),
    max_carb_percent NUMERIC(5,2) NOT NULL,
    min_calcium_mg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (min_calcium_mg >= 0),
    min_iron_mg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (min_iron_mg >= 0),
    min_zinc_mg NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (min_zinc_mg >= 0),
    max_sodium_mg NUMERIC(8,2) NULL CHECK (max_sodium_mg >= 0),
    ca_p_ratio_min NUMERIC(4,2) NOT NULL DEFAULT 1.00 CHECK (ca_p_ratio_min > 0),
    ca_p_ratio_max NUMERIC(4,2) NOT NULL DEFAULT 1.50,
    is_strict BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_rule_calories CHECK (max_calories_kcal >= min_calories_kcal),
    CONSTRAINT chk_rule_protein CHECK (max_protein_percent >= min_protein_percent),
    CONSTRAINT chk_rule_fat CHECK (max_fat_percent >= min_fat_percent),
    CONSTRAINT chk_rule_carb CHECK (max_carb_percent >= min_carb_percent),
    CONSTRAINT chk_rule_ca_p CHECK (ca_p_ratio_max >= ca_p_ratio_min)
);

CREATE INDEX idx_nutrition_rules_tenant_id ON nutrition_rules(tenant_id);
CREATE INDEX idx_nutrition_rules_tenant_age ON nutrition_rules(tenant_id, target_age_group);
CREATE INDEX idx_nutrition_rules_active ON nutrition_rules(tenant_id, is_active);

CREATE TABLE menus (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    menu_cycle_type VARCHAR(50) NOT NULL CHECK (menu_cycle_type IN (
        'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM'
    )),
    target_age_group VARCHAR(50) NOT NULL CHECK (target_age_group IN (
        'TODDLER_18_36M', 'KINDERGARTEN_3_4Y', 'KINDERGARTEN_4_5Y', 'KINDERGARTEN_5_6Y', 'ALL_AGES'
    )),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cycle_week_number INT NOT NULL DEFAULT 1 CHECK (cycle_week_number BETWEEN 1 AND 8),
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'SUBMITTED_FOR_REVIEW', 'APPROVED', 'REJECTED', 'ACTIVE', 'ARCHIVED'
    )),
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    approved_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ NULL,
    approval_notes TEXT NULL,
    daily_average_calories NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (daily_average_calories >= 0),
    daily_average_protein_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (daily_average_protein_g >= 0),
    daily_average_fat_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (daily_average_fat_g >= 0),
    daily_average_carb_g NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (daily_average_carb_g >= 0),
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_menu_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_menus_tenant_id ON menus(tenant_id);
CREATE INDEX idx_menus_tenant_dates ON menus(tenant_id, start_date, end_date);
CREATE INDEX idx_menus_tenant_status ON menus(tenant_id, status);
CREATE INDEX idx_menus_tenant_age ON menus(tenant_id, target_age_group);
CREATE INDEX idx_menus_created_by ON menus(created_by);
CREATE INDEX idx_menus_approved_by ON menus(approved_by);

CREATE TABLE rule_violations_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    rule_id UUID NULL REFERENCES nutrition_rules(id) ON DELETE SET NULL,
    menu_id UUID NULL REFERENCES menus(id) ON DELETE CASCADE,
    dish_id UUID NULL REFERENCES dishes(id) ON DELETE SET NULL,
    child_id UUID NULL REFERENCES children(id) ON DELETE CASCADE,
    violation_code VARCHAR(50) NOT NULL CHECK (violation_code IN (
        'CALORIE_DEFICIT', 'CALORIE_EXCESS', 'PROTEIN_OUT_OF_RANGE', 
        'FAT_OUT_OF_RANGE', 'CARB_OUT_OF_RANGE', 'CALCIUM_DEFICIT', 
        'IRON_DEFICIT', 'ALLERGEN_CONFLICT', 'INCOMPATIBLE_FOODS', 'REPEAT_DISH_IN_CYCLE'
    )),
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL', 'FATAL_BLOCKER')),
    target_date DATE NULL,
    meal_type VARCHAR(50) NULL,
    message TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN' 
        CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'OVERRIDDEN')),
    resolved_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ NULL,
    resolution_comment TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rule_violations_tenant_id ON rule_violations_log(tenant_id);
CREATE INDEX idx_rule_violations_tenant_status ON rule_violations_log(tenant_id, status);
CREATE INDEX idx_rule_violations_menu ON rule_violations_log(menu_id);
CREATE INDEX idx_rule_violations_child ON rule_violations_log(child_id);
CREATE INDEX idx_rule_violations_details_gin ON rule_violations_log USING gin (details);
CREATE INDEX idx_rule_violations_rule ON rule_violations_log(rule_id);
CREATE INDEX idx_rule_violations_dish ON rule_violations_log(dish_id);
CREATE INDEX idx_rule_violations_resolver ON rule_violations_log(resolved_by);

-- ============================================================================
-- MODULE 5: MENUS & MENU DISHES
-- ============================================================================

CREATE TABLE menu_dishes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    menu_id UUID NOT NULL REFERENCES menus(id) ON DELETE CASCADE,
    dish_id UUID NOT NULL REFERENCES dishes(id) ON DELETE RESTRICT,
    day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
    meal_time VARCHAR(50) NOT NULL CHECK (meal_time IN (
        'BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'LATE_SNACK'
    )),
    serving_order INT NOT NULL DEFAULT 1 CHECK (serving_order >= 1),
    portion_size_g NUMERIC(8,2) NOT NULL CHECK (portion_size_g > 0),
    planned_calories NUMERIC(8,2) NOT NULL DEFAULT 0 CHECK (planned_calories >= 0),
    substitute_dish_id UUID NULL REFERENCES dishes(id) ON DELETE SET NULL,
    special_diet_notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_menu_dishes_unique_slot UNIQUE (menu_id, day_of_week, meal_time, dish_id)
);

CREATE INDEX idx_menu_dishes_tenant_id ON menu_dishes(tenant_id);
CREATE INDEX idx_menu_dishes_tenant_menu ON menu_dishes(tenant_id, menu_id);
CREATE INDEX idx_menu_dishes_dish_id ON menu_dishes(dish_id);
CREATE INDEX idx_menu_dishes_slot ON menu_dishes(tenant_id, menu_id, day_of_week, meal_time);
CREATE INDEX idx_menu_dishes_substitute ON menu_dishes(substitute_dish_id);

-- ============================================================================
-- MODULE 6: SNACK SERVICES, REGISTRATIONS & VNPAY BILLING
-- ============================================================================

CREATE TABLE snack_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN (
        'AFTER_SCHOOL_SNACK', 'PREMIUM_MILK', 'ORGANIC_FRUIT', 'CUSTOM_NUTRITION'
    )),
    billing_cycle VARCHAR(50) NOT NULL CHECK (billing_cycle IN (
        'PER_MEAL', 'WEEKLY', 'MONTHLY', 'SEMESTER'
    )),
    price_per_unit NUMERIC(12,2) NOT NULL CHECK (price_per_unit >= 0),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    available_from DATE NOT NULL,
    available_to DATE NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_snack_services_tenant_id ON snack_services(tenant_id);
CREATE INDEX idx_snack_services_tenant_active ON snack_services(tenant_id, is_active);

CREATE TABLE snack_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    snack_service_id UUID NOT NULL REFERENCES snack_services(id) ON DELETE RESTRICT,
    registered_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    quantity_per_day INT NOT NULL DEFAULT 1 CHECK (quantity_per_day >= 1),
    total_price NUMERIC(12,2) NOT NULL CHECK (total_price >= 0),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK (status IN (
        'PENDING_PAYMENT', 'ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELLED'
    )),
    special_notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_registration_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_snack_reg_tenant_id ON snack_registrations(tenant_id);
CREATE INDEX idx_snack_reg_tenant_child ON snack_registrations(tenant_id, child_id);
CREATE INDEX idx_snack_reg_tenant_status ON snack_registrations(tenant_id, status);
CREATE INDEX idx_snack_reg_service ON snack_registrations(snack_service_id);
CREATE INDEX idx_snack_reg_registrar ON snack_registrations(registered_by);

CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    registration_id UUID NULL REFERENCES snack_registrations(id) ON DELETE SET NULL,
    payer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    order_code VARCHAR(100) NOT NULL UNIQUE,
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(10) NOT NULL DEFAULT 'VND',
    payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN (
        'VNPAY', 'BANK_TRANSFER', 'CASH', 'WALLET'
    )),
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN (
        'PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'REFUNDED'
    )),
    vnp_transaction_no VARCHAR(100) NULL,
    vnp_bank_code VARCHAR(50) NULL,
    vnp_card_type VARCHAR(50) NULL,
    vnp_order_info TEXT NULL,
    vnp_pay_date TIMESTAMPTZ NULL,
    vnp_response_code VARCHAR(10) NULL,
    vnp_secure_hash VARCHAR(255) NULL,
    raw_callback_payload JSONB NULL,
    paid_at TIMESTAMPTZ NULL,
    refunded_at TIMESTAMPTZ NULL,
    refund_reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_tenant_id ON transactions(tenant_id);
CREATE INDEX idx_transactions_tenant_status ON transactions(tenant_id, status);
CREATE INDEX idx_transactions_order_code ON transactions(order_code);
CREATE INDEX idx_transactions_payer ON transactions(payer_id);
CREATE INDEX idx_transactions_registration ON transactions(registration_id);
CREATE INDEX idx_transactions_payload_gin ON transactions USING gin (raw_callback_payload);

-- ============================================================================
-- MODULE 7: DAILY MEAL ATTENDANCE & PORTION CONSUMPTION
-- ============================================================================

CREATE TABLE daily_meal_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE RESTRICT,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    attendance_date DATE NOT NULL,
    meal_type VARCHAR(50) NOT NULL CHECK (meal_type IN (
        'BREAKFAST', 'MORNING_SNACK', 'LUNCH', 'AFTERNOON_SNACK', 'EXTRA_SNACK'
    )),
    attendance_status VARCHAR(50) NOT NULL DEFAULT 'PRESENT' CHECK (attendance_status IN (
        'PRESENT', 'ABSENT_PERMITTED', 'ABSENT_UNPERMITTED', 'NOT_REGISTERED'
    )),
    recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checkin_source VARCHAR(50) NOT NULL DEFAULT 'TEACHER_APP' CHECK (checkin_source IN (
        'TEACHER_APP', 'KIOSK_FACE_QR', 'ADMIN_MANUAL'
    )),
    notes TEXT NULL,
    CONSTRAINT uq_daily_meal_attendance UNIQUE (tenant_id, child_id, attendance_date, meal_type)
);

CREATE INDEX idx_daily_meal_att_tenant_id ON daily_meal_attendance(tenant_id);
CREATE INDEX idx_daily_meal_att_tenant_date ON daily_meal_attendance(tenant_id, attendance_date, meal_type);
CREATE INDEX idx_daily_meal_att_class ON daily_meal_attendance(class_id, attendance_date);
CREATE INDEX idx_daily_meal_att_child ON daily_meal_attendance(child_id);
CREATE INDEX idx_daily_meal_att_recorder ON daily_meal_attendance(recorded_by);

CREATE TABLE meal_consumption_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    attendance_id UUID NOT NULL REFERENCES daily_meal_attendance(id) ON DELETE CASCADE,
    menu_dish_id UUID NULL REFERENCES menu_dishes(id) ON DELETE SET NULL,
    portion_consumed VARCHAR(50) NOT NULL CHECK (portion_consumed IN (
        'ALL', 'HALF', 'QUARTER', 'NONE', 'DOUBLE_PORTION'
    )),
    consumption_percentage INT NOT NULL CHECK (consumption_percentage BETWEEN 0 AND 200),
    adverse_reaction_observed BOOLEAN NOT NULL DEFAULT FALSE,
    reaction_description TEXT NULL,
    teacher_feedback TEXT NULL,
    photo_evidence_url TEXT NULL,
    water_intake VARCHAR(100) NULL DEFAULT '200ml Nước ấm',
    sync_status VARCHAR(50) NULL DEFAULT 'SENT',
    sent_at VARCHAR(50) NULL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_consumption_attendance_dish UNIQUE (attendance_id, menu_dish_id)
);

CREATE INDEX idx_consumption_tenant_id ON meal_consumption_status(tenant_id);
CREATE INDEX idx_consumption_tenant_attendance ON meal_consumption_status(tenant_id, attendance_id);
CREATE INDEX idx_consumption_menu_dish ON meal_consumption_status(menu_dish_id);
CREATE INDEX idx_consumption_reaction ON meal_consumption_status(tenant_id, adverse_reaction_observed) 
    WHERE adverse_reaction_observed = TRUE;

-- ============================================================================
-- MODULE 8: FOOD SAFETY 3-STEP INSPECTION & 24H SAMPLE RETENTION
-- ============================================================================

CREATE TABLE food_safety_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    inspection_date DATE NOT NULL,
    meal_session VARCHAR(50) NOT NULL CHECK (meal_session IN (
        'BREAKFAST', 'LUNCH', 'AFTERNOON_SNACK', 'ALL_DAY'
    )),
    step_number INT NOT NULL CHECK (step_number IN (1, 2, 3)),
    step_name VARCHAR(100) NOT NULL CHECK (step_name IN (
        'STEP_1_RAW_INGREDIENT_CHECK', 
        'STEP_2_PROCESSING_CHECK', 
        'STEP_3_PRE_SERVING_SAMPLE_RETENTION'
    )),
    
    -- Bước 1: Kiểm thực nguyên liệu đầu vào
    supplier_name VARCHAR(255) NULL,
    ingredient_name VARCHAR(255) NULL,
    invoice_contract_number VARCHAR(100) NULL,
    gross_quantity_kg NUMERIC(10,2) NULL CHECK (gross_quantity_kg >= 0),
    ingredient_origin VARCHAR(255) NULL,
    expiry_date DATE NULL,
    sensory_status_raw VARCHAR(50) NULL CHECK (sensory_status_raw IN (
        'FRESH_GOOD', 'SATISFACTORY', 'SUBSTANDARD_REJECTED'
    )),
    temperature_storage_celsius NUMERIC(5,2) NULL,

    -- Bước 2: Kiểm thực chế biến
    kitchen_cleanliness_status VARCHAR(50) NULL CHECK (kitchen_cleanliness_status IN (
        'CLEAN_COMPLIANT', 'ACCEPTABLE', 'NON_COMPLIANT'
    )),
    equipment_sanitation_status VARCHAR(50) NULL CHECK (equipment_sanitation_status IN (
        'STERILIZED_CLEAN', 'SUBSTANDARD'
    )),
    cooking_process_notes TEXT NULL,
    finished_dish_sensory VARCHAR(50) NULL CHECK (finished_dish_sensory IN (
        'NORMAL_TASTY', 'ODOR_ANOMALY', 'COLOR_ANOMALY', 'REJECTED'
    )),

    -- Bước 3 & Lưu mẫu 24h (QĐ 1246/QĐ-BYT: Mẫu >= 100g, tủ lạnh 2.0°C - 8.0°C)
    has_sample_retention BOOLEAN NOT NULL DEFAULT FALSE,
    dish_name VARCHAR(255) NULL,
    serving_temperature_celsius NUMERIC(5,2) NULL 
        CHECK (serving_temperature_celsius BETWEEN 0 AND 100),
    sample_seal_code VARCHAR(100) NULL,
    sample_weight_g NUMERIC(8,2) NULL CHECK (sample_weight_g >= 100),
    retention_fridge_temp_celsius NUMERIC(4,2) NULL 
        CHECK (retention_fridge_temp_celsius BETWEEN 2.0 AND 8.0),
    sample_taken_at TIMESTAMPTZ NULL,
    sample_disposed_at TIMESTAMPTZ NULL,
    sample_status VARCHAR(50) NULL CHECK (sample_status IN (
        'RETAINED_ACTIVE', 'DISPOSED_SAFE', 'SENT_FOR_TESTING', 'SUSPECT_CONTAMINATED'
    )),

    -- Nhân sự xác nhận & Kết luận
    inspector_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    kitchen_manager_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    school_representative_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    result_conclusion VARCHAR(50) NOT NULL DEFAULT 'PASSED' CHECK (result_conclusion IN (
        'PASSED', 'WARNING_CORRECTED', 'REJECTED_DESTROYED'
    )),
    rejection_reason TEXT NULL,
    corrective_action TEXT NULL,
    photos TEXT[] NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_sample_retention_temp CHECK (
        NOT has_sample_retention OR (
            retention_fridge_temp_celsius IS NOT NULL 
            AND retention_fridge_temp_celsius BETWEEN 2.0 AND 8.0
            AND sample_weight_g >= 100
            AND sample_seal_code IS NOT NULL
            AND sample_taken_at IS NOT NULL
        )
    ),
    CONSTRAINT chk_step3_sample_retention CHECK (
        step_number != 3 OR (
            sample_weight_g >= 100 
            AND sample_seal_code IS NOT NULL
            AND sample_taken_at IS NOT NULL
            AND retention_fridge_temp_celsius IS NOT NULL
            AND retention_fridge_temp_celsius BETWEEN 2.0 AND 8.0
        )
    )
);

CREATE INDEX idx_food_safety_tenant_id ON food_safety_logs(tenant_id);
CREATE INDEX idx_food_safety_tenant_date_step ON food_safety_logs(tenant_id, inspection_date, step_number);
CREATE INDEX idx_food_safety_sample_active ON food_safety_logs(tenant_id, sample_status) 
    WHERE sample_status = 'RETAINED_ACTIVE';
CREATE INDEX idx_food_safety_inspector ON food_safety_logs(inspector_id);
CREATE INDEX idx_food_safety_kitchen_mgr ON food_safety_logs(kitchen_manager_id);
CREATE INDEX idx_food_safety_school_rep ON food_safety_logs(school_representative_id);

-- ============================================================================
-- MODULE 9: GROWTH RECORDS & WHO CHILD GROWTH STANDARDS
-- ============================================================================

CREATE TABLE growth_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    measurement_date DATE NOT NULL CHECK (measurement_date <= CURRENT_DATE),
    age_in_months INT NOT NULL CHECK (age_in_months BETWEEN 0 AND 84),
    weight_kg NUMERIC(5,2) NOT NULL CHECK (weight_kg > 0 AND weight_kg < 100),
    height_cm NUMERIC(5,2) NOT NULL CHECK (height_cm > 30 AND height_cm < 200),
    bmi NUMERIC(5,2) GENERATED ALWAYS AS (
        ROUND((weight_kg / ((height_cm / 100.0) * (height_cm / 100.0))), 2)
    ) STORED,
    waz NUMERIC(4,2) NULL,
    haz NUMERIC(4,2) NULL,
    baz NUMERIC(4,2) NULL,
    whz NUMERIC(4,2) NULL,
    weight_classification VARCHAR(50) NOT NULL CHECK (weight_classification IN (
        'SEVERELY_UNDERWEIGHT', 'UNDERWEIGHT', 'NORMAL_WEIGHT', 'OVERWEIGHT', 'OBESE'
    )),
    height_classification VARCHAR(50) NOT NULL CHECK (height_classification IN (
        'SEVERELY_STUNTED', 'STUNTED', 'NORMAL_HEIGHT', 'TALL'
    )),
    bmi_classification VARCHAR(50) NOT NULL CHECK (bmi_classification IN (
        'SEVERELY_WASTED', 'WASTED', 'NORMAL', 'POSSIBLE_RISK_OVERWEIGHT', 'OVERWEIGHT', 'OBESE'
    )),
    overall_nutritional_status VARCHAR(100) NOT NULL,
    measured_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    health_notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_growth_records_child_date UNIQUE (child_id, measurement_date)
);

CREATE INDEX idx_growth_records_tenant_id ON growth_records(tenant_id);
CREATE INDEX idx_growth_records_tenant_child ON growth_records(tenant_id, child_id, measurement_date DESC);
CREATE INDEX idx_growth_records_tenant_date ON growth_records(tenant_id, measurement_date);
CREATE INDEX idx_growth_records_classification ON growth_records(tenant_id, overall_nutritional_status);
CREATE INDEX idx_growth_records_measured_by ON growth_records(measured_by);

-- WHO Child Growth Reference LMS Lookup Table (Shared System Table)
CREATE TABLE who_growth_standards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    indicator VARCHAR(10) NOT NULL CHECK (indicator IN ('WAZ', 'HAZ', 'BAZ', 'WHZ')),
    gender VARCHAR(10) NOT NULL CHECK (gender IN ('MALE', 'FEMALE')),
    age_in_months INT NOT NULL CHECK (age_in_months BETWEEN 0 AND 84),
    l_value NUMERIC(8,4) NOT NULL,
    m_value NUMERIC(8,4) NOT NULL,
    s_value NUMERIC(8,4) NOT NULL,
    sd3_neg NUMERIC(8,2) NOT NULL,
    sd2_neg NUMERIC(8,2) NOT NULL,
    sd1_neg NUMERIC(8,2) NOT NULL,
    sd0 NUMERIC(8,2) NOT NULL,
    sd1_pos NUMERIC(8,2) NOT NULL,
    sd2_pos NUMERIC(8,2) NOT NULL,
    sd3_pos NUMERIC(8,2) NOT NULL,
    CONSTRAINT uq_who_standards UNIQUE (indicator, gender, age_in_months)
);

CREATE INDEX idx_who_standards_lookup ON who_growth_standards(indicator, gender, age_in_months);

-- ============================================================================
-- MODULE 10: AUDIT LOGS & PARENT FEEDBACKS
-- ============================================================================

-- 1. audit_logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    user_email VARCHAR(255) NULL,
    action VARCHAR(100) NOT NULL,
    target_entity VARCHAR(100) NULL,
    target_id VARCHAR(255) NULL,
    ip_address VARCHAR(45) NULL,
    details JSONB NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 2. parent_feedbacks
CREATE TABLE parent_feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
    feedback_date DATE NOT NULL,
    meal_type VARCHAR(50) NOT NULL DEFAULT 'LUNCH',
    rating INT NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    photos TEXT[] NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'RESPONDED', 'RESOLVED')),
    status_label VARCHAR(100) NULL,
    meal_title VARCHAR(255) NULL,
    parent_relation VARCHAR(50) NOT NULL DEFAULT 'Mẹ',
    parent_name_custom VARCHAR(255) NULL,
    child_name_custom VARCHAR(255) NULL,
    class_name_custom VARCHAR(100) NULL,
    grade_level_custom VARCHAR(50) NULL,
    feedback_time_label VARCHAR(100) NULL,
    priority_note VARCHAR(255) NULL,
    likes_info VARCHAR(255) NULL,
    photo_details JSONB NULL,
    response_header VARCHAR(255) NULL,
    responded_by_name VARCHAR(150) NULL,
    push_notification_sent BOOLEAN NOT NULL DEFAULT TRUE,
    is_drafting BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INT NOT NULL DEFAULT 999,
    response_content TEXT NULL,
    responded_by UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    responded_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_parent_feedbacks_tenant ON parent_feedbacks(tenant_id);
CREATE INDEX idx_parent_feedbacks_parent ON parent_feedbacks(tenant_id, parent_id);
CREATE INDEX idx_parent_feedbacks_child ON parent_feedbacks(tenant_id, child_id);
CREATE INDEX idx_parent_feedbacks_status ON parent_feedbacks(tenant_id, status);

-- ============================================================================
-- AUTOMATED TRIGGERS FOR TIMESTAMPS
-- ============================================================================

CREATE TRIGGER trg_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_refresh_tokens_updated_at BEFORE UPDATE ON refresh_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_children_updated_at BEFORE UPDATE ON children FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_child_allergies_updated_at BEFORE UPDATE ON child_allergies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_foods_updated_at BEFORE UPDATE ON foods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_dishes_updated_at BEFORE UPDATE ON dishes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_recipe_items_updated_at BEFORE UPDATE ON recipe_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_nutrition_rules_updated_at BEFORE UPDATE ON nutrition_rules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_menus_updated_at BEFORE UPDATE ON menus FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_menu_dishes_updated_at BEFORE UPDATE ON menu_dishes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_snack_services_updated_at BEFORE UPDATE ON snack_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_snack_registrations_updated_at BEFORE UPDATE ON snack_registrations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_food_safety_logs_updated_at BEFORE UPDATE ON food_safety_logs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_growth_records_updated_at BEFORE UPDATE ON growth_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_parent_feedbacks_updated_at BEFORE UPDATE ON parent_feedbacks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUTOMATED TRIGGER FOR DISH NUTRITION RECALCULATION
-- ============================================================================

CREATE OR REPLACE FUNCTION recalculate_dish_nutrients()
RETURNS TRIGGER AS $$
DECLARE
    target_dish_id UUID;
    v_energy NUMERIC(8,2);
    v_protein NUMERIC(8,2);
    v_fat NUMERIC(8,2);
    v_carb NUMERIC(8,2);
    v_calcium NUMERIC(8,2);
    v_iron NUMERIC(8,2);
    v_zinc NUMERIC(8,2);
BEGIN
    IF TG_OP = 'DELETE' THEN
        target_dish_id := OLD.dish_id;
    ELSE
        target_dish_id := NEW.dish_id;
    END IF;

    SELECT 
        COALESCE(ROUND(SUM((f.energy_kcal * ri.net_weight_per_portion_g) / 100.0), 2), 0),
        COALESCE(ROUND(SUM((f.protein_g * ri.net_weight_per_portion_g) / 100.0), 2), 0),
        COALESCE(ROUND(SUM((f.fat_g * ri.net_weight_per_portion_g) / 100.0), 2), 0),
        COALESCE(ROUND(SUM((f.carb_g * ri.net_weight_per_portion_g) / 100.0), 2), 0),
        COALESCE(ROUND(SUM((f.calcium_mg * ri.net_weight_per_portion_g) / 100.0), 2), 0),
        COALESCE(ROUND(SUM((f.iron_mg * ri.net_weight_per_portion_g) / 100.0), 2), 0),
        COALESCE(ROUND(SUM((f.zinc_mg * ri.net_weight_per_portion_g) / 100.0), 2), 0)
    INTO 
        v_energy, v_protein, v_fat, v_carb, v_calcium, v_iron, v_zinc
    FROM recipe_items ri
    JOIN foods f ON ri.food_id = f.id
    WHERE ri.dish_id = target_dish_id;

    UPDATE dishes
    SET 
        total_calories = v_energy,
        total_protein_g = v_protein,
        total_fat_g = v_fat,
        total_carb_g = v_carb,
        total_calcium_mg = v_calcium,
        total_iron_mg = v_iron,
        total_zinc_mg = v_zinc,
        updated_at = CURRENT_TIMESTAMP
    WHERE dishes.id = target_dish_id;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_recalculate_dish_nutrients
AFTER INSERT OR UPDATE OR DELETE ON recipe_items
FOR EACH ROW EXECUTE FUNCTION recalculate_dish_nutrients();

-- ============================================================================
-- STORED PROCEDURE: DETECT MENU ALLERGY CONFLICTS
-- ============================================================================

CREATE OR REPLACE FUNCTION detect_menu_allergy_conflicts(p_menu_id UUID)
RETURNS TABLE (
    child_id UUID,
    child_name VARCHAR,
    class_name VARCHAR,
    dish_id UUID,
    dish_name VARCHAR,
    allergen_detected TEXT,
    severity VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        c.id AS child_id,
        c.full_name AS child_name,
        cls.name AS class_name,
        d.id AS dish_id,
        d.name AS dish_name,
        COALESCE(ac.name_vi, ca.custom_allergen_name) AS allergen_detected,
        ca.severity AS severity
    FROM menu_dishes md
    JOIN dishes d ON md.dish_id = d.id
    JOIN recipe_items ri ON d.id = ri.dish_id
    JOIN foods f ON ri.food_id = f.id
    JOIN menus m ON md.menu_id = m.id
    JOIN classes cls ON cls.tenant_id = m.tenant_id 
         AND (
             m.target_age_group = 'ALL_AGES' 
             OR cls.grade_level = m.target_age_group
             OR (m.target_age_group = 'TODDLER_18_36M' AND cls.grade_level IN ('TODDLER_1_2Y', 'TODDLER_2_3Y'))
         )
    JOIN children c ON c.class_id = cls.id AND c.status = 'ACTIVE'
    JOIN child_allergies ca ON ca.child_id = c.id AND ca.is_active = TRUE
    LEFT JOIN allergen_catalogs ac ON ca.allergen_id = ac.id
    WHERE md.menu_id = p_menu_id
      AND (
          (ac.code IS NOT NULL AND ac.code = ANY(f.allergens))
          OR (ac.name_vi IS NOT NULL AND f.name ILIKE ('%' || ac.name_vi || '%'))
          OR (ca.custom_allergen_name IS NOT NULL AND f.name ILIKE ('%' || ca.custom_allergen_name || '%'))
      );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) ENFORCEMENT & POLICIES
-- ============================================================================

-- 1. tenants
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants FORCE ROW LEVEL SECURITY;
CREATE POLICY tenants_select_policy ON tenants FOR SELECT
    USING (id = get_current_tenant_id() OR is_current_super_admin());

CREATE OR REPLACE VIEW v_public_tenants AS
SELECT id, code, name, domain, status
FROM tenants
WHERE status = 'ACTIVE' AND deleted_at IS NULL;
CREATE POLICY tenants_modify_policy ON tenants FOR ALL
    USING (id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (id = get_current_tenant_id() OR is_current_super_admin());

-- 2. users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;
CREATE POLICY users_policy ON users FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 3. roles (Shared System Roles + Tenant Custom Roles)
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles FORCE ROW LEVEL SECURITY;
CREATE POLICY roles_select_policy ON roles FOR SELECT
    USING (tenant_id IS NULL OR tenant_id = get_current_tenant_id() OR is_current_super_admin());
CREATE POLICY roles_modify_policy ON roles FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 4. user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles FORCE ROW LEVEL SECURITY;
CREATE POLICY user_roles_policy ON user_roles FOR ALL
    USING ((tenant_id IS NOT NULL AND tenant_id = get_current_tenant_id()) OR is_current_super_admin())
    WITH CHECK ((tenant_id IS NOT NULL AND tenant_id = get_current_tenant_id()) OR is_current_super_admin());

-- 5. refresh_tokens
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens FORCE ROW LEVEL SECURITY;
CREATE POLICY refresh_tokens_policy ON refresh_tokens FOR ALL
    USING ((tenant_id IS NOT NULL AND tenant_id = get_current_tenant_id()) OR is_current_super_admin())
    WITH CHECK ((tenant_id IS NOT NULL AND tenant_id = get_current_tenant_id()) OR is_current_super_admin());

-- 6. classes
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes FORCE ROW LEVEL SECURITY;
CREATE POLICY classes_policy ON classes FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 7. children
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE children FORCE ROW LEVEL SECURITY;
CREATE POLICY children_policy ON children FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 8. child_allergies
ALTER TABLE child_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_allergies FORCE ROW LEVEL SECURITY;
CREATE POLICY child_allergies_policy ON child_allergies FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 9. foods (Shared National FCT + Tenant Custom Foods)
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE foods FORCE ROW LEVEL SECURITY;
CREATE POLICY foods_select_policy ON foods FOR SELECT
    USING (tenant_id IS NULL OR tenant_id = get_current_tenant_id() OR is_current_super_admin());
CREATE POLICY foods_modify_policy ON foods FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 10. dishes
ALTER TABLE dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dishes FORCE ROW LEVEL SECURITY;
CREATE POLICY dishes_policy ON dishes FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 11. recipe_items
ALTER TABLE recipe_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_items FORCE ROW LEVEL SECURITY;
CREATE POLICY recipe_items_policy ON recipe_items FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 12. nutrition_rules (Shared Statutory Circular 28 + Tenant Custom Rules)
ALTER TABLE nutrition_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE nutrition_rules FORCE ROW LEVEL SECURITY;
CREATE POLICY nutrition_rules_select_policy ON nutrition_rules FOR SELECT
    USING (tenant_id IS NULL OR tenant_id = get_current_tenant_id() OR is_current_super_admin());
CREATE POLICY nutrition_rules_modify_policy ON nutrition_rules FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 13. menus
ALTER TABLE menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE menus FORCE ROW LEVEL SECURITY;
CREATE POLICY menus_policy ON menus FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 14. menu_dishes
ALTER TABLE menu_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_dishes FORCE ROW LEVEL SECURITY;
CREATE POLICY menu_dishes_policy ON menu_dishes FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 15. rule_violations_log
ALTER TABLE rule_violations_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_violations_log FORCE ROW LEVEL SECURITY;
CREATE POLICY rule_violations_log_policy ON rule_violations_log FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 16. snack_services
ALTER TABLE snack_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE snack_services FORCE ROW LEVEL SECURITY;
CREATE POLICY snack_services_policy ON snack_services FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 17. snack_registrations
ALTER TABLE snack_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE snack_registrations FORCE ROW LEVEL SECURITY;
CREATE POLICY snack_registrations_policy ON snack_registrations FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 18. transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions FORCE ROW LEVEL SECURITY;
CREATE POLICY transactions_policy ON transactions FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 19. daily_meal_attendance
ALTER TABLE daily_meal_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_meal_attendance FORCE ROW LEVEL SECURITY;
CREATE POLICY daily_meal_attendance_policy ON daily_meal_attendance FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 20. meal_consumption_status
ALTER TABLE meal_consumption_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_consumption_status FORCE ROW LEVEL SECURITY;
CREATE POLICY meal_consumption_status_policy ON meal_consumption_status FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 21. food_safety_logs
ALTER TABLE food_safety_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_safety_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY food_safety_logs_policy ON food_safety_logs FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 22. growth_records
ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE growth_records FORCE ROW LEVEL SECURITY;
CREATE POLICY growth_records_policy ON growth_records FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 23. audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_policy ON audit_logs FOR ALL
    USING (tenant_id IS NULL OR tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id IS NULL OR tenant_id = get_current_tenant_id() OR is_current_super_admin());

-- 24. parent_feedbacks
ALTER TABLE parent_feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_feedbacks FORCE ROW LEVEL SECURITY;
CREATE POLICY parent_feedbacks_policy ON parent_feedbacks FOR ALL
    USING (tenant_id = get_current_tenant_id() OR is_current_super_admin())
    WITH CHECK (tenant_id = get_current_tenant_id() OR is_current_super_admin());

COMMIT;
