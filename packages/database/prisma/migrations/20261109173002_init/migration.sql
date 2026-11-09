-- CreateEnum
CREATE TYPE "CenterUserRole" AS ENUM ('admin', 'operator');

-- CreateEnum
CREATE TYPE "EquipmentStatus" AS ENUM ('in_service', 'maintenance', 'retired');

-- CreateTable
CREATE TABLE "centers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "centers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "center_users" (
    "center_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "role" "CenterUserRole" NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "center_users_pkey" PRIMARY KEY ("center_id","user_id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "center_id" INTEGER NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "dni" VARCHAR(12) NOT NULL,
    "student_number" VARCHAR(40) NOT NULL,
    "phone_e164" VARCHAR(16) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipment" (
    "id" SERIAL NOT NULL,
    "center_id" INTEGER NOT NULL,
    "code" VARCHAR(30) NOT NULL,
    "operational_status" "EquipmentStatus" NOT NULL DEFAULT 'in_service',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "equipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "loans" (
    "id" SERIAL NOT NULL,
    "center_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "equipment_id" INTEGER NOT NULL,
    "created_by_user_id" INTEGER NOT NULL,
    "returned_by_user_id" INTEGER,
    "loaned_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "returned_at" TIMESTAMPTZ(6),
    "notes" TEXT,

    CONSTRAINT "loans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "center_id" INTEGER NOT NULL,
    "actor_user_id" INTEGER,
    "action" VARCHAR(60) NOT NULL,
    "entity_type" VARCHAR(60) NOT NULL,
    "entity_id" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "centers_slug_key" ON "centers"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "center_users_user_id_idx" ON "center_users"("user_id");

-- CreateIndex
CREATE INDEX "students_center_id_last_name_first_name_idx" ON "students"("center_id", "last_name", "first_name");

-- CreateIndex
CREATE UNIQUE INDEX "students_center_id_dni_key" ON "students"("center_id", "dni");

-- CreateIndex
CREATE UNIQUE INDEX "students_center_id_student_number_key" ON "students"("center_id", "student_number");

-- CreateIndex
CREATE UNIQUE INDEX "students_center_id_phone_e164_key" ON "students"("center_id", "phone_e164");

-- CreateIndex
CREATE UNIQUE INDEX "students_center_id_id_key" ON "students"("center_id", "id");

-- CreateIndex
CREATE INDEX "equipment_center_id_operational_status_idx" ON "equipment"("center_id", "operational_status");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_center_id_code_key" ON "equipment"("center_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "equipment_center_id_id_key" ON "equipment"("center_id", "id");

-- CreateIndex
CREATE INDEX "idx_loans_active_center" ON "loans"("center_id", "loaned_at" DESC) WHERE ("returned_at" IS NULL);

-- CreateIndex
CREATE INDEX "idx_loans_student_history" ON "loans"("center_id", "student_id", "loaned_at" DESC);

-- CreateIndex
CREATE INDEX "idx_loans_returned_by" ON "loans"("returned_by_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_loans_active_equipment" ON "loans"("center_id", "equipment_id") WHERE ("returned_at" IS NULL);

-- CreateIndex
CREATE INDEX "audit_logs_center_id_occurred_at_idx" ON "audit_logs"("center_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_entity_type_entity_id_idx" ON "audit_logs"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "audit_logs_actor_user_id_idx" ON "audit_logs"("actor_user_id");

-- AddForeignKey
ALTER TABLE "center_users" ADD CONSTRAINT "center_users_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "center_users" ADD CONSTRAINT "center_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_center_id_student_id_fkey" FOREIGN KEY ("center_id", "student_id") REFERENCES "students"("center_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_center_id_equipment_id_fkey" FOREIGN KEY ("center_id", "equipment_id") REFERENCES "equipment"("center_id", "id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_center_id_created_by_user_id_fkey" FOREIGN KEY ("center_id", "created_by_user_id") REFERENCES "center_users"("center_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "loans" ADD CONSTRAINT "loans_center_id_returned_by_user_id_fkey" FOREIGN KEY ("center_id", "returned_by_user_id") REFERENCES "center_users"("center_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_center_id_fkey" FOREIGN KEY ("center_id") REFERENCES "centers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_center_id_actor_user_id_fkey" FOREIGN KEY ("center_id", "actor_user_id") REFERENCES "center_users"("center_id", "user_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Custom integrity constraints (not expressible in the Prisma schema).
-- Keep these in sync with docs/database.md. Do not use `prisma db pull` as the
-- source of truth for this schema: it does not preserve CHECK constraints.
ALTER TABLE "users" ADD CONSTRAINT "users_email_lowercase" CHECK ("email" = lower("email"));

ALTER TABLE "centers" ADD CONSTRAINT "centers_slug_lowercase" CHECK ("slug" = lower("slug"));

ALTER TABLE "students"
    ADD CONSTRAINT "students_dni_format" CHECK ("dni" ~ '^[0-9]{7,9}$'),
    ADD CONSTRAINT "students_phone_e164_format" CHECK ("phone_e164" ~ '^\+[1-9][0-9]{7,14}$');

ALTER TABLE "loans"
    ADD CONSTRAINT "loans_returned_fields_consistent" CHECK (("returned_at" IS NULL) = ("returned_by_user_id" IS NULL)),
    ADD CONSTRAINT "loans_returned_after_loaned" CHECK ("returned_at" IS NULL OR "returned_at" >= "loaned_at");
