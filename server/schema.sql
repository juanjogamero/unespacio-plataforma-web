-- Unespacio · PostgreSQL v1. Requiere PostgreSQL 15+ y extensión btree_gist.
-- Ejecutar mediante "npm run db:migrate" en infraestructura privada, nunca en GitHub Pages.
BEGIN;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE TABLE IF NOT EXISTS businesses (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9][a-z0-9-]{2,49}$'),
 name text NOT NULL CHECK(length(name) BETWEEN 2 AND 100),
 timezone text NOT NULL DEFAULT 'Europe/Madrid',
 public_booking_enabled boolean NOT NULL DEFAULT false,
 privacy_url text,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS users (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 email text NOT NULL UNIQUE CHECK(length(email) BETWEEN 5 AND 254),
 password_hash text NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS memberships (
 business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 role text NOT NULL CHECK(role IN ('owner','staff')),
 PRIMARY KEY(business_id,user_id)
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash text PRIMARY KEY,
 csrf_hash text NOT NULL,
 user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 business_id uuid NOT NULL,
 expires_at timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY(business_id,user_id) REFERENCES memberships(business_id,user_id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS sessions_expires_idx ON sessions(expires_at);
CREATE TABLE IF NOT EXISTS professionals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 name text NOT NULL CHECK(length(name) BETWEEN 2 AND 80),
 active boolean NOT NULL DEFAULT true,
 UNIQUE (business_id,id)
);
CREATE TABLE IF NOT EXISTS services (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 name text NOT NULL CHECK(length(name) BETWEEN 2 AND 100),
 minutes integer NOT NULL CHECK(minutes BETWEEN 10 AND 240 AND minutes % 5=0),
 price_cents integer NOT NULL DEFAULT 0 CHECK(price_cents BETWEEN 0 AND 999999),
 active boolean NOT NULL DEFAULT true,
 UNIQUE (business_id,id)
);
CREATE TABLE IF NOT EXISTS customers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 name text NOT NULL CHECK(length(name) BETWEEN 2 AND 100),
 phone text CHECK(phone IS NULL OR length(phone) <= 30),
 preference text NOT NULL DEFAULT 'telefono' CHECK(preference IN ('telefono','whatsapp','local','online')),
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (business_id,id)
);
CREATE TABLE IF NOT EXISTS business_hours (
 business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 weekday smallint NOT NULL CHECK(weekday BETWEEN 0 AND 6),
 slot smallint NOT NULL CHECK(slot BETWEEN 1 AND 3),
 open_min smallint NOT NULL CHECK(open_min BETWEEN 0 AND 1439),
 close_min smallint NOT NULL CHECK(close_min BETWEEN 1 AND 1440 AND close_min>open_min),
 PRIMARY KEY (business_id,weekday,slot)
);
CREATE TABLE IF NOT EXISTS closures (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 professional_id uuid,
 day date NOT NULL,
 reason text NOT NULL DEFAULT 'No disponible' CHECK(length(reason) <= 120),
 FOREIGN KEY (business_id,professional_id) REFERENCES professionals(business_id,id)
);
CREATE INDEX IF NOT EXISTS closures_day_idx ON closures(business_id,day);
CREATE TABLE IF NOT EXISTS appointments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
 customer_id uuid NOT NULL,
 professional_id uuid NOT NULL,
 service_id uuid NOT NULL,
 day date NOT NULL,
 start_min smallint NOT NULL CHECK(start_min BETWEEN 0 AND 1439),
 end_min smallint NOT NULL CHECK(end_min BETWEEN 1 AND 1440 AND end_min>start_min),
 source text NOT NULL CHECK(source IN ('telefono','whatsapp','local','online')),
 status text NOT NULL DEFAULT 'confirmada' CHECK(status IN ('confirmada','cancelada','pendiente')),
 created_at timestamptz NOT NULL DEFAULT now(),
 FOREIGN KEY (business_id,customer_id) REFERENCES customers(business_id,id),
 FOREIGN KEY (business_id,professional_id) REFERENCES professionals(business_id,id),
 FOREIGN KEY (business_id,service_id) REFERENCES services(business_id,id)
);
-- PostgreSQL impide doble reserva incluso con peticiones simultáneas, también desde distintos dispositivos.
ALTER TABLE appointments ADD CONSTRAINT no_double_booking EXCLUDE USING gist (
 business_id WITH =, professional_id WITH =, day WITH =,
 int4range(start_min,end_min,'[)') WITH &&
) WHERE(status='confirmada');
CREATE INDEX IF NOT EXISTS appointments_business_day_idx ON appointments(business_id,day);
COMMIT;
