// content.js - 页面内通知显示
(function() {
  'use strict';

  // 创建页面内通知元素
  function createNotification(message, type = 'success') {
    // 检查是否已存在通知容器
    let container = document.getElementById('memos-notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'memos-notification-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      `;
      document.body.appendChild(container);
    }

    // 创建通知元素
    const notification = document.createElement('div');
    const bgColor = type === 'success' ? '#4CAF50' : '#f44336';
    const iconSvg = type === 'success' ? 
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>' :
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>';

    notification.style.cssText = `
      background: ${bgColor};
      color: white;
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 10px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      font-weight: 500;
      max-width: 300px;
      animation: slideIn 0.3s ease-out, fadeOut 0.3s ease-in 2.7s;
      opacity: 1;
    `;

    notification.innerHTML = `
      ${iconSvg}
      <span>${message}</span>
    `;

    // 添加动画样式
    if (!document.getElementById('memos-notification-styles')) {
      const style = document.createElement('style');
      style.id = 'memos-notification-styles';
      style.textContent = `
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
      `;
      document.head.appendChild(style);
    }

    container.appendChild(notification);

    // 3秒后自动移除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
      // 如果容器为空，也移除容器
      if (container.children.length === 0) {
        container.parentNode?.removeChild(container);
      }
    }, 3000);

    // 点击关闭
    notification.addEventListener('click', () => {
      if (notification.parentNode) {
        notification.style.animation = 'fadeOut 0.3s ease-in';
        setTimeout(() => {
          notification.parentNode?.removeChild(notification);
          if (container.children.length === 0) {
            container.parentNode?.removeChild(container);
          }
        }, 300);
      }
    });
  }

  // 监听来自background script的消息
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'SHOW_PAGE_NOTIFICATION') {
      createNotification(message.text, message.notificationType || 'success');
      sendResponse({ success: true });
    }
  });

})();