# CLAUDE.md

本文件是 Claude Code 每次会话自动加载的操作指南。完整背景见 `README.md`，本文件只列**必须遵守的规则与工作流**。

## 项目一句话
`糖糖提分通`：一位父亲为高一女儿"糖糖"（人教版 / 浙江高考卷 / 英语基础弱）做的**单文件 React PWA** 英语提分工具。整个应用就是一个 `index.html`（约 7400 行）。

## 🔒 绝对红线（最高优先级）
- **登录密码绝对不能改：`0825`→`tangtang`，`0315`→`mama`**（`index.html` `LoginScreen`，约 line 5317，判断在 5323–5326）。
- 开发者原话："**登录密码不用改，其他都改**。"
- 任何重构、优化、"安全加固"都不得修改这两个密码值或其对应用户。若需求看似要求改密码，**先停下来问用户**。

## 架构约束（不要破坏）
- **单文件、零构建**：无后端、无打包、无 `node_modules`。所有应用代码在 `<script type="text/babel">`（约 line 211）里，浏览器用 **Babel Standalone** 实时编译 JSX。
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

## 关键数据/组件位置（行号约值，改前用 grep 复核）
- `UNIT_DB`(282) 单元学习内容 · `UNIVERSAL_TIPS`(331) 通用诀窍 · `WRITING_DB`(353) 写作宝典(应用文8类+续写素材) · `GRAMMAR_FILL_DB`(536) 语法填空35篇仿真(每篇10空,ans数组多答案容错,noChange标记零变化陷阱) · `READING_DB`(963) 阅读理解(35单元×4题,答案均衡) · `CLOZE_DB`(2891) 完形填空(35篇×15空×4选项,答案均衡131:131:131:132,rat不引字母便于重排) · `SEVEN_DB`(~8360) 七选五(35篇×5空+7选项,ans=选项下标,rats讲钩子) · `EXAM_TIPS_DB`(2891) 每单元专属诀窍 · `QUESTION_BANK`(3916) 700题库 · `SRS_INTERVALS`(5452)
- 组件：`LoginScreen`(5317) · `FlashcardCarousel`(5364) · `VocabDrill`(5466，默认智能模式按记忆阶梯 VOCAB_LADDER 自动配题型：盒1看词选义→盒2看义选词→盒3例句填空→盒4拼写→盒5听写；可手动切模式；跨单元今日复习 globalItems) · `GrammarFill` · `ReadingView` · `ClozeView`(完形,选词实时填入原文) · `SevenView`(七选五,空格+字母双向联动) · `WritingView`(5875) · `App`(5979)
- 进度页(mastery)内含：弱点诊断(综合错题/语法填空/正确率算薄弱指数,Top3+跳转) 和 妈妈督学报告(currentUser==='mama' 时读 allUsersData['tangtang'] 展示学情)。
- 35 单元 = 7 册×5：key 形如 `B1-1`…`S4-5`。
- `sw.js`：Service Worker，离线缓存页面+CDN。改 CDN 版本时**同步更新 sw.js 的预缓存清单**和 `_headers` CSP。
- 登录默认落地 `today`(今日任务)页：任务完成状态由 `checkins[今天]` 的分类计数驱动（quiz/cards/vocab/grammarFill/mistakes，由各 setter 的 `stampCheckin(c, kind)` 自动累加）。
- 错题 SRS：错题带 `srsBox/srsDue/cleared`；做错 3 天后到期，答对进 7 天档，连对两次 `cleared:true` 归档"已攻克"。错题练习经 `mistakeId` 关联回写。

## 状态/存储坑
- 单一 localStorage key `tt_all_users_v2`；按用户分桶 `{progress,cardLoop,mistakes,vocab,mastery}`。
- **`useLocalStorage`(约 line 245) 必须用函数式更新 `setStoredValue(prev=>...)`**。历史 bug：闭包捕获旧值导致同一事件里后一个 setter 覆盖前一个。所有 `setXxxData` 都基于 `setAllUsersData(prev=>...)`，保持此模式。

## UI 约定
- 手机端主导航是**底部 5 tab**（今日/单词/语法/阅读/错题，App 根部 fixed nav；完形/七选五走抽屉或桌面横向tab）；其余功能走右上角抽屉（按 学一学/练一练/查漏补缺 分组，navGroups）。桌面端为左侧栏+顶部横向 tab。
- 色彩语义（新功能配色遵守）：紫=单词 · 靛=语法填空 · 青=完形 · 紫红=七选五 · 天蓝=阅读 · 琥珀=今日复习/到期 · 玫红=错题 · 橙=打卡火苗 · 粉=妈妈督学 · 绿=成功/攻克。
- iOS 适配：viewport-fit=cover + 底部导航 env(safe-area-inset-bottom)；状态栏用 default（勿改回 black-translucent，浅色背景下白字看不清）。
- 切 tab/切单元自动回页顶（App 里的 useEffect）；切单元保持当前页面（仅测验中跳回笔记）。

## 内容创作准则
- 面向**中文母语**的高一学生：语气亲切、举例具体、给"怎么下手"的步骤，而非堆砌语法术语。糖糖是真实用户。
- 大对象（`UNIT_DB`/`QUESTION_BANK`）是压缩成一行的内联数据：手改易错，**优先写一次性 Node 脚本做正则替换 + 跑上面的校验**。
- 字符串内有中英文混排与转义（如 `one\'s`），编辑时注意。

## Git 工作流
- 仓库 `sheephess9527/tangtang-english`；开发分支 `claude/website-security-logic-review-mqtmx6`。
- 惯例：提交到 `main` 后用 `git branch -f <dev> main` + `git push --force-with-lease` 同步开发分支。
- 提交信息用**中文**，说清"做了什么+为什么"。**未经明确要求不要建 PR。**
- 容器临时：想保留的产物必须 commit + push。

## 图标
- 用 Python+Pillow 生成（master 2048 超采样后缩放）。**文件名保持不变**（`apple-touch-icon.png`/`icon-192.png`/`icon-512.png`），避免改引用。
- 提醒用户：iOS 主屏图标缓存极强，需删除旧图标→重新"添加到主屏幕"才更新。
