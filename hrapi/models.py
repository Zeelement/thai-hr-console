"""
业务模型：字段名与前端 data.js / app.js 中的 state 字段逐一对应（camelCase 保留），
不做改名、不新增业务字段，以保证前后端字段适配零歧义。
"""
from django.db import models


class Department(models.Model):
    id = models.CharField(max_length=32, primary_key=True)
    nameZh = models.CharField(max_length=120, blank=True, default="")
    nameTh = models.CharField(max_length=200, blank=True, default="")
    nameEn = models.CharField(max_length=120, blank=True, default="")

    class Meta:
        db_table = "hr_department"


class Employee(models.Model):
    id = models.CharField(max_length=32, primary_key=True)
    empNo = models.CharField(max_length=32, blank=True, default="")
    nameEn = models.CharField(max_length=200, blank=True, default="")
    nameTh = models.CharField(max_length=200, blank=True, default="")
    nameZh = models.CharField(max_length=200, blank=True, default="")
    nationality = models.CharField(max_length=16, blank=True, default="TH")
    gender = models.CharField(max_length=8, blank=True, default="M")
    empType = models.CharField(max_length=24, blank=True, default="THAI")
    deptId = models.CharField(max_length=32, blank=True, default="")
    positionEn = models.CharField(max_length=200, blank=True, default="")
    positionZh = models.CharField(max_length=200, blank=True, default="")
    birthday = models.CharField(max_length=10, blank=True, default="")
    passportNo = models.CharField(max_length=64, blank=True, default="")
    alienId = models.CharField(max_length=64, blank=True, default="")
    ssoId = models.CharField(max_length=64, blank=True, default="")
    taxId = models.CharField(max_length=64, blank=True, default="")
    contractStart = models.CharField(max_length=10, blank=True, default="")
    contractExpiry = models.CharField(max_length=10, blank=True, default="")
    visaExpiry = models.CharField(max_length=10, blank=True, default="")
    workPermitNo = models.CharField(max_length=64, blank=True, default="")
    wpIssuedDate = models.CharField(max_length=10, blank=True, default="")
    wpExpiry = models.CharField(max_length=10, blank=True, default="")
    last90Report = models.CharField(max_length=10, blank=True, default="")
    departureDate = models.CharField(max_length=10, blank=True, default="")
    remark = models.TextField(blank=True, default="")
    otEligible = models.BooleanField(default=True)
    travelAllowance = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    housingAllowance = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    foodAllowance = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    shiftAllowance = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    kpi = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    baseSalary = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    positionAllowance = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    bankName = models.CharField(max_length=120, blank=True, default="")
    bankAccount = models.CharField(max_length=64, blank=True, default="")
    accountName = models.CharField(max_length=200, blank=True, default="")
    email = models.CharField(max_length=200, blank=True, default="")
    hiringStatus = models.CharField(max_length=24, blank=True, default="PASSED")
    activeStatus = models.CharField(max_length=24, blank=True, default="ACTIVE")

    class Meta:
        db_table = "hr_employee"


class Attendance(models.Model):
    empId = models.CharField(max_length=32)
    period = models.CharField(max_length=7)
    presentDays = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    absentDays = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    lateCount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    leaveDays = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    leaveType = models.CharField(max_length=24, blank=True, default="NONE")
    otWeekday = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    otRest = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    otHoliday = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    note = models.TextField(blank=True, default="")

    class Meta:
        db_table = "hr_attendance"
        constraints = [
            models.UniqueConstraint(fields=["empId", "period"], name="uniq_att_emp_period"),
        ]


class Punch(models.Model):
    id = models.CharField(max_length=64, primary_key=True)
    empId = models.CharField(max_length=32)
    date = models.CharField(max_length=10)
    time = models.CharField(max_length=8)
    deviceId = models.CharField(max_length=32, blank=True, default="")
    direction = models.CharField(max_length=8, blank=True, default="")
    source = models.CharField(max_length=24, blank=True, default="")

    class Meta:
        db_table = "hr_punch"
        indexes = [models.Index(fields=["date", "time"], name="idx_punch_date_time")]


class Device(models.Model):
    id = models.CharField(max_length=32, primary_key=True)
    name = models.CharField(max_length=200, blank=True, default="")
    nameTh = models.CharField(max_length=200, blank=True, default="")
    model = models.CharField(max_length=120, blank=True, default="")
    sn = models.CharField(max_length=64, blank=True, default="")
    ip = models.CharField(max_length=64, blank=True, default="")
    protocol = models.CharField(max_length=200, blank=True, default="")
    lastSync = models.CharField(max_length=32, blank=True, default="")
    status = models.CharField(max_length=16, blank=True, default="")

    class Meta:
        db_table = "hr_device"


