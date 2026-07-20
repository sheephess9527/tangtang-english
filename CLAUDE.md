# CLAUDE.md

本文件是 Claude Code 每次会话自动加载的操作指南。完整背景见 `README.md`，本文件只列**必须遵守的规则与工作流**。

## 项目一句话
`糖糖提分通`：一位父亲为高一女儿"糖糖"（人教版 / 浙江高考卷 / 英语基础弱）做的**单文件 React PWA** 英语提分工具。整个应用就是一个 `index.html`（约 14300 行）。

## 🔒 绝对红线（最高优先级）
- **登录密码绝对不能改：`0825`→`tangtang`，`0315`→`mama`**（`index.html` `LoginScreen`，约 line 10855）。
- 后加的两个账号（用户明确要求）：`9999`→`baba`（爸爸，独立数据桶）、`0000`→`admin`（管理员，进度页可看全账户学习总览）。改动这两个前也先问用户。
- 开发者原话："**登录密码不用改，其他都改**。"
- 任何重构、优化、"安全加固"都不得修改 0825/0315 这两个密码值或其对应用户。若需求看似要求改密码，**先停下来问用户**。

## 架构约束（不要破坏）
- **单文件、零构建**：无后端、无打包、无 `node_modules`。所有应用代码在 `<script type="text/babel">`（约 line 240）里，浏览器用 **Babel Standalone** 实时编译 JSX。
- **不要** npm 化、拆多文件、引入 Vite/webpack 等构建工具，除非用户明确要求改架构。
- 依赖全走 CDN（React 18.3.1 / ReactDOM / @babel/standalone 7.29.7 / Tailwind 3.4.16），带 SRI。改/加 CDN 脚本时**必须同步更新 `_headers` 里 CSP 的 `script-src` 白名单**，否则线上被拦。

## 改完必做：Babel 编译校验（否则线上白屏）
```bash
npm install @babel/standalone@7.29.7 --prefix /tmp/babelcheck   # 装一次即可
node -e "
const babel=require('/tmp/babelcheck/node_modules/@babel/standalone/babel.js');
const fs=require('fs');const c=fs.readFileSync('index.html','utf8');
const s=c.indexOf('<script type=\"text/babel\">')+'<script type=\"text/babel\">'.length;
const e=c.indexOf('</script>',s);  // 注意：babel 块后面还有 SW 注册的普通 script，不能用 lastIndexOf
const jsx=c.substring(s,e);
try{babel.transform(jsx,{presets:['react'],filename:'app.jsx'});console.log('✅ Babel OK');}
catch(err){console.error('❌',err.message,err.loc||'');}
"
```

## 强烈建议：无头浏览器真实验证（CDN 被沙箱拦时的替代方案）
远程沙箱访问不了 cdn.tailwindcss.com/unpkg，但 registry.npmjs.org 放行。做法：复制 index.html 到 scratchpad，`npm i react@18.3.1 react-dom@18.3.1`（+复用 /tmp/babelcheck 的 babel.min.js），把 4 个 CDN `<script>` 替换成本地 vendor 文件（Tailwind 用空 JS 桩顶替，只影响外观不影响逻辑），禁用 SW 注册，`python3 -m http.server` 起服务，用 Playwright（`executablePath: '/opt/pw-browsers/chromium'`，npm 装 playwright 包即可）登录后真点真测。本仓库历史 bug 多次靠这招在提交前抓到。

