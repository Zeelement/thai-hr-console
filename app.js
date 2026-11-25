/* ===========================================================
   泰国工厂人事工作台 — 应用逻辑
   格式依据《泰国HR需求.xlsx》Sheet2 / Sheet3
   打卡数据：设备导出文件导入 → 明细 → 月度汇总 → 薪酬
   =========================================================== */

(function () {
  'use strict';

  var CONST = window.HR_SEED.CONST;
  var LS_KEY = 'hr_console_th_v2';

  /* ---------------- 工具 ---------------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(v) {
    return String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function num(v) { var n = parseFloat(v); return isNaN(n) ? 0 : n; }
  function round2(n) { return Math.round((Number(n) || 0) * 100) / 100; }
  function money(n) { return (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  function intf(n) { return (Number(n) || 0).toLocaleString('en-US'); }
  function uid(p) { return p + Math.random().toString(36).slice(2, 7) + Date.now().toString(36).slice(-4); }
  function today() { var d = new Date(); d.setHours(0, 0, 0, 0); return d; }
  function parseD(s) {
    if (!s) return null;
    var p = String(s).split('-');
    if (p.length < 3) return null;
    var d = new Date(+p[0], +p[1] - 1, +p[2]);
    return isNaN(d.getTime()) ? null : d;
  }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function addDays(s, n) { var d = parseD(s); if (!d) return ''; d.setDate(d.getDate() + n); return iso(d); }
  function daysUntil(s) { var d = parseD(s); if (!d) return null; return Math.round((d - today()) / 86400000); }
  function fmtD(s) { return s || '—'; }

  /* ---------------- 词条 ---------------- */
  var TH = {
    '总览': 'ภาพรวม', '人员档案': 'ข้อมูลพนักงาน', '考勤管理': 'การลงเวลา',
    '薪酬核算': 'เงินเดือน', '制度文件': 'เอกสารระเบียบ', '设置': 'ตั้งค่า',
    '工厂人事工作台': 'ศูนย์งานบุคคลโรงงาน', '人事工作台': 'ศูนย์งานบุคคล',
    '泰国 · 罗勇工厂': 'ไทย · โรงงานระยอง',
    '在职员工与关键指标一览': 'ภาพรวมพนักงานและตัวชี้วัดสำคัญ',
    '员工主档 · 28 列 · 对齐 Sheet3': 'ข้อมูลพนักงาน 28 คอลัมน์ ตาม Sheet3',
    '打卡明细、月度汇总与设备接入': 'รายละเอียดการลงเวลา สรุปรายเดือน และอุปกรณ์',
    '收入 8 项 / 费用 4 项 · 对齐 Sheet2': 'รายได้ 8 รายการ / ค่าใช้จ่าย 4 รายการ ตาม Sheet2',
    '制度版本、生效状态与签收登记': 'เวอร์ชันระเบียบ สถานะ และการรับทราบ',
    '公司信息与核算规则': 'ข้อมูลบริษัทและกติกาการคำนวณ',
    '在职员工': 'พนักงานปัจจุบัน', '本月应发合计': 'รายได้รวมเดือนนี้',
    '到期预警': 'รายการใกล้ครบกำหนด', '本月考勤异常': 'ความผิดปกติการลงเวลา',
    '预警清单': 'รายการแจ้งเตือน', '部门人数分布': 'จำนวนพนักงานตามแผนก',
    '制度文件状态': 'สถานะเอกสารระเบียบ', '暂无预警': 'ไม่มีรายการแจ้งเตือน',
    '暂无打卡记录': 'ไม่มีข้อมูลลงเวลา',
    '距到期': 'เหลืออีก', '天': 'วัน', '已逾期': 'เกินกำหนด',
    '工作证到期': 'ใบอนุญาตทำงานหมดอายุ', '签证到期': 'วีซ่าหมดอายุ',
    '90天报到': 'รายงานตัว 90 วัน', '试用期到期': 'ครบทดลองงาน', '合同到期': 'สัญญาจ้างหมดอายุ',
    '新增员工': 'เพิ่มพนักงาน', '编辑员工': 'แก้ไขข้อมูลพนักงาน',
    '搜索姓名 / 工号 / 护照': 'ค้นหาชื่อ / รหัส / หนังสือเดินทาง',
    '全部部门': 'ทุกแผนก', '全部类型': 'ทุกประเภท', '全部状态': 'ทุกสถานะ',
    '工号': 'รหัสพนักงาน', '姓名': 'ชื่อ-นามสกุล', '部门': 'แผนก', '岗位': 'ตำแหน่ง',
    '用工类型': 'ประเภทการจ้าง', '状态': 'สถานะ', '入职日期': 'วันที่เริ่มงาน',
    '操作': 'จัดการ', '详情': 'รายละเอียด', '编辑': 'แก้ไข', '删除': 'ลบ',
    '保存': 'บันทึก', '取消': 'ยกเลิก', '关闭': 'ปิด', '导出 CSV': 'ส่งออก CSV',
    '共': 'ทั้งหมด', '人': 'คน', '条': 'รายการ',
    '月份': 'เดือน', '应出勤': 'วันทำงานตามกำหนด', '实际出勤': 'วันมาทำงาน',
    '缺勤': 'ขาดงาน', '迟到次数': 'มาสาย (ครั้ง)', '请假': 'วันลา',
    '工作日加班': 'OT วันทำงาน', '休息日加班': 'OT วันหยุด', '法定假日加班': 'OT วันหยุดนักขัตฤกษ์',
    '备注': 'หมายเหตุ', '生成薪酬': 'สร้างเงินเดือน', '应发合计': 'รายได้รวม',
    '社保': 'ประกันสังคม', '个税': 'ภาษี', '实发合计': 'รับสุทธิ', '费用合计': 'ค่าใช้จ่ายรวม',
    '确认': 'ยืนยัน', '工资条': 'สลิปเงินเดือน', '打印': 'พิมพ์',
    '制度名称': 'ชื่อระเบียบ', '编号': 'เลขที่', '版本': 'เวอร์ชัน',
    '生效日期': 'วันที่มีผล', '责任部门': 'หน่วยงานรับผิดชอบ', '签收': 'รับทราบ',
    '变更说明': 'รายละเอียดการแก้ไข', '公司信息': 'ข้อมูลบริษัท',
    '薪酬与考勤规则': 'กติกาค่าจ้างและการลงเวลา', '数据管理': 'จัดการข้อมูล',
    '备份数据': 'สำรองข้อมูล', '基本信息': 'ข้อมูลทั่วไป', '用工信息': 'ข้อมูลการจ้าง',
    '薪酬信息': 'ข้อมูลค่าจ้าง', '证件与合同': 'เอกสารและสัญญา',
    '签证与工作许可': 'วีซ่าและใบอนุญาตทำงาน', '90天报到': 'รายงานตัว 90 วัน',
    '银行信息': 'ข้อมูลธนาคาร', '联系与备注': 'ติดต่อและหมายเหตุ',
    '姓名（英文）': 'ชื่อ (อังกฤษ)', '姓名（泰文）': 'ชื่อ (ไทย)', '姓名（中文）': 'ชื่อ (จีน)',
    '国籍': 'สัญชาติ', '性别': 'เพศ', '生日': 'วันเกิด', '年龄': 'อายุ',
    '护照/身份证号': 'หนังสือเดินทาง / บัตรประชาชน', '外侨证号': 'เลขประจำตัวคนต่างด้าว',
    '税号': 'เลขผู้เสียภาษี', '社保号': 'เลขประกันสังคม',
    '合同起始日': 'วันที่เริ่มสัญญา', '合同/试用到期日': 'วันสิ้นสุดสัญญา/ทดลองงาน',
    '签证到期日': 'วีซ่าหมดอายุ', '工作证号': 'เลขใบอนุญาตทำงาน',
    '签发日': 'วันที่ออก', '到期日': 'วันหมดอายุ',
    '上次报到日': 'วันรายงานตัวล่าสุด', '离境日': 'วันที่ออกนอกประเทศ',
    '90天应报日': 'วันครบกำหนดรายงานตัว', '剩余天数': 'วันที่เหลือ',
    '雇佣状态': 'สถานะการจ้าง', '在职状态': 'สถานะการทำงาน',
    '工资基数': 'เงินเดือนพื้นฐาน', '岗位补贴': 'เบี้ยตำแหน่ง', '差旅费': 'ค่าพาหนะ',
    '住房津贴': 'ค่าเช่าบ้าน', '餐补': 'ค่าอาหาร', '加班费': 'ค่าล่วงเวลา',
    '班次津贴': 'ค่ากะ', '是否计加班': 'คิด OT หรือไม่',
    '银行名称': 'ชื่อธนาคาร', '银行账户': 'เลขที่บัญชี', '户名': 'ชื่อบัญชี',
    '电话': 'โทรศัพท์', '邮箱': 'อีเมล',
    '打卡明细': 'รายละเอียดการลงเวลา', '月度汇总': 'สรุปรายเดือน',
    '导入打卡数据': 'นำเข้าข้อมูลลงเวลา', '下载导入模板': 'ดาวน์โหลดแบบฟอร์ม',
    '设备台账': 'ทะเบียนอุปกรณ์', '设备': 'อุปกรณ์', '方向': 'ทิศทาง',
    '上班': 'เข้างาน', '下班': 'เลิกงาน', '来源': 'แหล่งที่มา',
    '日期': 'วันที่', '时间': 'เวลา', '汇总到月度': 'สรุปเป็นรายเดือน',
    '导入': 'นำเข้า', '未匹配': 'จับคู่ไม่ได้', '条记录': 'รายการ', '已导入': 'นำเข้าแล้ว',
    '解析失败': 'แยกข้อมูลไม่ได้', '请粘贴或选择文件': 'กรุณาวางหรือเลือกไฟล์',
    '数据仅保存在本机浏览器': 'ข้อมูลเก็บไว้ในเบราว์เซอร์เครื่องนี้เท่านั้น',
    '请定期备份：设置 → 备份数据': 'กรุณาสำรองข้อมูลเป็นประจำ',
    '标准工作天数/月': 'วันทำงานมาตรฐาน/เดือน', '标准工时/天': 'ชั่วโมงทำงาน/วัน',
    '工作日加班倍率': 'อัตรา OT วันทำงาน', '休息日加班倍率': 'อัตรา OT วันหยุด',
    '法定假日加班倍率': 'อัตรา OT วันหยุดนักขัตฤกษ์',
    '社保个人比例': 'อัตราประกันสังคม (ลูกจ้าง) %', '社保基数上限': 'ฐานค่าจ้างสูงสุดประกันสังคม',
    '最低日薪': 'ค่าจ้างขั้นต่ำ/วัน', '估算个税': 'ประมาณภาษีเงินได้',
    '年度扣除项一': 'ค่าลดหย่อนรายปี 1', '年度扣除项二': 'ค่าลดหย่อนรายปี 2',
    '上班时间': 'เวลาเข้างาน', '迟到宽限（分钟）': 'ผ่อนผันมาสาย (นาที)',
    '保存设置': 'บันทึกการตั้งค่า',
    '导出全部数据': 'ส่งออกข้อมูลทั้งหมด', '导入备份文件': 'นำเข้าไฟล์สำรอง',
    '清空并重置': 'ล้างและเริ่มใหม่', '重置后不可恢复': 'เมื่อรีเซ็ตแล้วไม่สามารถกู้คืนได้',
    '确认删除': 'ยืนยันการลบ', '此操作不可撤销': 'การดำเนินการนี้ไม่สามารถย้อนกลับได้',
    '已保存': 'บันทึกแล้ว', '已删除': 'ลบแล้ว', '已生成薪酬': 'สร้างเงินเดือนแล้ว',
    '请填写姓名': 'กรุณากรอกชื่อ', '数据已导出': 'ส่งออกข้อมูลแล้ว',
    '备份文件已下载': 'ดาวน์โหลดไฟล์สำรองแล้ว', '数据已恢复': 'กู้คืนข้อมูลแล้ว',
    '文件格式不正确': 'รูปแบบไฟล์ไม่ถูกต้อง', '已重置为演示数据': 'รีเซ็ตเป็นข้อมูลตัวอย่างแล้ว',
    '生效中': 'มีผลบังคับใช้', '草稿': 'ฉบับร่าง', '已失效': 'สิ้นผล',
    '待确认': 'รอยืนยัน', '已确认': 'ยืนยันแล้ว', '已发放': 'จ่ายแล้ว',
    '类别': 'หมวดหมู่', '合计': 'รวมทั้งสิ้น', '核算口径': 'หลักการคำนวณ',
    '应发': 'รายได้รวม', '实发': 'รับสุทธิ', '无': 'ไม่มี',
    '新增制度': 'เพิ่มระเบียบ', '待说明': 'รอชี้แจง', '需处理': 'ต้องดำเนินการ',
    '应签收总人数': 'จำนวนผู้รับทราบทั้งหมด',
    '在线': 'ออนไลน์', '离线': 'ออฟไลน์', '最后同步': 'ซิงค์ล่าสุด',
    '收入': 'รายได้', '费用': 'ค่าใช้จ่าย', '年收入': 'รายได้ต่อปี',
    '比例': 'อัตรา', '个人所得税': 'ภาษีหัก ณ ที่จ่าย', '其他': 'อื่น ๆ',
    '实发金额': 'ยอดสุทธิ', '应出勤天数': 'วันทำงานตามกำหนด',
    '实际出勤天数': 'วันมาทำงาน'
  };
  var lang = 'zh';
  function t(s) { return lang === 'th' ? (TH[s] || s) : s; }
  function dictName(list, k) {
    for (var i = 0; i < list.length; i++) if (list[i].k === k) {
      return lang === 'th' ? list[i].th : (lang === 'zh' ? list[i].zh : list[i].en);
    }
    return k || '';
  }
  function empName(e) {
    if (!e) return '';
    return lang === 'th' ? (e.nameTh || e.nameEn) : e.nameEn;
  }

  /* ---------------- 状态 ---------------- */
  function load() {
    try {
      var raw = localStorage.getItem(LS_KEY);
      if (!raw) return null;
      var o = JSON.parse(raw);
      if (!o || !o.employees || o.version !== 2) return null;
      return o;
    } catch (e) { return null; }
  }
  // 数据改由后端 API 载入（main.js 调用 HRApp.init 注入）
  var state = null;
  var firstRun = false;
  var pendingLang = null;
  var saveTimer = null;

  var ui = { route: 'dashboard', empQ: '', empDept: '', empType: '', empStatus: '', period: null, attTab: 'punch' };

  function save() {
    if (!state || !window.HR_API) return;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      window.HR_API.saveState(state).catch(function (e) {
        if (e.status !== 401) toast('保存失败：' + e.message);
      });
    }, 120);
  }
  function getEmp(id) {
    for (var i = 0; i < state.employees.length; i++) if (state.employees[i].id === id) return state.employees[i];
    return null;
  }
  function deptName(id) {
    for (var i = 0; i < state.departments.length; i++) if (state.departments[i].id === id) {
      var d = state.departments[i];
      return lang === 'th' ? d.nameTh : (lang === 'zh' ? d.nameZh : d.nameEn);
    }
    return '—';
  }
  function posName(e) { return lang === 'zh' ? (e.positionZh || e.positionEn) : e.positionEn; }
  function activeEmps() { return state.employees.filter(function (e) { return e.activeStatus !== 'RESIGNED'; }); }
  function ageOf(birthday) {
    var d = parseD(birthday); if (!d) return '';
    var n = today(); var age = n.getFullYear() - d.getFullYear();
    var m = n.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && n.getDate() < d.getDate())) age--;
    return age;
  }
  function report90Due(e) { return e.last90Report ? addDays(e.last90Report, 90) : ''; }

  /* ---------------- 期间 ---------------- */
  function currentPeriod() { var d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
  function prevPeriod(p) { var a = p.split('-'), y = +a[0], m = +a[1] - 1; if (m < 1) { m = 12; y--; } return y + '-' + String(m).padStart(2, '0'); }
  function nextPeriod(p) { var a = p.split('-'), y = +a[0], m = +a[1] + 1; if (m > 12) { m = 1; y++; } return y + '-' + String(m).padStart(2, '0'); }
  function periodLabel(p) { var a = p.split('-'); return lang === 'th' ? (a[1] + '/' + a[0]) : (a[0] + '年' + (+a[1]) + '月'); }
  function workDaysInMonth(p, uptoToday) {
    var a = p.split('-'), y = +a[0], m = +a[1];
    var last = new Date(y, m, 0).getDate(), end = last;
    if (uptoToday) { var td = new Date(); if (td.getFullYear() === y && td.getMonth() + 1 === m) end = Math.min(last, td.getDate()); }
    var c = 0;
    for (var d = 1; d <= end; d++) if (new Date(y, m - 1, d).getDay() !== 0) c++;
    return c;
  }

  /* ---------------- 薪酬引擎 ---------------- */
  var PIT = [[150000, 0], [300000, 0.05], [500000, 0.10], [750000, 0.15], [1000000, 0.20], [2000000, 0.25], [5000000, 0.30], [Infinity, 0.35]];
  function progressiveTax(taxable) {
    var tax = 0, prev = 0;
    for (var i = 0; i < PIT.length; i++) {
      var cap = PIT[i][0], rate = PIT[i][1];
      if (taxable > prev) { tax += (Math.min(taxable, cap) - prev) * rate; prev = cap; } else break;
    }
    return tax;
  }

  function newPayRow(e, att, period) {
    return computeRow({
      id: uid('p'), empId: e.id, period: period,
      baseSalary: e.baseSalary, positionAllowance: e.positionAllowance,
      travelAllowance: e.travelAllowance, housingAllowance: e.housingAllowance,
      foodAllowance: e.foodAllowance, shiftAllowance: e.shiftAllowance, kpi: e.kpi,
      absentDays: att ? num(att.absentDays) : 0,
      otWeekday: att ? num(att.otWeekday) : 0,
      otRest: att ? num(att.otRest) : 0,
      otHoliday: att ? num(att.otHoliday) : 0,
      otherExpense: 0, pndOverride: null, status: 'DRAFT', remark: '',
      bankName: e.bankName, bankAccount: e.bankAccount, accountName: e.accountName
    });
  }

  function computeRow(r) {
    var s = state.settings;
    var e = getEmp(r.empId) || {};
    var days = num(s.workDaysPerMonth) || 26;
    var hours = num(s.hoursPerDay) || 8;
    var dailyRate = num(r.baseSalary) / days;
    var hourRate = dailyRate / hours;
    var eligible = e.otEligible !== false;

    r.hourRate = round2(hourRate);
    r.otWeekdayPay = eligible ? round2(num(r.otWeekday) * hourRate * num(s.otRateWeekday)) : 0;
    r.otRestPay = eligible ? round2(num(r.otRest) * hourRate * num(s.otRateRest)) : 0;
    r.otHolidayPay = eligible ? round2(num(r.otHoliday) * hourRate * num(s.otRateHoliday)) : 0;
    r.otPay = round2(r.otWeekdayPay + r.otRestPay + r.otHolidayPay);

    r.total = round2(num(r.baseSalary) + num(r.positionAllowance) + num(r.travelAllowance) +
      num(r.housingAllowance) + num(r.foodAllowance) + r.otPay + num(r.shiftAllowance) + num(r.kpi));

    r.annualIncome = round2(r.total * 12 - num(s.annualDeduction1) - num(s.annualDeduction2));

    var ssoBase = Math.min(num(r.baseSalary), num(s.ssoBaseCap));
    r.social = round2(ssoBase * num(s.ssoRate) / 100);

    if (r.pndOverride !== null && r.pndOverride !== '' && r.pndOverride !== undefined) {
      r.pndTax = round2(num(r.pndOverride));
    } else {
      r.pndTax = s.pitEnabled ? round2(progressiveTax(Math.max(0, r.annualIncome - r.social * 12)) / 12) : 0;
    }
    r.taxPct = r.total > 0 ? r.pndTax / r.total : 0;

    r.expenseTotal = round2(r.social + r.pndTax + num(r.otherExpense));
    r.net = round2(r.total - r.expenseTotal);
    return r;
  }

  function generatePayroll(period, status) {
    var keep = state.payroll.filter(function (p) { return p.period !== period; });
    var rows = [];
    activeEmps().forEach(function (e) {
      var exist = null;
      state.payroll.forEach(function (p) { if (p.empId === e.id && p.period === period) exist = p; });
      if (exist && exist.status !== 'DRAFT') { rows.push(exist); return; }
      var att = null;
      state.attendance.forEach(function (a) { if (a.empId === e.id && a.period === period) att = a; });
      var row = exist ? computeRow(exist) : newPayRow(e, att, period);
      if (status) row.status = status;
      rows.push(row);
    });
    state.payroll = keep.concat(rows);
    return rows;
  }
  function payRows(period) { return state.payroll.filter(function (p) { return p.period === period; }); }
  function attOf(empId, period) {
    var r = null;
    state.attendance.forEach(function (a) { if (a.empId === empId && a.period === period) r = a; });
    return r;
  }

  /* ---------------- 打卡 ---------------- */
  function punchRows(period) {
    return state.punches.filter(function (p) { return p.date.slice(0, 7) === period; })
      .sort(function (a, b) { return (b.date + b.time).localeCompare(a.date + a.time); });
  }
  function lateLimit() {
    var s = state.settings.shiftStart || '08:00';
    var p = s.split(':'), m = +p[0] * 60 + +p[1] + num(state.settings.graceMinutes);
    return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  }
  function summarizePunches(period) {
    var byEmp = {};
    punchRows(period).forEach(function (p) {
      var k = p.empId + '|' + p.date;
      (byEmp[k] = byEmp[k] || []).push(p.time);
    });
    var perEmp = {};
    Object.keys(byEmp).forEach(function (k) {
      var a = k.split('|'), empId = a[0];
      var times = byEmp[k].slice().sort();
      var st = (perEmp[empId] = perEmp[empId] || { days: 0, late: 0 });
      st.days++;
      if (times[0] > lateLimit()) st.late++;
    });
    return perEmp;
  }

  /* ---------------- 徽标 ---------------- */
  function activeBadge(k) {
    var map = { ACTIVE: 'green', LEAVE: 'cyan', RESIGNED: 'gray' };
    return '<span class="badge ' + (map[k] || 'gray') + '">' + esc(dictName(CONST.activeStatus, k)) + '</span>';
  }
  function hireBadge(k) {
    var map = { PROBATION: 'amber', PASSED: 'green', CONTRACT: 'blue' };
    return '<span class="badge ' + (map[k] || 'gray') + '">' + esc(dictName(CONST.hiringStatus, k)) + '</span>';
  }
  function payBadge(k) {
    var map = { DRAFT: 'gray', CONFIRMED: 'blue', RELEASED: 'green' };
    return '<span class="badge ' + (map[k] || 'gray') + '">' + esc(dictName(CONST.payStatus, k)) + '</span>';
  }
  function docBadge(k) {
    var map = { DRAFT: 'amber', ACTIVE: 'green', EXPIRED: 'gray' };
    return '<span class="badge ' + (map[k] || 'gray') + '">' + esc(dictName(CONST.docStatus, k)) + '</span>';
  }

  /* ---------------- 预警 ---------------- */
  function buildAlerts() {
    var out = [];
    activeEmps().forEach(function (e) {
      function push(type, date, warn) {
        var d = daysUntil(date);
        if (d === null) return;
        if (d <= warn) out.push({ empId: e.id, name: empName(e), type: type, date: date, days: d });
      }
      push('工作证到期', e.wpExpiry, 60);
      push('签证到期', e.visaExpiry, 60);
      push('90天报到', report90Due(e), 30);
      push('合同到期', e.contractExpiry, 90);
    });
    return out.sort(function (a, b) { return a.days - b.days; });
  }

  /* ---------------- 提示 ---------------- */
  var toastTimer;
  function toast(msg) {
    var el = $('#toast'); el.textContent = msg; el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('show'); }, 2400);
  }
  function openModal(o) {
    $('#modalRoot').innerHTML =
      '<div class="overlay" data-overlay><div class="modal ' + (o.wide ? 'wide' : '') + '">' +
      '<div class="modal-head"><div><div class="modal-title">' + esc(o.title) + '</div>' +
      (o.sub ? '<div class="modal-sub">' + esc(o.sub) + '</div>' : '') +
      '</div><button class="close-x" data-act="close-modal">×</button></div>' +
      '<div class="modal-body">' + o.body + '</div>' +
      (o.foot ? '<div class="modal-foot">' + o.foot + '</div>' : '') + '</div></div>';
  }
  function closeModal() { $('#modalRoot').innerHTML = ''; }
  function confirmModal(title, msg, onOk) {
    openModal({
      title: title, body: '<div style="font-size:13.5px;line-height:1.7">' + msg + '</div>',
      foot: '<button class="btn" data-act="close-modal">' + t('取消') + '</button><button class="btn btn-danger" id="confirmOk">' + t('确认') + '</button>'
    });
    $('#confirmOk').onclick = function () { closeModal(); onOk(); };
  }

  /* ---------------- 导航 ---------------- */
  var NAV = [
    { k: 'dashboard', zh: '总览', icon: '<path d="M3 12h6V4H3zM11 20h6V8h-6zM3 20h6v-5H3z"/>' },
    { k: 'employees', zh: '人员档案', icon: '<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.4 2.9-5.2 5.5-5.2S14 15.6 14.6 19"/><path d="M16 6.2a3 3 0 0 1 0 5.6M17.5 19c-.2-2-.8-3.4-1.8-4.4"/>' },
    { k: 'attendance', zh: '考勤管理', icon: '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4"/>' },
    { k: 'payroll', zh: '薪酬核算', icon: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>' },
    { k: 'documents', zh: '制度文件', icon: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4M9 12h6M9 16h6"/>' },
    { k: 'settings', zh: '设置', icon: '<circle cx="12" cy="12" r="3"/><path d="M12 2.5v3M12 18.5v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2.5 12h3M18.5 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>' }
  ];
  var DESC = {
    dashboard: '在职员工与关键指标一览',
    employees: '员工主档 · 28 列 · 对齐 Sheet3',
    attendance: '打卡明细、月度汇总与设备接入',
    payroll: '收入 8 项 / 费用 4 项 · 对齐 Sheet2',
    documents: '制度版本、生效状态与签收登记',
    settings: '公司信息与核算规则'
  };

  function renderNav() {
    var counts = {
      employees: activeEmps().length,
      documents: state.documents.filter(function (d) { return d.status === 'ACTIVE'; }).length
    };
    var html = '<div class="nav-label">' + esc(t('工厂人事工作台')) + '</div>';
    NAV.forEach(function (n) {
      var active = ui.route === n.k ? ' active' : '';
      var c = counts[n.k];
      html += '<div class="nav-item' + active + '" data-act="goto" data-route="' + n.k + '">' +
        '<svg class="nav-ico" viewBox="0 0 24 24">' + n.icon + '</svg><span>' + esc(t(n.zh)) + '</span>' +
        (c !== undefined ? '<span class="nav-count">' + c + '</span>' : '') + '</div>';
    });
    if (window.HRBridge) window.HRBridge.setNav(html);
  }
  function renderTop() {
    var nav = NAV.filter(function (n) { return n.k === ui.route; })[0] || NAV[0];
    if (window.HRBridge) {
      window.HRBridge.setTop({
        title: t(nav.zh), desc: t(DESC[ui.route] || ''), today: iso(new Date()),
        brandName: t('人事工作台'), brandSub: t('泰国 · 罗勇工厂'), backup: t('备份数据')
      });
      window.HRBridge.setLang(lang);
    }
  }

  /* ---------------- 总览 ---------------- */
  function kpiCard(label, value, foot, badge) {
    return '<div class="kpi"><div class="kpi-label">' + esc(t(label)) + '</div>' +
      '<div class="kpi-value">' + value + '</div><div class="kpi-foot">' + (badge || '') +
      '<span class="tiny muted">' + esc(foot || '') + '</span></div></div>';
  }

  function viewDashboard() {
    var act = activeEmps();
    var probation = act.filter(function (e) { return e.hiringStatus === 'PROBATION'; }).length;
    var byType = {};
    act.forEach(function (e) { byType[e.empType] = (byType[e.empType] || 0) + 1; });

    var rows = payRows(currentPeriod());
    var total = 0, net = 0;
    rows.forEach(function (r) { total += num(r.total); net += num(r.net); });

    var alerts = buildAlerts();
    var urgent = alerts.filter(function (a) { return a.days <= 30; });
    var att = state.attendance.filter(function (a) { return a.period === currentPeriod(); });
    var absent = 0, late = 0;
    att.forEach(function (a) { absent += num(a.absentDays); late += num(a.lateCount); });

    var kpi = '<div class="kpi-grid">' +
      kpiCard('在职员工', intf(act.length) + '<small>' + t('人') + '</small>',
        (lang === 'zh' ? 'BOI ' + (byType.BOI || 0) + ' · 中方 ' + (byType.EXPAT || 0) + ' · 外劳 ' + (byType.FOREIGN || 0)
          : 'BOI ' + (byType.BOI || 0) + ' · จีน ' + (byType.EXPAT || 0) + ' · ต่างด้าว ' + (byType.FOREIGN || 0)),
        probation > 0 ? '<span class="badge amber">' + t('试用期到期') + ' ' + probation + '</span>' : '') +
      kpiCard('本月应发合计', rows.length ? money(total) : '<span class="muted" style="font-size:16px">' + t('未生成') + '</span>',
        rows.length ? (t('实发') + ' ' + money(net)) : t('生成薪酬'),
        rows.length ? '<span class="badge green">' + periodLabel(currentPeriod()) + '</span>' : '') +
      kpiCard('到期预警', intf(alerts.length) + '<small>' + t('条') + '</small>',
        (lang === 'zh' ? '30 天内 ' + urgent.length + ' 项需处理' : 'เร่งด่วน ' + urgent.length + ' รายการ'),
        urgent.length ? '<span class="badge red">' + t('需处理') + ' ' + urgent.length + '</span>' : '<span class="badge green">' + t('全部正常') + '</span>') +
      kpiCard('本月考勤异常', intf(absent + late) + '<small>' + t('条') + '</small>',
        (t('缺勤') + ' ' + absent + ' · ' + t('迟到次数') + ' ' + late),
        '<span class="badge ' + ((absent + late) ? 'amber' : 'green') + '">' + periodLabel(currentPeriod()) + '</span>') +
      '</div>';

    var alertHtml = alerts.length ? alerts.slice(0, 8).map(function (a) {
      var cls = a.days < 0 ? 'red' : (a.days <= 30 ? 'amber' : 'gray');
      var txt = a.days < 0 ? (t('已逾期') + ' ' + Math.abs(a.days) + t('天')) : (t('距到期') + ' ' + a.days + t('天'));
      return '<div class="alert-row"><span class="badge ' + cls + '">' + esc(t(a.type)) + '</span>' +
        '<div class="alert-main"><div class="alert-name">' + esc(a.name) + '</div>' +
        '<div class="alert-meta">' + esc(a.date) + '</div></div>' +
        '<div class="alert-right tiny ' + (a.days < 0 ? 'neg' : 'muted') + '">' + esc(txt) + '</div></div>';
    }).join('') : '<div class="empty"><b>' + t('暂无预警') + '</b></div>';

    var deptCount = {};
    act.forEach(function (e) { deptCount[e.deptId] = (deptCount[e.deptId] || 0) + 1; });
    var maxC = 1; Object.keys(deptCount).forEach(function (k) { if (deptCount[k] > maxC) maxC = deptCount[k]; });
    var deptHtml = state.departments.filter(function (d) { return deptCount[d.id]; })
      .sort(function (a, b) { return deptCount[b.id] - deptCount[a.id]; })
      .map(function (d) {
        return '<div class="bar-row"><div class="bar-name">' + esc(deptName(d.id)) + '</div>' +
          '<div class="bar-track"><div class="bar-fill" style="width:' + Math.round(deptCount[d.id] / maxC * 100) + '%"></div></div>' +
          '<div class="bar-val">' + deptCount[d.id] + '</div></div>';
      }).join('');

    var docHtml = state.documents.slice().sort(function (a, b) { return (b.effectiveDate || '').localeCompare(a.effectiveDate || ''); })
      .slice(0, 4).map(function (d) {
        return '<div class="alert-row"><div class="alert-main"><div class="alert-name">' +
          esc(lang === 'th' ? d.titleTh : d.titleZh) + '</div><div class="alert-meta">' +
          esc(d.code) + ' · ' + esc(d.version) + '</div></div><div class="alert-right">' + docBadge(d.status) + '</div></div>';
      }).join('');

    return kpi +
      '<div style="display:grid;grid-template-columns:1.25fr 1fr;gap:14px" class="dash-grid">' +
        '<div class="card"><div class="card-head"><div class="card-title">' + t('预警清单') + '</div>' +
          '<div class="card-actions"><button class="btn btn-sm" data-act="goto" data-route="employees">' + t('人员档案') + '</button></div></div>' +
          '<div class="card-body" style="padding-top:4px;padding-bottom:8px">' + alertHtml + '</div></div>' +
        '<div style="display:flex;flex-direction:column;gap:14px">' +
          '<div class="card"><div class="card-head"><div class="card-title">' + t('部门人数分布') + '</div></div>' +
            '<div class="card-body">' + deptHtml + '</div></div>' +
          '<div class="card"><div class="card-head"><div class="card-title">' + t('制度文件状态') + '</div></div>' +
            '<div class="card-body" style="padding-top:4px;padding-bottom:8px">' + docHtml + '</div></div>' +
        '</div></div>';
  }

  /* ---------------- 人员档案（Sheet3 28 列） ---------------- */
  var EMP_COLS = [
    { k: 'no', zh: '序号', en: 'NO.', th: 'ลำดับ', w: 46, cls: 'c' },
    { k: 'empNo', zh: '工号', en: 'EMPLOYEE ID', th: 'รหัส', w: 92, cls: 'stick' },
    { k: 'name', zh: '姓名', en: 'NAME-SURNAME', th: 'ชื่อ-นามสกุล', w: 180 },
    { k: 'nationality', zh: '国籍', en: 'NATIONALITY', th: 'สัญชาติ', w: 78, cls: 'c' },
    { k: 'gender', zh: '性别', en: 'GENDER', th: 'เพศ', w: 56, cls: 'c' },
    { k: 'dept', zh: '部门', en: 'DEPARTMENT', th: 'แผนก', w: 96 },
    { k: 'position', zh: '职位', en: 'POSITION', th: 'ตำแหน่ง', w: 168 },
    { k: 'empType', zh: '雇佣类型', en: 'TYPE OF EMPLOYEE', th: 'ประเภทการจ้าง', w: 92, cls: 'c' },
    { k: 'birthday', zh: '生日', en: 'BIRTHDAY', th: 'วันเกิด', w: 94, cls: 'c' },
    { k: 'age', zh: '年龄', en: 'AGE', th: 'อายุ', w: 50, cls: 'c' },
    { k: 'passportNo', zh: '护照/身份证', en: 'PASSPORT / ID CARD', th: 'หนังสือเดินทาง', w: 128 },
    { k: 'alienId', zh: '外侨证号', en: 'ALIEN ID', th: 'เลขต่างด้าว', w: 108 },
    { k: 'taxId', zh: '税号', en: 'TAX ID', th: 'เลขผู้เสียภาษี', w: 126 },
    { k: 'ssoId', zh: '社保号', en: 'SSO ID', th: 'เลขประกันสังคม', w: 116 },
    { k: 'contractStart', zh: '合同起始', en: 'CONTRACT START', th: 'เริ่มสัญญา', w: 98, cls: 'c' },
    { k: 'contractExpiry', zh: '合同/试用到期', en: 'CONTRACT / PROBATION EXPIRY', th: 'สิ้นสุดสัญญา', w: 106, cls: 'c' },
    { k: 'visaExpiry', zh: '签证到期', en: 'STAY VISA EXPIRE', th: 'วีซ่าหมดอายุ', w: 98, cls: 'c' },
    { k: 'workPermitNo', zh: '工作证号', en: 'WORK PERMIT NO.', th: 'เลขใบอนุญาต', w: 116 },
    { k: 'wpIssuedDate', zh: '签发日', en: 'ISSUED DATE', th: 'วันที่ออก', w: 94, cls: 'c' },
    { k: 'wpExpiry', zh: '到期日', en: 'EXPIRATION DATE', th: 'วันหมดอายุ', w: 98, cls: 'c' },
    { k: 'last90Report', zh: '上次报到', en: 'LAST 90-DAY REPORT', th: 'รายงานตัวล่าสุด', w: 98, cls: 'c' },
    { k: 'departureDate', zh: '离境日', en: 'DEPARTURE DATE', th: 'วันออกนอกประเทศ', w: 94, cls: 'c' },
    { k: 'report90Due', zh: '90天应报日', en: '90-DAY REPORT DUE', th: 'ครบกำหนดรายงานตัว', w: 106, cls: 'c' },
    { k: 'daysLeft', zh: '剩余天数', en: 'DAYS REMAINING', th: 'วันที่เหลือ', w: 82, cls: 'c' },
    { k: 'hiringStatus', zh: '雇佣状态', en: 'HIRING STATUS', th: 'สถานะการจ้าง', w: 108, cls: 'c' },
    { k: 'activeStatus', zh: '在职状态', en: 'ACTIVE STATUS', th: 'สถานะการทำงาน', w: 98, cls: 'c' },
    { k: 'email', zh: '邮箱', en: 'EMAIL', th: 'อีเมล', w: 186 },
    { k: 'remark', zh: '备注', en: 'REMARK', th: 'หมายเหตุ', w: 230 }
  ];

  function empCell(e, k, idx) {
    switch (k) {
      case 'no': return idx + 1;
      case 'empNo': return esc(e.empNo);
      case 'name': return '<div class="strong ell" style="font-size:12.5px">' + esc(empName(e)) + '</div>' +
        '<div class="tiny muted ell">' + esc(lang === 'zh' ? (e.nameTh || '') : (e.nameZh || '')) + '</div>';
      case 'nationality': return esc(dictName(CONST.nationality, e.nationality));
      case 'gender': return esc(dictName(CONST.gender, e.gender));
      case 'dept': return esc(deptName(e.deptId));
      case 'position': return esc(posName(e));
      case 'empType': return '<span class="badge gray">' + esc(dictName(CONST.empType, e.empType)) + '</span>';
      case 'birthday': return esc(fmtD(e.birthday));
      case 'age': return ageOf(e.birthday) || '—';
      case 'report90Due': return esc(fmtD(report90Due(e)));
      case 'daysLeft': {
        var due = report90Due(e); if (!due) return '—';
        var d = daysUntil(due);
        var cls = d <= 15 ? 'neg strong' : (d <= 30 ? 'strong' : '');
        return '<span class="' + cls + '">' + d + '</span>';
      }
      case 'hiringStatus': return hireBadge(e.hiringStatus);
      case 'activeStatus': return activeBadge(e.activeStatus);
      default: {
        var v = e[k];
        return v ? esc(v) : '<span class="muted">—</span>';
      }
    }
  }

  function viewEmployees() {
    var q = ui.empQ.toLowerCase();
    var list = state.employees.filter(function (e) {
      if (ui.empDept && e.deptId !== ui.empDept) return false;
      if (ui.empType && e.empType !== ui.empType) return false;
      if (ui.empStatus && e.activeStatus !== ui.empStatus) return false;
      if (q) {
        var s = [e.nameEn, e.nameTh, e.nameZh, e.empNo, e.passportNo, e.workPermitNo, e.taxId].join(' ').toLowerCase();
        if (s.indexOf(q) < 0) return false;
      }
      return true;
    });

    var head = EMP_COLS.map(function (c) {
      return '<th style="min-width:' + c.w + 'px" class="' + (c.cls || '') + '">' +
        esc(lang === 'zh' ? c.zh : c.th) + '<span class="en">' + esc(c.en) + '</span></th>';
    }).join('');

    var body = list.map(function (e, i) {
      return '<tr data-act="emp-detail" data-id="' + e.id + '" style="cursor:pointer">' +
        EMP_COLS.map(function (c) { return '<td class="' + (c.cls || '') + '">' + empCell(e, c.k, i) + '</td>'; }).join('') +
        '</tr>';
    }).join('');

    function opts(list2, cur, allLabel) {
      return '<option value="">' + t(allLabel) + '</option>' + list2.map(function (x) {
        return '<option value="' + x.k + '"' + (cur === x.k ? ' selected' : '') + '>' + esc(dictName([x], x.k)) + '</option>';
      }).join('');
    }

    return '<div class="card">' +
      '<div class="toolbar">' +
        '<div class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
          '<input class="input" id="empSearch" placeholder="' + esc(t('搜索姓名 / 工号 / 护照')) + '" value="' + esc(ui.empQ) + '"></div>' +
        '<select class="input" id="fDept" style="width:auto"><option value="">' + t('全部部门') + '</option>' +
          state.departments.map(function (d) { return '<option value="' + d.id + '"' + (ui.empDept === d.id ? ' selected' : '') + '>' + esc(deptName(d.id)) + '</option>'; }).join('') + '</select>' +
        '<select class="input" id="fType" style="width:auto">' + opts(CONST.empType, ui.empType, '全部类型') + '</select>' +
        '<select class="input" id="fStatus" style="width:auto">' + opts(CONST.activeStatus, ui.empStatus, '全部状态') + '</select>' +
        '<div class="spacer"></div>' +
        '<span class="tiny muted">' + t('共') + ' ' + list.length + ' ' + t('条') + '</span>' +
        '<button class="btn btn-sm" data-act="export-emp">' + t('导出 CSV') + '</button>' +
        '<button class="btn btn-primary btn-sm" data-act="emp-new">+ ' + t('新增员工') + '</button>' +
      '</div>' +
      '<div class="xl-wrap"><table class="xl"><thead><tr>' + head + '</tr></thead><tbody>' +
        (body || '<tr><td colspan="28"><div class="empty">—</div></td></tr>') + '</tbody></table></div>' +
      '<div class="tbl-note">' + (lang === 'zh'
        ? '列顺序与字段名对齐 Sheet3（A–AB 共 28 列）。年龄、90 天应报日（上次报到 + 90 天）、剩余天数由系统自动计算。'
        : 'ลำดับคอลัมน์ตรงกับ Sheet3 (A–AB 28 คอลัมน์) อายุ วันครบกำหนดรายงานตัว และวันที่เหลือคำนวณอัตโนมัติ') +
      '</div></div>';
  }

  function openEmployeeDetail(id) {
    var e = getEmp(id); if (!e) return;
    var dl = function (l, v) { return '<dt>' + esc(t(l)) + '</dt><dd>' + (v || '<span class="muted">—</span>') + '</dd>'; };
    var pay = null;
    payRows(currentPeriod()).forEach(function (r) { if (r.empId === id) pay = r; });
    var due = report90Due(e), left = due ? daysUntil(due) : null;

    openModal({
      title: t('人员档案'), sub: e.empNo + ' · ' + empName(e), wide: true,
      body: '<div class="detail-head"><div class="avatar">' + esc((empName(e) || '?').slice(0, 1)) + '</div>' +
          '<div><div class="strong" style="font-size:15px">' + esc(empName(e)) + '</div>' +
          '<div class="tiny muted">' + esc(e.empNo) + ' · ' + esc(deptName(e.deptId)) + ' · ' + esc(posName(e)) + '</div></div>' +
          '<div style="margin-left:auto;display:flex;gap:6px">' + hireBadge(e.hiringStatus) + activeBadge(e.activeStatus) + '</div></div>' +
        '<div class="section-title" style="margin-top:0">' + t('基本信息') + '</div>' +
        '<dl class="kv">' + dl('姓名（英文）', esc(e.nameEn)) + dl('姓名（泰文）', esc(e.nameTh)) +
          dl('姓名（中文）', esc(e.nameZh)) + dl('国籍', esc(dictName(CONST.nationality, e.nationality))) +
          dl('性别', esc(dictName(CONST.gender, e.gender))) +
          dl('生日', esc(fmtD(e.birthday)) + (ageOf(e.birthday) ? '（' + ageOf(e.birthday) + '）' : '')) +
          dl('邮箱', esc(e.email)) + dl('雇佣类型', esc(dictName(CONST.empType, e.empType))) + '</dl>' +
        '<div class="section-title">' + t('证件与合同') + '</div>' +
        '<dl class="kv">' + dl('护照/身份证号', esc(e.passportNo)) + dl('外侨证号', esc(e.alienId)) +
          dl('税号', esc(e.taxId)) + dl('社保号', esc(e.ssoId)) +
          dl('合同起始日', esc(e.contractStart)) + dl('合同/试用到期日', esc(e.contractExpiry)) + '</dl>' +
        '<div class="section-title">' + t('签证与工作许可') + '</div>' +
        '<dl class="kv">' + dl('签证到期日', esc(e.visaExpiry)) + dl('工作证号', esc(e.workPermitNo)) +
          dl('签发日', esc(e.wpIssuedDate)) + dl('到期日', esc(e.wpExpiry)) + '</dl>' +
        '<div class="section-title">' + t('90天报到') + '</div>' +
        '<dl class="kv">' + dl('上次报到日', esc(e.last90Report)) + dl('离境日', esc(e.departureDate)) +
          dl('90天应报日', esc(due)) +
          dl('剩余天数', left === null ? '—' : ('<span class="' + (left <= 15 ? 'neg strong' : '') + '">' + left + '</span>')) + '</dl>' +
        '<div class="section-title">' + t('薪酬信息') + '</div>' +
        '<dl class="kv">' + dl('工资基数', '<span class="mono">' + money(e.baseSalary) + '</span>') +
          dl('岗位补贴', '<span class="mono">' + money(e.positionAllowance) + '</span>') +
          dl('差旅费', '<span class="mono">' + money(e.travelAllowance) + '</span>') +
          dl('住房津贴', '<span class="mono">' + money(e.housingAllowance) + '</span>') +
          dl('餐补', '<span class="mono">' + money(e.foodAllowance) + '</span>') +
          dl('班次津贴', '<span class="mono">' + money(e.shiftAllowance) + '</span>') +
          dl('本月实发', pay ? '<span class="mono strong">' + money(pay.net) + '</span>' : t('未生成')) + '</dl>' +
        '<div class="section-title">' + t('银行信息') + '</div>' +
        '<dl class="kv">' + dl('银行名称', esc(e.bankName)) + dl('银行账户', esc(e.bankAccount)) + dl('户名', esc(e.accountName)) + '</dl>' +
        (e.remark ? '<div class="section-title">' + t('备注') + '</div><div class="small">' + esc(e.remark) + '</div>' : ''),
      foot: '<button class="btn" data-act="close-modal">' + t('关闭') + '</button>' +
        '<button class="btn btn-primary" data-act="emp-edit" data-id="' + e.id + '">' + t('编辑') + '</button>'
    });
  }

  function empForm(e) {
    e = e || {};
    function inp(id, label, key, type) {
      return '<div class="field"><label>' + esc(t(label)) + '</label><input class="input" id="f_' + id + '" type="' + (type || 'text') +
        '" value="' + esc(e[key] === undefined ? '' : e[key]) + '"' + (type === 'number' ? ' step="0.01"' : '') + '></div>';
    }
    function sel(id, label, list, cur) {
      return '<div class="field"><label>' + esc(t(label)) + '</label><select class="input" id="f_' + id + '">' +
        list.map(function (x) { return '<option value="' + x.k + '"' + (cur === x.k ? ' selected' : '') + '>' + esc(lang === 'th' ? x.th : x.zh) + '</option>'; }).join('') +
        '</select></div>';
    }
    var deptOpts = state.departments.map(function (d) {
      return '<option value="' + d.id + '"' + (e.deptId === d.id ? ' selected' : '') + '>' + esc(deptName(d.id)) + '</option>';
    }).join('');

    return '<div class="section-title" style="margin-top:0">' + t('基本信息') + '</div>' +
      '<div class="grid-3">' + inp('empNo', '工号', 'empNo') + inp('nameEn', '姓名（英文）', 'nameEn') + inp('nameTh', '姓名（泰文）', 'nameTh') + '</div>' +
      '<div class="grid-3">' + inp('nameZh', '姓名（中文）', 'nameZh') +
        sel('nationality', '国籍', CONST.nationality, e.nationality || 'TH') +
        sel('gender', '性别', CONST.gender, e.gender || 'M') + '</div>' +
      '<div class="grid-3">' + inp('birthday', '生日', 'birthday', 'date') +
        sel('empType', '雇佣类型', CONST.empType, e.empType || 'THAI') +
        '<div class="field"><label>' + t('部门') + '</label><select class="input" id="f_deptId">' + deptOpts + '</select></div></div>' +
      '<div class="grid-3">' + inp('positionEn', '职位', 'positionEn') + inp('positionZh', '岗位', 'positionZh') +
        sel('hiringStatus', '雇佣状态', CONST.hiringStatus, e.hiringStatus || 'PASSED') + '</div>' +
      '<div class="grid-3">' + sel('activeStatus', '在职状态', CONST.activeStatus, e.activeStatus || 'ACTIVE') +
        inp('email', '邮箱', 'email') + '<div></div></div>' +

      '<div class="section-title">' + t('证件与合同') + '</div>' +
      '<div class="grid-3">' + inp('passportNo', '护照/身份证号', 'passportNo') + inp('alienId', '外侨证号', 'alienId') + inp('taxId', '税号', 'taxId') + '</div>' +
      '<div class="grid-3">' + inp('ssoId', '社保号', 'ssoId') + inp('contractStart', '合同起始日', 'contractStart', 'date') +
        inp('contractExpiry', '合同/试用到期日', 'contractExpiry', 'date') + '</div>' +

      '<div class="section-title">' + t('签证与工作许可') + '</div>' +
      '<div class="grid-3">' + inp('visaExpiry', '签证到期日', 'visaExpiry', 'date') + inp('workPermitNo', '工作证号', 'workPermitNo') +
        inp('wpIssuedDate', '签发日', 'wpIssuedDate', 'date') + '</div>' +
      '<div class="grid-3">' + inp('wpExpiry', '到期日', 'wpExpiry', 'date') + '<div></div><div></div></div>' +

      '<div class="section-title">' + t('90天报到') + '</div>' +
      '<div class="grid-3">' + inp('last90Report', '上次报到日', 'last90Report', 'date') + inp('departureDate', '离境日', 'departureDate', 'date') +
        '<div class="field"><label>' + t('90天应报日') + '</label><input class="input" readonly value="' + esc(report90Due(e)) + '">' +
        '<div class="hint">' + (lang === 'zh' ? '上次报到日 + 90 天，自动计算' : 'คำนวณจากวันรายงานตัวล่าสุด + 90 วัน') + '</div></div></div>' +

      '<div class="section-title">' + t('薪酬信息') + '</div>' +
      '<div class="grid-3">' + inp('baseSalary', '工资基数', 'baseSalary', 'number') + inp('positionAllowance', '岗位补贴', 'positionAllowance', 'number') +
        inp('travelAllowance', '差旅费', 'travelAllowance', 'number') + '</div>' +
      '<div class="grid-3">' + inp('housingAllowance', '住房津贴', 'housingAllowance', 'number') + inp('foodAllowance', '餐补', 'foodAllowance', 'number') +
        inp('shiftAllowance', '班次津贴', 'shiftAllowance', 'number') + '</div>' +
      '<div class="grid-3">' + inp('kpi', 'KPI', 'kpi', 'number') +
        '<div class="field"><label>' + t('是否计加班') + '</label><select class="input" id="f_otEligible">' +
          '<option value="true"' + (e.otEligible !== false ? ' selected' : '') + '>是</option>' +
          '<option value="false"' + (e.otEligible === false ? ' selected' : '') + '>否</option></select></div><div></div></div>' +

      '<div class="section-title">' + t('银行信息') + '</div>' +
      '<div class="grid-3">' + inp('bankName', '银行名称', 'bankName') + inp('bankAccount', '银行账户', 'bankAccount') + inp('accountName', '户名', 'accountName') + '</div>' +
      '<div class="field"><label>' + t('备注') + '</label><textarea class="input" id="f_remark" rows="2">' + esc(e.remark || '') + '</textarea></div>';
  }
  function openEmployeeForm(id) {
    var e = id ? getEmp(id) : null;
    openModal({
      title: e ? t('编辑员工') : t('新增员工'), sub: e ? e.empNo : '', wide: true,
      body: empForm(e || {}),
      foot: '<button class="btn" data-act="close-modal">' + t('取消') + '</button>' +
        '<button class="btn btn-primary" data-act="emp-save" data-id="' + (id || '') + '">' + t('保存') + '</button>'
    });
  }
  function collectEmp(id) {
    var g = function (k) { var el = $('#f_' + k); return el ? el.value.trim() : ''; };
    if (!g('nameEn') && !g('nameTh') && !g('nameZh')) { toast(t('请填写姓名')); return null; }
    return {
      id: id || uid('e'),
      empNo: g('empNo') || ('CSR' + String(state.employees.length + 1).padStart(3, '0')),
      nameEn: g('nameEn'), nameTh: g('nameTh'), nameZh: g('nameZh'),
      nationality: g('nationality'), gender: g('gender'), empType: g('empType'),
      deptId: g('deptId'), positionEn: g('positionEn'), positionZh: g('positionZh'),
      hiringStatus: g('hiringStatus'), activeStatus: g('activeStatus'), email: g('email'),
      birthday: g('birthday'), passportNo: g('passportNo'), alienId: g('alienId'),
      taxId: g('taxId'), ssoId: g('ssoId'),
      contractStart: g('contractStart'), contractExpiry: g('contractExpiry'),
      visaExpiry: g('visaExpiry'), workPermitNo: g('workPermitNo'),
      wpIssuedDate: g('wpIssuedDate'), wpExpiry: g('wpExpiry'),
      last90Report: g('last90Report'), departureDate: g('departureDate'),
      baseSalary: num(g('baseSalary')), positionAllowance: num(g('positionAllowance')),
      travelAllowance: num(g('travelAllowance')), housingAllowance: num(g('housingAllowance')),
      foodAllowance: num(g('foodAllowance')), shiftAllowance: num(g('shiftAllowance')),
      kpi: num(g('kpi')), otEligible: g('otEligible') === 'true',
      bankName: g('bankName'), bankAccount: g('bankAccount'), accountName: g('accountName'),
      remark: g('remark')
    };
  }

  /* ---------------- 考勤 ---------------- */
  function viewAttendance() {
    var tabs = '<div class="tabs">' +
      '<button class="' + (ui.attTab === 'punch' ? 'on' : '') + '" data-act="att-tab" data-tab="punch">' + t('打卡明细') + '</button>' +
      '<button class="' + (ui.attTab === 'summary' ? 'on' : '') + '" data-act="att-tab" data-tab="summary">' + t('月度汇总') + '</button></div>';
    return ui.attTab === 'summary' ? attSummary(tabs) : attPunch(tabs);
  }

  function attPunch(tabs) {
    var rows = punchRows(ui.period);
    var devById = {};
    state.devices.forEach(function (d) { devById[d.id] = d; });

    var list = rows.slice(0, 200).map(function (p) {
      var e = getEmp(p.empId) || {};
      var isIn = p.time < '12:00';
      return '<tr><td class="c">' + esc(p.date) + '</td><td class="c mono">' + esc(p.time) + '</td>' +
        '<td class="mono tiny">' + esc(e.empNo || '') + '</td><td>' + esc(e.nameEn || '') + '</td>' +
        '<td class="tiny">' + esc(devById[p.deviceId] ? devById[p.deviceId].name : '—') + '</td>' +
        '<td class="c"><span class="' + (isIn ? 'punch-in' : 'punch-out') + '">' + t(isIn ? '上班' : '下班') + '</span></td>' +
        '<td class="c tiny muted">' + esc(p.source === 'SEED' ? '设备' : p.source) + '</td></tr>';
    }).join('');

    var devHtml = state.devices.map(function (d) {
      var online = d.status === 'ONLINE';
      return '<div class="dev"><div class="dev-head">' +
        '<span class="badge ' + (online ? 'green' : 'gray') + '">' + t(online ? '在线' : '离线') + '</span>' +
        '<span class="dev-name">' + esc(lang === 'th' ? d.nameTh : d.name) + '</span></div>' +
        '<div class="dev-meta">' + esc(d.model) + ' · SN ' + esc(d.sn) + '<br>IP ' + esc(d.ip) + ' · ' + esc(d.protocol) + '<br>' +
        t('最后同步') + '：' + esc(d.lastSync) + '</div></div>';
    }).join('');

    return '<div class="card"><div class="toolbar">' + tabs +
        '<button class="btn btn-sm" data-act="period-prev">‹</button>' +
        '<span class="strong" style="min-width:118px;text-align:center">' + periodLabel(ui.period) + '</span>' +
        '<button class="btn btn-sm" data-act="period-next">›</button>' +
        '<div class="spacer"></div>' +
        '<span class="tiny muted">' + rows.length + ' ' + t('条记录') + '</span>' +
        '<button class="btn btn-sm" data-act="punch-template">' + t('下载导入模板') + '</button>' +
        '<button class="btn btn-primary btn-sm" data-act="punch-import">' + t('导入打卡数据') + '</button>' +
      '</div>' +
      '<div class="xl-wrap" style="max-height:none"><table class="xl"><thead><tr>' +
        '<th style="min-width:96px">' + t('日期') + '<span class="en">DATE</span></th>' +
        '<th style="min-width:80px">' + t('时间') + '<span class="en">TIME</span></th>' +
        '<th style="min-width:92px">' + t('工号') + '<span class="en">EMPLOYEE ID</span></th>' +
        '<th style="min-width:180px">' + t('姓名') + '<span class="en">NAME</span></th>' +
        '<th style="min-width:200px">' + t('设备') + '<span class="en">DEVICE</span></th>' +
        '<th style="min-width:80px">' + t('方向') + '<span class="en">DIRECTION</span></th>' +
        '<th style="min-width:90px">' + t('来源') + '<span class="en">SOURCE</span></th>' +
      '</tr></thead><tbody>' + (list || '<tr><td colspan="7"><div class="empty"><b>' + t('暂无打卡记录') + '</b></div></td></tr>') + '</tbody></table></div>' +
      '<div class="tbl-note">' + (lang === 'zh'
        ? '打卡记录来自设备导出文件导入；12:00 前视为上班、之后视为下班。实时推送需接收端点，见下方设备台账说明。'
        : 'ข้อมูลนำเข้าจากไฟล์ที่อุปกรณ์ส่งออก ก่อน 12:00 ถือเป็นเข้างาน') + '</div></div>' +
      '<div class="card mt12"><div class="card-head"><div class="card-title">' + t('设备台账') + '</div>' +
        '<div class="card-sub">' + (lang === 'zh' ? '打卡机型号 / 接入方式 / 同步状态' : 'รุ่น / การเชื่อมต่อ / สถานะ') + '</div></div>' +
        '<div class="card-body"><div class="dev-grid">' + devHtml + '</div>' +
        '<div class="rule-box mt12">' + (lang === 'zh'
          ? '<b>三种回传方式</b>：① 设备导出 CSV/TXT → 本页导入（现在就能用，不需要服务器）；② 设备开启 ADMS / HTTP 推送，把记录 POST 到接收端点（需一台内网小主机或云函数）；③ 厂商云平台 API 定时拉取（ZKTeco / Hikvision 等开放接口）。'
          : '<b>3 ช่องทาง</b>：① นำเข้าไฟล์ CSV/TXT ② ADMS/HTTP push ไปยังปลายทาง ③ API ผู้ผลิต') +
        '</div></div></div>';
  }

  function attSummary(tabs) {
    var p = ui.period, cur = currentPeriod();
    var expected = workDaysInMonth(p, p === cur);
    var punchStat = summarizePunches(p);
    var hasPunch = Object.keys(punchStat).length > 0;

    var rows = activeEmps().map(function (e) {
      var a = attOf(e.id, p) || { presentDays: 0, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 0, otRest: 0, otHoliday: 0, note: '' };
      var ps = punchStat[e.id];
      return '<tr><td class="mono tiny">' + esc(e.empNo) + '</td>' +
        '<td><div class="strong">' + esc(empName(e)) + '</div><div class="tiny muted">' + esc(deptName(e.deptId)) + '</div></td>' +
        '<td class="num">' + expected + '</td>' +
        '<td class="num">' + num(a.presentDays) + (ps ? ' <span class="badge green">' + ps.days + '</span>' : '') + '</td>' +
        '<td class="num' + (num(a.absentDays) ? ' neg' : '') + '">' + num(a.absentDays) + '</td>' +
        '<td class="num' + (num(a.lateCount) ? ' neg' : '') + '">' + num(a.lateCount) + '</td>' +
        '<td class="num">' + (num(a.leaveDays) ? num(a.leaveDays) + ' <span class="tiny muted">' + esc(dictName(CONST.leaveType, a.leaveType)) + '</span>' : '—') + '</td>' +
        '<td class="num mono">' + (num(a.otWeekday) || '—') + '</td>' +
        '<td class="num mono">' + (num(a.otRest) || '—') + '</td>' +
        '<td class="num mono">' + (num(a.otHoliday) || '—') + '</td>' +
        '<td class="tiny muted" style="max-width:170px">' + (a.note ? esc(a.note) : (num(a.absentDays) > 0 ? '<span class="badge amber">' + t('待说明') + '</span>' : '')) + '</td>' +
        '<td><button class="btn btn-sm" data-act="att-edit" data-id="' + e.id + '">' + t('编辑') + '</button></td></tr>';
    }).join('');

    return '<div class="card"><div class="toolbar">' + tabs +
        '<button class="btn btn-sm" data-act="period-prev">‹</button>' +
        '<span class="strong" style="min-width:118px;text-align:center">' + periodLabel(p) + '</span>' +
        '<button class="btn btn-sm" data-act="period-next">›</button>' +
        '<span class="badge blue">' + t('应出勤') + ' ' + expected + ' ' + t('天') + '</span>' +
        (hasPunch ? '<span class="badge green">' + (lang === 'zh' ? '有打卡数据' : 'มีข้อมูลลงเวลา') + '</span>' : '') +
        '<div class="spacer"></div>' +
        '<button class="btn btn-sm" data-act="export-att">' + t('导出 CSV') + '</button>' +
        '<button class="btn btn-sm" data-act="att-from-punch">' + t('汇总到月度') + '</button>' +
        '<button class="btn btn-primary btn-sm" data-act="pay-generate">' + t('生成薪酬') + ' →</button>' +
      '</div>' +
      '<div class="table-wrap"><table class="data"><thead><tr>' +
        '<th>' + t('工号') + '</th><th>' + t('姓名') + '</th><th class="num">' + t('应出勤') + '</th>' +
        '<th class="num">' + t('实际出勤') + '</th><th class="num">' + t('缺勤') + '</th>' +
        '<th class="num">' + t('迟到次数') + '</th><th class="num">' + t('请假') + '</th>' +
        '<th class="num">' + t('工作日加班') + '</th><th class="num">' + t('休息日加班') + '</th>' +
        '<th class="num">' + t('法定假日加班') + '</th><th>' + t('备注') + '</th><th>' + t('操作') + '</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<div class="tbl-note">' + (lang === 'zh'
        ? '「汇总到月度」会用打卡明细重算实际出勤与迟到次数，并按 应出勤 − 实际出勤 − 请假 推导缺勤；加班小时仍需班组长审批后手工登记。'
        : 'ปุ่มสรุปจะคำนวณวันมาทำงานและมาสายจากข้อมูลลงเวลา') + '</div></div>';
  }

  function openAttForm(empId) {
    var e = getEmp(empId), p = ui.period;
    var a = attOf(empId, p) || { presentDays: 0, absentDays: 0, lateCount: 0, leaveDays: 0, leaveType: 'NONE', otWeekday: 0, otRest: 0, otHoliday: 0, note: '' };
    function inp(id, label, val) { return '<div class="field"><label>' + esc(t(label)) + '</label><input class="input" id="' + id + '" type="number" step="0.5" value="' + esc(val) + '"></div>'; }
    openModal({
      title: t('月度汇总'), sub: empName(e) + ' · ' + e.empNo + ' · ' + periodLabel(p),
      body: '<div class="grid-3">' + inp('a_present', '实际出勤', a.presentDays) + inp('a_absent', '缺勤', a.absentDays) + inp('a_late', '迟到次数', a.lateCount) + '</div>' +
        '<div class="grid-3">' + inp('a_leave', '请假', a.leaveDays) +
        '<div class="field"><label>' + t('备注') + '</label><select class="input" id="a_leaveType">' +
          CONST.leaveType.map(function (x) { return '<option value="' + x.k + '"' + (a.leaveType === x.k ? ' selected' : '') + '>' + esc(lang === 'th' ? x.th : x.zh) + '</option>'; }).join('') + '</select></div><div></div></div>' +
        '<div class="grid-3">' + inp('a_otW', '工作日加班', a.otWeekday) + inp('a_otR', '休息日加班', a.otRest) + inp('a_otH', '法定假日加班', a.otHoliday) + '</div>' +
        '<div class="field"><label>' + t('备注') + '</label><input class="input" id="a_note" value="' + esc(a.note || '') + '"></div>' +
        '<div class="rule-box">' + (lang === 'zh'
          ? '加班小时按设置中的倍率自动进入薪酬核算（工作日 / 休息日 / 法定假日）。'
          : 'ชั่วโมง OT จะถูกคำนวณในเงินเดือนอัตโนมัติ') + '</div>',
      foot: '<button class="btn" data-act="close-modal">' + t('取消') + '</button>' +
        '<button class="btn btn-primary" data-act="att-save" data-id="' + empId + '">' + t('保存') + '</button>'
    });
  }

  /* ---------------- 打卡导入 ---------------- */
  function openPunchImport() {
    openModal({
      title: t('导入打卡数据'), wide: true,
      sub: lang === 'zh' ? '支持设备导出的 CSV / TXT（逗号、Tab 分隔均可）' : 'รองรับไฟล์ CSV / TXT จากอุปกรณ์',
      body: '<div class="rule-box" style="margin-bottom:12px">' +
          (lang === 'zh'
            ? '每行一条记录，字段顺序：<b>工号, 日期, 时间[, 设备SN]</b>。日期支持 2026-11-19 或 19/11/2026。<br>示例：<code>CSR003,2026-11-19,07:52,ZK2208A1547</code>'
            : 'รูปแบบ: <b>รหัสพนักงาน, วันที่, เวลา[, SN]</b>') +
        '</div>' +
        '<div class="import-box" style="margin-bottom:10px">' +
          '<input type="file" id="punchFile" accept=".csv,.txt,.tsv" style="display:none">' +
          '<button class="btn" data-act="punch-pick">' + (lang === 'zh' ? '选择文件' : 'เลือกไฟล์') + '</button>' +
          '<span class="tiny muted" style="margin-left:8px">' + (lang === 'zh' ? '或直接粘贴到下方' : 'หรือวางด้านล่าง') + '</span>' +
        '</div>' +
        '<textarea class="input code" id="punchText" rows="8" placeholder="CSR003,2026-11-19,07:52&#10;CSR003,2026-11-19,17:06"></textarea>' +
        '<div class="hint">' + (lang === 'zh' ? '导入前会做匹配校验，未匹配到工号的记录会被跳过并计数。' : '') + '</div>',
      foot: '<button class="btn" data-act="close-modal">' + t('取消') + '</button>' +
        '<button class="btn btn-primary" data-act="punch-do">' + t('导入') + '</button>'
    });
    var fi = $('#punchFile');
    if (fi) fi.onchange = function () {
      var f = fi.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { $('#punchText').value = String(rd.result); };
      rd.readAsText(f, 'utf-8');
    };
  }

  function parsePunch(text) {
    var out = { rows: [], unknown: 0, bad: 0 };
    String(text || '').split(/\r?\n/).forEach(function (line) {
      line = line.trim();
      if (!line) return;
      if (/^(employee|工号|emp)/i.test(line)) return;
      var parts = line.split(/[,\t;]+/).map(function (s) { return s.trim(); });
      var empNo = '', date = '', time = '', sn = '';
      parts.forEach(function (p) {
        if (!empNo && /^[A-Za-z]{2,4}-?\d{2,6}$/.test(p)) empNo = p;
        if (!date && /^\d{4}-\d{1,2}-\d{1,2}$/.test(p)) {
          var a = p.split('-');
          date = a[0] + '-' + String(+a[1]).padStart(2, '0') + '-' + String(+a[2]).padStart(2, '0');
        }
        if (!date && /^\d{1,2}[\/.]\d{1,2}[\/.]\d{4}$/.test(p)) {
          var b = p.split(/[\/.]/);
          date = b[2] + '-' + String(+b[1]).padStart(2, '0') + '-' + String(+b[0]).padStart(2, '0');
        }
        if (!time && /^\d{1,2}:\d{2}(:\d{2})?$/.test(p)) time = (p.slice(0, 5).length === 4 ? '0' + p.slice(0, 5) : p.slice(0, 5));
        if (!sn && /^[A-Z]{2}\d{6,}$/i.test(p)) sn = p;
      });
      if (!empNo || !date || !time) { out.bad++; return; }
      var emp = null;
      state.employees.forEach(function (e) { if (e.empNo.toUpperCase() === empNo.toUpperCase()) emp = e; });
      if (!emp) { out.unknown++; return; }
      var dev = null;
      if (sn) state.devices.forEach(function (d) { if (d.sn.toUpperCase() === sn.toUpperCase()) dev = d; });
      out.rows.push({ id: uid('p'), empId: emp.id, date: date, time: time, deviceId: dev ? dev.id : 'dev01', source: 'IMPORT' });
    });
    return out;
  }

  function doPunchImport() {
    var txt = $('#punchText').value;
    if (!txt.trim()) { toast(t('请粘贴或选择文件')); return; }
    var res = parsePunch(txt), added = 0;
    res.rows.forEach(function (r) {
      var dup = state.punches.some(function (p) { return p.empId === r.empId && p.date === r.date && p.time === r.time; });
      if (!dup) { state.punches.push(r); added++; }
    });
    save(); closeModal(); ui.attTab = 'punch'; render();
    toast(t('已导入') + ' ' + added + ' ' + t('条记录') +
      (res.unknown ? ' · ' + t('未匹配') + ' ' + res.unknown : '') +
      (res.bad ? ' · ' + t('解析失败') + ' ' + res.bad : ''));
  }

  function attFromPunch() {
    var p = ui.period, expected = workDaysInMonth(p, p === currentPeriod());
    var stat = summarizePunches(p), n = 0;
    Object.keys(stat).forEach(function (empId) {
      var rec = attOf(empId, p);
      if (!rec) {
        rec = { empId: empId, period: p, leaveType: 'NONE', otWeekday: 0, otRest: 0, otHoliday: 0, note: '' };
        state.attendance.push(rec);
      }
      rec.presentDays = stat[empId].days;
      rec.lateCount = stat[empId].late;
      rec.absentDays = Math.max(0, expected - rec.presentDays - num(rec.leaveDays));
      n++;
    });
    save(); render();
    toast((lang === 'zh' ? '已汇总 ' : 'สรุปแล้ว ') + n + ' ' + t('人'));
  }

  /* ---------------- 薪酬（Sheet2） ---------------- */
  function h(zh, en, th) {
    return '<span>' + esc(lang === 'zh' ? zh : th) + '</span><span class="en">' + esc(en) + '</span>';
  }

  function viewPayroll() {
    var p = ui.period, rows = payRows(p);
    var sum = { total: 0, social: 0, pnd: 0, other: 0, net: 0, exp: 0 };
    rows.forEach(function (r) {
      sum.total += num(r.total); sum.social += num(r.social); sum.pnd += num(r.pndTax);
      sum.other += num(r.otherExpense); sum.exp += num(r.expenseTotal); sum.net += num(r.net);
    });
    var expected = workDaysInMonth(p, p === currentPeriod());

    var head = '<thead>' +
      '<tr>' +
        '<th rowspan="3" style="min-width:44px">' + h('项', 'Item', 'ลำดับ') + '</th>' +
        '<th rowspan="3" class="stick" style="min-width:88px">' + h('代码', 'Code', 'รหัส') + '</th>' +
        '<th rowspan="3" style="min-width:150px">' + h('姓名', 'Name-Surname', 'ชื่อ-นามสกุล') + '</th>' +
        '<th rowspan="3" style="min-width:92px">' + h('部门', 'Department', 'แผนก') + '</th>' +
        '<th rowspan="3" style="min-width:140px">' + h('职位', 'Position', 'ตำแหน่ง') + '</th>' +
        '<th rowspan="3" style="min-width:96px">' + h('入职日期', 'Commencement Date', 'วันที่เริ่มงาน') + '</th>' +
        '<th rowspan="3" style="min-width:76px">' + h('应出勤', 'Attendance days required', 'วันทำงานตามกำหนด') + '</th>' +
        '<th rowspan="3" style="min-width:76px">' + h('实际出勤', 'Actual attendance days', 'วันมาทำงาน') + '</th>' +
        '<th colspan="8" class="grp">INCOME / ' + esc(t('收入')) + '</th>' +
        '<th rowspan="3" style="min-width:88px">' + h('合计', 'Total', 'รวม') + '</th>' +
        '<th rowspan="3" style="min-width:96px">' + h('年收入', 'Annual Income', 'รายได้ต่อปี') + '</th>' +
        '<th colspan="4" class="grp">Expenses / ' + esc(t('费用')) + '</th>' +
        '<th rowspan="3" style="min-width:80px">' + h('合计', 'Total', 'รวม') + '</th>' +
        '<th rowspan="3" style="min-width:92px">' + h('实发金额', 'Net Received', 'ยอดสุทธิ') + '</th>' +
        '<th rowspan="3" style="min-width:112px">' + h('银行名称', 'Bank Name', 'ธนาคาร') + '</th>' +
        '<th rowspan="3" style="min-width:120px">' + h('银行账户', 'Bank Account Number', 'เลขบัญชี') + '</th>' +
        '<th rowspan="3" style="min-width:120px">' + h('户名', 'Account Name', 'ชื่อบัญชี') + '</th>' +
        '<th rowspan="3" style="min-width:150px">' + h('备注', 'Remark', 'หมายเหตุ') + '</th>' +
      '</tr>' +
      '<tr>' +
        '<th style="min-width:84px">Salary Base</th><th style="min-width:82px">Position allowance</th>' +
        '<th style="min-width:78px">Travel expenses</th><th style="min-width:82px">Housing allowance</th>' +
        '<th style="min-width:64px">Food</th><th style="min-width:76px">Over time</th>' +
        '<th style="min-width:64px">Shift</th><th rowspan="2" style="min-width:60px">KPI</th>' +
        '<th style="min-width:70px">Social</th><th style="min-width:56px">Tax %</th>' +
        '<th style="min-width:82px">PND. Tax</th><th style="min-width:64px">Other</th>' +
      '</tr>' +
      '<tr>' +
        '<th>' + esc(lang === 'zh' ? '工资基数' : 'เงินเดือนพื้นฐาน') + '</th>' +
        '<th>' + esc(lang === 'zh' ? '岗位补贴' : 'เบี้ยตำแหน่ง') + '</th>' +
        '<th>' + esc(lang === 'zh' ? '差旅费' : 'ค่าพาหนะ') + '</th>' +
        '<th>' + esc(lang === 'zh' ? '住房津贴' : 'ค่าเช่าบ้าน') + '</th>' +
        '<th>' + esc(lang === 'zh' ? '餐补' : 'ค่าอาหาร') + '</th>' +
        '<th>' + esc(lang === 'zh' ? '加班费' : 'ค่าล่วงเวลา') + '</th>' +
        '<th>' + esc(lang === 'zh' ? '班次津贴' : 'ค่ากะ') + '</th>' +
        '<th>' + esc(lang === 'zh' ? '社保' : 'ประกันสังคม') + '</th>' +
        '<th>' + esc(lang === 'zh' ? '比例' : 'อัตรา') + '</th>' +
        '<th>' + esc(lang === 'zh' ? '个人所得税' : 'ภาษี') + '</th>' +
        '<th>' + esc(lang === 'zh' ? '其他' : 'อื่น ๆ') + '</th>' +
      '</tr></thead>';

    var body = rows.map(function (r, i) {
      var e = getEmp(r.empId) || {}, a = attOf(r.empId, p);
      return '<tr data-act="pay-edit" data-id="' + r.id + '" style="cursor:pointer">' +
        '<td class="c">' + (i + 1) + '</td>' +
        '<td class="stick mono tiny">' + esc(e.empNo || '') + '</td>' +
        '<td>' + esc(e.nameEn || '') + '</td>' +
        '<td class="tiny">' + esc(deptName(e.deptId)) + '</td>' +
        '<td class="tiny">' + esc(e.positionEn || '') + '</td>' +
        '<td class="c tiny">' + esc(e.contractStart || '') + '</td>' +
        '<td class="c">' + expected + '</td>' +
        '<td class="c">' + (a ? num(a.presentDays) : 0) + '</td>' +
        '<td class="num">' + money(r.baseSalary) + '</td>' +
        '<td class="num">' + money(r.positionAllowance) + '</td>' +
        '<td class="num">' + money(r.travelAllowance) + '</td>' +
        '<td class="num">' + money(r.housingAllowance) + '</td>' +
        '<td class="num">' + money(r.foodAllowance) + '</td>' +
        '<td class="num">' + money(r.otPay) + '</td>' +
        '<td class="num">' + money(r.shiftAllowance) + '</td>' +
        '<td class="num">' + money(r.kpi) + '</td>' +
        '<td class="num strong">' + money(r.total) + '</td>' +
        '<td class="num">' + money(r.annualIncome) + '</td>' +
        '<td class="num">' + money(r.social) + '</td>' +
        '<td class="num">' + (r.taxPct * 100).toFixed(1) + '%</td>' +
        '<td class="num">' + money(r.pndTax) + '</td>' +
        '<td class="num">' + money(r.otherExpense) + '</td>' +
        '<td class="num">' + money(r.expenseTotal) + '</td>' +
        '<td class="num strong">' + money(r.net) + '</td>' +
        '<td class="tiny">' + esc(r.bankName || '') + '</td>' +
        '<td class="tiny mono">' + esc(r.bankAccount || '') + '</td>' +
        '<td class="tiny">' + esc(r.accountName || '') + '</td>' +
        '<td class="tiny muted">' + esc(r.remark || '') + '</td>' +
        '</tr>';
    }).join('');

    var foot = rows.length ? '<tfoot><tr>' +
      '<td colspan="8" class="num strong" style="background:#f8fafc;position:sticky;left:0">' + t('合计') + '</td>' +
      '<td colspan="9" class="num strong" style="background:#f8fafc">' + money(sum.total) + '</td>' +
      '<td class="num" style="background:#f8fafc"></td>' +
      '<td class="num strong" style="background:#f8fafc">' + money(sum.social) + '</td>' +
      '<td class="num" style="background:#f8fafc"></td>' +
      '<td class="num strong" style="background:#f8fafc">' + money(sum.pnd) + '</td>' +
      '<td class="num strong" style="background:#f8fafc">' + money(sum.other) + '</td>' +
      '<td class="num strong" style="background:#f8fafc">' + money(sum.exp) + '</td>' +
      '<td class="num strong" style="background:#f8fafc">' + money(sum.net) + '</td>' +
      '<td colspan="4" style="background:#f8fafc"></td>' +
      '</tr></tfoot>' : '';

    return '<div class="card">' +
      '<div class="toolbar">' +
        '<button class="btn btn-sm" data-act="period-prev">‹</button>' +
        '<span class="strong" style="min-width:118px;text-align:center">' + periodLabel(p) + '</span>' +
        '<button class="btn btn-sm" data-act="period-next">›</button>' +
        '<div class="spacer"></div>' +
        '<span class="tiny muted">' + rows.length + ' ' + t('人') + '</span>' +
        '<button class="btn btn-sm" data-act="export-pay">' + t('导出 CSV') + '</button>' +
        '<button class="btn btn-sm" data-act="pay-confirm-all">' + t('确认') + '</button>' +
        '<button class="btn btn-primary btn-sm" data-act="pay-generate">' + t('生成薪酬') + '</button>' +
      '</div>' +
      (rows.length
        ? '<div class="sum-strip">' +
            '<div class="ss"><span>' + t('应发合计') + '</span><b>' + money(sum.total) + '</b></div>' +
            '<div class="ss"><span>' + t('社保') + '</span><b>' + money(sum.social) + '</b></div>' +
            '<div class="ss"><span>' + t('个税') + '</span><b>' + money(sum.pnd) + '</b></div>' +
            '<div class="ss"><span>' + t('费用合计') + '</span><b>' + money(sum.exp) + '</b></div>' +
            '<div class="ss hi"><span>' + t('实发合计') + '</span><b>' + money(sum.net) + '</b></div>' +
          '</div>'
        : '') +
      (rows.length
        ? '<div class="xl-wrap" style="max-height:none"><table class="xl">' + head + '<tbody>' + body + '</tbody>' + foot + '</table></div>'
        : '<div class="empty"><b>' + t('未生成') + '</b>' + t('生成薪酬') + '</div>') +
      '<div class="tbl-note">' + (lang === 'zh'
        ? '表头结构与公式还原 Sheet2：合计 = 收入 8 项求和；年收入 = 合计 × 12 − 年度扣除项一 − 年度扣除项二（默认 160,000 / 10,500，可在设置调整）；模板中缺失的「费用合计 / 实发」已补齐：费用合计 = 社保 + 个税 + 其他，实发 = 合计 − 费用合计。点击行可编辑。'
        : 'โครงสร้างส่วนหัวและสูตรอ้างอิง Sheet2 คลิกแถวเพื่อแก้ไข') + '</div></div>';
  }

  function openPayForm(rowId) {
    var r = null;
    state.payroll.forEach(function (x) { if (x.id === rowId) r = x; });
    if (!r) return;
    var e = getEmp(r.empId) || {};
    function inp(id, label, val) { return '<div class="field"><label>' + esc(t(label)) + '</label><input class="input" id="' + id + '" type="number" step="0.01" value="' + esc(val) + '"></div>'; }
    openModal({
      title: t('薪酬核算'), sub: (e.nameEn || '') + ' · ' + periodLabel(r.period), wide: true,
      body: '<div class="section-title" style="margin-top:0">INCOME / ' + t('收入') + '</div>' +
        '<div class="grid-3">' + inp('p_base', '工资基数', r.baseSalary) + inp('p_pos', '岗位补贴', r.positionAllowance) + inp('p_travel', '差旅费', r.travelAllowance) + '</div>' +
        '<div class="grid-3">' + inp('p_house', '住房津贴', r.housingAllowance) + inp('p_food', '餐补', r.foodAllowance) + inp('p_shift', '班次津贴', r.shiftAllowance) + '</div>' +
        '<div class="grid-3">' + inp('p_kpi', 'KPI', r.kpi) + inp('p_otW', '工作日加班', r.otWeekday) + inp('p_otR', '休息日加班', r.otRest) + '</div>' +
        '<div class="grid-3">' + inp('p_otH', '法定假日加班', r.otHoliday) +
          '<div class="field"><label>' + (lang === 'zh' ? '时薪（自动）' : 'ค่าจ้าง/ชม.') + '</label><input class="input" readonly value="' + money(r.hourRate) + '"></div><div></div></div>' +
        '<div class="section-title">Expenses / ' + t('费用') + '</div>' +
        '<div class="grid-3">' + inp('p_social', '社保', r.social) + inp('p_pnd', '个人所得税', r.pndTax) + inp('p_other', '其他', r.otherExpense) + '</div>' +
        '<div class="grid-3"><div class="field"><label>' + t('状态') + '</label><select class="input" id="p_status">' +
          CONST.payStatus.map(function (x) { return '<option value="' + x.k + '"' + (r.status === x.k ? ' selected' : '') + '>' + esc(lang === 'th' ? x.th : x.zh) + '</option>'; }).join('') +
        '</select></div><div></div><div></div></div>' +
        '<div class="field"><label>' + t('备注') + '</label><input class="input" id="p_remark" value="' + esc(r.remark || '') + '"></div>' +
        '<div class="rule-box">' + (lang === 'zh'
          ? '社保按「工资基数 × ' + num(state.settings.ssoRate) + '%」且基数封顶 ' + intf(state.settings.ssoBaseCap) + '；手工改个税后，税率列按 个税 ÷ 合计 重算；不改个税则按累进税率自动估算。'
          : 'ประกันสังคม = เงินเดือนพื้นฐาน × ' + num(state.settings.ssoRate) + '% (ฐานสูงสุด ' + intf(state.settings.ssoBaseCap) + ')') + '</div>',
      foot: '<button class="btn btn-danger" data-act="pay-del" data-id="' + r.id + '">' + t('删除') + '</button><div class="spacer"></div>' +
        '<button class="btn" data-act="close-modal">' + t('取消') + '</button>' +
        '<button class="btn btn-primary" data-act="pay-save" data-id="' + r.id + '">' + t('保存') + '</button>'
    });
  }

  function openPayslip(rowId) {
    var r = null;
    state.payroll.forEach(function (x) { if (x.id === rowId) r = x; });
    if (!r) return;
    var e = getEmp(r.empId) || {};
    function line(label, val) {
      return '<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px dashed #eef0f3">' +
        '<span>' + esc(t(label)) + '</span><span class="mono">' + money(val) + '</span></div>';
    }
    openModal({
      title: t('工资条'), sub: periodLabel(r.period), wide: true,
      body: '<div class="detail-head"><div class="avatar">' + esc((e.nameEn || '?').slice(0, 1)) + '</div>' +
          '<div><div class="strong" style="font-size:15px">' + esc(e.nameEn || '') + '</div>' +
          '<div class="tiny muted">' + esc(e.empNo || '') + ' · ' + esc(deptName(e.deptId)) + '</div></div>' +
          '<div style="margin-left:auto">' + payBadge(r.status) + '</div></div>' +
        '<div class="grid-2" style="gap:0 24px">' +
          '<div><div class="section-title" style="margin-top:0">' + t('收入') + '</div>' +
            line('工资基数', r.baseSalary) + line('岗位补贴', r.positionAllowance) +
            (num(r.travelAllowance) ? line('差旅费', r.travelAllowance) : '') +
            (num(r.housingAllowance) ? line('住房津贴', r.housingAllowance) : '') +
            (num(r.foodAllowance) ? line('餐补', r.foodAllowance) : '') +
            (num(r.otPay) ? line('加班费', r.otPay) : '') +
            (num(r.shiftAllowance) ? line('班次津贴', r.shiftAllowance) : '') +
            (num(r.kpi) ? line('KPI', r.kpi) : '') +
            '<div style="display:flex;justify-content:space-between;padding:8px 0;font-weight:650"><span>' + t('应发合计') + '</span><span class="mono">' + money(r.total) + '</span></div></div>' +
          '<div><div class="section-title" style="margin-top:0">' + t('费用') + '</div>' +
            line('社保', r.social) + line('个人所得税', r.pndTax) +
            (num(r.otherExpense) ? line('其他', r.otherExpense) : '') +
            '<div style="display:flex;justify-content:space-between;padding:10px 0;margin-top:8px;border-top:2px solid #14171c;font-weight:700;font-size:15px">' +
            '<span>' + t('实发金额') + '</span><span class="mono">' + money(r.net) + '</span></div></div>' +
        '</div><div class="tiny muted mt12">' + esc(state.settings.companyZh) + ' · ' + esc(state.settings.plantZh) + '</div>',
      foot: '<button class="btn" data-act="close-modal">' + t('关闭') + '</button>' +
        '<button class="btn btn-primary" onclick="window.print()">' + t('打印') + '</button>'
    });
  }

  /* ---------------- 制度文件 ---------------- */
  function viewDocuments() {
    var rows = state.documents.map(function (d) {
      var pct = d.headcount ? Math.round((num(d.ackCount) / num(d.headcount)) * 100) : 0;
      return '<tr><td class="mono tiny">' + esc(d.code) + '</td>' +
        '<td><div class="strong">' + esc(lang === 'th' ? d.titleTh : d.titleZh) + '</div><div class="tiny muted">' + esc(lang === 'th' ? d.titleZh : d.titleTh) + '</div></td>' +
        '<td><span class="badge gray">' + esc(dictName(CONST.docCategory, d.category)) + '</span></td>' +
        '<td class="mono">' + esc(d.version) + '</td><td class="tiny">' + esc(fmtD(d.effectiveDate)) + '</td>' +
        '<td class="tiny">' + esc(d.owner) + '</td><td>' + docBadge(d.status) + '</td>' +
        '<td class="num"><span class="' + (pct >= 100 ? 'pos' : (pct >= 60 ? '' : 'neg')) + '">' + num(d.ackCount) + '/' + num(d.headcount) + '</span> <span class="tiny muted">' + pct + '%</span></td>' +
        '<td><button class="btn btn-sm" data-act="doc-edit" data-id="' + d.id + '">' + t('编辑') + '</button></td></tr>';
    }).join('');

    return '<div class="card"><div class="toolbar"><span class="tiny muted">' + t('共') + ' ' + state.documents.length + ' ' + t('条') + '</span>' +
      '<div class="spacer"></div><button class="btn btn-primary btn-sm" data-act="doc-new">+ ' + t('新增制度') + '</button></div>' +
      '<div class="table-wrap"><table class="data"><thead><tr>' +
        '<th>' + t('编号') + '</th><th>' + t('制度名称') + '</th><th>' + t('类别') + '</th><th>' + t('版本') + '</th>' +
        '<th>' + t('生效日期') + '</th><th>' + t('责任部门') + '</th><th>' + t('状态') + '</th><th class="num">' + t('签收') + '</th><th>' + t('操作') + '</th>' +
      '</tr></thead><tbody>' + (rows || '<tr><td colspan="9"><div class="empty">—</div></td></tr>') + '</tbody></table></div>' +
      '<div class="tbl-note">' + (lang === 'zh'
        ? '附件《泰国HR需求.xlsx》未包含制度文件模块，此页按既有台账保留；字段可按需增补。'
        : 'ไฟล์ Excel ไม่ได้ระบุโมดูลเอกสารระเบียบ') + '</div></div>';
  }

  function openDocForm(id) {
    var d = null;
    state.documents.forEach(function (x) { if (x.id === id) d = x; });
    d = d || { category: 'HANDBOOK', status: 'DRAFT', version: 'V1.0', ackCount: 0, headcount: activeEmps().length };
    function inp(id2, label, key, type) { return '<div class="field"><label>' + esc(t(label)) + '</label><input class="input" id="' + id2 + '" type="' + (type || 'text') + '" value="' + esc(d[key] === undefined ? '' : d[key]) + '"></div>'; }
    openModal({
      title: id ? (t('制度文件') + ' · ' + t('编辑')) : t('新增制度'), sub: d.code || '', wide: true,
      body: '<div class="grid-2">' + inp('d_code', '编号', 'code') +
        '<div class="field"><label>' + t('类别') + '</label><select class="input" id="d_category">' +
          CONST.docCategory.map(function (x) { return '<option value="' + x.k + '"' + (d.category === x.k ? ' selected' : '') + '>' + esc(lang === 'th' ? x.th : x.zh) + '</option>'; }).join('') + '</select></div></div>' +
        inp('d_titleZh', '制度名称', 'titleZh') +
        '<div class="field"><label>' + t('制度名称') + '（泰文）</label><input class="input" id="d_titleTh" value="' + esc(d.titleTh || '') + '"></div>' +
        '<div class="grid-3">' + inp('d_version', '版本', 'version') + inp('d_effectiveDate', '生效日期', 'effectiveDate', 'date') + inp('d_owner', '责任部门', 'owner') + '</div>' +
        '<div class="grid-3"><div class="field"><label>' + t('状态') + '</label><select class="input" id="d_status">' +
          CONST.docStatus.map(function (x) { return '<option value="' + x.k + '"' + (d.status === x.k ? ' selected' : '') + '>' + esc(lang === 'th' ? x.th : x.zh) + '</option>'; }).join('') + '</select></div>' +
          inp('d_ackCount', '签收', 'ackCount', 'number') + inp('d_headcount', '应签收总人数', 'headcount', 'number') + '</div>' +
        '<div class="field"><label>' + (lang === 'zh' ? '文件路径 / 链接' : 'ที่เก็บไฟล์') + '</label><input class="input" id="d_fileRef" value="' + esc(d.fileRef || '') + '"></div>' +
        '<div class="field"><label>' + t('变更说明') + '</label><textarea class="input" id="d_changeNote" rows="3">' + esc(d.changeNote || '') + '</textarea></div>',
      foot: '<button class="btn" data-act="close-modal">' + t('取消') + '</button>' +
        '<button class="btn btn-primary" data-act="doc-save" data-id="' + (id || '') + '">' + t('保存') + '</button>'
    });
  }

  /* ---------------- 设置 ---------------- */
  function viewSettings() {
    var s = state.settings;
    function f(label, key, type) {
      return '<div class="field"><label>' + esc(t(label)) + '</label><input class="input" id="set_' + key + '" type="' + (type || 'text') + '" value="' + esc(s[key]) + '"></div>';
    }
    return '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px" class="set-grid">' +
      '<div class="card"><div class="card-head"><div class="card-title">' + t('公司信息') + '</div></div><div class="card-body">' +
        f('公司名称（中文）', 'companyZh') +
        '<div class="field"><label>' + t('公司名称（泰文）') + '</label><input class="input" id="set_companyTh" value="' + esc(s.companyTh) + '"></div>' +
        f('工厂名称（中文）', 'plantZh') +
        '<div class="field"><label>' + t('工厂名称（泰文）') + '</label><input class="input" id="set_plantTh" value="' + esc(s.plantTh) + '"></div>' +
        '<button class="btn btn-primary" data-act="set-save">' + t('保存设置') + '</button></div></div>' +
      '<div class="card"><div class="card-head"><div class="card-title">' + t('薪酬与考勤规则') + '</div><div class="card-sub">' + t('核算口径') + '</div></div><div class="card-body"><div class="grid-2">' +
        f('标准工作天数/月', 'workDaysPerMonth', 'number') + f('标准工时/天', 'hoursPerDay', 'number') +
        f('工作日加班倍率', 'otRateWeekday', 'number') + f('休息日加班倍率', 'otRateRest', 'number') +
        f('法定假日加班倍率', 'otRateHoliday', 'number') + f('社保基数上限', 'ssoBaseCap', 'number') +
        f('社保个人比例', 'ssoRate', 'number') + f('最低日薪', 'minWageDaily', 'number') +
        f('年度扣除项一', 'annualDeduction1', 'number') + f('年度扣除项二', 'annualDeduction2', 'number') +
        f('上班时间', 'shiftStart') + f('迟到宽限（分钟）', 'graceMinutes', 'number') +
        '</div>' +
        '<div class="field"><label>' + t('估算个税') + '</label><select class="input" id="set_pitEnabled">' +
          '<option value="true"' + (s.pitEnabled ? ' selected' : '') + '>开启（累进税率估算）</option>' +
          '<option value="false"' + (!s.pitEnabled ? ' selected' : '') + '>关闭</option></select></div>' +
        '<button class="btn btn-primary" data-act="set-save">' + t('保存设置') + '</button></div></div></div>' +
      '<div class="card mt12"><div class="card-head"><div class="card-title">' + t('数据管理') + '</div><div class="card-sub">' + t('数据仅保存在本机浏览器') + '</div></div><div class="card-body">' +
        '<div class="flex wrap" style="gap:8px">' +
          '<button class="btn" data-act="export-backup">' + t('导出全部数据') + '</button>' +
          '<button class="btn" data-act="import-backup">' + t('导入备份文件') + '</button>' +
          '<button class="btn btn-danger" data-act="reset-data">' + t('清空并重置') + '</button></div>' +
        '<div class="rule-box mt12">' + t('请定期备份：设置 → 备份数据') + '</div></div></div>';
  }

  /* ---------------- 渲染 ---------------- */
  function render() {
    renderNav(); renderTop();
    var html = '';
    if (ui.route === 'dashboard') html = viewDashboard();
    else if (ui.route === 'employees') html = viewEmployees();
    else if (ui.route === 'attendance') html = viewAttendance();
    else if (ui.route === 'payroll') html = viewPayroll();
    else if (ui.route === 'documents') html = viewDocuments();
    else if (ui.route === 'settings') html = viewSettings();
    if (window.HRBridge) window.HRBridge.setView(html);

    function bindViewEvents() {
      if (ui.route !== 'employees') return;
      var si = $('#empSearch');
      if (si) si.oninput = function () {
        ui.empQ = si.value; render();
        var x = $('#empSearch'); if (x) { x.focus(); x.setSelectionRange(x.value.length, x.value.length); }
      };
      var fd = $('#fDept'); if (fd) fd.onchange = function () { ui.empDept = fd.value; render(); };
      var ft = $('#fType'); if (ft) ft.onchange = function () { ui.empType = ft.value; render(); };
      var fs = $('#fStatus'); if (fs) fs.onchange = function () { ui.empStatus = fs.value; render(); };
    }
    if (window.HRBridge) window.HRBridge.nextTick(bindViewEvents); else bindViewEvents();
  }

  /* ---------------- 导出 ---------------- */
  function download(filename, content, mime) {
    var blob = new Blob(['\ufeff' + content], { type: mime || 'text/csv;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }
  function csvCell(v) { return '"' + String(v === null || v === undefined ? '' : v).replace(/"/g, '""') + '"'; }
  function toCsv(headers, rows) {
    return [headers.map(csvCell).join(',')].concat(rows.map(function (r) { return r.map(csvCell).join(','); })).join('\r\n');
  }
  function exportEmployees() {
    var headers = EMP_COLS.map(function (c) { return c.zh + ' ' + c.en; });
    var rows = state.employees.map(function (e, i) {
      return [i + 1, e.empNo, e.nameEn, dictName(CONST.nationality, e.nationality), dictName(CONST.gender, e.gender),
        deptName(e.deptId), e.positionEn, dictName(CONST.empType, e.empType), e.birthday, ageOf(e.birthday),
        e.passportNo, e.alienId, e.taxId, e.ssoId, e.contractStart, e.contractExpiry, e.visaExpiry,
        e.workPermitNo, e.wpIssuedDate, e.wpExpiry, e.last90Report, e.departureDate, report90Due(e),
        report90Due(e) ? daysUntil(report90Due(e)) : '', dictName(CONST.hiringStatus, e.hiringStatus),
        dictName(CONST.activeStatus, e.activeStatus), e.email, e.remark];
    });
    download('人员档案_' + currentPeriod() + '.csv', toCsv(headers, rows));
    toast(t('数据已导出'));
  }
  function exportAttendance() {
    var p = ui.period, expected = workDaysInMonth(p, p === currentPeriod());
    var headers = ['工号', '姓名', '应出勤', '实际出勤', '缺勤', '迟到', '请假天数', '假别', '工作日OT', '休息日OT', '假日OT', '备注'];
    var rows = activeEmps().map(function (e) {
      var a = attOf(e.id, p) || {};
      return [e.empNo, e.nameEn, expected, num(a.presentDays), num(a.absentDays), num(a.lateCount),
        num(a.leaveDays), dictName(CONST.leaveType, a.leaveType || 'NONE'), num(a.otWeekday), num(a.otRest), num(a.otHoliday), a.note || ''];
    });
    download('考勤_' + p + '.csv', toCsv(headers, rows));
    toast(t('数据已导出'));
  }
  function exportPayroll() {
    var p = ui.period, rows = payRows(p);
    if (!rows.length) { toast(t('未生成')); return; }
    var headers = ['项', '代码', '姓名', '部门', '职位', '入职日期', '应出勤', '实际出勤', '工资基数', '岗位补贴', '差旅费', '住房津贴', '餐补', '加班费', '班次津贴', 'KPI', '合计', '年收入', '社保', '比例', '个人所得税', '其他', '费用合计', '实发金额', '银行名称', '银行账户', '户名', '备注'];
    var out = rows.map(function (r, i) {
      var e = getEmp(r.empId) || {}, a = attOf(r.empId, p);
      return [i + 1, e.empNo, e.nameEn, deptName(e.deptId), e.positionEn, e.contractStart,
        workDaysInMonth(p, p === currentPeriod()), a ? num(a.presentDays) : 0,
        r.baseSalary, r.positionAllowance, r.travelAllowance, r.housingAllowance, r.foodAllowance,
        r.otPay, r.shiftAllowance, r.kpi, r.total, r.annualIncome, r.social,
        (r.taxPct * 100).toFixed(1) + '%', r.pndTax, r.otherExpense, r.expenseTotal, r.net,
        r.bankName, r.bankAccount, r.accountName, r.remark];
    });
    download('薪酬_' + p + '.csv', toCsv(headers, out));
    toast(t('数据已导出'));
  }
  function exportBackup() {
    download('HR备份_' + currentPeriod() + '.json', JSON.stringify(state, null, 2), 'application/json');
    toast(t('备份文件已下载'));
  }
  function importBackup() {
    var input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,application/json';
    input.onchange = function () {
      var f = input.files[0]; if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var o = JSON.parse(String(rd.result));
          if (!o || !o.employees || !o.departments) throw new Error('bad');
          state = o;
          if (!state.punches) state.punches = [];
          if (!state.devices) state.devices = [];
          if (!state.settings) state.settings = window.HR_SEED.make().settings;
          save(); ui.period = currentPeriod(); render(); toast(t('数据已恢复'));
        } catch (e) { toast(t('文件格式不正确')); }
      };
      rd.readAsText(f, 'utf-8');
    };
    input.click();
  }

  /* ---------------- 事件 ---------------- */
  function setRoute(r) {
    ui.route = r;
    try { history.replaceState(null, '', '#' + r); } catch (e) { }
    render(); window.scrollTo(0, 0);
  }

  document.addEventListener('click', function (ev) {
    var el = ev.target.closest('[data-act]');
    if (ev.target.getAttribute && ev.target.getAttribute('data-overlay') !== null) { closeModal(); return; }
    if (!el) return;
    var act = el.dataset.act, id = el.dataset.id;

    if (act === 'close-modal') { closeModal(); return; }
    if (act === 'toggle-menu') { $('#sidebar').classList.toggle('open'); return; }
    if (act === 'goto') { setRoute(el.dataset.route); return; }
    if (act === 'backup') { exportBackup(); return; }
    if (act === 'period-prev') { ui.period = prevPeriod(ui.period); render(); return; }
    if (act === 'period-next') { ui.period = nextPeriod(ui.period); render(); return; }
    if (act === 'att-tab') { ui.attTab = el.dataset.tab; render(); return; }

    if (act === 'emp-new') { openEmployeeForm(null); return; }
    if (act === 'emp-edit') { ev.stopPropagation(); openEmployeeForm(id); return; }
    if (act === 'emp-detail') { openEmployeeDetail(id); return; }
    if (act === 'emp-save') {
      var data = collectEmp(id || null); if (!data) return;
      var idx = -1;
      state.employees.forEach(function (e, i) { if (e.id === data.id) idx = i; });
      if (idx >= 0) state.employees[idx] = data; else state.employees.push(data);
      save(); closeModal(); render(); toast(t('已保存')); return;
    }

    if (act === 'att-edit') { openAttForm(id); return; }
    if (act === 'att-save') {
      var v = function (k) { return num($('#' + k).value); };
      var rec = attOf(id, ui.period);
      if (!rec) { rec = { empId: id, period: ui.period }; state.attendance.push(rec); }
      rec.presentDays = v('a_present'); rec.absentDays = v('a_absent'); rec.lateCount = v('a_late');
      rec.leaveDays = v('a_leave'); rec.leaveType = $('#a_leaveType').value;
      rec.otWeekday = v('a_otW'); rec.otRest = v('a_otR'); rec.otHoliday = v('a_otH');
      rec.note = $('#a_note').value.trim();
      save(); closeModal(); render(); toast(t('已保存')); return;
    }
    if (act === 'att-from-punch') { attFromPunch(); return; }
    if (act === 'punch-import') { openPunchImport(); return; }
    if (act === 'punch-pick') { var pf = $('#punchFile'); if (pf) pf.click(); return; }
    if (act === 'punch-do') { doPunchImport(); return; }
    if (act === 'punch-template') {
      download('打卡导入模板.csv', 'EMPLOYEE ID,DATE,TIME,DEVICE SN\r\nCSR003,2026-11-19,07:52,ZK2208A1547\r\nCSR003,2026-11-19,17:06,ZK2208A1547');
      return;
    }

    if (act === 'pay-generate') { generatePayroll(ui.period, null); save(); setRoute('payroll'); toast(t('已生成薪酬')); return; }
    if (act === 'pay-edit') { openPayForm(id); return; }
    if (act === 'pay-save') {
      var r = null;
      state.payroll.forEach(function (x) { if (x.id === id) r = x; });
      if (!r) return;
      r.baseSalary = num($('#p_base').value);
      r.positionAllowance = num($('#p_pos').value);
      r.travelAllowance = num($('#p_travel').value);
      r.housingAllowance = num($('#p_house').value);
      r.foodAllowance = num($('#p_food').value);
      r.shiftAllowance = num($('#p_shift').value);
      r.kpi = num($('#p_kpi').value);
      r.otWeekday = num($('#p_otW').value);
      r.otRest = num($('#p_otR').value);
      r.otHoliday = num($('#p_otH').value);
      r.social = num($('#p_social').value);
      r.pndOverride = num($('#p_pnd').value);
      r.otherExpense = num($('#p_other').value);
      r.status = $('#p_status').value;
      r.remark = $('#p_remark').value;
      computeRow(r);
      save(); closeModal(); render(); toast(t('已保存')); return;
    }
    if (act === 'pay-del') {
      confirmModal(t('确认删除'), esc(t('此操作不可撤销')), function () {
        state.payroll = state.payroll.filter(function (x) { return x.id !== id; });
        save(); render(); toast(t('已删除'));
      }); return;
    }
    if (act === 'pay-slip') { openPayslip(id); return; }
    if (act === 'pay-confirm-all') {
      var rows = payRows(ui.period);
      if (!rows.length) { toast(t('未生成')); return; }
      rows.forEach(function (r2) { if (r2.status === 'DRAFT') r2.status = 'CONFIRMED'; });
      save(); render(); toast(t('已保存')); return;
    }

    if (act === 'doc-new') { openDocForm(null); return; }
    if (act === 'doc-edit') { openDocForm(id); return; }
    if (act === 'doc-save') {
      var vv = function (k) { var e2 = $('#' + k); return e2 ? e2.value.trim() : ''; };
      var doc = {
        id: id || uid('doc'), code: vv('d_code') || ('HR-POL-' + String(state.documents.length + 1).padStart(3, '0')),
        titleZh: vv('d_titleZh'), titleTh: vv('d_titleTh'), category: vv('d_category'),
        version: vv('d_version'), effectiveDate: vv('d_effectiveDate'), owner: vv('d_owner'),
        status: vv('d_status'), ackCount: num(vv('d_ackCount')), headcount: num(vv('d_headcount')),
        fileRef: vv('d_fileRef'), changeNote: vv('d_changeNote')
      };
      if (!doc.titleZh) { toast(t('请填写姓名')); return; }
      var di = -1;
      state.documents.forEach(function (x, i) { if (x.id === doc.id) di = i; });
      if (di >= 0) state.documents[di] = doc; else state.documents.unshift(doc);
      save(); closeModal(); render(); toast(t('已保存')); return;
    }

    if (act === 'set-save') {
      ['workDaysPerMonth', 'hoursPerDay', 'otRateWeekday', 'otRateRest', 'otRateHoliday', 'ssoBaseCap', 'ssoRate',
        'minWageDaily', 'annualDeduction1', 'annualDeduction2', 'graceMinutes'].forEach(function (k) {
        var e3 = $('#set_' + k); if (e3) state.settings[k] = num(e3.value);
      });
      ['companyZh', 'companyTh', 'plantZh', 'plantTh', 'shiftStart'].forEach(function (k) {
        var e4 = $('#set_' + k); if (e4) state.settings[k] = e4.value;
      });
      state.settings.pitEnabled = $('#set_pitEnabled').value === 'true';
      state.payroll.forEach(function (r3) { computeRow(r3); });
      save(); render(); toast(t('已保存')); return;
    }

    if (act === 'export-emp') { exportEmployees(); return; }
    if (act === 'export-att') { exportAttendance(); return; }
    if (act === 'export-pay') { exportPayroll(); return; }
    if (act === 'export-backup') { exportBackup(); return; }
    if (act === 'import-backup') { importBackup(); return; }
    if (act === 'reset-data') {
      confirmModal(t('清空并重置'), esc(t('重置后不可恢复')), function () {
        state = window.HR_SEED.make(); firstRun = true;
        ui.period = currentPeriod();
        generatePayroll(prevPeriod(currentPeriod()), 'RELEASED');
        generatePayroll(currentPeriod(), 'DRAFT');
        save(); render(); toast(t('已重置为演示数据'));
      }); return;
    }
  });

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-lang]');
    if (!b) return;
    lang = b.dataset.lang;
    state.settings.lang = lang;
    if (window.HRBridge) window.HRBridge.setLang(lang);
    save(); render();
  });

  /* ---------------- 启动（由 main.js 在后端数据载入后调用） ---------------- */
  try {
    var qs = new URLSearchParams(location.search);
    var ql = qs.get('lang');
    if (ql === 'th' || ql === 'zh') pendingLang = ql;
  } catch (e) { }

  function bootstrap() {
    if (!state.payroll) state.payroll = [];
    if (!state.punches) state.punches = [];
    if (!state.devices) state.devices = [];
    if (!state.documents) state.documents = [];
    if (!ui.period) ui.period = currentPeriod();
    if (state.payroll.length === 0) {
      generatePayroll(prevPeriod(currentPeriod()), 'RELEASED');
      generatePayroll(currentPeriod(), 'DRAFT');
      save();
    }
  }

  window.HRApp = {
    init: function (data) {
      state = data;
      if (!state.settings) state.settings = window.HR_SEED.make().settings;
      lang = state.settings.lang || 'zh';
      if (pendingLang) { lang = pendingLang; state.settings.lang = lang; }
      bootstrap();
      var h0 = (location.hash || '').replace('#', '');
      if (h0) NAV.forEach(function (n) { if (n.k === h0) ui.route = h0; });
    },
    render: render,
    setRoute: setRoute
  };
})();
