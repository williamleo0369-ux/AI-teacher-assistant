# 智卷通 - AI 教师助手

“智卷通”是一款面向教师的 AI 助教工具，旨在将教师从繁重、重复的试卷批改和学情分析工作中解放出来，让他们能更专注于教学本身。

项目采用双引擎驱动架构，结合了 **Gemini 1.5 Flash** 的多模态视觉识别能力和 **DeepSeek** 的强大逻辑推理与文本生成能力，实现从试卷图片到深度诊断报告的全流程自动化。

## ✨核心功能

*   **多图智能归类**：一次性上传多名学生、多页试卷的图片，AI 能自动识别学生姓名，并将同一位学生的试卷（无论正反面、续页）精准地归类到同一个“学生卷宗”中。
*   **高精度 OCR 识别**：基于 Gemini 的视觉能力，精准提取试卷中的印刷题干和学生手写答案。
*   **AI 智能批改与诊断**：结合标准答案，DeepSeek 引擎会对学生的解答进行分步式、多维度的智能批改，不仅给出分数，更能深入分析错误类型（如概念混淆、计算失误、审题不清等）。
*   **学情“CT”扫描**：从班级、个人两个维度，生成可视化的学情诊断报告，精准定位“掉分拐点”和集体知识短板，让教学决策有据可依。
*   **个性化提分计划**：为每位学生生成一份为期 14 天的、可执行的“个性化提分计划”，并提供给家长和学生的每日执行清单。

## 🚀 技术栈

*   **前端**: `React` + `TypeScript` + `Vite` + `Tailwind CSS`
*   **后端**: `Python` + `Flask`
*   **AI 核心**:
    *   视觉识别 (OCR & 归类): `Google Gemini 1.5 Flash`
    *   逻辑诊断 & 报告生成: `DeepSeek`
*   **开发环境**: `pnpm` + `concurrently` (一键启动前后端)

## 🛠️ 如何启动

1.  **克隆仓库**

    ```bash
    git clone https://github.com/williamleo0369-ux/AI-teacher-assistant.git
    cd AI-teacher-assistant
    ```

2.  **配置环境变量**

    在项目根目录创建一个 `.env` 文件，并填入您的 AI 模型 API Key：

    ```env
    VITE_GEMINI_API_KEY=您的_GEMINI_API_KEY
    VITE_DEEPSEEK_API_KEY=您的_DEEPSEEK_API_KEY
    ```

3.  **安装依赖**

    *   **前端**: `pnpm install`
    *   **后端**: 需要本地安装 `Python 3.11`。然后执行以下命令创建并激活虚拟环境，安装依赖：

        ```bash
        python3.11 -m venv venv
        source venv/bin/activate
        pip install -r backend/requirements.txt
        ```

4.  **一键启动**

    所有依赖安装完成后，只需运行一个命令即可同时启动前端和后端服务：

    ```bash
    pnpm dev
    ```

    *   前端将运行在 `http://localhost:5173`
    *   后端将运行在 `http://localhost:5001`

## 🌐 一键部署到 Vercel

本项目已针对 [Vercel](https://vercel.com/) 平台进行了优化，您可以通过以下步骤一键部署，获得一个公开的在线版本：

1.  **Fork & Clone**: 首先，将此 GitHub 仓库 Fork 到您自己的账户下。
2.  **注册 Vercel**: 使用您的 GitHub 账户免费注册 Vercel。
3.  **导入项目**: 在 Vercel 的仪表盘上，点击 “Add New..." -> "Project”，然后选择您刚刚 Fork 的仓库并导入。
4.  **配置环境变量**: 在项目设置的 “Environment Variables” 部分，添加您在 `.env` 文件中使用的 `VITE_GEMINI_API_KEY` 和 `VITE_DEEPSEEK_API_KEY`。
5.  **部署!**: 点击 “Deploy” 按钮。Vercel 将自动完成所有构建、部署和托管工作。几分钟后，您将拥有一个可公开分享的网址！
