# Payroll Items by Month, Year, and Branch API Guide

## Endpoint Overview

**Endpoint:** `GET /payrolls/items/by-month-year-branch/:month/:year/:branchId`

**Description:** Retrieves all users in a specific branch with their payroll information for a given month and year. This endpoint returns comprehensive user details along with their salary information, advance payments, payment status, and bank details.

**Authentication:** Requires JWT Bearer Token

---

## Request Parameters

### Path Parameters

| Parameter | Type | Required | Description | Validation |
|-----------|------|----------|-------------|------------|
| `month` | Number | Yes | Payroll month | 1-12 |
| `year` | Number | Yes | Payroll year | 1900 - current year + 5 |
| `branchId` | String | Yes | MongoDB ObjectId of the branch | Valid ObjectId format |

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | Number | No | 1 | Page number for pagination |
| `limit` | Number | No | 10 | Number of records per page |

---

## Request Example

### cURL
```bash
curl -X GET \
  'http://localhost:3000/payrolls/items/by-month-year-branch/1/2026/65f8a1b2c3d4e5f6a7b8c9d0?page=1&limit=10' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### JavaScript (Fetch API)
```javascript
const response = await fetch(
  'http://localhost:3000/payrolls/items/by-month-year-branch/1/2026/65f8a1b2c3d4e5f6a7b8c9d0?page=1&limit=10',
  {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN',
      'Content-Type': 'application/json'
    }
  }
);
const data = await response.json();
```

### Axios
```javascript
const response = await axios.get(
  '/payrolls/items/by-month-year-branch/1/2026/65f8a1b2c3d4e5f6a7b8c9d0',
  {
    params: {
      page: 1,
      limit: 10
    },
    headers: {
      'Authorization': 'Bearer YOUR_JWT_TOKEN'
    }
  }
);
```

---

## Response Structure

### Success Response (200 OK)

```json
{
  "message": "Payroll Items retrieved successfully",
  "data": [
    {
      "userDetails": {
        "_id": "65f8a1b2c3d4e5f6a7b8c9d1",
        "fullName": "John Doe",
        "email": "john.doe@example.com",
        "employeeId": "EMP001",
        "phone": "+1234567890",
        "dateOfBirth": "1990-01-15T00:00:00.000Z",
        "gender": "MALE",
        "branch": {
          "_id": "65f8a1b2c3d4e5f6a7b8c9d0",
          "name": "Main Branch",
          "location": "New York",
          "code": "NYC001"
        },
        "company": {
          "_id": "65f8a1b2c3d4e5f6a7b8c9d2",
          "name": "Tech Corp",
          "registrationNumber": "REG123"
        },
        "role": {
          "_id": "65f8a1b2c3d4e5f6a7b8c9d3",
          "name": "Software Engineer",
          "type": "EMPLOYEE"
        }
      },
      "baseSalary": 5000,
      "advanceSalary": 500,
      "advancePayrollDetails": {
        "advanceId": "65f8a1b2c3d4e5f6a7b8c9d4",
        "advanceAmount": 500,
        "advanceStatus": "APPROVED",
        "advanceReason": "Emergency medical expenses",
        "appliedDate": "2026-01-10T10:30:00.000Z"
      },
      "payrollStatus": "PENDING",
      "currency": "USD",
      "paymentMode": "BANK_TRANSFER",
      "bankDetail": {
        "accountNumber": "1234567890",
        "accountHolderName": "John Doe",
        "bankName": "Chase Bank",
        "ifscCode": "CHASE0001",
        "accountType": "SAVINGS"
      }
    }
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "pages": 5
  }
}
```

---

## Response Fields

### Main Response Object

| Field | Type | Description |
|-------|------|-------------|
| `message` | String | Success message |
| `data` | Array | Array of user payroll data objects |
| `pagination` | Object | Pagination information |

### User Payroll Data Object

| Field | Type | Description |
|-------|------|-------------|
| `userDetails` | Object | Complete user information |
| `baseSalary` | Number/null | Base salary from payroll item (null if payroll not created yet) |
| `advanceSalary` | Number | Advance amount taken (0 if no advance) |
| `advancePayrollDetails` | Object/null | Latest advance payroll details (null if no advance) |
| `payrollStatus` | String | Status from payroll item or 'PENDING' if not created |
| `currency` | String/null | Currency from payroll item (null if not created) |
| `paymentMode` | String/null | Payment mode from payroll item (null if not created) |
| `bankDetail` | Object/null | Bank account details (null if not configured) |

### User Details Object

| Field | Type | Description |
|-------|------|-------------|
| `_id` | String | User MongoDB ObjectId |
| `fullName` | String | Full name of the user |
| `email` | String | Email address |
| `employeeId` | String | Employee identification number |
| `phone` | String | Contact phone number |
| `dateOfBirth` | Date | Date of birth |
| `gender` | String | Gender (MALE/FEMALE/OTHER) |
| `branch` | Object | Branch information |
| `company` | Object | Company information |
| `role` | Object | Role information |

### Advance Payroll Details Object

| Field | Type | Description |
|-------|------|-------------|
| `advanceId` | String | Advance payroll MongoDB ObjectId |
| `advanceAmount` | Number | Amount of advance taken |
| `advanceStatus` | String | Status of advance (PENDING/APPROVED/REJECTED/PAID) |
| `advanceReason` | String | Reason for advance request |
| `appliedDate` | Date | Date when advance was applied |

### Bank Detail Object

| Field | Type | Description |
|-------|------|-------------|
| `accountNumber` | String | Bank account number |
| `accountHolderName` | String | Name of account holder |
| `bankName` | String | Name of the bank |
| `ifscCode` | String | IFSC/routing code |
| `accountType` | String | Type of account (SAVINGS/CURRENT) |

### Pagination Object

| Field | Type | Description |
|-------|------|-------------|
| `total` | Number | Total number of users in the branch |
| `page` | Number | Current page number |
| `pages` | Number | Total number of pages |

---

## Payroll Status Values

| Status | Description |
|--------|-------------|
| `PENDING` | Payroll not yet processed (default if no payroll item exists) |
| `PAID` | Salary has been disbursed |

---

## Use Cases

### 1. **Monthly Payroll Processing**
Use this endpoint to get all employees in a branch who need to be paid for a specific month. The endpoint returns users even if their payroll hasn't been created yet, making it perfect for initiating the payroll process.

### 2. **Payroll Status Tracking**
Monitor which employees have been paid (status: PAID) and which are still pending payment for the month.

### 3. **Advance Salary Management**
View which employees have taken advance salaries and their amounts, helping in net salary calculation.

### 4. **Branch-wise Payroll Reports**
Generate branch-specific payroll reports with complete employee details, salary information, and payment status.

### 5. **Payment Processing**
Use the bank details provided to process salary payments via bank transfer or other payment modes.

---

## Error Responses

### 400 Bad Request - Invalid Month
```json
{
  "statusCode": 400,
  "message": "Invalid month. Must be between 1 and 12.",
  "error": "Bad Request"
}
```

### 400 Bad Request - Invalid Year
```json
{
  "statusCode": 400,
  "message": "Invalid year.",
  "error": "Bad Request"
}
```

### 400 Bad Request - Invalid Branch ID
```json
{
  "statusCode": 400,
  "message": "Invalid Branch ID",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## Important Notes

1. **User-First Approach**: This endpoint returns ALL users in the specified branch, regardless of whether a payroll item exists for them in the given month. Users without payroll items will have `payrollStatus` set to 'PENDING' and `baseSalary`, `currency`, and `paymentMode` set to `null`.

2. **Advance Salary**: The `advanceSalary` field shows the latest advance amount taken by the employee. Use `advancePayrollDetails` for complete advance information including status and reason.

3. **Pagination**: The endpoint supports pagination. The `total` count represents all users in the branch, not just those with payroll items.

4. **Bank Details**: Bank details are fetched from the user's bank account configuration. If not configured, `bankDetail` will be `null`.

5. **Payroll Master Required**: If no payroll master exists for the specified month and year, the endpoint returns an empty data array with pagination showing 0 records.

---

## Workflow Example

### Step 1: Fetch Users for Payroll Processing
```javascript
// Get all users in branch for January 2026
const response = await fetch(
  '/payrolls/items/by-month-year-branch/1/2026/65f8a1b2c3d4e5f6a7b8c9d0'
);
const { data, pagination } = await response.json();

console.log(`Found ${pagination.total} employees in this branch`);
```

### Step 2: Filter Users by Status
```javascript
// Separate paid and pending employees
const paidEmployees = data.filter(item => item.payrollStatus === 'PAID');
const pendingEmployees = data.filter(item => item.payrollStatus === 'PENDING');

console.log(`Paid: ${paidEmployees.length}, Pending: ${pendingEmployees.length}`);
```

### Step 3: Calculate Net Salary
```javascript
// Calculate net salary considering advance
data.forEach(item => {
  const netSalary = (item.baseSalary || 0) - item.advanceSalary;
  console.log(`${item.userDetails.fullName}: Net Salary = ${netSalary}`);
});
```

### Step 4: Process Payments
```javascript
// Process payment for employees with bank details
const readyForPayment = data.filter(item => 
  item.payrollStatus === 'PENDING' && 
  item.bankDetail !== null &&
  item.baseSalary !== null
);

for (const item of readyForPayment) {
  await processPayment({
    accountNumber: item.bankDetail.accountNumber,
    amount: item.baseSalary - item.advanceSalary,
    employeeName: item.userDetails.fullName
  });
}
```

---

## Integration Tips

1. **Fetch Payroll Master First**: Before calling this endpoint, consider checking if a payroll master exists for the month/year using the payroll master endpoints.

2. **Batch Processing**: Use pagination to process large numbers of employees in batches to avoid memory issues.

3. **Status Updates**: After processing payments, update the payroll item status to 'PAID' using the update status endpoint.

4. **Error Handling**: Always implement proper error handling for invalid parameters and authentication failures.

5. **Caching**: Consider caching the results for a short period if multiple users need to access the same data frequently.

---

## Related API Endpoints

- `POST /payrolls` - Create payroll master for a month/year
- `POST /payrolls/bulk` - Create payroll items in bulk
- `PATCH /payrolls/item/:id/status` - Update payroll item status
- `GET /payrolls/:id` - Get payroll master details with items
- `GET /payrolls/item` - List all payroll items with filters

---

## Version Information

- **API Version**: 1.0
- **Last Updated**: January 2026
- **Endpoint Status**: Active
