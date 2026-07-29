# MES 与工业自动化英文缩写词典

> 适用范围：智能锁离散制造、MES 八阶段、ISA-95 IT/OT 架构和 Java 集成开发。
> 阅读方法：先看英文全称的字面组成，再看“为什么这样命名”，最后回到智能锁场景。
> 边界：企业内部缩写、产品型号和字段码以企业数据字典为准；本文不把行业惯例写成企业事实。

## 1. 先分清四类名称

1. **首字母缩写**：MES 来自 *Manufacturing Execution System* 的首字母，英文全称能直接提示职责。
2. **标准/组织简称**：IEC、NIST 是组织英文名的简称；ISA 的组织名称经历过历史变化。
3. **通用短名或历史名称**：ISO、MQTT、Modbus 不能只按当前字母机械拆解。
4. **编号**：ISA-95、IEC 62264、L0—L4 中的数字是标准或层级编号，不是英文缩写的一部分。

## 2. 标准、组织与架构

| 缩写/短名 | 英文全称 | 中文含义 | 为什么这样命名 |
|---|---|---|---|
| ISA | International Society of Automation | 国际自动化协会 | 现名强调国际化和自动化领域；ISA 历史上曾使用与仪表相关的名称，因此旧资料中的展开可能不同。 |
| IEC | International Electrotechnical Commission | 国际电工委员会 | *Electrotechnical* 指电气、电子及相关技术；*Commission* 表示国际标准组织。 |
| ISO | International Organization for Standardization | 国际标准化组织 | **ISO 不是首字母缩写**。ISO 官方说明名称来自希腊语 *isos*（相等），使不同语言都使用同一个短名。 |
| NIST | National Institute of Standards and Technology | 美国国家标准与技术研究院 | 名称直接体现其国家级测量、标准和技术职责。 |
| SP | Special Publication | 特别出版物 | NIST 用 SP 标识专题指南系列；如 SP 800-82 是编号，不表示第 800 层。 |
| ISA-95 | ISA standards committee/series 95 | ISA 第 95 委员会/标准系列 | “95”是委员会与标准系列标识，不是五层模型的层数，也不是年份。 |
| IEC 62264 | Enterprise-control system integration standard series | 企业系统与控制系统集成标准系列 | 62264 是 IEC 标准编号；它与 ISA-95 在国际标准体系中对应。 |
| IT | Information Technology | 信息技术 | 关注企业信息的计算、存储、处理和通信。 |
| OT | Operational Technology | 运营技术/操作技术 | 名称强调直接监视或控制物理过程的“运营”技术，与纯信息处理区别开。 |
| IT/OT | Information Technology / Operational Technology | 信息技术与运营技术 | 斜线表示两个领域的边界与协同，不代表一个新系统。 |
| L0—L4 | Level 0 through Level 4 | 第 0 层至第 4 层 | L 是 *Level*；数字表示 ISA-95 活动层级，不等于网络安全等级。 |

