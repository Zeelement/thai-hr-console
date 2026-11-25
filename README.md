# 泰国工厂 HR 工作台（Django + Vue + SQL Server 版）

面向泰国工厂的人事工作台，四个模块：**人员档案 / 考勤管理 / 薪酬核算 / 制度文件**，另含总览预警与参数设置。

- **当前版本**：v2（对齐《泰国HR需求.xlsx》的 Sheet2 / Sheet3 口径）
- **形态**：Django 后端 + SQL Server 业务库 + Vue 3 前端外壳；原视图函数、路由与交互逻辑保留在 `app.js`
- **鉴权**：JWT（登录签发、接口校验、过期/无效返回 401）
- **语言**：中文 / 泰文双语切换（右上角），泰文为人工翻译，改动文案时两种语言都要改

---

## 一、怎么运行

双击 `start.bat`。密码在 `start.bat` 顶部配置区的 `HR_DB_PASSWORD` 行直接填写（或运行前设为环境变量），脚本不做交互输入。随后脚本打印当前生效的连接参数，依次做依赖检查 → **连接 master 并自动建库**（库不存在时创建）→ 连接预检 → 数据库迁移 → 默认账号准备 → 启动服务：

```
http://127.0.0.1:8000/
```

服务监听 `0.0.0.0`，本机用 `http://127.0.0.1:8000/`，局域网内其他设备用运行脚本那台电脑的内网 IP（`ipconfig` 查看 IPv4）访问同一端口。前端 API 使用相对路径，会自动指向当前访问主机，无需改动。`ALLOWED_HOSTS` 默认为 `*`。关闭脚本窗口即停止服务。

默认账号 `admin` / `admin123`（可用 `HR_ADMIN_USER` / `HR_ADMIN_PASS` 覆盖）。

> 提示：当前 SQL Server 走本机 Shared Memory（`HR_DB_LOCAL=1`），这不影响局域网客户端访问——数据库连接由服务端在本机发起；但若有第二台机器也部署本服务连同一数据库，则需先启用 SQL Server 的 TCP/IP 协议。

SQL Server 连接默认 `HRConsole` / `sa` / `123456` / `ODBC Driver 17 for SQL Server`。当前机器（SQL Server 2025 默认实例 `MSSQLSERVER`）**未启用 TCP/IP 协议**（1433 端口无监听，只开了本机 Shared Memory），因此 `start.bat` 默认设 `HR_DB_LOCAL=1`，走 `lpc:localhost` 共享内存连接，无需 TCP 端口。若日后启用了 SQL Server 的 TCP/IP，把 `HR_DB_LOCAL` 改为 `0`，并配置：

```
HR_DB_LOCAL  HR_DB_HOST  HR_DB_PORT  HR_DB_NAME  HR_DB_USER  HR_DB_PASSWORD  HR_DB_DRIVER  HR_PORT
```

密码填在 `set "HR_DB_PASSWORD=..."` 这一行的引号内即可，脚本不会交互询问。也可在运行前用环境变量覆盖（环境变量优先级更高）：

CMD 示例（远程 TCP）：`set HR_DB_LOCAL=0 && set HR_DB_HOST=192.168.1.50 && start.bat`
PowerShell 示例：`$env:HR_DB_LOCAL="0"; $env:HR_DB_HOST="192.168.1.50"; .\start.bat`

脚本第 3 步通过 `master` 库自动建库（`python manage.py ensure_db`，幂等，库已存在则跳过），因此**无需手动建库**；第 4 步的连接预检（`check_db.py`）试连业务库，连不上会打印简短原因并中止，不会执行迁移。建库要求账号（此处为 `sa`）有 `CREATE DATABASE` 权限，且 SQL Server 允许远程连接。

> 本机没有 SQL Server 时，可设置 `HR_DB_ENGINE=sqlite` 临时回退做界面验证；该模式只写本地临时库，不写入业务库。

---

## 二、文件职责（改之前先看清改哪个）

| 文件 | 行数 | 职责 | 改动频率 |
|---|---|---|---|
| `index.html` | 59 | 应用外壳：侧边栏、顶栏、语言切换、`#view` 容器 | 极低，几乎不动 |
| `data.js` | 496 | 枚举字典、21 名演示员工、部门/设备/打卡/制度种子数据、默认设置 | 低（只在加演示数据时动） |
| `app.js` | 1516 | 全部业务逻辑与视图：路由、计算、增删改、导入导出、i18n | 高 |
| `styles.css` | 796 | 设计系统 + 表格模板样式 | 中 |

`app.js` 内部结构（按行号定位，改代码时先看这里）：

| 位置 | 内容 |
|---|---|
| `L11` | `LS_KEY = 'hr_console_th_v2'` 存储键，改 schema 必须同步升版本 |
| `L39` | `TH` 泰文词典，**以中文原文为 key**，新增中文文案必须在这里补一条 |
| `L161` | `save()` 落盘 |
| `L262` | `generatePayroll()` 按考勤生成当月工资 |
| `L425` | `viewDashboard()` 总览与预警 |
| `L498` | `EMP_COLS` 员工表 28 列定义（加列只改这里 + 表单） |
| `L558` | `viewEmployees()` 人员档案 |
| `L747` | `viewAttendance()` 考勤（打卡明细 / 月度汇总两个页签） |
| `L903` | `parsePunch()` 打卡文本解析（按字段正则识别） |
| `L935` | `doPunchImport()` 导入 + 去重 + 匹配校验 |
| `L949` | `attFromPunch()` 打卡汇总回写月度考勤 |
| `L972` | `viewPayroll()` 薪酬表（三级表头 + 合计行） |
| `L1165` | `viewDocuments()` 制度文件 |
| `L1212` | `viewSettings()` 参数设置（社保、税率、班次、年度扣除项） |

