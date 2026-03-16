import { AccountCreationRequest } from './bank.account.creation.model';

/**
 * An user is a special type of customer, capable to login and access all
 * applications.
 */
export class User 
{
    public id?: string;
    public email?: string;
    public accountCreationRequest?: AccountCreationRequest;
    public name?: string;
}
