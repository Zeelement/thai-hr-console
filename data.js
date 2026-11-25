/* ===========================================================
   泰国工厂人事工作台 — 主数据与种子数据
   结构对齐《泰国HR需求.xlsx》：
     Sheet3 → 人员档案 28 列（A–AB）
     Sheet2 → 薪酬核算 三级表头（收入 8 项 / 费用 4 项 / 银行 3 项）
     Sheet1 → 考勤：外接硬件打卡回传
   =========================================================== */

(function (global) {
  'use strict';

  var CONST = {
    nationality: [
      { k: 'TH', zh: '泰国', th: 'ไทย', en: 'Thai' },
      { k: 'CN', zh: '中国', th: 'จีน', en: 'Chinese' },
      { k: 'MM', zh: '缅甸', th: 'เมียนมา', en: 'Myanmar' },
      { k: 'KH', zh: '柬埔寨', th: 'กัมพูชา', en: 'Cambodian' },
      { k: 'LA', zh: '老挝', th: 'ลาว', en: 'Lao' },
      { k: 'OTHER', zh: '其他', th: 'อื่น ๆ', en: 'Other' }
    ],
    gender: [
      { k: 'M', zh: '男', th: 'ชาย', en: 'Male' },
      { k: 'F', zh: '女', th: 'หญิง', en: 'Female' }
    ],
    /* Sheet3 H 列 TYPE OF EMPLOYEE */
    empType: [
      { k: 'BOI', zh: 'BOI 员工', th: 'พนักงาน BOI', en: 'BOI' },
      { k: 'THAI', zh: '泰籍普通', th: 'พนักงานไทยทั่วไป', en: 'Thai' },
      { k: 'EXPAT', zh: '中方派驻', th: 'พนักงานส่งจากจีน', en: 'Expat' },
      { k: 'FOREIGN', zh: '第三国外劳', th: 'แรงงานต่างด้าว', en: 'Foreign' }
    ],
    /* Sheet3 Y 列 HIRING STATUS，样例为泰文「ผ่านการทดลองงาน」 */
    hiringStatus: [
      { k: 'PROBATION', zh: '试用期', th: 'ทดลองงาน', en: 'Probation' },
      { k: 'PASSED', zh: '通过试用期', th: 'ผ่านการทดลองงาน', en: 'Passed probation' },
      { k: 'CONTRACT', zh: '合同期内', th: 'อยู่ในสัญญา', en: 'Contract' }
    ],
    /* Sheet3 Z 列 ACTIVE STATUS，样例为泰文「ทำงานอยู่」 */
    activeStatus: [
      { k: 'ACTIVE', zh: '在职', th: 'ทำงานอยู่', en: 'Active' },
      { k: 'LEAVE', zh: '长期假', th: 'ลาพักระยะยาว', en: 'On leave' },
      { k: 'RESIGNED', zh: '离职', th: 'ลาออก', en: 'Resigned' }
    ],
    leaveType: [
      { k: 'NONE', zh: '无', th: 'ไม่มี' },
      { k: 'SICK', zh: '病假', th: 'ลาป่วย' },
      { k: 'ANNUAL', zh: '年假', th: 'ลาพักร้อน' },
      { k: 'PERSONAL', zh: '事假', th: 'ลากิจ' },
      { k: 'MATERNITY', zh: '产假', th: 'ลาคลอด' },
      { k: 'UNPAID', zh: '无薪假', th: 'ลาไม่รับค่าจ้าง' }
    ],
    docCategory: [
      { k: 'HANDBOOK', zh: '员工手册', th: 'คู่มือพนักงาน' },
      { k: 'ATTEND', zh: '考勤休假', th: 'การลงเวลาและวันลา' },
      { k: 'PAYROLL', zh: '薪酬福利', th: 'ค่าจ้างและสวัสดิการ' },
      { k: 'SAFETY', zh: '安全环保', th: 'ความปลอดภัย' },
      { k: 'VISA', zh: '签证证照', th: 'วีซ่าและใบอนุญาต' },
      { k: 'OTHER', zh: '其他', th: 'อื่น ๆ' }
    ],
    docStatus: [
      { k: 'DRAFT', zh: '草稿', th: 'ฉบับร่าง' },
      { k: 'ACTIVE', zh: '生效中', th: 'มีผลบังคับใช้' },
      { k: 'EXPIRED', zh: '已失效', th: 'สิ้นผล' }
    ],
    payStatus: [
      { k: 'DRAFT', zh: '待确认', th: 'รอยืนยัน' },
      { k: 'CONFIRMED', zh: '已确认', th: 'ยืนยันแล้ว' },
      { k: 'RELEASED', zh: '已发放', th: 'จ่ายแล้ว' }
    ]
  };

  var departments = [
    { id: 'd01', nameZh: '管理层', nameTh: 'ผู้บริหาร', nameEn: 'Management' },
    { id: 'd02', nameZh: '生产部', nameTh: 'ฝ่ายผลิต', nameEn: 'Production' },
    { id: 'd03', nameZh: '注塑车间', nameTh: 'แผนกฉีดพลาสติก', nameEn: 'Injection' },
    { id: 'd04', nameZh: '装配车间', nameTh: 'แผนกประกอบ', nameEn: 'Assembly' },
    { id: 'd05', nameZh: '品质部', nameTh: 'ฝ่ายคุณภาพ', nameEn: 'Quality' },
    { id: 'd06', nameZh: '设备维修', nameTh: 'ซ่อมบำรุง', nameEn: 'Maintenance' },
    { id: 'd07', nameZh: '仓储物流', nameTh: 'คลังสินค้า', nameEn: 'Warehouse' },
    { id: 'd08', nameZh: '采购', nameTh: 'จัดซื้อ', nameEn: 'Purchasing' },
    { id: 'd09', nameZh: '人事行政', nameTh: 'ฝ่ายบุคคล', nameEn: 'HR & Admin' },
    { id: 'd10', nameZh: '财务', nameTh: 'ฝ่ายบัญชี', nameEn: 'Finance' }
  ];

  /* ---------- 员工主档（Sheet3 字段） ---------- */
  var E_DEFAULT = {
    gender: 'M', nationality: 'TH', empType: 'THAI', hiringStatus: 'PASSED', activeStatus: 'ACTIVE',
    passportNo: '', alienId: '', ssoId: '', email: '', remark: '', otEligible: true,
    travelAllowance: 300, housingAllowance: 0, foodAllowance: 600, shiftAllowance: 0, kpi: 0,
    bankName: 'Kasikorn Bank (KBank)', bankAccount: '', accountName: ''
  };
  function emp(o) { return Object.assign({}, E_DEFAULT, o); }

  var employees = [
    emp({
      id: 'e01', empNo: 'CSR001', nameEn: 'Zhang Wei', nameTh: 'จาง เหว่ย', nameZh: '张伟',
      nationality: 'CN', empType: 'EXPAT', deptId: 'd01', positionEn: 'Managing Director', positionZh: '总经理',
      birthday: '1978-03-14', passportNo: 'E12345678', alienId: 'AL-19-0031',
      taxId: '099-1-03071561-2', contractStart: '2019-03-01', contractExpiry: '2028-02-29',
      visaExpiry: '2027-02-28', workPermitNo: 'สร/00031/2562', wpIssuedDate: '2024-03-01', wpExpiry: '2027-02-28',
      last90Report: '2026-09-11', departureDate: '', remark: 'Reported Income to RD',
      baseSalary: 90000, positionAllowance: 25000, travelAllowance: 5000, housingAllowance: 15000,
      foodAllowance: 2000, shiftAllowance: 0, kpi: 5000, otEligible: false,
      bankName: 'Bangkok Bank (BBL)', bankAccount: '123-4-56789-0', accountName: 'ZHANG WEI',
      email: 'zhangwei@ridong.co.th'
    }),
    emp({
      id: 'e02', empNo: 'CSR002', nameEn: 'Li Ming', nameTh: 'หลี่ หมิง', nameZh: '李明',
      nationality: 'CN', empType: 'EXPAT', deptId: 'd02', positionEn: 'Production Manager', positionZh: '生产经理',
      birthday: '1982-07-08', passportNo: 'E22345678', alienId: 'AL-20-0118',
      taxId: '099-1-03071562-0', contractStart: '2020-06-15', contractExpiry: '2027-06-14',
      visaExpiry: '2026-12-20', workPermitNo: 'สร/01118/2563', wpIssuedDate: '2024-06-10', wpExpiry: '2026-12-20',
      last90Report: '2026-09-06', departureDate: '', remark: '工签与签证同期到期，需提前 60 天启动续期',
      baseSalary: 55000, positionAllowance: 18000, travelAllowance: 3000, housingAllowance: 10000,
      foodAllowance: 1800, kpi: 3000, otEligible: false,
      bankName: 'Bangkok Bank (BBL)', bankAccount: '123-4-56790-4', accountName: 'LI MING',
      email: 'liming@ridong.co.th'
    }),
    emp({
      id: 'e03', empNo: 'CSR003', nameEn: 'Somchai Wongthong', nameTh: 'สมชาย วงศ์ทอง', nameZh: '颂猜·翁通',
      nationality: 'TH', empType: 'BOI', deptId: 'd02', positionEn: 'Production Supervisor', positionZh: '生产主管',
      birthday: '1985-04-12', passportNo: '1103700000003', ssoId: '1-10-99-00003-1',
      taxId: '110-3-70000003-1', contractStart: '2018-05-02', contractExpiry: '',
      shiftAllowance: 1500, kpi: 2000, travelAllowance: 1000, foodAllowance: 800,
      baseSalary: 32000, positionAllowance: 3000,
      bankName: 'Kasikorn Bank (KBank)', bankAccount: '036-3-980031-1', accountName: 'SOMCHAI WONGTHONG',
      email: 'somchai.w@ridong.co.th'
    }),
    emp({
      id: 'e04', empNo: 'CSR004', nameEn: 'Kanya Srisuk', nameTh: 'กัญญา ศรีสุข', nameZh: '甘雅·西素',
      nationality: 'TH', gender: 'F', empType: 'BOI', deptId: 'd09', positionEn: 'HR & Admin Manager', positionZh: '人事行政经理',
      birthday: '1986-11-02', passportNo: '1103700000004', ssoId: '1-10-99-00004-1',
      taxId: '110-3-70000004-1', contractStart: '2017-09-11', contractExpiry: '',
      kpi: 2000, travelAllowance: 1000, foodAllowance: 800, otEligible: false,
      baseSalary: 38000, positionAllowance: 4000,
      bankName: 'Kasikorn Bank (KBank)', bankAccount: '036-3-980041-2', accountName: 'KANYA SRISUK',
      email: 'kanya.s@ridong.co.th', remark: '本工作台业务归口人'
    }),
    emp({
      id: 'e05', empNo: 'CSR005', nameEn: 'Nattapong Sriwilai', nameTh: 'ณัฐพงษ์ ศรีวิไล', nameZh: '纳塔蓬·西威莱',
      nationality: 'TH', empType: 'BOI', deptId: 'd03', positionEn: 'Injection Team Leader', positionZh: '注塑组长',
      birthday: '1990-01-25', passportNo: '1103700000005', ssoId: '1-10-99-00005-1',
      taxId: '110-3-70000005-1', contractStart: '2019-11-04', contractExpiry: '',
      shiftAllowance: 1200, kpi: 1000, travelAllowance: 500, foodAllowance: 600,
      baseSalary: 24000, positionAllowance: 2000,
      bankName: 'Krungsri (BAY)', bankAccount: '456-7-11205-3', accountName: 'NATTAPONG SRIWILAI',
      email: 'nattapong.s@ridong.co.th'
    }),
    emp({
      id: 'e06', empNo: 'CSR006', nameEn: 'Malee Chaiyaporn', nameTh: 'มาลี ไชยพร', nameZh: '玛丽·猜亚蓬',
      nationality: 'TH', gender: 'F', empType: 'BOI', deptId: 'd04', positionEn: 'Assembly Team Leader', positionZh: '装配组长',
      birthday: '1991-06-19', passportNo: '1103700000006', ssoId: '1-10-99-00006-1',
      taxId: '110-3-70000006-1', contractStart: '2020-02-17', contractExpiry: '',
      shiftAllowance: 1200, kpi: 1000, travelAllowance: 500, foodAllowance: 600,
      baseSalary: 23000, positionAllowance: 2000,
      bankName: 'Kasikorn Bank (KBank)', bankAccount: '036-3-980061-3', accountName: 'MALEE CHAIYAPORN',
      email: 'malee.c@ridong.co.th'
    }),
    emp({
      id: 'e07', empNo: 'CSR007', nameEn: 'Wichai Thongdee', nameTh: 'วิชัย ทองดี', nameZh: '威猜·通迪',
      nationality: 'TH', empType: 'THAI', deptId: 'd05', positionEn: 'Quality Engineer', positionZh: '品质工程师',
      birthday: '1988-09-30', passportNo: '1103700000007', ssoId: '1-10-99-00007-1',
      taxId: '110-3-70000007-1', contractStart: '2021-07-01', contractExpiry: '',
      kpi: 1000, travelAllowance: 500, foodAllowance: 600,
      baseSalary: 26000, positionAllowance: 1500,
      bankName: 'SCB', bankAccount: '789-0-22107-4', accountName: 'WICHAI THONGDEE',
      email: 'wichai.t@ridong.co.th'
    }),
    emp({
      id: 'e08', empNo: 'CSR008', nameEn: 'Siriporn Boonmee', nameTh: 'ศิริพร บุญมี', nameZh: '西里蓬·汶米',
      nationality: 'TH', gender: 'F', empType: 'THAI', deptId: 'd10', positionEn: 'Accountant', positionZh: '会计',
      birthday: '1984-02-14', passportNo: '1103700000008', ssoId: '1-10-99-00008-1',
      taxId: '110-3-70000008-1', contractStart: '2018-01-08', contractExpiry: '',
      kpi: 1500, travelAllowance: 500, foodAllowance: 800, otEligible: false,
      baseSalary: 30000, positionAllowance: 2000,
      bankName: 'SCB', bankAccount: '789-0-22108-7', accountName: 'SIRIPORN BOONMEE',
      email: 'siriporn.b@ridong.co.th', remark: '负责社保与个税申报对接'
    }),
    emp({
      id: 'e09', empNo: 'CSR009', nameEn: 'Anucha Panyawai', nameTh: 'อนุชา ปัญญาวัย', nameZh: '阿努查·潘亚瓦',
      nationality: 'TH', empType: 'BOI', deptId: 'd06', positionEn: 'Maintenance Technician', positionZh: '维修技术员',
      birthday: '1987-12-05', passportNo: '1103700000009', ssoId: '1-10-99-00009-1',
      taxId: '110-3-70000009-1', contractStart: '2019-04-22', contractExpiry: '',
      shiftAllowance: 800, kpi: 800, travelAllowance: 500, foodAllowance: 600,
      baseSalary: 22000, positionAllowance: 1500,
      bankName: 'Krungsri (BAY)', bankAccount: '456-7-11209-6', accountName: 'ANUCHA PANYAWAI',
      email: 'anucha.p@ridong.co.th'
    }),
    emp({
      id: 'e10', empNo: 'CSR010', nameEn: 'Ratana Sukjai', nameTh: 'รัตนา สุขใจ', nameZh: '拉达娜·苏赛',
      nationality: 'TH', gender: 'F', empType: 'THAI', deptId: 'd07', positionEn: 'Warehouse Keeper', positionZh: '仓管员',
      birthday: '1993-08-21', passportNo: '1103700000010', ssoId: '1-10-99-00010-1',
      taxId: '110-3-70000010-1', contractStart: '2022-03-14', contractExpiry: '',
      shiftAllowance: 800, kpi: 500, travelAllowance: 300, foodAllowance: 600,
      baseSalary: 16000, positionAllowance: 800,
      bankName: 'Kasikorn Bank (KBank)', bankAccount: '036-3-980101-5', accountName: 'RATANA SUKJAI'
    }),
    emp({
      id: 'e11', empNo: 'CSR011', nameEn: 'Prasert Klangjai', nameTh: 'ประเสริฐ กลางใจ', nameZh: '巴塞·江赛',
      nationality: 'TH', empType: 'BOI', deptId: 'd03', positionEn: 'Injection Operator', positionZh: '注塑操作工',
      birthday: '1995-05-17', passportNo: '1103700000011', ssoId: '1-10-99-00011-1',
      taxId: '110-3-70000011-1', contractStart: '2023-06-01', contractExpiry: '',
      shiftAllowance: 800, kpi: 500, travelAllowance: 300, foodAllowance: 600,
      baseSalary: 15000, positionAllowance: 500,
      bankName: 'Kasikorn Bank (KBank)', bankAccount: '036-3-980111-6', accountName: 'PRASERT KLANGJAI'
    }),
    emp({
      id: 'e12', empNo: 'CSR012', nameEn: 'Thida Rattanakorn', nameTh: 'ธิดา รัตนากร', nameZh: '提达·拉塔纳功',
      nationality: 'TH', gender: 'F', empType: 'BOI', deptId: 'd04', positionEn: 'Assembly Operator', positionZh: '装配工',
      birthday: '1997-03-09', passportNo: '1103700000012', ssoId: '1-10-99-00012-1',
      taxId: '110-3-70000012-1', contractStart: '2024-02-19', contractExpiry: '',
      shiftAllowance: 800, kpi: 500, travelAllowance: 300, foodAllowance: 600,
      baseSalary: 14800, positionAllowance: 500,
      bankName: 'Krungsri (BAY)', bankAccount: '456-7-11212-0', accountName: 'THIDA RATTANAKORN'
    }),
    emp({
      id: 'e13', empNo: 'CSR013', nameEn: 'Wasana Jaidee', nameTh: 'วาสนา ใจดี', nameZh: '瓦萨娜·赛迪',
      nationality: 'TH', gender: 'F', empType: 'BOI', deptId: 'd04', positionEn: 'Assembly Operator', positionZh: '装配工',
      birthday: '1996-10-28', passportNo: '1103700000013', ssoId: '1-10-99-00013-1',
      taxId: '110-3-70000013-1', contractStart: '2024-08-05', contractExpiry: '',
      shiftAllowance: 800, kpi: 500, travelAllowance: 300, foodAllowance: 600,
      baseSalary: 14800, positionAllowance: 500,
      bankName: 'Kasikorn Bank (KBank)', bankAccount: '036-3-980131-8', accountName: 'WASANA JAIDEE'
    }),
    emp({
      id: 'e14', empNo: 'CSR014', nameEn: 'Kittipong Meesuk', nameTh: 'กิตติพงษ์ มีสุข', nameZh: '吉迪蓬·米素',
      nationality: 'TH', empType: 'THAI', deptId: 'd05', positionEn: 'IQC Inspector', positionZh: 'IQC 检验员',
      birthday: '1994-07-03', passportNo: '1103700000014', ssoId: '1-10-99-00014-1',
      taxId: '110-3-70000014-1', contractStart: '2023-10-10', contractExpiry: '',
      shiftAllowance: 800, kpi: 800, travelAllowance: 300, foodAllowance: 600,
      baseSalary: 17000, positionAllowance: 800,
      bankName: 'SCB', bankAccount: '789-0-22114-9', accountName: 'KITTIPONG MEESUK'
    }),
    emp({
      id: 'e15', empNo: 'CSR015', nameEn: 'Duangjai Saengthong', nameTh: 'ดวงใจ แสงทอง', nameZh: '端斋·盛通',
      nationality: 'TH', gender: 'F', empType: 'THAI', deptId: 'd08', positionEn: 'Purchasing Officer', positionZh: '采购专员',
      birthday: '1989-01-16', passportNo: '1103700000015', ssoId: '1-10-99-00015-1',
      taxId: '110-3-70000015-1', contractStart: '2021-05-06', contractExpiry: '',
      kpi: 1500, travelAllowance: 800, foodAllowance: 600, otEligible: false,
      baseSalary: 25000, positionAllowance: 1500,
      bankName: 'Kasikorn Bank (KBank)', bankAccount: '036-3-980151-0', accountName: 'DUANGJAI SAENGTHONG',
      email: 'duangjai.s@ridong.co.th'
    }),
    emp({
      id: 'e16', empNo: 'CSR016', nameEn: 'Aung Ko', nameTh: 'อ่อง โก', nameZh: '昂哥',
      nationality: 'MM', empType: 'FOREIGN', deptId: 'd03', positionEn: 'Injection Operator', positionZh: '注塑操作工',
      birthday: '1992-02-11', passportNo: 'MM1234567', alienId: 'AL-24-0871',
      contractStart: '2024-11-20', contractExpiry: '2027-11-19',
      visaExpiry: '2026-11-28', workPermitNo: 'สร/00871/2567', wpIssuedDate: '2025-11-28', wpExpiry: '2026-11-28',
      last90Report: '2026-09-02', remark: '证照 9 天内到期，需立即办理续期',
      shiftAllowance: 800, kpi: 500, travelAllowance: 300, foodAllowance: 600,
      baseSalary: 15200, positionAllowance: 500,
      bankName: 'Kasikorn Bank (KBank)', bankAccount: '036-3-980161-1', accountName: 'AUNG KO'
    }),
    emp({
      id: 'e17', empNo: 'CSR017', nameEn: 'Soe Min', nameTh: 'โซ มิน', nameZh: '梭敏',
      nationality: 'MM', empType: 'FOREIGN', deptId: 'd04', positionEn: 'Assembly Operator', positionZh: '装配工',
      birthday: '1993-09-07', passportNo: 'MM2345678', alienId: 'AL-25-0142',
      contractStart: '2025-03-03', contractExpiry: '2028-03-02',
      visaExpiry: '2027-03-02', workPermitNo: 'สร/00142/2568', wpIssuedDate: '2025-03-02', wpExpiry: '2027-03-02',
      last90Report: '2026-09-16', hiringStatus: 'CONTRACT',
      shiftAllowance: 800, kpi: 500, travelAllowance: 300, foodAllowance: 600,
      baseSalary: 15200, positionAllowance: 500,
      bankName: 'Kasikorn Bank (KBank)', bankAccount: '036-3-980171-2', accountName: 'SOE MIN'
    }),
    emp({
      id: 'e18', empNo: 'CSR018', nameEn: 'Sokha Chan', nameTh: 'โสกา จัน', nameZh: '索卡·占',
      nationality: 'KH', gender: 'F', empType: 'FOREIGN', deptId: 'd04', positionEn: 'Assembly Operator', positionZh: '装配工',
      birthday: '1998-04-25', passportNo: 'KH9876543', alienId: 'AL-25-0630',
      contractStart: '2025-09-15', contractExpiry: '2027-09-14', hiringStatus: 'PROBATION',
      visaExpiry: '2027-09-14', workPermitNo: 'สร/00630/2568', wpIssuedDate: '2025-09-14', wpExpiry: '2027-09-14',
      last90Report: '2026-10-07', remark: '试用期 2026-12-14 到期，需提交转正评估',
      shiftAllowance: 800, kpi: 500, travelAllowance: 300, foodAllowance: 600,
      baseSalary: 15000, positionAllowance: 500,
      bankName: 'Krungsri (BAY)', bankAccount: '456-7-11218-5', accountName: 'SOKHA CHAN'
    }),
    emp({
      id: 'e19', empNo: 'CSR019', nameEn: 'Pornthip Kaewmala', nameTh: 'พรทิพย์ แก้วมาลา', nameZh: '蓬提·乔玛拉',
      nationality: 'TH', gender: 'F', empType: 'THAI', deptId: 'd02', positionEn: 'Production Clerk', positionZh: '生产文员',
      birthday: '1996-12-30', passportNo: '1103700000019', ssoId: '1-10-99-00019-1',
      taxId: '110-3-70000019-1', contractStart: '2025-09-01', contractExpiry: '',
      kpi: 800, travelAllowance: 300, foodAllowance: 600, otEligible: false,
      baseSalary: 18000, positionAllowance: 800,
      bankName: 'Kasikorn Bank (KBank)', bankAccount: '036-3-980191-3', accountName: 'PORNTHIP KAEWMALA'
    }),
    emp({
      id: 'e20', empNo: 'CSR020', nameEn: 'Wang Fang', nameTh: 'หวัง ฟาง', nameZh: '王芳',
      nationality: 'CN', gender: 'F', empType: 'EXPAT', deptId: 'd05', positionEn: 'Quality Manager', positionZh: '品质经理',
      birthday: '1983-05-22', passportNo: 'E32345678', alienId: 'AL-22-0455',
      taxId: '099-1-03071563-8', contractStart: '2022-11-01', contractExpiry: '2027-10-31',
      visaExpiry: '2027-10-31', workPermitNo: 'สร/00455/2565', wpIssuedDate: '2024-10-31', wpExpiry: '2027-10-31',
      last90Report: '2026-09-28', remark: 'Reported Income to RD',
      baseSalary: 48000, positionAllowance: 15000, travelAllowance: 2000, housingAllowance: 8000,
      foodAllowance: 1500, kpi: 3000, otEligible: false,
      bankName: 'Bangkok Bank (BBL)', bankAccount: '123-4-56820-6', accountName: 'WANG FANG',
      email: 'wangfang@ridong.co.th'
    }),
    emp({
      id: 'e21', empNo: 'CSR021', nameEn: 'Niran Chaiya', nameTh: 'นิรันดร์ ไชยา', nameZh: '尼兰·猜亚',
      nationality: 'TH', empType: 'BOI', deptId: 'd03', positionEn: 'Injection Operator', positionZh: '注塑操作工',
      birthday: '1990-11-11', passportNo: '1103700000021', ssoId: '1-10-99-00021-1',
      taxId: '110-3-70000021-1', contractStart: '2021-03-08', contractExpiry: '',
      activeStatus: 'RESIGNED', hiringStatus: 'PASSED', remark: '2026-09-30 离职，补偿金已结清',
      shiftAllowance: 800, kpi: 500, travelAllowance: 300, foodAllowance: 600,
      baseSalary: 15500, positionAllowance: 500,
      bankName: 'Kasikorn Bank (KBank)', bankAccount: '036-3-980211-4', accountName: 'NIRAN CHAIYA'
    })
  ];

  /* ---------- 打卡设备台账（Sheet1「外接硬件」） ---------- */
  var devices = [
    { id: 'dev01', name: '一号门人脸打卡机', nameTh: 'เครื่องสแกนหน้า ประตู 1', model: 'ZKTeco SpeedFace-V5L', sn: 'ZK2208A1547', ip: '192.168.10.21', protocol: 'ADMS / HTTP 推送', lastSync: '2026-11-19 08:14', status: 'ONLINE' },
    { id: 'dev02', name: '车间指纹打卡机', nameTh: 'เครื่องสแกนนิ้ว โรงผลิต', model: 'ZKTeco K40', sn: 'ZK1904B7731', ip: '192.168.10.22', protocol: 'TCP 主动拉取', lastSync: '2026-11-19 08:09', status: 'ONLINE' },
    { id: 'dev03', name: '后门卡式打卡机', nameTh: 'เครื่องรูดบัตร ประตูหลัง', model: 'Hikvision DS-K1T804', sn: 'HK2107C3390', ip: '192.168.10.23', protocol: '未接入（仅本机存储）', lastSync: '2026-11-14 17:32', status: 'OFFLINE' }
  ];

  /* ---------- 月度考勤汇总（Sheet2 G/H 列与 OT 的输入源） ---------- */
  var attendance = [
    { empId: 'e01', period: '2026-10', presentDays: 26, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 0, otRest: 0, otHoliday: 0, note: '' },
    { empId: 'e02', period: '2026-10', presentDays: 26, absentDays: 0, lateCount: 1, leaveDays: 0, leaveType: 'NONE', otWeekday: 6, otRest: 4, otHoliday: 0, note: '' },
    { empId: 'e03', period: '2026-10', presentDays: 25, absentDays: 1, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 32, otRest: 12, otHoliday: 8, note: '缺勤 1 天已扣款' },
    { empId: 'e04', period: '2026-10', presentDays: 25, absentDays: 0, lateCount: 0, leaveDays: 1, leaveType: 'ANNUAL', otWeekday: 0, otRest: 0, otHoliday: 0, note: '' },
    { empId: 'e05', period: '2026-10', presentDays: 26, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 30, otRest: 10, otHoliday: 8, note: '' },
    { empId: 'e06', period: '2026-10', presentDays: 24, absentDays: 0, lateCount: 0, leaveDays: 2, leaveType: 'SICK', otWeekday: 24, otRest: 8, otHoliday: 0, note: '病假 2 天，有病假证明' },
    { empId: 'e07', period: '2026-10', presentDays: 26, absentDays: 0, lateCount: 2, leaveDays: 0, leaveType: 'NONE', otWeekday: 18, otRest: 6, otHoliday: 0, note: '' },
    { empId: 'e08', period: '2026-10', presentDays: 26, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 0, otRest: 0, otHoliday: 0, note: '' },
    { empId: 'e09', period: '2026-10', presentDays: 26, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 22, otRest: 10, otHoliday: 4, note: '' },
    { empId: 'e10', period: '2026-10', presentDays: 25, absentDays: 1, lateCount: 1, leaveDays: 0, leaveType: 'NONE', otWeekday: 16, otRest: 4, otHoliday: 0, note: '' },
    { empId: 'e11', period: '2026-10', presentDays: 26, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 34, otRest: 12, otHoliday: 8, note: '' },
    { empId: 'e12', period: '2026-10', presentDays: 26, absentDays: 0, lateCount: 3, leaveDays: 0, leaveType: 'NONE', otWeekday: 28, otRest: 10, otHoliday: 8, note: '迟到 3 次已口头提醒' },
    { empId: 'e13', period: '2026-10', presentDays: 25, absentDays: 0, lateCount: 0, leaveDays: 1, leaveType: 'PERSONAL', otWeekday: 26, otRest: 8, otHoliday: 0, note: '' },
    { empId: 'e14', period: '2026-10', presentDays: 26, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 20, otRest: 6, otHoliday: 0, note: '' },
    { empId: 'e15', period: '2026-10', presentDays: 26, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 0, otRest: 0, otHoliday: 0, note: '' },
    { empId: 'e16', period: '2026-10', presentDays: 26, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 32, otRest: 12, otHoliday: 8, note: '' },
    { empId: 'e17', period: '2026-10', presentDays: 26, absentDays: 0, lateCount: 1, leaveDays: 0, leaveType: 'NONE', otWeekday: 28, otRest: 10, otHoliday: 8, note: '' },
    { empId: 'e18', period: '2026-10', presentDays: 26, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 24, otRest: 8, otHoliday: 0, note: '' },
    { empId: 'e19', period: '2026-10', presentDays: 26, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 6, otRest: 0, otHoliday: 0, note: '' },
    { empId: 'e20', period: '2026-10', presentDays: 26, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 0, otRest: 0, otHoliday: 0, note: '' },

    { empId: 'e01', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 0, otRest: 0, otHoliday: 0, note: '' },
    { empId: 'e02', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 3, otRest: 2, otHoliday: 0, note: '' },
    { empId: 'e03', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 16, otRest: 6, otHoliday: 4, note: '' },
    { empId: 'e04', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 0, otRest: 0, otHoliday: 0, note: '' },
    { empId: 'e05', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 15, otRest: 5, otHoliday: 4, note: '' },
    { empId: 'e06', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 12, otRest: 4, otHoliday: 0, note: '' },
    { empId: 'e07', period: '2026-11', presentDays: 15, absentDays: 1, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 9, otRest: 3, otHoliday: 0, note: '待补缺勤说明' },
    { empId: 'e08', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 0, otRest: 0, otHoliday: 0, note: '' },
    { empId: 'e09', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 11, otRest: 5, otHoliday: 2, note: '' },
    { empId: 'e10', period: '2026-11', presentDays: 15, absentDays: 0, lateCount: 0, leaveDays: 1, leaveType: 'SICK', otWeekday: 8, otRest: 2, otHoliday: 0, note: '' },
    { empId: 'e11', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 17, otRest: 6, otHoliday: 4, note: '' },
    { empId: 'e12', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 1, leaveDays: 0, leaveType: 'NONE', otWeekday: 14, otRest: 5, otHoliday: 4, note: '' },
    { empId: 'e13', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 13, otRest: 4, otHoliday: 0, note: '' },
    { empId: 'e14', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 10, otRest: 3, otHoliday: 0, note: '' },
    { empId: 'e15', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 0, otRest: 0, otHoliday: 0, note: '' },
    { empId: 'e16', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 16, otRest: 6, otHoliday: 4, note: '' },
    { empId: 'e17', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 14, otRest: 5, otHoliday: 4, note: '' },
    { empId: 'e18', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 12, otRest: 4, otHoliday: 0, note: '' },
    { empId: 'e19', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 3, otRest: 0, otHoliday: 0, note: '' },
    { empId: 'e20', period: '2026-11', presentDays: 16, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 0, otRest: 0, otHoliday: 0, note: '' }
  ];

  var documents = [
    {
      id: 'doc01', code: 'HR-POL-001', titleZh: '员工手册', titleTh: 'คู่มือพนักงาน',
      category: 'HANDBOOK', version: 'V3.0', effectiveDate: '2025-01-01', owner: '人事行政部',
      status: 'ACTIVE', fileRef: '\\\\fileserver\\HR\\Policy\\Handbook_V3.0_TH.pdf',
      ackCount: 19, headcount: 20,
      changeNote: '新增外籍员工证照管理与纪律处分条款，泰文版为正式版本，中文版仅供中方管理层参照。'
    },
    {
      id: 'doc02', code: 'HR-POL-002', titleZh: '考勤与加班管理办法', titleTh: 'ระเบียบการลงเวลาและการทำงานล่วงเวลา',
      category: 'ATTEND', version: 'V2.1', effectiveDate: '2026-04-01', owner: '人事行政部',
      status: 'ACTIVE', fileRef: '\\\\fileserver\\HR\\Policy\\Attendance_V2.1_TH.pdf',
      ackCount: 20, headcount: 20,
      changeNote: '明确三类加班倍率与审批流程，加班需班组长事前书面批准；打卡异常须 3 个工作日内补单。'
    },
    {
      id: 'doc03', code: 'HR-POL-003', titleZh: '薪酬支付制度', titleTh: 'ระเบียบการจ่ายค่าจ้าง',
      category: 'PAYROLL', version: 'V1.4', effectiveDate: '2026-12-01', owner: '财务部',
      status: 'DRAFT', fileRef: '\\\\fileserver\\HR\\Policy\\Payroll_V1.4_draft.docx',
      ackCount: 0, headcount: 20,
      changeNote: '待与泰国本地税务顾问确认个税代扣口径后发布，暂不生效。'
    },
    {
      id: 'doc04', code: 'HR-POL-004', titleZh: '外籍员工证照与 90 天报到管理办法', titleTh: 'ระเบียบวีซ่า ใบอนุญาตทำงาน และการรายงานตัว 90 วัน',
      category: 'VISA', version: 'V1.0', effectiveDate: '2026-06-01', owner: '人事行政部',
      status: 'ACTIVE', fileRef: '\\\\fileserver\\HR\\Policy\\WorkPermit_V1.0_TH.pdf',
      ackCount: 5, headcount: 5,
      changeNote: '明确证照到期前 60 天启动续期、90 天报到由人事统一代办，逾期责任到人。'
    },
    {
      id: 'doc05', code: 'HR-POL-005', titleZh: '安全生产与劳动防护守则', titleTh: 'ข้อบังคับความปลอดภัยและอุปกรณ์ป้องกัน',
      category: 'SAFETY', version: 'V1.2', effectiveDate: '2025-08-01', owner: '生产部',
      status: 'ACTIVE', fileRef: '\\\\fileserver\\HR\\Policy\\Safety_V1.2_TH.pdf',
      ackCount: 20, headcount: 20,
      changeNote: '注塑车间高温作业与化学品防护条款更新，配套培训已覆盖全员。'
    },
    {
      id: 'doc06', code: 'HR-POL-006', titleZh: '员工离职管理流程', titleTh: 'ขั้นตอนการลาออก',
      category: 'OTHER', version: 'V1.1', effectiveDate: '2024-03-01', owner: '人事行政部',
      status: 'EXPIRED', fileRef: '\\\\fileserver\\HR\\Policy\\Resignation_V1.1_TH.pdf',
      ackCount: 20, headcount: 20,
      changeNote: '已被 V2.0 草案替代，新版本待法务确认补偿金计算口径后发布。'
    }
  ];

  var defaultSettings = {
    companyZh: '日东工具（泰国）有限公司',
    companyTh: 'บริษัท รื่อตง ทูลส์ (ไทยแลนด์) จำกัด',
    plantZh: '罗勇工厂',
    plantTh: 'โรงงานระยอง',
    currency: 'THB',
    workDaysPerMonth: 26,      // Sheet2 G 列：应出勤天数
    hoursPerDay: 8,
    otRateWeekday: 1.5,
    otRateRest: 2.0,
    otRateHoliday: 3.0,
    ssoRate: 5,
    ssoBaseCap: 15000,
    annualDeduction1: 160000,  // Sheet2 R 列：年收入 = 合计×12 − 160000 − 10500
    annualDeduction2: 10500,
    shiftStart: '08:00',
    graceMinutes: 5,
    pitEnabled: true,
    minWageDaily: 400,
    lang: 'zh'
  };

  function makeSeed() {
    var out = {
      version: 2,
      settings: Object.assign({}, defaultSettings),
      departments: JSON.parse(JSON.stringify(departments)),
      employees: JSON.parse(JSON.stringify(employees)),
      attendance: JSON.parse(JSON.stringify(attendance)),
      punches: [],
      devices: JSON.parse(JSON.stringify(devices)),
      payroll: [],
      documents: JSON.parse(JSON.stringify(documents)),
      meta: { createdAt: new Date().toISOString(), seeded: true }
    };

    /* 演示数据跟随真实日历 */
    var now = new Date();
    var curP = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var pm = now.getMonth(), py = now.getFullYear();
    if (pm === 0) { pm = 12; py -= 1; }
    var prevP = py + '-' + String(pm).padStart(2, '0');
    var elapsed = 0;
    for (var day = 1; day <= now.getDate(); day++) {
      if (new Date(now.getFullYear(), now.getMonth(), day).getDay() !== 0) elapsed++;
    }
    var prevDays = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
    var prevWork = 0;
    for (var pd = 1; pd <= prevDays; pd++) {
      if (new Date(now.getFullYear(), now.getMonth() - 1, pd).getDay() !== 0) prevWork++;
    }
    out.attendance.forEach(function (r) {
      if (r.period === '2026-11') {
        r.period = curP;
        r.presentDays = Math.max(0, elapsed - (r.absentDays || 0) - (r.leaveDays || 0));
      } else if (r.period === '2026-10') {
        r.period = prevP;
        r.presentDays = Math.max(0, prevWork - (r.absentDays || 0) - (r.leaveDays || 0));
      }
    });

    /* 打卡明细演示：最近 3 个工作日、前 8 名员工 */
    var dates = [];
    var cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    while (dates.length < 3) {
      if (cursor.getDay() !== 0) dates.push(cursor.toISOString().slice(0, 10));
      cursor.setDate(cursor.getDate() - 1);
    }
    var demoIds = ['e03', 'e05', 'e06', 'e11', 'e12', 'e13', 'e16', 'e17'];
    dates.forEach(function (dt) {
      var key = dt.replace(/-/g, '');
      demoIds.forEach(function (eid, i) {
        out.punches.push({
          id: 'p' + key + eid, empId: eid, date: dt,
          time: i % 4 === 0 ? '07:52' : '07:5' + (i % 6),
          deviceId: i % 2 ? 'dev02' : 'dev01', direction: 'IN', source: 'SEED'
        });
        out.punches.push({
          id: 'po' + key + eid, empId: eid, date: dt,
          time: i % 5 === 0 ? '17:48' : '17:0' + (i % 7),
          deviceId: i % 2 ? 'dev02' : 'dev01', direction: 'OUT', source: 'SEED'
        });
      });
    });

    return out;
  }

  global.HR_SEED = { CONST: CONST, make: makeSeed, defaultSettings: defaultSettings };
})(window);
