import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  configuredDiagramCount,
  upsertLearningDiagram,
} from "./learning-diagrams.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const pagesRoot = resolve(root, "pages");

const acronyms = new Map([
  ["OPC UA", "Open Platform Communications Unified Architecture｜开放平台通信统一架构"],
  ["IEC 62264", "Enterprise-control system integration standard series｜企业—控制系统集成标准系列"],
  ["ISA-95", "ISA standards committee/series 95｜ISA 第 95 委员会/标准系列"],
  ["SHA-256", "Secure Hash Algorithm 256-bit｜256 位安全散列算法"],
  ["TCP/IP", "Transmission Control Protocol / Internet Protocol｜TCP/IP 协议族"],
  ["IT/OT", "Information Technology / Operational Technology｜信息技术与运营技术"],
  ["I/O", "Input / Output｜输入/输出"],
  ["CMMS", "Computerized Maintenance Management System｜计算机化维护管理系统"],
  ["SCADA", "Supervisory Control and Data Acquisition｜监督控制与数据采集"],
  ["CAPA", "Corrective and Preventive Action｜纠正和预防措施"],
  ["IPQC", "In-Process Quality Control｜过程质量控制"],
  ["HTTPS", "Hypertext Transfer Protocol Secure｜安全超文本传输协议"],
  ["UART", "Universal Asynchronous Receiver-Transmitter｜通用异步收发器"],
  ["UUID", "Universally Unique Identifier｜通用唯一标识符"],
  ["MQTT", "Message Queuing Telemetry Transport｜轻量发布/订阅消息协议"],
  ["EBOM", "Engineering Bill of Materials｜工程物料清单"],
  ["MBOM", "Manufacturing Bill of Materials｜制造物料清单"],
  ["NIST", "National Institute of Standards and Technology｜美国国家标准与技术研究院"],
  ["IIoT", "Industrial Internet of Things｜工业物联网"],
  ["IIOT", "Industrial Internet of Things｜工业物联网"],
  ["MES", "Manufacturing Execution System｜制造执行系统"],
  ["MOM", "Manufacturing Operations Management｜制造运营管理"],
  ["ERP", "Enterprise Resource Planning｜企业资源计划"],
  ["PLM", "Product Lifecycle Management｜产品生命周期管理"],
  ["APS", "Advanced Planning and Scheduling｜高级计划与排程"],
  ["WMS", "Warehouse Management System｜仓库管理系统"],
  ["QMS", "Quality Management System｜质量管理体系/系统"],
  ["EAM", "Enterprise Asset Management｜企业资产管理"],
  ["CRM", "Customer Relationship Management｜客户关系管理"],
  ["HMI", "Human-Machine Interface｜人机界面"],
  ["PLC", "Programmable Logic Controller｜可编程逻辑控制器"],
  ["DCS", "Distributed Control System｜分布式控制系统"],
  ["CNC", "Computer Numerical Control｜计算机数字控制"],
  ["IPC", "Industrial PC｜工业计算机/工控机"],
  ["BOM", "Bill of Materials｜物料清单"],
  ["MPS", "Master Production Schedule｜主生产计划"],
  ["MRP", "Material Requirements Planning｜物料需求计划"],
  ["ATP", "Available to Promise｜可承诺量"],
  ["CTP", "Capable to Promise｜可能力承诺"],
  ["ECN", "Engineering Change Notice｜工程变更通知"],
  ["SN", "Serial Number｜序列号"],
  ["WIP", "Work in Process｜在制品"],
  ["LPN", "License Plate Number｜物流容器标识号"],
  ["FIFO", "First In, First Out｜先进先出"],
  ["FEFO", "First Expired, First Out｜先到期先出"],
  ["IQC", "Incoming Quality Control｜来料质量控制"],
  ["FQC", "Final Quality Control｜最终质量控制"],
  ["OQC", "Outgoing Quality Control｜出货质量控制"],
  ["AQL", "Acceptance Quality Limit｜接收质量限"],
  ["NCR", "Nonconformance Report｜不符合报告"],
  ["MRB", "Material Review Board｜物料评审委员会"],
  ["OEE", "Overall Equipment Effectiveness｜设备综合效率"],
  ["FPY", "First Pass Yield｜一次通过率"],
  ["RTY", "Rolled Throughput Yield｜滚动直通率"],
  ["OTIF", "On Time In Full｜按时足量交付率"],
  ["KPI", "Key Performance Indicator｜关键绩效指标"],
  ["OPC", "Open Platform Communications｜开放平台通信"],
  ["TCP", "Transmission Control Protocol｜传输控制协议"],
  ["IP", "Internet Protocol｜网际协议"],
  ["RTU", "Remote Terminal Unit｜远程终端单元"],
  ["HTTP", "Hypertext Transfer Protocol｜超文本传输协议"],
  ["API", "Application Programming Interface｜应用程序编程接口"],
  ["SDK", "Software Development Kit｜软件开发工具包"],
  ["JSON", "JavaScript Object Notation｜JavaScript 对象表示法"],
  ["URI", "Uniform Resource Identifier｜统一资源标识符"],
  ["URL", "Uniform Resource Locator｜统一资源定位符"],
  ["QoS", "Quality of Service｜服务质量"],
  ["TLS", "Transport Layer Security｜传输层安全"],
  ["MFA", "Multi-Factor Authentication｜多因素认证"],
  ["RBAC", "Role-Based Access Control｜基于角色的访问控制"],
  ["ABAC", "Attribute-Based Access Control｜基于属性的访问控制"],
  ["ACID", "Atomicity, Consistency, Isolation, Durability｜原子性、一致性、隔离性、持久性"],
  ["CRUD", "Create, Read, Update, Delete｜创建、读取、更新、删除"],
  ["DTO", "Data Transfer Object｜数据传输对象"],
  ["CDC", "Change Data Capture｜变更数据捕获"],
  ["SQL", "Structured Query Language｜结构化查询语言"],
  ["ID", "Identifier｜标识符"],
  ["ST", "Structured Text｜结构化文本"],
  ["LD", "Ladder Diagram｜梯形图"],
  ["FBD", "Function Block Diagram｜功能块图"],
  ["SFC", "Sequential Function Chart｜顺序功能图"],
  ["BLE", "Bluetooth Low Energy｜低功耗蓝牙"],
  ["PCB", "Printed Circuit Board｜印制电路板"],
  ["PASS", "English word, not an acronym｜通过"],
  ["FAIL", "English word, not an acronym｜失败"],
  ["HTML", "HyperText Markup Language｜超文本标记语言"],
  ["CSS", "Cascading Style Sheets｜层叠样式表"],
  ["ISA", "International Society of Automation｜国际自动化协会"],
  ["IEC", "International Electrotechnical Commission｜国际电工委员会"],
  ["ISO", "International Organization for Standardization｜国际标准化组织"],
  ["IT", "Information Technology｜信息技术"],
  ["OT", "Operational Technology｜运营技术/操作技术"],
  ["SP", "Special Publication｜特别出版物"],
  ["PC", "Personal Computer｜个人计算机"],
]);

