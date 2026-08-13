export interface AddressView {
  id: string;
  accountId: string;
  label: string | null;
  street: string;
  ward: string;
  provinceId: string;
  isDefault: boolean;
}
