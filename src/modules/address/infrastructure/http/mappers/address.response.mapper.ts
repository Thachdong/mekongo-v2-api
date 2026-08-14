import { AddressView } from '../../../application/dto/address-view.dto';
import { AddressResponseDto } from '../dto/address-response.dto';

export class AddressResponseMapper {
  static toApi(address: AddressView): AddressResponseDto {
    return {
      id: address.id,
      label: address.label,
      street: address.street,
      ward: address.ward,
      provinceId: address.provinceId,
      isDefault: address.isDefault,
    };
  }
}
