import { z } from "zod";

export const RoleSchema = z.enum(["CITIZEN", "GOVERNMENT_OFFICER", "ADMIN"]);
export type Role = z.infer<typeof RoleSchema>;
export const OrganisationSchema = z.enum(["CitizenOrg", "GovernmentOrg"]);
export type Organisation = z.infer<typeof OrganisationSchema>;

export const LocalUserSchema = z.object({
  id: z.string(), username: z.string(), fullName: z.string(), role: RoleSchema,
  organisation: OrganisationSchema, nin: z.string(), fabricIdentityLabel: z.string(), active: z.boolean()
});
export type LocalUser = z.infer<typeof LocalUserSchema>;

export const LandAssetSchema = z.object({
  propertyId: z.string(), parcelNumber: z.string(), titleNumber: z.string(), ownerNinRef: z.string(), ownerName: z.string(),
  state: z.string(), lga: z.string(), address: z.string(), latitude: z.number(), longitude: z.number(), sizeSqM: z.number(),
  assessedValueKobo: z.number().int(), askingPriceKobo: z.number().int(), outstandingLevyKobo: z.number().int(),
  documentCid: z.string().nullable(), documentName: z.string().nullable(), status: z.enum(["REGISTERED", "TRANSFER_PENDING", "TRANSFERRED"]),
  listedForSale: z.boolean(), createdAt: z.string(), updatedAt: z.string(), version: z.number().int()
});
export type LandAsset = z.infer<typeof LandAssetSchema>;

export type AuditEvent = { id: string; action: string; actor: string; organisation: Organisation; propertyId?: string; status: "SUCCESS" | "FAILED"; timestamp: string; detail: string };
export type TransactionRecord = { id: string; propertyId: string; action: string; from?: string; to?: string; amountKobo?: number; timestamp: string; status: "SUCCESS" | "FAILED"; detail: string };

export type SyntheticIdentityRecord = {
  nin: string;
  fullName: string;
  dateOfBirth: string;
  status: "ACTIVE" | "DISABLED";
  permittedOrganisation: Organisation;
  synthetic: true;
};

const syntheticNames = ["Amina Yusuf", "Chinedu Okafor", "Bola Adeyemi", "Ifeoma Nwosu", "Sani Bello", "Ngozi Eze", "Tunde Balogun", "Zainab Musa", "Emeka Obi", "Fatima Ibrahim"];
export const syntheticIdentityRecords: SyntheticIdentityRecord[] = Array.from({ length: 200 }, (_, index) => ({
  nin: String(10000000001 + index),
  fullName: syntheticNames[index % syntheticNames.length],
  dateOfBirth: `${1975 + (index % 25)}-${String((index % 12) + 1).padStart(2, "0")}-${String((index % 27) + 1).padStart(2, "0")}`,
  status: index % 37 === 0 && index > 0 ? "DISABLED" : "ACTIVE",
  permittedOrganisation: index % 3 === 0 ? "GovernmentOrg" : "CitizenOrg",
  synthetic: true
}));
syntheticIdentityRecords[0] = { nin: "10000000001", fullName: "Amina Yusuf", dateOfBirth: "1990-04-12", status: "ACTIVE", permittedOrganisation: "CitizenOrg", synthetic: true };
syntheticIdentityRecords[1] = { nin: "10000000002", fullName: "Chinedu Okafor", dateOfBirth: "1988-11-03", status: "ACTIVE", permittedOrganisation: "CitizenOrg", synthetic: true };
syntheticIdentityRecords[2] = { nin: "20000000001", fullName: "Bola Adeyemi", dateOfBirth: "1982-06-18", status: "ACTIVE", permittedOrganisation: "GovernmentOrg", synthetic: true };
syntheticIdentityRecords[3] = { nin: "20000000002", fullName: "Ifeoma Nwosu", dateOfBirth: "1985-09-27", status: "ACTIVE", permittedOrganisation: "GovernmentOrg", synthetic: true };

export const maskNin = (nin: string) => nin.length < 4 ? "••••" : `${nin.slice(0, 2)}••••${nin.slice(-2)}`;
export const getSyntheticIdentity = (nin: string) => syntheticIdentityRecords.find((record) => record.nin === nin);
export const verifySyntheticIdentity = (nin: string, fullName: string, organisation?: Organisation, dateOfBirth?: string) => {
  const record = getSyntheticIdentity(nin);
  if (!record || record.status !== "ACTIVE" || record.fullName.toLowerCase() !== fullName.trim().toLowerCase() || (organisation && record.permittedOrganisation !== organisation) || (dateOfBirth && record.dateOfBirth !== dateOfBirth)) return { verified: false as const, reason: "Synthetic identity could not be verified" };
  return { verified: true as const, record: { nin: record.nin, fullName: record.fullName, dateOfBirth: record.dateOfBirth, status: record.status, permittedOrganisation: record.permittedOrganisation, synthetic: true as const } };
};

export const RegisterLandInputSchema = z.object({
  parcelNumber: z.string().trim().min(3), titleNumber: z.string().trim().min(3), state: z.string().trim().min(2),
  lga: z.string().trim().min(2), address: z.string().trim().min(5), latitude: z.number(), longitude: z.number(),
  sizeSqM: z.number().positive(), assessedValueKobo: z.number().int().nonnegative()
});
export type RegisterLandInput = z.infer<typeof RegisterLandInputSchema>;
