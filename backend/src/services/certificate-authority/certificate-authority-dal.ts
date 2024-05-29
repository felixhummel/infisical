import { TDbClient } from "@app/db";
import { TableName } from "@app/db/schemas";
import { DatabaseError } from "@app/lib/errors";
import { ormify } from "@app/lib/knex";

export type TCertificateAuthorityDALFactory = ReturnType<typeof certificateAuthorityDALFactory>;

export const certificateAuthorityDALFactory = (db: TDbClient) => {
  const caOrm = ormify(db, TableName.CertificateAuthority);

  const buildCertificateChain = async (caId: string) => {
    try {
      const result: {
        caId: string;
        parentCaId?: string;
        certificate: string;
      }[] = await db
        .withRecursive("cte", (cte) => {
          void cte
            .select("ca.id as caId", "ca.parentCaId", "cert.certificate")
            .from({ ca: TableName.CertificateAuthority })
            .leftJoin({ cert: TableName.CertificateAuthorityCert }, "ca.id", "cert.caId")
            .where("ca.id", caId)
            .unionAll((builder) => {
              void builder
                .select("ca.id as caId", "ca.parentCaId", "cert.certificate")
                .from({ ca: TableName.CertificateAuthority })
                .leftJoin({ cert: TableName.CertificateAuthorityCert }, "ca.id", "cert.caId")
                .innerJoin("cte", "cte.parentCaId", "ca.id");
            });
        })
        .select("*")
        .from("cte");

      // Extract certificates and reverse the order to have the root CA at the end
      const certChain: string[] = result.map((row) => row.certificate);
      return certChain;
    } catch (error) {
      throw new DatabaseError({ error, name: "BuildCertificateChain" });
    }
  };

  return {
    ...caOrm,
    buildCertificateChain
  };
};