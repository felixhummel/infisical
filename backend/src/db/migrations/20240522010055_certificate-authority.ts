import { Knex } from "knex";

import { TableName } from "../schemas";
import { createOnUpdateTrigger, dropOnUpdateTrigger } from "../utils";

export async function up(knex: Knex): Promise<void> {
  if (!(await knex.schema.hasTable(TableName.CertificateAuthority))) {
    // TODO: add algo deets
    await knex.schema.createTable(TableName.CertificateAuthority, (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.timestamps(true, true, true);
      t.uuid("parentCaId").nullable();
      t.foreign("parentCaId").references("id").inTable(TableName.CertificateAuthority).onDelete("CASCADE");
      t.string("projectId").notNullable();
      t.foreign("projectId").references("id").inTable(TableName.Project).onDelete("CASCADE");
      t.string("type").notNullable(); // root / intermediate
      t.string("status").notNullable(); // active / pending-certificate
      t.string("organization").notNullable();
      t.string("ou").notNullable();
      t.string("country").notNullable();
      t.string("province").notNullable();
      t.string("locality").notNullable();
      t.string("commonName").notNullable();
      t.string("dn").notNullable();
      t.unique(["dn", "projectId"]);
      t.string("serialNumber").nullable().unique();
      t.integer("maxPathLength").nullable();
      t.datetime("notBefore").nullable();
      t.datetime("notAfter").nullable();
    });
  }

  if (!(await knex.schema.hasTable(TableName.CertificateAuthorityCert))) {
    // table to keep track of certificates belonging to CA
    await knex.schema.createTable(TableName.CertificateAuthorityCert, (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.timestamps(true, true, true);
      t.uuid("caId").notNullable().unique(); // TODO: consider that cert can be rotated so may be multiple / non-unique
      t.foreign("caId").references("id").inTable(TableName.CertificateAuthority).onDelete("CASCADE");
      t.text("certificate").notNullable(); // TODO: encrypt
      t.text("certificateChain").notNullable(); // TODO: encrypt
    });
  }

  // TODO: consider renaming this to CertificateAuthoritySecret
  if (!(await knex.schema.hasTable(TableName.CertificateAuthoritySk))) {
    await knex.schema.createTable(TableName.CertificateAuthoritySk, (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.timestamps(true, true, true);
      t.uuid("caId").notNullable().unique();
      t.foreign("caId").references("id").inTable(TableName.CertificateAuthority).onDelete("CASCADE");
      t.text("pk").notNullable(); // TODO: encrypt
      t.text("sk").notNullable(); // TODO: encrypt
    });
  }

  if (!(await knex.schema.hasTable(TableName.Certificate))) {
    // TODO: consider adding serialNumber
    await knex.schema.createTable(TableName.Certificate, (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.timestamps(true, true, true);
      t.uuid("caId").notNullable();
      t.foreign("caId").references("id").inTable(TableName.CertificateAuthority).onDelete("CASCADE");
      t.string("status").notNullable(); // active / pending-certificate
      t.string("serialNumber").notNullable().unique();
      t.string("commonName").notNullable();
      t.datetime("notBefore").notNullable();
      t.datetime("notAfter").notNullable();
    });
  }

  if (!(await knex.schema.hasTable(TableName.CertificateCert))) {
    await knex.schema.createTable(TableName.CertificateCert, (t) => {
      t.uuid("id", { primaryKey: true }).defaultTo(knex.fn.uuid());
      t.timestamps(true, true, true);
      t.uuid("certId").notNullable().unique();
      t.foreign("certId").references("id").inTable(TableName.Certificate).onDelete("CASCADE");
      t.text("certificate").notNullable(); // TODO: encrypt
      t.text("certificateChain").notNullable(); // TODO: encrypt
    });
  }

  await createOnUpdateTrigger(knex, TableName.CertificateAuthority);
  await createOnUpdateTrigger(knex, TableName.CertificateAuthorityCert);
  await createOnUpdateTrigger(knex, TableName.CertificateAuthoritySk);
  await createOnUpdateTrigger(knex, TableName.Certificate);
  await createOnUpdateTrigger(knex, TableName.CertificateCert);
}

export async function down(knex: Knex): Promise<void> {
  // certificates
  await knex.schema.dropTableIfExists(TableName.CertificateCert);
  await dropOnUpdateTrigger(knex, TableName.CertificateCert);

  await knex.schema.dropTableIfExists(TableName.Certificate);
  await dropOnUpdateTrigger(knex, TableName.Certificate);

  // certificate authorities
  await knex.schema.dropTableIfExists(TableName.CertificateAuthoritySk);
  await dropOnUpdateTrigger(knex, TableName.CertificateAuthoritySk);

  await knex.schema.dropTableIfExists(TableName.CertificateAuthorityCert);
  await dropOnUpdateTrigger(knex, TableName.CertificateAuthorityCert);

  await knex.schema.dropTableIfExists(TableName.CertificateAuthority);
  await dropOnUpdateTrigger(knex, TableName.CertificateAuthority);
}