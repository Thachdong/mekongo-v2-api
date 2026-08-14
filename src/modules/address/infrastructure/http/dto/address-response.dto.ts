export class AddressResponseDto {
  id: string;
  label: string | null;
  street: string;
  ward: string;
  provinceId: string;
  isDefault: boolean;
}