来源：[ISA 关于 ISA-95](https://www.isa.org/standards-and-publications/isa-standards/isa-95-standard)、[ISA 历史](https://www.isa.org/about-isa/history-of-isa)、[IEC FAQ](https://webstore.iec.ch/faq/)、[ISO 名称说明](https://www.iso.org/about)、[NIST 术语表](https://csrc.nist.gov/glossary/term/NIST)。

## 3. 企业与制造系统

| 缩写 | 英文全称 | 中文含义 | 为什么这样命名 |
|---|---|---|---|
| CRM | Customer Relationship Management | 客户关系管理 | 围绕客户线索、商机、合同和服务关系管理，因此核心词是 *Relationship*。 |
| ERP | Enterprise Resource Planning | 企业资源计划 | 最初重点是对企业资金、物料、产能和人员等资源进行统一计划；现代 ERP 已超出“计划”，但名称保留。 |
| PLM | Product Lifecycle Management | 产品生命周期管理 | 从概念、设计、变更、制造到退役管理产品定义，所以强调 *Lifecycle*。 |
| MOM | Manufacturing Operations Management | 制造运营管理 | 比“执行”范围更宽，包含生产、质量、维护和库存四类制造运营管理。 |
| MES | Manufacturing Execution System | 制造执行系统 | *Execution* 强调把计划转成现场任务并记录实际执行事实，位于计划与控制之间。 |
| APS | Advanced Planning and Scheduling | 高级计划与排程 | *Planning* 决定做什么和资源需求，*Scheduling* 决定具体顺序与时间；*Advanced* 强调约束求解。 |
| WMS | Warehouse Management System | 仓库管理系统 | 聚焦库位、容器、实物移动和仓内任务，而不是只做库存金额账。 |
| QMS | Quality Management System | 质量管理体系/系统 | *Management System* 指标准、过程、责任和改进闭环，不只是检验软件。 |
| EAM | Enterprise Asset Management | 企业资产管理 | 覆盖资产从规划、采购、运行、维护到退役的全生命周期。 |
| CMMS | Computerized Maintenance Management System | 计算机化维护管理系统 | 名称来自用计算机集中维护台账、保养计划和维修工单的历史需求。 |
| SCADA | Supervisory Control and Data Acquisition | 监督控制与数据采集 | 两个核心能力直接写进名称：采集现场数据，以及在控制器之上进行监督控制。 |
| HMI | Human-Machine Interface | 人机界面 | 描述人与机器之间观察状态、输入命令和获得反馈的交互边界。 |
| PLC | Programmable Logic Controller | 可编程逻辑控制器 | 可编程表示逻辑可修改；逻辑控制器强调顺序、互锁和控制功能。 |
| DCS | Distributed Control System | 分布式控制系统 | 控制功能分布在多个控制节点，而不是集中在一台计算机。 |
| CNC | Computer Numerical Control | 计算机数字控制 | 通过数字化坐标、速度和加工程序控制机床运动。 |
| IPC | Industrial PC | 工业计算机/工控机 | 行业通常直接写 *Industrial PC*；不必为了三个字母强行拆成三个独立单词。 |
| IIoT | Industrial Internet of Things | 工业物联网 | 在 IoT 前增加 Industrial，强调工业资产、可靠性、安全和生命周期要求。 |
| IoT | Internet of Things | 物联网 | 让物理“事物”通过网络被识别、连接和交换数据。 |

## 4. 计划、产品与物料

| 缩写 | 英文全称 | 中文含义 | 为什么这样命名 |
|---|---|---|---|
| BOM | Bill of Materials | 物料清单 | *Bill* 在工程和商业语境中表示正式清单；它描述产品由哪些物料组成。 |
| EBOM | Engineering Bill of Materials | 工程物料清单 | E 是 *Engineering*，强调按设计结构组织产品。 |
| MBOM | Manufacturing Bill of Materials | 制造物料清单 | M 是 *Manufacturing*，强调按制造装配、投料和工艺意图组织。 |
| MPS | Master Production Schedule | 主生产计划 | *Master* 表示统领最终产品或关键产品的主层计划。 |
| MRP | Material Requirements Planning | 物料需求计划 | 根据需求、BOM、库存和提前期计算何时需要多少物料。 |
| ATP | Available to Promise | 可承诺量 | 表示基于现有库存和已计划供应，还能向客户承诺的数量。 |
| CTP | Capable to Promise | 可能力承诺 | 不只看库存，还看产能、物料和约束是否支持承诺。 |
| ECN | Engineering Change Notice | 工程变更通知 | *Notice* 强调经过评审后发布变更内容和生效要求；企业也可能使用 Engineering Change Order。 |
| SN | Serial Number | 序列号 | *Serial* 表示按系列唯一编号，用于逐件身份和追溯。 |
| WIP | Work in Process | 在制品 | 指已经进入制造过程但尚未成为完工品的对象；部分资料写 Work in Progress，需统一企业口径。 |
| LPN | License Plate Number | 物流容器标识号 | 借用“车牌唯一识别车辆”的比喻，为托盘、箱或容器提供唯一物流身份，不是机动车牌。 |
| FIFO | First In, First Out | 先进先出 | 按进入顺序优先使用或发出，名称直接描述队列规则。 |
| FEFO | First Expired, First Out | 先到期先出 | 优先使用最早到期批次，关注有效期而非单纯入库时间。 |

## 5. 质量、指标与交付

> IQC、IPQC、FQC、OQC 等在制造企业中常用，但不是 ISO 强制规定的统一软件模块名，具体边界需以企业质量流程为准。

| 缩写 | 英文全称 | 中文含义 | 为什么这样命名 |
|---|---|---|---|
| IQC | Incoming Quality Control | 来料质量控制 | *Incoming* 表示进入企业或工厂的物料。 |
| IPQC | In-Process Quality Control | 过程质量控制 | *In-Process* 表示制造过程中，而不是只在最终检验。 |
| FQC | Final Quality Control | 最终质量控制 | *Final* 表示生产结束后的最终产品层检查。 |
| OQC | Outgoing Quality Control | 出货质量控制 | *Outgoing* 表示产品离开工厂或仓库前的检查。 |
| AQL | Acceptance Quality Limit | 接收质量限 | 用于抽样检验的接收质量界限；不是“允许生产这么多缺陷”的目标值。 |
| NCR | Nonconformance Report | 不符合报告 | 记录产品或过程没有满足要求的事实；有些企业写 Non-Conformity Report。 |
| MRB | Material Review Board | 物料评审委员会 | 由跨职能人员评审不符合物料的处置；有些企业使用 Manufacturing Review Board，需确认。 |
| CAPA | Corrective and Preventive Action | 纠正和预防措施 | *Corrective* 处理已发生问题的原因，*Preventive* 防止潜在问题发生。 |
| OEE | Overall Equipment Effectiveness | 设备综合效率 | *Overall* 表示综合可用率、性能和质量，而不是只看开机时间。 |
| FPY | First Pass Yield | 一次通过率 | *First Pass* 表示不返工、不重测情况下首次通过。 |
| RTY | Rolled Throughput Yield | 滚动直通率 | 将多道工序的一次通过率连续相乘，反映整条路线不返工通过的概率。 |
| OTIF | On Time In Full | 按时足量交付率 | 同时满足“按时”和“足量”，只满足一个不算完整交付。 |
| KPI | Key Performance Indicator | 关键绩效指标 | *Key* 表示只选能反映目标达成的关键指标，而不是所有可测数据。 |

## 6. 通信、软件与数据

| 缩写/短名 | 英文全称 | 中文含义 | 为什么这样命名 |
|---|---|---|---|
| OPC | Open Platform Communications | 开放平台通信 | OPC 最初来自 *OLE for Process Control*；跨平台后 OPC Foundation 将其定义为 Open Platform Communications。 |
| OPC UA | Open Platform Communications Unified Architecture | 开放平台通信统一架构 | *Unified Architecture* 表示把经典 OPC 的多类能力统一到跨平台、安全、可建模的架构。 |
| MQTT | Message Queuing Telemetry Transport（OASIS 委员会名称） | 轻量发布/订阅消息传输协议 | 名称有历史沿革；现代 MQTT 以 Broker 发布/订阅工作，不能因 *Queuing* 字样把它等同于传统消息队列。 |
| Modbus | Modbus（协议专名） | 工业通信协议名 | 它不是需要逐字母展开的首字母缩写；应解释功能码、线圈和寄存器模型，而不是编造英文全称。 |
| TCP | Transmission Control Protocol | 传输控制协议 | 提供有序、可靠的字节流传输。 |
| IP | Internet Protocol | 网际协议 | 负责跨网络寻址和分组传递。 |
| TCP/IP | Transmission Control Protocol / Internet Protocol | TCP/IP 协议族 | 斜线表示常配合使用的传输层与网际层协议集合。 |
| RTU | Remote Terminal Unit | 远程终端单元 | 在 Modbus RTU 中也指相应串行帧格式；名称来自远端采集控制终端。 |
| HTTP | Hypertext Transfer Protocol | 超文本传输协议 | 最初用于传输超文本文档，现也广泛承载 API。 |
| HTTPS | Hypertext Transfer Protocol Secure | 安全超文本传输协议 | 表示 HTTP 通过 TLS 建立机密性、完整性和身份保护。 |
| API | Application Programming Interface | 应用程序编程接口 | 是软件能力对调用方开放的契约边界，而不是页面按钮。 |
| SDK | Software Development Kit | 软件开发工具包 | *Kit* 表示 API、库、示例、工具和文档的组合。 |
| JSON | JavaScript Object Notation | JavaScript 对象表示法 | 起源于 JavaScript 对象字面量语法，但已成为语言无关的数据交换格式。 |
| URI | Uniform Resource Identifier | 统一资源标识符 | 用于标识资源；范围比 URL 更广。 |
| URL | Uniform Resource Locator | 统一资源定位符 | 不仅标识资源，还提供其位置或访问方式。 |
| QoS | Quality of Service | 服务质量 | 在 MQTT 中表示消息交付等级，不表示业务动作恰好执行一次。 |
| TLS | Transport Layer Security | 传输层安全协议 | 在传输层上提供加密、完整性和身份验证。 |
| MFA | Multi-Factor Authentication | 多因素认证 | 至少使用两类不同因素，区别于重复输入多个同类密码。 |
| RBAC | Role-Based Access Control | 基于角色的访问控制 | 权限先赋给角色，再由用户获得角色，便于岗位治理。 |
| ABAC | Attribute-Based Access Control | 基于属性的访问控制 | 根据用户、资源、动作和环境属性动态判定权限。 |
| ACID | Atomicity, Consistency, Isolation, Durability | 原子性、一致性、隔离性、持久性 | 四个词描述数据库事务应具备的四类性质。 |
| CRUD | Create, Read, Update, Delete | 创建、读取、更新、删除 | 概括基础数据操作；复杂领域行为不能只用 CRUD 表达。 |
| DTO | Data Transfer Object | 数据传输对象 | 只为跨边界传输数据，不承担领域规则。 |
| CDC | Change Data Capture | 变更数据捕获 | 捕获数据库或数据源变化，用于同步或事件化。 |
| SQL | Structured Query Language | 结构化查询语言 | 用声明式语句查询和操作关系数据。 |
| UUID | Universally Unique Identifier | 通用唯一标识符 | 用较大随机或规则空间降低分布式生成标识时的冲突概率。 |
| ID | Identifier | 标识符 | 泛指识别对象的值；不是所有 ID 都天然全局唯一。 |
| I/O | Input / Output | 输入/输出 | 从控制器视角，Input 是进入控制器的信号，Output 是控制器发出的信号。 |

来源：[OPC Foundation 的 OPC 说明](https://opcfoundation.org/about/what-is-opc/)、[OPC UA 缩写表](https://reference.opcfoundation.org/specs/OPC-10000-1/2.2)、[MQTT.org](https://mqtt.org/)、[OASIS MQTT 5.0](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html)、[Modbus Specifications](https://www.modbus.org/modbus-specifications)。

## 7. PLC、测试和现场技术

| 缩写 | 英文全称 | 中文含义 | 为什么这样命名 |
|---|---|---|---|
| ST | Structured Text | 结构化文本 | IEC 61131-3 的文本式 PLC 语言，具有结构化编程语法。 |
| LD | Ladder Diagram | 梯形图 | 图形外观类似继电器控制电路的梯子。 |
| FBD | Function Block Diagram | 功能块图 | 通过功能块及其连接表示控制逻辑和数据流。 |
| SFC | Sequential Function Chart | 顺序功能图 | 用步骤、转换和动作表示顺序过程。 |
| BLE | Bluetooth Low Energy | 低功耗蓝牙 | 在 Bluetooth 基础上强调低功耗设备通信。 |
| UART | Universal Asynchronous Receiver-Transmitter | 通用异步收发器 | *Asynchronous* 表示不共享连续时钟，依靠约定波特率和帧格式收发。 |
| PCB | Printed Circuit Board | 印制电路板 | 导电线路通过印制/制造工艺形成在板材上。 |
| SHA-256 | Secure Hash Algorithm 256-bit | 256 位安全散列算法 | 256 表示输出摘要长度；散列用于完整性校验，不等同于加密。 |
| PASS | English result word, not an acronym | 通过 | 它是英语单词，不需要逐字母展开；设备 PASS 仍需 MES 业务校验。 |
| FAIL | English result word, not an acronym | 失败 | 它是英语单词；还要区分产品失败、设备故障和结果未知。 |
| HTML | HyperText Markup Language | 超文本标记语言 | *Markup* 表示用标记描述文档语义结构，不是编程语言。 |
| CSS | Cascading Style Sheets | 层叠样式表 | *Cascading* 表示多个来源和选择器按优先级层叠决定样式。 |

来源：[IEC 61131-3](https://webstore.iec.ch/en/publication/68533)。

## 8. 智能锁场景速查

| 看到的缩写 | 先问什么 | 实际例子 |
|---|---|---|
| ERP / MES | 是经营承诺，还是现场事实？ | ERP 有 2,000 把订单；MES 有每把 SN 的工序履历。 |
| EBOM / MBOM | 是设计结构，还是制造投料结构？ | 设计上的主板组件与产线实际领用包装层级可能不同。 |
| PLC / HMI / SCADA | 是控制、单机交互，还是集中监督？ | PLC 控夹具；HMI 给操作者操作；SCADA 汇总整线报警。 |
| SN / LPN | 是逐件产品身份，还是物流容器身份？ | 整锁 SN 放入箱 LPN，不能混成同一个编码。 |
| NCR / CAPA | 是记录一次不符合，还是消除系统性原因？ | 测试 FAIL 建 NCR；重复问题根因和改进进入 CAPA。 |
| FPY / RTY | 是单工序首次通过，还是整路线直通？ | 每站 99% 并不等于整锁路线仍有 99%。 |
| OPC UA / MQTT | 是结构化互操作，还是异步发布订阅？ | 测试台可用 OPC UA 建模，网关可用 MQTT 上送事件。 |
| API / I/O | 是软件契约，还是控制器物理输入输出？ | MES API 创建会话；PLC I/O 读取光电并驱动气缸。 |