## 关键数据/组件位置（行号约值，改前用 grep 复核）
- 数据：`UNIT_DB`(312) 35单元学习内容(words 含 w/m/d/ex/exCn) · `WRITING_DB` 写作宝典 · `GRAMMAR_FILL_DB`(566) 语法填空35篇(blank 带 tag 语法点标签) · `QUESTION_BANK`(9454) 700题库(仅 q/opts/ans/rat，无 meta/难度字段) · `READING_DB` 阅读(题带 skill 标签) · `CLOZE_DB`/`SEVEN_DB` 完形/七选五(无结构化标签) · `EXAM_TIPS_DB` 每单元诀窍 · `SRS_INTERVALS`(11003) · `VOCAB_LADDER` 单词记忆阶梯 · `MISTAKE_CAUSES`(11018) 错因六分类(id/label/advice) · `WRITING_TRAIN_DB`(11647) 写作四步训练3套
- 组件：`LoginScreen`(10855) · `FlashcardCarousel` · `VocabDrill`(智能模式按盒1-5配题型，globalItems=跨单元今日复习) · `GrammarFill` · `ReadingView` · `ClozeView` · `SevenView` · `WritingView`(11677，含"四步训练"sec) · `ChunkWorkshop`(11864 词块工坊：含义→搭配→例句→造句，好句本存 mySentences) · `ListeningView`(11993 句子精听：变速/主旨/细节/对照) · `App`(12096)
- 动态出题器(10537 起)：`buildThemeMeaningQ/buildContextWordQ/buildCollocationQ/buildGrammarInContextQ/buildGrammarErrorQ/buildSentenceInferenceQ/buildWritingStrategyQ`，产出带 `meta:{type,data}`；`buildReinforcementQs(meta)` 强化小题。**题库题 meta 为 null**——所有依赖 meta 的功能都要有兜底（现有兜底：从题干/选项文本匹配本单元单词）。
- 测验流程(App 内)：`startQuiz` 出预热卡(showWarmup 考点速览) → `handleAnswer`(答错：建错题卡+当轮复现 `_retry`≤2 不计分不入库、wrongStreak 连错计数) → 解析区(一句话记住+折叠详解、错因标注 `setMistakeCause`、连错≥2 退阶提示、下一题延迟2秒 nextReady) → `nextQuestion` 结算(分母只算非 `_retry` 题)。
- 掌握体系：`unitTier`(补基础/跟教材/冲高考评级) · `unitMasteryPercent`(词汇40%+语法填空25%+正确率20%+错题清零15%) · `keyWatchWords` 盯防词 · `startPassExam` 单元通关测(12题80%达标，存 unitCert 桶) · `startUnitReview` 温故抽查(通关后3/7/15天，dueUnitReviews 驱动今日路线置顶卡) · 单词档案弹窗 `dossier`。
- 错题体系：SRS(`srsBox/srsDue/cleared/clearedAt`，新错3天回炉/回炉答对进7天档/回炉答错次日再来+当轮复现/连对两次攻克) · **同题不重复建卡**（再错重置现有卡+`lapses`+1，含已攻克的复活）· 复现题 `_retry` 不写 SRS · 错因 `cause` 字段 · `mistakePointOf` 知识点归集 · `startSimilarPractice` 练类似题 · `startVariantCheck` 回炉后变式题防背答案 · `buildMistakeReport/copyMistakeReport/exportMistakeReport` 汇总复制/导出TXT · 进度页"本周错因分析"。
- 错题库 UI 约定：卡片默认折叠+**遮答案自测**（先想再翻，主动回忆是错题本的核心价值，勿改回答案直接外露）· 到期在前、`lapses` 多的置顶（🔥错N次徽章）· 单元/错因筛选 chips · 预告条(今天/明天/7天/攻克率) · 删除有 confirm。
- 今日任务页 = 自适应路线（温故卡→到期词→新词→薄弱语法点→针对性练习→总结）+ 成长面板；完成态由 `checkins[今天]` 分类计数驱动（kind：quiz/cards/vocab/grammarFill/mistakes/reading/cloze/seven/chunks/listening/writingTrain/summary/unitCert，`stampCheckin` 累加；只打卡不动数据用 `stampOnlyCheckin`）。
- 发音三层：`speakText(text, rate)` 唯一入口 → ①系统语音合成（**优先 localService 本地语音**——Chrome 的 Google 网络语音在国内静默无声；忽略 canceled/interrupted 伪错误；规避 cancel/speak 竞态）→ ②失败自动切有道在线发音 `playFallbackAudio`（dict.youdao.com/dictvoice，`_headers` CSP 的 media-src 已白名单、sw.js 对该域直通不缓存，失败过一次本会话直走此通道）→ ③都不行才弹 audioTip。`playAudio` 是 0.85 速薄封装。**不要**回退成"cancel 后立即 speak"或"不分本地/网络随便挑语音"的写法。
- 35 单元 = 7 册×5：key 形如 `B1-1`…`S4-5`。`sw.js` 离线缓存页面+CDN，改 CDN 版本时**同步更新 sw.js 预缓存清单**和 `_headers` CSP。

