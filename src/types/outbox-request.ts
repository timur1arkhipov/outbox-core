import { CurrentUser } from '@rolfcorp/nestjs-auth';
import { Transaction } from 'sequelize';

export interface OutboxRequest extends Request {
  userInfo: CurrentUser;
  transaction?: Transaction;
}
