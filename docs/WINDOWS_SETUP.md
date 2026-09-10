# 镜域 JingYu Windows 本地运行新手指南

[简体中文](#简体中文) | [English](#english)

本指南适用于 Windows 10 或 11。无需编程经验；按顺序安装 Node.js 和 pnpm、下载项目、安装依赖，再启动本地开发服务器即可。

需要离线阅读时，可下载[原始中文 Word 版](%E9%95%9C%E5%9F%9F%20JingYu%20%E6%9C%AC%E5%9C%B0%E8%BF%90%E8%A1%8C%E6%95%99%E7%A8%8B.docx)。

## 简体中文

### 1. 安装 Node.js

打开 [Node.js 官网](https://nodejs.org/)，下载 **LTS** 版本的 Windows x64 Installer（`.msi`）。按安装程序的默认选项完成安装，并保持加入 `PATH` 的选项启用。

关闭之前打开的命令提示符或 Windows Terminal，重新打开 `cmd`，运行：

```powershell
node -v
npm -v
```

两条命令都显示版本号即表示安装成功。若提示找不到 `node`，先关闭所有终端并重新打开；仍无效时重新安装 Node.js 并确认 `PATH` 选项。

### 2. 安装 pnpm

在命令提示符中运行：

```powershell
npm install -g pnpm
pnpm -v
```

`pnpm -v` 显示版本号后即可继续。

### 3. 下载 JingYu

打开 [JingYu GitHub 仓库](https://github.com/Cridic-Franklin/JingYu-Storyboard)，选择 **Code → Download ZIP**，然后把压缩包解压到路径较短的文件夹，例如 `D:\JingYu-Storyboard`。

打开解压后的文件夹，确认其中有 `package.json`、`pnpm-lock.yaml`、`src` 和 `public`。看到 `package.json` 表示你位于正确的项目根目录。

### 4. 安装依赖并启动

在项目文件夹空白处右键，选择“在终端中打开”或 **Open in Terminal**。第一次运行时执行：

```powershell
pnpm install
pnpm dev --port 5173
```

安装依赖通常只需执行一次。启动后，请打开终端中 `Local:` 后面的实际地址。常见地址是 `http://127.0.0.1:5173`；如果 5173 已被占用，Vite 会显示其他端口，应以终端输出为准。

运行期间不要关闭终端。结束使用时回到终端并按 `Ctrl+C`；下次开机后重新运行 `pnpm dev --port 5173` 即可。

### 常见问题

- **找不到 `pnpm`：** 再次运行 `npm install -g pnpm`，然后关闭并重新打开终端。
- **启动时报告缺少依赖：** 先运行 `pnpm install`，完成后再启动。
- **浏览器无法访问 5173：** 查看终端的 `Local:` 地址，Vite 可能已使用 5174 或其他端口。
- **可以双击 `index.html` 吗？** 不建议。JingYu 是 Vite 应用，应通过开发服务器访问。
- **关机后地址失效：** 本地地址只在开发服务器运行时有效，这是正常现象。

---

## English

This guide is for Windows 10 or 11. No programming experience is required: install Node.js and pnpm, download the project, install its dependencies, then start the local development server.

For offline reading, the [original Chinese Word edition](%E9%95%9C%E5%9F%9F%20JingYu%20%E6%9C%AC%E5%9C%B0%E8%BF%90%E8%A1%8C%E6%95%99%E7%A8%8B.docx) is also available.

### 1. Install Node.js

Open the [Node.js website](https://nodejs.org/) and download the **LTS** Windows x64 Installer (`.msi`). Complete installation with the default options and keep the option that adds Node.js to `PATH` enabled.

Close any existing Command Prompt or Windows Terminal windows, open a fresh `cmd`, and run:

```powershell
node -v
npm -v
```

Installation succeeded when both commands print a version. If Windows cannot find `node`, close every terminal and open a new one. If that does not help, reinstall Node.js and confirm that its `PATH` option is enabled.

### 2. Install pnpm

Run these commands in Command Prompt:

```powershell
npm install -g pnpm
pnpm -v
```

Continue when `pnpm -v` prints a version.

### 3. Download JingYu

Open the [JingYu GitHub repository](https://github.com/Cridic-Franklin/JingYu-Storyboard), choose **Code → Download ZIP**, and extract the archive to a short path such as `D:\JingYu-Storyboard`.

Open the extracted folder and confirm that it contains `package.json`, `pnpm-lock.yaml`, `src` and `public`. The presence of `package.json` identifies the project root.

### 4. Install dependencies and start JingYu

Right-click an empty area in the project folder and choose **Open in Terminal**. On the first run, enter:

```powershell
pnpm install
pnpm dev --port 5173
```

Dependency installation is normally required only once. After startup, open the actual address shown after `Local:` in the terminal. The common address is `http://127.0.0.1:5173`; if port 5173 is occupied, Vite may report a different port, which is the address to use.

Keep the terminal open while using JingYu. To stop the server, return to the terminal and press `Ctrl+C`. After restarting Windows, run `pnpm dev --port 5173` again.

### Troubleshooting

- **`pnpm` is not recognized:** Run `npm install -g pnpm` again, then close and reopen the terminal.
- **Startup reports missing dependencies:** Run `pnpm install` before starting the server again.
- **The browser cannot reach port 5173:** Read the terminal's `Local:` address; Vite may be using 5174 or another port.
- **Can I double-click `index.html`?** This is not recommended. JingYu is a Vite application and should be opened through its development server.
- **The address stops working after shutdown:** The local address works only while the development server is running. This is expected.
