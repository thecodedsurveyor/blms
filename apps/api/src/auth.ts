import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { LocalUser, Role } from "@blms/shared";
import { AppError } from "./errors.js";

type StoredUser = LocalUser & { passwordHash: string };
const secret = () => process.env.JWT_SECRET || "local-only-blms-secret";
const passwordFor = (username: string) => username.startsWith("government") ? (process.env.DEMO_GOVERNMENT_PASSWORD || "Government123!") : username === "admin" ? (process.env.DEMO_ADMIN_PASSWORD || "Admin123!") : (process.env.DEMO_CITIZEN_PASSWORD || "Citizen123!");

export const users: StoredUser[] = [
  ["USR-001", "citizen.seller", "Amina Yusuf", "CITIZEN", "CitizenOrg", "10000000001", "citizen.seller"],
  ["USR-002", "citizen.buyer", "Chinedu Okafor", "CITIZEN", "CitizenOrg", "10000000002", "citizen.buyer"],
  ["USR-003", "government.officer", "Bola Adeyemi", "GOVERNMENT_OFFICER", "GovernmentOrg", "20000000001", "government.officer"],
  ["USR-004", "admin", "Ifeoma Nwosu", "ADMIN", "GovernmentOrg", "20000000002", "admin"]
].map(([id, username, fullName, role, organisation, nin, fabricIdentityLabel]) => ({ id, username, fullName, role: role as Role, organisation: organisation as LocalUser["organisation"], nin, fabricIdentityLabel, active: true, passwordHash: bcrypt.hashSync(passwordFor(username), 10) }));

export const publicUser = (user: StoredUser): LocalUser => { const { passwordHash: _passwordHash, ...safe } = user; return safe; };

export function authenticate(username: string, password: string) { const user = users.find((item) => item.username === username); if (!user || !bcrypt.compareSync(password, user.passwordHash) || !user.active) throw new AppError(401, "INVALID_LOGIN", "Invalid username or password"); return user; }
export function issueToken(user: LocalUser) { return jwt.sign({ sub: user.id, role: user.role }, secret(), { expiresIn: "2h" }); }
export function readToken(token: string) { try { return jwt.verify(token, secret()) as { sub: string; role: Role }; } catch { throw new AppError(401, "UNAUTHENTICATED", "Authentication required"); } }