## 状态/存储坑
- 单一 localStorage key `tt_all_users_v2`；按用户分桶 `{progress,cardLoop,mistakes,vocab,mastery,checkins,grammarFill,reading,cloze,seven,listening,mySentences,unitCert}`。
- **`useLocalStorage`(约 line 280) 必须用函数式更新 `setStoredValue(prev=>...)`**。历史 bug：闭包捕获旧值导致同一事件里后一个 setter 覆盖前一个。所有 `setXxxData` 都基于 `setAllUsersData(prev=>...)`，保持此模式。
- 数据只在本设备浏览器里：妈妈/管理员报告只能看同设备数据；换机/清缓存会丢，导出备份功能在抽屉里。

## UI 约定
- 手机端主导航是**底部 5 tab**（今日/单词/语法/阅读/错题）；其余功能走右上角抽屉（学一学：笔记/词块工坊/卡片/写作，练一练：单词/精听/语法填空/完形/七选五/阅读/重点练习，查漏补缺：错题/进度，navGroups）。桌面端为左侧栏+顶部横向 tab。
- 色彩语义（新功能配色遵守）：紫=单词/词块 · 靛=语法填空 · 青=完形 · 紫红=七选五 · 天蓝=阅读 · teal=精听 · 琥珀=今日复习/到期/退阶提示 · 玫红=错题/盯防词 · 橙=打卡火苗 · 粉=妈妈督学 · 靛蓝=管理员 · 绿=成功/攻克/通关。
- 视觉体系：body 极光渐变背景(fixed) · .card/.card-lg 内顶高光 · .page-enter 切页动画 · prefers-reduced-motion 已适配。改样式优先改 <style> 里的共享类。
- iOS 适配：viewport-fit=cover + 底部导航 env(safe-area-inset-bottom)；状态栏用 default（勿改回 black-translucent）。
- 切 tab/切单元自动回页顶；切单元保持当前页面（仅测验中跳回笔记）。

## 产品设计原则（多轮迭代沉淀，新功能遵守）
- 糖糖的真实特点：**任务导向，做题前不看笔记、做题后不看解析**。对策是改流程不是劝：把内容塞进做题必经之路（预热卡）、让不看解析立刻付出代价（答错当轮复现）、把阅读成本降到一行（一句话解析）。
- **不做硬门槛/锁功能**（讨论过并否决）：低分不锁下一模块，改用正向徽章（通关测）+ 温和提示（连错退阶卡可跳过）。挫败感管理优先于强制补弱。
- 反馈要具体不要空话：成长面板只和昨天的自己比；评价语说"你已经能 XX"而不是"再接再厉"。

## 内容创作准则
- 面向**中文母语**的高一学生：语气亲切、举例具体、给"怎么下手"的步骤。糖糖是真实用户。
- 大对象（`UNIT_DB`/`QUESTION_BANK`）是压缩成一行的内联数据：手改易错，**优先写一次性 Node 脚本做正则替换 + 跑上面的校验**。
- 字符串内有中英文混排与转义（如 `one\'s`），编辑时注意。

## Git 工作流
- 仓库 `sheephess9527/tangtang-english`；开发分支 `claude/adaptive-english-learning-75mtrw`。
- 本仓库节奏：提交推送到开发分支后，**经用户确认**再 `git checkout main && git merge --ff-only <dev> && git push origin main`（Cloudflare 从 main 自动部署），然后切回开发分支。用户说"合并推送"即执行。
- 提交信息用**中文**，说清"做了什么+为什么"。**未经明确要求不要建 PR。**
- 容器临时：想保留的产物必须 commit + push。
- 每轮功能改动后同步更新本文件（红线、桶结构、组件清单、设计原则）。

## 图标
- 用 Python+Pillow 生成（master 2048 超采样后缩放）。**文件名保持不变**（`apple-touch-icon.png`/`icon-192.png`/`icon-512.png`），避免改引用。
- 提醒用户：iOS 主屏图标缓存极强，需删除旧图标→重新"添加到主屏幕"才更新；页面更新后也要完全关掉重开才能刷过 SW 缓存。
