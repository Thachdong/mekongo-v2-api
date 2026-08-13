// Public API của account module — chỉ export Facade + type/DTO ở boundary.
// KHÔNG export use-case, port, adapter, repository, domain entity nội bộ.
export {
  AccountFacade,
  AccountView,
  ChangePasswordResult,
  AccountActionResult,
} from './account.facade';
export { AccountModule } from './account.module';