const orderedTerms = [...acronyms.keys()]
  .sort((left, right) => right.length - left.length);
const escapedTerms = orderedTerms
  .map((term) => term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
const acronymPattern = new RegExp(
  `(?<![A-Za-z0-9])(${escapedTerms.join("|")})(?![A-Za-z0-9])`,
  "g",
);
const skippedElements = new Set(["abbr", "code", "pre", "script", "style", "title"]);

async function listHtmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listHtmlFiles(path));
    } else if (entry.name.endsWith(".html")) {
      files.push(path);
    }
  }
  return files;
}

function escapeTitle(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;");
}

function synchronizeExistingAnnotations(html) {
  return html.replace(
    /<abbr\b([^>]*)>([^<]+)<\/abbr>/gi,
    (whole, attributes, term) => {
      const definition = acronyms.get(term);
      if (!definition || !/\btitle="[^"]*"/.test(attributes)) return whole;
      const updated = attributes.replace(
        /\btitle="[^"]*"/,
        `title="${escapeTitle(definition)}"`,
      );
      return `<abbr${updated}>${term}</abbr>`;
    },
  );
}

function annotateVisibleText(html) {
  const parts = html.split(/(<[^>]+>)/g);
  const stack = [];
  return parts.map((part) => {
    if (!part.startsWith("<")) {
      if (stack.some((name) => skippedElements.has(name))) return part;
      return part.replace(acronymPattern, (term) => {
        const title = escapeTitle(acronyms.get(term));
        return `<abbr title="${title}">${term}</abbr>`;
      });
    }

    const close = part.match(/^<\s*\/\s*([a-z0-9-]+)/i);
    if (close) {
      const name = close[1].toLowerCase();
      const index = stack.lastIndexOf(name);
      if (index >= 0) stack.splice(index, 1);
      return part;
    }

    const open = part.match(/^<\s*([a-z0-9-]+)/i);
    if (open && !/\/\s*>$/.test(part)) {
      const name = open[1].toLowerCase();
      if (!["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"].includes(name)) {
        stack.push(name);
      }
    }
    return part;
  }).join("");
}

function addGlossaryLink(html, file) {
  if (html.includes('class="acronym-help"')) return html;
  const href = relative(root, file).includes("/")
    ? "../../glossary.html"
    : "glossary.html";
  return html.replace(
    /(<a class="skip-link"[^>]*>[\s\S]*?<\/a>)/,
    `$1<a class="acronym-help" href="${href}" aria-label="打开英文缩写全称与命名解释">英文缩写表</a>`,
  );
}

function addTooltipScript(html, file) {
  if (html.includes("acronym-tooltip.js")) return html;
  const src = relative(root, file).includes("/")
    ? "../../assets/acronym-tooltip.js"
    : "assets/acronym-tooltip.js";
  return html.replace(
    /<\/head>/,
    `  <script src="${src}" defer></script>\n</head>`,
  );
}

const htmlFiles = [
  resolve(root, "index.html"),
  resolve(root, "architecture.html"),
  ...await listHtmlFiles(pagesRoot),
];

for (const file of htmlFiles) {
  const original = await readFile(file, "utf8");
  const relativePath = relative(root, file).replaceAll("\\", "/");
  const withDiagram = upsertLearningDiagram(original, relativePath);
  const synchronized = synchronizeExistingAnnotations(withDiagram);
  const withLink = addGlossaryLink(synchronized, file);
  const annotated = annotateVisibleText(withLink);
  const withTooltipScript = addTooltipScript(annotated, file);
  await writeFile(file, withTooltipScript);
}

if (configuredDiagramCount() !== htmlFiles.length) {
  throw new Error(
    `Configured ${configuredDiagramCount()} diagrams for ${htmlFiles.length} learning pages.`,
  );
}

console.log(
  `Annotated ${htmlFiles.length} HTML pages with ${acronyms.size} glossary terms and static learning diagrams.`,
);
