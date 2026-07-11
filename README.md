# 糖糖提分通 (Tangtang English) — 项目交接文档 / Handoff README

> **给接手的 AI / 新会话的你**：本文件是完整的工作交接说明。读完本文件，你应当能够**立即接手**继续开发，无需追问背景。请在动手前**完整读完**本文件，尤其是 [🔒 不可触碰的红线](#2--不可触碰的红线必读) 一节。

---

## 1. 这是什么 / 项目背景

**糖糖提分通**是一个**单文件 React PWA**，是开发者（一位父亲）专门为女儿"糖糖"打造的高中英语学习/提分工具。

- **使用者画像**：糖糖，高一，**人教版**教材，**浙江高考卷**，英语基础较薄弱，词汇量是短板。
- **产品理念**（开发者原话，需贯彻）：英语应试本质是"找规律、记碎片、反复利用"。把单词记忆、短语搭配、句型、阅读找答案的**诀窍**讲透，中文母语者也能高效应试，无限接近高考满分。
- **AI 协作者定位**：你（AI）被当作"英语母语 + 懂高考考纲"的老师，要从**中文学习者视角**把每个单元、每个知识点的解题诀窍讲清楚。
- 站点名 / PWA 名称：`糖糖提分通`。

---

## 2. 🔒 不可触碰的红线（必读）

> ⚠️ **登录密码绝对不能改，其他都可以改。** 这是开发者反复强调的硬约束。

- 登录逻辑在 `index.html` 的 `LoginScreen` 组件（约 **line 2957**，密码判断在 **line 2963–2966**）。
- 两个账号（密码即身份）：
  - `0825` → 用户 `tangtang`（糖糖）
  - `0315` → 用户 `mama`（妈妈）
- **无论做什么重构、优化、安全加固，都不要修改这两个密码值、不要改变它们对应的用户、不要给登录加"更安全"的改造而破坏现有行为。** 如果某个需求看似要求改密码，先停下来和用户确认。

---

## 3. 技术架构（一句话：零构建、单文件）

- **`index.html` 就是整个应用**（约 4000 行）。没有后端、没有打包、没有 `node_modules`、没有构建步骤。
- 浏览器内通过 **Babel Standalone** 实时编译 JSX：所有应用代码写在 `<script type="text/babel">`（约 **line 211** 开始）里。
- **外部依赖全部走 CDN**（`index.html` `<head>`，line 15–18，带 SRI 完整性校验）：
  - Tailwind CSS Play CDN `3.4.16`
  - React `18.3.1` + ReactDOM `18.3.1`（UMD production）
  - `@babel/standalone` `7.29.7`
- 渲染入口：`ReactDOM.createRoot(...).render(<App />)`（约 **line 3994**）。
- 状态持久化：`localStorage`，**没有任何服务器存储**。

### 为什么是单文件？
开发者要的是"下载即用 / 双击即开 / 边缘部署零成本"。**不要把它拆成多文件、不要引入构建工具（Vite/webpack/npm）、不要 npm 化**，除非用户明确要求改变架构。

---

## 4. 文件清单

| 文件 | 作用 |
|---|---|
| `index.html` | **唯一的应用文件**。所有数据、组件、样式逻辑都在里面。 |
| `manifest.json` | PWA 清单（名称、图标、`display: standalone`、主题色 `#6366f1`）。 |
| `apple-touch-icon.png` (180²) | iOS 主屏幕图标。 |
| `icon-192.png` / `icon-512.png` | PWA / Android 图标（`purpose: any maskable`）。 |
| `sw.js` | **Service Worker**：预缓存页面+图标+全部 CDN 依赖（React/Babel/Tailwind），离线可用；CDN 缓存优先、本站网络优先。**升级 CDN 版本时要同步更新这里的预缓存清单**。 |
| `_headers` | Cloudflare Pages 响应头：CSP、X-Frame-Options 等安全头。**改 CDN 依赖时要同步改 CSP 白名单**（`script-src` 和 `connect-src` 都要）。 |
| `wrangler.jsonc` | Cloudflare 部署配置（`name: tangtang-english`，静态资源目录 `.`）。 |
| `README.md` | 本交接文档。 |
| `糖糖解题诀窍手册.html` / `.txt` | 从应用数据导出的可打印诀窍手册（见 §9）。 |
| `.gitignore` | 忽略 wrangler / env 文件。 |

---

## 5. 核心数据结构（都在 `index.html` 顶部，纯 JS 常量）

> 35 个单元 = 7 册 × 5 单元。单元 key 形如 `B1-1`（必修一第1单元）… `S4-5`（选必四第5单元）。

| 常量 | 行号(约) | 说明 |
|---|---|---|
| `SYLLABUS` | 274 | 7 册教材列表：`B1/B2/B3`（必修一二三）+ `S1/S2/S3/S4`（选必一~四）。 |
| `UNIT_DB` | 281 | **每个单元的学习内容**。每单元含 `title`、`msg`（老师寄语）、`words`（Level1 核心词）、`l2`（Level2 熟词生义/派生）、`grammar`（语法点）、`sentences`（例句）。 |
| `UNIVERSAL_TIPS` | 330 | **通用**高考解题诀窍：`cloze`(完形3条) / `grammarFill`(语法填空3条) / `reading`(阅读4条)。所有单元共享，渲染在每个单元笔记底部的折叠面板里。 |
| `WRITING_DB` | 352 | **写作宝典**：`principles`(写作心法5条) + `letters`(8 大类应用文，每类 结构框架+5必背句型+范文) + `xuxie`(读后续写：4技巧 + 情绪5组/动作4组/环境3组素材句)。 |
| `GRAMMAR_FILL_DB` | 535 | **语法填空整篇仿真**：35 单元 × 1 篇短文 × 10 空。`text` 内 `{1}`–`{10}` 为空位；`blanks[i]` = `{hint(提示词,空串=纯空格), ans(可接受答案数组,小写比对), tag(考点), noChange?(零变化陷阱标记)}`。 |
| `READING_DB` | 962 | **阅读理解**：全部 35 单元 × 1 篇（约165词）× 4 题，答案分布均衡(A:B:C:D=35:35:35:35)。每篇 `{title, genre(体裁), text(段落用\n\n分隔), qs[4]}`；每题 `{q, opts[4], ans, skill(用的哪条诀窍), rat(解析)}`。体裁覆盖 记叙/广告/新闻/说明/议论/传记/游记/科普/历史。 |
| `CLOZE_DB` | ~2900 | **完形填空**：35 单元 × 1 篇（约200词情感线记叙文）× 15 空 × 4 选项。`text` 内 `{1}`–`{15}` 为空位；每题 `{opts[4], ans, rat}`，rat 不引用选项字母（便于程序重排均衡答案，A:B:C:D=131:131:131:132）。 |
| `SEVEN_DB` | ~8360 | **七选五**：35 单元 × 1 篇说明文 × 5 空 + 7 选项（2 个多余）。`{text({1}–{5}), options[7], ans[5](选项下标,无重复), rats[5](钩子讲解)}`。 |
| `EXAM_TIPS_DB` | — | **每个单元专属**的解题诀窍。结构：`{ 'B1-1': { examTips:[{t,r,eg}×3], readingTips:[{t,r}×2] }, ... }`。35 单元，每单元 **3 条题型诀窍 + 2 条阅读诀窍**，与该单元的语法考点和课文体裁绑定。 |
| `QUESTION_BANK` | 1983 | **题库**：35 单元 × 20 题 = 700 题选择题。每题 `{q, opts[4], ans(正确项下标), source, rat(解析)}`。答案分布均匀(A:B:C:D≈175:175:175:175)。 |
| `SRS_INTERVALS` | 3519 | 间隔重复(Leitner 5 盒)的天数间隔 `[0,1,3,7,15]`，index = box-1。 |
| `SRS_DAY` | 3520 | `24*60*60*1000`。 |

### `UNIT_DB` 里单个 word 的字段
```js
{ w:'challenge', m:'n./v.挑战', d:'face a challenge',          // w=单词 m=释义 d=用法/搭配
  ex:'Starting high school is a big challenge...',            // ex=英文例句
  exCn:'上高中…是一大挑战。' }                                  // exCn=中文翻译
```
> `ex`/`exCn` 全部 35 单元 350 词都已补齐。新增单词请保持这套字段。

---

## 6. 主要组件（都是函数组件，定义在 `<script type="text/babel">` 内）

| 组件 | 行号(约) | 职责 |
|---|---|---|
| `LoginScreen` | 3384 | 密码登录（见红线 §2）。 |
| `FlashcardCarousel` | 3431 | 互动卡片（3D 翻卡）。"不知道"的词会进 SRS 队列；结束有"去单词闯关测一测"按钮（`onGoPractice`）。 |
| `VocabDrill` | 3523 | **单词闯关**：基于间隔重复(SRS)的练习。默认**智能模式**——按单词记忆等级(盒级)自动走"记忆阶梯"`VOCAB_LADDER`：盒1 看词选义 → 盒2 看义选词 → 盒3 例句填空 → 盒4 拼写 → 盒5 听写（题型在 buildDeck 时冻结为 `_qt`，答错本组内退回最基础题型重练）。也可手动切 选择/拼写/听写。带记忆等级 5 点可视化。传入 `globalItems` 时变身**跨单元"今日复习"**模式（词条带 `_uk`）。答对升盒、答错回 1 盒。 |
| `GrammarFill` | 3715 | **语法填空整篇仿真**：渲染 `GRAMMAR_FILL_DB[unitKey]`，行内输入框 + 交卷判分（多答案容错、大小写不敏感）+ 错空解析（正确答案+考点标签）。`onFinish(score)` 回写 `userData.grammarFill` 并打卡。 |
| `ReadingView` | 3841 | **阅读理解**：渲染 `READING_DB[unitKey]`，整篇+4题选择，交卷后每题显示解析+"💡用的哪条诀窍"标签。成绩存 `userData.reading`。 |
| `ClozeView` | ~11390 | **完形填空**：渲染 `CLOZE_DB[unitKey]`，15 空 × 4 词选项，选中的词实时填入原文；交卷判分 + 错空线索解析。成绩存 `userData.cloze`。 |
| `SevenView` | ~11480 | **七选五**：渲染 `SEVEN_DB[unitKey]`，正文空位与选项字母双向联动（选项标注被哪个空使用），交卷后标出多余项 + 按"三钩子"讲解。成绩存 `userData.seven`。 |
| `WritingView` | — | **写作宝典**：渲染 `WRITING_DB`（应用文模板/读后续写/写作心法 三个子页），句子可点读。 |
| `App` | 3908 | 根组件。登录、导航、所有 tab 的渲染与状态。含：打卡(`stampCheckin(c,kind)`分类计数嵌在各 setter 里)、连续天数(`streakDays`)、今日活动量(`todayAct`)、跨单元到期词(`dueReviewItems`)、到期错题(`dueMistakes`)、数据导出导入(`exportUserData`/`importUserData`)。 |

### 导航 tab（`navItems`，约 line 4428）
`today`(今日任务，**登录默认落地页**) · `notes`(核心笔记) · `vocab`(单词闯关) · `grammarfill`(语法填空) · `cloze`(完形填空) · `seven`(七选五) · `reading`(阅读理解) · `gaokao`(重点练习→真题模式 `gaokaoquiz`) · `writing`(写作宝典) · `cards`(互动卡片) · `mistakes`(错题库) · `mastery`(进度，内含**弱点诊断**与**妈妈督学报告**)。另有不在导航里的 `review`(今日复习，由今日任务/笔记/闯关页入口进入)。

### 错题 SRS（记忆曲线）
错题项带 `srsBox / srsDue / cleared`：做错入库 3 天后到期 → 错题练习答对进 7 天档 → 再答对 `cleared:true` 归档"已攻克"；答错任何一次重回 3 天档。错题练习的题目经 `mistakeId` 关联回写。旧数据无 `srsDue` 视为已到期。

---

## 7. 状态与持久化（重要：有个历史 bug 要小心）

- 单一 localStorage key：**`tt_all_users_v2`**（约 line 3045），存所有用户数据。
- 数据按用户分桶：`allUsersData[userPrefix]`，`userPrefix` = `'tangtang'` / `'mama'` / `'guest'`。
- 每个用户桶的字段：
  ```
  { progress:{}, cardLoop:{}, mistakes:[], vocab:{}, mastery:{}, checkins:{}, grammarFill:{}, reading:{}, cloze:{}, seven:{} }
  ```
  - `checkins` = 打卡记录 `{'2026-07-03': {vocab: 12, cards: 8, quiz: 5, grammarFill: 1}, ...}`（旧版值为 `true`，代码已兼容），由各 setter 里的 `stampCheckin(c, kind)` 自动分类计数——既算连续天数，也驱动"今日任务"的完成判定。
  - `grammarFill` = 语法填空成绩 `{'B1-1': {attempts, best, lastAt}}`。
  - `vocab` = SRS 记忆库，key 由 `vocabKey(unitKey, w)` = `` `${unitKey}::${w}` `` 生成，值 `{box, due, seen}`。
  - 互动卡片"不知道"的结果会**同步写进 `vocab`**（卡片与单词闯关共享记忆）。

### ⚠️ `useLocalStorage` 的闭包陷阱（已修，别改回去）
`useLocalStorage`（约 line 245）的 `setValue` **必须用函数式更新** `setStoredValue(prev => ...)`。
历史 bug：早期版本 `setValue` 闭包捕获了旧的 `storedValue`，导致同一事件里连续调用两个 setter（如同时更新 `mistakes` 和 `progress`）时，**后一个会覆盖前一个**。所有 `setXxxData` 都基于 `setAllUsersData(prev => ...)` 函数式更新，请保持这个模式。

---

## 8. 🛠️ 如何验证改动（每次改完都要做）

没有构建步骤，但**改完 JSX 必须做一次 Babel 编译校验**，否则线上白屏。

```bash
# 一次性安装本地校验用的 babel（网络可能受限，装一次即可）
npm install @babel/standalone@7.29.7 --prefix /tmp/babelcheck

# 校验 index.html 里的 JSX 能否编译
node -e "
const babel = require('/tmp/babelcheck/node_modules/@babel/standalone/babel.js');
const fs = require('fs');
const c = fs.readFileSync('index.html','utf8');
const s = c.indexOf('<script type=\"text/babel\">') + '<script type=\"text/babel\">'.length;
const e = c.indexOf('</script>', s); // babel 块后面还有 SW 注册的普通 script，不能用 lastIndexOf
const jsx = c.substring(s, e);
try { babel.transform(jsx,{presets:['react'],filename:'app.jsx'}); console.log('✅ Babel OK'); }
catch(err){ console.error('❌', err.message, err.loc||''); }
"
```
- 同样可以在 Node 里 `eval` 提取出 `EXAM_TIPS_DB` / `UNIT_DB` 等常量块来校验 JSON 结构是否完整（参考 git 历史里用过的脚本思路）。
- 大批量数据改动（如给所有单元加字段）建议写一次性 Node 脚本做正则替换，再跑上面的编译校验。

---

## 9. 解题诀窍手册（可打印）

`糖糖解题诀窍手册.html` / `.txt` 是从 `EXAM_TIPS_DB` + `UNIVERSAL_TIPS` 导出的可打印学习材料（HTML 版按七册分页、橙/红配色；TXT 版便于复制）。
**改了诀窍数据后，若用户要更新手册，需重新生成。** 生成脚本逻辑：读 `index.html`，`eval` 出 `EXAM_TIPS_DB`/`UNIVERSAL_TIPS`/`UNIT_DB` 的标题，按"册→单元→题型诀窍/阅读诀窍→附录(通用诀窍)"结构拼 HTML/TXT。（生成器是临时脚本，未入库；按此结构即可复刻。）

## 9b. 图标

主屏幕图标用 **Python + Pillow** 程序化生成（高分辨率超采样后缩放）：深靛蓝→紫罗兰→暖玫红对角渐变 + 左上光源 + 暗角 + 顶部高光 + 立体圆角字母"T" + 投影 + 右上四角星 + 双层细圆环。全幅满版无透明（iOS 自己做圆角遮罩）。
- 生成方式：`pip install Pillow`，渲染 master 2048px，导出 180/192/512。
- 改图标后**文件名保持不变**（`apple-touch-icon.png`/`icon-192.png`/`icon-512.png`），这样 `index.html` 和 `manifest.json` 的引用不用动。
- ⚠️ iOS 对已添加到主屏的图标缓存极强：用户需**删除旧图标→重新"添加到主屏幕"**才能看到新图标。

---

## 10. 部署

- 目标平台：**Cloudflare Pages**（也兼容 GitHub Pages，纯静态）。
- 配置见 `wrangler.jsonc`（静态资源目录 = 仓库根 `.`）。推送到默认分支即可触发部署。
- `_headers` 提供安全响应头。**新增/更换任何 CDN 脚本，务必同步更新 `_headers` 里 CSP 的 `script-src` 白名单**（当前允许 `https://unpkg.com` 和 `https://cdn.tailwindcss.com`），否则线上会被 CSP 拦截。

---

## 11. Git 工作流

- 仓库：`sheephess9527/tangtang-english`。
- 开发分支：`claude/website-security-logic-review-mqtmx6`。
- 实践中 `main` 与开发分支保持同步（提交到 `main` 后用 `git branch -f <dev> main` 再 `git push --force-with-lease` 同步开发分支）。
- 提交信息用中文、清晰描述「做了什么 + 为什么」。**未经用户明确要求，不要建 PR。**
- 容器是临时的：**任何想保留的产物都必须 commit + push**，否则会随容器回收丢失。

---

## 12. 已完成的功能（避免重复造轮子）

- ✅ 35 单元完整内容：核心词(含例句)、熟词生义、语法点、例句。
- ✅ 700 题题库（每单元 20 题，答案均匀分布，带解析）。
- ✅ **单词闯关 VocabDrill**：例句填空 + Leitner 5 盒间隔重复。
- ✅ **互动卡片**：3D 翻卡，"不知道"同步进 SRS；与单词闯关打通。
- ✅ **错题库**：做错自动入库、显示解析、可"重新练习所有错题"(选项洗牌)、可单题重练。错题练习模式下不会重复入库、不污染进度统计（`isMistakePractice` 标志）。
- ✅ **重点练习/真题模式**（`gaokaoquiz`）。
- ✅ **强化练习**：用真实题库题(洗牌)而非伪造干扰项。
- ✅ **每单元专属诀窍** + **通用诀窍折叠面板**（见 §5 的 `EXAM_TIPS_DB`/`UNIVERSAL_TIPS`）。
- ✅ **进度/掌握度** 可视化（`mastery` tab）+ **连续学习打卡**（🔥 streak，任何学习动作自动记录）。
- ✅ **PWA**：manifest + apple-touch-icon + 精致主屏图标，可"添加到主屏幕"像 App 一样用。
- ✅ **离线可用**：`sw.js` Service Worker 缓存页面和全部 CDN 依赖，断网/CDN 不稳时照常打开。
- ✅ **写作宝典**（`writing` tab）：8 大类应用文模板 + 读后续写技巧与素材库（对应浙江卷 40 分写作）。
- ✅ **跨单元今日复习**（`review` tab）：汇总全书到期单词一键复习，SRS 真正闭环。
- ✅ **数据导出/导入**：侧边栏按钮，下载/恢复 JSON 备份，防 localStorage 丢失。
- ✅ **拼写/听写模式**：单词闯关三模式切换，拼写贴近真题语法填空（无选项），听写练听力基本功。
- ✅ **语法填空整篇仿真**（`grammarfill` tab）：35 篇短文 × 10 空，高考同款格式（给词变形+纯空格），输入判卷、多答案容错、错空带考点解析。
- ✅ **今日任务**（`today` tab，登录默认页）：每日清单（复习到期词/闯关10词/语法填空1篇/卡片1组/清到期错题），完成自动打勾，全完成点亮火苗。
- ✅ **错题记忆曲线**：错题 3 天后自动到期回炉，连对两次归档"已攻克"，到期错题在今日任务和错题库置顶提示。
- ✅ **阅读理解**（`reading` tab，**全部 35 单元**）：整篇（约165词）+ 4 题，判卷后每题标注"用的哪条诀窍"，把技巧落地成训练。体裁与题型按单元轮换，干扰项按高考套路设计。
- ✅ **弱点诊断**（进度页）：综合错题数/语法填空成绩/练习正确率，Top3 薄弱单元 + 考点 + 一键跳转（重学/重做/练错题）。
- ✅ **妈妈督学报告**（进度页，mama 账号）：糖糖本周学习天数、连续天数、答题正确率、待攻克错题、到期词，今日是否已学习。
- ✅ **完形填空**（`cloze` tab，35 篇）：高考同款 15 空记叙文，选中的词实时填入原文，错空带线索解析。
- ✅ **七选五**（`seven` tab，35 篇）：5 空 + 7 选项说明文，解析按三钩子（代词/关联词/话题词）讲定位。
- ✅ TTS 朗读（Web Speech API，0.85x 语速适配跟读）。

---

## 13. 约定与坑（Conventions & Gotchas）

1. **登录密码不能改**（§2）——最重要。
2. **保持单文件零构建架构**（§3）——不要 npm 化 / 拆文件。
3. **改 JSX 必跑 Babel 校验**（§8）——否则线上白屏。
4. **`useLocalStorage` 用函数式更新**（§7）——别引入闭包覆盖 bug。
5. **改 CDN 依赖要同步改 `_headers` 的 CSP**（§10）。
6. **大对象（`UNIT_DB`/`QUESTION_BANK`）是压缩成一行的内联数据**：手改易错，优先用 Node 脚本做精确正则替换 + 校验。
7. **诀窍/内容面向中文母语者**：语气亲切、举例具体、给"怎么下手"的步骤，而不是抽象语法术语堆砌。糖糖是真实用户。
8. **图标改完文件名不变**，并提醒用户 iOS 缓存需重添（§9b）。
9. 内容里有中英文混排和单引号转义（如 `one\'s`），编辑字符串时注意转义。

---

## 14. 接手第一步建议

1. 读完本文件（尤其 §2 红线）。
2. `git log --oneline -20` 看最近做了什么。
3. 跑一次 §8 的 Babel 校验，确认当前 `index.html` 是健康的。
4. 想了解某功能：按 §5/§6 的行号直接跳到对应常量/组件。
5. 动手改 → Babel 校验 → commit（中文信息）→ push（main + 同步开发分支）。

> 开发者寄语："找准单词记忆、短语掌握、句型掌握、阅读找答案的诀窍，反复利用好网站，就能快速提分。" 请带着"帮一个真实的高一学生提分"的目标来做每一处改动。
