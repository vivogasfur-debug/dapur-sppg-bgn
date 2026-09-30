-- Migration 004: Add balita/child fields to beneficiaries_3b for Bumil/Busui
-- These fields store the child/baby info associated with pregnant/breastfeeding women

ALTER TABLE beneficiaries_3b ADD COLUMN IF NOT EXISTS nama_balita TEXT NULL;
ALTER TABLE beneficiaries_3b ADD COLUMN IF NOT EXISTS tanggal_lahir_balita DATE NULL;

COMMENT ON COLUMN beneficiaries_3b.nama_balita IS 'Nama balita/busui (anak dari bumil/busui)';
COMMENT ON COLUMN beneficiaries_3b.tanggal_lahir_balita IS 'Tanggal lahir balita/busui';
