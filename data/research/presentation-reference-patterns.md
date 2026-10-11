# 展示范式参考筛选（2026-09-26）

## 2026-10-10 重点跟踪学习目录（已确认）

本次新增维护流程，不变更线上界面或产品版本。机器可读目录见 [priority-watchlist.json](priority-watchlist.json)，每日观察输入见 [reference-observations.json](current/reference-observations.json)，本地对照结果见 [reference-reconciliation.json](current/reference-reconciliation.json)。

| 优先级 | 项目 | 重点学习 | 对照范围 | 边界 |
|---|---|---|---|---|
| P1 | [Starlink Mission Control](https://huggingface.co/spaces/juliensimon/starlink-mission-control) | 星座整体→壳层→生命周期→空间视图；观测与仿真分离 | Starlink 可追踪数量、快照日期、状态结构 | [关联数据集](https://huggingface.co/datasets/juliensimon/starlink-fleet-data)基于 CelesTrak；遵守其使用许可。高度推断的 operational 不等于已商用；路由模拟不是真实网络遥测 |
| P1 | [Orbital Radar](https://orbitalradar.com/) | 多星座筛选、包含中国星座的专题、部署节奏与解释性导航 | Starlink、OneWeb、Amazon LEO、国网、千帆目录覆盖 | 参考范式而非复制界面；[条款](https://orbitalradar.com/legal)限制系统性提取和 API 使用，未获许可不部署每日抓取 |

### 每日 reconciliation 规则

- 主数据仍来自现有 GCAT 等来源。对照结果只进入研究记录，不自动修改库存、运营数量或申报里程碑。
- HF 优先检查公开数据集最新真实快照并保留版本与日期；不得把 README 的近似数字当作当天数据。10 月 10 日每日检查已取得 dataset viewer 的 10 月 9 日实际行：四个壳层合计 11,103，较 GCAT 同日物理在轨估算少 34。最新日未见 shell 0 行，不能假设完整物理库存。仓库版本、文件哈希与 viewer 分别记录，不声称 viewer 已绑定到具体 parquet 版本。
- Orbital Radar 的本轮记录为有署名的一次性用户查询引用，页面标注 2026-10-09。每日任务可重算已有记录，并检查是否取得许可；持续收集新数量须先有相应许可，不利用用户查询例外绕过系统性提取限制。
- 页面更新时间不是精确轨道目录 epoch；只在日历日期相同且数量已知时给出“peer − local”目录覆盖差，仍不宣称口径完全一致。异日、缺日期、缺数值均不计算差值。
- 分别保存来源时间与检索时间；重算保持输出确定性，不制造新鲜度。缺失不是零；计划量、累计发射量、正常运营量不混入在轨数量对照。
- 每日重建派生星座库存后运行 `npm run data:reconcile:references`，再做来源健康检查。第三方共享上游目录，不算完全独立验证。
- 平稳或已知差异不重复通知；新显著差异、许可变化、必要来源失效才报告。研究记录改变本身不触发线上版本发布。

### 首轮结果与后续问题

首次建档的 6 条观察为：2 条同日期数量一致，3 条目录覆盖差异待复核，1 条历史日期不匹配；10 月 10 日每日检查用 HF 实际行替换旧数据卡后，变为 2 条一致、4 条覆盖差异。差异并不证明某方错误，优先排查新批次收录延迟、名称映射和记录范围。以后学习重点：如何把星座级空间视图接到现有资产数字，而不是建设全对象碎片追踪器。


## 2026-10-09 增补：产业框架而非界面模板

[轨道基础设施功能栈融合方案](orbital-infrastructure-stack-2026-10-09.md)新增 NFX、Amadeus Capital、Space Capital 的已核验原文。借鉴其价值链和物理基础设施/分发/应用的区分，不把这些文章当作资产观测来源，也不将本项目 L0–L4 五层归为它们的统一原生模型。后续用于在轨资产的功能筛选与成熟度摘要，现有五大栏目保留；本轮不修改线上界面。

本轮只比较参考方向，不修改页面、不发布版本。以下是建议而非已确认的下一版需求；基于公开页面文本与作者说明，不声称已完成交互或截图视觉评测。

| 参考 | 建议借鉴 | 不照搬 |
|---|---|---|
| [Orbital Radar](https://orbitalradar.com/satellite-internet/qianfan-vs-starlink) | 同日历与首发日对齐的双横轴；最近90天部署节奏；总览到专题的下钻 | 混合在轨与运营口径；线性外推不作正式预测 |
| [starlink-viz Fleet Monitor](https://github.com/juliensimon/starlink-viz) | 增长、壳层填充、状态结构、批次与生命周期分模块；实测与推断的边界说明 | 3D主舞台、实时遥测、仿真网络 |
| [Kevin Ricche](https://www.kevinricche.com/constellations/) | 品牌、运营商、部署量、计划量、最近部署日期的一屏摘要及共图时间线 | 累计发射代替库存；未经版本对齐的完成率 |
| [NewSpace Index](https://www.newspace.im/) | 品牌/代际目录、用途分类、计划与取消项目、变更记录 | 超长主表成为看板首页；Launched当Active |
| [Next Spaceflight](https://nextspaceflight.com/) | 即将发生与已发生事件分区；任务卡片；关联火箭、发射场和事件资料 | 倒计时与新闻挤占长期资产指标 |
| [ITU Argus](https://www.itu.int/space-argus/) | 申报网络、频率登记、运营实体和申报部署的关系模型 | 会员限制界面未经检查，不作为已验证UI范式 |

GCAT同时可借鉴状态拆分和原始统计透明性；CelesTrak、RES35原始列表、Constellation Census主要作为证据或数据模型参考，而非首页布局模板。

候选组合：品牌摘要 → 同口径共图库存历史 → 90天节奏 → 轨道壳层/生命周期 → 品牌下具体申报节点。默认使用日历轴，首发对齐作为辅助比较；官方节点与商业阶段目标明确分层。

开放问题（原调研时）：下一版优先改善现有星座共图的筛选与摘要，还是增加壳层/生命周期视窗？需用户确认，不因参考调研自动扩展产品范围。

2026-10-10 用户授权实现预案后，已纳入 Alpha 1.8.0：增长共图筛选、五个星座的目录高度—倾角分组和证据边界、公开来源学习目录。详见 [实现与验收记录](constellation-explorer-1.8.0.md)。这是目录结构视图，不是恢复真实轨道面或网络仿真；此前“本轮不修改页面”的表述仅适用于原调研轮次。
