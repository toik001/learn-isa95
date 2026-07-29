# MES（Manufacturing Execution System，制造执行系统）学习助手

这是面向 Java 全栈开发的智能锁离散制造与销售 MES 端到端学习项目。内容以八阶段数字主线组织，并以 Markdown 保存完整知识、以静态页面提供学习入口。英文缩写的完整展开和命名原因统一收录在 `glossary.html` 与 `docs/acronym-glossary.md`。

## 使用方式

直接打开 `index.html` 即可阅读学习驾驶舱。首页提供总览与筛选，所有阶段、模块、岗位、系统边界、Java 横贯专题和 ISA-95 工业自动化体系都可以继续进入独立静态详情页。`architecture.html` 是从 ERP、MOM/MES 到 PLC、现场设备的纵向学习入口。也可在项目根目录启动任意本地静态服务后，在浏览器访问该页面。

运行最终验证（先检查页面脚本语法，再执行所有项目测试）：

```bash
node --check assets/app.js && node --test
```

## 目录职责

- `AGENTS.md`：学习助手的场景、行为和质量约束。
- `docs/learning-log.md`：学习问题、假设、决策、验证与待确认项。
- `docs/`：可持续维护的 MES 领域知识和设计资料。
- `index.html`：无需构建即可直接打开的静态学习入口。
- `architecture.html`：ISA-95、IT/OT 和工业自动化体系总入口。
- `glossary.html`：英文缩写全称、中文释义、命名原因和智能锁场景入口。
- `pages/stages/`：八阶段业务、数据、系统与实现详情。
- `pages/modules/`：工单、工艺、物料、设备、质量、追溯与报表模块。
- `pages/roles/`：销售、计划、工艺、仓储、班组、质量、设备与 Java 开发岗位。
- `pages/systems/`：ERP、PLM、MES、WMS、QMS 与设备系统边界。
- `pages/topics/`：数字线程、状态机、幂等并发、跨系统一致性和权限审计。
- `pages/architecture/`：ERP、MOM/MES、SCADA、PLC、现场设备、安全和协议等 20 个体系节点。
- `assets/`：页面样式与交互资源。
- `tests/`：使用 Node 内置测试运行器执行的项目检查。
- `scripts/annotate-acronyms.mjs`：为静态页面中的行业缩写生成可读的语义标注。
