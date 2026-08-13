// Public API của profile module — chỉ export Facade + type/DTO ở boundary.
// KHÔNG export use-case, port, adapter, repository, domain entity nội bộ.
// TProfileType là plain union type gắn với field bắt buộc khi gọi Facade — được phép export.
export { ProfileFacade, ProfileView } from './profile.facade';
export { ProfileModule } from './profile.module';
export { TProfileType } from './domain/profile.entity';
