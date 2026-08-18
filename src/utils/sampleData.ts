import { SampleDataset } from '../types';

export const SAMPLE_DATASETS: SampleDataset[] = [
  {
    id: 'courier_dispatch',
    title: 'Courier & Parcel Dispatch Log',
    titleHi: 'कूरियर और पार्सल ट्रैकिंग डेटा (Space Separated)',
    category: 'Logistics',
    description: 'Messy space-separated courier dispatch log with customer names, dates, tracking IDs, amounts and statuses.',
    descriptionHi: 'अनियमित स्पेस वाला पार्सल डेटा जिसमें नाम, दिनांक, ट्रैकिंग नंबर और अमाउंट शामिल हैं।',
    rawText: `TRACK_ID     CUSTOMER_NAME        DATE         CITY         WEIGHT_KG   AMOUNT_INR   STATUS
EXP-90812    Rahul Sharma        12/04/2025   Mumbai       2.5         1450.00      Delivered
EXP-90813    Pooja Patel         12/04/2025   Ahmedabad    1.2         780.50       In-Transit
EXP-90814    Amit Kumar Verma    13/04/2025   New Delhi    5.0         3200.00      Out-for-Delivery
EXP-90815    Sneha Rao           13/04/2025   Bengaluru    0.8         450.00       Delivered
--- BATCH COMPLETED 13-04-2025 ---
EXP-90816    Vikram Singh        14/04/2025   Jaipur       3.4         2100.00      Pending
EXP-90817    Ananya Iyer         14/04/2025   Chennai      1.8         1150.00      Delivered
EXP-90818    Mohammed Farhan     15/04/2025   Hyderabad    4.2         2650.00      In-Transit
EXP-90819    Kavita Deshmukh     15/04/2025   Pune         2.1         1320.00      Delivered`,
    suggestedScript: {
      version: '1.0',
      id: 'script_courier_dispatch',
      name: 'Courier Dispatch Cleaning Recipe',
      description: 'Cleans space separated courier report, filters out batch footer rows, and structures headers.',
      createdAt: '2025-04-15T10:00:00.000Z',
      updatedAt: '2025-04-15T10:00:00.000Z',
      actions: [
        {
          id: 'act_init_1',
          type: 'INITIAL_SPLIT',
          title: 'Initial Whitespace Split',
          enabled: true,
          config: {
            delimiter: 'spaces',
            treatConsecutiveSpacesAsOne: true,
            trimEachCell: true,
            removeEmptyInitialRows: true,
            firstRowIsHeader: false,
          },
        },
        {
          id: 'act_filter_banner',
          type: 'FILTER_ROWS',
          title: 'Remove Batch Divider Lines',
          description: 'Removes "---" divider rows',
          enabled: true,
          condition: 'not_contains',
          value: '---',
        },
        {
          id: 'act_header',
          type: 'SET_HEADERS_FROM_ROW',
          title: 'Set Top Row as Column Headers',
          enabled: true,
          rowIndex: 0,
          removeHeaderRow: true,
        },
        {
          id: 'act_trim_all',
          type: 'TRIM_SPACES',
          title: 'Trim All Cell Whitespace',
          enabled: true,
          trimType: 'both',
        },
      ],
    },
  },
  {
    id: 'bank_statement',
    title: 'Bank Statement Print Dump',
    titleHi: 'बैंक स्टेटमेंट टेक्स्ट डंप (Space Separated)',
    category: 'Finance',
    description: 'Raw bank transaction dump with mixed spaces, transaction refs, debit/credit and running balance.',
    descriptionHi: 'बैंक का टेक्स्ट डंप जिसमें तारीख, रेफ़रेंस, डेबिट/क्रेडिट और बैलेंस शामिल हैं।',
    rawText: `DATE         TRANSACTION_REF       TYPE       AMOUNT_INR    BALANCE_INR    REMARKS
01/05/2025   UPI/51293849/Zomato   DEBIT      420.00        58420.00       FOOD_ORDER
02/05/2025   SALARY/INFY/MAY25     CREDIT     75000.00      133420.00      MONTHLY_PAY
03/05/2025   ATM/WDL/KORAMANGALA   DEBIT      5000.00       128420.00      CASH_WITHDRAWAL
04/05/2025   NEFT/RENT/OWNER       DEBIT      22000.00      106420.00      HOUSE_RENT
*** PAGE 1 OF STATEMENT END ***
06/05/2025   INT/CREDIT/Q1         CREDIT     1450.00       107870.00      SAVINGS_INTEREST
08/05/2025   UPI/99812301/AMZN     DEBIT      3499.00       104371.00      SHOPPING`,
    suggestedScript: {
      version: '1.0',
      id: 'script_bank_statement',
      name: 'Bank Statement Parser Recipe',
      description: 'Strips page numbers, splits spaces, formats headings, and standardizes amounts.',
      createdAt: '2025-05-08T10:00:00.000Z',
      updatedAt: '2025-05-08T10:00:00.000Z',
      actions: [
        {
          id: 'act_init_bank',
          type: 'INITIAL_SPLIT',
          title: 'Space Separation',
          enabled: true,
          config: {
            delimiter: 'spaces',
            treatConsecutiveSpacesAsOne: true,
            trimEachCell: true,
            removeEmptyInitialRows: true,
            firstRowIsHeader: false,
          },
        },
        {
          id: 'act_rm_page',
          type: 'FILTER_ROWS',
          title: 'Filter Page Break Lines',
          enabled: true,
          condition: 'not_contains',
          value: 'PAGE',
        },
        {
          id: 'act_headers',
          type: 'SET_HEADERS_FROM_ROW',
          title: 'Promote First Line to Headers',
          enabled: true,
          rowIndex: 0,
          removeHeaderRow: true,
        },
        {
          id: 'act_prefix',
          type: 'PREFIX_SUFFIX',
          title: 'Add Currency Symbol to Amount',
          enabled: true,
          targetColumnIndex: 3,
          prefix: '₹',
          suffix: '',
        },
      ],
    },
  },
  {
    id: 'employee_payroll',
    title: 'Staff Payroll & Department Records',
    titleHi: 'कर्मचारी सैलरी और विभाग डेटा',
    category: 'HR / Payroll',
    description: 'Tabular list with employee IDs, first name, last name, department, role, and monthly salary.',
    descriptionHi: 'कर्मचारियों की आईडी, नाम, उपनाम, विभाग और सैलरी का टेक्स्ट डेटा।',
    rawText: `EMP001 Suresh Raina Engineering Lead 125000 Active
EMP002 Priya Sharma Marketing Specialist 85000 Active
EMP003 Rohan Mehta Design UI/UX 72000 Active
EMP004 Neha Gupta Sales Manager 95000 Active
EMP005 Arvind Swaminathan Engineering Senior_Dev 110000 Active
EMP006 Tanvi Joshi Human_Resources Recruiter 60000 Active
EMP007 Rajesh Pillai Finance Accountant 78000 Active`,
    suggestedScript: {
      version: '1.0',
      id: 'script_payroll',
      name: 'Payroll Tabular Formatter',
      description: 'Merges first and last name columns, assigns clear headers, and formats salary values.',
      createdAt: '2025-05-10T10:00:00.000Z',
      updatedAt: '2025-05-10T10:00:00.000Z',
      actions: [
        {
          id: 'act_init_pay',
          type: 'INITIAL_SPLIT',
          title: 'Space Delimiter Split',
          enabled: true,
          config: {
            delimiter: 'spaces',
            treatConsecutiveSpacesAsOne: true,
            trimEachCell: true,
            removeEmptyInitialRows: true,
            firstRowIsHeader: false,
          },
        },
        {
          id: 'act_merge_names',
          type: 'MERGE_COLUMNS',
          title: 'Combine First Name & Last Name',
          enabled: true,
          columnIndices: [1, 2],
          separator: ' ',
          targetColumnName: 'Full Name',
          replaceOriginals: true,
        },
        {
          id: 'act_rename_all',
          type: 'CUSTOM_HEADERS',
          title: 'Set Structured Column Headers',
          enabled: true,
          headers: ['Employee ID', 'Employee Name', 'Department', 'Designation', 'Monthly Salary (INR)', 'Status'],
        },
        {
          id: 'act_prefix_cur',
          type: 'PREFIX_SUFFIX',
          title: 'Add Currency Symbol',
          enabled: true,
          targetColumnIndex: 4,
          prefix: '₹',
          suffix: '/mo',
        },
      ],
    },
  },
  {
    id: 'server_logs',
    title: 'Web Server HTTP Access Logs',
    titleHi: 'सर्वर एक्सेस लॉग डंप (IP, Method, Path, Status)',
    category: 'System Logs',
    description: 'Standard server access logs with IP, timestamp, HTTP verb, route, response code and latency.',
    descriptionHi: 'सर्वर लॉग्स जिसमें IP, टाइम, HTTP मेथड, स्टेटस कोड और रेस्पोंस टाइम शामिल है।',
    rawText: `192.168.1.45  2025-05-15T08:12:01  GET   /api/v1/products     200  42ms  Chrome/124
192.168.1.89  2025-05-15T08:12:05  POST  /api/v1/auth/login   200  120ms Mozilla/5.0
10.0.4.12     2025-05-15T08:12:09  GET   /dashboard           302  15ms  Safari/17.4
192.168.1.102 2025-05-15T08:12:14  POST  /api/v1/orders       201  210ms Android-App/3.2
172.16.0.45   2025-05-15T08:12:20  GET   /static/css/main.css 304  8ms   Chrome/124
10.0.4.55     2025-05-15T08:12:25  DELETE /api/v1/cart/item    200  65ms  iOS-App/2.8`,
    suggestedScript: {
      version: '1.0',
      id: 'script_server_logs',
      name: 'Server Access Log Transformer',
      description: 'Parses server log stream into structured table with endpoint, status and timing columns.',
      createdAt: '2025-05-15T10:00:00.000Z',
      updatedAt: '2025-05-15T10:00:00.000Z',
      actions: [
        {
          id: 'act_init_logs',
          type: 'INITIAL_SPLIT',
          title: 'Consecutive Space Split',
          enabled: true,
          config: {
            delimiter: 'spaces',
            treatConsecutiveSpacesAsOne: true,
            trimEachCell: true,
            removeEmptyInitialRows: true,
            firstRowIsHeader: false,
          },
        },
        {
          id: 'act_headers_log',
          type: 'CUSTOM_HEADERS',
          title: 'Assign Log Column Headers',
          enabled: true,
          headers: ['Client IP', 'Timestamp', 'HTTP Method', 'Requested Endpoint', 'Status Code', 'Latency', 'User Agent'],
        },
      ],
    },
  },
  {
    id: 'fee_ledger_compounds',
    title: 'Student Fee & Penalty Ledger (Adjacent Cell Lookahead Demo)',
    titleHi: 'फीस एवं लेट फाइन लेजर (Late Fee व Fee payment अलग-अलग सेल्स)',
    category: 'Finance',
    description: 'Demonstrates strict adjacent cell lookahead matching where "Late Fee" and "Fee payment" are split across adjacent cells.',
    descriptionHi: 'कंडीशनल एडजसेंट सेल मैचिंग का उदाहरण जहां "Late Fee" और "Fee payment" शब्दों का सटीक अनुक्रम पहचाना जाता है।',
    rawText: `ROLL_NO  STUDENT_NAME     TYPE_HEAD1   TYPE_HEAD2   AMOUNT_INR   STATUS
101      Rajesh Sharma    Late         Fee          500.00       Paid
102      Suresh Verma     Fee          payment      2500.00      Cleared
103      Dinesh Kumar     Late         300.00       Due          Pending
104      Mahesh Singh     Fee          refund       800.00       Approved
105      Pooja Patel      Tuition      Fee          12000.00     Paid
106      Amit Verma       Late         Fee          750.00       Paid`,
    suggestedScript: {
      version: '1.0',
      id: 'script_fee_ledger_compounds',
      name: 'Fee Ledger Adjacent Cell Parser',
      description: 'Strictly matches "Late Fee" and "Fee payment" across adjacent cells without altering isolated words.',
      createdAt: '2025-06-01T10:00:00.000Z',
      updatedAt: '2025-06-01T10:00:00.000Z',
      dictionaryRules: [
        { id: 'f1', original: 'Late Fee', replaceWith: 'Late_Fee [BLANK]', enabled: true },
        { id: 'f2', original: 'Fee payment', replaceWith: 'Fee_Payment [BLANK]', enabled: true },
        { id: 'f3', original: 'Tuition Fee', replaceWith: 'Tuition_Fee [BLANK]', enabled: true },
      ],
      actions: [
        {
          id: 'act_init_fee',
          type: 'INITIAL_SPLIT',
          title: 'Initial Whitespace Split',
          enabled: true,
          config: {
            delimiter: 'spaces',
            treatConsecutiveSpacesAsOne: true,
            trimEachCell: true,
            removeEmptyInitialRows: true,
            firstRowIsHeader: false,
          },
        },
        {
          id: 'act_dict_fee',
          type: 'DICTIONARY_REPLACE',
          title: 'Adjacent Cell Compound Sequence Matcher',
          enabled: true,
          matchCase: false,
          rules: [
            { id: 'f1', original: 'Late Fee', replaceWith: 'Late_Fee [BLANK]', enabled: true },
            { id: 'f2', original: 'Fee payment', replaceWith: 'Fee_Payment [BLANK]', enabled: true },
            { id: 'f3', original: 'Tuition Fee', replaceWith: 'Tuition_Fee [BLANK]', enabled: true },
          ],
        },
        {
          id: 'act_header_fee',
          type: 'SET_HEADERS_FROM_ROW',
          title: 'Set Row 1 as Column Headers',
          enabled: true,
          rowIndex: 0,
          removeHeaderRow: true,
        },
      ],
    },
  },
];
