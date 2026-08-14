export interface SyncReferenceDataInput {
  provinces: { codename: string; name: string }[];
  wards: { codename: string; name: string; provinceCodename: string }[];
}
