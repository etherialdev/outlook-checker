<div id="header" align="center">
  <img src="https://i.ibb.co/dJ1rh03/microsoft-logo.png" width="100"/> 
</div>

<div id="title" align="center">

  # Outlook Account Checker 
</div>

<div id="title" align="center"> 
  

![showcase](https://github.com/user-attachments/assets/d68cbed8-112d-48fc-b766-9256468a9595)

 
<div align="center">
  <br>
  <a href="https://discord.gg/sm38JmvVey">
    <img src="https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&logo=discord&logoColor=white">
  </a>
  <a href="https://t.me/etherialdev">
    <img src="https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white">
  </a>
  <br>
  <a href="https://t.me/etherialhub">
    <img src="https://img.shields.io/badge/Channel-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white">
  </a>
</div>



</div> 
 
## 🔥 **Features:**  
- **Request-based processing** 
- Supports up to **500 threads** for high-speed operations
- **Efficient** proxy usage, supporting HTTP, SOCKS4, and SOCKS5 proxies
- **Accurate detection** of locked, 2FA-protected, invalid, and valid accounts (**99.9% detection rate**)

## 📑 File Structure

```
📁 input/
├── 📄 combolist.txt  # Microsoft Outlook accounts, email:password format
└── 📄 proxies.txt  # Proxies, username:password@hostname:port or ip:port format

📁 output/
├── 📄 valid.txt  # Valid outlook accounts
├── 📄 hits.txt  # Inbox filtered accounts (Paid version)
├── 📄 locked.txt  # Accounts, that are locked (recovery and other scenarios)
├── 📄 phone_locked.txt  # Phone locked accounts
├── 📄 2fa.txt # 2fa protected accounts
├── 📄 invalid.txt  # Invalid accounts
└── 📄 failed_check.txt  # Failed to check these accounts
```
## ⚙️ Configuration
```js
module.exports = {
    threads: 100, // Thread count
    retry_limit: 1, // Number of retries if check fails
    proxy_type: "HTTP", // Proxy type: HTTP | SOCKS4 | SOCKS5
    inbox_filter: ["example.com", "", ""] // Domain input, for the inbox filter
};

```

## 💻 Usage (Source Code) 
  - **Install nodejs: [[click]](https://nodejs.org/en/download/prebuilt-installer)**
  - **Install all dependencies: <code>npm install</code>**
  - **Put your proxies in <code>input/proxies.txt</code> | <code>username:password@hostname:port or ip:port format</code>**
  - **Put your accounts in <code>input/combolist.txt</code> | <code>email:password</code>**
  - **Start the program with: <code>node index.js</code>**

## ❗ Legal & Contact:
  
  - **For support contact: [Telegram](https://t.me/etherialdev)** 

  - **This tool is for educational purposes only. By using it, you acknowledge that I am not liable for any consequences resulting from its use.**

