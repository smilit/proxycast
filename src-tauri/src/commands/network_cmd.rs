//! 网络相关命令
//!
//! 提供获取本地网络接口信息的功能

use serde::Serialize;
use std::net::UdpSocket;

/// 网络接口信息
#[derive(Debug, Clone, Serialize)]
pub struct NetworkInfo {
    /// 本地回环地址
    pub localhost: String,
    /// 内网 IP 地址（局域网）
    pub lan_ip: Option<String>,
}

/// 获取本地网络信息
///
/// 返回 localhost 和内网 IP 地址，用于客户端连接
#[tauri::command]
pub fn get_network_info() -> Result<NetworkInfo, String> {
    let lan_ip = get_local_ip();

    Ok(NetworkInfo {
        localhost: "127.0.0.1".to_string(),
        lan_ip,
    })
}

/// 获取本机内网 IP 地址
///
/// 通过创建 UDP socket 连接外部地址来获取本机的内网 IP
fn get_local_ip() -> Option<String> {
    // 创建一个 UDP socket 并连接到外部地址（不会真正发送数据）
    // 这样可以获取到本机用于出站连接的 IP 地址
    let socket = UdpSocket::bind("0.0.0.0:0").ok()?;
    socket.connect("8.8.8.8:80").ok()?;
    let local_addr = socket.local_addr().ok()?;
    Some(local_addr.ip().to_string())
}
