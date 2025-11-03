//export const VALID_STATUS_VALUES = ["Backlog", "Overdue", "In Progress", "Approved", "In Review", "FI", "PI", "NI", "NA", "TBD", "OFI", "Obs", "NC- Minor", "NC- Major"];

export const VALID_STATUS_VALUES = ["Not Done", "Partially Done", "In-Progress", "Largely Done", "Done", "NA"];
export const VALID_PRIORITY_VALUES = ["High", "Medium", "Low"];
export const VALID_TASK_TYPES = ["Control", "Process", "Procedure", "Monitoring", "Material"];
export const VALID_TASK_CHANGE_FIELDS = ["status", "priority", "assignment","document","task"];
export const VALID_COMPLIANCE_VALUES = ["Yes", "No", "Partial", "Not Applicable"];
export const VALID_TYPE_OF_FINDING = ["Compliance","Observation","Non-Compliance","Opportunity For Improvement"];
export const VALID_STANDARDS =["ISO_9001","ISO_27001"];

export const  VALID_STATUSWEIGHTAGE =  {
    "Not Done": 0,
    "Partially Done": 25,
    "In-Progress": 50,
    "Largely Done":75,
    "Done":100,
    "NA":100,    
  }