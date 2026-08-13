import { ProvinceView } from '../../../application/dto/province-view.dto';
import { WardView } from '../../../application/dto/ward-view.dto';
import { ProvinceResponseDto } from '../dto/province-response.dto';
import { WardResponseDto } from '../dto/ward-response.dto';

export class ReferenceDataResponseMapper {
  static toProvinceApi(province: ProvinceView): ProvinceResponseDto {
    return { codename: province.codename, name: province.name };
  }

  static toWardApi(ward: WardView): WardResponseDto {
    return {
      codename: ward.codename,
      name: ward.name,
      provinceCodename: ward.provinceCodename,
    };
  }
}
