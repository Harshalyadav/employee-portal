import { IPagination } from "./branch.type";
import { IRole } from "./role.type";

export interface IAdminHeadBranch {
  _id?: string;
  id?: string;
  branchName?: string;
  name?: string;
}

export interface IAdminHeadRole {
  _id?: string;
  id?: string;
  roleName?: string;
  name?: string;
}

export interface IAdminHeadPermissionDesignation {
  _id?: string;
  id?: string;
  roleName?: string;
  name?: string;
}

export interface IAdminHeadPermissions {
  designation?: IAdminHeadPermissionDesignation | string;
  branches?: Array<IAdminHeadBranch | string>;
}

export interface IAdminHeadAddress {
  addressLine?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
}

export interface IAdminHead {
  _id?: string;
  id?: string;
  name?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  address?: string;
  userId?: string;
  uid?: string;
  uniqueWorkerId?: string;
  employeeId?: string;
  status?: string;
  permanentAddress?: IAdminHeadAddress;
  currentAddress?: IAdminHeadAddress;
  roleId?: string | IRole;
  role?: string | IRole | IAdminHeadRole;
  branches?: Array<IAdminHeadBranch | string>;
  permissions?: IAdminHeadPermissions | string[];
  createdAt?: string;
  updatedAt?: string;
  referenceBy?: string;
  referencePhone?: string;
}

export interface IAdminHeadListResponse {
  data: IAdminHead[];
  pagination: IPagination;
}

export interface IAdminHeadUpsertRequest {
  name?: string;
  email?: string;
  password?: string;
  phoneNumber?: string;
  address?: string;
  roleId?: string;
  status?: string;
  userId?: string;
  branches?: string[];
  permissions?: {
    designation?: {
      id?: string;
      name?: string;
    };
    branches?: Array<{
      id?: string;
      name?: string;
    }>;
  };
  referenceBy?: string;
  referencePhone?: string;
}