---

## 三、协作方式（按推荐顺序）

### 1. Git 仓库为主（防覆盖，强烈建议）

不建仓库，两个人各存一份再互传，早晚会覆盖掉对方的改动。做法：

```bash
cd thai-hr-console
git init            # 已初始化过可跳过
git add .
git commit -m "初始版本"
```

然后二选一作为远端：
- **厂区内网 Git 服务**（Gitea / 工蜂私有库）：数据不出厂区，首选；
- **企业微信微盘**：不适合做版本控制，只适合传整包，见下条。

日常节奏：**每次动手前 `git pull`，改完一个完整功能就 `git commit`**，不要攒一天再提交。

### 2. 企业微信微盘传整包（应急 / 非技术同事）

把整个 `thai-hr-console` 文件夹压缩后传到微盘，对方下载解压覆盖。**只有在你确认对方没有未提交改动时才这样做**，否则会覆盖。

### 3. 局域网静态服务（只用于看效果）

见第一节。同一时间只有一人运行即可，其他人只是访客。

> 强烈建议：**不要两个人同时改 `app.js`**。它一个文件装了全部逻辑，Git 合并冲突时会很难受。

---

## 四、分工建议（把冲突降到最低）

按"改哪个文件"切，而不是按"改哪个功能"切：

| 角色 | 负责 | 不要碰 |
|---|---|---|
| 主开发（你） | `app.js` 业务逻辑、`data.js` 数据结构 | — |
| 视觉 / 排版同事 | `styles.css`、`index.html` 结构 | `app.js` 里的 `view*()` 函数 |
| 业务同事（HR） | 只提需求 + 用系统验数据，不改代码 | 全部代码 |

如果必须两人同时动 `app.js`：一个人改 `viewEmployees` / `viewAttendance` 段，另一个人改 `viewPayroll` / `viewSettings` 段，各改各的段落，提交前先 `git pull --rebase`。

---

## 五、加一个字段的完整清单（最容易漏的一步）

以"给员工加『宿舍号』"为例，以下 6 处都要改，漏一处就会出现"表单能填、表格不显示"或"导出丢字段"：

1. `data.js`：21 条种子员工各加 `dormNo: ''`（否则老数据 undefined）
2. `app.js` `EMP_COLS`（L498）：加 `{ k: 'dormNo', zh: '宿舍号', en: 'DORM', th: 'ห้องพัก', w: 90 }`
3. `app.js` `empCell()`：如果是特殊渲染（如状态徽标、计算列）在这里加分支
4. `app.js` 员工编辑表单：加输入框，`name="dormNo"`
5. `app.js` 导出 CSV 的 `headers` 数组：加"宿舍号"，**顺序必须和行数据一致**
6. `app.js` `TH` 词典（L39）：如果新文案是中文并且要显示在界面上，补泰文

税前自查：改完 `node --check app.js`，再刷新页面看中文、泰文两种模式。

---

## 六、数据与版本（改动前必读）

- 业务数据统一存 SQL Server。模型在 `hrapi/models.py`，迁移文件在 `hrapi/migrations/`。**改了数据结构必须同步改模型并生成新迁移**（`python manage.py makemigrations hrapi`）。
- 前端 `state` 字段与模型字段一一对应（保留 camelCase），`api.js` 的 `saveState` 整体写回数据库。改字段时 `data.js` / `app.js` / `models.py` 三处需保持一致。
- 演示数据（`data.js`）仅用于首次初始化与「清空并重置」，**不要放真实员工信息**再传微盘或 Git。
- 「备份数据」仍导出 JSON；恢复时用设置页「导入备份文件」，数据会写回数据库。

---

## 七、提交前自检清单

- [ ] `node --check app.js` 与 `node --check data.js` 无报错
- [ ] 打开页面，控制台（F12）无红色报错
- [ ] 四个模块都能点开，都不空白
- [ ] 中文、泰文各看一遍，无残留中文出现在泰文界面
- [ ] 改了数据结构 → 已升 `LS_KEY` 版本并写了迁移
- [ ] 导出 CSV 用 Excel 打开不乱码（UTF-8 BOM 已加）
- [ ] `git commit -m "一句话说清改了什么"`

---

## 八、已知边界

1. **数据已集中**：所有客户端共享同一份 SQL Server 数据，修改后其他客户端刷新可见。
2. **JWT 仅做身份校验**：未登录无法读取数据；令牌默认 8 小时有效，过期后前端自动回到登录页。当前未做角色或字段级权限。
3. **无自动备份**：只有手动导出 JSON。
4. **制度文件模块为自建占位**：附件《泰国HR需求.xlsx》里没有这张表，现有 6 条编号（CSR-HR-001 等）为拟定，需业务确认后替换。
5. **工号口径未统一**：Sheet3 用 `CSR001`，Sheet2 用 `SR0001`，当前统一按 `CSR001`。
