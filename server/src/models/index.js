import { AuthSessionModel } from './AuthSessionModel.js';
import { CitizenModel } from './CitizenModel.js';
import { ComplaintModel } from './ComplaintModel.js';
import { ComplaintResponseModel } from './ComplaintResponseModel.js';
import { EscalationModel } from './EscalationModel.js';
import { InstitutionDepartmentModel } from './InstitutionDepartmentModel.js';
import { InstitutionEmployeeModel } from './InstitutionEmployeeModel.js';
import { InstitutionModel } from './InstitutionModel.js';
import { InstitutionQrCodeModel } from './InstitutionQrCodeModel.js';
import { RegistrationInviteModel } from './RegistrationInviteModel.js';
import { UserModel } from './UserModel.js';
import { VoiceRecordModel } from './VoiceRecordModel.js';

InstitutionModel.hasMany(UserModel, {
  foreignKey: 'institutionId',
  as: 'users',
});
UserModel.belongsTo(InstitutionModel, {
  foreignKey: 'institutionId',
  as: 'institution',
});

UserModel.hasOne(CitizenModel, {
  foreignKey: 'userId',
  as: 'citizenProfile',
});
CitizenModel.belongsTo(UserModel, {
  foreignKey: 'userId',
  as: 'userAccount',
});

InstitutionModel.hasMany(InstitutionDepartmentModel, {
  foreignKey: 'institutionId',
  as: 'departments',
});
InstitutionDepartmentModel.belongsTo(InstitutionModel, {
  foreignKey: 'institutionId',
  as: 'institution',
});

InstitutionModel.hasMany(InstitutionEmployeeModel, {
  foreignKey: 'institutionId',
  as: 'employees',
});
InstitutionEmployeeModel.belongsTo(InstitutionModel, {
  foreignKey: 'institutionId',
  as: 'institution',
});

InstitutionDepartmentModel.hasMany(InstitutionEmployeeModel, {
  foreignKey: 'departmentId',
  as: 'employees',
});
InstitutionEmployeeModel.belongsTo(InstitutionDepartmentModel, {
  foreignKey: 'departmentId',
  as: 'department',
});

UserModel.hasMany(InstitutionEmployeeModel, {
  foreignKey: 'userId',
  as: 'employeeAssignments',
});
InstitutionEmployeeModel.belongsTo(UserModel, {
  foreignKey: 'userId',
  as: 'userAccount',
});

UserModel.hasMany(RegistrationInviteModel, {
  foreignKey: 'createdByUserId',
  as: 'createdInvites',
});
RegistrationInviteModel.belongsTo(UserModel, {
  foreignKey: 'createdByUserId',
  as: 'createdByUser',
});

InstitutionModel.hasMany(RegistrationInviteModel, {
  foreignKey: 'usedByInstitutionId',
  as: 'consumedInvites',
});
RegistrationInviteModel.belongsTo(InstitutionModel, {
  foreignKey: 'usedByInstitutionId',
  as: 'usedByInstitution',
});

InstitutionModel.hasMany(ComplaintModel, {
  foreignKey: 'institutionId',
  as: 'complaints',
});
ComplaintModel.belongsTo(InstitutionModel, {
  foreignKey: 'institutionId',
  as: 'institution',
});

CitizenModel.hasMany(ComplaintModel, {
  foreignKey: 'citizenId',
  as: 'complaints',
});
ComplaintModel.belongsTo(CitizenModel, {
  foreignKey: 'citizenId',
  as: 'citizen',
});

InstitutionEmployeeModel.hasMany(ComplaintModel, {
  foreignKey: 'assignedOfficerId',
  as: 'assignedComplaints',
});
ComplaintModel.belongsTo(InstitutionEmployeeModel, {
  foreignKey: 'assignedOfficerId',
  as: 'assignedOfficer',
});

UserModel.hasMany(ComplaintModel, {
  foreignKey: 'assignedUserId',
  as: 'assignedCases',
});
ComplaintModel.belongsTo(UserModel, {
  foreignKey: 'assignedUserId',
  as: 'assignedUser',
});

ComplaintModel.hasMany(ComplaintResponseModel, {
  foreignKey: 'complaintId',
  as: 'responses',
});
ComplaintResponseModel.belongsTo(ComplaintModel, {
  foreignKey: 'complaintId',
  as: 'complaint',
});

UserModel.hasMany(ComplaintResponseModel, {
  foreignKey: 'responderUserId',
  as: 'responses',
});
ComplaintResponseModel.belongsTo(UserModel, {
  foreignKey: 'responderUserId',
  as: 'responderUser',
});

InstitutionEmployeeModel.hasMany(ComplaintResponseModel, {
  foreignKey: 'responderEmployeeId',
  as: 'responses',
});
ComplaintResponseModel.belongsTo(InstitutionEmployeeModel, {
  foreignKey: 'responderEmployeeId',
  as: 'responderEmployee',
});

ComplaintModel.hasMany(EscalationModel, {
  foreignKey: 'complaintId',
  as: 'escalations',
});
EscalationModel.belongsTo(ComplaintModel, {
  foreignKey: 'complaintId',
  as: 'complaint',
});

UserModel.hasMany(EscalationModel, {
  foreignKey: 'escalatedByUserId',
  as: 'escalationsTriggered',
});
EscalationModel.belongsTo(UserModel, {
  foreignKey: 'escalatedByUserId',
  as: 'escalatedByUser',
});

ComplaintModel.hasMany(VoiceRecordModel, {
  foreignKey: 'complaintId',
  as: 'voiceRecords',
});
VoiceRecordModel.belongsTo(ComplaintModel, {
  foreignKey: 'complaintId',
  as: 'complaint',
});

InstitutionModel.hasMany(InstitutionQrCodeModel, {
  foreignKey: 'institutionId',
  as: 'qrCodes',
});
InstitutionQrCodeModel.belongsTo(InstitutionModel, {
  foreignKey: 'institutionId',
  as: 'institution',
});

UserModel.hasMany(InstitutionQrCodeModel, {
  foreignKey: 'createdByUserId',
  as: 'issuedQrCodes',
});
InstitutionQrCodeModel.belongsTo(UserModel, {
  foreignKey: 'createdByUserId',
  as: 'issuedByUser',
});

UserModel.hasMany(AuthSessionModel, {
  foreignKey: 'userId',
  as: 'sessions',
});
AuthSessionModel.belongsTo(UserModel, {
  foreignKey: 'userId',
  as: 'user',
});

export {
  AuthSessionModel,
  CitizenModel,
  ComplaintModel,
  ComplaintResponseModel,
  EscalationModel,
  InstitutionDepartmentModel,
  InstitutionEmployeeModel,
  InstitutionModel,
  InstitutionQrCodeModel,
  RegistrationInviteModel,
  UserModel,
  VoiceRecordModel,
};
