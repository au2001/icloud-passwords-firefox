import sjcl from "sjcl";

export const BROWSER_NAME = "Firefox";

export const GRP = sjcl.keyexchange.srp.knownGroup(3072);
export const KEY_LEN = 128;

export enum Command {
  EndOp = 0,
  Unused1 = 1,
  ChallengePIN = 2,
  SetIconNTitle = 3,
  GetLoginNames4URL = 4,
  GetPassword4LoginName = 5,
  SetPassword4LoginName_URL = 6,
  NewAccount4URL = 7,
  TabEvent = 8,
  PasswordsDisabled = 9,
  ReloginNeeded = 10,
  LaunchiCP = 11,
  iCPStateChange = 12,
  LaunchPasswordsApp = 13,
  Hello = 14,
  OneTimeCodeAvailable = 15,
  GetOneTimeCodes = 16,
  DidFillOneTimeCode = 17,
  OpenURLInSafari = 1984,
}

export enum SecretSessionVersion {
  SRPWithOldVerification = 0,
  SRPWithRFCVerification = 1,
}

export enum MSGTypes {
  MSG0 = 0,
  MSG1 = 1,
  MSG2 = 2,
  MSG3 = 3,
}

export enum Action {
  Unknown = -1,
  Delete = 0,
  Update = 1,
  Search = 2,
  AddNew = 3,
  MaybeAdd = 4,
  GhostSearch = 5,
}

export enum QueryStatus {
  Success = 0,
  NoResults = 3,
}
