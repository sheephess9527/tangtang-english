# CLAUDE.md

本文件是 Claude Code 每次会话自动加载的操作指南。完整背景见 `README.md`，本文件只列**必须遵守的规则与工作流**。

## 项目一句话
`糖糖提分通`：一位父亲为高一女儿"糖糖"（人教版 / 浙江高考卷 / 英语基础弱）做的**单文件 React PWA** 英语提分工具。整个应用就是一个 `index.html`（约 4000 行）。

## 🔒 绝对红线（最高优先级）
- **登录密码绝对不能改：`0825`→`tangtang`，`0315`→`mama`**（`index.html` `LoginScreen`，约 line 2771，判断在 2777–2780）。
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
const s=c.indexOf('<script type=\"text/babel\">');const e=c.lastIndexOf('</script>');
const jsx=c.substring(s+'<script type=\"text/babel\">'.length,e);
try{babel.transform(jsx,{presets:['react'],filename:'app.jsx'});console.log('✅ Babel OK');}
catch(err){console.error('❌',err.message,err.loc||'');}
"
```

## 关键数据/组件位置（行号约值，改前用 grep 复核）
- `UNIT_DB`(277) 单元学习内容 · `UNIVERSAL_TIPS`(326) 通用诀窍 · `EXAM_TIPS_DB`(345) 每单元专属诀窍 · `QUESTION_BANK`(1370) 700题库 · `SRS_INTERVALS`(2906)
- 组件：`LoginScreen`(2771) · `FlashcardCarousel`(2818) · `VocabDrill`(2910) · `App`(3035)
- 35 单元 = 7 册×5：key 形如 `B1-1`…`S4-5`。

## 状态/存储坑
- 单一 localStorage key `tt_all_users_v2`；按用户分桶 `{progress,cardLoop,mistakes,vocab,mastery}`。
- **`useLocalStorage`(约 line 245) 必须用函数式更新 `setStoredValue(prev=>...)`**。历史 bug：闭包捕获旧值导致同一事件里后一个 setter 覆盖前一个。所有 `setXxxData` 都基于 `setAllUsersData(prev=>...)`，保持此模式。

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