class Payroll(models.Model):
    id = models.CharField(max_length=64, primary_key=True)
    empId = models.CharField(max_length=32)
    period = models.CharField(max_length=7)
    baseSalary = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    positionAllowance = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    travelAllowance = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    housingAllowance = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    foodAllowance = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    shiftAllowance = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    kpi = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    otWeekday = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    otRest = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    otHoliday = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    absentDays = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    otherExpense = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    pndOverride = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True, default=None)
    status = models.CharField(max_length=16, blank=True, default="DRAFT")
    remark = models.TextField(blank=True, default="")
    bankName = models.CharField(max_length=120, blank=True, default="")
    bankAccount = models.CharField(max_length=64, blank=True, default="")
    accountName = models.CharField(max_length=200, blank=True, default="")
    hourRate = models.DecimalField(max_digits=18, decimal_places=4, default=0)
    otWeekdayPay = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    otRestPay = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    otHolidayPay = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    otPay = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    annualIncome = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    social = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    pndTax = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    taxPct = models.DecimalField(max_digits=12, decimal_places=6, default=0)
    expenseTotal = models.DecimalField(max_digits=18, decimal_places=2, default=0)
    net = models.DecimalField(max_digits=18, decimal_places=2, default=0)

    class Meta:
        db_table = "hr_payroll"
        constraints = [
            models.UniqueConstraint(fields=["empId", "period"], name="uniq_pay_emp_period"),
        ]


class Document(models.Model):
    id = models.CharField(max_length=32, primary_key=True)
    code = models.CharField(max_length=64, blank=True, default="")
    titleZh = models.CharField(max_length=300, blank=True, default="")
    titleTh = models.CharField(max_length=500, blank=True, default="")
    category = models.CharField(max_length=24, blank=True, default="OTHER")
    version = models.CharField(max_length=32, blank=True, default="")
    effectiveDate = models.CharField(max_length=10, blank=True, default="")
    owner = models.CharField(max_length=120, blank=True, default="")
    status = models.CharField(max_length=16, blank=True, default="DRAFT")
    fileRef = models.CharField(max_length=500, blank=True, default="")
    ackCount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    headcount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    changeNote = models.TextField(blank=True, default="")

    class Meta:
        db_table = "hr_document"


class AppSetting(models.Model):
    """单例设置（pk=1）。version/createdAt/seeded 对应前端 state.meta。"""

    companyZh = models.CharField(max_length=300, blank=True, default="")
    companyTh = models.CharField(max_length=500, blank=True, default="")
    plantZh = models.CharField(max_length=200, blank=True, default="")
    plantTh = models.CharField(max_length=300, blank=True, default="")
    currency = models.CharField(max_length=16, blank=True, default="THB")
    workDaysPerMonth = models.DecimalField(max_digits=10, decimal_places=2, default=26)
    hoursPerDay = models.DecimalField(max_digits=10, decimal_places=2, default=8)
    otRateWeekday = models.DecimalField(max_digits=10, decimal_places=4, default=1.5)
    otRateRest = models.DecimalField(max_digits=10, decimal_places=4, default=2)
    otRateHoliday = models.DecimalField(max_digits=10, decimal_places=4, default=3)
    ssoRate = models.DecimalField(max_digits=10, decimal_places=2, default=5)
    ssoBaseCap = models.DecimalField(max_digits=18, decimal_places=2, default=15000)
    annualDeduction1 = models.DecimalField(max_digits=18, decimal_places=2, default=160000)
    annualDeduction2 = models.DecimalField(max_digits=18, decimal_places=2, default=10500)
    shiftStart = models.CharField(max_length=8, blank=True, default="08:00")
    graceMinutes = models.DecimalField(max_digits=10, decimal_places=2, default=5)
    pitEnabled = models.BooleanField(default=True)
    minWageDaily = models.DecimalField(max_digits=18, decimal_places=2, default=400)
    lang = models.CharField(max_length=8, blank=True, default="zh")
    version = models.IntegerField(default=2)
    createdAt = models.CharField(max_length=40, blank=True, default="")
    seeded = models.BooleanField(default=True)

    class Meta:
        db_table = "hr_setting"
